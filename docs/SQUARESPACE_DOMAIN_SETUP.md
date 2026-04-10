# Connect a Squarespace-managed domain to this repository (GitHub Pages)

This repo is now configured to auto-deploy its static files to **GitHub Pages** from the `main` branch using GitHub Actions.

## Files added for this setup

- `.github/workflows/deploy-pages.yml` – deploys the repo contents to GitHub Pages on every push to `main`.
- `CNAME` – set this to your real domain (for example, `www.example.com`).
- `.nojekyll` – ensures all files/folders are served as-is.

## 1) Update the `CNAME` file in this repo

Edit `CNAME` and replace:

`YOUR_CUSTOM_DOMAIN_HERE`

with your actual domain, such as:

`www.yourdomain.com`

Commit that change.

## 2) Enable GitHub Pages in the repo settings

In your GitHub repository:

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Save.

The workflow will publish your site.

## 3) Add DNS records in Squarespace DNS

In Squarespace (domain DNS settings), point your domain to GitHub Pages:

### Recommended records

- `CNAME` record
  - Host: `www`
  - Value: `<your-github-username>.github.io`

- `A` records for root/apex (`@`)
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`

> If Squarespace DNS UI enforces different labels/hostnames, use their equivalent fields for root (`@`) and `www`.

## 4) (Optional but recommended) Redirect root to `www`

In your DNS/domain provider or forwarding settings, redirect:

- `yourdomain.com` → `www.yourdomain.com`

This avoids certificate/domain mismatch surprises.

## 5) Verify

After DNS propagates (often minutes, up to 24–48 hours):

- `https://www.yourdomain.com` should load your site.
- GitHub Pages settings should show your custom domain and HTTPS enabled.

## Notes

- If your repo default branch is not `main`, update `.github/workflows/deploy-pages.yml` trigger branch.
- Keep `CNAME` in the repository root so every deploy preserves the custom domain.
