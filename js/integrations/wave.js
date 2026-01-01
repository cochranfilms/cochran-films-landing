/*
  Wave front-end helper
  - Creates invoice via backend proxy /api/wave/create-invoice
  - Opens Wave checkout link in a new tab
  - Falls back to EmailJS if backend is not configured
*/
;(function(){
  async function createInvoice({customer, items, memo}){
    try{
      const res = await fetch('/api/wave/create-invoice',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ customer, items, memo })
      });
      if (!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      return data; // {invoiceId, checkoutUrl}
    }catch(e){
      console.warn('Wave create-invoice failed or not configured.', e);
      return null;
    }
  }

  async function checkoutWithWave(cart){
    const items = cart.items.map(it=>({ name: it.name, unitPrice: it.price, quantity: it.quantity }));
    const memo = `Cochran Films online order - total $${cart.total}`;
    const customer = cart.customer || {};
    const created = await createInvoice({ customer, items, memo });
    if (created && created.checkoutUrl){
      window.open(created.checkoutUrl, '_blank');
      return true;
    }
    return false;
  }

  window.waveIntegration = { checkoutWithWave };
})();


