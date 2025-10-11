#!/bin/bash

# Test Automated Pipeline Endpoint
# Usage: ./scripts/test-automated-pipeline.sh [ADMIN_TOKEN]

ADMIN_TOKEN=${1:-"your-admin-token-here"}
BASE_URL=${2:-"http://localhost:3000"}

echo "🧪 Testing automated pipeline endpoint..."
echo "URL: ${BASE_URL}/api/tasks/run-every-30min"
echo ""

# Make request
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X GET "${BASE_URL}/api/tasks/run-every-30min" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

# Extract HTTP code and body
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "📊 Response (HTTP $HTTP_CODE):"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "✅ Pipeline executed successfully!"

  # Extract key metrics
  EVENTS=$(echo "$BODY" | jq -r '.results.clustering.eventsCreated' 2>/dev/null)
  ARTICLES=$(echo "$BODY" | jq -r '.results.clustering.articlesProcessed' 2>/dev/null)

  if [ "$EVENTS" != "null" ] && [ "$ARTICLES" != "null" ]; then
    echo ""
    echo "📈 Pipeline Results:"
    echo "  - Articles processed: $ARTICLES"
    echo "  - Events created: $EVENTS"
    echo "  - Schedule: Every 30 minutes"
  fi
else
  echo ""
  echo "❌ Pipeline failed with HTTP $HTTP_CODE"

  if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo ""
    echo "💡 Tip: Set ADMIN_TOKEN in .env.local:"
    echo "   ADMIN_TOKEN=$(openssl rand -base64 32)"
    echo ""
    echo "   Then run:"
    echo "   ./scripts/test-automated-pipeline.sh \"\$ADMIN_TOKEN\""
  fi
fi

echo ""
