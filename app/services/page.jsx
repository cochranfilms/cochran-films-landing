'use client'
import { useEffect, useState } from 'react'
import ServiceDetailModal from '../components/ServiceDetailModal'
import StripeCart, { addCompositeToCart } from '../components/StripeCart'
import CMSGrid from '../components/CMSGrid'
import { fetchCategoryItemsNormalized } from '../lib/airtableServer'

export default function Page(){
  const [modalServiceType, setModalServiceType] = useState(null)
  const [videoItems, setVideoItems] = useState([])
  const [webItems, setWebItems] = useState([])
  const [photoItems, setPhotoItems] = useState([])
  const [brandItems, setBrandItems] = useState([])
  useEffect(() => { (async () => {
    setVideoItems(await fetchCategoryItemsNormalized('Video Production', 6))
    setWebItems(await fetchCategoryItemsNormalized('Web Development', 6))
    setPhotoItems(await fetchCategoryItemsNormalized('Photography', 6))
    setBrandItems(await fetchCategoryItemsNormalized('Brand Development', 6))
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

      <section id="portfolio-previews" className="section services-portfolio-section" style={{paddingTop:0}}>
        <CMSGrid title="Video Production" subtitle="Rotates daily" items={videoItems} layout="gallery" />
        <CMSGrid title="Web Development" subtitle="Live links where available" items={webItems} layout="gallery" />
        <CMSGrid title="Photography" subtitle="Tap to view" items={photoItems} layout="masonry" />
        <CMSGrid title="Brand Development" subtitle="Identity systems and assets" items={brandItems} layout="gallery" />
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

// old renderers removed; using CMSGrid
