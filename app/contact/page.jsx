'use client'
import { useRef, useState } from 'react'
import emailjs from '@emailjs/browser'

export default function Page(){
  const formRef = useRef(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e){
    e.preventDefault()
    const fd = new FormData(formRef.current)
    const data = Object.fromEntries(fd)
    if (!data.firstName || !data.lastName || !data.email || !data.message){ window.cfToast?.push({ message: 'Please fill in required fields.', type: 'error' }); return }
    try {
      setLoading(true)
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'p4pF3OWvh-DXtae4c'
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_t11yvru'
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template-contact-client'
      if (!emailjs.__init) emailjs.init(publicKey)
      await emailjs.send(serviceId, templateId, {
        service: 'Contact Inquiry',
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone || '',
        selected_service: data.service || '',
        notes: data.message,
        submitted_at: new Date().toISOString()
      })
      window.cfToast?.push({ message: 'Thank you! We will follow up shortly.', type: 'success' })
      formRef.current.reset()
    } catch (e) { window.cfToast?.push({ message: 'Email send failed. We will still follow up.', type: 'error' }) }
    finally { setLoading(false) }
  }

  return (
    <section id="contact" className="section">
      <div className="section-header">
        <h2 className="section-title">Contact</h2>
        <p className="section-subtitle">Ready to start your next creative project? Get in touch for a free consultation and quote.</p>
      </div>
      <div className="contact-content">
        <div className="contact-grid">
          <div className="contact-info">
            <h3><i className="fa-solid fa-address-book"></i> Get In Touch</h3>
            <div className="contact-method"><div className="contact-method-icon"><i className="fa-solid fa-envelope"></i></div><div className="contact-method-content"><h4>Email</h4><p><a href="mailto:info@cochranfilms.com">info@cochranfilms.com</a></p></div></div>
            <div className="contact-method"><div className="contact-method-icon"><i className="fa-solid fa-phone"></i></div><div className="contact-method-content"><h4>Phone</h4><p><a href="tel:+14045551234">+1 (404) 555-1234</a></p></div></div>
            <div className="contact-method"><div className="contact-method-icon"><i className="fa-solid fa-location-dot"></i></div><div className="contact-method-content"><h4>Location</h4><p>Atlanta, Georgia<br/>Available for remote work worldwide</p></div></div>
            <div className="contact-method"><div className="contact-method-icon"><i className="fa-solid fa-clock"></i></div><div className="contact-method-content"><h4>Response Time</h4><p>We typically respond within 24 hours</p></div></div>
          </div>
          <div className="contact-form">
            <h3><i className="fa-solid fa-paper-plane"></i> Send Us a Message</h3>
            <form ref={formRef} onSubmit={onSubmit}>
              <div className="form-row">
                <div className="form-group"><label htmlFor="firstName">First Name *</label><input id="firstName" name="firstName" required /></div>
                <div className="form-group"><label htmlFor="lastName">Last Name *</label><input id="lastName" name="lastName" required /></div>
              </div>
              <div className="form-group"><label htmlFor="email">Email Address *</label><input id="email" type="email" name="email" required /></div>
              <div className="form-group"><label htmlFor="phone">Phone Number</label><input id="phone" name="phone" /></div>
              <div className="form-group"><label htmlFor="company">Company/Organization</label><input id="company" name="company" /></div>
              <div className="form-group"><label htmlFor="service">Service Interest *</label><select id="service" name="service" required><option value="">Select a service...</option><option value="video-production">Video Production</option><option value="web-development">Web Development</option><option value="photography">Photography</option><option value="brand-development">Brand Development</option><option value="consultation">Consultation</option><option value="other">Other</option></select></div>
              <div className="form-group"><label htmlFor="message">Project Details *</label><textarea id="message" name="message" required /></div>
              <button type="submit" className="submit-btn" disabled={loading}>{loading ? (<><i className="fa-solid fa-spinner fa-spin"></i> Sending...</>) : 'Send Message'}</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}


