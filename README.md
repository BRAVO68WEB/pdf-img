# pdf-img

Serverless Worker API to split PDFs to rendered PNG images returned as S3 image URL.

## API Routes

```bash
curl --location 'https://api.host/' \
--header 'Content-Type: application/json' \
--data '{
    "pdf_url": "https://example.com/doc.pdf"
}'
```
```json
{
    "png_urls": [
        "https://s3.host/pdf-search/p1.png",
        "https://s3.host/pdf-search/p2.png",
        "https://s3.host/pdf-search/p3.png",
        "https://s3.host/pdf-search/p4.png",
        "https://s3.host/pdf-search/p5.png",
        "https://s3.host/pdf-search/p6.png",
        "https://s3.host/pdf-search/p7.png",
    ]
}
```

## Tech Stask

- Hono
- Cloudflare Workers
