import { profile } from "../content";

export type TimeMode = "live" | "day" | "sunset" | "night";
export type Phase = "day" | "sunset" | "night";

export type Lighting = {
  envIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  fireIntensity: number;
  lanternIntensity: number;
  stars: boolean;
  skyTop: string;
  skyHorizon: string;
  fogColor: string;
  fogDensity: number;
  /** Multiplies the painted forest layers, so they darken and cool with the light. */
  forestTint: string;
};

export const LIGHTING: Record<Phase, Lighting> = {
  day: {
    envIntensity: 0.9,
    sunColor: "#fff1da",
    sunIntensity: 2.4,
    sunPosition: [-12, 18, 10],
    fireIntensity: 3,
    lanternIntensity: 0.5,
    stars: false,
    skyTop: "#5d93d1",
    skyHorizon: "#9fbf9a",
    fogColor: "#4c6e47",
    fogDensity: 0.022,
    forestTint: "#c4d9bc",
  },
  sunset: {
    envIntensity: 0.45,
    sunColor: "#ff9a50",
    sunIntensity: 1.7,
    sunPosition: [-20, 4, 6],
    fireIntensity: 7,
    lanternIntensity: 2.2,
    stars: false,
    skyTop: "#34477e",
    skyHorizon: "#f0a067",
    fogColor: "#7f6f5f",
    fogDensity: 0.026,
    forestTint: "#9a8a6a",
  },
  night: {
    envIntensity: 0.06,
    sunColor: "#9fb6ff",
    sunIntensity: 0.22,
    sunPosition: [10, 16, -8],
    fireIntensity: 12,
    lanternIntensity: 4,
    stars: true,
    skyTop: "#040815",
    skyHorizon: "#112036",
    fogColor: "#0b1620",
    fogDensity: 0.03,
    forestTint: "#2c4060",
  },
};

// Light follows the owner's local time (profile.json "timezone").
export const OWNER_TIMEZONE = profile.timezone;

export function hourIn(timeZone: string, date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 12);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour + minute / 60;
}

export function phaseForHour(hour: number): Phase {
  if (hour >= 7 && hour < 17.5) return "day";
  if ((hour >= 17.5 && hour < 19.5) || (hour >= 5.5 && hour < 7)) return "sunset";
  return "night";
}

export function resolvePhase(mode: TimeMode): Phase {
  return mode === "live" ? phaseForHour(hourIn(OWNER_TIMEZONE)) : mode;
}
