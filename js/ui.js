const UI = {
  elGold: null,
  elLives: null,
  elScore: null,
  elWave: null,
  elMaxWave: null,
  elStartBtn: null,
  elRestartBtn: null,
  elTowerBtns: null,
  elGameOver: null,
  elGoTitle: null,
  elGoScore: null,
  elGoWave: null,

  selectedTower: null,

  init() {
    this.elGold = document.getElementById('gold');
    this.elLives = document.getElementById('lives');
    this.elScore = document.getElementById('score');
    this.elWave = document.getElementById('wave');
    this.elMaxWave = document.getElementById('maxWave');
    this.elStartBtn = document.getElementById('startBtn');
    this.elRestartBtn = document.getElementById('restartBtn');
    this.elGameOver = document.getElementById('gameOver');
    this.elGoTitle = document.getElementById('goTitle');
    this.elGoScore = document.getElementById('goScore');
    this.elGoWave = document.getElementById('goWave');
    this.elTowerBtns = document.querySelectorAll('.tower-btn');

    this.elTowerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.selectTower(type);
      });
    });

    this.elStartBtn.addEventListener('click', () => {
      Game.startWave();
    });

    this.elRestartBtn.addEventListener('click', () => {
      Game.restart();
    });

    this.elMaxWave.textContent = WaveManager.total();
  },

  selectTower(type) {
    if (this.selectedTower === type) {
      this.selectedTower = null;
    } else {
      this.selectedTower = type;
    }
    this.elTowerBtns.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.type === this.selectedTower);
    });
  },

  clearSelection() {
    this.selectedTower = null;
    this.elTowerBtns.forEach(btn => btn.classList.remove('selected'));
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
  },

  setStartDisabled(v) {
    this.elStartBtn.disabled = v;
    this.elStartBtn.textContent = v ? '波次进行中...' : '开始下一波';
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
