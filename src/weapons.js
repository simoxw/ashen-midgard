/**
 * Catalogo Armi, Passive, Evoluzioni Leggendarie e stato badge evoluzione.
 */

export const UPGRADE_CATALOG = [
  {
    id: 'axe',
    type: 'weapon',
    name: 'Ascia Runica',
    maxLevel: 5,
    accent: '#f59e0b',
    desc: [
      'Scaglia un’ascia runica fiammeggiante verso il nemico più vicino.',
      '+1 Ascia lanciata e +20% Danno.',
      '+1 Perforazione e ricarica più rapida.',
      '+1 Ascia lanciata e +25% Danno.',
      'Raffica finale: +1 Ascia, +1 Perforazione, +30% Danno.'
    ]
  },
  {
    id: 'aura',
    type: 'weapon',
    name: 'Aura del Crepuscolo',
    maxLevel: 5,
    accent: '#a855f7',
    desc: [
      'Cerchio runico rotante che brucia e respinge i nemici vicini.',
      '+20% Raggio aura e +30% Danno.',
      'Impulsi più frequenti e respingimento maggiore.',
      '+25% Raggio aura e +35% Danno.',
      'Tempesta eterna: raggio massimo e danno raddoppiato.'
    ]
  },
  {
    id: 'lightning',
    type: 'weapon',
    name: 'Saetta di Thor',
    maxLevel: 5,
    accent: '#38bdf8',
    desc: [
      'Invoca un fulmine biforcuto ad area su un nemico casuale.',
      '+1 Saetta per scarica e +20% Danno.',
      '+25% Area d’impatto e ricarica ridotta.',
      '+1 Saetta aggiuntiva e +30% Danno.',
      'Ira di Odino: +2 Saette per scarica con scarica rapida.'
    ]
  },
  {
    id: 'blades',
    type: 'weapon',
    name: 'Lame di Valchiria',
    maxLevel: 5,
    accent: '#e2e8f0',
    desc: [
      'Evoca 2 lame d’argento con scia che orbitano attorno all’eroe.',
      '+1 Lama orbitante e +20% Danno.',
      'Rotazione più veloce e raggio orbitale esteso.',
      '+1 Lama orbitante e +30% Danno.',
      'Vortice d’acciaio: 5 lame ad altissima velocità.'
    ]
  },
  {
    id: 'dagger',
    type: 'weapon',
    name: 'Pugnali d’Ombra',
    maxLevel: 5,
    accent: '#e879f9',
    desc: [
      'Scaglia una raffica rapida di pugnali perforanti ad alto critico.',
      '+1 Pugnale per raffica e ricarica più veloce.',
      '+1 Perforazione e +25% Danno critico.',
      '+2 Pugnali a ventaglio verso i bersagli vicini.',
      'Tempesta d’Ombra: 5 pugnali fulminei con perforazione doppia.'
    ]
  },
  {
    id: 'orb',
    type: 'weapon',
    name: 'Globo Arcano',
    maxLevel: 5,
    accent: '#38bdf8',
    desc: [
      'Lancia sfere di gelo runico che esplodono ad area all’impatto.',
      '+25% Raggio esplosione e +20% Danno.',
      '+1 Globo lanciato e onda d’urto potenziata.',
      '+30% Raggio esplosione e ricarica più rapida.',
      'Nova Glaciale: 3 globi esplosivi ad altissimo potenziale.'
    ]
  },
  {
    id: 'hammer',
    type: 'weapon',
    name: 'Martello Sismico',
    maxLevel: 5,
    accent: '#fb923c',
    desc: [
      'Scatena onde sismiche attorno all’eroe che respingono i nemici.',
      '+20% Raggio sismico e +25% Danno.',
      'Doppia onda tellurica e ricarica più rapida.',
      '+25% Raggio e contraccolpo pesante.',
      'Furia Tellurica: 3 onde concentriche devastanti.'
    ]
  },
  {
    id: 'spear',
    type: 'weapon',
    name: 'Lancia di Odino',
    maxLevel: 5,
    accent: '#fbbf24',
    desc: [
      'Scaglia una lancia celeste ad alta velocità che trafigge i nemici in linea.',
      '+1 Perforazione e +25% Danno.',
      '+1 Lancia parallela per raffica.',
      'Velocità supersonica e ricarica più rapida.',
      'Raffica dorata: 3 lance perforanti ad alto critico.'
    ]
  },
  {
    id: 'scythe',
    type: 'weapon',
    name: 'Falci del Crepuscolo',
    maxLevel: 5,
    accent: '#c084fc',
    desc: [
      'Lancia una falce rotante che torna indietro come un boomerang.',
      '+20% Danno e raggio di volo esteso.',
      '+1 Falce lanciata in direzioni opposte.',
      'Ritorno più rapido e +25% Danno.',
      'Tempesta rotante: 3 falci cremisi a doppio passaggio.'
    ]
  },
  {
    id: 'fangs',
    type: 'weapon',
    name: 'Spine d’Ombra',
    maxLevel: 5,
    accent: '#d8b4fe',
    desc: [
      'Dardi oscuri che rimbalzano sul nemico vicino dopo ogni impatto.',
      '+1 Rimbalzo aggiuntivo e +20% Danno.',
      '+1 Spina scagliata per salva.',
      '+1 Rimbalzo extra e ricarica più veloce.',
      'Sciame di cristallo: 3 spine con 4 rimbalzi ciascuna.'
    ]
  },
  {
    id: 'grimoire',
    type: 'weapon',
    name: 'Grimorio Astrale',
    maxLevel: 5,
    accent: '#60a5fa',
    desc: [
      'Evoca un pilastro runico esplosivo sotto i gruppi di nemici.',
      '+25% Area del sigillo e +25% Danno.',
      '+1 Pilastro astrale per invocazione.',
      'Ricarica ridotta e onde d’urto potenziate.',
      'Cataclisma: 3 pilastri simultanei ad alto potenziale.'
    ]
  },
  {
    id: 'flail',
    type: 'weapon',
    name: 'Flagello a Catena',
    maxLevel: 5,
    accent: '#fb7185',
    desc: [
      'Fa roteare una sfera ferrata a catena attorno all’eroe spazzando i nemici.',
      '+20% Portata della catena e +25% Danno.',
      'Rotazione più ampia e ricarica più rapida.',
      '+30% Danno e contraccolpo pesante.',
      'Spazzata totale a 360° con doppia sfera.'
    ]
  },
  {
    id: 'might',
    type: 'passive',
    name: 'Furia di Tyr',
    maxLevel: 5,
    accent: '#ef4444',
    desc: [
      '+18% Danno inflitto da tutte le armi.',
      '+36% Danno totale da tutte le armi.',
      '+54% Danno totale da tutte le armi.',
      '+72% Danno totale da tutte le armi.',
      '+90% Danno totale da tutte le armi.'
    ]
  },
  {
    id: 'swift',
    type: 'passive',
    name: 'Passo di Sleipnir',
    maxLevel: 5,
    accent: '#22c55e',
    desc: [
      '+12% Velocità di movimento.',
      '+24% Velocità di movimento.',
      '+36% Velocità di movimento.',
      '+48% Velocità di movimento.',
      '+60% Velocità di movimento.'
    ]
  },
  {
    id: 'area',
    type: 'passive',
    name: 'Eco Runica',
    maxLevel: 5,
    accent: '#06b6d4',
    desc: [
      '+16% Area d’effetto di tutte le armi.',
      '+32% Area d’effetto di tutte le armi.',
      '+48% Area d’effetto di tutte le armi.',
      '+64% Area d’effetto di tutte le armi.',
      '+80% Area d’effetto di tutte le armi.'
    ]
  },
  {
    id: 'magnet',
    type: 'passive',
    name: 'Ambra Magnetica',
    maxLevel: 5,
    accent: '#eab308',
    desc: [
      '+35% Raggio di attrazione gemme XP.',
      '+70% Raggio di attrazione gemme XP.',
      '+105% Raggio di attrazione gemme XP.',
      '+140% Raggio di attrazione gemme XP.',
      '+180% Raggio di attrazione gemme XP.'
    ]
  },
  {
    id: 'regen',
    type: 'passive',
    name: 'Sangue di Troll',
    maxLevel: 5,
    accent: '#10b981',
    desc: [
      '+1.5 HP/s rigenerazione e +15 HP Massimi.',
      '+3.0 HP/s rigenerazione e +30 HP Massimi.',
      '+4.5 HP/s rigenerazione e +45 HP Massimi.',
      '+6.0 HP/s rigenerazione e +60 HP Massimi.',
      '+8.0 HP/s rigenerazione e +80 HP Massimi.'
    ]
  }
];

