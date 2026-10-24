# n8n Instagram workflow starter

Import `califnco-daily-instagram-starter.json` in n8n. It is intentionally inactive and contains TODO nodes only; it is not yet a working Instagram publisher.

To complete:
1. Configure the schedule timezone to Asia/Kolkata and choose the desired publishing time.
2. Add product rotation (Google Sheets or Firestore REST/API with appropriate credentials).
3. Add a fresh image-generation step using a verified free local model/API.
4. Upload the generated image to a publicly accessible HTTPS host.
5. Generate caption + hashtags.
6. Add Meta Graph API steps for media container creation and publishing.
7. Log outcomes and handle retries/errors.
8. Test in dry-run mode; only activate after successful end-to-end validation.

Never put access tokens in the exported workflow JSON or Git.
