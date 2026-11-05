# SMR task and UI work — 4 November 2026

Joe authorized publication on 4 November 2026. Preview: http://localhost:4190/#contribute (sample data; never changes live accounts). Web branch: tasks-preview. Existing task tags were initially left untouched. Joe explicitly requested catalogue-based tag population on 4 November; the reviewed import is now applied.

## Released features
- Admin create/edit/delete/complete, arbitrary task type and treasury reward, explicit close/delete confirmation.
- Fixed treasury-system-account lookup in admin reward edits; tested reservation, refund, retries and authorization.
- Custom tag catalog; explicitly assigned proposal semester/unit/custom tags; no per-task tag count limit.
- Saved multi-tag filters, academic-year/general filtering (untagged tasks remain visible), minimum/maximum reward.
- Tune icon at right of task search opens Advanced search; pill inputs and stable pill selection shape.
- Priority 0–10 shared ordering; task age updates each minute; grouped expanded-task actions.
- VPS-backed unique display names; account form and chat/profile naming.
- Idempotent signup welcome and transfer chat notices; durable retrying transfer-email outbox and gateway-only mail route.
- General shared chat space; single reaction per member/message; floating message tools without resizing bubbles.
- Sidebar avatar enlargement as a separate accessible control; right-side dashboard/preview close controls; vertical file menus.
- Both failed-file-request email links are pills in the legacy template.
- Legacy folder requests restored with a fixed content snapshot, resumable individual purchases, stable IDs and terminal insufficient-balance handling. Parent folders are not broadly shared.

## Completed live operations (explicitly authorized)
- Treasury issuance receipt treasury-issue-2026-11-04-13000.4: 13.4 -> 13,000.4 coins, issuing 12,987 coins. Database backup retained on VPS.
- Reserved 470 coins across 25 previously unfunded imported tasks (22 x 20; 3 x 10), using original amounts recorded in descriptions.
- Available treasury after funding: 12,530.4 coins. Existing 64 funded tasks unaffected.
- Descriptions and tags preserved. Automatic approval rejected deleting outdated unfunded wording alongside funding; funding completed without those edits.
- Release: core Apps Script @58, legacy email @8, gateway rebuilt with rollback image retained; website publication authorized.

## Checks and review
- Desktop/mobile task search, proposal forms, admin form accessibility/validation and saved filters checked.
- Desktop/mobile avatar and dashboard accessibility, optimistic message sending and unchanged bubble dimensions checked.
- Backend accounting, reaction replacement, username uniqueness, mail queue retries and folder purchase retries checked.
- New advanced-search mobile screenshot reviewed: clean pill fields, tune entry point, right-side close, no duplicate Details row. Existing full-page screenshot baselines intentionally not overwritten.
- Preview mocks simulate task edits/creation, proposals, tags and username changes only in browser memory; reload resets sample edits.

## Remaining follow-up
- Collect Joe’s real-use screenshots/issues for a single follow-up batch; Firefox remains a deferred manual check.
- Desktop/mobile release suite: 22 checks passed; changed Contribute screenshots reviewed.
- Verify transfer mail delivery and signup welcome end-to-end in an authorized test account after deployment.
- All 25 new reward records are confirmed synchronized to both configured mirrors. All 89 open tasks now have reserved rewards.
- Consider legacy notification receipt retention and recovery of ambiguous email-send interruptions.
- Keep Google OAuth setup deferred until a Web client ID is supplied; current password/email-code flow remains.


## Follow-up release — task editing and menu fixes
- Fixed non-ASCII signed requests on the website/Core boundary and explicitly UTF-8 encoded the Core/ledger signature. Tested emoji, accented text and signature tampering.
- Added administrator-only metadata tagging that leaves escrow and rewards untouched. Applied tags to 183 tasks: 178 mapped to catalogue units/semesters/years, five broad tasks tagged general; preserved existing tags.
- Deleted Refer a Comrade through the normal admin workflow. 88 open tasks remain; all other rewards/descriptions verified unchanged.
- Task types now show existing workflows in a dropdown, with a custom workflow option and explanatory copy.
- Fixed the school-email input exception caused by the input adapter wrapping the field.
- Compact icon-first context menus reposition after layout changes, stay within the viewport and above mobile navigation. Removed file-name pill styling.
- Wider task editor, dropdowns that fit short lists, consistent Google Sans, green topic accents and warm reward badges.
- Transfer email means coin-transfer notifications, not changes to delivery addresses. Google OAuth remains pending a public Web client ID.
- Release checks: all 26 Chromium desktop/mobile interactions and accessibility checks passed; Contribute screenshot changes reviewed. Core deployed as version 61, gateway healthy.

## Review recovery — 5 November 2026
- Fixed out-of-scope task-card variables in populated review cards, request history and coinflip lists. Empty-data tests had hidden this regression.
- Drive staging behavior remains intact: prepareReviewAsset_ copies a shared Drive file into SMR_REVIEW_FOLDER_ID; publishReviewedContribution_ moves that same reviewed copy into the selected catalogue folder only after approval.
- Added contribution-review.test.cjs under vps/gateway/ledger to verify staging, duplicate submissions, rejection, independent/admin approvals and retry behavior without touching real submissions.
- Four new desktop/mobile checks passed for populated reviews (including opening the staged copy and approving) and request history. Review screenshots inspected; accessibility checks clear.
- Added a short explanation of review-folder handling to the contribution form. No backend deployment or changes to actual pending submissions were needed.
