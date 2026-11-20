/**
 * Configurazione Eroi giocabili, Armi iniziali sbloccabili e Meta-Progressione permanente.
 */

export const META_STORAGE_KEY = 'ashen_midgard_meta_v1';

export const HERO_ROSTER = {
  warrior: {
    id: 'warrior',
    name: 'Astrid',
    title: 'Valchiria',
    textureKey: 'hero_warrior',
    accent: '#f59e0b',
    summary: 'Equilibrata e resistente con asce pesanti.',
    baseStats: {
      maxHp: 115,
      speed: 138,
      mightMult: 1.0,
      areaMult: 1.0,
      critChance: 0.18
    },
    weapons: [
      { id: 'axe', name: 'Ascia Runica', unlockLevel: 1, role: 'Arma Base' },
      { id: 'blades', name: 'Lame di Valchiria', unlockLevel: 2, role: 'Secondaria I' },
      { id: 'aura', name: 'Aura del Crepuscolo', unlockLevel: 4, role: 'Secondaria II' }
    ]
  },
  assassin: {
    id: 'assassin',
    name: 'Skadi',
    title: 'Assassina',
    textureKey: 'hero_assassin',
    accent: '#e879f9',
    summary: 'Velocissima, raffiche di pugnali e critici letali.',
    baseStats: {
      maxHp: 88,
      speed: 162,
      mightMult: 0.96,
      areaMult: 0.95,
      critChance: 0.34
    },
    weapons: [
      { id: 'dagger', name: 'Pugnali d’Ombra', unlockLevel: 1, role: 'Arma Base' },
      { id: 'blades', name: 'Lame di Valchiria', unlockLevel: 2, role: 'Secondaria I' },
      { id: 'axe', name: 'Ascia Runica', unlockLevel: 4, role: 'Secondaria II' }
    ]
  },
  mage: {
    id: 'mage',
    name: 'Freya',
    title: 'Maga Runica',
    textureKey: 'hero_mage',
    accent: '#38bdf8',
    summary: 'Esplosioni arcane ad ampia area e controllo folla.',
    baseStats: {
      maxHp: 92,
      speed: 134,
      mightMult: 1.1,
      areaMult: 1.22,
      critChance: 0.16
    },
    weapons: [
      { id: 'orb', name: 'Globo Arcano', unlockLevel: 1, role: 'Arma Base' },
      { id: 'lightning', name: 'Saetta di Thor', unlockLevel: 2, role: 'Secondaria I' },
      { id: 'aura', name: 'Aura del Crepuscolo', unlockLevel: 4, role: 'Secondaria II' }
    ]
  },
  juggernaut: {
    id: 'juggernaut',
    name: 'Bjorn',
    title: 'Martello di Ferro',
    textureKey: 'hero_juggernaut',
    accent: '#fb923c',
    summary: 'Colosso corazzato con onde d’urto sismiche e grande resistenza.',
    baseStats: {
      maxHp: 138,
      speed: 128,
      mightMult: 1.12,
      areaMult: 1.15,
      critChance: 0.14
    },
    weapons: [
      { id: 'hammer', name: 'Martello Sismico', unlockLevel: 1, role: 'Arma Base' },
      { id: 'aura', name: 'Aura del Crepuscolo', unlockLevel: 2, role: 'Secondaria I' },
      { id: 'axe', name: 'Ascia Runica', unlockLevel: 4, role: 'Secondaria II' }
    ]
  }
};

export const HERO_ORDER = ['warrior', 'assassin', 'mage', 'juggernaut'];

// Soglie EXP cumulativa per i livelli permanenti di ciascun eroe
export function getXpRequiredForLevel(level) {
  if (level <= 1) return 0;
  // Curva accessibile: Lv2=120, Lv3=290, Lv4=520, Lv5=820...
  let total = 0;
  for (let lv = 1; lv < level; lv++) {
    total += 120 + (lv - 1) * 55;
  }
  return total;
}

export function getHeroLevelFromXp(xp) {
  let level = 1;
  while (xp >= getXpRequiredForLevel(level + 1) && level < 30) {
    level += 1;
  }
  const currentThreshold = getXpRequiredForLevel(level);
  const nextThreshold = getXpRequiredForLevel(level + 1);
  return {
    level,
    xp,
    currentLevelXp: xp - currentThreshold,
    xpToNextLevel: Math.max(1, nextThreshold - currentThreshold)
  };
}

