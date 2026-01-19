import { useEffect, useMemo, useState } from 'react'

const colors = ['#ff8a3d', '#5de4c7', '#7c3aed', '#22d3ee', '#f472b6', '#facc15']

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

export const Fireworks = () => {
  const [particles, setParticles] = useState<{
    id: number
    x: number
    y: number
    size: number
    color: string
    delay: number
  }[]>([])

  useEffect(() => {
    const spawn = () => {
      const batch = Array.from({ length: 10 }).map((_, idx) => ({
        id: Date.now() + idx,
        x: randomInRange(15, 85),
        y: randomInRange(20, 70),
        size: randomInRange(80, 160),
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: randomInRange(0, 400),
      }))
      setParticles(batch)
    }

    spawn()
    const timer = setInterval(spawn, 700)
    return () => clearInterval(timer)
  }, [])

  const renderParticles = useMemo(
    () =>
      particles.map((p) => (
        <div
          key={p.id}
          className="firework"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            ['--size' as string]: `${p.size}px`,
            ['--color' as string]: p.color,
            animationDelay: `${p.delay}ms`,
          }}
        />
      )),
    [particles],
  )

  return <div className="fireworks-layer">{renderParticles}</div>
}
