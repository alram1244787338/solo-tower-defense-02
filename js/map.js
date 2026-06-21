const GameMap = {
  points: [],
  segments: [],
  totalLength: 0,

  init() {
    this.points = CONFIG.path.map(p => ({ x: p.x, y: p.y }));
    this.segments = [];
    this.totalLength = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      const a = this.points[i];
      const b = this.points[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      this.segments.push({
        a, b,
        length: len,
        startDist: this.totalLength,
        nx: dx / len,
        ny: dy / len,
      });
      this.totalLength += len;
    }
  },

  posAtDistance(dist) {
    if (dist <= 0) {
      const s = this.segments[0];
      return { x: s.a.x, y: s.a.y, angle: Math.atan2(s.ny, s.nx), reachedEnd: false };
    }
    if (dist >= this.totalLength) {
      const s = this.segments[this.segments.length - 1];
      return { x: s.b.x, y: s.b.y, angle: Math.atan2(s.ny, s.nx), reachedEnd: true };
    }
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      if (dist <= s.startDist + s.length) {
        const t = dist - s.startDist;
        return {
          x: s.a.x + s.nx * t,
          y: s.a.y + s.ny * t,
          angle: Math.atan2(s.ny, s.nx),
          reachedEnd: false,
        };
      }
    }
    return { x: 0, y: 0, angle: 0, reachedEnd: true };
  },

  distToSegment(px, py, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    let t = ((px - a.x) * dx + (py - a.y) * dy) / (len2 || 1);
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * dx;
    const cy = a.y + t * dy;
    return Math.hypot(px - cx, py - cy);
  },

  isOnPath(px, py, margin = 0) {
    const threshold = CONFIG.pathWidth / 2 + margin;
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      if (this.distToSegment(px, py, s.a, s.b) < threshold) {
        return true;
      }
    }
    return false;
  },

  draw(ctx) {
    const w = CONFIG.pathWidth;
    ctx.strokeStyle = '#3a3a5a';
    ctx.lineWidth = w + 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    this._pathTrace(ctx);
    ctx.stroke();

    ctx.strokeStyle = '#8a7d5f';
    ctx.lineWidth = w;
    ctx.beginPath();
    this._pathTrace(ctx);
    ctx.stroke();

    ctx.strokeStyle = '#c8b888';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    this._pathTrace(ctx);
    ctx.stroke();
    ctx.setLineDash([]);

    const start = this.points[0];
    const end = this.points[this.points.length - 1];
    ctx.fillStyle = '#06d6a0';
    ctx.beginPath();
    ctx.arc(start.x + 20, start.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('入', start.x + 20, start.y);

    ctx.fillStyle = '#ef476f';
    ctx.beginPath();
    ctx.arc(end.x - 20, end.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('终', end.x - 20, end.y);
  },

  _pathTrace(ctx) {
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
  },
};
