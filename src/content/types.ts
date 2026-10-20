// Shapes of the files in src/content. scripts/check-content.mjs enforces them
// before every build, so a typo fails the build instead of breaking the site.
export type Profile = {
  name: string;
  title: string;
  bio: string[];
  location: string;
  timezone: string;
  openTo: string;
  contacts: { email: string; github: string; instagram?: string; linkedin?: string };
  chessCom: string;
  /** Path under public/ (e.g. "/resume.pdf") or a URL. Empty = the resume icon is hidden. */
  resume: string;
};

export type Project = {
  id: string;
  name: string;
  icon: string;
  status?: string;
  summary: string;
  description: string[];
  stack: string[];
  role?: string;
  links: { live?: string; code?: string };
  /** Shows "code is private" instead of a code link. */
  private?: boolean;
};

export type Skills = { work: string[] };

export type BlogPost = { title: string; date: string; url?: string; body?: string };
export type Testimonial = { quote: string; name: string; role?: string };
export type EasterEgg = { title: string; message: string };

export type Extras = {
  /** "Currently working on" note. Empty = hidden. */
  now: string;
  blog: BlogPost[];
  testimonials: Testimonial[];
  easterEggs: EasterEgg[];
};
