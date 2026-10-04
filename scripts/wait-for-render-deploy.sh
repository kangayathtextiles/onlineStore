#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 3 ]; then
  echo "Usage: $0 <RENDER_API_KEY> <SERVICE_ID> <COMMIT_SHA>"
  exit 1
fi

RENDER_API_KEY="$1"
SERVICE_ID="$2"
COMMIT_SHA="$3"

echo "Waiting for deployment of commit ${COMMIT_SHA} on service ${SERVICE_ID} to complete..."

MAX_ATTEMPTS=60 # 60 * 10s = 10 minutes
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  # Fetch the most recent deploys for the service
  RESPONSE=$(curl -s -H "Authorization: Bearer ${RENDER_API_KEY}" -H "Accept: application/json" \
    "https://api.render.com/v1/services/${SERVICE_ID}/deploys?limit=10")
    
  # Check if curl failed or returned unauthorized
  if echo "$RESPONSE" | grep -q "unauthorized"; then
    echo "[ERROR] Render API unauthorized. Check RENDER_API_KEY."
    exit 1
  fi

  # Find the status of the deploy matching the commit SHA
  if command -v jq >/dev/null 2>&1; then
    DEPLOY_STATUS=$(echo "$RESPONSE" | jq -r ".[] | select(.deploy.commit.id == \"${COMMIT_SHA}\") | .deploy.status" | head -n 1)
  else
    echo "[ERROR] jq is required but not found."
    exit 1
  fi

  if [ -z "$DEPLOY_STATUS" ]; then
    echo "Attempt $((ATTEMPT+1))/${MAX_ATTEMPTS}: Deploy for commit ${COMMIT_SHA} not found yet. Retrying in 10s..."
  else
    echo "Attempt $((ATTEMPT+1))/${MAX_ATTEMPTS}: Status is '${DEPLOY_STATUS}'..."
    case "$DEPLOY_STATUS" in
      live)
        echo "✓ Deployment is live!"
        exit 0
        ;;
      build_failed|update_failed|canceled)
        echo "✗ Deployment failed with status: ${DEPLOY_STATUS}"
        exit 1
        ;;
      *)
        # still deploying, created, build_in_progress, update_in_progress, etc.
        ;;
    esac
  fi

  ATTEMPT=$((ATTEMPT+1))
  sleep 10
done

echo "[ERROR] Timed out waiting for deployment."
exit 1
