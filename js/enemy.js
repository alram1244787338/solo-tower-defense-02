class Enemy {
  constructor(type) {
    const cfg = CONFIG.enemies[type];
    this.type = type;
    this.cfg = cfg;
    this.maxHp = cfg.hp;
    this.hp = cfg.hp;
    this.baseSpeed = cfg.speed;
    this.speed = cfg.speed;
    this.radius = cfg.radius;
    this.color = cfg.color;
    this.gold = cfg.gold;
    this.score = cfg.score;

    this.distance = 0;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.alive = true;
    this.reachedEnd = false;

    this.slowFactor = 1;
    this.slowTimer = 0;

    this.hitFlash = 0;
  }

  applySlow(factor, duration) {
    if (factor < this.slowFactor) {
      this.slowFactor = factor;
      this.slowTimer = duration;
    } else if (this.slowTimer < duration) {
      this.slowTimer = duration;
    }
  }

  damage(dmg) {
    this.hp -= dmg;
    this.hitFlash = 0.08;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  update(dt) {
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowFactor = 1;
      }
    }
    this.speed = this.baseSpeed * this.slowFactor;
    this.distance += this.speed * dt;

    const pos = GameMap.posAtDistance(this.distance);
    this.x = pos.x;
    this.y = pos.y;
    this.angle = pos.angle;
    if (pos.reachedEnd) this.reachedEnd = true;

    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.hitFlash > 0) {
      ctx.fillStyle = '#fff';
    } else {
      ctx.fillStyle = this.color;
    }

    if (this.type === 'grunt') {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'runner') {
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(-this.radius * 0.8, -this.radius * 0.8);
      ctx.lineTo(-this.radius * 0.4, 0);
      ctx.lineTo(-this.radius * 0.8, this.radius * 0.8);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'tank') {
      ctx.fillRect(-this.radius, -this.radius * 0.75, this.radius * 2, this.radius * 1.5);
      ctx.fillStyle = '#453068';
      ctx.fillRect(-this.radius * 0.6, -this.radius * 0.45, this.radius * 1.2, this.radius * 0.9);
    } else if (this.type === 'boss') {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = i % 2 === 0 ? this.radius : this.radius * 0.6;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (this.slowFactor < 1) {
      ctx.fillStyle = 'rgba(17, 138, 178, 0.25)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    this._drawHpBar(ctx);
  }

  _drawHpBar(ctx) {
    const w = this.radius * 2.2;
    const h = 4;
    const x = this.x - w / 2;
    const y = this.y - this.radius - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, w, h);
    const ratio = this.hp / this.maxHp;
    ctx.fillStyle = ratio > 0.5 ? '#06d6a0' : ratio > 0.25 ? '#ffd166' : '#ef476f';
    ctx.fillRect(x, y, w * ratio, h);
  }
}
