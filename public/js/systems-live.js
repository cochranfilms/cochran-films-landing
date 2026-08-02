(function () {
  const DESKTOP_W = 1440;
  const DESKTOP_H = 900;
  const CACHE_KEY = "cf-systems-live-warm-v1";
  const MOBILE_MQ = "(max-width: 900px)";

  function isMobilePreview() {
    return window.matchMedia(MOBILE_MQ).matches;
  }

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

  function clearMedia(frame) {
    frame.querySelectorAll("iframe, img.sys-live-static-img").forEach(function (node) {
      node.remove();
    });
    frame.classList.remove("is-loaded", "is-warm", "is-static");
    frame.style.height = "";
    delete frame.dataset.liveMounted;
    delete frame.dataset.liveLoaded;
    delete frame.dataset.staticMounted;
  }

  function mountStatic(frame) {
    const src = frame.getAttribute("data-static-src");
    if (!src) return false;
    if (frame.dataset.staticMounted === "1") return true;

    clearMedia(frame);

    const img = document.createElement("img");
    img.className = "sys-live-static-img";
    img.src = src;
    img.alt = frame.getAttribute("data-live-title") || "Platform preview";
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener(
      "load",
      function () {
        frame.classList.add("is-loaded");
      },
      { once: true }
    );

    frame.appendChild(img);
    frame.classList.add("is-static", "is-loaded");
    frame.dataset.staticMounted = "1";
    return true;
  }

  function mountIframe(frame) {
    if (frame.dataset.liveMounted === "1") return;
    const src = frame.getAttribute("data-live-src");
    if (!src) return;

    clearMedia(frame);

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

  function mountFrame(frame) {
    // Mobile never mounts live iframes — they blow memory and cause horizontal overflow.
    if (isMobilePreview()) {
      if (!mountStatic(frame)) {
        clearMedia(frame);
      }
      return;
    }
    mountIframe(frame);
  }

  function init() {
    const frames = Array.prototype.slice.call(document.querySelectorAll(".sys-live-frame[data-live-src]"));
    if (!frames.length) return;

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(function (entries) {
        if (isMobilePreview()) return;
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
          if (isMobilePreview()) return;
          frames.forEach(scaleFrame);
        },
        { passive: true }
      );
    }

    frames.forEach(mountFrame);

    var lastMobile = isMobilePreview();
    window.matchMedia(MOBILE_MQ).addEventListener("change", function () {
      var nowMobile = isMobilePreview();
      if (nowMobile === lastMobile) return;
      lastMobile = nowMobile;
      frames.forEach(function (frame) {
        clearMedia(frame);
        mountFrame(frame);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
