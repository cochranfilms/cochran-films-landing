/* ========================================
   COCHRAN FILMS - LANDING PAGE
   Clean, focused JavaScript for the gateway to your main website
   ======================================== */

// ========================================
// GLOBAL VARIABLES & CONFIGURATION
// ========================================
const CONFIG = {
  ai: {
    particleCount: 100,
    connectionDistance: 120,
    particleSpeed: 0.3,
    neuralNetwork: true
  },
  animations: {
    scrollTrigger: true,
    parallax: true
  },
  performance: {
    throttleMs: 16,
    debounceMs: 150
  }
};

// ========================================
// AI NEURAL NETWORK BACKGROUND
// ========================================
class AINeuralNetwork {
  constructor() {
    this.canvas = document.getElementById('neuralCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.connections = [];
    this.mouse = { x: 0, y: 0 };
    this.animationId = null;
    
    this.init();
  }
  
  init() {
    this.resize();
    this.createParticles();
    this.createConnections();
    this.bindEvents();
    this.animate();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createParticles() {
    this.particles = [];
    for (let i = 0; i < CONFIG.ai.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * CONFIG.ai.particleSpeed,
        vy: (Math.random() - 0.5) * CONFIG.ai.particleSpeed,
        size: Math.random() * 2 + 1,
        color: this.getRandomAIColor(),
        pulse: Math.random() * Math.PI * 2
      });
    }
  }
  
  createConnections() {
    this.connections = [];
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const distance = this.getDistance(this.particles[i], this.particles[j]);
        if (distance < CONFIG.ai.connectionDistance) {
          this.connections.push({
            from: i,
            to: j,
            strength: 1 - (distance / CONFIG.ai.connectionDistance),
            pulse: Math.random() * Math.PI * 2
          });
        }
      }
    }
  }
  
  getRandomAIColor() {
    const colors = [
      'rgba(6, 182, 212, 0.6)',    // AI Cyan
      'rgba(20, 184, 166, 0.6)',   // AI Teal
      'rgba(124, 58, 237, 0.6)',   // AI Violet
      'rgba(99, 102, 241, 0.6)',   // Brand Indigo
      'rgba(255, 178, 0, 0.6)'     // Brand Gold
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  getDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  bindEvents() {
    window.addEventListener('resize', this.debounce(() => this.resize(), 150));
    
    this.canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = this.canvas.width / 2;
      this.mouse.y = this.canvas.height / 2;
    });
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    this.particles.forEach((particle, index) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off edges
      if (particle.x <= 0 || particle.x >= this.canvas.width) particle.vx *= -1;
      if (particle.y <= 0 || particle.y >= this.canvas.height) particle.vy *= -1;
      
      // Keep particles in bounds
      particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
      particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
      
      // Update pulse
      particle.pulse += 0.01;
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size + Math.sin(particle.pulse) * 1, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();
    });
    
    // Draw connections
    this.connections.forEach(connection => {
      const from = this.particles[connection.from];
      const to = this.particles[connection.to];
      
      if (from && to) {
        connection.pulse += 0.005;
        const alpha = connection.strength * (0.2 + Math.sin(connection.pulse) * 0.1);
        
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
      }
    });
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// ========================================
// GSAP ANIMATIONS & SCROLL TRIGGERS
// ========================================
class GSAPAnimations {
  constructor() {
    this.init();
  }
  
  init() {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);
    
