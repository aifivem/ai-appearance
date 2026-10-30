import { TickLoop } from "@aicore-fivem/lib/client";
import type { CameraZone } from "common/nui";

/**
 * A framing is a camera at a local offset of the ped (x side, y front, z up) looking at a height above it;
 * `head` measures both heights from the head bone instead of the ped's root.
 */
interface Frame {
  head: boolean;
  x: number;
  y: number;
  z: number;
  look: number;
  fov: number;
}

const FRAMES: Record<CameraZone, Frame> = {
  face: { head: true, x: 0, y: 0.75, z: 0.03, look: 0, fov: 38 },
  head: { head: true, x: -0.15, y: 1.0, z: 0.1, look: 0.05, fov: 42 },
  upper: { head: false, x: -0.3, y: 1.55, z: 0.45, look: 0.25, fov: 45 },
  body: { head: false, x: -0.45, y: 2.5, z: 0.45, look: -0.1, fov: 45 },
  feet: { head: false, x: -0.3, y: 1.5, z: -0.35, look: -0.75, fov: 45 },
};

/** Share of the way the camera still has to go after one frame at 30 fps. */
const FOLLOW_PER_FRAME = 0.55;
/** Zoom n puts the camera at 1 / 2^n of its framing distance; one wheel notch (100) is a quarter step. */
const ZOOM_MIN = -0.8;
const ZOOM_MAX = 1.2;
const ZOOM_PER_NOTCH = 0.25;
/** One screen width of drag turns the ped this many degrees; one screen height moves the camera this many metres. */
const TURN_PER_SCREEN = 360;
const PAN_PER_SCREEN = 1.6;
const PAN_LIMIT = 0.8;
/** The camera stops this far in front of a wall between it and the ped. */
const WALL_GAP = 0.15;
const HEAD_BONE = 31086;

/** The editor's scripted camera: framings per body part, smooth moves, drag to turn the ped, wheel to zoom. */
export class EditorCamera {
  private cam: number | null = null;
  private ped = 0;
  private heading = 0;
  private headHeight = 0.65;
  private frame: Frame = FRAMES.body;
  private zoom = 0;
  private pan = 0;
  private current: {
    x: number;
    y: number;
    z: number;
    lx: number;
    ly: number;
    lz: number;
    fov: number;
  } | null = null;
  private readonly loop = new TickLoop(() => this.step(false));

  start(ped: number, zone: CameraZone): void {
    this.stop();
    this.ped = ped;
    this.heading = GetEntityHeading(ped);
    this.setFrame(zone);
    this.cam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true);
    this.current = null;
    this.step(true);
    SetCamActive(this.cam, true);
    RenderScriptCams(true, false, 0, true, true);
    this.loop.set(true);
  }

  stop(): void {
    this.loop.set(false);
    if (this.cam === null) return;
    RenderScriptCams(false, false, 0, true, true);
    DestroyCam(this.cam, false);
    this.cam = null;
  }

  /** Moves to a body part's framing; zoom and pan start over, the ped's turn stays. */
  focus(zone: CameraZone): void {
    if (this.cam === null || this.frame === FRAMES[zone]) return;
    this.setFrame(zone);
  }

  /** Mouse wheel: positive delta moves out. */
  zoomBy(delta: number): void {
    this.zoom = Math.min(
      ZOOM_MAX,
      Math.max(ZOOM_MIN, this.zoom - (delta / 100) * ZOOM_PER_NOTCH),
    );
  }

  /** Drag in screen fractions: sideways turns the ped, up and down move the camera. */
  drag(x: number, y: number): void {
    if (this.cam === null) return;
    SetEntityHeading(
      this.ped,
      GetEntityHeading(this.ped) + x * TURN_PER_SCREEN,
    );
    this.pan = Math.min(
      PAN_LIMIT,
      Math.max(-PAN_LIMIT, this.pan + y * PAN_PER_SCREEN * 2 ** -this.zoom),
    );
  }

  private setFrame(zone: CameraZone): void {
    this.frame = FRAMES[zone];
    this.zoom = 0;
    this.pan = 0;
    const [, , headZ] = GetPedBoneCoords(this.ped, HEAD_BONE, 0, 0, 0);
    const [, , rootZ] = GetEntityCoords(this.ped, false);
    this.headHeight = (headZ ?? 0) - (rootZ ?? 0);
  }

  private step(snap: boolean): void {
    if (this.cam === null) return;
    const f = this.frame;
    const [rx = 0, ry = 0, rz = 0] = GetEntityCoords(this.ped, false);
    const base = f.head ? this.headHeight : 0;
    const lz = rz + base + f.look + this.pan;
    const [ox = 0, oy = 0, oz = 0] = GetObjectOffsetFromCoords(
      rx,
      ry,
      rz,
      this.heading,
      f.x,
      f.y,
      base + f.z + this.pan,
    );
    const scale = 2 ** -this.zoom;
    let x = rx + (ox - rx) * scale;
    let y = ry + (oy - ry) * scale;
    let z = lz + (oz - lz) * scale;

    // Map only (flag 1): shop racks would push the camera around.
    const [, hit, end] = GetShapeTestResult(
      StartExpensiveSynchronousShapeTestLosProbe(
        rx,
        ry,
        lz,
        x,
        y,
        z,
        1,
        this.ped,
        7,
      ),
    );
    if (hit && end) {
      const full = Math.hypot(x - rx, y - ry, z - lz);
      const reach = Math.max(
        0.2,
        (Math.hypot(
          (end[0] ?? 0) - rx,
          (end[1] ?? 0) - ry,
          (end[2] ?? 0) - lz,
        ) -
          WALL_GAP) /
          full,
      );
      x = rx + (x - rx) * reach;
      y = ry + (y - ry) * reach;
      z = lz + (z - lz) * reach;
    }

    const follow =
      snap || !this.current ? 1 : 1 - FOLLOW_PER_FRAME ** (GetFrameTime() * 30);
    const c = this.current ?? { x, y, z, lx: rx, ly: ry, lz, fov: f.fov };
    c.x += (x - c.x) * follow;
    c.y += (y - c.y) * follow;
    c.z += (z - c.z) * follow;
    c.lx += (rx - c.lx) * follow;
    c.ly += (ry - c.ly) * follow;
    c.lz += (lz - c.lz) * follow;
    c.fov += (f.fov - c.fov) * follow;
    this.current = c;

    SetCamCoord(this.cam, c.x, c.y, c.z);
    PointCamAtCoord(this.cam, c.lx, c.ly, c.lz);
    SetCamFov(this.cam, c.fov);
  }
}
