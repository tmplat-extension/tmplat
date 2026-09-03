# Bug: bare Operation entries render their JavaScript source into the user's output

Status: **open, not started — but fully diagnosed, and the fix below has been prototyped and verified end to end.**
Found 2026-09-10 while fixing the `cookies`/`hashSearchParams` object-collection bug (see §8). All findings below were
verified by execution against the real template engine, not by reading alone.

_Last verified: 2026-09-10._

> **This is not only a cosmetic failure on a malformed template.** `dateTime`, `lastModified` and `shorten` each
> declare a `Standard` category — bare usage is _documented_ — and all three are broken by this bug today. See §4.1.

---

## 1. Summary

Every "Operation" template context entry (43 of them) is exposed to templates as a **function**. Operations are
designed to be used as a Mustache _section_, where the section body is the operand:

```
{#camelCase}some text{/camelCase}   ->  "someText"      correct
```

If a user instead references one **bare**, as a plain name tag, the engine stringifies the function and pastes its
**JavaScript source code** into the rendered output — and therefore into the user's clipboard:

```
{camelCase}     ->  "async (text, render) => mapper(await manager.render(text, render), manager)"
{upperCase}     ->  "async (text, render) => mapper(await manager.render(text, render), manager)"
{encodeBase64}  ->  "async (text, render) => mapper(await manager.renderTrim(text, render), manager)"
{searchParam}   ->  "async (text, render) => mapper(await manager.renderTrim(text, render), manager)"
{dateTime}      ->  "async (text, render) => mapper(await manager.renderTrim(text, render), manager)"
```

Severity: **moderate** (raised from the original "low-to-moderate" once §4.1 was found). Most bare references are user
error, but three entries document bare usage, worked that way in 1.x, and now paste engine internals instead. It does
not corrupt stored data and leaks nothing the extension bundle doesn't already contain, so it is a
correctness/quality issue rather than a security one.

## 2. How to reproduce

Add a unit test anywhere under `src/lib/template/` (test discovery globs are in `vitest.config.mts`):

```ts
import { describe, expect, it } from 'vitest';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';

describe('bare operation entry', () => {
  it('leaks renderer source', async () => {
    const { render } = createTestTemplateContextManager({ url: 'https://example.com/p?foo=bar' });

    // Currently passes, and should not.
    expect(await render('{camelCase}')).toContain('=>');
  });
});
```

This exact snippet was run and passes as of the date above.

`createTestTemplateContextManager` (`src/lib/test/template-context-manager.factory.ts`) builds a **real**
`TemplateContextManager` over fakes and renders through the real engine, so this reproduces the production path.

## 3. Root cause

The engine is `tmplat-mustache` 2.5.0 — a **fork of mustache.js**, maintained in a separate repository
(`tmplat-extension/tmplat-mustache`), consumed here as an npm dependency. Source is readable at
`node_modules/tmplat-mustache/tmplat-mustache.js`.

Three pieces combine:

1. **Entry shape.** An Operation entry's `render` returns a nested function. For example
   `createContentRenderer` (`src/lib/template/context/template-context.utils.ts:105-115`):

   ```ts
   (manager) => () => async (text, render) => mapper(await manager.render(text, render), manager);
   ```

   So the value placed in the context object is `() => <section lambda>`.

2. **Lookup invokes zero-arg functions — once.** `Context.lookup`
   (`node_modules/tmplat-mustache/tmplat-mustache.js:440-441`):

   ```js
   if (isFunction(value)) value = await value.call(this.view);
   ```

   This unwraps the outer `() =>` and yields the inner `async (text, render) => ...` **section lambda**.

3. **Name tokens stringify whatever they get.** `{name}` routes to `unescapedValue` -> `decoratedValue(value, String)`
   (`tmplat-mustache.js:599-601`); `{{name}}`/`{&name}` routes to `escapedValue` -> `decoratedValue(value, escape)`
   (`:603-605`). In `decoratedValue` (`:574-597`) the value is not an array, and `isObject` is
   `objectToString.call(object) === '[object Object]'` (`:29-31`), which is **false for functions**. So it falls
   through to `decorator(value)` — i.e. `String(fn)` — producing the function's source text.