    // Initialize animations
    this.initHeroAnimations();
    this.initScrollAnimations();
    this.initParallaxEffects();
  }
  
  initHeroAnimations() {
    // Hero title animation
    gsap.from('.hero-title .title-line', {
      duration: 1,
      y: 100,
      opacity: 0,
      stagger: 0.2,
      ease: 'power3.out',
      delay: 0.5
    });
    
    // Hero subtitle animation
    gsap.from('.hero-subtitle', {
      duration: 1,
      y: 50,
      opacity: 0,
      ease: 'power3.out',
      delay: 1.2
    });
    
    // Hero actions animation
    gsap.from('.hero-actions > *', {
      duration: 0.8,
      y: 30,
      opacity: 0,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 1.5
    });
    
    // Floating cards animation
    gsap.from('.floating-card', {
      duration: 1.2,
      y: 100,
      opacity: 0,
      stagger: 0.2,
      ease: 'power3.out',
      delay: 2
    });
  }
  
  initScrollAnimations() {
    // Service cards animation
    gsap.from('.service-card', {
      scrollTrigger: {
        trigger: '.services-section',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      },
      duration: 0.8,
      y: 100,
      opacity: 0,
      stagger: 0.1,
      ease: 'power3.out'
    });
    
    // Value cards animation
    gsap.from('.value-card', {
      scrollTrigger: {
        trigger: '.value-section',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      },
      duration: 0.8,
      y: 100,
      opacity: 0,
      stagger: 0.1,
      ease: 'power3.out'
    });
    
    // Social proof animation
    gsap.from('.proof-item', {
      scrollTrigger: {
        trigger: '.social-proof-section',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      },
      duration: 0.8,
      y: 50,
      opacity: 0,
      stagger: 0.1,
      ease: 'power3.out'
    });
  }
  
  initParallaxEffects() {
    if (!CONFIG.animations.parallax) return;
    
    // Parallax effect for hero visual
    gsap.to('.hero-visual', {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      },
      y: (i, target) => -target.offsetTop * 0.1,
      ease: 'none'
    });
  }
}

// ========================================
// INTERACTIVE FEATURES
// ========================================
class InteractiveFeatures {
  constructor() {
    this.init();
  }
  
  init() {
    this.initNavigation();
    this.initServiceCards();
    this.initFloatingCards();
  }
  
  initNavigation() {
    // Support unified nav (index2/blog parity)
    const header = document.querySelector('.nav-wrapper');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile toggle
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show');
      });
    }

    // Smooth scroll for hash links
    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Close mobile menu after select
            navMenu?.classList.remove('show');
            // Active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      }
    });

    // Header background on scroll
    window.addEventListener('scroll', () => {
      if (!header) return;
      if (window.scrollY > 100) {
        header.style.background = 'rgba(15, 23, 42, 0.98)';
      } else {
        header.style.background = 'rgba(15, 23, 42, 0.95)';
      }
    }, { passive: true });
  }
  
  scrollToSection(section) {
    const targetSection = document.querySelector(`.${section}-section`);
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
  
  initServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        this.enhanceServiceCard(card);
      });
      
      card.addEventListener('mouseleave', () => {
        this.resetServiceCard(card);
      });
    });
  }
  
  enhanceServiceCard(card) {
    // Add enhancement effect
    card.style.transform = 'translateY(-15px) scale(1.02)';
    card.style.boxShadow = '0 30px 60px rgba(6, 182, 212, 0.3)';
    
    // Animate icon
    const icon = card.querySelector('.service-icon');
    if (icon) {
      gsap.to(icon, {
        duration: 0.3,
        scale: 1.1,
        rotation: 5,
        ease: 'power2.out'
      });
    }
  }
  
  resetServiceCard(card) {
    card.style.transform = 'translateY(0) scale(1)';
    card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
    
    const icon = card.querySelector('.service-icon');
    if (icon) {
      gsap.to(icon, {
        duration: 0.3,
        scale: 1,
        rotation: 0,
        ease: 'power2.out'
      });
    }
  }
  
  initFloatingCards() {
    const floatingCards = document.querySelectorAll('.floating-card');
    
    floatingCards.forEach(card => {
      card.addEventListener('click', () => {
        this.handleFloatingCardClick(card);
      });
    });
  }
  
  handleFloatingCardClick(card) {
    const category = card.getAttribute('data-category');
    
    // Add click effect
    gsap.to(card, {
      duration: 0.2,
      scale: 0.95,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(card, {
          duration: 0.2,
          scale: 1,
          ease: 'power2.out'
        });
      }
    });
    
    // Navigate to main website with category focus
    setTimeout(() => {
      window.location.href = `index2.html#${category.toLowerCase()}`;
    }, 300);
  }
}

