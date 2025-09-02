'use client'

import { useMemo, useState } from 'react'
import VideoModal from './VideoModal'

export default function CMSGrid({ title, subtitle, items = [], layout = 'gallery', onCardClick }){
  const gridClass = 'premium-grid'
  const cards = useMemo(() => items.map((it, idx) => renderPremiumCard(it, idx, onCardClick)), [items, onCardClick])
  const [modal, setModal] = useState({ open: false, title: '', url: '' })
  return (
    <section className="portfolio-category-section premium">
      <div className="category-header">
        <div className="category-title">
          <span className="icon-wrapper"><i className="fas fa-sparkles"></i></span>
          <span className="title-text">{title}</span>
        </div>
        {subtitle ? (<p className="category-description">{subtitle}</p>) : null}
      </div>
      <div className={gridClass}>
        {items.length === 0 ? premiumSkeletons() : items.map((it, idx) => renderPremiumCard(it, idx, (clicked)=>{
          if (clicked.playbackUrl){ setModal({ open: true, title: clicked.Title||'', url: clicked.playbackUrl }) }
          else if (onCardClick) onCardClick(clicked)
          else if (clicked.URL) window.open(clicked.URL,'_blank')
        }))}
      </div>
      <div className="portfolio-actions">
        <a className="premium-btn" href="#" onClick={(e)=>e.preventDefault()}>
          <span className="btn-text">Explore More</span>
          <i className="fas fa-arrow-down"></i>
        </a>
      </div>
      <VideoModal open={modal.open} onClose={()=>setModal({ open:false, title:'', url:'' })} title={modal.title} playbackUrl={modal.url} />
    </section>
  )
}

function premiumSkeletons(){
  return new Array(6).fill(0).map((_,i)=>(
    <div className="portfolio-item loading" key={i}></div>
  ))
}

function renderPremiumCard(it, idx, onCardClick){
  const isVideo = !!it.playbackUrl || (it.ServiceCategory === 'Video Production')
  const isWeb = it.ServiceCategory === 'Web Development' && !!it.URL
  const icon = isVideo ? 'play' : (isWeb ? 'external-link-alt' : 'eye')
  const img = it.thumbnailUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop'
  const chip = it.RealCategory || it.ServiceCategory || it.Category || ''
  const date = (it.UploadDate || '').split('T')[0] || ''
  const sub = it.Description || it['Tech Stack'] || it.Client || ''

  return (
    <article className="portfolio-item" key={idx} onClick={() => onCardClick?.(it)}>
      <div className="portfolio-item-media">
        <img src={img} alt={it.Title||'Item'} loading="lazy" onError={(e)=> e.currentTarget.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop'} />
        {isVideo ? (<div className="video-play-button"><i className="fas fa-play"></i></div>) : null}
      </div>
      <div className="portfolio-item-content">
        <h4 className="portfolio-item-title">{it.Title}</h4>
        {sub ? (<p className="portfolio-item-description">{sub}</p>) : null}
        <div className="portfolio-item-meta">
          <span className="portfolio-item-category"><i className="fas fa-layer-group"></i> {chip}</span>
          {date ? (<span className="portfolio-item-date">{date}</span>) : <span />}
        </div>
      </div>
    </article>
  )
}
