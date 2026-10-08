import React, { useEffect, useRef } from 'react'

export const CyberCourtBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    // Mouse tracking for subtle parallax
    let mouseX = width / 2
    let mouseY = height / 2
    let targetMouseX = width / 2
    let targetMouseY = height / 2

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      targetMouseX = e.clientX - rect.left
      targetMouseY = e.clientY - rect.top
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Particle nodes
    const particleCount = 45
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: -0.3 - Math.random() * 0.6, // Drift gently upward
        size: Math.random() * 2.2 + 1,
        alpha: Math.random() * 0.7 + 0.2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        color: Math.random() > 0.3 ? '#CCFF00' : '#00F0FF',
      })
    }

    // Ground Court Grid Perspective Lines
    let gridOffset = 0

    // Animation Loop
    let lastTime = performance.now()
    const render = (time) => {
      const dt = (time - lastTime) / 1000
      lastTime = time

      // Mouse inertia damping
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      ctx.clearRect(0, 0, width, height)

      // 1. Draw 3D Perspective Cyber Court Grid
      const horizonY = height * 0.62
      const vanishX = width * 0.5 + (mouseX - width * 0.5) * 0.08
      const vanishY = horizonY - 40 + (mouseY - height * 0.5) * 0.05

      gridOffset = (gridOffset + dt * 32) % 40

      ctx.save()
      ctx.beginPath()
      ctx.rect(0, horizonY - 20, width, height - horizonY + 20)
      ctx.clip()

      // Radial gradient for court floor
      const courtGrad = ctx.createRadialGradient(
        vanishX,
        horizonY,
        10,
        vanishX,
        height,
        height * 0.8
      )
      courtGrad.addColorStop(0, 'rgba(204, 255, 0, 0.08)')
      courtGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.03)')
      courtGrad.addColorStop(1, 'rgba(9, 11, 14, 0)')
      ctx.fillStyle = courtGrad
      ctx.fillRect(0, horizonY - 20, width, height - horizonY + 20)

      // Perspective grid lines emanating from vanishing point
      const lineCount = 18
      ctx.lineWidth = 1
      for (let i = -lineCount; i <= lineCount; i++) {
        const spread = i * (width / 14)
        const startX = vanishX + spread * 0.1
        const endX = vanishX + spread * 2.4

        const alpha = Math.max(0, 0.25 - Math.abs(i) * 0.012)
        ctx.strokeStyle = i === 0 ? 'rgba(204, 255, 0, 0.45)' : `rgba(204, 255, 0, ${alpha})`

        ctx.beginPath()
        ctx.moveTo(startX, vanishY)
        ctx.lineTo(endX, height + 50)
        ctx.stroke()
      }

      // Horizontal transversal lines sweeping forward
      for (let y = 0; y < 14; y++) {
        const p = ((y * 30 + gridOffset) % (height - horizonY + 40)) / (height - horizonY + 40)
        const currentY = horizonY + Math.pow(p, 2.2) * (height - horizonY)
        const currentAlpha = Math.sin(p * Math.PI) * 0.22

        ctx.strokeStyle = `rgba(204, 255, 0, ${currentAlpha})`
        ctx.beginPath()
        ctx.moveTo(0, currentY)
        ctx.lineTo(width, currentY)
        ctx.stroke()
      }
      ctx.restore()

      // 2. Connect nearby particles with delicate neon filaments
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.16 * particles[i].alpha
            ctx.strokeStyle = `rgba(204, 255, 0, ${lineAlpha})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // 3. Render floating athletic energy particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.alpha += Math.sin(time * 0.003 + i) * 0.008

        // Wrap around borders
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10
        if (p.y < -10) {
          p.y = height + 10
          p.x = Math.random() * width
        }

        // Particle glow
        ctx.save()
        ctx.shadowBlur = 8
        ctx.shadowColor = p.color
        ctx.fillStyle = p.color === '#CCFF00'
          ? `rgba(204, 255, 0, ${Math.max(0.1, p.alpha)})`
          : `rgba(0, 240, 255, ${Math.max(0.1, p.alpha)})`

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    // Pause when tab is not active to save battery
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId)
      } else {
        lastTime = performance.now()
        animationFrameId = requestAnimationFrame(render)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Dynamic 60fps WebGL/Canvas Animation Layer */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-75"
      />

      {/* Radial Neon Atmospheric Ambient Lights */}
      <div className="absolute -top-32 left-1/4 w-[650px] h-[650px] bg-[#CCFF00]/12 rounded-full blur-[160px] animate-pulse duration-1000" />
      <div className="absolute top-1/3 -right-20 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[170px]" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-[#00F0FF]/8 rounded-full blur-[150px]" />

      {/* Cyber Grid Subtle Dot Overlay */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(204, 255, 0, 0.4) 1px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Gradient Vignette so hero copy remains razor sharp */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090B0E]/40 via-transparent to-[#090B0E]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#090B0E_95%)]" />
    </div>
  )
}

export default CyberCourtBackground
