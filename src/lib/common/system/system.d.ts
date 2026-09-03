// Augments `Navigator`/`WorkerNavigator` with `userAgentData` (see `system.utils.ts`).
//
// The `user-agent-data-types` package ships a global ambient declaration (it has no top-level `import`/`export`),
// so it can't be `import`ed like a normal module - it must be pulled into the program via a triple-slash reference
// or tsconfig inclusion. This file exists purely to hold that reference: it must itself remain a global script
// (no top-level `import`/`export`), otherwise the referenced augmentations end up scoped to this file's module
// instead of merging into the global `Navigator`/`WorkerNavigator` types used everywhere else in the project.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../../../node_modules/user-agent-data-types/index.d.ts" />
