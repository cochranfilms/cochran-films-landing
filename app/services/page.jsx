'use client'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import ServiceDetailModal from '../components/ServiceDetailModal'
import StripeCart, { addCompositeToCart } from '../components/StripeCart'
import { fetchCategoryItems } from '../lib/airtableServer'

export default function Page(){
  const [modalServiceType, setModalServiceType] = useState(null)
  const [videoItems, setVideoItems] = useState([])
  const [webItems, setWebItems] = useState([])
  const [photoItems, setPhotoItems] = useState([])
  const [brandItems, setBrandItems] = useState([])
  useEffect(() => { (async () => {
    setVideoItems(await fetchCategoryItems('Video Production', 6))
    setWebItems(await fetchCategoryItems('Web Development', 6))
    setPhotoItems(await fetchCategoryItems('Photography', 6))
    setBrandItems(await fetchCategoryItems('Brand Development', 6))
  })() }, [])
  return (
    <>
      <StripeCart />
      <section id="services" className="section">
        <div className="section-header">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">From cinematic production to web development, we deliver comprehensive creative solutions that drive results.</p>
        </div>
        <div className="services-grid">
          <div className="service-card" onClick={() => setModalServiceType('video-production')}><div className="service-icon"><i className="fas fa-video"></i></div><h3 className="service-title">Video Production</h3><p className="service-description">Professional video production including commercials, brand films, documentaries, and live event coverage.</p></div>
          <div className="service-card" onClick={() => setModalServiceType('photography')}><div className="service-icon"><i className="fas fa-camera"></i></div><h3 className="service-title">Photography</h3><p className="service-description">Live event printing, portraits, product photography, and event coverage with instant printing capabilities.</p></div>
          <div className="service-card" onClick={() => setModalServiceType('web-development')}><div className="service-icon"><i className="fas fa-code"></i></div><h3 className="service-title">Web Development</h3><p className="service-description">Custom website development and maintenance, from strategy and design to publishing and ongoing support.</p></div>
          <div className="service-card" onClick={() => setModalServiceType('brand-development')}><div className="service-icon"><i className="fas fa-palette"></i></div><h3 className="service-title">Brand Development</h3><p className="service-description">Complete brand identity development including logos, design systems, and strategic brand positioning.</p></div>
          <div className="service-card" onClick={() => setModalServiceType('white-label-services')}><div className="service-icon"><i className="fas fa-users-gear"></i></div><h3 className="service-title">White-Label Services</h3><p className="service-description">Enterprise-ready sites and systems you can deploy under your brand.</p></div>
          <div className="service-card" onClick={() => setModalServiceType('workshops-training')}><div className="service-icon"><i className="fas fa-graduation-cap"></i></div><h3 className="service-title">Workshops & Training</h3><p className="service-description">Build Your Website in Just 2 DAYS — With Expert Support Every Step of the Way.</p></div>
        </div>
      </section>

      <section id="portfolio-previews" className="section services-portfolio-section">
        <div className="section-header" style={{marginBottom:30}}>
          <h2 className="section-title">Recent Work</h2>
          <p className="section-subtitle">Live previews populated from our Airtable portfolio.</p>
        </div>
        <div className="services-portfolio-group" style={{display:'grid',gap:26}}>
          <div>
            <div className="services-portfolio-header"><h3 className="services-portfolio-title"><i className="fas fa-video" style={{color:'var(--brand-gold)'}}></i> Video Production</h3><p className="services-portfolio-subtitle">Rotates daily</p></div>
            <div className="gallery-grid" id="videoProductionGridServices">
              {videoItems.length === 0 ? skeletons() : videoItems.map((it, idx) => renderCard(it, idx))}
            </div>
          </div>
          <div>
            <div className="services-portfolio-header"><h3 className="services-portfolio-title"><i className="fas fa-code" style={{color:'var(--brand-gold)'}}></i> Web Development</h3><p className="services-portfolio-subtitle">Live links where available</p></div>
            <div className="gallery-grid" id="webDevelopmentGridServices">
              {webItems.length === 0 ? skeletons() : webItems.map((it, idx) => renderCard(it, idx))}
            </div>
          </div>
          <div>
            <div className="services-portfolio-header"><h3 className="services-portfolio-title"><i className="fas fa-camera" style={{color:'var(--brand-gold)'}}></i> Photography</h3><p className="services-portfolio-subtitle">Tap to view</p></div>
            <div className="masonry-grid" id="photographyGridServices">
              {photoItems.length === 0 ? null : photoItems.map((it, idx) => (
                <div className="masonry-item" key={idx}><img src={thumbnail(it)} alt={it.Title||'Photo'} loading="lazy" onError={(e)=> e.currentTarget.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop'} /></div>
              ))}
            </div>
          </div>
          <div>
            <div className="services-portfolio-header"><h3 className="services-portfolio-title"><i className="fas fa-palette" style={{color:'var(--brand-gold)'}}></i> Brand Development</h3><p className="services-portfolio-subtitle">Identity systems and assets</p></div>
            <div className="gallery-grid" id="brandDevelopmentGridServices">
              {brandItems.length === 0 ? skeletons() : brandItems.map((it, idx) => renderCard(it, idx))}
            </div>
          </div>
        </div>
      </section>

      {/* Airtable client script no longer needed here */}

      <ServiceDetailModal
        serviceType={modalServiceType}
        open={!!modalServiceType}
        onClose={() => setModalServiceType(null)}
        onAddToCart={(type, base, pkg, addOns) => { addCompositeToCart(type, base, pkg, addOns); setModalServiceType(null); }}
        onCheckout={(type, base, pkg, addOns) => { addCompositeToCart(type, base, pkg, addOns); setModalServiceType(null); window.dispatchEvent(new Event('cf-open-manual-checkout')); }}
      />
    </>
  )
}

function skeletons(){
  return new Array(6).fill(0).map((_,i)=>(
    <div className="cf-skel" key={i}>
      <div className="cf-skel-top"></div>
      <div className="cf-skel-body">
        <div className="cf-skel-line lg" style={{width:'70%'}}></div>
        <div className="cf-skel-line" style={{width:'45%'}}></div>
      </div>
    </div>
  ))
}

function thumbnail(it){
  return it['Thumbnail Image'] || it.thumbnailUrl || it.Image || it.image || it.thumbnail || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop'
}

function renderCard(it, idx){
  const img = thumbnail(it)
  const isVideo = !!it.playbackUrl || (it.ServiceCategory === 'Video Production')
  const isWeb = it.ServiceCategory === 'Web Development' && !!it.URL
  const icon = isVideo ? 'play' : (isWeb ? 'external-link-alt' : 'eye')
  const title = it.Title || ''
  const sub = it.Description || it['Tech Stack'] || it.Client || ''
  const date = (it.UploadDate || '').split('T')[0] || ''
  const featured = it['Is Featured'] === true || it['Is Featured'] === 'true'
  const chip = (it.RealCategory && it.RealCategory !== 'Video Production') ? it.RealCategory : (it.ServiceCategory || it.Category || '')
  return (
    <div className="cf-card" data-service-category={chip} key={idx} onClick={() => {
      if ((it.playbackUrl)) { /* future: open video modal */ }
      else if (it.URL) { window.open(it.URL,'_blank') }
    }}>
      <div className="cf-thumb">
        <img src={img} alt={title} loading="lazy" onError={(e)=> e.currentTarget.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop'} />
        {chip ? (<span className="cf-chip">{chip}</span>) : null}
        {featured ? (<span className="cf-badge" title="Featured"><i className="fas fa-star"></i></span>) : null}
        <div className="cf-action"><i className={`fas fa-${icon}`}></i></div>
      </div>
      <div className="cf-body">
        <h4 className="cf-title">{title}</h4>
        {sub ? (<p className="cf-sub">{sub}</p>) : null}
        <div className="cf-meta">
          {it.Client ? (<span className="cf-pill"><i className="fas fa-user"></i> {it.Client}</span>) : (it['Tech Stack'] ? (<span className="cf-pill"><i className="fas fa-code"></i> {it['Tech Stack']}</span>) : <span />)}
          {date ? (<span className="cf-date">{date}</span>) : <span />}
        </div>
      </div>
    </div>
  )
}
