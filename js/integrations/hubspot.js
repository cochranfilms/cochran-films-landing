;(function(){
  // Async HubSpot loader. Set window.HUBSPOT_PORTAL_ID = 'XXXXXXX' to enable.
  function loadHubSpot(){
    const portal = window.HUBSPOT_PORTAL_ID;
    if (!portal) return;
    if (document.getElementById('hs-script-loader')) return;
    const s = document.createElement('script');
    s.id = 'hs-script-loader';
    s.async = true;
    s.defer = true;
    s.src = `https://js.hs-scripts.com/${portal}.js`;
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadHubSpot);
  } else { loadHubSpot(); }

  window.hubspotIntegration = { load: loadHubSpot };
})();


