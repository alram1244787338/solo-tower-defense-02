const UI = {
  elGold: null,
  elLives: null,
  elScore: null,
  elWave: null,
  elMaxWave: null,
  elStartBtn: null,
  elRestartBtn: null,
  elPauseBtn: null,
  elMuteBtn: null,
  elTowerBtns: null,
  elGameOver: null,
  elGoTitle: null,
  elGoScore: null,
  elGoWave: null,
  elTowerInfo: null,
  elTiName: null,
  elTiLevel: null,
  elTiDamage: null,
  elTiRange: null,
  elTiRate: null,
  elUpgradeBtn: null,
  elSellBtn: null,
  elCountdown: null,
  elCdTime: null,

  selectedTower: null,
  selectedPlacedTower: null,

  init() {
    this.elGold = document.getElementById('gold');
    this.elLives = document.getElementById('lives');
    this.elScore = document.getElementById('score');
    this.elWave = document.getElementById('wave');
    this.elMaxWave = document.getElementById('maxWave');
    this.elStartBtn = document.getElementById('startBtn');
    this.elRestartBtn = document.getElementById('restartBtn');
    this.elPauseBtn = document.getElementById('pauseBtn');
    this.elMuteBtn = document.getElementById('muteBtn');
    this.elTowerBtns = document.querySelectorAll('.tower-btn');
    this.elGameOver = document.getElementById('gameOver');
    this.elGoTitle = document.getElementById('goTitle');
    this.elGoScore = document.getElementById('goScore');
    this.elGoWave = document.getElementById('goWave');
    this.elTowerInfo = document.getElementById('towerInfo');
    this.elTiName = document.getElementById('tiName');
    this.elTiLevel = document.getElementById('tiLevel');
    this.elTiDamage = document.getElementById('tiDamage');
    this.elTiRange = document.getElementById('tiRange');
    this.elTiRate = document.getElementById('tiRate');
    this.elUpgradeBtn = document.getElementById('upgradeBtn');
    this.elSellBtn = document.getElementById('sellBtn');
    this.elCountdown = document.getElementById('countdown');
    this.elCdTime = document.getElementById('cdTime');

    this.elTowerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.selectTower(type);
      });
    });

    this.elStartBtn.addEventListener('click', () => {
      if (WaveManager.countdownActive) {
        Game.skipCountdown();
      } else {
        Game.startWave();
      }
    });

    this.elRestartBtn.addEventListener('click', () => {
      Game.restart();
    });

    this.elPauseBtn.addEventListener('click', () => {
      Game.togglePause();
    });

    this.elMuteBtn.addEventListener('click', () => {
      Game.toggleMute();
    });

    this.elUpgradeBtn.addEventListener('click', () => {
      Game.upgradeSelectedTower();
    });

    this.elSellBtn.addEventListener('click', () => {
      Game.sellSelectedTower();
    });

    this.elMaxWave.textContent = WaveManager.total();
  },

  selectTower(type) {
    if (this.selectedTower === type) {
      this.selectedTower = null;
    } else {
      this.selectedTower = type;
      this.deselectPlacedTower();
    }
    this.elTowerBtns.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.type === this.selectedTower);
    });
  },

  selectPlacedTower(tower) {
    this.selectedPlacedTower = tower;
    this.selectedTower = null;
    this.elTowerBtns.forEach(btn => btn.classList.remove('selected'));
    this.updateTowerInfo(tower);
    this.elTowerInfo.classList.add('show');
  },

  deselectPlacedTower() {
    this.selectedPlacedTower = null;
    this.elTowerInfo.classList.remove('show');
  },

  clearSelection() {
    this.selectedTower = null;
    this.deselectPlacedTower();
    this.elTowerBtns.forEach(btn => btn.classList.remove('selected'));
  },

  updateTowerInfo(tower) {
    if (!tower) {
      this.elTowerInfo.classList.remove('show');
      return;
    }
    this.elTiName.textContent = `${tower.cfg.name} Lv.${tower.level}`;
    this.elTiLevel.textContent = tower.level + ' / ' + CONFIG.maxTowerLevel;
    this.elTiDamage.textContent = tower.damage;
    this.elTiRange.textContent = tower.range;
    this.elTiRate.textContent = (1 / tower.fireRate).toFixed(1);

    const upCost = tower.getUpgradeCost();
    const sellVal = tower.getSellValue();
    if (upCost === null) {
      this.elUpgradeBtn.textContent = '已满级';
      this.elUpgradeBtn.disabled = true;
    } else {
      this.elUpgradeBtn.textContent = `升级 💰${upCost}`;
      this.elUpgradeBtn.disabled = Game.gold < upCost;
    }
    this.elSellBtn.textContent = `出售 💰${sellVal}`;
  },

  update(gold, lives, score, wave) {
    this.elGold.textContent = gold;
    this.elLives.textContent = lives;
    this.elScore.textContent = score;
    this.elWave.textContent = wave;

    this.elTowerBtns.forEach(btn => {
      const type = btn.dataset.type;
      const cost = CONFIG.towers[type].cost;
      btn.disabled = gold < cost;
    });

    if (this.selectedPlacedTower) {
      this.updateTowerInfo(this.selectedPlacedTower);
    }

    if (WaveManager.countdownActive) {
      this.elCountdown.classList.add('show');
      this.elCdTime.textContent = Math.ceil(WaveManager.countdown);
      this.elStartBtn.textContent = '跳过倒计时';
      this.elStartBtn.disabled = false;
    } else {
      this.elCountdown.classList.remove('show');
    }
  },

  setStartDisabled(v) {
    if (WaveManager.countdownActive) return;
    this.elStartBtn.disabled = v;
    this.elStartBtn.textContent = v ? '波次进行中...' : '开始下一波';
  },

  updatePauseButton(paused) {
    this.elPauseBtn.classList.toggle('paused', paused);
    this.elPauseBtn.textContent = paused ? '▶' : '⏸';
    this.elPauseBtn.title = paused ? '继续 (P)' : '暂停 (P)';
  },

  updateMuteButton(muted) {
    this.elMuteBtn.classList.toggle('muted', muted);
    this.elMuteBtn.textContent = muted ? '🔇' : '🔊';
    this.elMuteBtn.title = muted ? '取消静音 (M)' : '静音 (M)';
  },

  hideStart() {
    this.elStartBtn.style.display = 'none';
    this.elRestartBtn.style.display = 'block';
  },

  showStart() {
    this.elStartBtn.style.display = 'block';
    this.elRestartBtn.style.display = 'none';
  },

  showGameOver(victory, score, wave) {
    this.elGoTitle.textContent = victory ? '🎉 胜利！' : '游戏结束';
    this.elGoTitle.style.color = victory ? '#06d6a0' : '#ef476f';
    this.elGoScore.textContent = score;
    this.elGoWave.textContent = wave;
    this.elGameOver.classList.add('show');
  },

  hideGameOver() {
    this.elGameOver.classList.remove('show');
  },
};
