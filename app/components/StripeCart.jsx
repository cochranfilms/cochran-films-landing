'use client'

import { useEffect, useState } from 'react'
import emailjs from '@emailjs/browser'

export default function StripeCart(){
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    window.stripeCart = window.stripeCart || { items: [], total: 0 }
    update()
    function onCartChange(){ update() }
    window.addEventListener('cf-cart-change', onCartChange)
    return () => window.removeEventListener('cf-cart-change', onCartChange)
  }, [])

  function update(){
    if (typeof window === 'undefined') return
    const cart = window.stripeCart
    const t = (cart.items || []).reduce((s, it) => s + it.price * it.quantity, 0)
    cart.total = t
    setItems([...(cart.items || [])])
    setTotal(t)
  }

  function remove(id){
    window.stripeCart.items = (window.stripeCart.items || []).filter(it => it.id !== id)
    dispatch()
  }
  function clear(){
    window.stripeCart.items = []
    dispatch()
  }
  function dispatch(){
    window.dispatchEvent(new Event('cf-cart-change'))
  }

  return (
    <>
      <button className="stripe-cart-toggle" onClick={() => setOpen(!open)}>
        <i className="fas fa-shopping-cart"></i>
        <span className="stripe-cart-count" style={{display: items.reduce((s,i)=>s+i.quantity,0) > 0 ? 'flex' : 'none'}}>{items.reduce((s,i)=>s+i.quantity,0)}</span>
      </button>
      <div className={`stripe-cart ${open ? 'show' : ''}`} onClick={(e)=>{ if(e.target===e.currentTarget) setOpen(false) }}>
        <div className="stripe-cart-header">
          <h3>Shopping Cart</h3>
          <button className="stripe-cart-close" onClick={() => setOpen(false)}><i className="fas fa-times"></i></button>
        </div>
        <div className="stripe-cart-items">
          {items.length === 0 ? (
            <p style={{textAlign:'center', color:'var(--text-secondary)', padding:20}}>Your cart is empty</p>
          ) : items.map(item => (
            <div className="stripe-cart-item" key={item.id}>
              <div className="stripe-cart-item-info">
                <h4>{item.name}</h4>
                <p>Qty: {item.quantity} × ${item.price}</p>
              </div>
              <div className="stripe-cart-item-price">${(item.price * item.quantity).toLocaleString()}</div>
              <button className="stripe-cart-item-remove" onClick={() => remove(item.id)}><i className="fas fa-times"></i></button>
            </div>
          ))}
        </div>
        <div className="stripe-cart-footer">
          <div className="stripe-cart-total">
            <span className="stripe-cart-total-label">Total:</span>
            <span className="stripe-cart-total-amount">${total.toLocaleString()}</span>
          </div>
          <div className="stripe-cart-actions">
            <button className="stripe-cart-checkout" onClick={handleCheckout}><i className="fas fa-credit-card"></i>Checkout</button>
            <button className="stripe-cart-clear" onClick={openInvoiceModal}><i className="fas fa-file-invoice"></i>Invoice</button>
            <button className="stripe-cart-clear" onClick={clear}><i className="fas fa-trash"></i>Clear</button>
          </div>
        </div>
      </div>
    </>
  )
}

// Helper used by the modal and elsewhere
export function addCompositeToCart(serviceType, baseService, selectedPackage, selectedAddOns){
  const compositeId = `${serviceType}:${selectedPackage.id}`
  const displayName = `${baseService.name} — ${selectedPackage.name}`
  const addOnsTotal = (selectedAddOns || []).reduce((sum, a) => sum + a.price, 0)
  const unitPrice = selectedPackage.price + addOnsTotal
  const existing = (window.stripeCart.items || []).find(item => item.id === compositeId)
  if (existing) existing.quantity += 1
  else {
    window.stripeCart.items = window.stripeCart.items || []
    window.stripeCart.items.push({ id: compositeId, name: displayName, price: unitPrice, icon: baseService.icon, quantity: 1, meta: { serviceType, packageId: selectedPackage.id, addOns: selectedAddOns } })
  }
  window.dispatchEvent(new Event('cf-cart-change'))
}

