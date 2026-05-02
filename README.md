# DRDIP-II Field Monitoring Dashboard

**Somali Regional State Bureau of Agriculture — Ethiopia**

A static, single-page dashboard that reads live KoboToolbox field-monitoring data
through a secure Vercel serverless proxy. The browser never calls KoboToolbox
directly, and your API token never appears in source code, URLs, or logs.

---

## File Structure

```
drdip-dashboard/
  api/
    kobo-proxy.js    Vercel serverless function — proxies KoboToolbox data API
    kobo-media.js    Vercel serverless function — proxies KoboToolbox attachment images
  index.html         Full static dashboard (HTML + CSS + JS, no build step)
  package.json       Node 20 engine declaration, no dependencies
  vercel.json        Vercel v2 config — CORS + Cache-Control headers
  README.md          This file
```

---

## Deploy to Vercel

### Prerequisites
- Node.js 18+ installed locally
- A Vercel account (free tier works)

### Steps

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Log in to Vercel
vercel login

# 3. Navigate to the project folder
cd drdip-dashboard

# 4. Deploy to production
vercel --prod
```

Vercel will:
- Detect `api/` and deploy `kobo-proxy.js` and `kobo-media.js` as serverless functions
- Serve `index.html` as a static file at the root URL
- Provide a production URL like `https://drdip-dashboard.vercel.app`

---

## Enter Your KoboToolbox API Token

1. Open the deployed dashboard URL in your browser.
2. The **Connection Settings** modal opens automatically on first load.
3. Paste your KoboToolbox API token (from **KoboToolbox → Account Settings → API token**).
4. Leave **Asset UID** and **Server URL** at their defaults, or update if needed.
5. Click **Save & Connect**.

The token is stored only in your browser's `localStorage`. It is never written to
source code, never sent as a URL query parameter, and never logged.

---

## Use with GitHub Pages (optional)

If you want to host `index.html` on GitHub Pages while keeping the proxy on Vercel:

```bash
# Initialise git and push to GitHub
git init
git add .
git commit -m "DRDIP-II dashboard"
gh repo create mamefarah/drdip-dashboard --public --source=. --push

# Enable GitHub Pages (serves from main branch root)
gh api repos/mamefarah/drdip-dashboard/pages \
  --method POST \
  --field source[branch]=main \
  --field source[path]=/
```

Then open the dashboard on GitHub Pages, click **Settings**, and set
**Proxy Base URL** to your Vercel deployment URL, e.g.:

```
https://drdip-dashboard.vercel.app
```

Save and connect. The browser will proxy all API calls through Vercel.

---

## Test the Proxy

### Missing token (should return 401 JSON error)
```bash
curl -s https://YOUR-VERCEL-URL/api/kobo-proxy | python -m json.tool
# Expected: {"error":"Missing Authorization token"}
```

### Missing parameters (should return 400 JSON error)
```bash
curl -s https://YOUR-VERCEL-URL/api/kobo-proxy \
  -H "Authorization: Token testtoken" | python -m json.tool
# Expected: {"error":"Missing parameters: server, asset"}
```

### Valid request (replace TOKEN with your real token)
```bash
curl -s "https://YOUR-VERCEL-URL/api/kobo-proxy?server=https://kf.kobotoolbox.org&asset=aFPhq8BHNDSd2SBKUAbP4y" \
  -H "Authorization: Token TOKEN" | python -m json.tool
# Expected: {"count":882,"next":null,"results":[...]}
```

### Local development with Vercel CLI
```bash
cd drdip-dashboard
vercel dev
# Dashboard available at http://localhost:3000
```

---

## Security Rules

| Rule | Implementation |
|------|---------------|
| Token stored client-side | `localStorage` only |
| Token transmitted | `Authorization: Token …` header only |
| Token never in URLs | Proxy URLs use `?server=…&asset=…` only |
| Token never logged | No `console.log` of token anywhere |
| Token never hardcoded | No token in any source file |
| Browser never calls Kobo | Frontend fetches `/api/kobo-proxy` and `/api/kobo-media` only |
| Proxy validates token | Returns 401 JSON if header missing |
| Media domain allowlist | `kobo-media.js` only allows `*.kobotoolbox.org` |
| Cache disabled | `Cache-Control: no-store` on all API responses |

---

## Default Configuration

| Setting | Default Value |
|---------|--------------|
| Asset UID | `aFPhq8BHNDSd2SBKUAbP4y` |
| KoboToolbox Server | `https://kf.kobotoolbox.org` |
| Proxy Base URL | `window.location.origin` (auto when on Vercel) |
| Records limit | 30 000 per request |

---

## Dashboard Features

- **6 KPI cards** — submissions, completed, beneficiaries, female share, woredas, kebeles
- **Filters** — woreda, kebele, component, sub-component, work type, status, free text
- **5 tabs** — Overview, Map View, Photos, Data Table, Analytics
- **Overview charts** — status doughnut, top woredas, component pie, sub-component bar, work types
- **Leaflet map** — marker clustering, status colours, popups with photo thumbnails
- **Photos tab** — lazy-loaded grid, Load More, full-screen lightbox with keyboard navigation
- **Data table** — sortable, searchable, paginated (25 rows), CSV and JSON export
- **Analytics** — timeline, host/refugee breakdown, gender, beneficiaries by woreda, committee rates, completion rates
- **Responsive** — works on desktop, tablet, and mobile
