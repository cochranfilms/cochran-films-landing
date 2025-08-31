'use client'

import { useEffect, useState } from 'react'
import { fetchCategoryItems } from '../lib/airtableServer'

export default function Page(){
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
      <main className="portfolio-slideshow" id="portfolioSlideshow">
        <div className="slideshow-progress" id="slideshowProgress"></div>
        <div className="floating-elements" id="floatingElements"></div>
        <div className="slideshow-track" id="slideshowTrack">
          <div className="portfolio-slide" data-category="Video Production"><div className="slide-content"><div className="slide-info"><div className="slide-category"><i className="fa-solid fa-video"></i> Video Production</div><h1 className="slide-title">Cinematic Storytelling</h1><p className="slide-description">From corporate narratives to live events, we craft visual stories that captivate audiences.</p><div className="slide-stats"><div className="stat-item"><span className="stat-number">50+</span><span className="stat-label">Projects</span></div><div className="stat-item"><span className="stat-number">2M+</span><span className="stat-label">Views</span></div><div className="stat-item"><span className="stat-number">98%</span><span className="stat-label">Client Satisfaction</span></div></div><button className="slide-cta"><span>Explore Videos</span><i className="fas fa-play"></i></button></div><div className="slide-gallery" id="videoGallery"><div className="gallery-grid" id="videoProductionGrid">{renderGrid(videoItems)}</div></div></div></div>
          <div className="portfolio-slide" data-category="Web Development"><div className="slide-content"><div className="slide-info"><div className="slide-category"><i className="fa-solid fa-code"></i> Web Development</div><h1 className="slide-title">Digital Experiences</h1><p className="slide-description">We build responsive, high-performance websites and web applications that drive results.</p><div className="slide-stats"><div className="stat-item"><span className="stat-number">25+</span><span className="stat-label">Websites</span></div><div className="stat-item"><span className="stat-number">99.9%</span><span className="stat-label">Uptime</span></div><div className="stat-item"><span className="stat-number">3s</span><span className="stat-label">Load Time</span></div></div><button className="slide-cta"><span>View Projects</span><i className="fas fa-external-link-alt"></i></button></div><div className="slide-gallery" id="webGallery"><div className="gallery-grid" id="webDevelopmentGrid">{renderGrid(webItems)}</div></div></div></div>
          <div className="portfolio-slide" data-category="Photography"><div className="slide-content"><div className="slide-info"><div className="slide-category"><i className="fa-solid fa-camera"></i> Photography</div><h1 className="slide-title">Visual Narratives</h1><p className="slide-description">Professional photography that captures the essence of your brand, events, and products.</p><div className="slide-stats"><div className="stat-item"><span className="stat-number">500+</span><span className="stat-label">Photos</span></div><div className="stat-item"><span className="stat-number">15+</span><span className="stat-label">Events</span></div><div className="stat-item"><span className="stat-number">4K</span><span className="stat-label">Resolution</span></div></div><button className="slide-cta"><span>Browse Gallery</span><i className="fas fa-images"></i></button></div><div className="slide-gallery" id="photoGallery"><div className="gallery-grid" id="photographyGrid">{renderGrid(photoItems)}</div></div></div></div>
          <div className="portfolio-slide" data-category="Brand Development"><div className="slide-content"><div className="slide-info"><div className="slide-category"><i className="fa-solid fa-palette"></i> Brand Development</div><h1 className="slide-title">Identity Systems</h1><p className="slide-description">Comprehensive brand development that builds lasting connections.</p><div className="slide-stats"><div className="stat-item"><span className="stat-number">20+</span><span className="stat-label">Brands</span></div><div className="stat-item"><span className="stat-number">100%</span><span className="stat-label">Custom</span></div><div className="stat-item"><span className="stat-number">30+</span><span className="stat-label">Assets</span></div></div><button className="slide-cta"><span>See Brands</span><i className="fas fa-paint-brush"></i></button></div><div className="slide-gallery" id="brandGallery"><div className="gallery-grid" id="brandDevelopmentGrid">{renderGrid(brandItems)}</div></div></div></div>
        </div>
      </main>
      {/* No airtable-cms.js; grids load via server fetch */}
    </>
  )
}

function renderGrid(items){
  if (!items || items.length===0){
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
  return items.map((it, idx) => {
    const img = it['Thumbnail Image'] || it.thumbnailUrl || it.Image || it.image || it.thumbnail || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop'
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
  })
}


