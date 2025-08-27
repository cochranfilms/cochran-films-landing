'use client'

import { useMemo } from 'react'

export default function CMSGrid({ title, subtitle, items = [], layout = 'gallery', onCardClick }){
  const gridClass = layout === 'masonry' ? 'masonry-grid' : 'gallery-grid'
  const cards = useMemo(() => items.map((it, idx) => renderCard(it, idx, onCardClick)), [items, onCardClick])
  return (
    <section className="section">
      <div className="section-header" style={{marginBottom:30}}>
        <h2 className="section-title">{title}</h2>
        {subtitle ? (<p className="section-subtitle">{subtitle}</p>) : null}
      </div>
      <div className={gridClass}>
        {items.length === 0 ? skeletons() : cards}
      </div>
    </section>
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

function renderCard(it, idx, onCardClick){
  const isVideo = !!it.playbackUrl || (it.ServiceCategory === 'Video Production')
  const isWeb = it.ServiceCategory === 'Web Development' && !!it.URL
  const icon = isVideo ? 'play' : (isWeb ? 'external-link-alt' : 'eye')
  const img = it.thumbnailUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop'
  const chip = it.RealCategory || it.ServiceCategory || it.Category || ''
  const date = (it.UploadDate || '').split('T')[0] || ''
  const tags = Array.isArray(it.Tags) ? it.Tags : []
  const price = it.Price

  return (
    <div className="cf-card premium" data-service-category={chip} key={idx} onClick={() => {
      if (onCardClick) onCardClick(it)
      else if (it.playbackUrl) { window.open(it.playbackUrl,'_blank') }
      else if (it.URL) { window.open(it.URL,'_blank') }
    }}>
      <div className="cf-thumb">
        <img src={img} alt={it.Title||'Item'} loading="lazy" onError={(e)=> e.currentTarget.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop'} />
        {chip ? (<span className="cf-chip">{chip}</span>) : null}
        {it['Is Featured'] ? (<span className="cf-badge" title="Featured"><i className="fas fa-star"></i></span>) : null}
        <div className={`cf-action ${isWeb ? 'external' : ''}`}><i className={`fas fa-${icon}`}></i></div>
      </div>
      <div className="cf-body">
        <h4 className="cf-title">{it.Title}</h4>
        {it.Description ? (<p className="cf-sub">{it.Description}</p>) : null}
        <div className="cf-meta">
          {it.Client ? (<span className="cf-pill"><i className="fas fa-user"></i> {it.Client}</span>) : (it['Tech Stack'] ? (<span className="cf-pill"><i className="fas fa-code"></i> {it['Tech Stack']}</span>) : <span />)}
          {date ? (<span className="cf-date">{date}</span>) : <span />}
        </div>
        <div className="cf-tags">
          {tags.slice(0,4).map(tag => (<span className="cf-tag" key={tag}>{tag}</span>))}
          {price ? (<span className="cf-tag price">{price}</span>) : null}
        </div>
      </div>
    </div>
  )
}
