import { Block, useCabinMaterials } from "./Cabin";
import { Computer } from "./Computer";
import { Bed, Lantern, MooseMount, Rug, Stove, WorldMap } from "./decor";
import { Bedroll, Bookshelf, Desk, DESK, Flute, SHELF } from "./furniture";
import { HitArea, Interactable } from "./Interactable";
import { DOOR, FLOOR_Y, INNER, SIDE_WINDOW } from "./layout";
import type { LiveLighting } from "./lighting";
import { Model } from "./Model";

export type TargetId = "door" | "porchChair" | "computer" | "bed" | "window" | "hobbies" | "chess";

export type TargetState = { enabled: boolean; label: string };

type InteriorProps = {
  live: LiveLighting;
  targets: Record<TargetId, TargetState>;
  onSelect: (id: TargetId) => void;
  screenOn: boolean;
  /** Which side of the door the visitor is on, so the fireflies gather on that side. */
  outside: boolean;
};

const DESK_POS: [number, number, number] = [-1.05, FLOOR_Y, -0.42];
const DESK_TOP = FLOOR_Y + DESK.height;
const DOOR_MID_X = (DOOR.x0 + DOOR.x1) / 2;

// Back-left corner: everything Bahir loves, tucked together.
const SHELF_POS: [number, number, number] = [INNER.left + SHELF.depth / 2, FLOOR_Y, -3.0];
const SHELF_ITEMS_Y = FLOOR_Y + SHELF.levels[3] + 0.022;
const CRATE_POS: [number, number, number] = [-0.8, FLOOR_Y, -2.95];
const CRATE_TOP = FLOOR_Y + 0.35;

function HobbyCorner({ live, chess, onChess }: { live: LiveLighting; chess: TargetState; onChess: () => void }) {
  const { trim } = useCabinMaterials();
  const shelfX = SHELF_POS[0] + 0.02;
  return (
    <group>
      <Bookshelf position={SHELF_POS} rotationY={Math.PI / 2} material={trim} />
      {/* Top shelf: camera, flute, gamepad */}
      <Model id="Camera_01" parts={["Camera_01"]} position={[shelfX, SHELF_ITEMS_Y, -3.33]} rotationY={Math.PI / 2} size={0.15} />
      <Flute position={[shelfX, SHELF_ITEMS_Y, -2.98]} rotationY={Math.PI / 2} />
      <Model id="gamepad" position={[shelfX, SHELF_ITEMS_Y, -2.68]} rotationY={Math.PI / 2 + 0.3} size={0.16} />
      <Lantern position={[shelfX, FLOOR_Y + SHELF.height, -2.75]} live={live} strength={0.6} />

      {/* Guitar leaning on the back wall */}
      <group position={[-1.55, FLOOR_Y, INNER.back + 0.16]} rotation={[-0.2, 0.35, 0.05]}>
        <Model id="Ukulele_01" position={[0, 0, 0]} height={1.05} />
      </group>

      {/* Chess on a crate */}
      <Model id="wooden_crate_01" position={CRATE_POS} />
      <Interactable label={chess.label} anchor={[CRATE_POS[0], CRATE_TOP + 0.35, CRATE_POS[2]]} enabled={chess.enabled} onSelect={onChess}>
        <Model id="chess_set" position={[CRATE_POS[0], CRATE_TOP, CRATE_POS[2]]} height={0.085} />
      </Interactable>

      {/* Football + camping gear by the bed */}
      <Model id="dirty_football" position={[-0.3, FLOOR_Y, -2.45]} height={0.22} />
      <Bedroll position={[-0.2, FLOOR_Y, -3.45]} />
      <Model id="rubber_boots" parts={["rubber_boots_l", "rubber_boots_r"]} position={[-0.2, FLOOR_Y, -3.3]} rotationY={0.4} height={0.32} />
      <Model id="hatchet" position={[-0.05, FLOOR_Y + 0.22, -3.45]} rotationY={1.2} size={0.32} />
      <Model id="vintage_flashlight" position={[CRATE_POS[0] + 0.33, CRATE_TOP, CRATE_POS[2] + 0.05]} rotationY={0.6} size={0.18} />
      <Model id="binoculars" position={[CRATE_POS[0] - 0.3, CRATE_TOP, CRATE_POS[2] - 0.02]} rotationY={-0.4} size={0.15} />
    </group>
  );
}

