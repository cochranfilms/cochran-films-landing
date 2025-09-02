'use client'

import { useEffect, useMemo } from 'react'
import { stripeServiceDatabase, getCatalogForService } from '../lib/servicesCatalog'

export default function ServiceDetailModal({ serviceType, open, onClose, onAddToCart, onCheckout }){
  const service = serviceType ? stripeServiceDatabase[serviceType] : null
  const catalog = useMemo(() => (serviceType ? getCatalogForService(serviceType) : { packages: [], addOns: [] }), [serviceType])

  useEffect(() => {
    function onKey(e){ if(e.key === 'Escape') onClose?.() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !service) return null

  return (
    <div className="service-detail-modal show" onClick={(e)=>{ if(e.target===e.currentTarget) onClose?.() }}>
      <div className="service-detail-content">
        <button className="service-detail-close" onClick={onClose}><i className="fas fa-times"></i></button>
        <div className="service-detail-header">
          <div className="service-detail-icon"><i className={service.icon}></i></div>
          <h2 className="service-detail-title">{service.name}</h2>
          <p className="service-detail-price">${service.price.toLocaleString()}</p>
          <p className="service-detail-description">{service.description}</p>
        </div>
        <div className="service-detail-body">
          <div className="service-detail-features">
            <h3>What's Included</h3>
            <ul>
              {Array.isArray(service.features) && service.features.map((f, i) => (
                <li key={i}><i className="fas fa-check"></i>{f}</li>
              ))}
            </ul>
          </div>
          {catalog.packages?.length > 0 && (
            <div style={{margin:'16px 0 10px', fontWeight:700, color:'var(--text-primary)'}}>Packages</div>
          )}
          <div id="servicePackageOptions" style={{display:'flex',flexDirection:'column',gap:10}}>
            {catalog.packages?.map((pkg, idx) => (
              <label key={pkg.id} style={{display:'flex',alignItems:'center',gap:10,padding:10,border:'1px solid rgba(148,163,184,0.25)',borderRadius:10,cursor:'pointer'}}>
                <input type="radio" name="service-package" defaultChecked={idx===0} value={pkg.id} />
                <span style={{flex:1,color:'var(--text-secondary)'}}>{pkg.name}</span>
                <span style={{color:'var(--brand-gold)',fontWeight:800}}>${pkg.price.toLocaleString()}</span>
              </label>
            ))}
          </div>

          {catalog.addOns?.length > 0 && (
            <div style={{margin:'18px 0 10px', fontWeight:700, color:'var(--text-primary)'}}>Add-ons</div>
          )}
          <div id="serviceAddOnOptions" style={{display:'flex',flexDirection:'column',gap:8}}>
            {catalog.addOns?.map((add) => (
              <label key={add.id} style={{display:'flex',alignItems:'center',gap:10,padding:10,border:'1px solid rgba(148,163,184,0.2)',borderRadius:10}}>
                <input type="checkbox" name="service-addon" value={add.id} data-price={add.price} />
                <span style={{flex:1,color:'var(--text-secondary)'}}>{add.name}</span>
                <span style={{color:'var(--brand-gold)',fontWeight:800}}>${add.price.toLocaleString()}</span>
              </label>
            ))}
          </div>

          <div className="service-detail-actions">
            <button className="service-detail-add-cart" onClick={() => { handleSubmit('cart'); if (window.cfToast) window.cfToast.push({ message: 'Added to cart!', type: 'success' }) }}>
              <i className="fas fa-cart-plus"></i>
              Add to Cart
            </button>
            <button className="service-detail-checkout" onClick={() => { handleSubmit('checkout') }}>
              <i className="fas fa-credit-card"></i>
              Checkout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  function handleSubmit(mode){
    const selectedPkgId = document.querySelector('input[name="service-package"]:checked')?.value
    const selectedPackage = catalog.packages.find(p => p.id === selectedPkgId)
    const selectedAddOns = Array.from(document.querySelectorAll('input[name="service-addon"]:checked')).map((cb) => {
      const id = cb.value
      const meta = catalog.addOns.find(a => a.id === id)
      return meta ? { id: meta.id, name: meta.name, price: meta.price } : null
    }).filter(Boolean)
    if (!selectedPackage) return
    if (mode === 'checkout') onCheckout?.(serviceType, service, selectedPackage, selectedAddOns)
    else onAddToCart?.(serviceType, service, selectedPackage, selectedAddOns)
  }
}