export const WEAPON_EVOLUTIONS = {
  axe: {
    id: 'evo_axe',
    weaponId: 'axe',
    passiveId: 'might',
    name: 'Ascia Cremisi del Ragnarok',
    accent: '#fbbf24',
    description: 'EVOLUZIONE · Asce infuocate che esplodono ad ogni impatto.'
  },
  aura: {
    id: 'evo_aura',
    weaponId: 'aura',
    passiveId: 'regen',
    name: 'Manto di Surtr',
    accent: '#f97316',
    description: 'EVOLUZIONE · Doppio cerchio di fuoco che cura +2 HP ad impulso.'
  },
  lightning: {
    id: 'evo_lightning',
    weaponId: 'lightning',
    passiveId: 'area',
    name: 'Tempesta di Mjolnir',
    accent: '#38bdf8',
    description: 'EVOLUZIONE · Fulmini a catena che rimbalzano sui nemici vicini.'
  },
  blades: {
    id: 'evo_blades',
    weaponId: 'blades',
    passiveId: 'swift',
    name: 'Corona degli Einherjar',
    accent: '#fde047',
    description: 'EVOLUZIONE · 6 lame d’oro runico ad altissima rotazione.'
  },
  dagger: {
    id: 'evo_dagger',
    weaponId: 'dagger',
    passiveId: 'magnet',
    name: 'Pioggia di Niflheim',
    accent: '#f0abfc',
    description: 'EVOLUZIONE · Ventaglio da 8 pugnali perforanti ad altissimo critico.'
  },
  orb: {
    id: 'evo_orb',
    weaponId: 'orb',
    passiveId: 'area',
    name: 'Stella del Fimbulvetr',
    accent: '#7dd3fc',
    description: 'EVOLUZIONE · Esplosioni colossali con 3 onde secondarie di brina.'
  },
  hammer: {
    id: 'evo_hammer',
    weaponId: 'hammer',
    passiveId: 'might',
    name: 'Maglio Spezzamondi',
    accent: '#fb923c',
    description: 'EVOLUZIONE · Onda sismica gigante con fessure critiche dorate.'
  },
  spear: {
    id: 'evo_spear',
    weaponId: 'spear',
    passiveId: 'swift',
    name: 'Gungnir Eterna',
    accent: '#fde047',
    description: 'EVOLUZIONE · 4 lance celesti inarrestabili che non mancano il bersaglio.'
  },
  scythe: {
    id: 'evo_scythe',
    weaponId: 'scythe',
    passiveId: 'might',
    name: 'Eclissi Cremisi',
    accent: '#e879f9',
    description: 'EVOLUZIONE · 4 falci giganti a ritorno veloce con danno critico aumentato.'
  },
  fangs: {
    id: 'evo_fangs',
    weaponId: 'fangs',
    passiveId: 'area',
    name: 'Tempesta di Hel',
    accent: '#c084fc',
    description: 'EVOLUZIONE · 4 spine oscure con 6 rimbalzi letali.'
  },
  grimoire: {
    id: 'evo_grimoire',
    weaponId: 'grimoire',
    passiveId: 'regen',
    name: 'Cataclisma di Yggdrasil',
    accent: '#38bdf8',
    description: 'EVOLUZIONE · 5 pilastri astrali devastanti con onda d’urto estesa.'
  },
  flail: {
    id: 'evo_flail',
    weaponId: 'flail',
    passiveId: 'area',
    name: 'Catena di Fenrir',
    accent: '#fb7185',
    description: 'EVOLUZIONE · Doppia sfera infuocata a rotazione continua attorno all’eroe.'
  }
};

