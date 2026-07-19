function initializeRealEstatePortfolio() {
  const listingSlideshow = document.getElementById('re-listing-slideshow');
  if (listingSlideshow) {
    const slides = Array.from(listingSlideshow.querySelectorAll('.re-slide'));
    const thumbsContainer = listingSlideshow.querySelector('.re-slideshow-thumbs');
    const prevButton = listingSlideshow.querySelector('.re-slideshow-prev');
    const nextButton = listingSlideshow.querySelector('.re-slideshow-next');
    const currentLabel = listingSlideshow.querySelector('[data-slideshow-current]');
    const totalLabel = listingSlideshow.querySelector('[data-slideshow-total]');
    let activeIndex = 0;

    if (totalLabel) {
      totalLabel.textContent = String(slides.length);
    }

    slides.forEach((slide, index) => {
      const image = slide.querySelector('img');
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 're-slideshow-thumb' + (slide.classList.contains('is-blueprint') ? ' is-blueprint' : '');
      thumb.setAttribute('aria-label', `Show photo ${index + 1}`);
      if (index === 0) {
        thumb.classList.add('is-active');
      }

      if (image) {
        const thumbImage = document.createElement('img');
        const webpSource = slide.querySelector('picture source[type="image/webp"]');
        thumbImage.src = webpSource ? webpSource.getAttribute('srcset') : image.getAttribute('src');
        thumbImage.alt = '';
        thumbImage.loading = 'eager';
        thumbImage.decoding = 'async';
        thumb.appendChild(thumbImage);
      }

      thumb.addEventListener('click', () => goToSlide(index));
      thumbsContainer.appendChild(thumb);
    });

    const thumbs = Array.from(listingSlideshow.querySelectorAll('.re-slideshow-thumb'));

    function goToSlide(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === activeIndex);
      });
      thumbs.forEach((thumb, thumbIndex) => {
        thumb.classList.toggle('is-active', thumbIndex === activeIndex);
        if (thumbIndex === activeIndex) {
          thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
      if (currentLabel) {
        currentLabel.textContent = String(activeIndex + 1);
      }
    }

    prevButton?.addEventListener('click', () => goToSlide(activeIndex - 1));
    nextButton?.addEventListener('click', () => goToSlide(activeIndex + 1));

    listingSlideshow.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToSlide(activeIndex - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToSlide(activeIndex + 1);
      }
    });

    listingSlideshow.setAttribute('tabindex', '0');
  }

  const blueprintPanel = document.getElementById('re-blueprint-panel');
  if (blueprintPanel) {
    const blueprintThumbs = Array.from(blueprintPanel.querySelectorAll('.re-blueprint-thumb'));
    const blueprintPreview = blueprintPanel.querySelector('[data-blueprint-preview]');

    function selectBlueprint(thumb) {
      blueprintThumbs.forEach((button) => {
        const isActive = button === thumb;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      if (blueprintPreview) {
        blueprintPreview.src = thumb.dataset.blueprintSrc;
        blueprintPreview.alt = thumb.dataset.blueprintAlt || 'Property blueprint floor plan';
      }
    }

    blueprintThumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => selectBlueprint(thumb));
    });
  }

  const propertyReel = document.getElementById('re-property-reel');
  const portraitFsShell = document.getElementById('re-portrait-fs-shell');
  const reelExpandBtn = document.getElementById('re-reel-expand-btn');

  function closePortraitFallback() {
    if (!propertyReel) return;
    propertyReel.classList.remove('is-portrait-fullscreen');
    document.body.classList.remove('re-reel-fs-open');
  }

  async function openPortraitFullscreen() {
    if (!propertyReel || !portraitFsShell) return;

    if (document.fullscreenElement === portraitFsShell || document.webkitFullscreenElement === portraitFsShell) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      return;
    }

    try {
      if (portraitFsShell.requestFullscreen) {
        await portraitFsShell.requestFullscreen();
      } else if (portraitFsShell.webkitRequestFullscreen) {
        portraitFsShell.webkitRequestFullscreen();
      } else {
        throw new Error('Fullscreen API unavailable');
      }
    } catch (error) {
      propertyReel.classList.add('is-portrait-fullscreen');
      document.body.classList.add('re-reel-fs-open');
    }
  }

  reelExpandBtn?.addEventListener('click', openPortraitFullscreen);

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      closePortraitFallback();
    }
  });

  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement) {
      closePortraitFallback();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && propertyReel?.classList.contains('is-portrait-fullscreen')) {
      closePortraitFallback();
    }
  });

  propertyReel?.addEventListener('click', (event) => {
    if (propertyReel.classList.contains('is-portrait-fullscreen') && event.target === propertyReel) {
      closePortraitFallback();
    }
  });
}

