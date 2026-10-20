# 04 · Hidden sections (appear when you add content)

These live in `src/content/extras.json`. **While a section is empty, it doesn't exist on the site.** Add content and it appears on the computer desktop on the next deploy.

```json
{
  "now": "",
  "blog": [],
  "testimonials": [],
  "easterEggs": []
}
```

## Currently working on → a green sticky note

```json
"now": "Building a browser extension for my password manager."
```

Set it back to `""` to remove the note.

## Blog → a "Blog" icon

Each post needs a `title` and `date`, plus either a `url` (link to Medium, dev.to, your own page…) or a `body` (short text shown right there):

```json
"blog": [
  { "title": "What I learned building a lockdown OS", "date": "2026-11-02", "url": "https://dev.to/bahir/..." },
  { "title": "Why I moved to Bun", "date": "2026-12-10", "body": "Short version: install times." }
]
```

Newest first is a good habit — posts show in file order.

## Testimonials → a "Kind words" icon

```json
"testimonials": [
  { "quote": "Bahir shipped the backend in a week and it never went down.", "name": "Ali K.", "role": "Team lead, Karevan" }
]
```

`role` is optional. Only add quotes people agreed to share.

## Easter eggs → a faint ".secret" icon

```json
"easterEggs": [
  { "title": "You found it", "message": "Ask me about the moose." }
]
```

The icon is see-through on purpose — for people who look closely.
