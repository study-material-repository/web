# SMR Material-first UI policy

Use the installed m3-expressive skill for every UI change.

For this existing vanilla-JavaScript application, adopt Kyra Labs CSS and Web Components incrementally through shared UI adapters. Verify the installed version, exports, behavior, and licensing before approving a component. New React applications default to TypeScript + Vite with verified Kyra Labs React adapters.

Read design-system/components.md before changing UI. Reuse approved controls. Do not add a UI library or an invented primitive without documenting why the approved implementation cannot satisfy the request.

Use shared color, typography, shape, spacing, and motion tokens. Preserve keyboard focus, accessible names, reduced motion, and existing form semantics. Prefer library behavior when the selected component supports it.

Run syntax and repository formatting checks, relevant interaction tests, and desktop/mobile visual checks. Review screenshots before treating them as baselines. Report any checks not run. Never describe existing custom CSS as certified library implementation.

Use only the page-level network progress indicator. Local status text may explain the operation. Preserve financial idempotency and authorization. Treasury operations must use the existing backend workflow.
