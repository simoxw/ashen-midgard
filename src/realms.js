/**
 * Configurazione dei Regni (Biomi), Progressione Campagna Multi-Area
 * e Dialoghi brevi in partita su ondate, mini-boss e fasi dei Boss.
 */

export const REALM_STORAGE_KEY = 'ashen_midgard_realms_v1';

export const REALM_ORDER = ['midgard', 'muspelheim', 'helheim', 'asgard'];

export const CHALLENGE_ORDER = ['standard', 'double_horde', 'dark_frenzy', 'titanomachy'];

export const REALM_CHALLENGES = {
  standard: {
    id: 'standard',
    name: 'Normale',
    badge: '1.0x EXP',
    description: 'Esperienza classica del Regno selezionato.',
    accent: '#94a3b8',
    hpMult: 1.0,
    speedMult: 1.0,
    spawnMult: 1.0,
    xpMult: 1.0
  },
  double_horde: {
    id: 'double_horde',
    name: 'Orda Doppia',
    badge: '+25% EXP',
    description: 'Sciami molto più densi (+45% nemici, +6% velocità).',
    accent: '#38bdf8',
    hpMult: 1.0,
    speedMult: 1.06,
    spawnMult: 1.45,
    xpMult: 1.25
  },
  dark_frenzy: {
    id: 'dark_frenzy',
    name: 'Frenesia Oscura',
    badge: '+35% EXP',
    description: 'Nemici letali e fulminei (+20% HP, +18% velocità, +20% orda).',
    accent: '#f59e0b',
    hpMult: 1.2,
    speedMult: 1.18,
    spawnMult: 1.2,
    xpMult: 1.35
  },
  titanomachy: {
    id: 'titanomachy',
    name: 'Titanomachia',
    badge: '+60% EXP',
    description: 'Prova dei Campioni (+55% HP, +12% velocità, +35% orda).',
    accent: '#f87171',
    hpMult: 1.55,
    speedMult: 1.12,
    spawnMult: 1.35,
    xpMult: 1.6
  }
};

export function getChallengeConfig(challengeId) {
  return REALM_CHALLENGES[challengeId] || REALM_CHALLENGES.standard;
}

