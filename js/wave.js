const WaveManager = {
  index: 0,
  active: false,
  spawnQueue: [],
  timer: 0,
  countdown: 0,
  countdownActive: false,

  reset() {
    this.index = 0;
    this.active = false;
    this.spawnQueue = [];
    this.timer = 0;
    this.countdown = 0;
    this.countdownActive = false;
  },

  startNext() {
    if (this.index >= CONFIG.waves.length) return false;
    if (this.active) return false;
    const wave = CONFIG.waves[this.index];
    this.spawnQueue = [];
    for (let i = 0; i < wave.enemies.length; i++) {
      const group = wave.enemies[i];
      for (let j = 0; j < group.count; j++) {
        this.spawnQueue.push({ type: group.type, delay: group.delay });
      }
    }
    this.active = true;
    this.timer = 0;
    this.index++;
    this.countdownActive = false;
    return true;
  },

  startCountdown() {
    if (this.active) return false;
    if (this.index >= CONFIG.waves.length) return false;
    this.countdown = CONFIG.waveCountdown;
    this.countdownActive = true;
    return true;
  },

  skipCountdown() {
    if (!this.countdownActive) return false;
    this.countdown = 0;
    this.countdownActive = false;
    return this.startNext();
  },

  update(dt, enemies) {
    if (this.countdownActive) {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.countdown = 0;
        this.countdownActive = false;
        this.startNext();
      }
    }
    if (!this.active) return;
    this.timer -= dt;
    while (this.spawnQueue.length > 0 && this.timer <= 0) {
      const next = this.spawnQueue.shift();
      enemies.push(new Enemy(next.type));
      this.timer += next.delay;
    }
  },

  isWaveCleared(enemies) {
    return this.active && this.spawnQueue.length === 0 && enemies.length === 0;
  },

  complete() {
    this.active = false;
  },

  total() {
    return CONFIG.waves.length;
  },
};
