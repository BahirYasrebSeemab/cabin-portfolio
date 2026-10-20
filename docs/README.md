# The Cabin — Guide

Start here. Each page is short and does one job.

| I want to… | Read |
|---|---|
| Run the site on my computer | [01 · Run it locally](01-run-locally.md) |
| Put the site online / update it | [02 · Deploy to Vercel](02-deploy.md) |
| Add or edit a project, my bio, skills, contacts, resume | [03 · Edit your content](03-editing-content.md) |
| Turn on the blog, testimonials, "currently working on", easter eggs | [04 · Hidden sections](04-hidden-sections.md) |
| Add a new 3D object or hobby to the cabin | [05 · 3D objects & hobbies](05-3d-objects.md) |
| Change the jungle trees | [06 · The forest](06-forest.md) |
| Test night time, jump to a view, debug | [07 · Dev tools](07-dev-tools.md) |
| Understand which file does what | [08 · How it's built](08-how-its-built.md) |
| Something broke | [09 · Troubleshooting](09-troubleshooting.md) |
| See what's still to do | [10 · Roadmap](10-roadmap.md) |

## The 30-second version

- **Your words and links** live in `src/content/` as `.json` files. Edit them (even on github.com), push, and the site updates by itself in about a minute.
- **The 3D world** lives in `src/scene/`. You only need it to add or move objects.
- **Before every build**, `scripts/check-content.mjs` checks your content. If you make a typo, the deploy stops and tells you exactly what's wrong — the live site stays as it was.
