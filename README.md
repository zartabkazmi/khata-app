# Khata — a private, elegant expense tracker

> **This copy is pre-configured for `SyedaZartabKazmi/khata-app`.** Repo
> name, GitHub username, package ID, and the admin email are already filled
> in everywhere. Google Sign-In is intentionally left disabled for now — see
> "Part 2" below for the one manual step (Google's own console, not
> something I can do from here) whenever you're ready to add it. Until then,
> the app runs fully in local-only mode: everything works, data just stays
> on-device instead of syncing to Drive.

A fully static expense tracker. No servers, no hosting bills, no database you
have to manage. It runs entirely as files on **GitHub Pages**, and each
user's data lives in **their own Google Drive** — never on any server you own.

- Sign in with Google (free)
- Data synced to the user's own Drive `appDataFolder` (free, private, invisible in their normal Drive)
- Scan a receipt with the camera — OCR runs **on-device**, the photo is never uploaded or saved
- Dashboard, category breakdown, monthly trend, budgets
- Optional Admin panel, gated to one email address
- $0 cost, forever, at any reasonable personal-use scale

---

## 1. One-time setup (~10 minutes, no credit card)

### A. Create a free Google Cloud project
1. Go to console.cloud.google.com and sign in.
2. Click the project dropdown (top left) -> New Project -> name it `Khata` -> Create.
3. No billing account is required for anything in this app.

### B. Enable the Drive API
1. In the left menu: APIs & Services -> Library.
2. Search "Google Drive API" -> click it -> Enable.

### C. Configure the OAuth consent screen
1. APIs & Services -> OAuth consent screen.
2. User type: External -> Create.
3. Fill in app name (Khata), your email, and save through the steps (scopes and test users can be left default for personal use).
4. If you want only yourself to use it initially, add your Gmail under Test users -- this keeps it free and avoids Google's app-review process. You can add more test users any time, or publish the app later if you want anyone to sign in.

### D. Create the OAuth Client ID
1. APIs & Services -> Credentials -> Create Credentials -> OAuth client ID.
2. Application type: Web application.
3. Under Authorized JavaScript origins, add both:
   - http://localhost:5173 (for local testing)
   - https://SyedaZartabKazmi.github.io (your GitHub Pages domain -- no path, no trailing slash)
4. Create -> copy the Client ID (looks like xxxx.apps.googleusercontent.com).

That's it -- no API keys, no secrets that cost money, nothing to renew.

---

## 2. Configure the project

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   VITE_ADMIN_EMAIL=you@gmail.com   # optional -- unlocks Admin panel for this email only
   ```
3. Open `vite.config.js` and set `base` to match your GitHub repo name:
   ```js
   base: '/khata-app/',
   ```

---

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the printed localhost URL. Sign in with Google, add an expense, try the scanner.

---

## 4. Deploy to GitHub Pages (free, no other hosting)

1. Push this project to a new GitHub repository.
2. In the repo: Settings -> Pages -> Build and deployment -> Source: GitHub Actions.
3. In the repo: Settings -> Secrets and variables -> Actions -> New repository secret. Add just this one for now (skip VITE_GOOGLE_CLIENT_ID until you set up Google Sign-In later):
   - `VITE_ADMIN_EMAIL` = `askthebhai@gmail.com`
4. Push to `main`. The included workflow (`.github/workflows/deploy.yml`) builds and publishes automatically.
5. Your app will be live at `https://SyedaZartabKazmi.github.io/khata-app/`.

That URL is the one you should also add back into Authorized JavaScript origins in step 1D if you haven't already.

---

## How the "no backend" pieces work

| Need | How it's solved for free |
|---|---|
| Hosting | GitHub Pages (static files only) |
| User accounts | Google Sign-In (Google handles all auth) |
| Database / sync | Each user's own Google Drive, via the Drive API's hidden appDataFolder |
| Receipt scanning | Tesseract.js -- OCR runs in the browser via WebAssembly, image never leaves the device |
| Offline use | Everything also caches to localStorage, so the app works without a connection and syncs when back online |

---

## 5. Turning it into an Android app (APK/AAB) — fully automated

This project includes everything needed to build a real, signed Android app
from your existing website using Google's own [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
tool (Trusted Web Activity) — and a GitHub Actions workflow that does the
actual building for you. You never install Android Studio; you just click
"Run workflow" and download the files.

