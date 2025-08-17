// Core functionality for Cochran Films website
class CochranFilmsCore {
  constructor() {
    this.init();
  }

  init() {
    this.initSmoothScrolling();
    this.initActiveNavigation();
    this.initMobileMenu();
    this.initToolkitForm();
    this.initNavigationScrollEffect();
    console.log('✅ CochranFilmsCore initialized');
  }

  // Smooth scrolling for navigation links
  initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // Active navigation highlighting
  initActiveNavigation() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });
  }

  // Mobile menu toggle
  initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show');
      });
    }
  }

  // Production Toolkit Form submission
  initToolkitForm() {
    const toolkitForm = document.getElementById('toolkitForm');
    if (toolkitForm) {
      toolkitForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Show success message and provide immediate value
        const successMessage = `
🎉 Thank you for downloading our Production Toolkit 2025!

Here's what you'll receive immediately:
✅ AI-powered editing presets for Premiere Pro & DaVinci Resolve
✅ Professional color grading LUTs (Rec.709 & HDR)
✅ Project templates for commercials, documentaries & events
✅ Workflow automation scripts
✅ 2025 production trends guide
✅ Exclusive access to our creator community

Check your email in the next 5 minutes for your download link!

We'll also send you:
• Weekly production tips & tricks
• Early access to new tools & resources
• Special creator-only discounts

Welcome to the Cochran Films family! 🚀
        `;
        
        alert(successMessage);
        
        // Reset form
        this.reset();
        
        // Track download (you can integrate with analytics here)
        console.log('Toolkit downloaded by:', data);
      });
    }
  }

  // Navigation scroll effect
  initNavigationScrollEffect() {
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('.nav-wrapper');
      if (nav) {
        if (window.scrollY > 100) {
          nav.style.background = 'rgba(15, 23, 42, 0.98)';
        } else {
          nav.style.background = 'rgba(15, 23, 42, 0.95)';
        }
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CochranFilmsCore();
  });
} else {
  new CochranFilmsCore();
}
