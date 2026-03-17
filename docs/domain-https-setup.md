# BookNGO.ca Domain & HTTPS Setup (Backend)

This guide sets up your backend behind **https://api.bookngo.ca** using Nginx and Let's Encrypt on AWS EC2.

---

## Overview

- **Domain**: bookngo.ca (you own it)
- **Backend URL**: https://api.bookngo.ca (subdomain `api`)
- **Frontends** (on Vercel) will use this URL as their API base.

---

## Step 1 — DNS: Point api.bookngo.ca to Your EC2 IP

1. Log in to where you bought **bookngo.ca** (registrar: GoDaddy, Namecheap, Cloudflare, etc.).
2. Open **DNS settings** / **Manage DNS** / **DNS records** for bookngo.ca.
3. Add a new record:

   | Type | Name | Value        | TTL  |
   |------|------|--------------|------|
   | **A** | **api** | **16.52.57.100** | 300  |

   - **Name**: `api` → gives you `api.bookngo.ca`
   - **Type**: A
   - **Value**: Your EC2 **Public IPv4** (replace `16.52.57.100` if your IP is different)
   - **TTL**: 300 or 600

4. Save. Wait 5–15 minutes, then from your PC run:
   ```bash
   ping api.bookngo.ca
   ```
   You should see the same IP (16.52.57.100). If not, wait a bit longer or double-check the A record.

---

## Step 2 — Install Nginx on EC2 (Amazon Linux)

SSH into your EC2 instance, then:

```bash
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Check it’s running:

```bash
sudo systemctl status nginx
```

---

## Step 3 — Configure Nginx to Proxy to Nest (port 3000)

Create a config for api.bookngo.ca:

```bash
sudo nano /etc/nginx/conf.d/bookngo-api.conf
```

Paste this (use your actual domain):

```nginx
server {
    listen 80;
    server_name api.bookngo.ca;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and exit (`Ctrl+O`, Enter, `Ctrl+X`).

Test config and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Test:** In your browser open `http://api.bookngo.ca/health/cms`. You should get the JSON health response (still HTTP for now).

---

## Step 4 — Get HTTPS with Let’s Encrypt (Certbot)

On EC2:

```bash
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.bookngo.ca
```

- Enter your email when asked (for renewal notices).
- Accept terms of service.
- When asked to redirect HTTP to HTTPS, choose **Yes** (option 2).

Certbot will obtain a certificate and adjust Nginx for you.

**Test:** Open **https://api.bookngo.ca/health/cms** in your browser. You should see the JSON response with a green padlock.

---

## Step 5 — Backend .env on EC2 (optional)

If your frontends will be on different domains (e.g. Vercel), ensure CORS knows them. On EC2, in `/home/ec2-user/bookngo-backend/.env` you can set:

```env
FRONTEND_URL=https://your-user-frontend.vercel.app
CMS_FRONTEND_URL=https://your-cms-frontend.vercel.app
```

Then restart the app:

```bash
cd /home/ec2-user/bookngo-backend
pm2 restart bookngo-backend
```

---

## Step 6 — Use the New URL in Your Frontends

On **Vercel** (for both CMS and user frontends), set:

- **NEXT_PUBLIC_API_BASE_URL** = `https://api.bookngo.ca`
- **SERVER_API_BASE_URL** (if used) = `https://api.bookngo.ca`

Redeploy both frontends so they use the new API URL.

---

## Summary

| What        | URL / value              |
|------------|---------------------------|
| Backend API | https://api.bookngo.ca   |
| Health (CMS) | https://api.bookngo.ca/health/cms |
| Health (user) | https://api.bookngo.ca/health/user |

---

## Renewal

Let’s Encrypt certificates expire in 90 days. Certbot installs a cron job to auto-renew. To test renewal:

```bash
sudo certbot renew --dry-run
```

---

## If Your EC2 IP Changes

If you stop/start the instance without an Elastic IP, the public IP can change. Then:

1. Update the **A record** for `api.bookngo.ca` in your DNS to the new IP.
2. No Nginx or Certbot changes needed.

To avoid this, you can attach an **Elastic IP** to the instance in the AWS EC2 console (then use that IP in the A record).
