/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-pla-cartesia/dibuix.js
 * ROL: El pla cartesià dibuixat en un <canvas>: la quadrícula amb els eixos,
 *      els punts (amb una lletra) i la conversió d'un toc a coordenades. No
 *      sap res de les preguntes: el controlador li diu què ha de dibuixar.
 * DEPENDÈNCIES: generador.js (la mida del pla).
 * ============================================================================
 */
import { X_MAX, X_MIN, Y_MAX, Y_MIN } from './generador.js';

const COLUMNES = X_MAX - X_MIN;
const FILES = Y_MAX - Y_MIN;

/** Crea el tauler d'un canvas: { ajusta(amplada, alcada), dibuixa(punts), aCoordenades(clientX, clientY), aPixels(x, y) }. */
export function crearTauler(canvas) {
    const ctx = canvas.getContext('2d');
    let cel = 40;
    let marge = 48;
    let origenX = 0;
    let origenY = 0;
    let ample = 0;
    let alt = 0;

    const px = x => origenX + x * cel;
    const py = y => origenY - y * cel;

    let ultims = null; // els punts dibuixats l'última vegada: en canviar la mida, es tornen a dibuixar

    /**
     * Ajusta la mida del canvas a l'amplada disponible (fins a 560 px) i, si es dona, a l'alçada disponible, amb tota la
     * resolució de la pantalla. El pla fa 12,4 cel·les d'ample i 10,4 d'alt (comptant els marges); la cel·la no baixa de 20 px.
     */
    function ajusta(amplada, alcada = Infinity) {
        const dpr = window.devicePixelRatio || 1;
        cel = Math.max(20, Math.floor(Math.min(Math.min(amplada, 560) / (COLUMNES + 2.4), alcada / (FILES + 2.4))));
        marge = Math.round(cel * 1.2);
        ample = cel * COLUMNES + 2 * marge;
        alt = cel * FILES + 2 * marge;
        canvas.width = Math.round(ample * dpr);
        canvas.height = Math.round(alt * dpr);
        canvas.style.width = `${ample}px`;
        canvas.style.height = `${alt}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        origenX = marge - X_MIN * cel;
        origenY = marge + Y_MAX * cel;
        if (ultims) dibuixa(ultims);
    }

    function quadricula() {
        ctx.clearRect(0, 0, ample, alt);
        ctx.fillStyle = '#fafbff';
        ctx.fillRect(0, 0, ample, alt);
        ctx.strokeStyle = '#d5dbe8';
        ctx.lineWidth = 1;
        for (let i = X_MIN; i <= X_MAX; i++) {
            ctx.beginPath();
            ctx.moveTo(px(i), marge);
            ctx.lineTo(px(i), alt - marge);
            ctx.stroke();
        }
        for (let j = Y_MIN; j <= Y_MAX; j++) {
            ctx.beginPath();
            ctx.moveTo(marge, py(j));
            ctx.lineTo(ample - marge, py(j));
            ctx.stroke();
        }
        // Els eixos, amb la punta de fletxa
        const ext = Math.round(cel * 0.65);
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(marge - ext, origenY);
        ctx.lineTo(ample - marge + ext, origenY);
        ctx.moveTo(origenX, marge - ext);
        ctx.lineTo(origenX, alt - marge + ext);
        ctx.stroke();
        const a = 7;
        ctx.beginPath();
        ctx.moveTo(ample - marge + ext, origenY);
        ctx.lineTo(ample - marge + ext - a, origenY - a * 0.6);
        ctx.lineTo(ample - marge + ext - a, origenY + a * 0.6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(origenX, marge - ext);
        ctx.lineTo(origenX - a * 0.6, marge - ext + a);
        ctx.lineTo(origenX + a * 0.6, marge - ext + a);
        ctx.fill();
        // Els nombres dels eixos i les lletres x i y
        const fs = Math.max(11, Math.round(cel * 0.28));
        ctx.font = `bold ${fs}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = X_MIN; i <= X_MAX; i++) if (i !== 0) ctx.fillText(String(i), px(i), origenY + 6);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let j = Y_MIN; j <= Y_MAX; j++) if (j !== 0) ctx.fillText(String(j), origenX - 8, py(j));
        ctx.textBaseline = 'top';
        ctx.fillText('0', origenX - 7, origenY + 5);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('x', ample - marge + ext + 3, origenY - 6);
        ctx.textBaseline = 'top';
        ctx.fillText('y', origenX + 8, marge - ext - 4);
    }

    /** Dibuixa el pla i, a sobre, els punts [{ x, y, color, etiqueta }]. */
    function dibuixa(punts = []) {
        ultims = punts;
        quadricula();
        for (const p of punts) {
            const r = Math.max(7, Math.round(cel * 0.2));
            ctx.beginPath();
            ctx.arc(px(p.x), py(p.y), r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            if (p.etiqueta) {
                ctx.fillStyle = p.color;
                ctx.font = `bold ${Math.max(14, Math.round(cel * 0.4))}px 'Courier New', monospace`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.fillText(p.etiqueta, px(p.x) + r + 3, py(p.y) - r + 2);
            }
        }
    }

    /** El punt de la quadrícula més proper a un toc (coordenades de pantalla), o null si és fora del pla. */
    function aCoordenades(clientX, clientY) {
        const r = canvas.getBoundingClientRect();
        const cx = ((clientX - r.left) * ample) / r.width;
        const cy = ((clientY - r.top) * alt) / r.height;
        const x = Math.round((cx - origenX) / cel);
        const y = Math.round((origenY - cy) / cel);
        return x >= X_MIN && x <= X_MAX && y >= Y_MIN && y <= Y_MAX ? { x, y } : null;
    }

    /** L'invers d'aCoordenades: on cau un punt de la quadrícula a la pantalla (per a les proves). */
    function aPixels(x, y) {
        const r = canvas.getBoundingClientRect();
        return { clientX: r.left + (px(x) * r.width) / ample, clientY: r.top + (py(y) * r.height) / alt };
    }

    return { ajusta, dibuixa, aCoordenades, aPixels };
}
