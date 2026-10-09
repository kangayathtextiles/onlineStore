#!/bin/sh
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$DIR"

if [ -f "$DIR/fullchain.pem" ] && [ -f "$DIR/privkey.pem" ]; then
  echo "Certificates already exist in $DIR."
  exit 0
fi

echo "Generating fallback self-signed certificates in $DIR..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$DIR/privkey.pem" \
  -out "$DIR/fullchain.pem" \
  -subj "/C=IN/ST=Tamil Nadu/L=Tirupur/O=Kangayath Textiles/CN=kangayath.site"

echo "Bootstrap certificates generated successfully."
