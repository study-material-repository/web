# Kyra Labs UI

Kyra Labs 1.8.0 is bundled locally through `src/ui/index.js` and `src/ui/index.css`. Run `npm run build:ui` after editing either entry point.

Shared adapters cover buttons, icon buttons, text fields, select menus, cards and dialogs. MenuPopup and DialogLayout supply popup positioning, motion, focus handling and Escape behavior. Google Material Symbols remain the icon system. The generated theme is in assets/theme.css.

Application code uses window.SMRMaterial for dialogs and menu integration. New shared controls belong in src/ui rather than individual feature files. Preserve native form validation and accessible labels.

Legacy layout CSS is isolated in the legacy cascade layer. Navigation, chat bubbles, pixel editor, progress and domain-specific cards retain application layout rules. These are explicit remaining custom components, not claims of native Kyra implementations.

Verification runs Chromium desktop/mobile, Firefox tablet and WebKit mobile with axe and overflow checks. Current fixtures cover main empty states and proposal dialog behavior. CI screenshots are review artifacts; automatic candidate generation is not a visual-regression gate. Populated-state coverage and reviewed cross-browser baselines remain follow-up work.
