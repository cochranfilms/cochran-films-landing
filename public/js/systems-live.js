(function () {
  const DESKTOP_W = 1440;
  const DESKTOP_H = 900;

  // Homepages that currently send X-Frame-Options: DENY (cannot embed until those apps allow marketing parents).
  const FRAME_RESTRICTED = {
    "creatorcollective.media": true,
    "bizzicloud.io": true,
    "djsneedluv2.com": true,
  };

  function hostKey(src) {
    try {
      return new URL(src).hostname.replace(/^www\./, "").toLowerCase();
    } catch (err) {
      return "";
    }
  }

  function isRestricted(src) {
    return !!FRAME_RESTRICTED[hostKey(src)];
  }

  function scaleFrame(frame) {
    const iframe = frame.querySelector("iframe");
    if (!iframe) return;
    const width = frame.clientWidth || DESKTOP_W;
    const scale = Math.max(width / DESKTOP_W, 0.01);
    iframe.style.transform = "scale(" + scale + ")";
    frame.style.height = Math.round(DESKTOP_H * scale) + "px";
  }

  function markLoaded(frame) {
    frame.classList.add("is-loaded");
    frame.dataset.liveLoaded = "1";
  }

  function mountIframe(frame) {
    if (frame.dataset.liveMounted === "1") return;
    const src = frame.getAttribute("data-live-src");
    if (!src) return;

    if (isRestricted(src)) {
      frame.dataset.liveMounted = "1";
      frame.classList.add("is-restricted");
      return;
    }

    const title = frame.getAttribute("data-live-title") || "Live system preview";
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = title;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.setAttribute("allow", "fullscreen; autoplay; encrypted-media");
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

    const resize = function () {
      frames.forEach(scaleFrame);
    };

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
      window.addEventListener("resize", resize, { passive: true });
    }

    if (typeof IntersectionObserver === "undefined") {
      frames.forEach(mountIframe);
      resize();
      return;
    }

    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          mountIframe(entry.target);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "240px 0px", threshold: 0.01 }
    );

    frames.forEach(function (frame) {
      io.observe(frame);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
