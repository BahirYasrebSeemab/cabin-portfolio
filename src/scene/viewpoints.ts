export { FLOOR_Y } from "./layout";

export type ViewpointId = "porch" | "chair" | "inside" | "desk" | "bed" | "window" | "hobbies";

export type Viewpoint = {
  id: ViewpointId;
  position: [number, number, number];
  lookAt: [number, number, number];
  back?: ViewpointId;
  backLabel?: string;
};

export const VIEWPOINTS: Record<ViewpointId, Viewpoint> = {
  // Standing on the ground at "8 o'clock" from the door: front-left of the cabin.
  porch: { id: "porch", position: [-4.3, 1.7, 4.4], lookAt: [0.2, 1.5, 0.3] },
  chair: { id: "chair", position: [-1.5, 1.55, 1.1], lookAt: [-1.6, 1.35, 12], back: "porch", backLabel: "Stand up" },
  // Just inside the door, looking across to the hobby corner.
  inside: { id: "inside", position: [0.6, 1.95, -0.95], lookAt: [-0.9, 1.2, -3.0], back: "porch", backLabel: "Step outside" },
  desk: { id: "desk", position: [-1.05, 1.6, -1.15], lookAt: [-1.05, 1.3, 0], back: "inside" },
  bed: { id: "bed", position: [1.2, 1.45, -3.1], lookAt: [-1.2, 1.3, -0.5], back: "inside" },
  window: { id: "window", position: [-1.5, 1.95, -1.2], lookAt: [-12, 1.8, -1.2], back: "inside" },
  hobbies: { id: "hobbies", position: [0.3, 1.75, -1.5], lookAt: [-1.5, 1.0, -3.3], back: "inside" },
};

export const INSIDE_VIEWS: ViewpointId[] = ["inside", "desk", "bed", "window", "hobbies"];
export const DOORWAY: [number, number, number] = [0.9, 1.95, 1.4];