For comparison, `renderSection` (`:523-555`) handles functions correctly, calling them with the section body and a
sub-renderer, which is why `{#camelCase}...{/camelCase}` works.

The decisive detail is that the entry shape is **two levels deep** (`() => (text, render) => ...`) while the engine
only unwraps **one** level. §5 shows that 1.x used the same two-level shape and that its engine unwrapped both.

## 4. Scope

- **43 Operation entries** (files under `src/lib/template/context/entry/` declaring
  `[TemplateContextCategory.Operation]`).
- **40** are built via the shared factories in `src/lib/template/context/template-context.utils.ts`
  (`createContentRenderer`, `createTrimmedContentRenderer`, `createNumericContentRenderer`, ...). Every one of those
  factories funnels through `TemplateContextManager.render`/`renderTrim`, which is what makes the fix in §6.2 a
  single edit.
- **3 hand-roll the renderer:**
  - `src/lib/template/context/entry/trim-start.ts` — verified: `{trimStart}` renders
    `"(text, render) => manager.renderTrimStart(text, render)"`
  - `src/lib/template/context/entry/trim-end.ts` — same shape
  - `src/lib/template/context/entry/pop-url.ts` — **does not leak**; see the exception below.

Both `{camelCase}` (unescaped) and `{{camelCase}}` (escaped) are affected; the escaped form merely HTML-escapes the
same source text (verified: `"async (text, render) &#x3D;&gt; mapper(await manager.render("`).

### 4.1 Three entries document bare usage and are broken by this

These declare **both** `Operation` _and_ `Standard` categories, so the guide advertises the bare form. Each mapper
already contains the `content ? ... : <default>` fallback intended to serve it — the engine simply never delivers a
bare call, so the fallback is unreachable dead code today.

| Entry          | File                                              | Documented bare behaviour        | Actual today |
| -------------- | ------------------------------------------------- | -------------------------------- | ------------ |
| `dateTime`     | `src/lib/template/context/entry/date-time.ts`     | current date/time, ISO 8601      | source leak  |
| `lastModified` | `src/lib/template/context/entry/last-modified.ts` | page's last-modified date/time   | source leak  |
| `shorten`      | `src/lib/template/context/entry/shorten.ts`       | shortened URL of the current tab | source leak  |

Verified by rendering `{dateTime}`, `{lastModified}` and `{shorten}` through `createTestTemplateContextManager` — all
three return `"async (text, render) => mapper(await manager.renderTrim(text, render), ..."`.

All three worked bare in 1.x (§5), so these are **migration regressions**, not merely undefined behaviour. A user
carrying a 1.x template containing a bare `{shorten}` gets engine source in their clipboard. The predefined templates
are unaffected — 1.x shipped the section form, `{#shorten}{url}{/shorten}`
(`8f3c5e3:src/lib/background.coffee:24`).

This also means **`''` is the wrong output** for a bare Operation: it would silently and permanently drop three
documented behaviours. See §7 Option B.

### 4.2 Important exception: `popUrl` is _meant_ to be used bare

`pop-url.ts` is an Operation with `inputDataType: null` / `outputDataType: null` — a pure side effect that pops the
URL stack. Its inner function performs the effect and returns `''`, so lookup yields a string, not a lambda, and
`{popUrl}` renders `""` correctly. **`{popUrl}` is the intended usage.**

Any registry-wide guard must therefore key off _what the entry resolves to_ (a function) rather than its category, or
it will raise a false positive on `popUrl`. `pushUrl` is the counterpart and is a normal section operation
(`{#pushUrl}https://...{/pushUrl}`), returning `''` after the effect.

## 5. This did not happen in 1.x — the legacy implementation defended against it twice

The legacy CoffeeScript sources were deleted in `17e08b9` ("wip: v2.0.0"); read them at the commit before it, e.g.
`git show 8f3c5e3:src/vendor/mustache.js`. Everything below was verified by executing that exact vendored file.

**Defence 1 — the engine re-invoked the nested function.** The vendored engine is mustache.js 0.7.2, already
single-brace (`exports.tags = ["{", "}"]`, `:22`). `Context.prototype.lookup` (`:148`, invoke at `:183`) unwrapped
the outer function exactly as the fork does — and then `Writer.prototype._name` (`:294`) unwrapped the inner one:

