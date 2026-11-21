/**
 * Codex delle Rune: archivio narrativo e bestiario sbloccabile progressivamente
 * con salvataggio persistente in localStorage.
 */

export const CODEX_STORAGE_KEY = 'ashen_midgard_codex_v1';

export const CODEX_CATEGORIES = [
  { id: 'all', label: 'Tutti' },
  { id: 'heroes', label: 'Eroi' },
  { id: 'enemies', label: 'Nemici' },
  { id: 'weapons', label: 'Armi' },
  { id: 'lore', label: 'Cronache' }
];

export const CODEX_ENTRIES = [
  {
    id: 'hero_warrior',
    category: 'heroes',
    title: 'Astrid, Figlia del Tuono',
    subtitle: 'Valchiria · Difensora di Midgard',
    accent: '#f59e0b',
    defaultUnlocked: true,
    unlockHint: 'Disponibile dall’inizio',
    body: 'Ultima guardia dei cancelli d’oro. Brandisce asce incise con le rune della tempesta e guida i sopravvissuti attraverso la piana ghiacciata.'
  },
  {
    id: 'hero_assassin',
    category: 'heroes',
    title: 'Skadi, Lama dell’Ombra',
    subtitle: 'Assassina · Cacciatrice Notturna',
    accent: '#e879f9',
    defaultUnlocked: true,
    unlockHint: 'Disponibile dall’inizio',
    body: 'Addestrata nei fiordi di Niflheim. Scaglia raffiche di pugnali avvelenati dal crepuscolo, colpendo i punti vitali dei colossi.'
  },
  {
    id: 'hero_mage',
    category: 'heroes',
    title: 'Freya, Custode delle Rune',
    subtitle: 'Maga Runica · Maestra dei Vanir',
    accent: '#38bdf8',
    defaultUnlocked: true,
    unlockHint: 'Disponibile dall’inizio',
    body: 'Interpreta i segni del cielo spezzato per condensare globi glaciali esplosivi e richiamare le saette dell’antico patto.'
  },
  {
    id: 'hero_juggernaut',
    category: 'heroes',
    title: 'Bjorn, Martello di Ferro',
    subtitle: 'Campione delle Fucine di Nidavellir',
    accent: '#fb923c',
    defaultUnlocked: false,
    unlockHint: 'Completa una partita con Bjorn oppure ottieni 1 Vittoria',
    body: 'Un colosso rivestito di ferro nero. Il suo Martello Sismico fende la tundra con onde d’urto che spezzano gli assedi dell’orda.',
    checkUnlock: (stats) => Boolean(stats.playedHeroes?.juggernaut) || stats.bossesSlain >= 1
  },
  {
    id: 'enemy_draugr',
    category: 'enemies',
    title: 'Draugr del Gelo & Lupi Fenrir',
    subtitle: 'Avanguardia dell’Orda',
    accent: '#38bdf8',
    defaultUnlocked: false,
    unlockHint: 'Sconfiggi 30 nemici totali',
    body: 'Guerrieri caduti risvegliati dal soffio di Helheim insieme ai lupi d’ombra. Attaccano in branchi serrati accerchiando chi resta fermo.',
    checkUnlock: (stats) => stats.totalKills >= 30
  },
  {
    id: 'enemy_jotun_tank',
    category: 'enemies',
    title: 'Jotun Corazzato',
    subtitle: 'Corazza di Basalto',
    accent: '#f87171',
    defaultUnlocked: false,
    unlockHint: 'Sconfiggi 120 nemici totali',
    body: 'Goliath rivestiti di ferro e scudi runici. Resistono ai contraccolpi leggeri e richiedono armi potenziate o colpi critici per cedere.',
    checkUnlock: (stats) => stats.totalKills >= 120
  },
  {
    id: 'enemy_archer',
    category: 'enemies',
    title: 'Arciere di Brina',
    subtitle: 'Tiratore Glaciale a Distanza',
    accent: '#7dd3fc',
    defaultUnlocked: false,
    unlockHint: 'Sopravvivi almeno 45 secondi in una partita',
    body: 'Mantiene le distanze dal bersaglio e scocca frecce di ghiaccio affilate dopo un breve bagliore d’avviso. Muoversi lateralmente annulla il tiro.',
    checkUnlock: (stats) => stats.bestElapsedSec >= 45
  },
  {
    id: 'enemy_berserker',
    category: 'enemies',
    title: 'Predone Berserker',
    subtitle: 'Carica Furiosa',
    accent: '#fb7185',
    defaultUnlocked: false,
    unlockHint: 'Sopravvivi almeno 90 secondi in una partita',
    body: 'Razziatore accecato dalla furia scarlatta. Quando individua l’eroe trattiene il respiro e scatta in una carica rettilinea ad alta velocità.',
    checkUnlock: (stats) => stats.bestElapsedSec >= 90
  },
  {
    id: 'enemy_miniboss',
    category: 'enemies',
    title: 'Campioni Elite & Hrimthurs',
    subtitle: 'Custodi dei Forzieri del Valhalla',
    accent: '#fbbf24',
    defaultUnlocked: false,
    unlockHint: 'Abbatti almeno 1 Mini-Boss Elite o il Boss Finale',
    body: 'Ogni minuto un Campione Jotun guida l’orda per proteggere un Forziere d’Oro, preparando il terreno all’arrivo di Hrimthurs al quarto minuto.',
    checkUnlock: (stats) => stats.miniBossesSlain >= 1 || stats.bossesSlain >= 1
  },
  {
    id: 'wpn_evolutions',
    category: 'weapons',
    title: 'Forgiatura delle Evoluzioni',
    subtitle: 'Armi Leggendarie a Livello 5',
    accent: '#fbbf24',
    defaultUnlocked: false,
    unlockHint: 'Forgia la tua prima Arma Evoluta in partita',
    body: 'Quando un’arma raggiunge il Livello 5 ed è affiancata dalla sua runa passiva gemella, un Forziere o un Level-Up può risvegliarne la forma leggendaria.',
    checkUnlock: (stats) => stats.evolutionsForged >= 1
  },
  {
    id: 'wpn_hammer',
    category: 'weapons',
    title: 'Martello Sismico · Maglio Spezzamondi',
    subtitle: 'Onda d’Urto & Fenditura',
    accent: '#fb923c',
    defaultUnlocked: false,
    unlockHint: 'Gioca con Bjorn oppure supera 150 uccisioni totali',
    body: 'Colpisce il suolo attorno all’eroe con scariche concentriche che respingono l’orda. Con Furia di Tyr evolve nel devastante Maglio Spezzamondi.',
    checkUnlock: (stats) => Boolean(stats.playedHeroes?.juggernaut) || stats.totalKills >= 150
  },
  {
    id: 'world_crates',
    category: 'weapons',
    title: 'Casse Runiche di Rifornimento',
    subtitle: 'Cibo, Calamite e Gemme',
    accent: '#34d399',
    defaultUnlocked: false,
    unlockHint: 'Distruggi 3 Casse Runiche sulla mappa',
    body: 'Reliquie sigillate sparse per la tundra. Infrangile con le tue armi per recuperare carne curativa (+25 HP), calamite globali o scie di EXP.',
    checkUnlock: (stats) => stats.cratesBroken >= 3
  },
  {
    id: 'world_shrines',
    category: 'weapons',
    title: 'Altari Antichi di Midgard',
    subtitle: 'Benedizioni Temporanee',
    accent: '#38bdf8',
    defaultUnlocked: false,
    unlockHint: 'Attiva 2 Altari Runici restando nel cerchio',
    body: 'Stele sacre ancora pulsanti di potere. Rimani nel loro anello per 1,5 secondi per ricevere Furia (+35% Danno), Egida o Benedizione curativa.',
    checkUnlock: (stats) => stats.shrinesActivated >= 2
  },
  {
    id: 'lore_fimbulvetr',
    category: 'lore',
    title: 'L’Inizio del Fimbulvetr',
    subtitle: 'Cronache della Prima Notte',
    accent: '#cbd5e1',
    defaultUnlocked: true,
    unlockHint: 'Disponibile dall’inizio',
    body: 'Tre inverni senza estate hanno preceduto la caduta dei ponti celesti. Solo chi raccoglie i frammenti di luce dalle ceneri può resistere al gelo.'
  },
  {
    id: 'lore_yggdrasil',
    category: 'lore',
    title: 'Le Braci di Yggdrasil',
    subtitle: 'Cronache del Rogo',
    accent: '#f59e0b',
    defaultUnlocked: false,
    unlockHint: 'Raggiungi 250 uccisioni totali',
    body: 'Le radici dell’Albero del Mondo ardono ancora sotto il ghiaccio, nutrendo i bracieri sparsi lungo la piana dove gli eroi ritrovano forza.',
    checkUnlock: (stats) => stats.totalKills >= 250
  },
  {
    id: 'lore_valhalla',
    category: 'lore',
    title: 'Il Canto degli Einherjar',
    subtitle: 'Cronache della Vittoria',
    accent: '#34d399',
    defaultUnlocked: false,
    unlockHint: 'Sconfiggi Hrimthurs, Signore del Gelo almeno 1 volta',
    body: 'Quando la corona glaciale va in frantumi, l’aurora si apre sul Valhalla e i nomi dei sopravvissuti vengono incisi nella pietra eterna.',
    checkUnlock: (stats) => stats.bossesSlain >= 1
  },
  {
    id: 'enemy_muspel_legion',
    category: 'enemies',
    title: 'Legioni di Muspelheim',
    subtitle: 'Demoni delle Braci, Segugi & Colossi',
    accent: '#f97316',
    defaultUnlocked: false,
    unlockHint: 'Combatti nelle Fucine di Muspelheim',
    body: 'Creature forgiate nella lava viva: segugi incandescenti, piro-manti e colossi d’ossidiana che difendono il regno del fuoco.',
    checkUnlock: (stats) => Boolean(stats.visitedRealms?.muspelheim)
  },
  {
    id: 'enemy_muspel_boss',
    category: 'enemies',
    title: 'Surtr, Signore delle Braci',
    subtitle: 'Titano del Fuoco Primordiale',
    accent: '#fb923c',
    defaultUnlocked: false,
    unlockHint: 'Sconfiggi Surtr nelle Fucine di Muspelheim',
    body: 'Il sovrano fiammeggiante destinato a bruciare il mondo. Evoca piogge di meteore e colpi d’area devastanti con la sua spada del crepuscolo.',
    checkUnlock: (stats) => Boolean(stats.clearedRealms?.muspelheim)
  },
  {
    id: 'enemy_hel_legion',
    category: 'enemies',
    title: 'Spettri di Nastrond & Evocatrici',
    subtitle: 'Schiere dell’Abisso',
    accent: '#10b981',
    defaultUnlocked: false,
    unlockHint: 'Scendi negli Abissi di Helheim',
    body: 'Anime avvolte da nebbia smeraldo e guardiani d’ossa antiche guidati dalle evocatrici runiche della regina dei morti.',
    checkUnlock: (stats) => Boolean(stats.visitedRealms?.helheim)
  },
  {
    id: 'enemy_hel_boss',
    category: 'enemies',
    title: 'Hel, Regina degli Abissi',
    subtitle: 'Sovrana di Helheim',
    accent: '#a855f7',
    defaultUnlocked: false,
    unlockHint: 'Sconfiggi Hel negli Abissi di Helheim',
    body: 'Custode delle anime perdute. Intesse spirali di dardi necrotici e anelli runici dell’oblio fino all’ultimo respiro.',
    checkUnlock: (stats) => Boolean(stats.clearedRealms?.helheim)
  },
  {
    id: 'lore_muspelheim',
    category: 'lore',
    title: 'Le Fucine del Crepuscolo',
    subtitle: 'Cronache di Muspelheim',
    accent: '#f97316',
    defaultUnlocked: false,
    unlockHint: 'Sconfiggi Hrimthurs o accedi a Muspelheim',
    body: 'Oltre i ghiacci spezzati di Midgard arde la fornace eterna dove le scintille antiche diedero forma alle stelle e alla spada di Surtr.',
    checkUnlock: (stats) => stats.bossesSlain >= 1 || Boolean(stats.visitedRealms?.muspelheim)
  },
  {
    id: 'lore_helheim',
    category: 'lore',
    title: 'Il Trono delle Ombre',
    subtitle: 'Cronache di Helheim',
    accent: '#10b981',
    defaultUnlocked: false,
    unlockHint: 'Sconfiggi Surtr o accedi ad Helheim',
    body: 'Sotto le radici più profonde di Yggdrasil scorrono i fiumi silenziosi di Helheim, dove solo chi ha domato gelo e fiamma può sopravvivere.',
    checkUnlock: (stats) => Boolean(stats.clearedRealms?.muspelheim) || Boolean(stats.visitedRealms?.helheim)
  },
  {
    id: 'enemy_shaman',
    category: 'enemies',
    title: 'Sciamano Runico',
    subtitle: 'Evocatore dell’Orda',
    accent: '#a855f7',
    defaultUnlocked: false,
    unlockHint: 'Affronta uno Sciamano Runico o supera 80 uccisioni totali',
    body: 'Mantiene le distanze dal bersaglio e incanala impulsi violacei per richiamare nuovi servitori nel cuore della battaglia. Eliminalo prima che l’orda si moltiplichi.',
    checkUnlock: (stats) => Boolean(stats.encounteredEnemies?.shaman) || stats.totalKills >= 80
  },
  {
    id: 'enemy_bomber',
    category: 'enemies',
    title: 'Portatore Esplosivo',
    subtitle: 'Detonazione alla Morte',
    accent: '#f97316',
    defaultUnlocked: false,
    unlockHint: 'Affronta un Portatore Esplosivo o supera 110 uccisioni totali',
    body: 'Carico di braci e cristalli instabili: quando cade o si avvicina troppo all’eroe, innesca un cerchio esplosivo ritardato. Esci dal raggio prima dello scoppio!',
    checkUnlock: (stats) => Boolean(stats.encounteredEnemies?.bomber) || stats.totalKills >= 110
  },
  {
    id: 'enemy_shieldbearer',
    category: 'enemies',
    title: 'Scudiero Corazzato',
    subtitle: 'Barriera Frontale Pesante',
    accent: '#94a3b8',
    defaultUnlocked: false,
    unlockHint: 'Affronta uno Scudiero Corazzato o supera 140 uccisioni totali',
    body: 'Avanza dietro uno scudo a torre rinforzato che devia il 65% dei proiettili frontali. Colpiscilo ai fianchi oppure usa saette, aura, martello e flagello.',
    checkUnlock: (stats) => Boolean(stats.encounteredEnemies?.shieldbearer) || stats.totalKills >= 140
  },
  {
    id: 'enemy_stalker',
    category: 'enemies',
    title: 'Ombra Guizzante',
    subtitle: 'Scatto Laterale Improvviso',
    accent: '#e879f9',
    defaultUnlocked: false,
    unlockHint: 'Affronta un’Ombra Guizzante o sopravvivi almeno 75 secondi',
    body: 'Predatore agile che aggira le difese alternando avanzate oblique e scatti laterali fulminei per tagliare la ritirata.',
    checkUnlock: (stats) => Boolean(stats.encounteredEnemies?.stalker) || stats.bestElapsedSec >= 75
  },
  {
    id: 'wpn_exclusive_arsenal',
    category: 'weapons',
    title: 'I 12 Arsenali del Valhalla',
    subtitle: '3 Armi Esclusive per Eroe',
    accent: '#f59e0b',
    defaultUnlocked: false,
    unlockHint: 'Gioca con almeno 2 eroi diversi o accumula 30 uccisioni',
    body: 'Ogni campione padroneggia tre armi uniche irripetibili: Astrid con ascia, lame e lancia; Skadi con pugnali, falci e spine; Freya con globo, saetta e grimorio; Bjorn con martello, aura e flagello.',
    checkUnlock: (stats) => Object.keys(stats.playedHeroes || {}).length >= 2 || stats.totalKills >= 30
  },
  {
    id: 'lore_active_skills',
    category: 'lore',
    title: 'Tecniche Attive degli Eroi',
    subtitle: 'Richiamo d’Emergenza in Battaglia',
    accent: '#38bdf8',
    defaultUnlocked: false,
    unlockHint: 'Attiva un’Abilità Attiva in battaglia (o sopravvivi 30s)',
    body: 'Quando l’assedio si stringe, ogni eroe può liberare la propria tecnica suprema: Balzo della Valchiria, Passo d’Ombra, Rottura Runica o Pelle di Ferro.',
    checkUnlock: (stats) => (stats.skillsUsed || 0) >= 1 || stats.bestElapsedSec >= 30
  }
];

