;(function(){
  const CALENDLY_URL = window.CALENDLY_URL || 'https://calendly.com/YOUR_HANDLE/discovery-call';

  function loadCalendly(){
    if (window.Calendly) return Promise.resolve();
    return new Promise((resolve)=>{
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);

      const s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      s.onload = ()=> resolve();
      document.head.appendChild(s);
    });
  }

  async function openCalendly(){
    await loadCalendly();
    if (window.Calendly){
      window.Calendly.initPopupWidget({url: CALENDLY_URL});
    }
  }

  function bindTriggers(){
    document.querySelectorAll('[data-calendly], #openCalendly').forEach(el=>{
      el.addEventListener('click', (e)=>{ e.preventDefault(); openCalendly(); });
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindTriggers);
  } else { bindTriggers(); }

  window.calendlyIntegration = { open: openCalendly, load: loadCalendly };
})();


