// Planes module: manages airplane creation, selection, movement

import { CONFIG } from './config.js';
import { generarCallsignAleatorio } from './utils.js';

export class Planes {
  constructor(board) {
    this.board = board;
    this.selected = null;
    this.planes = new Map(); // planeId -> {element, route, rotation}

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add plane button
    const addPlaneBtn = document.getElementById('addPlane');
    if (addPlaneBtn) {
      addPlaneBtn.addEventListener('click', () => this.addPlane());
    }

    // Apply callsign
    const applyCallsignBtn = document.getElementById('applyCallsign');
    if (applyCallsignBtn) {
      applyCallsignBtn.addEventListener('click', () => this.applyCallsign());
    }

    // Generate callsign
    const generateBtn = document.getElementById('generateCallsign');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        const input = document.getElementById('callsignInput');
        if (input) input.value = generarCallsignAleatorio();
      });
    }

    // Color buttons
    document.querySelectorAll('.colorBtn').forEach(btn => {
      btn.addEventListener('click', () => this.changeColor(btn.dataset.color));
    });

    // Direction buttons
    document.querySelectorAll('#controls button[data-dir]').forEach(btn => {
      btn.addEventListener('click', () => this.rotate(btn.dataset.dir));
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Delete
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.selected) {
        this.deleteSelected();
      }
    });

    // Toggle vehicle (signalman)
    const toggleVehicleBtn = document.getElementById('toggleVehicle');
    if (toggleVehicleBtn) {
      toggleVehicleBtn.addEventListener('click', () => this.toggleVehicle());
    }

    // Deselect on board click
    this.board.addEventListener('mousedown', (e) => {
      if (e.target === this.board || e.target === this.board.querySelector('#bg')) {
        this.deselectAll();
      }
    });
  }

  addPlane() {
    const el = document.createElement('div');
    el.className = 'plane';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.color = CONFIG.COLORS.WHITE;
    el.dataset.rotation = '0';
    el.dataset.vehicle = 'plane';
    el.dataset.planeId = `plane-${Date.now()}`;
    el.innerHTML = this.getPlaneSVG();

    this.makeElementDraggable(el);
    this.setupSelection(el);
    this.board.appendChild(el);
    this.planes.set(el.dataset.planeId, { element: el, route: null, rotation: 0 });

    this.board.dispatchEvent(new CustomEvent('planeAdded', {
      detail: { planeId: el.dataset.planeId, element: el }
    }));

    this.selectPlane(el);
  }

  getPlaneSVG(isSignalman = false) {
    if (isSignalman) {
      return `
        <svg class="shadow" viewBox="0 0 24 24">
          <path d="M21 16v-2l-8-5V3.5a.5.5 0 0 0-1 0V9L4 14v2l8-1.5V21l-2 .5v1l3-.5 3 .5v-1l-2-.5v-6.5l8 1.5z"/>
        </svg>
        <svg class="main" viewBox="0 0 24 24">
          <path d="M21 16v-2l-8-5V3.5a.5.5 0 0 0-1 0V9L4 14v2l8-1.5V21l-2 .5v1l3-.5 3 .5v-1l-2-.5v-6.5l8 1.5z"/>
        </svg>
        <div class="callsign">SEÑALERO</div>
      `;
    }
    return `
      <svg class="shadow" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5a.5.5 0 0 0-1 0V9L4 14v2l8-1.5V21l-2 .5v1l3-.5 3 .5v-1l-2-.5v-6.5l8 1.5z"/>
      </svg>
      <svg class="main" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5a.5.5 0 0 0-1 0V9L4 14v2l8-1.5V21l-2 .5v1l3-.5 3 .5v-1l-2-.5v-6.5l8 1.5z"/>
      </svg>
      <div class="callsign"></div>
    `;
  }

  getCarSVG() {
    return `
      <svg viewBox="0 0 24 24">
        <g>
          <circle cx="6" cy="8" r="2.5" fill="#000"/>
          <circle cx="6" cy="16" r="2.5" fill="#000"/>
          <circle cx="18" cy="8" r="2.5" fill="#000"/>
          <circle cx="18" cy="16" r="2.5" fill="#000"/>
        </g>
        <rect x="7" y="3" width="10" height="18" rx="3" ry="3" fill="currentColor"/>
        <rect x="8" y="5" width="8" height="3" fill="#ADD8E6"/>
      </svg>
      <div class="callsign"></div>
    `;
  }

  setupSelection(el) {
    el.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.selectPlane(el);
    });
  }

  selectPlane(el) {
    if (this.selected) {
      this.selected.classList.remove('selected');
    }
    this.selected = el;
    this.selected.classList.add('selected');

    // Notify route system about selection change
    const event = new CustomEvent('planeSelected', {
      detail: { planeId: el.dataset.planeId, element: el }
    });
    this.board.dispatchEvent(event);
  }

  deselectAll() {
    if (this.selected) {
      this.selected.classList.remove('selected');
      this.selected = null;
    }
  }

  getSelectedPlane() {
    return this.selected;
  }

  getPlaneData(planeId) {
    return this.planes.get(planeId);
  }

  applyCallsign(callsign) {
    if (!this.selected || !this.selected.classList.contains('plane')) return false;
    const oldCallsign = this.selected.querySelector('.callsign').textContent.trim();
    this.selected.querySelector('.callsign').textContent = callsign;
    return { oldCallsign, newCallsign: callsign };
  }

  changeColor(color) {
    if (!this.selected || !this.selected.classList.contains('plane')) return;
    this.selected.style.color = color;
    this.selected.dataset.planeColor = color;
  }

  rotate(direction) {
    if (!this.selected || !this.selected.classList.contains('plane')) return;
    const map = { N: 0, E: 90, S: 180, W: 270 };
    const rot = map[direction];
    this.selected.dataset.rotation = rot;
    this.selected.querySelectorAll('svg').forEach(svg => {
      svg.style.transform = `rotate(${rot}deg)`;
    });
  }

  toggleVehicle() {
    if (!this.selected || !this.selected.classList.contains('plane')) return;

    const isSignalman = this.selected.dataset.vehicle === 'car';

    if (isSignalman) {
      // Back to plane
      this.selected.dataset.vehicle = 'plane';
      this.selected.innerHTML = this.getPlaneSVG(false);
    } else {
      // Switch to signalman (car)
      this.selected.dataset.vehicle = 'car';
      this.selected.innerHTML = this.getCarSVG();
    }

    // Re-apply selection handler
    this.setupSelection(this.selected);
  }

  deleteSelected() {
    if (!this.selected) return;

    const callsign = this.selected.querySelector('.callsign')?.textContent.trim();
    if (callsign) {
      const ficha = document.querySelector(`.control-btn[data-callsign="${callsign}"]`);
      if (ficha) ficha.remove();
    }

    const planeId = this.selected.dataset.planeId;
    this.planes.delete(planeId);
    this.selected.remove();
    this.selected = null;
  }

  handleKeydown(e) {
    if (!this.selected || !this.selected.classList.contains('plane')) return;

    const step = 5;
    const rotStep = 5;
    let rot = parseFloat(this.selected.dataset.rotation) || 0;
    const rad = rot * Math.PI / 180;
    let dx = 0, dy = 0;

    switch (e.key) {
      case 'ArrowUp':
        dx = Math.sin(rad) * step;
        dy = -Math.cos(rad) * step;
        break;
      case 'ArrowDown':
        dx = -Math.sin(rad) * step;
        dy = Math.cos(rad) * step;
        break;
      case 'ArrowLeft':
        rot -= rotStep;
        this.selected.dataset.rotation = rot;
        this.rotatePlaneSVG(rot);
        return;
      case 'ArrowRight':
        rot += rotStep;
        this.selected.dataset.rotation = rot;
        this.rotatePlaneSVG(rot);
        return;
      default:
        return;
    }

    const nl = clamp(this.selected.offsetLeft + dx, 0, this.board.clientWidth - CONFIG.PLANE_SIZE);
    const nt = clamp(this.selected.offsetTop + dy, 0, this.board.clientHeight - CONFIG.PLANE_SIZE);
    this.selected.style.left = nl + 'px';
    this.selected.style.top = nt + 'px';

    // Notify route system about movement
    this.board.dispatchEvent(new CustomEvent('planeMoved', {
      detail: { planeId: this.selected.dataset.planeId, x: nl, y: nt }
    }));
  }

  rotatePlaneSVG(rot) {
    if (!this.selected) return;
    this.selected.querySelectorAll('svg').forEach(svg => {
      svg.style.transform = `rotate(${rot}deg)`;
    });
  }

  makeElementDraggable(el) {
    let offsetX, offsetY, dragging = false;

    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.control-btn') || e.target.closest('.panel')) return;

      dragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        document.body.style.userSelect = '';

        // Notify route system about drag end
        this.board.dispatchEvent(new CustomEvent('planeDragged', {
          detail: {
            planeId: el.dataset.planeId,
            x: el.offsetLeft,
            y: el.offsetTop
          }
        }));
      }
    });
  }

  getSelectedPlanePosition() {
    if (!this.selected) return null;
    return {
      x: this.selected.offsetLeft,
      y: this.selected.offsetTop
    };
  }

  movePlaneTo(planeId, x, y) {
    const data = this.planes.get(planeId);
    if (data) {
      data.element.style.left = `${x}px`;
      data.element.style.top = `${y}px`;
    }
  }
}
