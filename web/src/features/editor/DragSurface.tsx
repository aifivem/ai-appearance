import { useRef } from "react"
import { fetchNui } from "fivem-nui-react"
import { NuiCallback } from "../../../../resource/common/nui"

/** The game view: drag turns the ped and moves the camera (sent once per animation frame), the wheel zooms. */
export function DragSurface() {
  const last = useRef<{ x: number; y: number } | null>(null)
  const sum = useRef({ x: 0, y: 0 })
  const frame = useRef<number | null>(null)

  const flush = () => {
    frame.current = null
    const { x, y } = sum.current
    sum.current = { x: 0, y: 0 }
    if (x || y)
      void fetchNui<boolean>(NuiCallback.drag, { x, y }, { mockData: true })
  }

  return (
    <div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        last.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerMove={(event) => {
        if (!last.current) return
        sum.current.x += (event.clientX - last.current.x) / window.innerWidth
        sum.current.y += (event.clientY - last.current.y) / window.innerHeight
        last.current = { x: event.clientX, y: event.clientY }
        frame.current ??= requestAnimationFrame(flush)
      }}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
      onWheel={(event) =>
        void fetchNui<boolean>(NuiCallback.zoom, event.deltaY, {
          mockData: true,
        })
      }
    />
  )
}
