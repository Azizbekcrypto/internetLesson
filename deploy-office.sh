#!/bin/bash
# Ofisni Vercel'ga chiqarish: joriy fayllarni ko'chirib deploy qiladi
set -e
cd "$(dirname "$0")"
mkdir -p office-deploy
cp pipeline-office.html office-deploy/index.html
cp pipeline-state.js office-deploy/pipeline-state.js
cp office-manifest.json office-deploy/manifest.json
cp office-icon.svg office-deploy/icon.svg
echo '{"cleanUrls": true}' > office-deploy/vercel.json
npx vercel deploy office-deploy --prod --yes
