# DevEdu marketing site

A static recreation of [devedu.io](https://www.devedu.io/) — the public landing page.

```
website/
  index.html    # single-page landing (hero, features, how-it-works, FAQ, footer)
  styles.css    # DevEdu brand (pink/violet), responsive
  script.js     # mobile nav toggle + footer year
```

## Run locally

It's fully static — open `index.html`, or serve the folder:

```bash
cd website
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Deploy with GitHub Pages

This folder is the site root, and `.github/workflows/deploy.yml` publishes it to
GitHub Pages on every push to `main` (Actions-based, no build step).

**One-time setup:**

1. Create a repo (e.g. `DevEdu-IO/website`) and push this folder as the repo root:
   ```bash
   cd website
   git init && git add . && git commit -m "DevEdu marketing site"
   git branch -M main
   git remote add origin git@github.com:DevEdu-IO/website.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The `Deploy to GitHub Pages` workflow runs and publishes the site. The URL shows
   up in the workflow summary (e.g. `https://devedu-io.github.io/website/`).

**Custom domain (optional):** to serve at `www.devedu.io`, add it under
**Settings → Pages → Custom domain** (this creates a `CNAME` file), then point a
DNS `CNAME` record for `www` at `<org>.github.io`. ⚠️ This replaces whatever is
currently serving `www.devedu.io`.

`.nojekyll` is included so Pages serves the files as-is.

## Other hosts

It's plain static, so it also drops onto Netlify, S3/CloudFront, or nginx as-is.
No build step. Update copy in `index.html`; brand colors are CSS variables at the
top of `styles.css`. Login / app links point at `https://app.devedu.io/`.
