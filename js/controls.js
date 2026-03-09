// Controls module: manages control bay, fichas, and compact UI panels

import { CONFIG } from './config.js';
import { generarEOBT, savePositions, loadPositions } from './utils.js';

export class Controls {
  constructor(board, planes, routes) {
    this.board = board;
    this.planes = planes;
    this.routes = routes;

    this.controlBay = null;
    this.toolbar = null;
    this.advanceBtn = null;
    this.routeModeBtn = null;

    this.setupToolbar();
    this.setupControlBay();
    this.setupPanels();
    this.setupDraggableElements();
    this.setupEventListeners();
  }

  setupToolbar() {
    // Create compact toolbar
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'toolbar';
    this.toolbar.innerHTML = `
      <button id="addPlaneBtn" title="Añadir Avión">➕ Avión</button>
      <button id="addCheckpointBtn" title="Añadir Checkpoint">📍 CP</button>
      <button id="routeModeBtn" title="Modo Ruta (clicks crean ruta)">🛤️ Ruta</button>
      <button id="advanceBtn" title="Avanzar al siguiente checkpoint" disabled>⏭️ Avanzar</button>
      <div style="display:flex; align-items:center; gap:4px;">
        <span style="font-size:12px;">Color:</span>
        <div class="colorBtn" data-color="${CONFIG.COLORS.WHITE}" style="background:#FFF"></div>
        <div class="colorBtn" data-color="${CONFIG.COLORS.YELLOW}" style="background:#FF0"></div>
        <div class="colorBtn" data-color="${CONFIG.COLORS.GREEN}" style="background:#0F0"></div>
        <div class="colorBtn" data-color="${CONFIG.COLORS.CYAN}" style="background:#0FF"></div>
        <div class="colorBtn" data-color="${CONFIG.COLORS.ORANGE}" style="background:#FA0"></div>
      </div>
      <input type="text" id="callsignInput" maxlength="8" placeholder="ID Avión" style="width:100px;">
      <button id="generateCallsignBtn" title="Generar ID aleatorio">🎲</button>
      <button id="applyCallsignBtn" title="Aplicar ID">✅</button>
      <button id="toggleVehicleBtn" title="Toggle señalero">🚗</button>
      <button id="nuevoPDVBtn" title="Nuevo PDV">📅 PDV</button>
      <button id="resetBtn" title="Reset todo">🗑️ Reset</button>
      <div style="display:flex;align-items:center;gap:4px;"><span style="font-size:12px;">CP:</span><input type="text" id="checkpointInput" maxlength="8" placeholder="Label" style="width:60px;"><button id="applyCheckpointBtn">✅</button></div>
      <div style="display:flex;align-items:center;gap:4px;"><span style="font-size:12px;">Txt:</span><input type="text" id="textInput" maxlength="20" placeholder="Texto" style="width:80px;"><button id="insertTextBtn">📝</button></div>
      <div style="display:flex;align-items:center;gap:2px;">
        <button id="darkerBtn" title="Oscurecer">🌙</button>
        <button id="brighterBtn" title="Aclarar">☀️</button>
        <button id="zoomInBtn" title="Zoom +">🔍+</button>
        <button id="zoomOutBtn" title="Zoom -">🔍-</button>
        <button id="moveLeftBtn" title="Mover Izquierda">⬅️</button>
        <button id="moveRightBtn" title="Mover Derecha">➡️</button>
        <button id="moveUpBtn" title="Mover Arriba">⬆️</button>
        <button id="moveDownBtn" title="Mover Abajo">⬇️</button>
      </div>
      <div style="display:flex;align-items:center;gap:2px;">
        <button id="rotateNBtn" title="Norte" data-dir="N">N</button>
        <button id="rotateEBtn" title="Este" data-dir="E">E</button>
        <button id="rotateSBtn" title="Sur" data-dir="S">S</button>
        <button id="rotateWBtn" title="Oeste" data-dir="W">W</button>
      </div>
    `;

    document.body.appendChild(this.toolbar);

    // Store references
    this.addPlaneBtn = this.toolbar.querySelector('#addPlaneBtn');
    this.addCheckpointBtn = this.toolbar.querySelector('#addCheckpointBtn');
    this.routeModeBtn = this.toolbar.querySelector('#routeModeBtn');
    this.advanceBtn = this.toolbar.querySelector('#advanceBtn');
    this.callsignInput = this.toolbar.querySelector('#callsignInput');
    this.generateCallsignBtn = this.toolbar.querySelector('#generateCallsignBtn');
    this.applyCallsignBtn = this.toolbar.querySelector('#applyCallsignBtn');
    this.toggleVehicleBtn = this.toolbar.querySelector('#toggleVehicleBtn');
    this.nuevoPDVBtn = this.toolbar.querySelector('#nuevoPDVBtn');
    this.resetBtn = this.toolbar.querySelector('#resetBtn');
  }

