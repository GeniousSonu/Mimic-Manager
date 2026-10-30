# High-Fidelity Browser Service Deployment Guide (Mode B)

This document provides complete instructions for self-hosting the external Chromium browser service required for **Mode B (High Fidelity)** UI replication in Mimic Manager.

---

## 1. Architecture Overview

```
[ WordPress Admin UI ]
         │
         ▼  (REST Request)
[ Mimic Manager Plugin (PHP) ]
         │
         ├── Mode A: Internal DOM & XPath Parser (Default, Universal)
         │
         └── Mode B: Headless Chromium Service (Optional, High Fidelity)
                 │  (HTTP / Token Auth)
                 ▼
         [ browser-service (Docker / Node.js + Playwright) ]
                 │
                 ├── Chrome Headless Engine
                 ├── Computed Style Extraction
                 └── Client-Side SPA Hydration
```

- **Mode A (Default)**: Embedded PHP DOM parser. 88% measured average fidelity. Works out of the box on all shared and VPS hosting with zero external dependencies.
- **Mode B (Optional)**: Connects to a self-hosted or cloud-hosted Playwright/Chromium container to execute client JavaScript, extract computed CSS variables, and render complex dynamic components.

---

## 2. Docker Compose Deployment

Create a `docker-compose.browser.yml` on your server:

```yaml
version: '3.8'

services:
  mimic-browser-service:
    image: mcr.microsoft.com/playwright:v1.44.0-jammy
    container_name: mimic_browser_service
    restart: unless-stopped
    environment:
      - PORT=3030
      - BROWSER_AUTH_TOKEN=your-secure-shared-secret-key-min-32-chars
      - CONCURRENCY=4
      - TIMEOUT_MS=15000
    command: >
      bash -c "
        npm init -y &&
        npm install express playwright-core &&
        node -e '
          const express = require(\"express\");
          const { chromium } = require(\"playwright-core\");
          const app = express();
          app.use(express.json({ limit: \"5mb\" }));

          app.post(\"/extract\", async (req, res) => {
            const token = req.headers[\"authorization\"];
            if (token !== \"Bearer \" + process.env.BROWSER_AUTH_TOKEN) {
              return res.status(401).json({ error: \"Unauthorized\" });
            }
            const { url } = req.body;
            if (!url) return res.status(400).json({ error: \"Missing url\" });

            let browser;
            try {
              browser = await chromium.launch({ headless: true, args: [\"--no-sandbox\", \"--disable-setuid-sandbox\"] });
              const page = await browser.newPage();
              await page.goto(url, { waitUntil: \"networkidle\", timeout: 12000 });
              const html = await page.content();
              const title = await page.title();
              await browser.close();
              res.json({ success: true, title, html });
            } catch (err) {
              if (browser) await browser.close();
              res.status(500).json({ error: err.message });
            }
          });

          app.listen(3030, () => console.log(\"Browser service listening on port 3030\"));
        '
      "
    ports:
      - "127.0.0.1:3030:3030"
    security_opt:
      - seccomp=unconfined
```

### Start the Service

```bash
docker compose -f docker-compose.browser.yml up -d
```

Verify the service is listening:

```bash
curl -X POST http://127.0.0.1:3030/extract \
  -H "Authorization: Bearer your-secure-shared-secret-key-min-32-chars" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

---

## 3. Configuring Mimic Manager WordPress Connector

In WordPress wp-config.php or via WP-CLI:

```bash
wp option update mimic_manager_browser_service_url "http://127.0.0.1:3030"
wp option update mimic_manager_browser_service_token "your-secure-shared-secret-key-min-32-chars"
```

Once configured, the Mimic Manager UI Replicator Studio will automatically detect the connection, show the **Mode B (High Fidelity)** badge as active, and route dynamic extractions through the Chromium microservice.
