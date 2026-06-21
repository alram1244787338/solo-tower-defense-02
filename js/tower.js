class Tower {
  constructor(type, x, y) {
    const cfg = CONFIG.towers[type];
    this.type = type;
    this.cfg = cfg;
    this.x = x;
    this.y = y;
    this.range = cfg.range;
    this.damage = cfg.damage;
    this.fireRate = cfg.fireRate;
    this.color = cfg.color;
    this.accent = cfg.accent;
    this.splash = cfg.splash || 0;
    this.slow = cfg.slow || 0;
    this.slowDuration = cfg.slowDuration || 0;
    this.bulletSpeed = cfg.bulletSpeed;
    this.cost = cfg.cost;
    this.size = 16;

    this.cooldown = 0;
    this.angle = 0;
    this.target = null;
  }

  findTarget(enemies) {
    let best = null;
    let bestDist = -1;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      if (dx * dx + dy * dy <= this.range * this.range) {
        if (e.distance > bestDist) {
          bestDist = e.distance;
          best = e;
        }
      }
    }
    this.target = best;
    return best;
  }

  update(dt, enemies, bullets) {
    if (this.cooldown > 0) this.cooldown -= dt;

    const target = this.findTarget(enemies);
    if (target) {
      this.angle = Math.atan2(target.y - this.y, target.x - this.x);
      if (this.cooldown <= 0) {
        this.fire(target, bullets);
        this.cooldown = this.fireRate;
      }
    }
  }

  fire(target, bullets) {
    const muzzleX = this.x + Math.cos(this.angle) * (this.size + 2);
    const muzzleY = this.y + Math.sin(this.angle) * (this.size + 2);
    bullets.push(new Bullet(muzzleX, muzzleY, target, {
      bulletSpeed: this.bulletSpeed,
      damage: this.damage,
      splash: this.splash,
      slow: this.slow,
      slowDuration: this.slowDuration,
      color: this.color,
    }));
  }

  draw(ctx, selected = false, hover = false) {
    if (selected || hover) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = this.accent;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.type === 'archer') {
      ctx.fillStyle = this.accent;
      ctx.fillRect(0, -2, this.size + 8, 4);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.size + 12, 0);
      ctx.lineTo(this.size + 4, -5);
      ctx.lineTo(this.size + 4, 5);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'cannon') {
      ctx.fillStyle = this.accent;
      ctx.fillRect(-2, -5, this.size + 14, 10);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(this.size + 12, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'frost') {
      ctx.fillStyle = '#a0e7f5';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.fillRect(0, -1.5, this.size + 6, 3);
        ctx.restore();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = this.type === 'archer' ? '箭' : this.type === 'cannon' ? '炮' : '冰';
    ctx.fillText(label, this.x, this.y - this.size - 8);
  }
}
