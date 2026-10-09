# SSL / TLS Certificates

This directory holds the SSL/TLS certificates (`fullchain.pem` and `privkey.pem`) mounted into the Nginx container at `/etc/nginx/certs/`.

> **Note:** `*.pem` files are excluded by `.gitignore` to prevent committing sensitive private keys into version control.

---

## 1. Quickstart: Generate Bootstrap Certificates
Before starting Nginx for the first time, generate bootstrap self-signed certificates so Nginx can initialize TLS on port 443 without crashing:

```bash
# On Linux / macOS / Git Bash:
./infrastructure/nginx/certs/generate-certs.sh

# Or directly with OpenSSL:
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infrastructure/nginx/certs/privkey.pem \
  -out infrastructure/nginx/certs/fullchain.pem \
  -subj "/C=IN/ST=Tamil Nadu/L=Tirupur/O=Kangayath Textiles/CN=kangayath.site"
```

---

## 2. Production Automated Provisioning (Let's Encrypt)
Once production DNS records (`kangayath.site`, `www.kangayath.site`, `api.kangayath.site`) point to the host server:

1. Request certificates via Certbot:
```bash
docker compose -f docker-compose.production.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d kangayath.site -d www.kangayath.site -d api.kangayath.site \
  --email admin@kangayath.site --agree-tos --no-eff-email
```

2. Point or copy the issued certs to `infrastructure/nginx/certs/`:
- `fullchain.pem`
- `privkey.pem`

3. Reload Nginx without downtime:
```bash
docker compose -f docker-compose.production.yml exec nginx nginx -s reload
```

4. The `kangayath-certbot` container runs in the background and automatically executes `certbot renew` every 12 hours.
