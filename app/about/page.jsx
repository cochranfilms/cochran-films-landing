'use client'

export default function Page(){
  return (
    <section id="about" className="section">
      <div className="section-header">
        <h2 className="section-title">About Cochran Films</h2>
        <p className="section-subtitle">At Cochran Films, we create high-quality photo and video content, paired with strategic personal brand development, to help businesses, entrepreneurs, and creatives grow their brand.</p>
      </div>
      <div className="about-content">
        <div className="about-grid">
          <div className="about-card"><div className="about-icon"><i className="fas fa-film"></i></div><h3>Story-Driven Production</h3><p>From pitch to pixels, we tie cinematic media production to full-stack systems so every story moves business outcomes. Atlanta-built, deployable anywhere.</p></div>
          <div className="about-card"><div className="about-icon"><i className="fas fa-print"></i></div><h3>Live Event Printing</h3><p>Capture the Moment. Print It Instantly. From proms to corporate events, we deliver high-quality prints on-site with our smart camera-to-printer system.</p></div>
          <div className="about-card"><div className="about-icon"><i className="fas fa-code"></i></div><h3>Web Development & Maintenance</h3><p>We don't just build beautiful websites — we help your brand grow online for the long haul. From strategy and design to publishing and upkeep.</p></div>
          <div className="about-card"><div className="about-icon"><i className="fas fa-cloud"></i></div><h3>SaaS Systems</h3><p>Modular SaaS tools and internal dashboards — authentication, billing, and automation — built to scale and deployed to your stack.</p></div>
          <div className="about-card"><div className="about-icon"><i className="fas fa-handshake"></i></div><h3>White Label Services</h3><p>Agency partnerships for production and development delivered under your brand with NDAs, shared tooling, and reliable turnaround.</p></div>
          <div className="about-card"><div className="about-icon"><i className="fas fa-pen-nib"></i></div><h3>Brand Development</h3><p>Positioning, voice, and visual systems that align media and web into a cohesive, revenue-focused brand presence.</p></div>
        </div>
      </div>
    </section>
  )
}


