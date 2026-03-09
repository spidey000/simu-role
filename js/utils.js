// Utility functions

import { CONFIG } from './config.js';

/**
 * Generate a random EOBT (Estimated Off-Block Time)
 * @returns {string} HH:MM format UTC time
 */
export function generarEOBT() {
  const ahora = new Date();
  ahora.setUTCMinutes(ahora.getUTCMinutes() + 10);
  const extra = Math.floor(Math.random() * 5) * 5;
  ahora.setUTCMinutes(ahora.getUTCMinutes() + extra);
  ahora.setUTCSeconds(0);
  ahora.setUTCMilliseconds(0);

  const minutos = ahora.getUTCMinutes();
  const redondeado = Math.ceil(minutos / 5) * 5;
  if (redondeado !== minutos) ahora.setUTCMinutes(redondeado);

  const h = ahora.getUTCHours().toString().padStart(2, '0');
  const m = ahora.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Generate random callsign (airline format)
 * @returns {string}
 */
export function generarCallsignAleatorio() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const { PREFIXES } = CONFIG;

  if (Math.random() < 0.75) {
    const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const num = `${Math.floor(Math.random() * 90) + 10}`;
    const letra = letras[Math.floor(Math.random() * letras.length)];
    return `${prefix}${num}${letra}`;
  } else {
    const suffix = Array.from({ length: 3 }, () =>
      letras[Math.floor(Math.random() * letras.length)]
    ).join('');
    return `EC-${suffix}`;
  }
}

/**
 * Extract wind direction from METAR string
 * @param {string} metar
 * @returns {number|null}
 */
export function extraerDireccionViento(metar) {
  const fijo = metar.match(/\b(\d{3})\d{2,3}(G\d{2,3})?KT\b/);
  if (fijo) {
    const dir = parseInt(fijo[1], 10);
    if (dir === 0) return null;
    return dir;
  }
  if (/\bVRB\d{2,3}(G\d{2,3})?KT\b/i.test(metar)) return null;
  if (/\bCALM\b/i.test(metar)) return null;
  return null;
}

/**
 * Determine preferred runway based on wind direction
 * @param {number|null} dir
 * @returns {string} '10' or '28'
 */
export function obtenerPistaPreferente(dir) {
  if (dir === null) return '10';

  const pista10 = 100;
  const pista28 = 280;

  function diff(a, b) {
    let d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  const dif10 = diff(dir, pista10);
  const dif28 = diff(dir, pista28);
  return (dif10 <= dif28) ? '10' : '28';
}

/**
 * Update UTC clock display
 * @param {HTMLElement} clockEl
 */
export function actualizarRelojUTC(clockEl) {
  const ahora = new Date();
  const h = ahora.getUTCHours().toString().padStart(2, '0');
  const m = ahora.getUTCMinutes().toString().padStart(2, '0');
  const s = ahora.getUTCSeconds().toString().padStart(2, '0');
  clockEl.textContent = `${h}:${m}:${s}`;
}

/**
 * Clamp number between min and max
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Load position from localStorage
 */
export function loadPositions(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Save position to localStorage
 */
export function savePositions(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/**
 * Update METAR display
 */
export function actualizarMETAR() {
  const metarEl = document.getElementById('metarLEAL');
  if (!metarEl) return;

  fetch(CONFIG.METAR_URL)
    .then(res => res.text())
    .then(data => {
      metarEl.textContent = data.replace(/\n/g, ' ').trim();
    })
    .catch(() => {
      metarEl.textContent = 'METAR unavailable';
    });
}

/**
 * Update RW (runway) ficha
 */
export function actualizarFichaRW() {
  // Implementation depends on needs - placeholder
  console.log('actualizar Ficha RW called');
}
