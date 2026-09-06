/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/config.js
 * ROL: Gestió de la configuració de la partida i paràmetres URL.
 * ARQUITECTURA:
 * - Permet al professorat configurar la partida via paràmetres GET a la URL 
 * (ex: ?totalsessions=3&maxintents=2).
 * - Inclou mecanismes de seguretat defensiva i fallbacks (límits min/max) per 
 * evitar comportaments anòmals si l'usuari manipula la URL.
 * DEPENDÈNCIES: Requereix utils.js (per la funció getIntParam).
 * ============================================================================
 */

const DEFAULT_TOTAL_SESSIONS     = window.APP_CONFIG?.defaultSessions      ?? 1;
const DEFAULT_TOTAL_OPERATIONS   = window.APP_CONFIG?.defaultOperations    ?? 3;
const DEFAULT_MAX_INTENTS        = window.APP_CONFIG?.defaultIntents       ?? 4;
const DEFAULT_MAX_ENLLOC_MITJANA = window.APP_CONFIG?.defaultEnllocMitjana ?? 1;

const LIMITS = {
    totalsessions:    { min: 1, max: 20 },
    totaloperations:  { min: 1, max: 30 },
    maxintents:       { min: 1, max: 10 },
    maxenllocmitjana: { min: 0, max:  1 }
};

const urlParams = new URLSearchParams(window.location.search);

const TOTAL_SESSIONS     = getIntParam(urlParams, 'totalsessions',    DEFAULT_TOTAL_SESSIONS,     LIMITS.totalsessions.min,    LIMITS.totalsessions.max);
const TOTAL_OPERATIONS   = getIntParam(urlParams, 'totaloperations',  DEFAULT_TOTAL_OPERATIONS,   LIMITS.totaloperations.min,  LIMITS.totaloperations.max);
const MAX_INTENTS        = getIntParam(urlParams, 'maxintents',       DEFAULT_MAX_INTENTS,         LIMITS.maxintents.min,       LIMITS.maxintents.max);
const MAX_ENLLOC_MITJANA = getIntParam(urlParams, 'maxenllocmitjana', DEFAULT_MAX_ENLLOC_MITJANA,  LIMITS.maxenllocmitjana.min, LIMITS.maxenllocmitjana.max);