// ========================================
// AI LOADING SYSTEM
// ========================================
class AILoadingSystem {
  constructor() {
    this.loadingOverlay = document.getElementById('aiLoading');
    this.init();
  }
  
  init() {
    // Simulate loading sequence
    this.simulateLoading();
  }
  
  simulateLoading() {
    const loadingSteps = [
      'Welcome to Cochran Films',
      'Loading your creative journey...',
      'Preparing amazing content...',
      'Ready to explore!'
    ];
    
    let currentStep = 0;
    const loadingText = this.loadingOverlay.querySelector('.loading-text span');
    
    const updateLoading = () => {
      if (currentStep < loadingSteps.length) {
        loadingText.textContent = loadingSteps[currentStep];
        currentStep++;
        setTimeout(updateLoading, 800);
      } else {
        this.hideLoading();
      }
    };
    
    // Start loading sequence
    setTimeout(updateLoading, 500);
  }
  
  hideLoading() {
    gsap.to(this.loadingOverlay, {
      opacity: 0,
      duration: 1,
      ease: 'power2.inOut',
      onComplete: () => {
        this.loadingOverlay.classList.add('hidden');
        this.startPageAnimations();
      }
    });
  }
  
  startPageAnimations() {
    // Trigger entrance animations
    gsap.from('.ai-header', {
      duration: 1,
      y: -100,
      opacity: 0,
      ease: 'power3.out'
    });
  }
}

// ========================================
// PERFORMANCE OPTIMIZATIONS
// ========================================
class PerformanceOptimizer {
  constructor() {
    this.init();
  }
  
  init() {
    this.initIntersectionObserver();
    this.initThrottledScroll();
  }
  
  initIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '50px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, observerOptions);
    
    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
      observer.observe(section);
    });
  }
  
  initThrottledScroll() {
    let ticking = false;
    
    const updateScroll = () => {
      // Update scroll-based animations
      ticking = false;
    };
    
    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', requestTick, { passive: true });
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
const Utils = {
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// ========================================
// MAIN APPLICATION CLASS
// ========================================
class CochranFilmsLanding {
  constructor() {
    this.components = {};
    this.init();
  }
  
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }
  
  start() {
    console.log('🚀 Initializing Cochran Films Landing Page...');
    
    try {
      // Initialize all components
      this.components.neuralNetwork = new AINeuralNetwork();
      this.components.gsapAnimations = new GSAPAnimations();
      this.components.interactiveFeatures = new InteractiveFeatures();
      this.components.aiLoading = new AILoadingSystem();
      this.components.performance = new PerformanceOptimizer();

      // Inline metric counters animation for social proof
      this.animateCounters();
      
      // Initialize global functions
      this.initGlobalFunctions();
      
      console.log('✅ Cochran Films Landing Page initialized successfully!');
      
    } catch (error) {
      console.error('❌ Error initializing Landing Page:', error);
      this.fallbackMode();
    }
  }

  animateCounters() {
    const counters = document.querySelectorAll('.proof-number');
    counters.forEach(counter => {
      const targetText = counter.textContent.trim();
      const isPlus = targetText.endsWith('+');
      const clean = parseInt(targetText.replace(/\D/g, ''), 10) || 0;
      const duration = 1200;
      const start = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - start) / duration);
        const val = Math.floor(clean * p);
        counter.textContent = isPlus ? `${val}+` : `${val}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  
  initGlobalFunctions() {
    // Make functions globally available
    window.exploreWork = () => {
      window.location.href = 'index2.html';
    };
    
    window.startProject = () => {
      window.open('https://forms.gle/H44oamnuFgUtwb3k6', '_blank');
    };
  }
  
  fallbackMode() {
    console.log('🔄 Entering fallback mode...');
    
    // Hide AI loading overlay
    const loadingOverlay = document.getElementById('aiLoading');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
    
    // Basic animations fallback
    document.querySelectorAll('.service-card, .value-card').forEach(element => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  }
}

// ========================================
// INITIALIZATION
// ========================================
// Start the landing page when the page loads
const cochranFilmsLanding = new CochranFilmsLanding();

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CochranFilmsLanding;
}