export function getPerksForHeroLevel(heroId, level) {
  const hero = HERO_ROSTER[heroId] || HERO_ROSTER.warrior;
  const bonusHp = (level >= 2 ? 12 : 0) + Math.max(0, level - 5) * 6;
  const bonusMight = (level >= 3 ? 0.12 : 0) + Math.max(0, level - 5) * 0.05;
  const bonusSpeed = level >= 4 ? 0.08 : 0;
  const bonusArea = level >= 5 ? 0.15 : 0;
  const bonusMagnet = level >= 5 ? 0.18 : 0;

  return {
    maxHp: hero.baseStats.maxHp + bonusHp,
    speed: Math.round(hero.baseStats.speed * (1 + bonusSpeed)),
    mightMult: Number((hero.baseStats.mightMult + bonusMight).toFixed(2)),
    areaMult: Number((hero.baseStats.areaMult + bonusArea).toFixed(2)),
    magnetMult: Number((1 + bonusMagnet).toFixed(2)),
    critChance: hero.baseStats.critChance,
    unlockedWeapons: hero.weapons.filter((w) => level >= w.unlockLevel).map((w) => w.id),
    activeLabels: buildPerkLabels(hero, level)
  };
}

function buildPerkLabels(hero, level) {
  const labels = [];
  if (level >= 2) labels.push(`Lv.2 ${hero.weapons[1].name} +12 HP`);
  if (level >= 3) labels.push('Lv.3 +12% Danno');
  if (level >= 4) labels.push(`Lv.4 ${hero.weapons[2].name} +8% Vel`);
  if (level >= 5) labels.push('Lv.5 +15% Area & +18% Magnete');
  if (level >= 6) labels.push(`Lv.${level} Maestria +${(level - 5) * 5}% Danno`);
  return labels;
}

export function getNextUnlockHint(heroId, level) {
  const hero = HERO_ROSTER[heroId] || HERO_ROSTER.warrior;
  if (level < 2) return `Prossimo Lv.2: Sblocca ${hero.weapons[1].name} e +12 HP`;
  if (level < 3) return 'Prossimo Lv.3: +12% Danno iniziale';
  if (level < 4) return `Prossimo Lv.4: Sblocca ${hero.weapons[2].name} e +8% Velocità`;
  if (level < 5) return 'Prossimo Lv.5: +15% Area e +18% Raggio Calamita';
  return `Prossimo Lv.${level + 1}: +5% Danno e +6 HP Massimi`;
}

export function createDefaultMetaState() {
  return {
    selectedHero: 'warrior',
    selectedWeapons: {
      warrior: 'axe',
      assassin: 'dagger',
      mage: 'orb',
      juggernaut: 'hammer'
    },
    heroXp: {
      warrior: 0,
      assassin: 0,
      mage: 0,
      juggernaut: 0
    }
  };
}

export function loadMetaProgress() {
  const base = createDefaultMetaState();
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return {
      selectedHero: HERO_ROSTER[parsed?.selectedHero] ? parsed.selectedHero : base.selectedHero,
      selectedWeapons: { ...base.selectedWeapons, ...(parsed?.selectedWeapons || {}) },
      heroXp: { ...base.heroXp, ...(parsed?.heroXp || {}) }
    };
  } catch {
    return base;
  }
}

export function saveMetaProgress(meta) {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Ignora errori storage
  }
}

export function computeRunMetaXp(runResult) {
  const timeXp = Math.round((runResult.elapsedSec || 0) * 1.4);
  const killXp = Math.round((runResult.kills || 0) * 0.35);
  const bossBonus = runResult.bossDefeated ? 220 : 0;
  const realmMult = runResult.xpBonusMult || 1.0;
  return Math.max(15, Math.round((timeXp + killXp + bossBonus) * realmMult));
}

export function grantHeroMetaXp(heroId, runResult) {
  const meta = loadMetaProgress();
  const validId = HERO_ROSTER[heroId] ? heroId : 'warrior';
  const prevXp = meta.heroXp[validId] || 0;
  const prevInfo = getHeroLevelFromXp(prevXp);

  const gainedXp = computeRunMetaXp(runResult);
  const newXp = prevXp + gainedXp;
  meta.heroXp[validId] = newXp;
  saveMetaProgress(meta);

  const newInfo = getHeroLevelFromXp(newXp);
  const hero = HERO_ROSTER[validId];
  const unlockedNow = hero.weapons.filter(
    (w) => w.unlockLevel > prevInfo.level && w.unlockLevel <= newInfo.level
  );

  return {
    heroId: validId,
    gainedXp,
    prevLevel: prevInfo.level,
    newLevel: newInfo.level,
    leveledUp: newInfo.level > prevInfo.level,
    levelInfo: newInfo,
    unlockedWeapons: unlockedNow,
    meta
  };
}