async function handleCheckout(){
  try {
    const payload = { items: (window.stripeCart.items || []).map(it => ({ name: it.name, price: it.price, quantity: it.quantity })) }
    const res = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error('Failed to create checkout session')
    const data = await res.json()
    if (data.url) { window.location.href = data.url; return }
  } catch (e) {
    if (window.cfToast) window.cfToast.push({ message: 'Checkout failed. Please try again.', type: 'error' })
  }
}

function openInvoiceModal(){
  const modal = document.createElement('div')
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header"><div class="modal-icon"><i class="fas fa-file-invoice"></i></div><h2>Create Invoice</h2><p>Enter your details and we’ll generate a Stripe invoice you can pay online.</p></div>
      <div class="contact-form">
        <div class="form-group"><label for="invoiceName">Full Name *</label><input type="text" id="invoiceName" required placeholder="Enter your full name"></div>
        <div class="form-group"><label for="invoiceEmail">Email Address *</label><input type="email" id="invoiceEmail" required placeholder="Enter your email address"></div>
      </div>
      <div class="form-actions">
        <button class="btn-secondary" id="cf-inv-cancel"><i class="fas fa-times"></i>Cancel</button>
        <button class="btn-primary" id="cf-inv-create"><i class="fas fa-file-invoice-dollar"></i>Generate Invoice</button>
      </div>
      <div id="invoiceResult" style="margin-top:12px; display:none; text-align:center;"></div>
    </div>`
  document.body.appendChild(modal)
  modal.querySelector('#cf-inv-cancel')?.addEventListener('click', ()=> modal.remove())
  modal.querySelector('#cf-inv-create')?.addEventListener('click', async ()=>{
    const name = modal.querySelector('#invoiceName').value.trim()
    const email = modal.querySelector('#invoiceEmail').value.trim()
    if (!name || !email) { if (window.cfToast) window.cfToast.push({ message: 'Please fill in name and email', type: 'error' }); return }
    const btn = modal.querySelector('#cf-inv-create')
    const result = modal.querySelector('#invoiceResult')
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...'
    try {
      const payload = { customer: { name, email }, items: (window.stripeCart.items||[]).map(it => ({ name: it.name, price: it.price, quantity: it.quantity })), metadata: { source: 'next-services' } }
      const resp = await fetch('/api/create-invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!resp.ok) throw new Error('Failed to create invoice')
      const data = await resp.json()
      result.style.display='block'
      result.innerHTML = `<a class="nav-link" style="display:inline-block;" href="${data.hostedInvoiceUrl}" target="_blank" rel="noopener"><i class='fas fa-external-link-alt'></i> Open Stripe Invoice</a>`
      if (window.cfToast) window.cfToast.push({ message: 'Invoice created!', type: 'success' })
    } catch (e) { if (window.cfToast) window.cfToast.push({ message: 'Could not create invoice. Please try again.', type: 'error' }) }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-invoice-dollar"></i> Generate Invoice' }
  })
}

// EmailJS: Send Your Project flow
export async function sendProjectRequest(invoiceData){
  try {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_t11yvru'
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_aluwel1'
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'p4pF3OWvh-DXtae4c'
    if (!emailjs.__init) emailjs.init(publicKey)
    const serviceDetails = (invoiceData.services||[]).map(s => `- ${s.name}: $${s.price}`).join('\n')
    const customer = invoiceData.customer || {}
    await emailjs.send(serviceId, templateId, {
      service: 'Project Generation',
      name: customer.name || 'Unknown Customer',
      email: customer.email || 'No email provided',
      phone: customer.phone || 'No phone provided',
      notes: `Invoice #${invoiceData.invoiceNumber}\n\nCustomer Details:\nName: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone}\n\nServices:\n${serviceDetails}\n\nSubtotal: $${(invoiceData.subtotal||0).toFixed(2)}\nTotal: $${(invoiceData.total||0).toFixed(2)}\n\nGenerated: ${new Date(invoiceData.date||Date.now()).toLocaleString()}`,
      invoice_number: invoiceData.invoiceNumber,
      total_amount: `$${(invoiceData.total||0).toFixed(2)}`,
      title: 'Service Package Request'
    })
    if (window.cfToast) window.cfToast.push({ message: 'Request submitted! We will contact you within 24 hours.', type: 'success' })
  } catch (e) {
    if (window.cfToast) window.cfToast.push({ message: 'Email send failed, but your request was captured.', type: 'error' })
  }
}