export const REALM_CATALOG = {
  midgard: {
    id: 'midgard',
    order: 1,
    name: 'Midgard',
    fullName: 'Tundra di Midgard',
    subtitle: 'Neve, Basalto & Brina',
    accent: '#38bdf8',
    bgColor: '#0f172a',
    groundKey: 'ground_tile',
    decalKeys: ['decal_rune', 'decal_relic', 'decal_snow'],
    propKeys: ['prop_brazier', 'prop_rock', 'prop_tree', 'prop_tree', 'prop_tree'],
    weatherMode: 'snow',
    hpMult: 1.0,
    speedMult: 1.0,
    xpBonusMult: 1.0,
    unlockHint: 'Disponibile dall’inizio',
    enemyTexMap: {
      swarm: 'enemy_swarm',
      fast: 'enemy_fast',
      archer: 'enemy_archer',
      berserker: 'enemy_berserker',
      tank: 'enemy_tank',
      shaman: 'enemy_shaman',
      bomber: 'enemy_bomber',
      shieldbearer: 'enemy_shieldbearer',
      stalker: 'enemy_stalker',
      elite: 'enemy_elite',
      boss: 'boss'
    },
    rangedProjKey: 'frost_arrow',
    miniBossTitles: ['Campione Jotun', 'Valchiria Caduta', 'Signore delle Ceneri'],
    boss: {
      id: 'hrimthurs',
      name: 'Hrimthurs, Signore del Gelo',
      warningText: 'ALLARME: SIGNORE DEL GELO IN ARRIVO',
      maxHp: 4500,
      damage: 28,
      speed: 64,
      attackProfile: 'frost',
      accent: '#38bdf8',
      telegraphColor: 0xf87171
    },
    nextRealmId: 'muspelheim',
    victoryTitle: 'VITTORIA A MIDGARD',
    victorySub: 'Hrimthurs è stato abbattuto. Le forge di Muspelheim ti attendono.'
  },
  muspelheim: {
    id: 'muspelheim',
    order: 2,
    name: 'Muspelheim',
    fullName: 'Fucine di Muspelheim',
    subtitle: 'Magma, Cenere & Ossidiana',
    accent: '#f97316',
    bgColor: '#1a0b08',
    groundKey: 'ground_tile_muspel',
    decalKeys: ['decal_lava', 'decal_ember_rune', 'decal_ash'],
    propKeys: ['prop_brazier', 'prop_obsidian', 'prop_magma_spire', 'prop_obsidian', 'prop_magma_spire'],
    weatherMode: 'embers',
    hpMult: 1.35,
    speedMult: 1.08,
    xpBonusMult: 1.25,
    unlockHint: 'Sconfiggi Hrimthurs a Midgard',
    enemyTexMap: {
      swarm: 'enemy_muspel_swarm',
      fast: 'enemy_muspel_fast',
      archer: 'enemy_muspel_archer',
      berserker: 'enemy_muspel_berserker',
      tank: 'enemy_muspel_tank',
      shaman: 'enemy_muspel_shaman',
      bomber: 'enemy_muspel_bomber',
      shieldbearer: 'enemy_muspel_shieldbearer',
      stalker: 'enemy_muspel_stalker',
      elite: 'enemy_muspel_elite',
      boss: 'boss_surtr'
    },
    rangedProjKey: 'fire_bolt',
    miniBossTitles: ['Arconte delle Braci', 'Fabbro Infernale', 'Sentinella di Surtr'],
    boss: {
      id: 'surtr',
      name: 'Surtr, Signore delle Braci',
      warningText: 'ALLARME: SURTR IL SIGNORE DELLE BRACI',
      maxHp: 6800,
      damage: 34,
      speed: 70,
      attackProfile: 'fire',
      accent: '#f97316',
      telegraphColor: 0xfb923c
    },
    nextRealmId: 'helheim',
    victoryTitle: 'VITTORIA A MUSPELHEIM',
    victorySub: 'Surtr è caduto nella sua stessa cenere. Il cancello di Helheim si apre.'
  },
  helheim: {
    id: 'helheim',
    order: 3,
    name: 'Helheim',
    fullName: 'Abissi di Helheim',
    subtitle: 'Nebbia Spettrale & Ombre',
    accent: '#10b981',
    bgColor: '#0a1017',
    groundKey: 'ground_tile_hel',
    decalKeys: ['decal_hel_rune', 'decal_bones', 'decal_mist'],
    propKeys: ['prop_soul_brazier', 'prop_hel_obelisk', 'prop_dead_tree', 'prop_hel_obelisk', 'prop_dead_tree'],
    weatherMode: 'spectral',
    hpMult: 1.7,
    speedMult: 1.15,
    xpBonusMult: 1.55,
    unlockHint: 'Sconfiggi Surtr a Muspelheim',
    enemyTexMap: {
      swarm: 'enemy_hel_swarm',
      fast: 'enemy_hel_fast',
      archer: 'enemy_hel_archer',
      berserker: 'enemy_hel_berserker',
      tank: 'enemy_hel_tank',
      shaman: 'enemy_hel_shaman',
      bomber: 'enemy_hel_bomber',
      shieldbearer: 'enemy_hel_shieldbearer',
      stalker: 'enemy_hel_stalker',
      elite: 'enemy_hel_elite',
      boss: 'boss_hel'
    },
    rangedProjKey: 'shadow_bolt',
    miniBossTitles: ['Custode di Nastrond', 'Mietitrice d’Ombra', 'Araldo di Hel'],
    boss: {
      id: 'hel',
      name: 'Hel, Regina degli Abissi',
      warningText: 'ALLARME: HEL REGINA DEGLI ABISSI',
      maxHp: 9200,
      damage: 38,
      speed: 74,
      attackProfile: 'shadow',
      accent: '#10b981',
      telegraphColor: 0xa855f7
    },
    nextRealmId: 'asgard',
    victoryTitle: 'VITTORIA A HELHEIM',
    victorySub: 'Hel è stata piegata. Il ponte spezzato verso Asgard in Rovine ti attende!'
  },
  asgard: {
    id: 'asgard',
    order: 4,
    name: 'Asgard',
    fullName: 'Asgard in Rovine',
    subtitle: 'Bifrost Spezzato & Rovine Astrali',
    accent: '#fbbf24',
    bgColor: '#110f1d',
    groundKey: 'ground_tile_asgard',
    decalKeys: ['decal_bifrost', 'decal_asgard_gold', 'decal_shattered_marble'],
    propKeys: ['prop_asgard_brazier', 'prop_bifrost_pillar', 'prop_bifrost_pillar', 'prop_asgard_brazier'],
    weatherMode: 'astral',
    hpMult: 2.1,
    speedMult: 1.22,
    xpBonusMult: 1.9,
    unlockHint: 'Sconfiggi Hel negli Abissi di Helheim',
    enemyTexMap: {
      swarm: 'enemy_asgard_swarm',
      fast: 'enemy_asgard_fast',
      archer: 'enemy_asgard_archer',
      berserker: 'enemy_asgard_berserker',
      tank: 'enemy_asgard_tank',
      shaman: 'enemy_asgard_shaman',
      bomber: 'enemy_asgard_bomber',
      shieldbearer: 'enemy_asgard_shieldbearer',
      stalker: 'enemy_asgard_stalker',
      elite: 'enemy_asgard_elite',
      boss: 'boss_loki'
    },
    rangedProjKey: 'astral_spear',
    miniBossTitles: ['Einherjar Corrotto', 'Guardiano del Bifrost', 'Valkiria Astrale'],
    boss: {
      id: 'loki_odin',
      name: 'Loki, l’Ingannatore',
      stage2Name: 'Odino, il Padre Caduto',
      stage2TexKey: 'boss_odin',
      warningText: 'ALLARME: LOKI & ODINO SUL TRONO SPEZZATO',
      maxHp: 12000,
      damage: 44,
      speed: 78,
      attackProfile: 'asgard_dual',
      accent: '#fbbf24',
      telegraphColor: 0xfbbf24
    },
    nextRealmId: null,
    victoryTitle: 'ASGARD LIBERATA',
    victorySub: 'Hai spezzato l’inganno di Loki e l’ultima lancia di Odino. Il Valhalla risplende eterno!'
  }
};

