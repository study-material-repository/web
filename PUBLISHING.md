# Publishing SMR yourself

Run these in PowerShell. A website-only push does not publish Apps Script or VPS changes.

## Website only

```powershell
Set-Location 'C:\Users\joe\VscodeProjects\smr\smr-10.9.26\web'
npm run build:ui
npm run check:ui
npx playwright test --project=chromium-desktop --project=chromium-mobile
# Stop if a check fails. Review the diff before committing.
git status
git diff --stat
git add app.js chat-ui.js website-extras.js index.html src/ui assets tests TASKS-BACKLOG.md PUBLISHING.md scripts/preview.cjs
git commit -m 'Update SMR tasks and interface'
git fetch origin
git push origin HEAD:main
```

If the push is rejected, stop and reconcile the remote changes; do not force-push. If there is nothing to commit, continue from `git fetch origin`. The push publishes the current branch to live main, regardless of its local name. Never use the `previous-pages` remote.

## Core Apps Script (when backend files changed)

```powershell
Set-Location 'C:\Users\joe\VscodeProjects\smr\smr-10.9.26'
npx --yes @google/clasp push
# Only proceed if push succeeds.
npx --yes @google/clasp deploy --deploymentId AKfycbyooUDhTOfTZrvjtHYivUGMmwmZNnKEGLF9EIFiE9z5VDQmYJ0mVe8X0LP7csQW2g --description 'SMR backend update'
```

## VPS changes in this release

These commands upload only the changed application files, never `.env` or the database. For later releases, update the archive file list to match their changes.

```powershell
Set-Location 'C:\Users\joe\VscodeProjects\smr\smr-10.9.26\vps\gateway'
$key = 'C:\Users\joe\VscodeProjects\smr\smr-10.9.26\vps\.ssh\smr_vps_deploy'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
ssh.exe -i $key root@107.173.80.12 "cd /opt/smr/gateway && tar -czf /opt/smr/gateway-before-$stamp.tgz server.js ledger"
# Stop on any failure before proceeding.
tar -czf "$env:TEMP/smr-release.tgz" server.js ledger/chat.cjs ledger/website-data.cjs ledger/mail-outbox.cjs
scp.exe -i $key "$env:TEMP/smr-release.tgz" root@107.173.80.12:/opt/smr/smr-release.tgz
ssh.exe -i $key root@107.173.80.12 'cd /opt/smr/gateway && tar -xzf /opt/smr/smr-release.tgz && docker compose up -d --build'
```

## Legacy email template

```powershell
Set-Location 'C:\Users\joe\VscodeProjects\smr\smr-9.9.26\migrations\cutover\legacy'
npx --yes @google/clasp push
# Only proceed if push succeeds.
npx --yes @google/clasp deploy --deploymentId AKfycbxrTMHCwyapgsFQ-_MVqaFmzDdp_jvNF5GT6-7qgBux9LL00l8XU7SG3HxKC0Oi179l --description 'SMR email template update'
```

For a full release: publish core Apps Script, then VPS, then legacy email if changed, then the website. Finally open https://study-material-repository.github.io/web/#contribute and check GitHub Actions. Never run treasury issuance/funding scripts again as part of deployment; those operations are already complete.
