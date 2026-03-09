// Routes module: manages route creation, path drawing, and checkpoint navigation

import { CONFIG } from './config.js';

export class Routes {
  constructor(board, planes) {
    this.board = board;
    this.planes = planes;
    this.routes = new Map(); // planeId -> Route object
    this.isRouteMode = false;
    this.tempCheckpoints = []; // For route mode creation

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Board click for route creation
    this.board.addEventListener('click', (e) => this.handleBoardClick(e));

    // Listen for plane selection changes
    this.board.addEventListener('planeSelected', (e) => {
      this.onPlaneSelected(e.detail.planeId);
    });

    // Listen for plane deselection to reset cursor
    this.board.addEventListener('planeDeselected', () => {
      if (this.isRouteMode) {
        this.isRouteMode = false;
        this.board.style.cursor = 'default';
      }
    });

    // Listen for plane movement to check checkpoint arrival
    this.board.addEventListener('planeDragged', (e) => {
      this.checkCheckpointArrival(e.detail.planeId);
    });
    this.board.addEventListener('planeMoved', (e) => {
      this.checkCheckpointArrival(e.detail.planeId);
    });
  }

  toggleRouteMode() {
    this.isRouteMode = !this.isRouteMode;
    this.board.style.cursor = this.isRouteMode ? 'crosshair' : 'default';

    // Clear temp checkpoints if exiting route mode
    if (!this.isRouteMode) {
      this.clearTemporaryCheckpoints();
    }

    return this.isRouteMode;
  }

  handleBoardClick(e) {
    if (!this.isRouteMode) return;
    if (!this.planes.getSelectedPlane()) return;

    const rect = this.board.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.addCheckpointToRoute(x, y);
  }

  addCheckpointToRoute(x, y) {
    const selectedPlane = this.planes.getSelectedPlane();
    if (!selectedPlane) return;

    const planeId = selectedPlane.dataset.planeId;
    let route = this.routes.get(planeId);

    if (!route) {
      route = {
        planeId,
        checkpoints: [],
        currentIndex: 0,
        isNavigating: false,
        animationId: null,
      };
      this.routes.set(planeId, route);
    }

    const checkpoint = {
      id: `cp-${Date.now()}`,
      x: x - CONFIG.CHECKPOINT_SIZE / 2,
      y: y - CONFIG.CHECKPOINT_SIZE / 2,
      label: `${route.checkpoints.length + 1}`,
      element: null,
    };

    route.checkpoints.push(checkpoint);
    this.createCheckpointElement(checkpoint, route);
    this.drawRoute(planeId);

    // If this is the first checkpoint, enable advance button
    if (route.checkpoints.length === 1) {
      this.enableAdvanceButton();
    }
  }

