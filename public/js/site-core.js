// Same-page smooth scrolling for hash links only
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const hash = this.getAttribute('href');
        if (!hash || hash === '#') return;
        const target = document.querySelector(hash);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Active nav for path-based pages
    (function highlightActiveNav() {
      const path = window.location.pathname.replace(/\.html$/, '') || '/';
      document.querySelectorAll('.nav-link').forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#')) return;
        const normalized = href.replace(/\.html$/, '') || '/';
        const isHomeAbout = path === '/' && normalized === '/#about';
        const isMatch =
          normalized === path ||
          (path === '/' && normalized === '/') ||
          (normalized === '/pricing' && path === '/pricing');
        if (isMatch && !href.includes('#about')) {
          link.classList.add('active');
        } else if (href === '/#about' && window.location.hash === '#about') {
          link.classList.add('active');
        }
      });
    })();

    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    function setMobileNavOpen(isOpen) {
      if (!navMenu || !mobileToggle) return;
      navMenu.classList.toggle('show', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-xmark', isOpen);
      }
    }

    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        setMobileNavOpen(!navMenu.classList.contains('show'));
      });

      navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMobileNavOpen(false));
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 768) setMobileNavOpen(false);
      });
    }

    // Platform notice modal (replaces browser alert dialogs)
    function closePlatformNotice() {
      const overlay = document.getElementById('cfPlatformNotice');
      if (overlay) overlay.remove();
      document.body.style.overflow = '';
    }

    function showPlatformNotice(options) {
      closePlatformNotice();

      const {
        title,
        subtitle,
        items = [],
        followUp = '',
        buttonText = 'Got It',
        iconClass = 'fa-solid fa-sparkles',
        variant = 'gold'
      } = options;

      const itemsHtml = items.length
        ? `<ul class="cf-notice-list">${items.map(item => `<li><i class="fa-solid fa-circle-check"></i><span>${item}</span></li>`).join('')}</ul>`
        : '';

      const followUpHtml = followUp
        ? `<div class="cf-notice-followup">${followUp}</div>`
        : '';

      const overlay = document.createElement('div');
      overlay.id = 'cfPlatformNotice';
      overlay.className = 'cf-notice-overlay active';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML = `
        <div class="cf-notice-wrap">
          <div class="cf-notice-panel">
            <button type="button" class="cf-notice-close" aria-label="Close notification">
              <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="cf-notice-head">
              <div class="cf-notice-icon ${variant === 'success' ? 'success' : ''}">
                <i class="${iconClass}"></i>
              </div>
              <h2>${title}</h2>
              ${subtitle ? `<p>${subtitle}</p>` : ''}
            </div>
            <div class="cf-notice-body">
              ${itemsHtml}
              ${followUpHtml}
            </div>
            <div class="cf-notice-actions">
              <button type="button" class="cf-notice-btn">${buttonText}</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      const dismiss = () => closePlatformNotice();
      overlay.querySelector('.cf-notice-btn').addEventListener('click', dismiss);
      overlay.querySelector('.cf-notice-close').addEventListener('click', dismiss);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) dismiss();
      });

      const onKeydown = (e) => {
        if (e.key === 'Escape') {
          dismiss();
          document.removeEventListener('keydown', onKeydown);
        }
      };
      document.addEventListener('keydown', onKeydown);

      overlay.querySelector('.cf-notice-btn').focus();
    }

    // Contact form — EmailJS via server API
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      const setFormLoadedAt = () => {
        const field = bookingForm.querySelector('input[name="formLoadedAt"]');
        if (field) field.value = String(Date.now());
      };
      setFormLoadedAt();

      bookingForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const form = this;
      const submitBtn = form.querySelector('.form-submit');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      if (!data.service) {
        showPlatformNotice({
          title: 'Select a service',
          subtitle: 'Please choose a service interest before sending your message.',
          items: [],
          buttonText: 'OK',
          iconClass: 'fa-solid fa-circle-exclamation',
          variant: 'error'
        });
        return;
      }

      const firstName = String(data.firstName || '').trim();
      const lastName = String(data.lastName || '').trim();
      const email = String(data.email || '').trim();
      const fullName = [firstName, lastName].filter(Boolean).join(' ');

      if (!firstName || !lastName) {
        showPlatformNotice({
          title: 'Name required',
          subtitle: 'Please enter your first and last name.',
          items: [],
          buttonText: 'OK',
          iconClass: 'fa-solid fa-circle-exclamation',
          variant: 'error'
        });
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailPattern.test(email)) {
        showPlatformNotice({
          title: 'Valid email required',
          subtitle: 'Please enter a valid email address (for example: you@example.com).',
          items: [],
          buttonText: 'OK',
          iconClass: 'fa-solid fa-circle-exclamation',
          variant: 'error'
        });
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Sending...';
      }

      try {
        const response = await fetch('/api/contact/send-inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName,
            firstName,
            lastName,
            email,
            service: data.service,
            message: data.message,
            companyWebsite: String(data.companyWebsite || '').trim(),
            formLoadedAt: data.formLoadedAt
          })
        });

        const raw = await response.text();
        let result = {};
        try {
          result = raw ? JSON.parse(raw) : {};
        } catch (parseError) {
          throw new Error(raw && raw.length < 300 ? raw : `Server error (${response.status}).`);
        }

        if (!response.ok) {
          throw new Error(result.error || 'Unable to send message. Please try again.');
        }

        showPlatformNotice({
          title: 'Message Sent!',
          subtitle: 'Thank you for reaching out. Check your inbox for a confirmation — we\'ll respond within 24 hours.',
          items: [
            'We\'ll reply to the email address you provided',
            'Average response time: within 24 hours',
            'Questions? Call us at (470) 420-2169'
          ],
          buttonText: 'Perfect, Thanks!',
          iconClass: 'fa-solid fa-paper-plane',
          variant: 'success'
        });
        form.reset();
        setFormLoadedAt();
        console.log('Contact inquiry sent:', result.inquiryId);
      } catch (error) {
        console.error('Contact form error:', error);
        showPlatformNotice({
          title: 'Could not send message',
          subtitle: error.message || 'Please try again or email info@cochranfilms.com directly.',
          items: [
            'Email: info@cochranfilms.com',
            'Phone: (470) 420-2169'
          ],
          buttonText: 'OK',
          iconClass: 'fa-solid fa-circle-exclamation',
          variant: 'error'
        });
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml || '<i class="fas fa-paper-plane" aria-hidden="true"></i> Send Message';
        }
      }
    });
    }

    // Navigation scroll effect
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('.nav-wrapper');
      if (window.scrollY > 100) {
        nav.style.background = 'rgba(15, 23, 42, 0.98)';
      } else {
        nav.style.background = 'rgba(15, 23, 42, 0.95)';
      }
    });

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
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
          this.particles.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2 + 1,
            color: this.getRandomAIColor(),
            pulse: Math.random() * Math.PI * 2
          });
        }
      }
      
      createConnections() {
        this.connections = [];
        const connectionDistance = 120;
        for (let i = 0; i < this.particles.length; i++) {
          for (let j = i + 1; j < this.particles.length; j++) {
            const distance = this.getDistance(this.particles[i], this.particles[j]);
            if (distance < connectionDistance) {
              this.connections.push({
                from: i,
                to: j,
                strength: 1 - (distance / connectionDistance),
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
        window.addEventListener('resize', () => this.resize());
        
        document.addEventListener('mousemove', (e) => {
          this.mouse.x = e.clientX;
          this.mouse.y = e.clientY;
        });
      }
      
      updateParticles() {
        this.particles.forEach(particle => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          // Bounce off edges
          if (particle.x <= 0 || particle.x >= this.canvas.width) {
            particle.vx *= -1;
          }
          if (particle.y <= 0 || particle.y >= this.canvas.height) {
            particle.vy *= -1;
          }
          
          // Update pulse
          particle.pulse += 0.02;
          
          // Mouse interaction
          const mouseDistance = this.getDistance(particle, this.mouse);
          if (mouseDistance < 150) {
            const angle = Math.atan2(this.mouse.y - particle.y, this.mouse.x - particle.x);
            const force = (150 - mouseDistance) / 150;
            particle.vx += Math.cos(angle) * force * 0.01;
            particle.vy += Math.sin(angle) * force * 0.01;
          }
          
          // Dampen velocity
          particle.vx *= 0.99;
          particle.vy *= 0.99;
        });
      }
      
      draw() {
        // Clear canvas with subtle fade effect
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        this.connections.forEach(connection => {
          const from = this.particles[connection.from];
          const to = this.particles[connection.to];
          
          if (from && to) {
            const alpha = 0.3 + Math.sin(connection.pulse) * 0.2;
            this.ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * connection.strength})`;
            this.ctx.lineWidth = 1 * connection.strength;
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
            this.ctx.stroke();
            
            connection.pulse += 0.01;
          }
        });
        
        // Draw particles
        this.particles.forEach(particle => {
          const alpha = 0.6 + Math.sin(particle.pulse) * 0.4;
          this.ctx.fillStyle = particle.color.replace('0.6)', `${alpha})`);
          this.ctx.beginPath();
          this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          this.ctx.fill();
        });
      }
      
      animate() {
        this.updateParticles();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
      }
      
      destroy() {
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
        }
      }
    }

    // Initialize AI Neural Network when canvas is present
    function bootNeuralCanvas() {
      if (!document.getElementById('neuralCanvas')) return;
      new AINeuralNetwork();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootNeuralCanvas);
    } else {
      bootNeuralCanvas();
    }