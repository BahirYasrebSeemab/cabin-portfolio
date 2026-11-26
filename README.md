# Bahir's Cabin

**My portfolio as a place you can walk into:** a wooden cabin in a deep-green jungle. My projects
are on the computer on the desk, my hobbies are tucked in the corners, and the light follows the
real time of day in Dushanbe: morning sun, sunset, or lanterns and stars at night.

Built with React, TypeScript and Three.js (React Three Fiber), hosted on Vercel.

## What's interesting in here

- **A whole scene in the browser that still loads fast.** The jungle is baked into layered
  pictures instead of real 3D trees (millions of triangles), heavy glTF materials are simplified so
  the scene renders once per frame instead of twice, and every model and texture preloads in
  parallel.
- **Fixed viewpoints instead of free walking.** You drag to look around and click glowing objects
  to move; the camera walks through the doorway between them. It works the same with a mouse or a
  thumb, and the camera never ends up somewhere ugly.
- **Time of day from a real clock.** Sky, sun or moon, haze and every light fade smoothly between
  day, sunset and night.
- **A real web page on the 3D monitor.** The desktop on the computer screen is built from plain
  JSON (`src/content/`), checked by a script before every build, so updating the portfolio never
  means touching 3D code.
- **Dev tools for the art:** pages that bake the forest layers, and scripts that download models
  and take screenshots.

## Run it

```bash
npm install
npm run dev        # http://localhost:5174
npm run build      # checks the content, then builds to dist/
```

Everything else (deploying, adding projects, changing contacts, adding 3D objects, how the forest
is baked, troubleshooting) is in [`docs/`](docs/README.md).
