# 03 · Edit your content

All your words and links are in **`src/content/`**. You never need to touch code to change them.

| File | What's in it |
|---|---|
| `profile.json` | Name, title, bio, location, time zone, contacts, chess.com, resume |
| `projects.json` | The project icons on the computer desktop |
| `skills.json` | The "Skills" window |
| `extras.json` | Blog, testimonials, "currently working on", easter eggs — see [04](04-hidden-sections.md) |

After editing, run `npm run check` (or just push — the build checks it for you).

## JSON in 60 seconds

- Text goes in **double quotes**: `"like this"`.
- Items in a list or object are separated by **commas** — but **no comma after the last one**.
- Lists use `[ ]`, objects use `{ }`.
- Links must start with `https://`.

If you break one of these rules, the check tells you which file and which line.

## Add a project

Open `src/content/projects.json` and add a new block inside the `[ ]` list (put a comma after the previous `}`):

```json
{
  "id": "weather-app",
  "name": "Weather App",
  "icon": "🌦️",
  "status": "Live",
  "summary": "One sentence that says what it is.",
  "description": [
    "A first paragraph: what it does and who it's for.",
    "A second paragraph: the interesting technical part."
  ],
  "stack": ["React", "TypeScript", "Supabase"],
  "role": "Frontend",
  "links": {
    "live": "https://weather-app.vercel.app",
    "code": "https://github.com/BahirYasrebSeemab/weather-app"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | ✅ | lowercase, numbers, dashes; must be unique |
| `name` | ✅ | shown under the icon |
| `icon` | ✅ | any emoji |
| `summary` | ✅ | one line, shown in bold at the top of the window |
| `description` | ✅ | list of paragraphs |
| `stack` | ✅ | list of technologies (shown as chips) |
| `status` | — | small badge, e.g. `"In progress"`, `"Live"` |
| `role` | — | for team projects: what *you* did |
| `links.live` / `links.code` | — | leave out any you don't have; `"links": {}` is fine |
| `private` | — | `true` shows "Code is private — happy to walk you through it" instead of a code link |

**Order:** icons appear in the same order as in the file. Move a block up to show it first.
**Remove a project:** delete its `{ … }` block (and the comma before it).

## Bio, title, location

In `profile.json`:
- `"title"` — shown under your name in the top-left corner.
- `"bio"` — a list of paragraphs, shown in `about-me.txt` on the desktop.
- `"openTo"` — shown at the bottom of the bio.
- `"timezone"` — the cabin's day/night follows this clock. Use a name from https://en.wikipedia.org/wiki/List_of_tz_database_time_zones (e.g. `"Europe/Berlin"`; `"Etc/GMT-5"` means UTC+5, the sign is flipped). Change it when you travel!

## Contacts

`profile.json` → `"contacts"`. These appear on the yellow sticky note.
- `email` — required.
- `github`, `linkedin`, `instagram` — full links; set one to `""` to hide it.
- **There is deliberately no phone field.** Don't add your number — the site is public.

> ⚠️ Double-check the LinkedIn link: it's set to `linkedin.com/in/bahir-yasreb-seemab`, which you said you *think* is right.

## Resume

1. Put the PDF in **`public/`**, e.g. `public/resume.pdf`.
2. In `profile.json` set `"resume": "/resume.pdf"`.

A `resume.pdf` icon appears on the desktop and opens the file. If the file is missing, the check fails and tells you. Leave `"resume": ""` to hide the icon.

## Skills

`skills.json` → `"work"` is the list shown in the Skills window. Hobby skills (guitar, flute…) are shown as objects in the cabin instead.

## Chess link

`profile.json` → `"chessCom"`. Clicking the chess board in the hobby corner opens it.
