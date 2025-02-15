"use client"

import { useEffect, useRef } from "react"

export function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const setSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setSize()
    window.addEventListener("resize", setSize)

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "#000000")
    gradient.addColorStop(1, "#1a1a1a")

    // Animation variables
    let time = 0
    const draw = () => {
      time += 0.005

      // Clear canvas and apply gradient
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw neon glow (updated to yellow)
      const glowRadius = 300
      const glowGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        glowRadius,
      )
      glowGradient.addColorStop(0, "rgba(250, 197, 55, 0.1)") // Yellow (#fac537) with 10% opacity
      glowGradient.addColorStop(1, "transparent")

      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener("resize", setSize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" style={{ background: "black" }} />
}