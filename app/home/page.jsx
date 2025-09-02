'use client'
import Link from 'next/link'

export default function Page(){
  return (
    <section id="home" className="section hero">
      <h1 className="hero-title">STORIES THAT TELL THEMSELVES</h1>
      <p className="hero-subtitle">Through a data-driven Content Strategy and Omnichannel Marketing approach, we ensure your visuals aren't just seen—they convert across all platforms.</p>

      <div className="hero-value-props" style={{margin: '40px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto'}}>
        <div className="hero-value-card" style={{background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 24, textAlign: 'center', backdropFilter: 'blur(12px)'}}>
          <div style={{width:60,height:60,margin:'0 auto 16px',borderRadius:16,background:'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(255,178,0,0.3))',display:'grid',placeItems:'center',fontSize:24,color:'var(--brand-gold)'}}><i className="fas fa-rocket"></i></div>
          <h3 style={{margin:'0 0 12px',fontSize:18,fontWeight:800,color:'var(--text-primary)'}}>2025 Production Innovation</h3>
          <p style={{margin:0,color:'var(--text-secondary)',fontSize:14,lineHeight:1.5}}>AI-powered editing workflows, 8K HDR mastering, and real-time collaboration tools that keep you ahead of the curve.</p>
        </div>
        <div className="hero-value-card" style={{background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, padding: 24, textAlign: 'center', backdropFilter: 'blur(12px)'}}>
          <div style={{width:60,height:60,margin:'0 auto 16px',borderRadius:16,background:'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(255,178,0,0.3))',display:'grid',placeItems:'center',fontSize:24,color:'var(--brand-gold)'}}><i className="fas fa-code"></i></div>
          <h3 style={{margin:'0 0 12px',fontSize:18,fontWeight:800,color:'var(--text-primary)'}}>Full-Stack Development</h3>
          <p style={{margin:0,color:'var(--text-secondary)',fontSize:14,lineHeight:1.5}}>Modern React/Next.js, AI integration, and cloud-native architectures that scale with your business growth.</p>
        </div>
        <div className="hero-value-card" style={{background: 'rgba(255,178,0,0.1)', border: '1px solid rgba(255,178,0,0.3)', borderRadius: 16, padding: 24, textAlign: 'center', backdropFilter: 'blur(12px)'}}>
          <div style={{width:60,height:60,margin:'0 auto 16px',borderRadius:16,background:'linear-gradient(135deg, rgba(255,178,0,0.3), rgba(99,102,241,0.3))',display:'grid',placeItems:'center',fontSize:24,color:'var(--brand-gold)'}}><i className="fas fa-users"></i></div>
          <h3 style={{margin:'0 0 12px',fontSize:18,fontWeight:800,color:'var(--text-primary)'}}>Creator Platform</h3>
          <p style={{margin:0,color:'var(--text-secondary)',fontSize:14,lineHeight:1.5}}>Streamlined onboarding, analytics dashboards, and automated workflows that empower your creative team.</p>
        </div>
      </div>

      <div className="hero-cta-section" style={{marginTop:40}}>
        <Link href="/book.html" className="hero-cta"><i className="fas fa-rocket"></i> Book Your Services</Link>
        <p style={{margin:'20px 0 0', color:'var(--text-muted)', fontSize:14, fontWeight:600}}>
          <i className="fas fa-clock"></i> Average response time: 2 hours | <i className="fas fa-star"></i> 98% client satisfaction rate
        </p>
      </div>
    </section>
  )
}


