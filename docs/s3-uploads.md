# S3 uploads (simple dev / small prod)

Images from the CMS are uploaded **through the API** (multipart), then stored either:

- **S3** — when `S3_BUCKET_NAME` is set (recommended on EC2), or  
- **Local disk** — under `uploads/` (same as before) when the bucket is not set.

The database stores:

- **S3 object key**, e.g. `CMS/activity/1739-….jpg`, or  
- **Local path**, e.g. `/uploads/CMS/activity/….jpg`

Public/user and CMS **read** APIs return **display URLs** (never raw S3 keys in JSON for these):

- S3 keys → **presigned GET** URLs (default TTL **3600s**, override with `S3_PRESIGNED_URL_TTL_SECONDS`)
- `/uploads/…` → `API_PUBLIC_URL` + path (e.g. `https://api.bookngo.ca/uploads/...`)

**User (public) routes that resolve images:** `VendorsService` (vendor slug + activity by id), `SkiSlopesService` (all ski-slopes endpoints including `GET /user/ski-slopes?region=…`), `BookingsService.getInventoryUsingCustomerSlug` (inventory `thumbnailImageUrl`). **CMS** list/detail endpoints also resolve on read.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `S3_BUCKET_NAME` | For S3 | Bucket name |
| `AWS_REGION` | If S3 | e.g. `ca-central-1` |
| `AWS_ACCESS_KEY_ID` | Optional* | IAM user key |
| `AWS_SECRET_ACCESS_KEY` | Optional* | IAM user secret |
| `API_PUBLIC_URL` | For legacy `/uploads` | e.g. `https://api.bookngo.ca` (no trailing slash) |
| `S3_PRESIGNED_URL_TTL_SECONDS` | Optional | Presigned URL lifetime (default `3600`) |

\*On EC2 you can omit keys and attach an **IAM instance role** with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::YOUR_BUCKET/*`.

## Bucket setup (minimal)

1. Create an S3 bucket in your region (no public ACLs needed).
2. Block public access **on** (objects stay private; access via presigned URLs only).
3. IAM policy example:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

4. **CORS** is not required for this flow (browser → API → S3). Add CORS only if you later use **direct browser uploads** to S3.

## Frontend notes

- Use the URLs returned by the API as `<img src="…">` (or background-image). Presigned URLs expire; **refetch** listing/detail when images break.
- `next/image`: presigned URLs change often; use a normal `<img>` or `unoptimized` / remote pattern for your S3 host if you switch to stable public URLs later.

## Cost

Single bucket, standard storage, no versioning — suitable for low traffic. Enable lifecycle rules later if you want auto-expiry of old objects.