```js
Writer.prototype._name = function (name, context) {
  var value = context.lookup(name);

  if (typeof value === "function") {          // <- this branch has no equivalent in the fork
    value = value.call(context.view);
  } else if (isArray(value)) {
    ...
  }

  return (value == null) ? "" : String(value);
};
```

So a bare reference **called** the section lambda with no arguments instead of stringifying it. The fork's
`decoratedValue` dropped that branch, which is the actual regression.

**Defence 2 — the entry helper handled the zero-argument call.** `8f3c5e3:src/lib/background.coffee:651-655`:

```coffee
# Avoid repetitive calls to render the text contents of a Mustache section by passed `callback` the
# pre-rendered text and safely handling bad returns.
rendered = (callback) ->
  -> (text, render) ->
    result = if arguments.length then callback(render text) else do callback
    result ? ''
```

`if arguments.length ... else do callback` is precisely the bare-reference case, and `result ? ''` normalises a
`null`/`undefined` return to an empty string. Note the shape `-> (text, render) ->` is **identical** to today's
`createContentRenderer`; the two-level shape was never the problem.

Verified by running the vendored engine against that exact helper shape:

| legacy template                      | output                                                 |
| ------------------------------------ | ------------------------------------------------------ |
| `{uppercase}`                        | `""`                                                   |
| `{&uppercase}`                       | `""`                                                   |
| `{#uppercase}hi {name}{/uppercase}`  | `"HI BOB"`                                             |
| an unguarded lambda, referenced bare | throws `render is not a function` — never leaks source |

The legacy semantics for a bare Operation were therefore **"run the operation with no input"**, not "render nothing":
`datetime: rendered (text) -> new Date().format if text then text` produced the current date, and
`getCallback 'shorten'` substituted the current URL (`background.coffee:438`,
`text = @url if tag is 'shorten' and not text`). That is exactly the behaviour §4.1's three entries still expect.

## 6. The fix

Restore the 0.7.2 semantics: **never stringify a function; invoke it with no arguments and render the result.** Two
coordinated changes are needed — the fork must stop stringifying, and this repo must tolerate a no-argument call.

Both were prototyped together and verified: the full unit suite (86 files, 1224 tests) and `pnpm type:check`
both pass, and the observed rendering becomes:

| template                              | before                                     | after                             |
| ------------------------------------- | ------------------------------------------ | --------------------------------- |
| `{camelCase}`                         | `async (text, render) => mapper(await ...` | `""`                              |
| `{{camelCase}}`                       | escaped source                             | `""`                              |
| `{trimStart}`                         | `(text, render) => manager.renderTrim...`  | `""`                              |
| `{encodeBase64}`                      | source                                     | `""`                              |
| `{dateTime}`                          | source                                     | `"2026-09-10T13:38:39.843+01:00"` |
| `{lastModified}`                      | source                                     | `"2024-01-01T00:00:00.000+00:00"` |
| `{shorten}`                           | source                                     | `"https://x.gd/1"`                |
| `{popUrl}`                            | `""`                                       | `""` (unchanged)                  |
| `{#camelCase}hello world{/camelCase}` | `"helloWorld"`                             | `"helloWorld"` (unchanged)        |
| `{#trimStart}  x  {/trimStart}`       | `"x  "`                                    | `"x  "` (unchanged)               |
| `{title}`                             | `"Example Page"`                           | `"Example Page"` (unchanged)      |

### 6.1 Change 1 — `tmplat-extension/tmplat-mustache` (must ship first)

In `tmplat-mustache.js`, replace the two name-token entry points (`:599-605`) so that they resolve through a new
helper instead of calling `context.lookup` directly. `decoratedValue` itself is left alone — it has no access to the
context, and keeping the invocation in the caller mirrors where 0.7.2 did it.

