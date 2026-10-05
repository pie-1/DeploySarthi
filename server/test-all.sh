#!/bin/bash
# DeploySarthi — Full Test
BASE="http://localhost:5000/api"

echo "=== 1. LOGIN ==="
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@gmail.com","password":"test1@07"}' \
  | grep -oP '"token":"\K[^"]+')
echo "Token: ${TOKEN:0:20}..."

echo -e "\n=== 2. GITHUB STATUS ==="
curl -s $BASE/github/status -H "Authorization: Bearer $TOKEN"

echo -e "\n=== 3. GITHUB REPOS ==="
curl -s "$BASE/github/repos?limit=3" -H "Authorization: Bearer $TOKEN" | head -c 300

echo -e "\n\n=== 4. VERCEL USER ==="
curl -s $BASE/vercel/me -H "Authorization: Bearer $TOKEN"

echo -e "\n=== 5. VERCEL PROJECTS ==="
curl -s "$BASE/vercel/projects?limit=3" -H "Authorization: Bearer $TOKEN" | head -c 300

echo -e "\n\n=== 6. AUTO-DEPLOY (unique name) ==="
NAME="test-$(date +%s)"
curl -s -X POST $BASE/vercel/auto-deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"$NAME\",\"gitRepo\":\"pie-1/College_Buddy\",\"framework\":\"vite\"}"

echo -e "\n\n=== 7. PROJECTS ==="
curl -s $BASE/projects -H "Authorization: Bearer $TOKEN" | head -c 300

echo -e "\n\n=== 8. INCIDENTS ==="
curl -s "$BASE/incidents" -H "Authorization: Bearer $TOKEN" | head -c 300

echo -e "\n\n=== 9. AI HEALTH ==="
curl -s $BASE/ai/health -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== DONE ==="