export function getRealmConfig(realmId) {
  return REALM_CATALOG[realmId] || REALM_CATALOG.midgard;
}

const HERO_SPEAKER_NAMES = {
  warrior: { name: 'Astrid', role: 'Valchiria' },
  assassin: { name: 'Skadi', role: 'Assassina' },
  mage: { name: 'Freya', role: 'Maga Runica' },
  juggernaut: { name: 'Bjorn', role: 'Martello di Ferro' }
};

export const REALM_DIALOGUES = {
  midgard: {
    wave_1: {
      speaker: 'hero',
      text: 'I lupi di Fenrir e gli arcieri della brina accerchiano la piana. Resta in movimento!'
    },
    miniboss_0: {
      speaker: 'Campione Jotun',
      role: 'Elite di Midgard',
      accent: '#fbbf24',
      text: 'Nessun mortale oltrepasserà la tormenta. Difenderemo il Forziere del Valhalla!'
    },
    wave_3: {
      speaker: 'hero',
      text: 'I predoni Berserker caricano a testa bassa: spezza il loro assalto con le rune!'
    },
    wave_5: {
      speaker: 'Voce delle Norne',
      role: 'Presagio',
      accent: '#38bdf8',
      text: 'Il gelo si addensa sotto i tuoi passi. Hrimthurs sta per infrangere l’orizzonte!'
    },
    boss_enter: {
      speaker: 'Hrimthurs',
      role: 'Signore del Gelo',
      accent: '#38bdf8',
      text: 'Hai sconfitto i miei campioni, ma la tua fiamma morirà sotto il mio maglio glaciale!'
    },
    boss_half: {
      speaker: 'Hrimthurs',
      role: 'Furia Glaciale · 50% HP',
      accent: '#f87171',
      text: 'Basta giocare! Che il Fimbulvetr ti schiacci in mille frammenti di ghiaccio!'
    },
    boss_phase2: {
      speaker: 'Hrimthurs',
      role: 'Fase II · Bufera Crescente',
      accent: '#38bdf8',
      text: 'Senti il mordere dei ghiacci antichi? Ora la tormenta si abbatte su di te!'
    },
    boss_phase3: {
      speaker: 'Hrimthurs',
      role: 'Fase III · Cataclisma Polare',
      accent: '#f87171',
      text: 'Se devo cadere, trascinerò l’intera piana con me nel gelo eterno!'
    }
  },
  muspelheim: {
    wave_1: {
      speaker: 'hero',
      text: 'L’aria brucia i polmoni: demoni delle braci e segugi lavici emergono dalle fessure!'
    },
    miniboss_0: {
      speaker: 'Arconte delle Braci',
      role: 'Elite di Muspelheim',
      accent: '#f97316',
      text: 'Le forge di Surtr non conoscono pietà. Qui bruceranno anche le tue rune!'
    },
    wave_3: {
      speaker: 'hero',
      text: 'I Piro-Manti lanciano dardi di fuoco e i colossi d’ossidiana avanzano: non farti chiudere!'
    },
    wave_5: {
      speaker: 'Araldo di Cenere',
      role: 'Presagio Vulcanico',
      accent: '#fbbf24',
      text: 'La terra si spacca sotto la lama di Surtr. Resisti ancora un minuto!'
    },
    boss_enter: {
      speaker: 'Surtr',
      role: 'Signore delle Braci',
      accent: '#f97316',
      text: 'Ardi davanti al crepuscolo del mondo! La mia spada ridurrà Midgard in cenere!'
    },
    boss_half: {
      speaker: 'Surtr',
      role: 'Furia Vulcanica · 50% HP',
      accent: '#ef4444',
      text: 'Osi ancora sfidare il fuoco primordiale? Pioveranno meteore finché non resterà nulla!'
    },
    boss_phase2: {
      speaker: 'Surtr',
      role: 'Fase II · Eruzione Scarlatta',
      accent: '#fb923c',
      text: 'Le fucine si spalancano! Ogni scintilla diventerà una pioggia di fuoco!'
    },
    boss_phase3: {
      speaker: 'Surtr',
      role: 'Fase III · Fiamma del Ragnarok',
      accent: '#ef4444',
      text: 'Nessun’armatura può reggere il cuore di Muspelheim!'
    }
  },
  helheim: {
    wave_1: {
      speaker: 'hero',
      text: 'Ombre e spettri di Nastrond sorgono dalla nebbia. La fredda morsa di Hel ci osserva.'
    },
    miniboss_0: {
      speaker: 'Custode di Nastrond',
      role: 'Elite di Helheim',
      accent: '#10b981',
      text: 'Ogni anima caduta appartiene alla Regina. Cedi le armi e unisciti al silenzio!'
    },
    wave_3: {
      speaker: 'hero',
      text: 'Le evocatrici scagliano dardi necrotici nell’ombra: spezza la loro linea!'
    },
    wave_5: {
      speaker: 'Sussurro dell’Abisso',
      role: 'Presagio Runico',
      accent: '#a855f7',
      text: 'I cancelli del trono si spalancano. Hel stessa sta scendendo nell’arena!'
    },
    boss_enter: {
      speaker: 'Hel',
      role: 'Regina degli Abissi',
      accent: '#10b981',
      text: 'Hai sfidato il gelo e la fiamma, ma nessuno sfugge al mio regno eterno.'
    },
    boss_half: {
      speaker: 'Hel',
      role: 'Furia dell’Abisso · 50% HP',
      accent: '#a855f7',
      text: 'Ammirevole... allora lascia che le rune dell’oblio spezzino il tuo spirito!'
    },
    boss_phase2: {
      speaker: 'Hel',
      role: 'Fase II · Velo di Nastrond',
      accent: '#34d399',
      text: 'Le anime dei caduti si stringono attorno a te!'
    },
    boss_phase3: {
      speaker: 'Hel',
      role: 'Fase III · Eclissi Eterna',
      accent: '#c084fc',
      text: 'Ora guarda negli occhi la signora dell’ultimo silenzio!'
    }
  },
  asgard: {
    wave_1: {
      speaker: 'hero',
      text: 'Anche il Bifrost è in frantumi. Gli Einherjar corrotti difendono le rovine d’oro di Asgard!'
    },
    miniboss_0: {
      speaker: 'Einherjar Corrotto',
      role: 'Elite di Asgard',
      accent: '#fbbf24',
      text: 'Chi viola la sala del Padre Tutto? Solo l’illusione e la lancia ti attendono!'
    },
    wave_3: {
      speaker: 'hero',
      text: 'Attenzione agli sciami astrali e alle lance dorate: non restare mai in linea retta!'
    },
    wave_5: {
      speaker: 'Eco del Bifrost',
      role: 'Presagio Finale',
      accent: '#fbbf24',
      text: 'Un sorriso ingannatore risuona tra le colonne. Loki ti osserva dal trono spezzato!'
    },
    boss_enter: {
      speaker: 'Loki, l’Ingannatore',
      role: 'Fase I · Maestro d’Illusioni',
      accent: '#10b981',
      text: 'Sei arrivato fino in cima alle ceneri, mortale? Vediamo se sai distinguere il vero dall’inganno!'
    },
    boss_phase2: {
      speaker: 'Loki, l’Ingannatore',
      role: 'Fase II · Specchi di Smeraldo',
      accent: '#34d399',
      text: 'Colpisci pure la mia ombra: ogni illusione nasconde un altro dardo!'
    },
    boss_transform: {
      speaker: 'Odino, il Padre Caduto',
      role: 'Trasformazione · Gungnir Risvegliata',
      accent: '#fbbf24',
      text: 'Basta inganni, Loki! Affronterai ora la lancia che non manca mai il bersaglio!'
    },
    boss_half: {
      speaker: 'Odino, il Padre Caduto',
      role: 'Odinforce · 50% HP',
      accent: '#fbbf24',
      text: 'Che i fulmini astrali di Yggdrasil giudichino il tuo valore!'
    },
    boss_phase3: {
      speaker: 'Odino, il Padre Caduto',
      role: 'Fase III · Crepuscolo degli Dei',
      accent: '#f59e0b',
      text: 'Se puoi abbattere persino il Signore di Asgard, allora ricostruisci il mondo dalle sue ceneri!'
    }
  }
};

