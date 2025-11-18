interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Update life
      particle.life -= deltaTime;

      // Update alpha based on life
      particle.alpha = particle.life / particle.maxLife;

      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Muzzle flash effect
  createMuzzleFlash(x: number, y: number, angle: number): void {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const spread = 0.3;
      const particleAngle = angle + (Math.random() - 0.5) * spread;
      const speed = 100 + Math.random() * 100;

      this.particles.push({
        x,
        y,
        vx: Math.cos(particleAngle) * speed,
        vy: Math.sin(particleAngle) * speed,
        life: 0.15,
        maxLife: 0.15,
        size: 2 + Math.random() * 2,
        color: '#ffaa00',
        alpha: 1
      });
    }
  }

  // Bullet impact sparks
  createImpactSparks(x: number, y: number, angle: number): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const spread = Math.PI;
      const particleAngle = angle + Math.PI + (Math.random() - 0.5) * spread;
      const speed = 80 + Math.random() * 120;

      this.particles.push({
        x,
        y,
        vx: Math.cos(particleAngle) * speed,
        vy: Math.sin(particleAngle) * speed,
        life: 0.3,
        maxLife: 0.3,
        size: 1.5 + Math.random() * 1.5,
        color: '#ffcc00',
        alpha: 1
      });
    }
  }

  // Death explosion
  createExplosion(x: number, y: number, color: string): void {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const speed = 100 + Math.random() * 150;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1
      });
    }
  }

  // Damage indicator
  createDamageIndicator(x: number, y: number): void {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 50;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50, // Slight upward bias
        life: 0.4,
        maxLife: 0.4,
        size: 2,
        color: '#ff0000',
        alpha: 1
      });
    }
  }

  clear(): void {
    this.particles = [];
  }
}
