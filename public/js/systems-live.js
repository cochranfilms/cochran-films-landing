(function () {
  const DESKTOP_W = 1440;
  const DESKTOP_H = 900;
  const CACHE_KEY = "cf-systems-live-warm-v1";

  function scaleFrame(frame) {
    const iframe = frame.querySelector("iframe");
    if (!iframe) return;
    const width = frame.clientWidth || DESKTOP_W;
    const scale = Math.max(width / DESKTOP_W, 0.01);
    iframe.style.transform = "scale(" + scale + ")";
    frame.style.height = Math.round(DESKTOP_H * scale) + "px";
  }

  function rememberWarm(src) {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[src] = Date.now();
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(map));
    } catch (err) {
      /* ignore quota / private mode */
    }
  }

  function wasWarmed(src) {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const map = JSON.parse(raw);
      return !!map[src];
    } catch (err) {
      return false;
    }
  }

  function markLoaded(frame) {
    frame.classList.add("is-loaded");
    frame.dataset.liveLoaded = "1";
    const src = frame.getAttribute("data-live-src");
    if (src) rememberWarm(src);
  }

  function mountIframe(frame) {
    if (frame.dataset.liveMounted === "1") return;
    const src = frame.getAttribute("data-live-src");
    if (!src) return;

    const title = frame.getAttribute("data-live-title") || "Live system preview";
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = title;
    iframe.loading = "eager";
    iframe.setAttribute("fetchpriority", "high");
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.setAttribute("allow", "fullscreen; autoplay; encrypted-media");
    if (wasWarmed(src)) {
      frame.classList.add("is-warm");
    }
    iframe.addEventListener(
      "load",
      function () {
        markLoaded(frame);
      },
      { once: true }
    );
    frame.appendChild(iframe);
    frame.dataset.liveMounted = "1";
    scaleFrame(frame);
  }

  function init() {
    const frames = Array.prototype.slice.call(document.querySelectorAll(".sys-live-frame[data-live-src]"));
    if (!frames.length) return;

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          scaleFrame(entry.target);
        });
      });
      frames.forEach(function (frame) {
        ro.observe(frame);
      });
    } else {
      window.addEventListener(
        "resize",
        function () {
          frames.forEach(scaleFrame);
        },
        { passive: true }
      );
    }

    // Mount every preview immediately so cards are live before users scroll.
    frames.forEach(mountIframe);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
