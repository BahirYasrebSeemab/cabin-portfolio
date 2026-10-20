import extrasJson from "./extras.json";
import profileJson from "./profile.json";
import projectsJson from "./projects.json";
import skillsJson from "./skills.json";
import type { Extras, Profile, Project, Skills } from "./types";

export type * from "./types";

export const profile = profileJson as Profile;
export const projects = projectsJson as Project[];
export const skills = skillsJson as Skills;
export const extras = extrasJson as Extras;
