// This file is generated during the build from the changelog within "docs/changelog.json".
// Do not edit it manually as any changes will be overwritten.

type SemanticVersion = `${number}.${number}.${number}`;

// Compilation fails if any version below is not a valid semantic version
type AssertSemanticVersion<Version extends SemanticVersion> = Version;

export type ExtensionVersion = AssertSemanticVersion<
  | '0.0.2'
  | '0.1.0'
  | '0.1.1'
  | '0.2.0'
  | '0.2.1'
  | '0.2.2'
  | '0.2.3'
  | '0.2.4'
  | '0.3.0'
  | '1.0.0'
  | '1.0.1'
  | '1.0.3'
  | '1.0.4'
  | '1.0.5'
  | '1.0.6'
  | '1.0.7'
  | '1.0.8'
  | '1.0.9'
  | '1.0.10'
  | '1.1.0'
  | '1.1.1'
  | '1.1.2'
  | '1.1.3'
  | '1.1.4'
  | '1.2.0'
  | '1.2.1'
  | '1.2.2'
  | '1.2.3'
  | '1.2.4'
  | '1.2.5'
  | '1.2.6'
  | '1.2.7'
  | '1.2.8'
  | '1.2.9'
  | '2.0.0'
>;
