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
 * - Mòdul ES. Els valors per defecte de cada activitat vénen de window.APP_CONFIG,
 *   que la pàgina defineix en un <script> en línia ABANS del mòdul.
 * - Importa fixed-sessions.js (i el posa el primer): si la URL porta ?fixed=A/B/C, aquest
 *   afegeix paràmetres a la URL (5 preguntes, 1 sessió) i s'ha d'executar ABANS que aquí
 *   es llegeixin. Sense aquest import, config.js llegiria la URL sense els paràmetres
 *   afegits; el primer lloc és perquè cap altre import el pugui avançar
 *   (tests/check-repo.js ho vigila).
 * - No hi ha cap paràmetre de nota (decisió D3): els enllaços antics que en portin s'ignoren.
 * DEPENDÈNCIES: fixed-sessions.js, utils.js (getIntParam).
 * ============================================================================
 */
import './fixed-sessions.js';
import { getIntParam } from './utils.js';

const DEFAULT_TOTAL_SESSIONS = window.APP_CONFIG?.defaultSessions ?? 1;
const DEFAULT_TOTAL_OPERATIONS = window.APP_CONFIG?.defaultOperations ?? 3;
const DEFAULT_MAX_INTENTS = window.APP_CONFIG?.defaultIntents ?? 4;

export const LIMITS = {
    totalsessions: { min: 1, max: 20 },
    totaloperations: { min: 1, max: 30 },
    maxintents: { min: 1, max: 10 },
};

export const urlParams = new URLSearchParams(window.location.search);

export const TOTAL_SESSIONS = getIntParam(
    urlParams,
    'totalsessions',
    DEFAULT_TOTAL_SESSIONS,
    LIMITS.totalsessions.min,
    LIMITS.totalsessions.max
);
export const TOTAL_OPERATIONS = getIntParam(
    urlParams,
    'totaloperations',
    DEFAULT_TOTAL_OPERATIONS,
    LIMITS.totaloperations.min,
    LIMITS.totaloperations.max
);
export const MAX_INTENTS = getIntParam(
    urlParams,
    'maxintents',
    DEFAULT_MAX_INTENTS,
    LIMITS.maxintents.min,
    LIMITS.maxintents.max
);
