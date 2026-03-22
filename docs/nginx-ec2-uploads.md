# Nginx on EC2: uploads, 413, and CORS

## What you saw: `413 Request Entity Too Large` + “CORS” on admin uploads

1. **413** – Nginx’s default **`client_max_body_size` is 1m**. Large images exceed that, so **Nginx rejects the request before Node/Nest runs**. The browser then often reports **“No `Access-Control-Allow-Origin`”** because the **413 page from Nginx** does not include your API’s CORS headers. Fixing the size limit fixes the misleading CORS error.

2. **Nest** – The app sets JSON/urlencoded limits via **`BODY_LIMIT_MB`** (default **25**). Multipart file limits follow **`UPLOAD_MAX_FILE_BYTES`** or the same MB cap (see `src/utils/multer-memory.ts`).

## Required: raise Nginx body size

Edit the server block that proxies to Node (e.g. `/etc/nginx/conf.d/api.bookngo.conf`):

```nginx
server {
    # ...

    # Allow large multipart uploads (images). Match or exceed BODY_LIMIT_MB in .env.
    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Optional: slow clients / big uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Optional: CORS headers on Nginx error responses

If you still see CORS errors **only** on failed responses, you can add (carefully, only for known admin origins):

```nginx
# Inside the same server/location that proxies to Node — example:
add_header Access-Control-Allow-Origin "https://admin.bookngo.ca" always;
add_header Access-Control-Allow-Credentials "true" always;
```

Prefer fixing **413** first; Nest already sends CORS for responses it generates.

## Env on the app server

```env
BODY_LIMIT_MB=25
# Optional explicit multipart cap (bytes); defaults to BODY_LIMIT_MB in bytes
# UPLOAD_MAX_FILE_BYTES=26214400
```

After changes: `pm2 restart bookngo-backend --update-env`.
