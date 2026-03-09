// Draggable utility for DOM elements
// Supports both normal drag and Ctrl+drag for repositionable panels

import { loadPositions, savePositions } from './utils.js';

export function makeDraggable(el, options = {}) {
  const {
    requireCtrl = false,
    onDragStart,
    onDragEnd,
  } = options;

  let isDragging = false;
  let startX, startY, startLeft, startTop, startRight, startBottom;

  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (requireCtrl && !e.ctrlKey) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = el.getBoundingClientRect();
    startLeft = parseInt(el.style.left || rect.left, 10);
    startTop = parseInt(el.style.top || rect.top, 10);
    startRight = parseInt(el.style.right || '', 10);
    startBottom = parseInt(el.style.bottom || '', 10);

    // Ensure we use top/left positioning
    if (el.style.bottom) {
      startTop = window.innerHeight - rect.bottom;
      el.style.top = `${startTop}px`;
      el.style.bottom = '';
    }
    if (el.style.right) {
      startLeft = window.innerWidth - rect.right;
      el.style.left = `${startLeft}px`;
      el.style.right = '';
    }

    el.style.zIndex = 100;
    el.style.cursor = 'move';
    document.body.style.userSelect = 'none';

    if (onDragStart) onDragStart(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    el.style.left = `${startLeft + dx}px`;
    el.style.top = `${startTop + dy}px`;

    if (onDragEnd && (dx !== 0 || dy !== 0)) {
      onDragEnd(el);
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      el.style.zIndex = '';
      el.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

/**
 * Make an element draggable and persist its position
 */
export function makePersistentDraggable(el, storageKey) {
  const positions = loadPositions(storageKey, {});
  if (positions.left) el.style.left = positions.left;
  if (positions.top) el.style.top = positions.top;

  makeDraggable(el, {
    onDragEnd: (draggedEl) => {
      positions.left = draggedEl.style.left;
      positions.top = draggedEl.style.top;
      savePositions(storageKey, positions);
    },
  });
}
