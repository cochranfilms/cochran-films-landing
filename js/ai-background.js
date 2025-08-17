/**
 * AI Neural Network Background Animation
 * Creates an animated neural network visualization in the background
 */

// AI Neural Network Background
class AINeuralBackground {
  constructor() {
    this.canvas = document.getElementById('neuralCanvas');
    if (!this.canvas) {
      console.warn('AI Background canvas not found');
      return;
    }
    
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
    console.log('✅ AI Neural Background initialized');
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

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AINeuralBackground;
}

// Make the class globally available
window.AINeuralBackground = AINeuralBackground;