```js
/**
 * Resolves the value of a name token, invoking a function instead of stringifying it.
 *
 * `Context.lookup` has already invoked a function found on the view, so this unwraps a *nested* function - that is,
 * a section lambda that has been referenced as a plain name tag. Without it, `decoratedValue` falls through to
 * `String(value)` and renders the function's own source code into the output. This restores the behaviour of
 * `Writer.prototype._name` in mustache.js 0.7.2.
 */
Writer.prototype.resolveValue = async function resolveValue(token, context) {
  var value = await context.lookup(token[1]);

  if (isFunction(value)) value = await value.call(context.view);

  // Belt and braces: a function must never reach `decoratedValue`.
  return isFunction(value) ? undefined : value;
};

Writer.prototype.unescapedValue = async function unescapedValue(token, context) {
  return this.decoratedValue(await this.resolveValue(token, context), String);
};

Writer.prototype.escapedValue = async function escapedValue(token, context) {
  return this.decoratedValue(await this.resolveValue(token, context), tmplatMustache.escape);
};
```

Notes for that repository:

- The lambda is invoked with `context.view` as `this` and **no arguments**, matching 0.7.2. Consumers are expected to
  treat a missing `text` as "no operand" (see §6.2).
- Only one extra level is unwrapped, deliberately — a `while` loop would risk spinning on a self-returning function.
  The trailing `isFunction(value) ? undefined : value` guard means anything deeper renders nothing rather than
  leaking source, so the failure mode is safe either way. `decoratedValue` already returns early on `null`/
  `undefined` (`:575`), and `renderTokens` skips an `undefined` value (`:516-517`).
- Sections are untouched: `renderSection` (`:523-555`) still looks up and calls the lambda with the body.
  `renderInverted` (`:557-563`) is untouched too, so `{^name}` keeps its current (truthy-function) behaviour.
- Add regression tests covering a nested function referenced as `{name}` and as `{{name}}`, and asserting the section
  form still receives its body — plus one asserting the output never contains `=>`.
- This is a behaviour change to a published package: bump the minor version (2.6.0), note it in `CHANGES.md`, run
  `pnpm build` to regenerate `tmplat-mustache.min.js`, and check `index.d.ts` if `resolveValue` should be public
  (it need not be — it is an internal `Writer` method).

### 6.2 Change 2 — this repository (after the fork release)

Bump the `tmplat-mustache` dependency in `package.json`, then make the nested renderers tolerate a no-argument call —
the modern equivalent of legacy's `if arguments.length` guard. Because all 40 factory-built Operations and the two
hand-rolled `trim-start`/`trim-end` entries funnel through `TemplateContextManager.render*`, this is a single edit:

```ts
// src/lib/template/context/template-context-manager.ts
async render(text?: string, render?: (template: string) => Promise<string>): Promise<string> {
  return text && render ? await render(text) : '';
}

async renderTrim(text?: string, render?: (template: string) => Promise<string>): Promise<string> {
  return (await this.render(text, render)).trim();
}

async renderTrimStart(text?: string, render?: (template: string) => Promise<string>): Promise<string> {
  return (await this.render(text, render)).trimStart();
}

async renderTrimEnd(text?: string, render?: (template: string) => Promise<string>): Promise<string> {
  return (await this.render(text, render)).trimEnd();
}
```

and make the engine-facing signature honest about it:

```ts
// src/lib/template/context/template-context.model.ts
export type TemplateContextEntryNestedRenderer = (
  text?: string,
  render?: (template: string) => Promise<string>,
) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>;
```

Every mapper then receives `''` rather than `undefined` for a bare reference, which is why the existing
`content ? ... : <default>` fallbacks in `date-time.ts`, `last-modified.ts` and `shorten.ts` start working, and why
`camelCase('')`, `upperCase('')` etc. render `''`. No entry file needs to change.

Note `TemplateEngine.compile` (`src/lib/template/template-engine.ts:68-76`) throws `TEE400000` when the **whole**
rendered output is empty, so a template consisting solely of `{camelCase}` will fail with a user-facing error rather
than copying nothing. That is intended.

### 6.3 Tests to add here

1. A registry-wide guard, in or alongside `src/lib/template/context/entry/index.test.ts`: render `{name}` and
   `{{name}}` for **every** definition through `createTestTemplateContextManager` and assert no output contains `=>`
   or `[object Object]`. This is the assertion that stops the whole class regressing, and it generalises the one in
   `object-collection.test.ts` (§8). Key off the rendered output, not the category, so `popUrl` stays green (§4.2).
