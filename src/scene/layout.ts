// One source of truth for cabin dimensions (metres). The cabin's front wall
// sits on z = 0 and the room extends toward -z; x = 0 is the centre line.
export const FLOOR_Y = 0.4;
export const CABIN_W = 4.4;
export const CABIN_D = 3.8;
export const WALL_H = 2.5;
export const WALL_T = 0.2;
export const ROOF_RISE = 1.3;
export const PORCH_D = 2.0;

// Inner faces of the walls.
export const INNER = {
  left: -CABIN_W / 2 + WALL_T / 2,
  right: CABIN_W / 2 - WALL_T / 2,
  front: -WALL_T / 2,
  back: -CABIN_D + WALL_T / 2,
};

// Openings in world coordinates.
export const FRONT_WINDOW = { x0: -1.6, x1: -0.5, y0: 0.95, y1: 1.95 };
export const DOOR = { x0: 0.45, x1: 1.35, height: 2.05 };
export const SIDE_WINDOW = { z0: -1.65, z1: -0.75, y0: 0.95, y1: 1.95 };
