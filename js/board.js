// Board module: manages background, zoom, pan, and overlay layers

import { CONFIG } from './config.js';
import { loadPositions, savePositions, clamp } from './utils.js';

export class Board {
  constructor(boardEl, bgEl) {
    this.board = boardEl;
    this.bg = bgEl;
    this.pathLayer = null;

    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.boardWidth = this.board.clientWidth;
    this.boardHeight = this.board.clientHeight;

    this.setupPathLayer();
    this.loadSavedTransform();
    this.setupControls();
  }

  setupPathLayer() {
    this.pathLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.pathLayer.id = 'pathLayer';
    this.pathLayer.setAttribute('pointer-events', 'none');
    this.board.appendChild(this.pathLayer);
  }

  loadSavedTransform() {
    const saved = loadPositions('boardTransform', { zoom: 1, offsetX: 0, offsetY: 0 });
    this.zoom = saved.zoom;
    this.offsetX = saved.offsetX;
    this.offsetY = saved.offsetY;
    this.updateTransform();
  }

  saveTransform() {
    savePositions('boardTransform', {
      zoom: this.zoom,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    });
  }

  updateTransform() {
    this.bg.style.transform = `scale(${this.zoom}) translate(${this.offsetX}px, ${this.offsetY}px)`;
    this.pathLayer.style.transform = `scale(${this.zoom}) translate(${this.offsetX}px, ${this.offsetY}px)`;
    this.saveTransform();
  }

  setupControls() {
    // Brillo
    this.setupButton('darkerBtn', () => {
      this.bg.style.filter = `brightness(${Math.max(0.2, parseFloat(this.bg.style.filter?.match(/[\d.]+/)?.[0] || 1) - 0.1)})`;
    });
    this.setupButton('brighterBtn', () => {
      this.bg.style.filter = `brightness(${Math.min(2, parseFloat(this.bg.style.filter?.match(/[\d.]+/)?.[0] || 1) + 0.1)})`;
    });

    // Zoom
    this.setupButton('zoomOutBtn', () => {
      this.zoom = clamp(this.zoom - 0.05, 1, 4);
      this.updateTransform();
    });
    this.setupButton('zoomInBtn', () => {
      this.zoom = clamp(this.zoom + 0.05, 1, 4);
      this.updateTransform();
    });

    // Pan
    this.setupButton('moveLeftBtn', () => { this.offsetX += 10; this.updateTransform(); });
    this.setupButton('moveRightBtn', () => { this.offsetX -= 10; this.updateTransform(); });
    this.setupButton('moveDownBtn', () => { this.offsetY -= 10; this.updateTransform(); });
    this.setupButton('moveUpBtn', () => { this.offsetY += 10; this.updateTransform(); });
  }

  setupButton(id, handler) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handler);
  }

  clearPaths() {
    while (this.pathLayer.firstChild) {
      this.pathLayer.removeChild(this.pathLayer.firstChild);
    }
  }

  drawRoute(route, planeSize) {
    this.clearPaths();
    if (!route || route.checkpoints.length < 2) return;

    // Create path string
    const pts = route.checkpoints.map(cp => {
      const x = cp.x + planeSize / 2;
      const y = cp.y + planeSize / 2;
      return `${x},${y}`;
    }).join(' ');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', pts);
    polyline.setAttribute('stroke', CONFIG.ROUTE.LINE_COLOR);
    polyline.setAttribute('stroke-width', CONFIG.ROUTE.LINE_WIDTH);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke-dasharray', '5,5');

    this.pathLayer.appendChild(polyline);
  }

  resize() {
    this.boardWidth = this.board.clientWidth;
    this.boardHeight = this.board.clientHeight;
  }
}
