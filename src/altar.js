/**
 * Altare delle Rune: meta-progressione persistente trasversale a tutti gli eroi.
 * I giocatori spendono le Braci Runiche guadagnate a fine partita per incidere
 * benedizioni permanenti (HP, Danno, Velocità, EXP, Magnete, Armatura, Rinascita)
 * con possibilità di rimborso integrale gratuito (Respec).
 */

export const ALTAR_STORAGE_KEY = 'ashen_midgard_altar_v1';

export const ALTAR_ORDER = [
  'vitality',
  'might',
  'agility',
  'wisdom',
  'greed',
  'ward',
  'revival'
];

export const ALTAR_RUNES = {
  vitality: {
    id: 'vitality',
    name: 'Sangue di Ymir',
    tag: 'SALUTE',
    accent: '#22c55e',
    maxRank: 5,
    costs: [15, 30, 50, 75, 110],
    perRankValue: 12,
    unitLabel: '+12 HP Max per grado',
    formatBonus: (rank) => `+${rank * 12} HP Max`
  },
  might: {
    id: 'might',
    name: 'Furia di Tyr',
    tag: 'POTENZA',
    accent: '#ef4444',
    maxRank: 5,
    costs: [18, 36, 60, 90, 130],
    perRankValue: 0.06,
    unitLabel: '+6% Danno per grado',
    formatBonus: (rank) => `+${rank * 6}% Danno`
  },
  agility: {
    id: 'agility',
    name: 'Passo di Sleipnir',
    tag: 'AGILITÀ',
    accent: '#38bdf8',
    maxRank: 5,
    costs: [16, 32, 52, 78, 115],
    perRankValue: 0.04,
    unitLabel: '+4% Velocità per grado',
    formatBonus: (rank) => `+${rank * 4}% Velocità`
  },
  wisdom: {
    id: 'wisdom',
    name: 'Fonte di Mimir',
    tag: 'SAGGEZZA',
    accent: '#a855f7',
    maxRank: 5,
    costs: [15, 30, 50, 75, 110],
    perRankValue: 0.1,
    unitLabel: '+10% EXP in partita per grado',
    formatBonus: (rank) => `+${rank * 10}% EXP`
  },
  greed: {
    id: 'greed',
    name: 'Ambra degli Asi',
    tag: 'MAGNETE',
    accent: '#eab308',
    maxRank: 4,
    costs: [14, 28, 46, 70],
    perRankValue: 0.15,
    unitLabel: '+15% Raggio Magnete per grado',
    formatBonus: (rank) => `+${rank * 15}% Magnete`
  },
  ward: {
    id: 'ward',
    name: 'Egida di Heimdall',
    tag: 'DIFESA',
    accent: '#60a5fa',
    maxRank: 4,
    costs: [20, 42, 68, 100],
    perRankValue: 0.06,
    unitLabel: '-6% Danno subito per grado',
    formatBonus: (rank) => `-${rank * 6}% Danno Subito`
  },
  revival: {
    id: 'revival',
    name: 'Fiamma del Valhalla',
    tag: 'RINASCITA',
    accent: '#fbbf24',
    maxRank: 1,
    costs: [160],
    perRankValue: 1,
    unitLabel: '+1 Rinascita per partita (50% HP + onda d’urto)',
    formatBonus: (rank) => (rank >= 1 ? '1 Rinascita attiva' : 'Nessuna rinascita')
  }
};

export function createDefaultAltarState() {
  return {
    embers: 0,
    totalEmbersEarned: 0,
    ranks: {
      vitality: 0,
      might: 0,
      agility: 0,
      wisdom: 0,
      greed: 0,
      ward: 0,
      revival: 0
    }
  };
}

function clampRank(runeId, val) {
  const rune = ALTAR_RUNES[runeId];
  if (!rune) return 0;
  const n = Math.floor(Number(val) || 0);
  return Math.max(0, Math.min(rune.maxRank, n));
}

export function loadAltarState() {
  const base = createDefaultAltarState();
  try {
    if (typeof localStorage === 'undefined') return base;
    const raw = localStorage.getItem(ALTAR_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    const ranks = {};
    for (const id of ALTAR_ORDER) {
      ranks[id] = clampRank(id, parsed?.ranks?.[id]);
    }
    return {
      embers: Math.max(0, Math.floor(Number(parsed?.embers) || 0)),
      totalEmbersEarned: Math.max(0, Math.floor(Number(parsed?.totalEmbersEarned) || 0)),
      ranks
    };
  } catch {
    return base;
  }
}

export function saveAltarState(state) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(ALTAR_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora errori storage
  }
}

