// Checks src/content/*.json before every build. A mistake (missing comma, wrong
// field, bad link) stops the build with a clear message, so Vercel keeps the
// last good version online instead of publishing a broken site.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const contentDir = join(root, "src/content");
const errors = [];

function load(file) {
  const path = join(contentDir, file);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    errors.push(`${file}: not valid JSON — ${e.message}`);
    return null;
  }
}

const isText = (v) => typeof v === "string" && v.trim().length > 0;
const isUrl = (v) => typeof v === "string" && /^https?:\/\/\S+$/.test(v);
const isTextList = (v) => Array.isArray(v) && v.every(isText);

function need(cond, where, message) {
  if (!cond) errors.push(`${where}: ${message}`);
}

// profile.json
const profile = load("profile.json");
if (profile) {
  for (const key of ["name", "title", "location", "timezone", "openTo"]) need(isText(profile[key]), "profile.json", `"${key}" must be text`);
  need(isTextList(profile.bio) && profile.bio.length > 0, "profile.json", `"bio" must be a list of paragraphs`);
  need(isText(profile.contacts?.email) && profile.contacts.email.includes("@"), "profile.json", `"contacts.email" must be an email address`);
  for (const key of ["github", "instagram", "linkedin"]) {
    const v = profile.contacts?.[key];
    need(v === undefined || v === "" || isUrl(v), "profile.json", `"contacts.${key}" must be a full https:// link (or empty)`);
  }
  need(isUrl(profile.chessCom), "profile.json", `"chessCom" must be a full https:// link`);
  if (isText(profile.resume) && profile.resume.startsWith("/")) {
    need(existsSync(join(root, "public", profile.resume)), "profile.json", `"resume" points to ${profile.resume} but public${profile.resume} doesn't exist`);
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: profile.timezone });
  } catch {
    errors.push(`profile.json: "timezone" ${profile.timezone} isn't a real time zone (e.g. "Europe/Berlin")`);
  }
}

// projects.json
const projects = load("projects.json");
if (projects) {
  need(Array.isArray(projects), "projects.json", "must be a list [ ... ] of projects");
  const ids = new Set();
  (Array.isArray(projects) ? projects : []).forEach((p, i) => {
    const where = `projects.json #${i + 1}${isText(p?.name) ? ` (${p.name})` : ""}`;
    need(isText(p?.id) && /^[a-z0-9-]+$/.test(p.id), where, `"id" must be lowercase letters, numbers and dashes`);
    need(!ids.has(p?.id), where, `"id" "${p?.id}" is used twice`);
    ids.add(p?.id);
    for (const key of ["name", "icon", "summary"]) need(isText(p?.[key]), where, `"${key}" must be text`);
    need(isTextList(p?.description), where, `"description" must be a list of paragraphs`);
    need(isTextList(p?.stack), where, `"stack" must be a list of text`);
    need(typeof p?.links === "object" && p.links !== null, where, `"links" must be { } (it can be empty)`);
    for (const key of ["live", "code"]) need(p?.links?.[key] === undefined || isUrl(p.links[key]), where, `"links.${key}" must be a full https:// link`);
    need(p?.private === undefined || typeof p.private === "boolean", where, `"private" must be true or false`);
  });
}

// skills.json
const skills = load("skills.json");
if (skills) need(isTextList(skills.work), "skills.json", `"work" must be a list of text`);

// extras.json
const extras = load("extras.json");
if (extras) {
  need(typeof extras.now === "string", "extras.json", `"now" must be text (use "" to hide it)`);
  for (const key of ["blog", "testimonials", "easterEggs"]) need(Array.isArray(extras[key]), "extras.json", `"${key}" must be a list (use [] to hide it)`);
  (extras.blog ?? []).forEach((b, i) => {
    need(isText(b?.title) && isText(b?.date), `extras.json blog #${i + 1}`, `needs "title" and "date"`);
    need(b?.url === undefined || isUrl(b.url), `extras.json blog #${i + 1}`, `"url" must be a full https:// link`);
    need(isText(b?.url) || isText(b?.body), `extras.json blog #${i + 1}`, `needs a "url" or a "body"`);
  });
  (extras.testimonials ?? []).forEach((t, i) => need(isText(t?.quote) && isText(t?.name), `extras.json testimonial #${i + 1}`, `needs "quote" and "name"`));
  (extras.easterEggs ?? []).forEach((e, i) => need(isText(e?.title) && isText(e?.message), `extras.json easter egg #${i + 1}`, `needs "title" and "message"`));
}

if (errors.length) {
  console.error(`\nContent check failed (${errors.length} problem${errors.length > 1 ? "s" : ""}):\n`);
  for (const e of errors) console.error("  ✗ " + e);
  console.error("\nFix these in src/content and try again. See docs/03-editing-content.md.\n");
  process.exit(1);
}
console.log("✓ content looks good");
