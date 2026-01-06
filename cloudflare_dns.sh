#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Cloudflare DNS Record Creator
# Add CNAME for brief.activemirror.ai → GitHub Pages
# ═══════════════════════════════════════════════════════════════

# Instructions:
# 1. Go to: https://dash.cloudflare.com/profile/api-tokens
# 2. Click "Create Token"
# 3. Use template: "Edit zone DNS"
# 4. Under Zone Resources: Include → Specific zone → activemirror.ai
# 5. Click "Continue to summary" → "Create Token"
# 6. Copy the token and paste it below

CLOUDFLARE_TOKEN="YOUR_TOKEN_HERE"
ZONE_NAME="activemirror.ai"
RECORD_NAME="brief"
RECORD_TARGET="mirrordna-reflection-protocol.github.io"

# Get Zone ID
echo "⟡ Getting Zone ID for $ZONE_NAME..."
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json" | python3 -c "import sys,json; print(json.load(sys.stdin)['result'][0]['id'])")

if [ -z "$ZONE_ID" ]; then
  echo "❌ Failed to get Zone ID. Check your token."
  exit 1
fi

echo "✓ Zone ID: $ZONE_ID"

# Check if record exists
echo "⟡ Checking for existing record..."
EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$RECORD_NAME.$ZONE_NAME&type=CNAME" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json")

RECORD_ID=$(echo "$EXISTING" | python3 -c "import sys,json; r=json.load(sys.stdin)['result']; print(r[0]['id'] if r else '')" 2>/dev/null)

if [ -n "$RECORD_ID" ]; then
  echo "⟡ Record exists, updating..."
  RESULT=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
    -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"CNAME\",\"name\":\"$RECORD_NAME\",\"content\":\"$RECORD_TARGET\",\"ttl\":3600,\"proxied\":false}")
else
  echo "⟡ Creating new CNAME record..."
  RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"CNAME\",\"name\":\"$RECORD_NAME\",\"content\":\"$RECORD_TARGET\",\"ttl\":3600,\"proxied\":false}")
fi

SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))")

if [ "$SUCCESS" = "True" ]; then
  echo "✅ CNAME record created/updated!"
  echo "   $RECORD_NAME.$ZONE_NAME → $RECORD_TARGET"
  echo ""
  echo "🌐 Your site will be live at: https://brief.activemirror.ai"
  echo "   (May take a few minutes for DNS to propagate)"
else
  echo "❌ Failed to create record:"
  echo "$RESULT" | python3 -m json.tool
fi
