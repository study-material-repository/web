# Component catalogue and migration status

Verified reference: https://m3e.kyralabs.dev/ (documentation v1.8.0, inspected 1 November 2026).
Implementation status: Kyra Labs is not yet integrated. This is an incremental adoption policy, not a completed migration.

| Purpose | Current adapter / implementation | Migration requirement |
| --- | --- | --- |
| Primary / secondary actions | ui-components.js, shared button classes | Verify Kyra Button API, preserve disabled and submit behavior |
| Icon actions | shared icon-button, Google Material Symbols | Verify icon button API, require accessible label |
| Selection | ui-components.js select adapter | Verify keyboard and form behavior before replacing |
| Dialogs | native dialog with shared account-dialog styling | Keep focus trapping, Escape and return focus |
| Network loading | SMRProgress / page-progress | One page-level bar; local text only |
| Catalogue cards | app.js / website-extras.js | Preserve navigation and access requests |
| Chat | chat-ui.js | Preserve safe text rendering, drafts and message authorization |
| Motion | reduced-motion-aware browser transitions | Existing custom transitions are temporary exceptions |

Current exceptions: legacy styles.css, mono-theme.css and expressive-ui.css contain custom values and overlapping selectors. Consolidate by component when adopting verified library controls. Avoid new global overrides.

Release verification: repository formatter, JavaScript syntax, relevant interaction checks, mobile/tablet/desktop screenshot review, keyboard and reduced-motion checks. Screenshot baselines require human visual review. Cross-browser and axe automation remain to be integrated.