export function createDefaultCodexState() {
  return {
    unlockedIds: CODEX_ENTRIES.filter((e) => e.defaultUnlocked).map((e) => e.id),
    stats: {
      totalKills: 0,
      cratesBroken: 0,
      shrinesActivated: 0,
      miniBossesSlain: 0,
      evolutionsForged: 0,
      bossesSlain: 0,
      bestElapsedSec: 0,
      skillsUsed: 0,
      playedHeroes: {},
      wonHeroes: {},
      visitedRealms: {},
      clearedRealms: {},
      encounteredEnemies: {}
    }
  };
}

export function loadCodexState() {
  const base = createDefaultCodexState();
  try {
    const raw = localStorage.getItem(CODEX_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    const unlockedSet = new Set([...base.unlockedIds, ...(Array.isArray(parsed?.unlockedIds) ? parsed.unlockedIds : [])]);
    return {
      unlockedIds: Array.from(unlockedSet),
      stats: {
        ...base.stats,
        ...(parsed?.stats || {}),
        playedHeroes: { ...(parsed?.stats?.playedHeroes || {}) },
        wonHeroes: { ...(parsed?.stats?.wonHeroes || {}) },
        visitedRealms: { ...(parsed?.stats?.visitedRealms || {}) },
        clearedRealms: { ...(parsed?.stats?.clearedRealms || {}) },
        encounteredEnemies: { ...(parsed?.stats?.encounteredEnemies || {}) }
      }
    };
  } catch {
    return base;
  }
}

export function saveCodexState(state) {
  try {
    localStorage.setItem(CODEX_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora errori storage
  }
}

export function getCodexView(state = loadCodexState(), category = 'all') {
  const unlockedSet = new Set(state.unlockedIds);
  const filtered = category === 'all'
    ? CODEX_ENTRIES
    : CODEX_ENTRIES.filter((entry) => entry.category === category);

  return {
    totalCount: CODEX_ENTRIES.length,
    unlockedCount: unlockedSet.size,
    entries: filtered.map((entry) => ({
      ...entry,
      unlocked: unlockedSet.has(entry.id)
    }))
  };
}

export function recordRunCodexProgress(runResult = {}) {
  const state = loadCodexState();
  const prevUnlocked = new Set(state.unlockedIds);
  const stats = state.stats;

  stats.totalKills += Math.max(0, runResult.kills || 0);
  stats.cratesBroken += Math.max(0, runResult.cratesBroken || 0);
  stats.shrinesActivated += Math.max(0, runResult.shrinesActivated || 0);
  stats.miniBossesSlain += Math.max(0, runResult.miniBossesSlain || 0);
  stats.evolutionsForged += Math.max(0, runResult.evolutionsForged || 0);
  stats.skillsUsed = (stats.skillsUsed || 0) + Math.max(0, runResult.skillsUsed || 0);
  if (runResult.bossDefeated) {
    stats.bossesSlain += 1;
  }
  stats.bestElapsedSec = Math.max(stats.bestElapsedSec, runResult.elapsedSec || 0);

  if (runResult.heroId) {
    stats.playedHeroes[runResult.heroId] = true;
    if (runResult.victory) {
      stats.wonHeroes[runResult.heroId] = true;
    }
  }
  if (runResult.realmId) {
    stats.visitedRealms[runResult.realmId] = true;
    if (runResult.victory) {
      stats.clearedRealms[runResult.realmId] = true;
    }
  }
  if (Array.isArray(runResult.encounteredEnemies)) {
    for (const enemyType of runResult.encounteredEnemies) {
      stats.encounteredEnemies[enemyType] = true;
    }
  }

  const newlyUnlocked = [];
  for (const entry of CODEX_ENTRIES) {
    if (prevUnlocked.has(entry.id)) continue;
    if (entry.defaultUnlocked || (typeof entry.checkUnlock === 'function' && entry.checkUnlock(stats))) {
      prevUnlocked.add(entry.id);
      newlyUnlocked.push(entry);
    }
  }

  state.unlockedIds = Array.from(prevUnlocked);
  saveCodexState(state);
  return { state, newlyUnlocked };
}
