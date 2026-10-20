# 02 · Deploy to Vercel

The site is a static Vite app, so Vercel hosts it for free. Once it's connected, **every push to GitHub deploys automatically**.

## First time (about 5 minutes)

1. Go to **https://vercel.com** and sign in with GitHub.
2. Click **Add New… → Project**.
3. Pick the **`cabin-portfolio`** repository and click **Import**.
   - If you don't see it: *Adjust GitHub App Permissions* → give Vercel access to that repo (it's private).
4. Vercel detects **Vite** automatically. Check these, then click **Deploy**:
   - Framework Preset: `Vite`
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Wait ~1–2 minutes. You get a link like **`https://cabin-portfolio-xxxx.vercel.app`**.

## Updating the site

Just push to the `main` branch:

```bash
git add .
git commit -m "feat: add new project"
git push
```

Vercel builds and publishes it in about a minute. You can watch it in the Vercel dashboard → *Deployments*.

**Editing on github.com works too:** open a file in `src/content/`, click the ✏️ pencil, edit, *Commit changes*. That's a push — Vercel deploys it.

## If a deploy fails

The live site stays on the last good version — nothing breaks for visitors. Open the failed deployment in Vercel → *Build Logs*. If it says **Content check failed**, it lists the exact file and field to fix (see [03 · Edit your content](03-editing-content.md)).

## Previews

Push to any other branch (e.g. `git checkout -b try-new-look`) and Vercel gives that branch its own preview link, without touching the live site. Merge into `main` when you're happy.

## A nicer address (later)

Vercel → your project → **Settings → Domains**:
- Free: rename the project to get e.g. `bahir-cabin.vercel.app`.
- Own domain: buy one (Namecheap, Cloudflare, Porkbun…), add it here, and follow Vercel's DNS instructions.

## Without GitHub (Vercel CLI)

```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # live deploy
```

`.vercelignore` keeps the big forest-baking files out of the upload.
