import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { useLang } from "../../../lib/lang";
import { useAppDispatch, useAppSelector } from "../../../store";
import { faceFeatureSet } from "../../../store/editor";
import { focusCamera } from "../actions";
import { axisPosition, axisRatio, axisValue, faceAxis, type FacePlaneConfig } from "./faceLayout";

/** Sixths of the plot; the middle one is the zero axis and is drawn stronger. */
const GRID_LINES = [1, 2, 4, 5];
const EDGE = "truncate text-center text-[1.1vh] leading-[1.4] text-text-3";
const SIDE =
  "flex items-center justify-center overflow-hidden whitespace-nowrap text-[1.1vh] leading-[1.4] text-text-3 [writing-mode:vertical-rl] [transform:rotate(180deg)]";
const KEYS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };

/**
 * Two face features on one plane: dragging the dot sets both at once (x and y), the pointer is tracked 1:1,
 * double click resets to the centre, arrow keys step one unit.
 */
export function FacePlane({ plane }: { plane: FacePlaneConfig }) {
  const t = useLang();
  const dispatch = useAppDispatch();
  const features = useAppSelector((state) => state.editor.appearance?.faceFeatures);
  const plot = useRef<HTMLDivElement>(null);
  const rect = useRef<DOMRect | null>(null);

  const ax = faceAxis(plane.invertX);
  const ay = faceAxis(plane.invertY, plane.minY);
  const valueX = features?.[plane.x] ?? 0;
  const valueY = features?.[plane.y] ?? 0;
  const ratioX = axisRatio(ax, valueX);
  const ratioY = axisRatio(ay, valueY);

  const set = (id: number, current: number, value: number) => {
    if (value !== current) dispatch(faceFeatureSet({ id, value }));
  };

  const track = (event: PointerEvent<HTMLDivElement>) => {
    const r = rect.current;
    if (!r) return;
    set(plane.x, valueX, axisValue(ax, Math.min(1, Math.max(0, (event.clientX - r.left) / r.width))));
    set(plane.y, valueY, axisValue(ay, Math.min(1, Math.max(0, 1 - (event.clientY - r.top) / r.height))));
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = KEYS[event.key];
    if (!move) return;
    event.preventDefault();
    const stepX = Math.sign(ax.to - ax.from) * move[0];
    const stepY = Math.sign(ay.to - ay.from) * move[1];
    const clamp = (axis: typeof ax, v: number) => Math.min(Math.max(axis.from, axis.to), Math.max(Math.min(axis.from, axis.to), v));
    set(plane.x, valueX, clamp(ax, valueX + stepX));
    set(plane.y, valueY, clamp(ay, valueY + stepY));
  };

  return (
    <div className="grid grid-cols-[1.4vh_minmax(0,1fr)_1.4vh] gap-[0.4vh]">
      <div className="col-start-2 flex items-baseline justify-between pb-[0.4vh] text-[1.3vh]">
        <span className="font-medium text-white/90">{t(`FACE_PLANE_${plane.key}`)}</span>
        <span className="tabular-nums text-text-3">
          {axisPosition(ratioX)} · {axisPosition(ratioY)}
        </span>
      </div>
      <span className={`col-start-2 ${EDGE}`}>{t(plane.labels.top)}</span>
      <span className={`col-start-1 ${SIDE}`}>{t(plane.labels.left)}</span>
      <div
        role="group"
        tabIndex={0}
        aria-label={t(`FACE_PLANE_${plane.key}`)}
        className="relative aspect-square w-full cursor-crosshair touch-none select-none rounded-[1vh] border border-white/8 bg-white/3 transition-[border-color] duration-150 hover:border-white/20"
        onPointerDown={(event) => {
          focusCamera("face");
          rect.current = plot.current?.getBoundingClientRect() ?? null;
          event.currentTarget.setPointerCapture(event.pointerId);
          track(event);
        }}
        onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && track(event)}
        onDoubleClick={() => {
          set(plane.x, valueX, 0);
          set(plane.y, valueY, Math.max(0, plane.minY ?? 0));
        }}
        onKeyDown={onKey}
      >
        <div ref={plot} className="pointer-events-none absolute inset-[1.2vh]">
          {GRID_LINES.map((line) => (
            <span key={`v${line}`} className="absolute inset-y-0 w-px bg-white/6" style={{ left: `${(line / 6) * 100}%` }} />
          ))}
          {GRID_LINES.map((line) => (
            <span key={`h${line}`} className="absolute inset-x-0 h-px bg-white/6" style={{ top: `${(line / 6) * 100}%` }} />
          ))}
          <span className="absolute inset-y-0 left-1/2 w-px bg-white/15" />
          <span className="absolute inset-x-0 top-1/2 h-px bg-white/15" />
          <span
            className="absolute size-[1.6vh] rounded-full bg-tgi-green [box-shadow:0_0_0_0.4vh_var(--green-20)] [transform:translate(-50%,-50%)]"
            style={{ left: `${ratioX * 100}%`, top: `${(1 - ratioY) * 100}%` }}
          />
        </div>
      </div>
      <span className={`col-start-3 ${SIDE}`}>{t(plane.labels.right)}</span>
      <span className={`col-start-2 ${EDGE}`}>{t(plane.labels.bottom)}</span>
    </div>
  );
}