export function Interior({ live, targets, onSelect, screenOn, outside }: InteriorProps) {
  const { trim } = useCabinMaterials();
  const t = targets;
  return (
    <group>
      {/* Door: swung open into the room */}
      <Interactable label={t.door.label} anchor={[DOOR_MID_X, FLOOR_Y + 1.3, outside ? 0.35 : 0.25]} enabled={t.door.enabled} onSelect={() => onSelect("door")}>
        <group position={[DOOR.x1, FLOOR_Y, -0.05]} rotation={[0, -1.25, 0]}>
          <Block size={[DOOR.x1 - DOOR.x0, DOOR.height - 0.02, 0.06]} position={[-(DOOR.x1 - DOOR.x0) / 2, DOOR.height / 2, 0]} material={trim} swap />
        </group>
        <HitArea size={[DOOR.x1 - DOOR.x0, DOOR.height, 0.3]} position={[DOOR_MID_X, FLOOR_Y + DOOR.height / 2, 0]} />
      </Interactable>

      {/* Desk + computer under the front window */}
      <Desk position={DESK_POS} material={trim} />
      <Model id="dining_chair_02" position={[DESK_POS[0], FLOOR_Y, -1.02]} />
      <Interactable label={t.computer.label} anchor={[DESK_POS[0], DESK_TOP + 0.55, DESK_POS[2]]} enabled={t.computer.enabled} onSelect={() => onSelect("computer")}>
        <Computer screenOn={screenOn} position={[DESK_POS[0], DESK_TOP, DESK_POS[2]]} />
      </Interactable>
      <Lantern position={[DESK_POS[0] - 0.47, DESK_TOP, DESK_POS[2] + 0.1]} live={live} />

      {/* Side window */}
      <Interactable label={t.window.label} anchor={[INNER.left + 0.25, FLOOR_Y + 1.5, (SIDE_WINDOW.z0 + SIDE_WINDOW.z1) / 2]} enabled={t.window.enabled} onSelect={() => onSelect("window")}>
        <HitArea size={[0.1, SIDE_WINDOW.y1 - SIDE_WINDOW.y0, SIDE_WINDOW.z1 - SIDE_WINDOW.z0]} position={[INNER.left, FLOOR_Y + (SIDE_WINDOW.y0 + SIDE_WINDOW.y1) / 2, (SIDE_WINDOW.z0 + SIDE_WINDOW.z1) / 2]} />
      </Interactable>

      <Rug position={[0.2, 0, -1.8]} rotationY={Math.PI / 2} />
      <Stove position={[1.75, FLOOR_Y, -1.5]} live={live} />
      <WorldMap position={[INNER.right - 0.02, FLOOR_Y + 1.55, -0.65]} rotationY={-Math.PI / 2} />

      {/* Bed along the back wall, moose mount waiting above it */}
      <Interactable label={t.bed.label} anchor={[1.05, FLOOR_Y + 0.95, -3.2]} enabled={t.bed.enabled} onSelect={() => onSelect("bed")}>
        <Bed position={[1.05, FLOOR_Y, -3.2]} rotationY={Math.PI / 2} />
      </Interactable>
      <MooseMount position={[1.05, FLOOR_Y + 1.95, INNER.back + 0.01]} />

      <Interactable label={t.hobbies.label} anchor={[-1.2, FLOOR_Y + 1.25, -2.85]} enabled={t.hobbies.enabled} onSelect={() => onSelect("hobbies")}>
        <HobbyCorner live={live} chess={t.chess} onChess={() => onSelect("chess")} />
      </Interactable>

      {/* Porch */}
      <Interactable label={t.porchChair.label} anchor={[-1.5, FLOOR_Y + 1.0, 1.0]} enabled={t.porchChair.enabled} onSelect={() => onSelect("porchChair")}>
        <Model id="Rockingchair_01" position={[-1.5, FLOOR_Y, 1.0]} />
      </Interactable>
      <Lantern position={[1.55, FLOOR_Y, 0.35]} live={live} />
    </group>
  );
}