const PASSIVE_NAME_BY_ID = Object.fromEntries(
  UPGRADE_CATALOG.filter((u) => u.type === 'passive').map((p) => [p.id, p.name])
);

export function getAvailableEvolutions(levels = {}, evolvedWeapons = {}) {
  const out = [];
  for (const weaponId of Object.keys(WEAPON_EVOLUTIONS)) {
    const evo = WEAPON_EVOLUTIONS[weaponId];
    if ((levels[weaponId] || 0) >= 5 && !evolvedWeapons[weaponId] && (levels[evo.passiveId] || 0) >= 1) {
      out.push(evo);
    }
  }
  return out;
}

/**
 * Restituisce lo stato evolutivo di un'arma (o passiva gemella) per i badge HUD e Level-Up.
 */
export function getWeaponEvolutionStatus(weaponId, levels = {}, evolvedWeapons = {}) {
  const evo = WEAPON_EVOLUTIONS[weaponId];
  if (!evo) return null;

  const wLv = levels[weaponId] || 0;
  const pLv = levels[evo.passiveId] || 0;
  const passiveName = PASSIVE_NAME_BY_ID[evo.passiveId] || evo.passiveId;

  if (evolvedWeapons[weaponId]) {
    return {
      status: 'evolved',
      weaponId,
      passiveId: evo.passiveId,
      passiveName,
      evolutionName: evo.name,
      badgeLabel: 'EVOLUTA',
      shortHint: `★ ${evo.name}`,
      accent: evo.accent
    };
  }

  if (wLv >= 5 && pLv >= 1) {
    return {
      status: 'chest_ready',
      weaponId,
      passiveId: evo.passiveId,
      passiveName,
      evolutionName: evo.name,
      badgeLabel: 'PRONTA',
      shortHint: `★ Pronta · ${evo.name}`,
      accent: '#fbbf24'
    };
  }

  if (wLv >= 5 && pLv < 1) {
    return {
      status: 'needs_passive',
      weaponId,
      passiveId: evo.passiveId,
      passiveName,
      evolutionName: evo.name,
      badgeLabel: `+${passiveName.split(' ')[0]}`,
      shortHint: `Richiede: ${passiveName}`,
      accent: '#f87171'
    };
  }

  if (pLv >= 1) {
    return {
      status: 'needs_weapon_lv',
      weaponId,
      passiveId: evo.passiveId,
      passiveName,
      evolutionName: evo.name,
      badgeLabel: `${wLv}/5`,
      shortHint: `Sinergia OK (${passiveName}) · Lv ${wLv}/5`,
      accent: '#38bdf8'
    };
  }

  return {
    status: 'locked',
    weaponId,
    passiveId: evo.passiveId,
    passiveName,
    evolutionName: evo.name,
    badgeLabel: `${wLv}/5`,
    shortHint: `Evo Lv5 + ${passiveName}`,
    accent: '#94a3b8'
  };
}