function initializeShowcaseReveal() {
  const showcases = document.querySelectorAll('.lp-web-showcase');
  const servicesSection = document.querySelector('.services-showcase-section');
  const revealTargets = [...showcases];
  if (servicesSection) revealTargets.push(servicesSection);

  if (!revealTargets.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );

  revealTargets.forEach((el) => observer.observe(el));
}

function initializeShawntaGallery() {
  const gallery = document.querySelector('#portfolio-shawnta .sh-gallery');
  if (!gallery) return;

  function alignShGalleryRows() {
    const figures = Array.from(gallery.querySelectorAll('figure'));
    const columns =
      getComputedStyle(gallery).gridTemplateColumns.split(' ').filter(Boolean).length || 4;

    for (let i = 0; i < figures.length; i += columns) {
      const rowFigures = figures.slice(i, i + columns);
      const imgs = rowFigures.map((figure) => figure.querySelector('img')).filter(Boolean);

      imgs.forEach((img) => {
        img.style.height = '';
        img.style.maxHeight = '';
      });

      const heights = imgs.map((img) => img.getBoundingClientRect().height);
      const maxHeight = Math.max(...heights, 0);
      if (!maxHeight) continue;

      imgs.forEach((img) => {
        img.style.height = `${maxHeight}px`;
        img.style.maxHeight = `${maxHeight}px`;
        img.style.width = '100%';
        img.style.objectFit = 'cover';
        img.style.objectPosition = 'center center';
      });
    }
  }

  let alignFrame = 0;
  function scheduleAlign() {
    cancelAnimationFrame(alignFrame);
    alignFrame = requestAnimationFrame(alignShGalleryRows);
  }

  gallery.querySelectorAll('img').forEach((img) => {
    if (img.complete) {
      scheduleAlign();
    } else {
      img.addEventListener('load', scheduleAlign, { once: true });
    }
  });
  window.addEventListener('resize', scheduleAlign);
  window.addEventListener('load', scheduleAlign);
  scheduleAlign();
}

function applyLivePreviewData(preview, data) {
  if (!data || !data.ok) return;

  const heroImg = preview.querySelector('[data-live-hero]');
  if (heroImg && data.heroImage) {
    heroImg.src = data.heroImage;
  }

  const headline = preview.querySelector('[data-live-headline]');
  if (headline && data.headline) {
    headline.textContent = data.headline;
  }

  const subhead = preview.querySelector('[data-live-subhead]');
  if (subhead && data.subhead) {
    subhead.textContent = data.subhead;
  }

  const primaryCta = preview.querySelector('[data-live-primary-cta]');
  if (primaryCta && data.primaryCta) {
    primaryCta.textContent = data.primaryCta;
  }

  const secondaryCta = preview.querySelector('[data-live-secondary-cta]');
  if (secondaryCta && data.secondaryCta) {
    secondaryCta.textContent = data.secondaryCta;
  }

  const login = preview.querySelector('[data-live-login]');
  if (login && data.loginText) {
    login.textContent = data.loginText;
  }

  preview.classList.add('is-live-synced');
}

async function initializeLiveSitePreviews() {
  const previews = document.querySelectorAll('.site-preview[data-live-url]');
  if (!previews.length) return;

  await Promise.all(
    Array.from(previews).map(async (preview) => {
      const liveUrl = preview.getAttribute('data-live-url');
      if (!liveUrl) return;

      try {
        const response = await fetch(`/api/site-preview?url=${encodeURIComponent(liveUrl)}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = await response.json();
        applyLivePreviewData(preview, data);
      } catch (error) {
        // Keep static fallback content when live sync is unavailable.
      }
    })
  );
}

function bootPageModules() {
  if (document.querySelector('.real-estate-section, #portfolio-realestate')) {
    initializeRealEstatePortfolio();
  }
  if (document.querySelector('#portfolio-shawnta')) {
    initializeShawntaGallery();
  }
  initializeShowcaseReveal();
  initializeLiveSitePreviews();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootPageModules);
} else {
  bootPageModules();
}
