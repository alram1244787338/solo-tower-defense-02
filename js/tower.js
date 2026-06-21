class Tower {
  constructor(type, x, y) {
    const cfg = CONFIG.towers[type];
    this.type = type;
    this.cfg = cfg;
    this.x = x;
    this.y = y;
    this.baseRange = cfg.range;
    this.baseDamage = cfg.damage;
    this.baseFireRate = cfg.fireRate;
    this.baseCost = cfg.cost;
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
    this.totalCost = cfg.cost;
    this.level = 1;
    this.size = 16;

    this.cooldown = 0;
    this.angle = 0;
    this.target = null;
  }

  getUpgradeCost() {
    if (this.level >= CONFIG.maxTowerLevel) return null;
    return Math.round(this.baseCost * Math.pow(CONFIG.upgrade.costMul, this.level));
  }

  getSellValue() {
    return Math.round(this.totalCost * CONFIG.sellRefundRatio);
  }

  canUpgrade() {
    return this.level < CONFIG.maxTowerLevel;
  }

  upgrade() {
    if (!this.canUpgrade()) return false;
    const cost = this.getUpgradeCost();
    this.level++;
    this.totalCost += cost;
    this.damage = Math.round(this.baseDamage * Math.pow(CONFIG.upgrade.damageMul, this.level - 1));
    this.range = Math.round(this.baseRange * Math.pow(CONFIG.upgrade.rangeMul, this.level - 1));
    this.fireRate = this.baseFireRate * Math.pow(CONFIG.upgrade.fireRateMul, this.level - 1);
    return true;
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
    Audio.playFire(this.type);
  }

  draw(ctx, selected = false, hover = false) {
    if (selected || hover) {
      ctx.fillStyle = selected ? 'rgba(160, 196, 255, 0.12)' : 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = selected ? 'rgba(160, 196, 255, 0.7)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = selected ? 2 : 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (selected) {
      ctx.strokeStyle = '#a0c4ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 7, 0, Math.PI * 2);
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

    if (this.level > 1) {
      ctx.fillStyle = '#ffd166';
      for (let i = 0; i < this.level - 1; i++) {
        const angle = -Math.PI / 2 + (i - (this.level - 2) / 2) * 0.4;
        const sx = this.x + Math.cos(angle) * (this.size + 10);
        const sy = this.y + Math.sin(angle) * (this.size + 10);
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

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