  setupControlBay() {
    // Replace existing controlBay with a smaller, draggable version
    this.controlBay = document.getElementById('controlBay');
    if (!this.controlBay) {
      this.controlBay = document.createElement('div');
      this.controlBay.id = 'controlBay';
      document.body.appendChild(this.controlBay);
    }

    this.controlBay.innerHTML = `
      <div class="column" id="col1">
        <div class="slot"></div><div class="slot"></div>
        <div class="slot"><button class="control-btn" draggable="true">START-UP</button></div>
        <div class="slot"></div><div class="slot"></div>
        <div class="slot"><button class="control-btn" draggable="true">TWY</button></div>
        <div class="slot"></div><div class="slot"></div>
      </div>
      <div class="column" id="col2">
        <div class="slot"></div><div class="slot"></div>
        <div class="slot"></div><div class="slot"></div>
        <div class="slot"></div><div class="slot"></div>
        <div class="slot"><button class="control-btn" draggable="true">RW</button></div>
        <div class="slot"></div>
      </div>
      <div class="column" id="col3">
        <div class="slot"></div><div class="slot"></div>
        <div class="slot"></div><div class="slot"></div>
        <div class="slot"></div><div class="slot"></div>
        <div class="slot"></div><div class="slot"></div>
      </div>
    `;

    // Restore position if saved
    const savedBay = loadPositions('controlBayPos', { left: 10, top: null });
    if (savedBay.left) this.controlBay.style.left = savedBay.left + 'px';
    if (savedBay.top) this.controlBay.style.top = savedBay.top + 'px';
    if (savedBay.bottom) this.controlBay.style.bottom = savedBay.bottom + 'px';
  }

  setupPanels() {
    // Not using modal panels anymore; all in toolbar
  }

  setupDraggableElements() {
    import('./draggable.js').then(({ makePersistentDraggable }) => {
      makePersistentDraggable(this.controlBay, 'controlBayPos');
    });
  }