export function getRealmDialogue(realmId, triggerKey, heroId = 'warrior') {
  const realm = getRealmConfig(realmId);
  const bank = REALM_DIALOGUES[realm.id] || REALM_DIALOGUES.midgard;
  const entry = bank[triggerKey];
  if (!entry) return null;

  if (entry.speaker === 'hero') {
    const heroInfo = HERO_SPEAKER_NAMES[heroId] || HERO_SPEAKER_NAMES.warrior;
    return {
      triggerKey,
      speaker: heroInfo.name,
      role: `${heroInfo.role} · ${realm.name}`,
      accent: realm.accent,
      text: entry.text
    };
  }

  return {
    triggerKey,
    speaker: entry.speaker,
    role: entry.role || realm.name,
    accent: entry.accent || realm.accent,
    text: entry.text
  };
}

export function createDefaultRealmProgress() {
  return {
    selectedRealm: 'midgard',
    selectedChallenge: 'standard',
    selectedMode: 'campaign',
    unlockedRealms: ['midgard'],
    clearedRealms: {},
    endlessRecords: {}
  };
}

export function isEndlessUnlocked(progress, recordsHint = null) {
  if (!progress) return (recordsHint?.bossesSlain || 0) >= 1;
  return (
    (progress.clearedRealms?.midgard || 0) >= 1 ||
    (Array.isArray(progress.unlockedRealms) && progress.unlockedRealms.length > 1) ||
    (recordsHint?.bossesSlain || 0) >= 1
  );
}