export function getNextRuneCost(runeId, currentRank) {
  const rune = ALTAR_RUNES[runeId];
  if (!rune) return null;
  const r = clampRank(runeId, currentRank);
  if (r >= rune.maxRank) return null;
  return rune.costs[r] ?? null;
}

export function getTotalSpentEmbers(state = loadAltarState()) {
  let spent = 0;
  for (const id of ALTAR_ORDER) {
    const rune = ALTAR_RUNES[id];
    const r = clampRank(id, state?.ranks?.[id]);
    for (let i = 0; i < r; i++) {
      spent += rune.costs[i] || 0;
    }
  }
  return spent;
}

export function canAffordAnyRune(state = loadAltarState()) {
  const embers = state?.embers || 0;
  return ALTAR_ORDER.some((id) => {
    const cost = getNextRuneCost(id, state?.ranks?.[id] || 0);
    return cost !== null && embers >= cost;
  });
}

export function getAltarBonuses(state = loadAltarState()) {
  const ranks = state?.ranks || {};
  const vit = clampRank('vitality', ranks.vitality);
  const might = clampRank('might', ranks.might);
  const agi = clampRank('agility', ranks.agility);
  const wis = clampRank('wisdom', ranks.wisdom);
  const greed = clampRank('greed', ranks.greed);
  const ward = clampRank('ward', ranks.ward);
  const rev = clampRank('revival', ranks.revival);

  return {
    maxHpBonus: vit * 12,
    mightAdd: Number((might * 0.06).toFixed(4)),
    speedMultAdd: Number((agi * 0.04).toFixed(4)),
    xpGainMult: Number((1 + wis * 0.1).toFixed(4)),
    magnetMultAdd: Number((greed * 0.15).toFixed(4)),
    damageReduction: Number((ward * 0.06).toFixed(4)),
    revivals: rev
  };
}

export function purchaseAltarRune(runeId) {
  const rune = ALTAR_RUNES[runeId];
  const state = loadAltarState();
  if (!rune) return { ok: false, reason: 'invalid_rune', state };

  const currentRank = clampRank(runeId, state.ranks[runeId]);
  if (currentRank >= rune.maxRank) {
    return { ok: false, reason: 'max_rank', state };
  }

  const cost = getNextRuneCost(runeId, currentRank);
  if (cost === null || state.embers < cost) {
    return { ok: false, reason: 'insufficient_embers', state };
  }

  state.embers -= cost;
  state.ranks[runeId] = currentRank + 1;
  saveAltarState(state);

  return {
    ok: true,
    runeId,
    spent: cost,
    newRank: state.ranks[runeId],
    state
  };
}

export function refundAllAltarRunes() {
  const state = loadAltarState();
  const refunded = getTotalSpentEmbers(state);
  if (refunded <= 0) {
    return { ok: false, refunded: 0, state };
  }
  state.embers += refunded;
  for (const id of ALTAR_ORDER) {
    state.ranks[id] = 0;
  }
  saveAltarState(state);
  return { ok: true, refunded, state };
}

export function computeRunEmbers(runResult = {}) {
  const timePart = (runResult.elapsedSec || 0) * 0.24;
  const killPart = (runResult.kills || 0) * 0.035;
  const miniBossPart = (runResult.miniBossesSlain || 0) * 7;
  const bossCount = Math.max(
    runResult.bossesDefeatedCount || 0,
    runResult.bossDefeated ? 1 : 0
  );
  const bossPart = bossCount * 24;
  const mult = Math.max(1, runResult.xpBonusMult || 1);
  return Math.max(8, Math.round((timePart + killPart + miniBossPart + bossPart) * mult));
}

export function grantRunEmbers(runResult = {}) {
  const state = loadAltarState();
  const gainedEmbers = computeRunEmbers(runResult);
  state.embers += gainedEmbers;
  state.totalEmbersEarned += gainedEmbers;
  saveAltarState(state);
  return {
    gainedEmbers,
    state
  };
}
