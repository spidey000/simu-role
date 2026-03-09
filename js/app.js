// Main Application Entry Point
// Initializes all modules and coordinates interactions

import { Board } from './board.js';
import { Planes } from './planes.js';
import { Checkpoints } from './checkpoints.js';
import { Routes } from './routes.js';
import { Controls } from './controls.js';
import { actualizarMETAR, actualizarFichaRW, actualizarRelojUTC } from './utils.js';

class App {
  constructor() {
    this.init();
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  start() {
    // Get main board element
    const boardEl = document.getElementById('board');
    const bgEl = document.getElementById('bg');

    if (!boardEl || !bgEl) {
      console.error('Board or background element not found');
      return;
    }

    // Initialize Board (handles zoom, pan, background, path layer)
    const board = new Board(boardEl, bgEl);

    // Initialize Planes module
    const planes = new Planes(board);

    // Initialize Checkpoints module
    const checkpoints = new Checkpoints(board);

    // Initialize Routes module (depends on planes)
    const routes = new Routes(board, planes);

    // Initialize Controls module (depends on planes, routes)
    const controls = new Controls(board, planes, routes);

    // Store references for later access
    this.board = board;
    this.planes = planes;
    this.checkpoints = checkpoints;
    this.routes = routes;
    this.controls = controls;

    // Setup METAR and clocks
    this.setupSystemDisplays();

    // Make radar and control bay draggable with Ctrl+click
    this.setupDraggableUI();

    // Setup window resize handler
    window.addEventListener('resize', () => {
      board.resize();
    });

    console.log('Air Traffic Control Simulator initialized');
  }

  setupSystemDisplays() {
    // UTC Clock
    const utcClock = document.getElementById('utcClock');
    if (utcClock) {
      actualizarRelojUTC(utcClock);
      setInterval(() => actualizarRelojUTC(utcClock), 1000);
    }

    // METAR
    actualizarMETAR();
    setInterval(actualizarMETAR, 5 * 60 * 1000);

    // RW Ficha
    setTimeout(() => actualizarFichaRW(), 100);
  }

  setupDraggableUI() {
    import('./draggable.js').then(({ makeDraggable }) => {
      // Control bay is already set up in Controls module

      // Radar
      const radar = document.getElementById('radarContainer');
      if (radar) {
        makeDraggable(radar, { requireCtrl: true });
      }
    });
  }
}

// Start the application
new App();
