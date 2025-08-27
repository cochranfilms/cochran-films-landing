'use client'

import { useEffect, useRef } from 'react'

export default function AINeuralBackground(){
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const particlesRef = useRef([])
  const connectionsRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    function getRandomAIColor(){
      const colors = ['rgba(6, 182, 212, 0.6)','rgba(20, 184, 166, 0.6)','rgba(124, 58, 237, 0.6)','rgba(99, 102, 241, 0.6)','rgba(255, 178, 0, 0.6)']
      return colors[Math.floor(Math.random()*colors.length)]
    }
    function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy) }

    function createParticles(){
      particlesRef.current = []
      const n = 100
      for (let i=0;i<n;i++){
        particlesRef.current.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3, size: Math.random()*2+1, color: getRandomAIColor(), pulse: Math.random()*Math.PI*2 })
      }
    }
    function createConnections(){
      connectionsRef.current = []
      const d = 120
      const P = particlesRef.current
      for (let i=0;i<P.length;i++) for (let j=i+1;j<P.length;j++){ const m = dist(P[i],P[j]); if (m<d) connectionsRef.current.push({ from:i, to:j, strength: 1-(m/d), pulse: Math.random()*Math.PI*2 }) }
    }

    function update(){
      const P = particlesRef.current
      for (const p of P){
        p.x += p.vx; p.y += p.vy
        if (p.x<=0 || p.x>=canvas.width) p.vx *= -1
        if (p.y<=0 || p.y>=canvas.height) p.vy *= -1
        p.pulse += 0.02
        const m = mouseRef.current
        const dx = m.x - p.x, dy = m.y - p.y
        const md = Math.sqrt(dx*dx+dy*dy)
        if (md < 150){ const a=Math.atan2(dy,dx); const f=(150-md)/150; p.vx += Math.cos(a)*f*0.01; p.vy += Math.sin(a)*f*0.01 }
        p.vx *= 0.99; p.vy *= 0.99
      }
    }
    function draw(){
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)'
      ctx.fillRect(0,0,canvas.width,canvas.height)
      for (const c of connectionsRef.current){ const a=particlesRef.current[c.from], b=particlesRef.current[c.to]; if(!a||!b) continue; const alpha=0.3+Math.sin(c.pulse)*0.2; ctx.strokeStyle = `rgba(99, 102, 241, ${alpha*c.strength})`; ctx.lineWidth = 1*c.strength; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); c.pulse+=0.01 }
      for (const p of particlesRef.current){ const alpha = 0.6 + Math.sin(p.pulse)*0.4; ctx.fillStyle = p.color.replace('0.6)', `${alpha})`); ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill() }
    }
    function animate(){ update(); draw(); rafRef.current = requestAnimationFrame(animate) }

    resize(); createParticles(); createConnections();
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', (e)=>{ mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY })
    animate()
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <div className="ai-background" style={{position:'fixed',inset:0,zIndex:-1,overflow:'hidden'}}>
      <canvas ref={canvasRef} id="neuralCanvas" style={{width:'100%',height:'100%',display:'block'}} />
    </div>
  )
}


