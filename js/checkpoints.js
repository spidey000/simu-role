// Checkpoints module: manages checkpoint creation and labeling

import { CONFIG } from './config.js';

export class Checkpoints {
  constructor(board) {
    this.board = board;
    this.checkpoints = new Map();
    this.selected = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const addCheckpointBtn = document.getElementById('addCheckpointBtn');
    if (addCheckpointBtn) {
      addCheckpointBtn.addEventListener('click', () => this.addCheckpoint());
    }

    const applyCheckpointBtn = document.getElementById('applyCheckpointBtn');
    if (applyCheckpointBtn) {
      applyCheckpointBtn.addEventListener('click', () => this.applyLabel());
    }

    const insertTextBtn = document.getElementById('insertTextBtn');
    if (insertTextBtn) {
      insertTextBtn.addEventListener('click', () => this.insertText());
    }

    this.board.addEventListener('click', (e) => {
      if (e.target === this.board || e.target === this.board.querySelector('#bg')) {
        this.selected = null;
        document.querySelectorAll('.checkpoint.selected').forEach(cp => cp.classList.remove('selected'));
      }
    });
  }

  addCheckpoint() {
    const el = document.createElement('div');
    el.className = 'checkpoint';
    el.style.left = '50%';
    el.style.top = '60%';
    el.style.color = CONFIG.COLORS.WHITE;
    el.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12 4L20 20H4Z"/></svg>
      <div class='cpLabel'></div>
    `;

    this.makeDraggable(el);
    this.setupSelection(el);
    this.board.appendChild(el);
    this.checkpoints.set(el, { id: `cp-${Date.now()}`, label: '' });
  }

  applyLabel() {
    if (!this.selectedCheckpoint()) return;
    const input = document.getElementById('checkpointInput');
    if (!input) return;

    const label = input.value.trim();
    if (label) {
      this.selectedCheckpoint().querySelector('.cpLabel').textContent = label;
      const cpData = this.checkpoints.get(this.selectedCheckpoint());
      if (cpData) cpData.label = label;
      input.value = '';
    }
  }

  insertText() {
    const input = document.getElementById('textInput');
    if (!input || !input.value.trim()) return;

    const el = document.createElement('div');
    el.className = 'textmarker';
    el.style.left = '50%';
    el.style.top = '65%';
    el.textContent = input.value.trim();

    this.makeDraggable(el);
    this.setupSelection(el);
    this.board.appendChild(el);

    input.value = '';
  }

  selectedCheckpoint() {
    if (!this.selected) return null;
    if (!this.selected.classList.contains('checkpoint')) return null;
    return this.selected;
  }

  setupSelection(el) {
    el.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.selectCheckpoint(el);
    });
  }

  selectCheckpoint(el) {
    // Deselect previous
    document.querySelectorAll('.selected').forEach(item => {
      if (item.classList.contains('checkpoint')) {
        item.classList.remove('selected');
      }
    });

    this.selected = el;
    this.selected.classList.add('selected');
  }

  makeDraggable(el) {
    let offsetX, offsetY, dragging = false;

    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

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
      }
    });
  }

  reset() {
    this.checkpoints.forEach((cp, el) => el.remove());
    this.checkpoints.clear();
    this.selected = null;
  }
}