export function loadRealmProgress(recordsHint = null) {
  const base = createDefaultRealmProgress();
  try {
    const raw = localStorage.getItem(REALM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const unlockedSet = new Set([
        'midgard',
        ...(Array.isArray(parsed?.unlockedRealms) ? parsed.unlockedRealms.filter((id) => REALM_CATALOG[id]) : [])
      ]);
      const cleared = { ...(parsed?.clearedRealms || {}) };
      if ((recordsHint?.bossesSlain || 0) >= 1) {
        unlockedSet.add('muspelheim');
        if (!cleared.midgard) cleared.midgard = recordsHint.bossesSlain;
      }
      if ((cleared.helheim || 0) >= 1) {
        unlockedSet.add('asgard');
      }
      const selected = REALM_CATALOG[parsed?.selectedRealm] && unlockedSet.has(parsed.selectedRealm)
        ? parsed.selectedRealm
        : 'midgard';
      const selectedChallenge = REALM_CHALLENGES[parsed?.selectedChallenge]
        ? parsed.selectedChallenge
        : 'standard';
      const endlessAllowed = unlockedSet.size > 1 || (cleared.midgard || 0) >= 1 || (recordsHint?.bossesSlain || 0) >= 1;
      const selectedMode = parsed?.selectedMode === 'endless' && endlessAllowed ? 'endless' : 'campaign';
      return {
        selectedRealm: selected,
        selectedChallenge,
        selectedMode,
        unlockedRealms: Array.from(unlockedSet),
        clearedRealms: cleared,
        endlessRecords: { ...(parsed?.endlessRecords || {}) }
      };
    }
  } catch {
    // Ignora storage bloccato
  }

  if ((recordsHint?.bossesSlain || 0) >= 1) {
    base.unlockedRealms = ['midgard', 'muspelheim'];
    base.clearedRealms = { midgard: recordsHint.bossesSlain };
  }
  return base;
}

