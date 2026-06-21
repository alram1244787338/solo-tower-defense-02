const Game = {
  canvas: null,
  ctx: null,
  lastTime: 0,
  running: false,
  paused: false,
  over: false,
  victory: false,

  gold: 0,
  lives: 0,
  score: 0,

  enemies: [],
  towers: [],
  bullets: [],
  effects: [],

  mouseX: 0,
  mouseY: 0,
  mouseInCanvas: false,
  hoveredTower: null,

  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');

    Audio.init();
    GameMap.init();
    UI.init();
    this._bindInput();
    this.reset();

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this._loop.bind(this));
  },

  reset() {
    this.gold = CONFIG.start.gold;
    this.lives = CONFIG.start.lives;
    this.score = 0;
    this.enemies = [];
    this.towers = [];
    this.bullets = [];
    this.effects = [];
    this.over = false;
    this.victory = false;
    this.paused = false;
    WaveManager.reset();
    UI.clearSelection();
    UI.hideGameOver();
    UI.showStart();
    UI.setStartDisabled(false);
    UI.updatePauseButton(false);
    UI.updateMuteButton(false);
    UI.update(this.gold, this.lives, this.score, 0);
  },

  restart() {
    this.reset();
  },

  startWave() {
    if (this.over) return;
    if (WaveManager.startNext()) {
      UI.setStartDisabled(true);
    }
  },

  skipCountdown() {
    if (WaveManager.skipCountdown()) {
      UI.setStartDisabled(true);
    }
  },

  togglePause() {
    if (this.over) return;
    this.paused = !this.paused;
    UI.updatePauseButton(this.paused);
  },

  toggleMute() {
    const muted = Audio.toggleMute();
    UI.updateMuteButton(muted);
  },

  upgradeSelectedTower() {
    const t = UI.selectedPlacedTower;
    if (!t || !t.canUpgrade()) return;
    const cost = t.getUpgradeCost();
    if (this.gold < cost) return;
    this.gold -= cost;
    t.upgrade();
    UI.update(this.gold, this.lives, this.score, WaveManager.index);
  },

  sellSelectedTower() {
    const t = UI.selectedPlacedTower;
    if (!t) return;
    const refund = t.getSellValue();
    this.gold += refund;
    const idx = this.towers.indexOf(t);
    if (idx !== -1) this.towers.splice(idx, 1);
    UI.deselectPlacedTower();
    UI.update(this.gold, this.lives, this.score, WaveManager.index);
  },

  _bindInput() {
    const rect = () => this.canvas.getBoundingClientRect();
    const getPos = e => {
      const r = rect();
      return { x: (e.clientX - r.left) * (this.canvas.width / r.width), y: (e.clientY - r.top) * (this.canvas.height / r.height) };
    };

    this.canvas.addEventListener('mousemove', e => {
      const p = getPos(e);
      this.mouseX = p.x;
      this.mouseY = p.y;
      this.mouseInCanvas = true;
      this._updateHover();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseInCanvas = false;
      this.hoveredTower = null;
    });

    this.canvas.addEventListener('click', e => {
      const p = getPos(e);
      this._onClick(p.x, p.y);
    });

    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      UI.clearSelection();
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') UI.clearSelection();
      if (e.key.toLowerCase() === 'p') this.togglePause();
      if (e.key.toLowerCase() === 'm') this.toggleMute();
      if (e.key === '1') UI.selectTower('archer');
      if (e.key === '2') UI.selectTower('cannon');
      if (e.key === '3') UI.selectTower('frost');
      if (e.key === ' ') { e.preventDefault(); this._handleSpace(); }
    });
  },

  _handleSpace() {
    if (WaveManager.countdownActive) {
      this.skipCountdown();
    } else {
      this.startWave();
    }
  },

  _updateHover() {
    this.hoveredTower = null;
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      if (Math.hypot(this.mouseX - t.x, this.mouseY - t.y) <= t.size + 4) {
        this.hoveredTower = t;
        break;
      }
    }
  },

  _onClick(x, y) {
    if (this.over || this.paused) return;
    if (UI.selectedTower) {
      if (!this._canPlace(x, y)) return;
      const cfg = CONFIG.towers[UI.selectedTower];
      if (this.gold < cfg.cost) return;
      this.gold -= cfg.cost;
      this.towers.push(new Tower(UI.selectedTower, x, y));
      UI.update(this.gold, this.lives, this.score, WaveManager.index);
      return;
    }
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      if (Math.hypot(x - t.x, y - t.y) <= t.size + 4) {
        if (UI.selectedPlacedTower === t) {
          UI.deselectPlacedTower();
        } else {
          UI.selectPlacedTower(t);
        }
        return;
      }
    }
    UI.deselectPlacedTower();
  },

  _canPlace(x, y) {
    if (x < 24 || x > CONFIG.canvas.width - 24) return false;
    if (y < 24 || y > CONFIG.canvas.height - 24) return false;
    if (GameMap.isOnPath(x, y, 14)) return false;
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      if (Math.hypot(x - t.x, y - t.y) < 36) return false;
    }
    return true;
  },

  _loop(now) {
    if (!this.running) return;
    let dt = (now - this.lastTime) / 1000;
    if (dt > 0.05) dt = 0.05;
    this.lastTime = now;

    if (!this.paused && !this.over) this._update(dt);
    this._render();

    requestAnimationFrame(this._loop.bind(this));
  },

  _update(dt) {
    WaveManager.update(dt, this.enemies);

    for (let i = 0; i < this.towers.length; i++) {
      this.towers[i].update(dt, this.enemies, this.bullets);
    }

    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].update(dt);
    }

    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].update(dt, this.enemies);
    }

    for (let i = 0; i < this.effects.length; i++) {
      this.effects[i].update(dt);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.reachedEnd) {
        this.lives--;
        Audio.playLeak();
        this.enemies.splice(i, 1);
        if (this.lives <= 0) {
          this.lives = 0;
          this._gameOver(false);
        }
      } else if (!e.alive) {
        this.gold += e.gold;
        this.score += e.score;
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      if (this.bullets[i].dead) this.bullets.splice(i, 1);
    }
    for (let i = this.effects.length - 1; i >= 0; i--) {
      if (this.effects[i].dead) this.effects.splice(i, 1);
    }

    if (WaveManager.isWaveCleared(this.enemies)) {
      WaveManager.complete();
      if (WaveManager.index >= WaveManager.total()) {
        this._gameOver(true);
      } else {
        this.gold += 30;
        WaveManager.startCountdown();
        UI.setStartDisabled(false);
      }
    }

    UI.update(this.gold, this.lives, this.score, WaveManager.index);
  },

  _gameOver(victory) {
    this.over = true;
    this.victory = victory;
    UI.setStartDisabled(true);
    UI.hideStart();
    UI.showGameOver(victory, this.score, WaveManager.index);
    Audio.playGameOver(victory);
  },

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    GameMap.draw(ctx);

    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      const isSelected = t === UI.selectedPlacedTower;
      const isHovered = t === this.hoveredTower;
      t.draw(ctx, isSelected, isHovered);
    }

    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].draw(ctx);
    }

    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].draw(ctx);
    }

    for (let i = 0; i < this.effects.length; i++) {
      this.effects[i].draw(ctx);
    }

    this._drawPlacementPreview();

    if (this.paused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 56px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏸ 已暂停', this.canvas.width / 2, this.canvas.height / 2);
      ctx.font = '18px Arial';
      ctx.fillStyle = '#ccc';
      ctx.fillText('按 P 或点击按钮继续', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    if (WaveManager.countdownActive && !this.paused) {
      ctx.fillStyle = 'rgba(255, 209, 102, 0.15)';
      ctx.fillRect(0, 0, this.canvas.width, 40);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const sec = Math.ceil(WaveManager.countdown);
      ctx.fillText(`下一波即将开始：${sec} 秒  ·  点击"跳过倒计时"立即开始`, this.canvas.width / 2, 20);
    }
  },

  _drawPlacementPreview() {
    const ctx = this.ctx;
    if (!UI.selectedTower || !this.mouseInCanvas) return;
    const type = UI.selectedTower;
    const cfg = CONFIG.towers[type];
    const x = this.mouseX;
    const y = this.mouseY;
    const canPlace = this._canPlace(x, y) && this.gold >= cfg.cost;

    ctx.fillStyle = canPlace ? 'rgba(6, 214, 160, 0.12)' : 'rgba(239, 71, 111, 0.12)';
    ctx.strokeStyle = canPlace ? 'rgba(6, 214, 160, 0.6)' : 'rgba(239, 71, 111, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, cfg.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 0.7;
    ctx.fillStyle = canPlace ? cfg.color : '#ef476f';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = type === 'archer' ? '箭' : type === 'cannon' ? '炮' : '冰';
    ctx.fillText(label, x, y);
  },
};

window.addEventListener('DOMContentLoaded', () => Game.init());