  createCheckpointElement(checkpoint, route) {
    const el = document.createElement('div');
    el.className = 'checkpoint';
    el.style.left = `${checkpoint.x}px`;
    el.style.top = `${checkpoint.y}px`;
    el.style.color = CONFIG.COLORS.WHITE;
    el.dataset.checkpointId = checkpoint.id;
    el.dataset.planeId = route.planeId;
    el.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12 4L20 20H4Z"/></svg>
      <div class='cpLabel'>${checkpoint.label}</div>
    `;

    // Make checkpoint draggable to reposition
    let offsetX, offsetY, dragging = false;
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      e.stopPropagation();
    });

    const onMouseMove = (e) => {
      if (!dragging) return;
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
      checkpoint.x = e.clientX - offsetX;
      checkpoint.y = e.clientY - offsetY;
      this.drawRoute(route.planeId);
    };

    const onMouseUp = () => {
      if (dragging) {
        dragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Click to set as active checkpoint (manual navigation)
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.isRouteMode) {
        // Allow selecting checkpoint as next target
        this.setActiveCheckpoint(route.planeId, checkpoint.id);
      }
    });

    this.board.appendChild(el);
    checkpoint.element = el;
  }

  drawRoute(planeId) {
    const route = this.routes.get(planeId);
    if (!route || route.checkpoints.length < 2) return;

    // Clear existing path
    const existingPath = document.getElementById('routePath');
    if (existingPath) existingPath.remove();

    // Create SVG path
    const svg = document.getElementById('pathLayer');
    if (!svg) return;

    // Build polyline points
    const points = route.checkpoints.map(cp =>
      `${cp.x + CONFIG.CHECKPOINT_SIZE / 2},${cp.y + CONFIG.CHECKPOINT_SIZE / 2}`
    ).join(' ');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.id = 'routePath';
    polyline.setAttribute('points', points);
    polyline.setAttribute('stroke', CONFIG.ROUTE.LINE_COLOR);
    polyline.setAttribute('stroke-width', CONFIG.ROUTE.LINE_WIDTH);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke-dasharray', '8,4');

    svg.appendChild(polyline);

    // Update checkpoint visual states
    this.updateCheckpointStates(route);
  }

  updateCheckpointStates(route) {
    route.checkpoints.forEach((cp, idx) => {
      if (!cp.element) return;

      cp.element.classList.remove('active', 'completed', 'pending');

      if (idx < route.currentIndex) {
        cp.element.classList.add('completed');
      } else if (idx === route.currentIndex) {
        cp.element.classList.add('active');
      } else {
        cp.element.classList.add('pending');
      }
    });
  }

  setActiveCheckpoint(planeId, checkpointId) {
    const route = this.routes.get(planeId);
    if (!route) return;

    const idx = route.checkpoints.findIndex(cp => cp.id === checkpointId);
    if (idx !== -1) {
      route.currentIndex = idx;
      this.updateCheckpointStates(route);
      this.advancePlaneToCheckpoint(planeId, idx);
    }
  }

  advancePlaneToCheckpoint(planeId, checkpointIndex) {
    const route = this.routes.get(planeId);
    if (!route || checkpointIndex >= route.checkpoints.length) return;

    route.isNavigating = true;

    const checkpoint = route.checkpoints[checkpointIndex];
    const planeEl = this.planes.selected;
    if (!planeEl || planeEl.dataset.planeId !== planeId) return;

    // Calculate target position (centered on checkpoint)
    const targetX = checkpoint.x + CONFIG.CHECKPOINT_SIZE / 2 - CONFIG.PLANE_SIZE / 2;
    const targetY = checkpoint.y + CONFIG.CHECKPOINT_SIZE / 2 - CONFIG.PLANE_SIZE / 2;

    // Animate movement
    this.animatePlaneMovement(planeEl, targetX, targetY, () => {
      // Arrived at checkpoint
      route.currentIndex++;
      if (route.currentIndex < route.checkpoints.length) {
        // Notify user to continue
        this.showArrivalNotification(route.planeId, checkpoint.label);
      } else {
        // Route completed
        this.onRouteComplete(planeId);
      }
      this.drawRoute(planeId);
    });
  }

  animatePlaneMovement(planeEl, targetX, targetY, onComplete) {
    const duration = 500;
    const startX = planeEl.offsetLeft;
    const startY = planeEl.offsetTop;
    const startTime = performance.now();
    const planeId = planeEl.dataset.planeId;
    const route = this.routes.get(planeId);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutQuad(progress);

      const currentX = startX + (targetX - startX) * eased;
      const currentY = startY + (targetY - startY) * eased;

      planeEl.style.left = `${currentX}px`;
      planeEl.style.top = `${currentY}px`;

      if (progress < 1) {
        route.animationId = requestAnimationFrame(animate);
      } else {
        route.animationId = null;
        if (onComplete) onComplete();
      }
    };

    route.animationId = requestAnimationFrame(animate);
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  showArrivalNotification(planeId, checkpointLabel) {
    // Could show a toast or highlight the next checkpoint
    console.log(`Arrived at checkpoint ${checkpointLabel}. Ready for next.`);
  }

  onRouteComplete(planeId) {
    const route = this.routes.get(planeId);
    if (route) {
      route.isNavigating = false;
      this.disableAdvanceButton();
      console.log(`Route completed for plane ${planeId}`);
    }
  }

  checkCheckpointArrival(planeId) {
    const route = this.routes.get(planeId);
    if (!route || route.currentIndex >= route.checkpoints.length) return;

    const planeEl = this.planes.selected;
    if (!planeEl || planeEl.dataset.planeId !== planeId) return;

    const checkpoint = route.checkpoints[route.currentIndex];
    const planeX = planeEl.offsetLeft + CONFIG.PLANE_SIZE / 2;
    const planeY = planeEl.offsetTop + CONFIG.PLANE_SIZE / 2;
    const cpX = checkpoint.x + CONFIG.CHECKPOINT_SIZE / 2;
    const cpY = checkpoint.y + CONFIG.CHECKPOINT_SIZE / 2;

    const distance = Math.sqrt(
      Math.pow(planeX - cpX, 2) + Math.pow(planeY - cpY, 2)
    );

    if (distance < CONFIG.ROUTE.ARRIVAL_THRESHOLD) {
      // Auto-advance if navigating
      if (route.isNavigating) {
        this.advancePlaneToCheckpoint(planeId, route.currentIndex);
      }
    }
  }

  onPlaneSelected(planeId) {
    // Update UI based on selected plane's route
    const hasRoute = this.routes.has(planeId);
    this.updateAdvanceButtonState(hasRoute);
  }

  enableAdvanceButton() {
    const btn = document.getElementById('advanceBtn');
    if (btn) btn.disabled = false;
  }

  disableAdvanceButton() {
    const btn = document.getElementById('advanceBtn');
    if (btn) btn.disabled = true;
  }

  updateAdvanceButtonState(hasRoute) {
    const btn = document.getElementById('advanceBtn');
    if (btn) {
      btn.disabled = !hasRoute;
      btn.style.opacity = hasRoute ? '1' : '0.5';
    }
  }

  clearTemporaryCheckpoints() {
    // Remove any unassigned checkpoint elements
    const allCheckpoints = document.querySelectorAll('.checkpoint');
    allCheckpoints.forEach(cp => {
      if (!cp.dataset.planeId) {
        cp.remove();
      }
    });
  }

  reset() {
    // Stop any ongoing animations
    this.routes.forEach(route => {
      if (route.animationId) {
        cancelAnimationFrame(route.animationId);
      }
    });

    // Remove all checkpoint elements belonging to routes
    this.routes.forEach(route => {
      route.checkpoints.forEach(cp => {
        if (cp.element) cp.element.remove();
      });
    });

    this.routes.clear();
    this.tempCheckpoints = [];
    this.clearTemporaryCheckpoints();

    // Clear path layer
    const pathLayer = document.getElementById('pathLayer');
    if (pathLayer) {
      while (pathLayer.firstChild) {
        pathLayer.removeChild(pathLayer.firstChild);
      }
    }

    this.disableAdvanceButton();
  }
}