export function saveRealmProgress(progress) {
  try {
    localStorage.setItem(REALM_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignora storage bloccato
  }
}

export function recordRealmVictory(realmId, recordsHint = null) {
  const realm = getRealmConfig(realmId);
  const progress = loadRealmProgress(recordsHint);
  const unlockedSet = new Set(progress.unlockedRealms);
  unlockedSet.add(realm.id);
  progress.clearedRealms[realm.id] = (progress.clearedRealms[realm.id] || 0) + 1;

  let newlyUnlockedRealmId = null;
  if (realm.nextRealmId && REALM_CATALOG[realm.nextRealmId]) {
    if (!unlockedSet.has(realm.nextRealmId)) {
      newlyUnlockedRealmId = realm.nextRealmId;
    }
    unlockedSet.add(realm.nextRealmId);
  }

  progress.unlockedRealms = Array.from(unlockedSet);
  saveRealmProgress(progress);
  return { progress, newlyUnlockedRealmId };
}

export function recordEndlessRun(realmId, runResult = {}, recordsHint = null) {
  const realm = getRealmConfig(realmId);
  const progress = loadRealmProgress(recordsHint);
  const prev = progress.endlessRecords?.[realm.id] || { bestTimeSec: 0, maxWave: 0, bestKills: 0 };
  const elapsedSec = Math.max(0, Math.floor(runResult.elapsedSec || 0));
  const endlessWave = Math.max(0, Math.floor(runResult.endlessWave || 0));
  const kills = Math.max(0, Math.floor(runResult.kills || 0));

  progress.endlessRecords[realm.id] = {
    bestTimeSec: Math.max(prev.bestTimeSec || 0, elapsedSec),
    maxWave: Math.max(prev.maxWave || 0, endlessWave),
    bestKills: Math.max(prev.bestKills || 0, kills)
  };
  saveRealmProgress(progress);
  return progress;
}
