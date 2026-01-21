import { type FC, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { type DrawingPath, type DrawingPoint } from '../../state/rooms'

const toCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>, rect: DOMRect): DrawingPoint => ({
  x: ((e.clientX - rect.left) / rect.width) * rect.width,
  y: ((e.clientY - rect.top) / rect.height) * rect.height,
})

type Props = {
  roomId: string
  paths: DrawingPath[]
  onPath: (path: DrawingPath) => void
  painterId?: string
  selfId: string
}

export const DrawingCanvas: FC<Props> = ({ paths, onPath, painterId, selfId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState<DrawingPoint[]>([])
  const [color] = useState('#ff8a3d')
  const [width] = useState(4)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      setViewport({ width: rect.width, height: rect.height })
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, viewport.width, viewport.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    paths.forEach((path) => {
      ctx.strokeStyle = path.color
      ctx.lineWidth = path.width
      ctx.beginPath()
      path.points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.stroke()
    })
  }, [paths, viewport])

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (painterId && painterId !== selfId) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const pt = toCanvasPoint(e, rect)
    setDrawing([pt])
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.length) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const pt = toCanvasPoint(e, rect)
    setDrawing((prev) => [...prev, pt])
  }

  const handlePointerUp = () => {
    if (drawing.length < 2) {
      setDrawing([])
      return
    }
    const path: DrawingPath = {
      id: nanoid(6),
      color,
      width,
      points: drawing,
    }
    onPath(path)
    setDrawing([])
  }

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  )
}
