# Kyra Labs UI component contract

Kyra Labs 1.8.0 is bundled locally. Build with npm run build:ui; application code uses src/ui adapters rather than importing another UI library.

Implemented adapters: buttons, icon buttons, text fields, checkboxes (library renderCheckbox preserving native inputs), select menus (MenuPopup), dialogs (DialogLayout), cards, navigation rail and mobile navigation bar. Google Material Symbols supply icons. Legacy colour roles resolve to the generated Kyra theme.

Application-specific compositions remain: chat messages and reactions, file cards, expandable task rows, repository statistics, pixel-art canvas and the request-counted page progress bar. They retain domain behavior and use shared theme roles; these are not claimed as native Kyra components. Legacy layout CSS remains isolated in its cascade layer and must not be extended with competing global component styles.

Verification includes populated task expand/search, incoming/outgoing markdown chat, administrator dashboard, avatar editor, proposal dialog, axe and horizontal overflow checks. Chromium desktop/mobile screenshots are committed baselines and compared in CI; Firefox tablet and WebKit mobile run behavior/accessibility checks and capture review images. Baseline updates must be intentional and visually reviewed; CI never automatically updates them.

The migration remains on material-migration. The restored main branch is the live site. Review the branch preview before any further production rollout.
