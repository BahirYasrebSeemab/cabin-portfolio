import { useEffect, useState, type ReactNode } from "react";
import { extras, profile, projects, skills, type Project } from "../content";
import { hourIn } from "./timeOfDay";

// The computer's screen. Everything on it comes from src/content; sections with
// no content (blog, testimonials, now, secrets, resume) simply don't appear.

type DesktopItem = { id: string; label: string; icon: string; open?: () => ReactNode; href?: string; faint?: boolean };

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

function useOwnerClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const h = hourIn(profile.timezone, now);
  return `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="chips">
      {items.map((s) => (
        <span key={s} className="chip">{s}</span>
      ))}
    </div>
  );
}

function ProjectWindow({ project: p }: { project: Project }) {
  return (
    <>
      <p className="window-lead">
        {p.summary}
        {p.status && <span className="status">{p.status}</span>}
      </p>
      {p.role && <p className="window-meta">My part: {p.role}</p>}
      {p.description.map((para) => (
        <p key={para}>{para}</p>
      ))}
      <Chips items={p.stack} />
      <div className="window-links">
        {p.links.live && <a href={p.links.live} {...external}>Open live ↗</a>}
        {p.links.code && <a href={p.links.code} {...external}>View code ↗</a>}
        {p.private && !p.links.code && <span className="window-meta">Code is private — happy to walk you through it.</span>}
      </div>
    </>
  );
}

function buildItems(): DesktopItem[] {
  const items: DesktopItem[] = projects.map((p) => ({ id: p.id, label: p.name, icon: p.icon, open: () => <ProjectWindow project={p} /> }));
  items.push({
    id: "about",
    label: "about-me.txt",
    icon: "📝",
    open: () => (
      <>
        {profile.bio.map((para) => (
          <p key={para}>{para}</p>
        ))}
        <p className="window-meta">{profile.location} · Open to: {profile.openTo}</p>
      </>
    ),
  });
  items.push({ id: "skills", label: "Skills", icon: "🧰", open: () => <Chips items={skills.work} /> });
  if (profile.resume) items.push({ id: "resume", label: "resume.pdf", icon: "📄", href: profile.resume });
  if (extras.blog.length) {
    items.push({
      id: "blog",
      label: "Blog",
      icon: "📓",
      open: () => (
        <ul className="window-list">
          {extras.blog.map((post) => (
            <li key={post.title}>
              <strong>{post.url ? <a href={post.url} {...external}>{post.title} ↗</a> : post.title}</strong>
              <span className="window-meta"> · {post.date}</span>
              {post.body && <p>{post.body}</p>}
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (extras.testimonials.length) {
    items.push({
      id: "testimonials",
      label: "Kind words",
      icon: "💬",
      open: () => (
        <ul className="window-list">
          {extras.testimonials.map((t) => (
            <li key={t.quote}>
              <p>“{t.quote}”</p>
              <span className="window-meta">— {t.name}{t.role ? `, ${t.role}` : ""}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (extras.easterEggs.length) {
    items.push({
      id: "secret",
      label: ".secret",
      icon: "🗝",
      faint: true,
      open: () => (
        <ul className="window-list">
          {extras.easterEggs.map((egg) => (
            <li key={egg.title}>
              <strong>{egg.title}</strong>
              <p>{egg.message}</p>
            </li>
          ))}
        </ul>
      ),
    });
  }
  return items;
}

const ITEMS = buildItems();

export function Desktop({ width, height }: { width: number; height: number }) {
  const [open, setOpen] = useState<DesktopItem | null>(null);
  const clock = useOwnerClock();
  const { contacts } = profile;
  return (
    <div className="desktop" style={{ width, height }}>
      <div className="desktop-icons">
        {ITEMS.map((item) =>
          item.href ? (
            <a key={item.id} className="desktop-icon" href={item.href} {...external}>
              <span className="desktop-icon-glyph">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ) : (
            <button key={item.id} className={`desktop-icon${item.faint ? " faint" : ""}`} onClick={() => setOpen(item)}>
              <span className="desktop-icon-glyph">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ),
        )}
      </div>
      <div className="desktop-notes">
        <div className="sticky-note">
          <strong>reach me</strong>
          <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
          <a href={contacts.github} {...external}>github</a>
          {contacts.linkedin && <a href={contacts.linkedin} {...external}>linkedin</a>}
          {contacts.instagram && <a href={contacts.instagram} {...external}>instagram</a>}
        </div>
        {extras.now && (
          <div className="sticky-note sticky-now">
            <strong>right now</strong>
            <span>{extras.now}</span>
          </div>
        )}
      </div>
      {open?.open && (
        <div className="desktop-window">
          <div className="desktop-window-bar">
            <span>{open.label}</span>
            <button onClick={() => setOpen(null)} aria-label="Close">✕</button>
          </div>
          <div className="desktop-window-body">{open.open()}</div>
        </div>
      )}
      <div className="taskbar">
        <span>{profile.name.split(" ")[0].toLowerCase()}-os</span>
        <span>{profile.location.split(",")[0]} {clock}</span>
      </div>
    </div>
  );
}