> **Do this after Part 4 (GitHub Pages deploy) is already live.** Bubblewrap
> downloads your icons and web manifest from the real deployed URL while
> building — it won't work against a site that isn't published yet.

### One-time setup

**A. Edit `twa-manifest.json`** (in the project root) and replace every
`SyedaZartabKazmi` with your real GitHub username, e.g.:
```json
"host": "SyedaZartabKazmi.github.io",
"startUrl": "/khata-app/",
"iconUrl": "https://SyedaZartabKazmi.github.io/khata-app/icons/icon-512.png",
```
Also change `packageId` (e.g. `com.yourname.app`) if you don't want to keep
`com.khata.expenses` — this is your app's permanent Android package name and
can't be changed later without publishing as a new app.

**B. The signing keystore.** I generated one for you (`android.keystore`),
provided separately below, along with its passwords. This keystore is the
one piece of this whole project that is genuinely irreplaceable — if you
lose it, you can never publish an update to the same app again, only a new
listing. Back it up somewhere safe (password manager, encrypted drive) the
moment you receive it.

Add three repository secrets — **Settings → Secrets and variables → Actions → New repository secret**:
| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the base64 text I gave you |
| `BUBBLEWRAP_KEYSTORE_PASSWORD` | the password I gave you |
| `BUBBLEWRAP_KEY_PASSWORD` | same password (same value, PKCS12 keystores use one password for both) |

**C. The Digital Asset Links gotcha.** For the Android app to open without
a browser address bar, Google needs to fetch a verification file from your
domain's *root* — `https://SyedaZartabKazmi.github.io/.well-known/assetlinks.json`
— not from `/khata-app/.well-known/...`. Since your app lives under a
subpath, that root file has to come from a **separate** repository:

1. Create a new GitHub repo named **exactly** `SyedaZartabKazmi.github.io` (this is GitHub's special "user site" repo name).
2. Add one file to it: `.well-known/assetlinks.json`, with this content (already generated for you at `public/.well-known/assetlinks.json` in this project — copy it over):
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.khata.expenses",
       "sha256_cert_fingerprints": ["<the fingerprint I gave you>"]
     }
   }]
   ```
3. Enable Pages on that repo too (Settings → Pages → Source: deploy from branch → `main` / root).

This is a one-time step and doesn't cost anything or require a custom domain.

### Building the APK/AAB

1. Push `twa-manifest.json`, `public/manifest.json`, and `public/icons/` to your `khata-app` repo (commit and push as normal).
2. Go to your repo's **Actions** tab → **Build Android APK & AAB** → **Run workflow**.
3. Wait a few minutes. When it finishes, open the run and download:
   - `khata-app-release.apk` — for installing directly on a test phone
   - `khata-app-release.aab` — the file the **Play Store requires**

### Publishing to the Play Store

Since you already have a developer account:
1. [Play Console](https://play.google.com/console) → **Create app** → fill in name, category, free/paid.
2. **Production → Create new release** → upload the `.aab` file downloaded above.
3. Complete the store listing (screenshots, short/full description, a privacy policy page — see note below), content rating questionnaire, and the Data Safety form (declare: uses Google Sign-In, stores data only in the user's own Drive, no data shared with third parties).
4. Submit for review.

**Privacy policy:** Play Store requires a URL to a privacy policy since the
app uses Google Sign-In. The simplest free option is a second Markdown page
published via the same GitHub Pages site (e.g. `SyedaZartabKazmi.github.io/khata-app/privacy.html`) — happy to draft the text for you if you'd like.

### Updating the app later

Bump `appVersionCode` and `appVersion` in `twa-manifest.json`, push, re-run
the workflow, and upload the new `.aab` to a new Play Console release. The
same keystore signs every version automatically since it's pulled from your
saved GitHub secret each time.

---

## Notes & honest limitations

- Admin mode is a personal view, not a multi-user backend -- since there's no server, it can only show your own signed-in account's data, not other users' data. That's intentional: it keeps everyone's data private to them.
- Receipt OCR accuracy varies by print quality and layout. The app always shows an editable review screen after scanning, rather than silently trusting what it read -- check the numbers before saving, especially on faded or handwritten receipts.
- Google's OAuth consent screen in "Testing" mode limits sign-in to test users you list (up to 100) -- fine for personal or small group use. Publishing the app for public sign-in is also free, but Google may ask you to verify the app if you request sensitive scopes (this app only uses drive.appdata, which is a low-sensitivity scope).
