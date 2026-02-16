#!/bin/bash

# DKIM Key Generation Script
# Generates DKIM private/public key pairs for email signing

set -e

DOMAIN=${1:-"bhamail.local"}
SELECTOR=${2:-"default"}
KEY_SIZE=${3:-2048}
KEYS_DIR="./keys"

echo "🔐 Generating DKIM keys for domain: $DOMAIN"

# Create keys directory if it doesn't exist
mkdir -p "$KEYS_DIR"

# Generate private key
PRIVATE_KEY_FILE="$KEYS_DIR/dkim_${DOMAIN}_${SELECTOR}_private.pem"
PUBLIC_KEY_FILE="$KEYS_DIR/dkim_${DOMAIN}_${SELECTOR}_public.pem"
DNS_RECORD_FILE="$KEYS_DIR/dkim_${DOMAIN}_${SELECTOR}_dns.txt"

echo "📝 Generating private key..."
openssl genrsa -out "$PRIVATE_KEY_FILE" $KEY_SIZE

echo "📝 Extracting public key..."
openssl rsa -in "$PRIVATE_KEY_FILE" -pubout -out "$PUBLIC_KEY_FILE"

# Generate DNS TXT record
echo "📝 Generating DNS TXT record..."
PUBLIC_KEY_B64=$(openssl rsa -in "$PRIVATE_KEY_FILE" -pubout -outform DER 2>/dev/null | openssl base64 -A)

# Create DNS record content
DNS_RECORD="$SELECTOR._domainkey.$DOMAIN IN TXT \"v=DKIM1; k=rsa; p=$PUBLIC_KEY_B64\""

echo "$DNS_RECORD" > "$DNS_RECORD_FILE"

# Update database with new DKIM key
echo "💾 Updating database with DKIM key..."

# Read the private key content
PRIVATE_KEY_CONTENT=$(cat "$PRIVATE_KEY_FILE")
PUBLIC_KEY_CONTENT=$(cat "$PUBLIC_KEY_FILE")

# Connect to database and update DKIM key
docker-compose exec -T postgres psql -U bhamail -d bhamail << EOF
INSERT INTO dkim_keys (domain, selector, private_key, public_key, is_active)
VALUES ('$DOMAIN', '$SELECTOR', '$PRIVATE_KEY_CONTENT', '$PUBLIC_KEY_CONTENT', true)
ON CONFLICT (domain, selector) 
DO UPDATE SET 
    private_key = EXCLUDED.private_key,
    public_key = EXCLUDED.public_key,
    is_active = true;
EOF

echo "✅ DKIM keys generated successfully!"
echo ""
echo "📁 Files created:"
echo "   • Private key: $PRIVATE_KEY_FILE"
echo "   • Public key: $PUBLIC_KEY_FILE"
echo "   • DNS record: $DNS_RECORD_FILE"
echo ""
echo "📋 DNS Configuration:"
echo "   Add this TXT record to your DNS:"
echo "   $DNS_RECORD"
echo ""
echo "🔧 Manual DNS Setup:"
echo "   Record Type: TXT"
echo "   Name: $SELECTOR._domainkey"
echo "   Value: v=DKIM1; k=rsa; p=$PUBLIC_KEY_B64"
echo ""
echo "🔍 Verify DKIM setup:"
echo "   dig TXT $SELECTOR._domainkey.$DOMAIN"
echo "   nslookup -type=TXT $SELECTOR._domainkey.$DOMAIN"
echo ""
echo "⚠️  Security Notes:"
echo "   • Keep private keys secure and never commit to version control"
echo "   • Rotate keys regularly (every 6-12 months)"
echo "   • Use HSM for production environments"