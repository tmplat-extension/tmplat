// Uploads the packaged extension to the Microsoft Edge Add-ons draft submission.
//
// This deliberately stops at the draft, exactly like the Chrome Web Store step does with `publish: false`. The API's
// fourth endpoint (POST /products/$productID/submissions) is what submits the draft for certification, and it is
// intentionally *not* called from here: the listing, the screenshots and the package should be checked by hand in
// Partner Center first. Submitting is a click in the dashboard.
//
// Uploading replaces the package on the existing draft submission. It does not publish anything, and it cannot
// affect the version currently in the store.
//
// Usage:
//   node scripts/upload-edge-add-ons.mjs [zipFile]
//
// Defaults to "dist/tmplat.zip". Reads EDGE_PRODUCT_ID, EDGE_CLIENT_ID and EDGE_API_KEY from the environment.

import { readFile, stat } from 'node:fs/promises';

const apiUrl = 'https://api.addons.microsoftedge.microsoft.com/v1';

// v1.1 of the API authenticates with an API key rather than a bearer token, and is strict about the scheme name
const authorizationScheme = 'ApiKey';

const defaultZipFile = 'dist/tmplat.zip';

// The upload is processed asynchronously, so the operation is polled until it settles. Packages of this size settle
// in well under a minute; the ceiling is only here so a stuck operation fails the job rather than hanging it.
const pollIntervalMs = 5000;
const pollTimeoutMs = 10 * 60 * 1000;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function authHeaders({ clientId, apiKey }) {
  return { Authorization: `${authorizationScheme} ${apiKey}`, 'X-ClientID': clientId };
}

// Also worth knowing: the API validates the *shape* of the headers before authenticating, so a malformed client ID
// comes back as a 400 complaining about the GUID rather than as an auth failure.
async function describeFailure(response) {
  const body = await response.text().catch(() => '');

  // A bad or expired API key and a product owned by another account both answer 403, so both are named here
  if (response.status === 401 || response.status === 403) {
    return (
      `the request was refused (HTTP ${response.status}). Most likely EDGE_API_KEY is wrong or has expired - ` +
      'create a new one in Partner Center under Microsoft Edge > Publish API and update EDGE_API_KEY. Failing ' +
      'that, check EDGE_PRODUCT_ID is correct and owned by the same account'
    );
  }

  return `HTTP ${response.status}: ${body || '<empty body>'}`;
}

async function uploadPackage({ productId, clientId, apiKey, zipFile }) {
  const zip = await readFile(zipFile);
  const response = await fetch(`${apiUrl}/products/${productId}/submissions/draft/package`, {
    method: 'POST',
    headers: { ...authHeaders({ clientId, apiKey }), 'Content-Type': 'application/zip' },
    body: zip,
  });

  if (response.status !== 202) {
    throw new Error(`Could not upload the package to Microsoft Edge Add-ons - ${await describeFailure(response)}.`);
  }

  // The operation ID comes back in the `Location` header, as a bare ID rather than a URL
  const operationId = response.headers.get('location');
  if (!operationId) {
    throw new Error('Microsoft Edge Add-ons accepted the upload but returned no operation ID in the Location header.');
  }

  return operationId;
}

async function awaitOperation({ productId, clientId, apiKey, operationId }) {
  const deadline = Date.now() + pollTimeoutMs;

  // Each request depends on the previous one having settled, and the whole point is to wait between them, so the
  // sequential awaits below are deliberate - there is nothing here to run in parallel.
  /* eslint-disable no-await-in-loop */
  while (Date.now() < deadline) {
    const response = await fetch(
      `${apiUrl}/products/${productId}/submissions/draft/package/operations/${operationId}`,
      { headers: authHeaders({ clientId, apiKey }) },
    );

    if (!response.ok) {
      throw new Error(
        `Could not read the status of upload operation '${operationId}' - ${await describeFailure(response)}.`,
      );
    }

    const body = await response.json().catch(() => ({}));

    if (body.status === 'Succeeded') {
      return body;
    }
    if (body.status === 'Failed') {
      const errors = Array.isArray(body.errors) && body.errors.length ? ` ${JSON.stringify(body.errors)}` : '';

      throw new Error(
        `Microsoft Edge Add-ons rejected the package (${body.errorCode || 'no error code'}): ` +
          `${body.message || 'no message'}.${errors}`,
      );
    }

    console.log(`Upload operation '${operationId}' is ${body.status ?? 'in an unknown state'} - waiting...`);

    await delay(pollIntervalMs);
  }
  /* eslint-enable no-await-in-loop */

  throw new Error(
    `Timed out after ${pollTimeoutMs / 1000}s waiting for upload operation '${operationId}' to complete. The upload ` +
      'may still finish - check the draft in Partner Center before retrying.',
  );
}

async function main() {
  const zipFile = process.argv[2] ?? defaultZipFile;

  const productId = requireEnv('EDGE_PRODUCT_ID');
  const clientId = requireEnv('EDGE_CLIENT_ID');
  const apiKey = requireEnv('EDGE_API_KEY');

  const { size } = await stat(zipFile).catch(() => {
    throw new Error(`Package not found: '${zipFile}'. Run 'pnpm build' first.`);
  });

  console.log(`Uploading '${zipFile}' (${Math.round(size / 1024)} kB) to Edge Add-ons product '${productId}'...`);

  const operationId = await uploadPackage({ productId, clientId, apiKey, zipFile });
  const operation = await awaitOperation({ productId, clientId, apiKey, operationId });

  console.log(
    `Package uploaded to the Edge Add-ons draft: ${operation.message || 'no message'}. It has NOT been submitted ` +
      'for certification - do that by hand in Partner Center.',
  );
}

try {
  await main();
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);

  console.error(process.env.GITHUB_ACTIONS ? `::error::${message}` : message);
  process.exitCode = 1;
}