2. Explicit expectations for the three restored behaviours: `{dateTime}` is an ISO timestamp, `{shorten}` is the
   short URL of the current tab, `{lastModified}` is the tab's last-modified date.
3. `TemplateContextManager.render*` called with no arguments resolves to `''`
   (`template-context-manager.test.ts`).
4. Section forms keep working — already covered by `string-operation.test.ts` and friends; just re-run them.

### 6.4 Ordering

The two changes are independent but only useful together. §6.2 alone is harmless yet fixes nothing (the engine still
never performs a bare call); §6.1 alone would call the lambdas with `text === undefined`, and
`manager.render(undefined, undefined)` currently returns `undefined`, which several mappers would then throw on. Ship
the fork first, then bump and land §6.2 + §6.3 in one change.

## 7. Options considered and rejected

### Option A — refuse to stringify in `decoratedValue`, returning `''`

A smaller fork change, but it fixes only the leak and leaves §4.1's three entries permanently dead. Rejected in
favour of §6.1, which costs a few more lines and restores 1.x parity.

### Option B — give the section lambdas a benign `toString` (tmplat-side only)

`decoratedValue` ends at `String(value)`, which honours a custom `toString`, so attaching `toString = () => ''` to
each lambda suppresses the leak with no dependency release. Verified working. **Rejected:** `toString` is
synchronous, so it can never produce `dateTime`/`lastModified`/`shorten`'s values — this would cement §4.1's
regressions. It also relies on a subtle engine implementation detail and would be silently missed by any future
hand-rolled entry.

Still a legitimate **interim** measure if a fork release is blocked, provided the loss of those three behaviours is
accepted explicitly and tracked.

### Option C — validate templates when saved / surface a warning

Detect a bare reference to an Operation entry and warn the user in the options UI. Complementary to §6, not a
substitute — it does not fix rendering, and it would need to allow `popUrl`, `dateTime`, `lastModified` and
`shorten`.

### Option D — document only

Note in the guide that Operations must be used as sections. Weakest option, and factually wrong for the four entries
where bare usage is intended.

## 8. Related, already fixed

The object _Collection_ entries `cookies` and `hash-search-params` were mistakenly built with
`createTrimmedContentRenderer` (copy-pasted from their singular `cookie`/`hashSearchParam` Operation siblings), so
`{#cookies}{sessionId}{/cookies}` rendered `[object Object]` and a bare `{cookies}` leaked lambda source. Both now
return plain objects like `search-params.ts`. Covered by
`src/lib/template/context/entry/object-collection.test.ts`, which asserts named access works **and** that a bare
reference never contains `=>` — that second assertion is the one that would catch a regression of this class for
collections, and §6.3's registry-wide version generalises it.

## 9. Useful context for whoever picks this up

- Templates use **`tmplat-mustache`, not stock Mustache**: single curly braces (`{name}`, `{#name}`, `{^name}`,
  `{.}`), values **unescaped by default**, and `{{name}}`/`{&name}` is what HTML-escapes. Stock syntax fails
  silently rather than erroring. `src/lib/template/tmplat-mustache.test.ts` is a characterization suite pinning
  these quirks — read it before assuming any behaviour. (The legacy vendored 0.7.2 was already single-brace, so 1.x
  templates use the same delimiters.)
- Entry categories are `Standard` (plain value), `Collection` (array/object) and `Operation` (transforms its
  section body). An entry may declare `Standard` **and** `Operation` together, meaning both `{name}` and
  `{#name}...{/name}` are supported — that combination is exactly what §4.1 is about.
- Structural invariants across all ~250 definitions are asserted in
  `src/lib/template/context/entry/index.test.ts`; the registry-wide guard from §6.3 fits naturally there.
- The legacy sources are only in git history: `git show 8f3c5e3:src/lib/background.coffee`,
  `git show 8f3c5e3:src/vendor/mustache.js` (the commit before `17e08b9` deleted them).
- Run the template tests with `pnpm exec vitest run src/lib/template`. Full verification is `pnpm check`
  (type-check + lint + format + unit tests) and `pnpm build`.