  setupEventListeners() {
    // Listen for plane added to generate ficha
    this.board.addEventListener('planeAdded', (e) => {
      this.generateFichaForPlane(e.detail.element);
    });

    // Listen for plane toggled to regenerate ficha
    this.board.addEventListener('planeToggled', (e) => {
      this.generateFichaForPlane(e.detail.element);
    });

    // Toolbar button events
    this.addPlaneBtn.addEventListener('click', () => {
      this.planes.addPlane();
    });

    this.addCheckpointBtn.addEventListener('click', () => {
      // Create checkpoint in center; routes.system handles placement
      const cpEvent = new CustomEvent('addStandaloneCheckpoint');
      this.board.dispatchEvent(cpEvent);
    });

    this.routeModeBtn.addEventListener('click', () => {
      const isActive = this.routes.toggleRouteMode();
      this.routeModeBtn.classList.toggle('active', isActive);
      this.routeModeBtn.textContent = isActive ? '🛤️ Ruta ON' : '🛤️ Ruta';
    });

    this.advanceBtn.addEventListener('click', () => {
      const selectedPlane = this.planes.getSelectedPlane();
      if (!selectedPlane) return;
      const planeId = selectedPlane.dataset.planeId;
      const route = this.routes.routes.get(planeId);
      if (route) {
        this.routes.advancePlaneToCheckpoint(planeId, route.currentIndex);
      }
    });

    // Color buttons
    this.toolbar.querySelectorAll('.colorBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        if (color) this.planes.changeColor(color);
      });
    });

    // Direction buttons (rotation)
    ['N', 'E', 'S', 'W'].forEach(dir => {
      const btn = this.toolbar.querySelector(`[data-dir="${dir}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.planes.rotate(dir);
        });
      }
    });

    // Callsign
    this.applyCallsignBtn.addEventListener('click', () => {
      const callsign = this.callsignInput.value.trim();
      if (callsign) {
        const selectedPlane = this.planes.getSelectedPlane();
        if (selectedPlane) {
          this.planes.applyCallsign(callsign);
          this.generateFichaForPlane(selectedPlane);
        }
        this.callsignInput.value = '';
      }
    });

    this.generateCallsignBtn.addEventListener('click', async () => {
      const { generarCallsignAleatorio } = await import('./utils.js');
      this.callsignInput.value = generarCallsignAleatorio();
    });

    this.toggleVehicleBtn.addEventListener('click', () => {
      this.planes.toggleVehicle();
    });

    this.nuevoPDVBtn.addEventListener('click', () => {
      const selected = this.planes.getSelectedPlane();
      if (!selected) return;
      const planeColor = selected.dataset.planeColor || selected.style.color;
      const isYellow = planeColor === CONFIG.COLORS.YELLOW || planeColor === 'rgb(255, 255, 0)';
      if (isYellow) return;

      const callsign = selected.querySelector('.callsign').textContent.trim();
      const ficha = document.querySelector(`.control-btn[data-callsign="${callsign}"]`);
      if (!ficha) return;

      const newEOBT = generarEOBT();
      ficha.setAttribute('data-eobt', newEOBT);
      const eobtBox = document.getElementById('eobtDisplay');
      eobtBox.textContent = `EOBT ${newEOBT}   ${callsign}`;
      eobtBox.style.display = 'block';
    });

    // Reset
    this.resetBtn.addEventListener('click', () => {
      if (confirm('¿Seguro que quieres resetear todo?')) {
        this.planes.deleteSelected(); // This only deletes selected; need full reset
        this.planes.planes.forEach((data, id) => {
          data.element.remove();
        });
        this.planes.planes.clear();
        this.routes.reset();

        document.querySelectorAll('.control-btn[data-callsign]').forEach(ficha => ficha.remove());
        document.querySelectorAll('.textmarker').forEach(el => el.remove());

        this.planes.selected = null;
        this.planes.deselectAll();
        this.routes.disableAdvanceButton();
      }
    });
  }

  generateFichaForPlane(planeEl) {
    const callsign = planeEl.querySelector('.callsign').textContent.trim();
    const color = planeEl.dataset.planeColor || planeEl.style.color;

    // Special case: signalman
    if (callsign.toUpperCase() === 'SEÑALERO') {
      document.querySelector(`.control-btn[data-callsign="${callsign}"]`)?.remove();

      const ficha = document.createElement('button');
      ficha.className = 'control-btn';
      ficha.setAttribute('data-callsign', callsign);
      ficha.setAttribute('draggable', 'true');
      ficha.style.border = '3px solid #000';
      ficha.style.background = 'rgba(240,240,240,0.8)';
      ficha.style.fontSize = '12px';
      ficha.style.textAlign = 'center';
      ficha.style.fontWeight = 'bold';
      ficha.style.color = '#000';
      ficha.style.boxSizing = 'border-box';
      ficha.style.height = '100%';
      ficha.textContent = 'SEÑALERO';

      const col = document.getElementById('col2');
      const slot = Array.from(col.querySelectorAll('.slot')).find(s => s.children.length === 0);
      if (slot) slot.appendChild(ficha);

      ficha.addEventListener('click', () => {
        const avion = Array.from(document.querySelectorAll('.plane')).find(av =>
          av.querySelector('.callsign').textContent.trim() === ficha.getAttribute('data-callsign')
        );
        if (avion) {
          if (this.planes.selected) this.planes.selected.classList.remove('selected');
          this.planes.selected = avion;
          avion.classList.add('selected');
          this.board.dispatchEvent(new CustomEvent('planeSelected', {
            detail: { planeId: avion.dataset.planeId, element: avion }
          }));
        }
      });

      ficha.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', '');
        ficha.classList.add('dragging');
      });
      ficha.addEventListener('dragend', () => ficha.classList.remove('dragging'));
      return;
    }

    // Normal plane ficha
    const isVFR = callsign.startsWith('EC-');
    const { DESTINATIONS, SIDS_IFR, DESTINATIONS_NORTH } = CONFIG;

    let destino, sid;
    const isAmarillo = color === CONFIG.COLORS.YELLOW || color === 'rgb(255, 255, 0)';

    if (isAmarillo) { // LLEGADA
      if (isVFR) {
        const roll = Math.random();
        if (roll < 0.5) {
          destino = 'LEAL';
          sid = Math.random() < 0.5 ? 'NE' : 'SW';
        } else if (roll < 0.75) {
          destino = 'NE N S SW';
          sid = '-';
        } else {
          destino = 'SW S N NE';
          sid = '-';
        }
      } else {
        destino = 'LEAL';
        sid = SIDS_IFR[Math.floor(Math.random() * SIDS_IFR.length)];
      }
    } else { // SALIDA
      destino = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
      if (isVFR) {
        sid = DESTINATIONS_NORTH.includes(destino) ? 'NE' : 'SW';
      } else {
        sid = SIDS_IFR[Math.floor(Math.random() * SIDS_IFR.length)];
      }
    }

    const eobt = generarEOBT();
    const squawk = Array.from({ length: 4 }, () => Math.floor(Math.random() * 7) + 1).join('');

    // Remove previous ficha
    document.querySelector(`.control-btn[data-callsign="${callsign}"]`)?.remove();

    const ficha = document.createElement('button');
    ficha.className = 'control-btn';
    ficha.setAttribute('data-callsign', callsign);
    ficha.setAttribute('data-eobt', eobt);
    ficha.setAttribute('draggable', 'true');

    const bordeColor = isAmarillo ? CONFIG.COLORS.BORDER_GOLD : CONFIG.COLORS.BORDER_GREEN;
    const fondoSuave = isAmarillo ? 'rgba(255, 255, 150, 0.15)' : 'rgba(200, 255, 200, 0.15)';
    const flecha = isAmarillo ? '↓' : '↑';

    ficha.style.border = `2px solid ${bordeColor}`;
    ficha.style.background = fondoSuave;
    ficha.style.fontSize = '11px';
    ficha.style.lineHeight = '1.2';
    ficha.style.textAlign = 'left';
    ficha.style.display = 'flex';
    ficha.style.justifyContent = 'space-between';
    ficha.style.alignItems = 'center';
    ficha.style.padding = '0 6px';
    ficha.style.boxSizing = 'border-box';
    ficha.style.height = '100%';
    ficha.innerHTML = `
      <span><strong>${callsign}</strong> ${destino} <strong>${sid}</strong> ${squawk}</span>
      <span style="font-size:14px; margin-left:2px;">${flecha}</span>
    `;

    const col = document.getElementById(isAmarillo ? 'col3' : 'col1');
    const slot = Array.from(col.querySelectorAll('.slot')).find(s => s.children.length === 0);
    if (slot) slot.appendChild(ficha);

    ficha.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', '');
      ficha.classList.add('dragging');
    });
    ficha.addEventListener('dragend', () => ficha.classList.remove('dragging'));

    ficha.addEventListener('click', () => {
      const eobtValue = eobt;
      const callsignValue = callsign;
      const eobtBox = document.getElementById('eobtDisplay');
      if (eobtValue && callsignValue) {
        eobtBox.textContent = `EOBT ${eobtValue}   ${callsignValue}`;
        eobtBox.style.display = 'block';
      } else {
        eobtBox.style.display = 'none';
      }
    });
  }
}
