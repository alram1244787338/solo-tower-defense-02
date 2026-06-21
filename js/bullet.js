class Bullet {
  constructor(x, y, target, config) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.targetX = target.x;
    this.targetY = target.y;
    this.cfg = config;
    this.speed = config.bulletSpeed;
    this.damage = config.damage;
    this.splash = config.splash || 0;
    this.slow = config.slow || 0;
    this.slowDuration = config.slowDuration || 0;
    this.color = config.color;
    this.dead = false;
  }

  update(dt, enemies) {
    const isSplash = this.splash > 0;
    if (this.target && this.target.alive) {
      this.targetX = this.target.x;
      this.targetY = this.target.y;
    } else if (!isSplash) {
      this.dead = true;
      return;
    }
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;

    if (dist <= step || dist < 6) {
      this._impact(enemies);
      this.dead = true;
      return;
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  _impact(enemies) {
    let hit = false;
    if (this.splash > 0) {
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.alive) continue;
        if (Math.hypot(e.x - this.x, e.y - this.y) <= this.splash) {
          e.damage(this.damage);
          if (this.slow > 0) e.applySlow(1 - this.slow, this.slowDuration);
          hit = true;
        }
      }
      Game.effects.push(new Explosion(this.x, this.y, this.splash, this.color));
    } else {
      if (this.target && this.target.alive) {
        this.target.damage(this.damage);
        if (this.slow > 0) this.target.applySlow(1 - this.slow, this.slowDuration);
        hit = true;
      }
    }
    if (hit) Audio.playHit();
  }

  draw(ctx) {
    if (this.splash > 0) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const ang = Math.atan2(this.targetY - this.y, this.targetX - this.x);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - Math.cos(ang) * 12, this.y - Math.sin(ang) * 12);
      ctx.stroke();
    }
  }
}

class Explosion {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = radius;
    this.color = color;
    this.life = 0.35;
    this.maxLife = 0.35;
    this.dead = false;
  }
  update(dt) {
    this.life -= dt;
    const t = 1 - this.life / this.maxLife;
    this.radius = this.maxRadius * Math.min(1, t * 1.5);
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = a * 0.9;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = a * 0.25;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
