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
        </div>
      </div>
    </section>
  )
}


