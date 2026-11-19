/**
 * GameScene: Core loop 2.5D Survivors-like / Bullet Heaven per Phaser 3.
 * Ottimizzato per dispositivi mobile Portrait a 60 FPS tramite Object Pooling,
 * Y-Sorting dinamico con layer di profondità sicuri anche a Y negative,
 * ambiente nordico dettagliato ed effetti d'attacco avanzati.
 */

import { audio } from './audio.js';
import { generateHdTextures } from './hdSprites.js';

export const GAME_CONFIG = {
  // Durata della run prima dell'arrivo del Boss Finale (240s = 4 minuti)
  RUN_DURATION_SEC: 240,
  WAVE_INTERVAL_SEC: 30,
  ENCIRCLEMENT_INTERVAL_SEC: 45,
  MAX_ENEMIES: 210,
  MAX_PROJECTILES: 110,
  MAX_GEMS: 240,
  MAX_DAMAGE_TEXTS: 65,
  MAX_PARTICLES: 160,
  PROP_COUNT: 34,
  DECAL_COUNT: 26,
  PROP_RECYCLE_RADIUS: 700
};

// Layer di profondità espliciti: garantiscono che terreno e ombre restino sempre sotto
// qualsiasi entità anche quando il giocatore si sposta a Nord (coordinate Y negative).
export const DEPTH_LAYERS = {
  GROUND: -100000000,
  DECALS: -95000000,
  SHADOWS: -90000000,
  TELEGRAPHS: -80000000,
  AURA: -70000000,
  GEMS: -60000000,
  ENTITY_BASE: 0,
  VFX: 80000000,
  WEATHER: 85000000,
  DAMAGE_TEXT: 90000000,
  HERO_HP_BAR: 95000000,
  JOYSTICK: 100000000
};

export function computeEntityDepth(y) {
  return DEPTH_LAYERS.ENTITY_BASE + y;
}

export function computeSquaredDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

// Catalogo Armi e Passive disponibili al Level-Up
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

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.bridge = null;
    this.storyManager = null;
  }

  configureBridge(bridge, storyManager) {
    this.bridge = bridge;
    this.storyManager = storyManager;
  }

  preload() {
    this.load.on('loaderror', () => {});
  }

  create() {
    // 1. Texture HD moderne (Canvas 2D in browser) + fallback procedurale in ambienti headless
    this.hdMode = typeof document !== 'undefined' && typeof this.textures?.addCanvas === 'function';
    if (this.hdMode) {
      generateHdTextures(this.textures);
    }
    this._ensureProceduralTextures();
    this._loadCustomSpritesFromManifest();

    // 2. Stato iniziale
    this.gameState = 'IDLE'; // IDLE | PLAYING | PAUSED | LEVEL_UP | CUTSCENE | ENDED
    this.elapsedSec = 0;
    this.kills = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossSprite = null;
    this.gemCombo = 0;
    this.gemComboTimer = 0;
    this.lastWaveIndex = -1;
    this.nextEncirclementSec = GAME_CONFIG.ENCIRCLEMENT_INTERVAL_SEC;

    // 3. Terreno infinito dettagliato (depth molto negativa per supportare Y negative)
    const camW = this.scale.width;
    const camH = this.scale.height;
    this.ground = this.add.tileSprite(camW / 2, camH / 2, camW + 64, camH + 64, 'ground_tile');
    this.ground.setScrollFactor(0).setDepth(DEPTH_LAYERS.GROUND);

    // 4. Layer grafici dedicati
    this.auraGfx = this.add.graphics().setDepth(DEPTH_LAYERS.AURA);
    this.telegraphGfx = this.add.graphics().setDepth(DEPTH_LAYERS.TELEGRAPHS);
    this.vfxGfx = this.add.graphics().setDepth(DEPTH_LAYERS.VFX);
    this.weatherGfx = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_LAYERS.WEATHER);
    this.joystickGfx = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_LAYERS.JOYSTICK);

    // 5. Eroe +10% su schermo (calibrato per sprite vettoriali 4x 144x168) con ombra e hitbox ai piedi
    this.heroBaseScale = this.hdMode ? 0.347 : 1.30;
    this.heroShadow = this.add
      .image(0, 0, 'shadow_ellipse')
      .setDepth(DEPTH_LAYERS.SHADOWS)
      .setAlpha(0.52)
      .setScale(this.hdMode ? 0.36 : 1.26);

    this.hero = this.physics.add.sprite(0, 0, 'hero_warrior');
    this.hero.setScale(this.heroBaseScale);
    const heroHbW = this.hdMode ? 50 : 18;
    const heroHbH = this.hdMode ? 38 : 13;
    this.hero.body.setSize(heroHbW, heroHbH);
    this.hero.body.setOffset(
      Math.max(0, (this.hero.width - heroHbW) / 2),
      Math.max(0, this.hero.height - heroHbH - (this.hdMode ? 5 : 1))
    );

    // Barra HP sotto i piedi dell'eroe
    this.heroHpBg = this.add
      .rectangle(0, 0, 40, 6, 0x090d16, 0.9)
      .setDepth(DEPTH_LAYERS.HERO_HP_BAR);
    this.heroHpFill = this.add
      .rectangle(0, 0, 38, 4, 0x22c55e, 1)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH_LAYERS.HERO_HP_BAR + 1);

    this.cameras.main.startFollow(this.hero, true, 0.16, 0.16);
    this.cameras.main.setRoundPixels(false);

    // 6. Decali terreno e ostacoli scenici riciclati proceduralmente
    this.groundDecals = [];
    this._initGroundDecals();

    this.propsGroup = this.physics.add.staticGroup();
    this.propItems = [];
    this._initScenicProps();

    // 7. Object Pools per 60 FPS stabili
    this.enemyPool = this.physics.add.group({
      maxSize: GAME_CONFIG.MAX_ENEMIES,
      runChildUpdate: false
    });
    this.activeEnemies = [];

    this.projPool = this.physics.add.group({
      maxSize: GAME_CONFIG.MAX_PROJECTILES,
      runChildUpdate: false
    });
    this.activeProjectiles = [];

    this.gemPool = this.physics.add.group({
      maxSize: GAME_CONFIG.MAX_GEMS,
      runChildUpdate: false
    });
    this.activeGems = [];

    this.bladeSprites = [];
    this.bladeTrails = Array.from({ length: 48 }, () => ({
      active: false,
      x: 0,
      y: 0,
      life: 0,
      dur: 0.18
    }));
    this._bladeTrailCursor = 0;
    this._targetScratch = [];
    this.activeLightnings = [];
    this.activeAuraPulses = [];
    this.activeExplosions = [];
    this.activeSparks = [];
    this._initSparkPool();
    this._initWeatherMotes();

    this.dmgTextPool = [];
    this._initDamageTextPool();
    this.activeTelegraphs = [];

    // 8. Collisioni fisiche Arcade (proiettili/nemici) + scivolamento radiale fluido su ostacoli
    this.heroFeetRadius = 11;
    this.heroFeetOffsetY = 17;

    this.physics.add.overlap(this.projPool, this.enemyPool, (proj, enemy) => {
      if (!proj.active || !enemy.active) return;
      this._onProjectileHitEnemy(proj, enemy);
    });

    this.physics.add.overlap(this.hero, this.enemyPool, (_hero, enemy) => {
      if (!enemy.active || this.gameState !== 'PLAYING') return;
      this._onEnemyTouchHero(enemy);
    });

    // 9. Input: Joystick virtuale dinamico + Tastiera WASD/Frecce
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    this._setupVirtualJoystick();

    this.physics.pause();
    this.bridge?.onSceneReady?.();
  }

  async startNewRun(runConfig = {}) {
    this._resetRunState(runConfig);
    this.gameState = 'CUTSCENE';
    this.physics.pause();

    if (this.storyManager) {
      await this.storyManager.play('onGameStart', this.activeHeroId);
    }

    this.gameState = 'PLAYING';
    this.physics.resume();
    this._syncHud();
  }

  _resetRunState(runConfig = {}) {
    for (const e of this.activeEnemies) {
      if (e.shadow) e.shadow.setVisible(false);
      e.disableBody(true, true);
    }
    this.activeEnemies.length = 0;

    for (const p of this.activeProjectiles) {
      p.disableBody(true, true);
    }
    this.activeProjectiles.length = 0;

    for (const g of this.activeGems) {
      g.disableBody(true, true);
    }
    this.activeGems.length = 0;

    for (const b of this.bladeSprites) {
      b.destroy();
    }
    this.bladeSprites.length = 0;
    for (const tr of this.bladeTrails) {
      tr.active = false;
    }

    for (const t of this.dmgTextPool) {
      t.setVisible(false);
      t.inUse = false;
    }
    for (const s of this.sparkPool) {
      s.active = false;
    }

    this.activeTelegraphs.length = 0;
    this.activeLightnings.length = 0;
    this.activeAuraPulses.length = 0;
    this.activeExplosions.length = 0;
    this.telegraphGfx.clear();
    this.vfxGfx.clear();
    this.auraGfx.clear();

    this.activeHeroId = runConfig.heroId || 'warrior';
    this.activeWeaponId = runConfig.startingWeaponId || 'axe';
    const textureMap = {
      warrior: 'hero_warrior',
      assassin: 'hero_assassin',
      mage: 'hero_mage'
    };
    const chosenTexture = runConfig.textureKey || textureMap[this.activeHeroId] || 'hero_warrior';
    if (this.textures.exists(chosenTexture)) {
      this.hero.setTexture(chosenTexture);
    }

    // Reset Eroe al centro con visibilità e depth garantiti
    this.hero.setPosition(0, 0);
    this.hero.setVelocity(0, 0);
    this.hero.clearTint();
    this.hero.setAlpha(1);
    this.hero.setVisible(true);
    this.hero.setScale(this.heroBaseScale);
    this.hero.setFlipX(false);
    this.hero.setDepth(computeEntityDepth(0));
    this.heroShadow.setPosition(0, 21).setVisible(true).setDepth(DEPTH_LAYERS.SHADOWS);

    this.elapsedSec = 0;
    this.kills = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossSprite = null;
    this.lastWaveIndex = -1;
    this.nextEncirclementSec = GAME_CONFIG.ENCIRCLEMENT_INTERVAL_SEC;
    this.gemCombo = 0;
    this.gemComboTimer = 0;

    const eff = runConfig.effectiveStats || {};
    this.baseRunStats = {
      maxHp: eff.maxHp || 110,
      speed: eff.speed || 138,
      mightMult: eff.mightMult || 1.0,
      areaMult: eff.areaMult || 1.0,
      magnetMult: eff.magnetMult || 1.0,
      critChance: eff.critChance || 0.18
    };

    this.stats = {
      level: 1,
      xp: 0,
      xpNeeded: 10,
      hp: this.baseRunStats.maxHp,
      maxHp: this.baseRunStats.maxHp,
      baseSpeed: this.baseRunStats.speed,
      mightMult: this.baseRunStats.mightMult,
      speedMult: 1.0,
      areaMult: this.baseRunStats.areaMult,
      magnetRadius: Math.round(84 * this.baseRunStats.magnetMult),
      critChance: this.baseRunStats.critChance,
      regenPerSec: 0,
      invulnTimer: 0
    };

    this.levels = {
      axe: 0,
      aura: 0,
      lightning: 0,
      blades: 0,
      dagger: 0,
      orb: 0,
      might: 0,
      swift: 0,
      area: 0,
      magnet: 0,
      regen: 0
    };
    if (this.activeWeaponId in this.levels) {
      this.levels[this.activeWeaponId] = 1;
    } else {
      this.levels.axe = 1;
    }

    this.timers = {
      spawn: 0.25,
      axe: 0.3,
      aura: 0,
      lightning: 0.8,
      dagger: 0.25,
      orb: 0.35,
      bladeAngle: 0,
      bossAttack: 2.8
    };

    if (this.levels.blades > 0) {
      this._rebuildValkyrieBlades();
    }

    this._repositionAllDecals();
    this._repositionAllProps();
    this.bridge?.onBossHudUpdate?.(null);
    this._syncHud();
  }

  pauseGame(fromUi = false) {
    if (this.gameState !== 'PLAYING') return;
    this.gameState = 'PAUSED';
    this.physics.pause();
    this._resetJoystick();
    if (!fromUi) {
      this.bridge?.onPauseChanged?.(true, this._getBuildSnapshot());
    }
  }

  resumeGame() {
    if (this.gameState !== 'PAUSED' && this.gameState !== 'LEVEL_UP') return;
    this.gameState = 'PLAYING';
    this.physics.resume();
    this._syncHud();
  }

  applyUpgrade(upgradeId) {
    if (!(upgradeId in this.levels)) return;
    this.levels[upgradeId] = Math.min(5, this.levels[upgradeId] + 1);

    this.stats.mightMult = this.baseRunStats.mightMult + this.levels.might * 0.18;
    this.stats.speedMult = 1 + this.levels.swift * 0.12;
    this.stats.areaMult = this.baseRunStats.areaMult + this.levels.area * 0.16;
    this.stats.magnetRadius = Math.round(84 * this.baseRunStats.magnetMult * (1 + this.levels.magnet * 0.35));

    const prevMax = this.stats.maxHp;
    const regenBonuses = [0, 15, 30, 45, 60, 80];
    this.stats.maxHp = this.baseRunStats.maxHp + (regenBonuses[this.levels.regen] || 0);
    if (this.stats.maxHp > prevMax) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + (this.stats.maxHp - prevMax));
    }
    const regenRates = [0, 1.5, 3.0, 4.5, 6.0, 8.0];
    this.stats.regenPerSec = regenRates[this.levels.regen] || 0;

    if (upgradeId === 'blades') {
      this._rebuildValkyrieBlades();
    }

    this.resumeGame();
  }

  _getBuildSnapshot() {
    return UPGRADE_CATALOG
      .filter((u) => this.levels[u.id] > 0)
      .map((u) => ({ ...u, level: this.levels[u.id] }));
  }

  update(_time, deltaMs) {
    if (this.gameState !== 'PLAYING') return;

    const dt = Math.min(deltaMs / 1000, 0.05);
    this.elapsedSec += dt;

    // 1. Movimento Eroe
    this._updateHeroMovement(dt);

    // 2. Rigenerazione e Invulnerabilità
    if (this.stats.regenPerSec > 0 && this.stats.hp < this.stats.maxHp) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + this.stats.regenPerSec * dt);
    }
    if (this.stats.invulnTimer > 0) {
      this.stats.invulnTimer -= dt;
      this.hero.setAlpha(Math.sin(this.elapsedSec * 40) > 0 ? 0.55 : 1);
    } else if (this.hero.alpha !== 1) {
      this.hero.setAlpha(1);
    }

    // 3. Mappa infinita e riciclo decali + ostacoli
    const cam = this.cameras.main;
    this.ground.tilePositionX = cam.scrollX;
    this.ground.tilePositionY = cam.scrollY;
    this._recycleDecalsAroundHero();
    this._recyclePropsAroundHero();

    // 4. Ondate progressive ed eventi accerchiamento
    const waveIdx = Math.floor(this.elapsedSec / GAME_CONFIG.WAVE_INTERVAL_SEC);
    if (waveIdx !== this.lastWaveIndex) {
      this.lastWaveIndex = waveIdx;
    }

    if (!this.bossSpawned && this.elapsedSec >= this.nextEncirclementSec) {
      this.nextEncirclementSec += GAME_CONFIG.ENCIRCLEMENT_INTERVAL_SEC;
      this._spawnEncirclementRing(waveIdx);
    }

    if (!this.bossSpawned && this.elapsedSec >= GAME_CONFIG.RUN_DURATION_SEC) {
      this._triggerBossSequence();
      return;
    }

    this._updateSpawning(dt, waveIdx);

    // 5. Armi, movimento fluido attorno agli ostacoli ed effetti grafici a 60 FPS
    this._updateWeapons(dt);
    this._updateEnemiesAndBoss(dt);
    this._resolvePropCollisions();
    this._updateProjectiles(dt);
    this._updateGems(dt);
    this._updateTelegraphs(dt);
    this._updateVfx(dt);
    this._updateDamageTexts(dt);
    this._updateWeather(dt);

    // 6. Y-Sorting Eroe & Barra HP sotto i piedi (+10% offset proporzionale)
    this.hero.setDepth(computeEntityDepth(this.hero.y));
    this.heroShadow.setPosition(this.hero.x, this.hero.y + 21);
    this.heroHpBg.setPosition(this.hero.x, this.hero.y + 31);
    const hpRatio = Phaser.Math.Clamp(this.stats.hp / this.stats.maxHp, 0, 1);
    this.heroHpFill.width = Math.max(0, 38 * hpRatio);
    this.heroHpFill.setPosition(this.hero.x - 19, this.hero.y + 31);
    this.heroHpFill.setFillStyle(hpRatio > 0.35 ? 0x22c55e : 0xef4444);

    // 7. HUD sync throttled
    this._hudSyncAcc = (this._hudSyncAcc || 0) + dt;
    if (this._hudSyncAcc >= 0.1) {
      this._hudSyncAcc = 0;
      this._syncHud();
    }
  }

  _updateHeroMovement(_dt) {
    // Sicurezza touch mobile: se il browser ha perso pointerup (gesture/bordo), sblocca subito il joystick
    if (this.joyActive && this.input?.manager?.pointers) {
      const activePtr = this.input.manager.pointers.find((p) => p && p.id === this.joyPointerId);
      if (activePtr && !activePtr.isDown) {
        this._resetJoystick();
      }
    }

    let vx = this.joyVec.x;
    let vy = this.joyVec.y;

    let kx = 0;
    let ky = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) kx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) kx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) ky -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) ky += 1;

    if (kx !== 0 || ky !== 0) {
      const len = Math.hypot(kx, ky);
      vx = kx / len;
      vy = ky / len;
    }

    const speed = this.stats.baseSpeed * this.stats.speedMult;
    this.hero.setVelocity(vx * speed, vy * speed);

    if (Math.abs(vx) > 0.08) {
      this.hero.setFlipX(vx < 0);
    }

    const baseS = this.heroBaseScale || 1.30;
    if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
      const bob = Math.sin(this.elapsedSec * 14);
      this.hero.setScale(baseS * (1 - bob * 0.05), baseS * (1 + bob * 0.06));
      this.hero.setAngle(bob * 3.5);
    } else {
      const idle = Math.sin(this.elapsedSec * 3.5);
      this.hero.setScale(baseS, baseS * (1 + idle * 0.02));
      this.hero.setAngle(0);
    }

    this.joystickGfx.clear();
    if (this.joyActive) {
      this.joystickGfx.lineStyle(2, 0xf59e0b, 0.6);
      this.joystickGfx.fillStyle(0x0f172a, 0.4);
      this.joystickGfx.fillCircle(this.joyOrigin.x, this.joyOrigin.y, 48);
      this.joystickGfx.strokeCircle(this.joyOrigin.x, this.joyOrigin.y, 48);

      this.joystickGfx.fillStyle(0xf59e0b, 0.85);
      this.joystickGfx.fillCircle(this.joyKnob.x, this.joyKnob.y, 20);
    }
  }

  _setupVirtualJoystick() {
    this.joyActive = false;
    this.joyPointerId = null;
    this.joyOrigin = { x: 0, y: 0 };
    this.joyKnob = { x: 0, y: 0 };
    this.joyVec = { x: 0, y: 0 };
    const maxRadius = 48;

    this.input.on('pointerdown', (pointer) => {
      if (this.gameState !== 'PLAYING') return;
      audio.unlock();

      if (this.joyActive && this.input?.manager?.pointers) {
        const oldPtr = this.input.manager.pointers.find((p) => p && p.id === this.joyPointerId);
        if (oldPtr && oldPtr.isDown) return;
        this._resetJoystick();
      } else if (this.joyActive) {
        return;
      }

      this.joyActive = true;
      this.joyPointerId = pointer.id;
      this.joyOrigin.x = pointer.x;
      this.joyOrigin.y = pointer.y;
      this.joyKnob.x = pointer.x;
      this.joyKnob.y = pointer.y;
      this.joyVec.x = 0;
      this.joyVec.y = 0;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.joyActive || pointer.id !== this.joyPointerId) return;
      const dx = pointer.x - this.joyOrigin.x;
      const dy = pointer.y - this.joyOrigin.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const clamped = Math.min(dist, maxRadius);
        const nx = dx / dist;
        const ny = dy / dist;
        this.joyKnob.x = this.joyOrigin.x + nx * clamped;
        this.joyKnob.y = this.joyOrigin.y + ny * clamped;
        const power = clamped / maxRadius;
        this.joyVec.x = nx * power;
        this.joyVec.y = ny * power;
      } else {
        this.joyKnob.x = this.joyOrigin.x;
        this.joyKnob.y = this.joyOrigin.y;
        this.joyVec.x = 0;
        this.joyVec.y = 0;
      }
    });

    const endTouch = (pointer) => {
      if (this.joyActive && (!pointer || pointer.id === this.joyPointerId)) {
        this._resetJoystick();
      }
    };
    this.input.on('pointerup', endTouch);
    this.input.on('pointerupoutside', endTouch);
    this.input.on('pointercancel', endTouch);
    this.input.on('gameout', () => this._resetJoystick());
  }

  _resetJoystick() {
    this.joyActive = false;
    this.joyPointerId = null;
    this.joyVec.x = 0;
    this.joyVec.y = 0;
    this.joystickGfx?.clear();
  }

  /**
   * Ondate bilanciate: ritmo leggibile e progressivo senza saturare i primi minuti
   */
  _updateSpawning(dt, waveIdx) {
    this.timers.spawn -= dt;
    if (this.timers.spawn > 0) return;

    const interval = Math.max(0.24, 0.92 - waveIdx * 0.065);
    this.timers.spawn = interval;

    const batchCount = this.bossSpawned
      ? 1
      : Math.min(4, 1 + Math.floor(waveIdx * 0.5));

    for (let i = 0; i < batchCount; i++) {
      if (this.activeEnemies.length >= GAME_CONFIG.MAX_ENEMIES) break;

      let archetype = 'swarm';
      const roll = Math.random();
      if (waveIdx >= 1 && roll < 0.22) archetype = 'fast';
      if (waveIdx >= 2 && roll > 0.8) archetype = 'tank';
      if (waveIdx >= 5 && roll > 0.68) archetype = 'tank';

      this._spawnEnemy(archetype, waveIdx);
    }
  }

  _spawnEncirclementRing(waveIdx) {
    const ringCount = Math.min(14, 8 + waveIdx);
    const archetype = waveIdx % 2 === 1 ? 'fast' : 'swarm';
    for (let i = 0; i < ringCount; i++) {
      if (this.activeEnemies.length >= GAME_CONFIG.MAX_ENEMIES) break;
      const angle = (i / ringCount) * Math.PI * 2;
      this._spawnEnemy(archetype, waveIdx, angle, 370);
    }
  }

  _spawnEnemy(archetype, waveIdx, forcedAngle = null, forcedDist = null) {
    const angle = forcedAngle !== null ? forcedAngle : Math.random() * Math.PI * 2;
    const spawnDist = forcedDist !== null ? forcedDist : 340 + Math.random() * 85;
    const sx = this.hero.x + Math.cos(angle) * spawnDist;
    const sy = this.hero.y + Math.sin(angle) * spawnDist;

    const texKey =
      archetype === 'tank' ? 'enemy_tank' : archetype === 'fast' ? 'enemy_fast' : 'enemy_swarm';

    const enemy = this.enemyPool.get(sx, sy, texKey);
    if (!enemy) return;

    enemy.setTexture(texKey);
    enemy.enableBody(true, sx, sy, true, true);
    enemy.clearTint();
    enemy.setAlpha(1);
    enemy.setVisible(true);

    const hpScale = 1 + waveIdx * 0.25;
    const speedScale = 1 + Math.min(0.45, waveIdx * 0.04);

    if (archetype === 'tank') {
      enemy.baseScale = this.hdMode ? 0.363 : 1.34;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(90 * hpScale);
      enemy.speed = 48 * speedScale;
      enemy.damage = 16;
      enemy.xpValue = 5;
      const hbW = this.hdMode ? 70 : 24;
      const hbH = this.hdMode ? 42 : 15;
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(Math.max(0, (enemy.width - hbW) / 2), Math.max(0, enemy.height - hbH - 3));
    } else if (archetype === 'fast') {
      enemy.baseScale = this.hdMode ? 0.330 : 1.19;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(26 * hpScale);
      enemy.speed = 96 * speedScale;
      enemy.damage = 10;
      enemy.xpValue = 3;
      const hbW = this.hdMode ? 58 : 20;
      const hbH = this.hdMode ? 32 : 11;
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(Math.max(0, (enemy.width - hbW) / 2), Math.max(0, enemy.height - hbH - 3));
    } else {
      enemy.baseScale = this.hdMode ? 0.322 : 1.19;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(32 * hpScale);
      enemy.speed = 68 * speedScale;
      enemy.damage = 9;
      enemy.xpValue = 2;
      const hbW = this.hdMode ? 54 : 18;
      const hbH = this.hdMode ? 32 : 11;
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(Math.max(0, (enemy.width - hbW) / 2), Math.max(0, enemy.height - hbH - 3));
    }

    enemy.hp = enemy.maxHp;
    enemy.archetype = archetype;
    enemy.isBoss = false;
    enemy.knockbackTimer = 0;
    enemy.flashTimer = 0;
    enemy.bladeCooldown = 0;
    enemy.walkPhase = Math.random() * 6.28;
    enemy.setDepth(computeEntityDepth(sy));

    const shOffset = archetype === 'tank' ? 23 : 15;
    if (!enemy.shadow) {
      enemy.shadow = this.add.image(sx, sy + shOffset, 'shadow_ellipse').setDepth(DEPTH_LAYERS.SHADOWS).setAlpha(0.42);
    } else {
      enemy.shadow.setPosition(sx, sy + shOffset).setVisible(true).setDepth(DEPTH_LAYERS.SHADOWS);
    }
    const shScale = this.hdMode
      ? archetype === 'tank' ? 0.38 : 0.28
      : archetype === 'tank' ? 1.54 : 1.08;
    enemy.shadow.setScale(shScale);

    if (!this.activeEnemies.includes(enemy)) {
      this.activeEnemies.push(enemy);
    }
  }

  async _triggerBossSequence() {
    this.bossSpawned = true;
    this.gameState = 'CUTSCENE';
    this.physics.pause();
    this._resetJoystick();

    audio.playBossAlarm();
    this.bridge?.onBossWarning?.(true);

    await new Promise((r) => setTimeout(r, 1200));
    this.bridge?.onBossWarning?.(false);

    if (this.storyManager) {
      await this.storyManager.play('onBossSpawn', this.activeHeroId);
    }

    this._spawnBoss();
    this.gameState = 'PLAYING';
    this.physics.resume();
    this.cameras.main.shake(300, 0.008);
  }

  _spawnBoss() {
    const bx = this.hero.x;
    const by = this.hero.y - 250;

    if (this.activeEnemies.length >= GAME_CONFIG.MAX_ENEMIES) {
      const drop = this.activeEnemies.pop();
      if (drop) this._recycleEnemy(drop);
    }

    const boss = this.enemyPool.get(bx, by, 'boss');
    if (!boss) return;

    boss.setTexture('boss');
    boss.enableBody(true, bx, by, true, true);
    boss.baseScale = this.hdMode ? 0.413 : 1.60;
    boss.setScale(boss.baseScale);
    boss.clearTint();
    boss.setAlpha(1);
    boss.setVisible(true);
    boss.isBoss = true;
    boss.archetype = 'boss';
    boss.maxHp = 4500;
    boss.hp = boss.maxHp;
    boss.speed = 64;
    boss.damage = 28;
    boss.xpValue = 60;
    boss.knockbackTimer = 0;
    boss.flashTimer = 0;
    boss.bladeCooldown = 0;
    boss.walkPhase = 0;
    boss.setDepth(computeEntityDepth(by));

    const bHbW = this.hdMode ? 120 : 48;
    const bHbH = this.hdMode ? 64 : 26;
    boss.body.setSize(bHbW, bHbH);
    boss.body.setOffset(Math.max(0, (boss.width - bHbW) / 2), Math.max(0, boss.height - bHbH - 5));

    if (!boss.shadow) {
      boss.shadow = this.add.image(bx, by + 37, 'shadow_ellipse').setDepth(DEPTH_LAYERS.SHADOWS).setAlpha(0.54);
    } else {
      boss.shadow.setPosition(bx, by + 37).setVisible(true).setDepth(DEPTH_LAYERS.SHADOWS);
    }
    if (this.hdMode) {
      boss.shadow.setScale(0.73, 0.48);
    } else {
      boss.shadow.setScale(2.97, 1.87);
    }

    this.bossSprite = boss;
    this.activeEnemies.push(boss);
    this.bridge?.onBossHudUpdate?.({ name: 'Hrimthurs, Signore del Gelo', hp: boss.hp, maxHp: boss.maxHp });
  }

  /**
   * Armi Automatiche + Effetti Runici Premium
   */
  _updateWeapons(dt) {
    // ARMA 1: Ascia Runica (proiettili con scia infuocata)
    const axeLv = this.levels.axe;
    if (axeLv > 0) {
      this.timers.axe -= dt;
      if (this.timers.axe <= 0) {
        const cooldowns = [0, 1.0, 0.9, 0.78, 0.68, 0.55];
        this.timers.axe = cooldowns[axeLv];
        this._fireRunicAxes(axeLv);
      }
    }

    // ARMA 5: Pugnali d'Ombra (Assassina - raffiche rapidissime ad alto critico)
    const daggerLv = this.levels.dagger;
    if (daggerLv > 0) {
      this.timers.dagger -= dt;
      if (this.timers.dagger <= 0) {
        const cds = [0, 0.56, 0.48, 0.42, 0.36, 0.3];
        this.timers.dagger = cds[daggerLv];
        this._fireShadowDaggers(daggerLv);
      }
    }

    // ARMA 6: Globo Arcano (Maga - sfere di gelo esplosive ad area)
    const orbLv = this.levels.orb;
    if (orbLv > 0) {
      this.timers.orb -= dt;
      if (this.timers.orb <= 0) {
        const cds = [0, 1.35, 1.2, 1.05, 0.9, 0.78];
        this.timers.orb = cds[orbLv];
        this._fireArcaneOrbs(orbLv);
      }
    }

    // ARMA 2: Aura del Crepuscolo (cerchio runico rotante + onda espansiva)
    const auraLv = this.levels.aura;
    if (auraLv > 0) {
      const baseRadius = (62 + auraLv * 13) * this.stats.areaMult;
      const pulse = 0.97 + Math.sin(this.elapsedSec * 5.2) * 0.03;
      const drawRadius = baseRadius * pulse;
      const cx = this.hero.x;
      const cy = this.hero.y + 10;

      this.auraGfx.clear();
      // Bagliore violaceo morbido
      this.auraGfx.fillStyle(0x7e22ce, 0.14);
      this.auraGfx.fillCircle(cx, cy, drawRadius);
      this.auraGfx.fillStyle(0xc084fc, 0.08);
      this.auraGfx.fillCircle(cx, cy, drawRadius * 0.66);

      // Anello esterno con tacche runiche rotanti
      this.auraGfx.lineStyle(2, 0xc084fc, 0.65);
      this.auraGfx.strokeCircle(cx, cy, drawRadius);
      this.auraGfx.lineStyle(1.5, 0xf0abfc, 0.38);
      this.auraGfx.strokeCircle(cx, cy, drawRadius * 0.72);

      const runeCount = 8;
      const rot = this.elapsedSec * 1.4;
      this.auraGfx.fillStyle(0xe879f9, 0.85);
      for (let r = 0; r < runeCount; r++) {
        const ang = rot + (r * Math.PI * 2) / runeCount;
        const rx = cx + Math.cos(ang) * (drawRadius - 3);
        const ry = cy + Math.sin(ang) * (drawRadius - 3);
        this.auraGfx.fillCircle(rx, ry, 2.4);
      }

      this.timers.aura -= dt;
      if (this.timers.aura <= 0) {
        const tickRates = [0, 0.5, 0.44, 0.38, 0.33, 0.26];
        this.timers.aura = tickRates[auraLv];
        const auraDmg = Math.round((9 + auraLv * 6) * this.stats.mightMult);
        const rSq = baseRadius * baseRadius;
        let hitAny = false;

        this.activeAuraPulses.push({ x: cx, y: cy, maxR: drawRadius, life: 0, dur: 0.28 });

        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
          const e = this.activeEnemies[i];
          if (!e.active) continue;
          const dx = e.x - cx;
          const dy = e.y - cy;
          if (dx * dx + dy * dy <= rSq) {
            this._damageEnemy(e, auraDmg, dx, dy, e.isBoss ? 15 : 95, false, 0xd8b4fe);
            hitAny = true;
          }
        }
        if (hitAny) audio.playAuraPulse();
      }
    } else {
      this.auraGfx.clear();
    }

    // ARMA 3: Saetta di Thor (fulmini persistenti e frastagliati)
    const lightLv = this.levels.lightning;
    if (lightLv > 0) {
      this.timers.lightning -= dt;
      if (this.timers.lightning <= 0) {
        const cds = [0, 2.4, 2.1, 1.8, 1.5, 1.2];
        this.timers.lightning = cds[lightLv];
        this._castLightningStrikes(lightLv);
      }
    }

    // ARMA 4: Lame di Valchiria (orbitanti con scia curva)
    const bladeLv = this.levels.blades;
    if (bladeLv > 0 && this.bladeSprites.length > 0) {
      const orbitSpeed = 2.8 + bladeLv * 0.45;
      const orbitRadius = (66 + bladeLv * 7) * this.stats.areaMult;
      this.timers.bladeAngle += orbitSpeed * dt;

      const count = this.bladeSprites.length;
      const bladeDmg = Math.round((15 + bladeLv * 7) * this.stats.mightMult);
      const hitRadiusSq = 30 * 30;

      for (let i = 0; i < count; i++) {
        const b = this.bladeSprites[i];
        const ang = this.timers.bladeAngle + (i * Math.PI * 2) / count;
        b.x = this.hero.x + Math.cos(ang) * orbitRadius;
        b.y = this.hero.y + Math.sin(ang) * orbitRadius;
        b.setRotation(ang + Math.PI / 2);
        b.setDepth(computeEntityDepth(b.y) + 20);

        // Registra punto su ring-buffer fisso per scia luminosa (zero allocazioni GC)
        const trailSlot = this.bladeTrails[this._bladeTrailCursor];
        this._bladeTrailCursor = (this._bladeTrailCursor + 1) % this.bladeTrails.length;
        trailSlot.active = true;
        trailSlot.x = b.x;
        trailSlot.y = b.y;
        trailSlot.life = 0;
        trailSlot.dur = 0.16;

        for (let j = this.activeEnemies.length - 1; j >= 0; j--) {
          const e = this.activeEnemies[j];
          if (!e.active || e.bladeCooldown > 0) continue;
          const dx = e.x - b.x;
          const dy = e.y - b.y;
          if (dx * dx + dy * dy <= hitRadiusSq) {
            e.bladeCooldown = 0.24;
            const isCrit = Math.random() < 0.2;
            this._damageEnemy(
              e,
              isCrit ? Math.round(bladeDmg * 1.6) : bladeDmg,
              e.x - this.hero.x,
              e.y - this.hero.y,
              115,
              isCrit,
              0xbae6fd
            );
          }
        }
      }
    }
  }

  _rebuildValkyrieBlades() {
    for (const b of this.bladeSprites) b.destroy();
    this.bladeSprites.length = 0;

    const lv = this.levels.blades;
    if (lv <= 0) return;

    const counts = [0, 2, 3, 3, 4, 5];
    const count = counts[lv];
    const bladeScale = this.hdMode ? 0.33 : 1.18;
    for (let i = 0; i < count; i++) {
      const blade = this.add.image(this.hero.x, this.hero.y, 'blade_proj').setScale(bladeScale);
      this.bladeSprites.push(blade);
    }
  }

  /**
   * Ricerca dei K nemici più vicini senza allocare array temporanei o wrapper per frame
   */
  _getNearestActiveEnemies(maxRangeSq, limit) {
    const out = this._targetScratch;
    out.length = 0;
    const hx = this.hero.x;
    const hy = this.hero.y;

    for (let i = 0; i < this.activeEnemies.length; i++) {
      const e = this.activeEnemies[i];
      if (!e.active) continue;
      const dSq = computeSquaredDistance(hx, hy, e.x, e.y);
      if (dSq > maxRangeSq) continue;

      if (out.length < limit) {
        out.push({ enemy: e, dSq });
        for (let k = out.length - 1; k > 0 && out[k].dSq < out[k - 1].dSq; k--) {
          const tmp = out[k];
          out[k] = out[k - 1];
          out[k - 1] = tmp;
        }
      } else if (dSq < out[out.length - 1].dSq) {
        out[out.length - 1].enemy = e;
        out[out.length - 1].dSq = dSq;
        for (let k = out.length - 1; k > 0 && out[k].dSq < out[k - 1].dSq; k--) {
          const tmp = out[k];
          out[k] = out[k - 1];
          out[k - 1] = tmp;
        }
      }
    }
    return out;
  }

  _fireRunicAxes(level) {
    if (this.activeEnemies.length === 0) return;

    const counts = [0, 1, 2, 2, 3, 4];
    const pierces = [0, 1, 1, 2, 2, 3];
    const count = counts[level];
    const pierce = pierces[level];
    const targets = this._getNearestActiveEnemies(540 * 540, count);
    if (targets.length === 0) return;

    const dmg = Math.round((19 + level * 8) * this.stats.mightMult);
    const speed = 300 + level * 22;

    audio.playThrow();

    for (let i = 0; i < count; i++) {
      const target = targets[i % targets.length].enemy;
      const dx = target.x - this.hero.x;
      const dy = target.y - this.hero.y;
      const baseAng = Math.atan2(dy, dx) + (i > 0 && targets.length === 1 ? (i - 0.5) * 0.24 : 0);

      const proj = this.projPool.get(this.hero.x, this.hero.y, 'axe_proj');
      if (!proj) break;

      proj.setTexture('axe_proj');
      proj.enableBody(true, this.hero.x, this.hero.y, true, true);
      const axeBase = this.hdMode ? 0.32 : 1.22;
      proj.baseScale = axeBase * (1 + (this.stats.areaMult - 1) * 0.45);
      proj.setScale(proj.baseScale);
      proj.setDepth(DEPTH_LAYERS.VFX - 10);
      proj.setVelocity(Math.cos(baseAng) * speed, Math.sin(baseAng) * speed);
      proj.kind = 'axe';
      proj.damage = dmg;
      proj.pierce = pierce;
      proj.life = 1.65;
      proj.trailTimer = 0;
      if (!proj.hitSet) proj.hitSet = new Set();
      else proj.hitSet.clear();

      if (!this.activeProjectiles.includes(proj)) {
        this.activeProjectiles.push(proj);
      }
    }
  }

  _fireShadowDaggers(level) {
    if (this.activeEnemies.length === 0) return;

    const targets = this._getNearestActiveEnemies(520 * 520, 1);
    if (targets.length === 0) return;

    const counts = [0, 1, 2, 2, 3, 5];
    const pierces = [0, 1, 1, 2, 2, 3];
    const count = counts[level];
    const pierce = pierces[level];
    const dmg = Math.round((13 + level * 6) * this.stats.mightMult);
    const speed = 440 + level * 25;

    audio.playThrow();

    const target = targets[0].enemy;
    const centerAng = Math.atan2(target.y - this.hero.y, target.x - this.hero.x);
    const spread = 0.14;

    for (let i = 0; i < count; i++) {
      const ang = centerAng + (i - (count - 1) / 2) * spread;
      const proj = this.projPool.get(this.hero.x, this.hero.y, 'dagger_proj');
      if (!proj) break;

      proj.setTexture('dagger_proj');
      proj.enableBody(true, this.hero.x, this.hero.y, true, true);
      proj.baseScale = this.hdMode ? 0.32 : 1.1;
      proj.setScale(proj.baseScale);
      proj.setRotation(ang);
      proj.setDepth(DEPTH_LAYERS.VFX - 10);
      proj.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      proj.kind = 'dagger';
      proj.damage = dmg;
      proj.pierce = pierce;
      proj.life = 1.15;
      proj.trailTimer = 0;
      if (!proj.hitSet) proj.hitSet = new Set();
      else proj.hitSet.clear();

      if (!this.activeProjectiles.includes(proj)) {
        this.activeProjectiles.push(proj);
      }
    }
  }

  _fireArcaneOrbs(level) {
    if (this.activeEnemies.length === 0) return;

    const counts = [0, 1, 1, 2, 2, 3];
    const count = counts[level];
    const targets = this._getNearestActiveEnemies(540 * 540, count);
    if (targets.length === 0) return;

    const dmg = Math.round((22 + level * 10) * this.stats.mightMult);
    const blastRadius = (48 + level * 9) * this.stats.areaMult;
    const speed = 235 + level * 15;

    audio.playAuraPulse();

    for (let i = 0; i < count; i++) {
      const target = targets[i % targets.length].enemy;
      const ang = Math.atan2(target.y - this.hero.y, target.x - this.hero.x);
      const proj = this.projPool.get(this.hero.x, this.hero.y, 'orb_proj');
      if (!proj) break;

      proj.setTexture('orb_proj');
      proj.enableBody(true, this.hero.x, this.hero.y, true, true);
      proj.baseScale = this.hdMode ? 0.31 : 1.15;
      proj.setScale(proj.baseScale);
      proj.setRotation(0);
      proj.setDepth(DEPTH_LAYERS.VFX - 8);
      proj.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      proj.kind = 'orb';
      proj.damage = dmg;
      proj.blastRadius = blastRadius;
      proj.pierce = 1;
      proj.life = 1.9;
      proj.trailTimer = 0;
      if (!proj.hitSet) proj.hitSet = new Set();
      else proj.hitSet.clear();

      if (!this.activeProjectiles.includes(proj)) {
        this.activeProjectiles.push(proj);
      }
    }
  }

  _castLightningStrikes(level) {
    const visible = this.activeEnemies.filter((e) => {
      if (!e.active) return false;
      return computeSquaredDistance(this.hero.x, this.hero.y, e.x, e.y) < 340 * 340;
    });
    if (visible.length === 0) return;

    const strikeCounts = [0, 1, 2, 2, 3, 4];
    const count = strikeCounts[level];
    const aoeRadius = (48 + level * 8) * this.stats.areaMult;
    const aoeSq = aoeRadius * aoeRadius;
    const dmg = Math.round((30 + level * 15) * this.stats.mightMult);

    audio.playLightning();
    this.cameras.main.shake(105, 0.0045);

    for (let s = 0; s < count; s++) {
      const pick = visible[Math.floor(Math.random() * visible.length)];
      if (!pick || !pick.active) continue;

      const tx = pick.x;
      const ty = pick.y;

      // Genera percorso biforcuto persistente per 260ms in _updateVfx
      const points = [
        { x: tx + (Math.random() - 0.5) * 38, y: ty - 290 },
        { x: tx + (Math.random() - 0.5) * 26, y: ty - 200 },
        { x: tx + (Math.random() - 0.5) * 24, y: ty - 115 },
        { x: tx + (Math.random() - 0.5) * 14, y: ty - 48 },
        { x: tx, y: ty }
      ];
      this.activeLightnings.push({
        x: tx,
        y: ty,
        radius: aoeRadius,
        points,
        life: 0,
        dur: 0.26
      });
      this._emitSparks(tx, ty, 10, 0x7dd3fc, 150);

      for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
        const e = this.activeEnemies[i];
        if (!e.active) continue;
        const dx = e.x - tx;
        const dy = e.y - ty;
        if (dx * dx + dy * dy <= aoeSq) {
          this._damageEnemy(e, dmg, dx, dy, 105, true, 0x38bdf8);
        }
      }
    }
  }

  _onProjectileHitEnemy(proj, enemy) {
    if (proj.hitSet && proj.hitSet.has(enemy)) return;
    if (proj.hitSet) proj.hitSet.add(enemy);

    if (proj.kind === 'orb') {
      const r = proj.blastRadius || 54;
      const rSq = r * r;
      const ex = proj.x;
      const ey = proj.y;
      this.activeExplosions.push({ x: ex, y: ey, maxR: r, life: 0, dur: 0.28, color: 0x38bdf8 });
      this._emitSparks(ex, ey, 12, 0x7dd3fc, 145);
      audio.playLightning();

      for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
        const e = this.activeEnemies[i];
        if (!e.active) continue;
        const dx = e.x - ex;
        const dy = e.y - ey;
        if (dx * dx + dy * dy <= rSq) {
          const isCrit = Math.random() < (this.stats.critChance || 0.18);
          const dmg = isCrit ? Math.round(proj.damage * 1.6) : proj.damage;
          this._damageEnemy(e, dmg, dx, dy, 95, isCrit, 0x38bdf8);
        }
      }
      this._recycleProjectile(proj);
      return;
    }

    const critBonus = proj.kind === 'dagger' ? 0.12 : 0;
    const isCrit = Math.random() < (this.stats.critChance || 0.18) + critBonus;
    const critMult = proj.kind === 'dagger' ? 1.85 : 1.65;
    const finalDmg = isCrit ? Math.round(proj.damage * critMult) : proj.damage;
    const sparkColor = proj.kind === 'dagger' ? 0xe879f9 : 0xfbbf24;
    this._damageEnemy(enemy, finalDmg, proj.body.velocity.x, proj.body.velocity.y, 130, isCrit, sparkColor);

    proj.pierce -= 1;
    if (proj.pierce <= 0) {
      this._recycleProjectile(proj);
    }
  }

  _damageEnemy(enemy, amount, dirX, dirY, knockbackForce, isCrit, sparkColor = 0xfef08a) {
    if (!enemy.active) return;

    enemy.hp -= amount;
    enemy.setTintFill(0xffffff);
    enemy.flashTimer = 0.08;

    const kbFactor = enemy.isBoss ? 0.08 : enemy.archetype === 'tank' ? 0.42 : 1;
    const len = Math.hypot(dirX, dirY) || 1;
    if (knockbackForce > 0 && kbFactor > 0) {
      enemy.setVelocity((dirX / len) * knockbackForce * kbFactor, (dirY / len) * knockbackForce * kbFactor);
      enemy.knockbackTimer = 0.11;
    }

    this._emitSparks(enemy.x, enemy.y - 4, isCrit ? 7 : 4, sparkColor, isCrit ? 120 : 80);
    this._spawnDamageText(enemy.x, enemy.y - 18, amount, isCrit);
    audio.playHit(isCrit);

    if (isCrit) {
      this.cameras.main.shake(65, 0.0028);
    }

    if (enemy.isBoss) {
      this.bridge?.onBossHudUpdate?.({
        name: 'Hrimthurs, Signore del Gelo',
        hp: Math.max(0, enemy.hp),
        maxHp: enemy.maxHp
      });
    }

    if (enemy.hp <= 0) {
      this._killEnemy(enemy);
    }
  }

  _killEnemy(enemy) {
    const ex = enemy.x;
    const ey = enemy.y;
    const xpVal = enemy.xpValue || 2;
    const wasBoss = enemy.isBoss;
    const burstColor = enemy.archetype === 'fast' ? 0x818cf8 : enemy.archetype === 'tank' ? 0xf87171 : 0x38bdf8;

    this._emitSparks(ex, ey, wasBoss ? 28 : 8, burstColor, wasBoss ? 210 : 110);
    this.kills += 1;
    this._recycleEnemy(enemy);
    this._spawnXpGem(ex, ey, xpVal);

    if (wasBoss && !this.bossDefeated) {
      this._onBossDefeated();
    }
  }

  async _onBossDefeated() {
    this.bossDefeated = true;
    this.bossSprite = null;
    this.activeTelegraphs.length = 0;
    this.telegraphGfx.clear();

    audio.playExplosion(1.0);
    this.cameras.main.shake(450, 0.015);
    this.bridge?.onBossHudUpdate?.(null);

    this.gameState = 'CUTSCENE';
    this.physics.pause();
    this._resetJoystick();

    await new Promise((r) => setTimeout(r, 700));
    audio.playVictory();

    if (this.storyManager) {
      await this.storyManager.play('onVictory', this.activeHeroId);
    }

    this.gameState = 'ENDED';
    this.bridge?.onRunEnded?.({
      victory: true,
      heroId: this.activeHeroId,
      startingWeaponId: this.activeWeaponId,
      elapsedSec: Math.floor(this.elapsedSec),
      kills: this.kills,
      level: this.stats.level,
      bossDefeated: true
    });
  }

  _onEnemyTouchHero(enemy) {
    if (this.stats.invulnTimer > 0) return;

    this.stats.hp = Math.max(0, this.stats.hp - (enemy.damage || 10));
    this.stats.invulnTimer = 0.48;
    audio.playPlayerHurt();
    this.cameras.main.shake(120, 0.006);
    this._emitSparks(this.hero.x, this.hero.y, 8, 0xef4444, 110);
    this.hero.setTintFill(0xef4444);
    this.time.delayedCall(90, () => {
      if (this.hero && this.hero.active) this.hero.clearTint();
    });

    if (this.stats.hp <= 0) {
      this._triggerGameOver();
    }
  }

  async _triggerGameOver() {
    if (this.gameState === 'ENDED' || this.gameState === 'CUTSCENE') return;
    this.gameState = 'CUTSCENE';
    this.physics.pause();
    this._resetJoystick();
    audio.playGameOver();

    if (this.storyManager) {
      await this.storyManager.play('onGameOver', this.activeHeroId);
    }

    this.gameState = 'ENDED';
    this.bridge?.onRunEnded?.({
      victory: false,
      heroId: this.activeHeroId,
      startingWeaponId: this.activeWeaponId,
      elapsedSec: Math.floor(this.elapsedSec),
      kills: this.kills,
      level: this.stats.level,
      bossDefeated: this.bossDefeated
    });
  }

  _updateEnemiesAndBoss(dt) {
    const hx = this.hero.x;
    const hy = this.hero.y;
    const recycleDistSq = 860 * 860;

    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const e = this.activeEnemies[i];
      if (!e.active) continue;

      if (e.flashTimer > 0) {
        e.flashTimer -= dt;
        if (e.flashTimer <= 0) e.clearTint();
      }
      if (e.bladeCooldown > 0) e.bladeCooldown -= dt;

      const dx = hx - e.x;
      const dy = hy - e.y;
      const dSq = dx * dx + dy * dy;

      if (!e.isBoss && dSq > recycleDistSq) {
        const ang = Math.random() * Math.PI * 2;
        e.setPosition(hx + Math.cos(ang) * 380, hy + Math.sin(ang) * 380);
      }

      if (e.knockbackTimer > 0) {
        e.knockbackTimer -= dt;
      } else {
        const dist = Math.sqrt(dSq) || 1;
        e.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
        e.setFlipX(dx < 0);
      }

      e.walkPhase += dt * (e.isBoss ? 6 : 11);
      const baseScale =
        e.baseScale ||
        (e.isBoss
          ? this.hdMode ? 0.413 : 1.60
          : e.archetype === 'tank'
            ? this.hdMode ? 0.363 : 1.34
            : this.hdMode ? 0.322 : 1.19);
      const wobble = Math.sin(e.walkPhase);
      e.setScale(baseScale * (1 - wobble * 0.045), baseScale * (1 + wobble * 0.055));

      // Y-Sorting sicuro anche a coordinate Y negative
      e.setDepth(computeEntityDepth(e.y));
      if (e.shadow) {
        e.shadow.setPosition(e.x, e.y + (e.isBoss ? 37 : e.archetype === 'tank' ? 23 : 15));
      }
    }

    if (this.bossSprite && this.bossSprite.active) {
      this.timers.bossAttack -= dt;
      if (this.timers.bossAttack <= 0) {
        this.timers.bossAttack = 3.1;
        const count = 2 + (this.bossSprite.hp < this.bossSprite.maxHp * 0.5 ? 1 : 0);
        for (let c = 0; c < count; c++) {
          const offsetAng = Math.random() * Math.PI * 2;
          const offsetR = c === 0 ? 18 : 65 + Math.random() * 85;
          this.activeTelegraphs.push({
            x: hx + Math.cos(offsetAng) * offsetR,
            y: hy + Math.sin(offsetAng) * offsetR,
            radius: 66,
            elapsed: 0,
            duration: 1.25
          });
        }
      }
    }
  }

  _updateTelegraphs(dt) {
    this.telegraphGfx.clear();
    if (this.activeTelegraphs.length === 0) return;

    for (let i = this.activeTelegraphs.length - 1; i >= 0; i--) {
      const t = this.activeTelegraphs[i];
      t.elapsed += dt;
      const progress = Math.min(1, t.elapsed / t.duration);

      this.telegraphGfx.lineStyle(2.5, 0xf87171, 0.92);
      this.telegraphGfx.fillStyle(0xdc2626, 0.14);
      this.telegraphGfx.fillCircle(t.x, t.y, t.radius);
      this.telegraphGfx.strokeCircle(t.x, t.y, t.radius);

      // Anello interno che si riempie + anello convergente
      this.telegraphGfx.fillStyle(0xef4444, 0.36);
      this.telegraphGfx.fillCircle(t.x, t.y, t.radius * progress);
      this.telegraphGfx.lineStyle(1.5, 0xfecaca, 0.75);
      this.telegraphGfx.strokeCircle(t.x, t.y, t.radius * (1 - progress * 0.85));

      if (progress >= 1) {
        this._detonateTelegraph(t);
        this.activeTelegraphs.splice(i, 1);
      }
    }
  }

  _detonateTelegraph(t) {
    audio.playBossAttack();
    this.cameras.main.shake(160, 0.0075);
    this._emitSparks(t.x, t.y, 16, 0xf87171, 180);

    const ring = this.add
      .circle(t.x, t.y, t.radius, 0xf87171, 0.48)
      .setDepth(DEPTH_LAYERS.VFX);
    this.tweens.add({
      targets: ring,
      scale: 1.28,
      alpha: 0,
      duration: 260,
      onComplete: () => ring.destroy()
    });

    if (
      computeSquaredDistance(this.hero.x, this.hero.y, t.x, t.y) <= t.radius * t.radius &&
      this.stats.invulnTimer <= 0
    ) {
      this.stats.hp = Math.max(0, this.stats.hp - 26);
      this.stats.invulnTimer = 0.55;
      audio.playPlayerHurt();
      if (this.stats.hp <= 0) {
        this._triggerGameOver();
      }
    }
  }

  _updateProjectiles(dt) {
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const p = this.activeProjectiles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.kind === 'axe') {
        p.angle += 560 * dt;
      } else if (p.kind === 'orb') {
        const obs = p.baseScale || 1.15;
        const pulse = obs * (1.0 + Math.sin(this.elapsedSec * 14) * 0.12);
        p.setScale(pulse);
      }
      p.setDepth(computeEntityDepth(p.y) + 25);

      p.trailTimer -= dt;
      if (p.trailTimer <= 0) {
        p.trailTimer = p.kind === 'dagger' ? 0.03 : 0.045;
        const trailCol = p.kind === 'dagger' ? 0xe879f9 : p.kind === 'orb' ? 0x38bdf8 : 0xfbbf24;
        this._emitSparks(p.x, p.y, 1, trailCol, 24);
      }

      if (p.life <= 0) {
        this._recycleProjectile(p);
      }
    }
  }

  /**
   * Aggiorna VFX persistenti (Saette di Thor, impulsi Aura, esplosioni Globo, scie Lame, Spark Pool)
   */
  _updateVfx(dt) {
    this.vfxGfx.clear();

    // 1. Onde espansive Aura del Crepuscolo
    for (let i = this.activeAuraPulses.length - 1; i >= 0; i--) {
      const p = this.activeAuraPulses[i];
      p.life += dt;
      const t = p.life / p.dur;
      if (t >= 1) {
        this.activeAuraPulses.splice(i, 1);
        continue;
      }
      const r = p.maxR * (0.45 + t * 0.65);
      this.vfxGfx.lineStyle(2.5, 0xe879f9, (1 - t) * 0.75);
      this.vfxGfx.strokeCircle(p.x, p.y, r);
    }

    // 1b. Esplosioni Globo Arcano
    for (let i = this.activeExplosions.length - 1; i >= 0; i--) {
      const ex = this.activeExplosions[i];
      ex.life += dt;
      const t = ex.life / ex.dur;
      if (t >= 1) {
        this.activeExplosions.splice(i, 1);
        continue;
      }
      const r = ex.maxR * (0.35 + t * 0.72);
      const alpha = 1 - t;
      this.vfxGfx.fillStyle(ex.color, alpha * 0.28);
      this.vfxGfx.fillCircle(ex.x, ex.y, r);
      this.vfxGfx.lineStyle(2.5, 0xe0f2fe, alpha * 0.9);
      this.vfxGfx.strokeCircle(ex.x, ex.y, r);
    }

    // 2. Scie luminose delle Lame di Valchiria (ring-buffer zero allocazioni)
    for (let i = 0; i < this.bladeTrails.length; i++) {
      const tr = this.bladeTrails[i];
      if (!tr.active) continue;
      tr.life += dt;
      const t = tr.life / tr.dur;
      if (t >= 1) {
        tr.active = false;
        continue;
      }
      this.vfxGfx.fillStyle(0xbae6fd, (1 - t) * 0.45);
      this.vfxGfx.fillCircle(tr.x, tr.y, 5 * (1 - t * 0.5));
    }

    // 3. Fulmini biforcuti di Thor
    for (let i = this.activeLightnings.length - 1; i >= 0; i--) {
      const bolt = this.activeLightnings[i];
      bolt.life += dt;
      const t = bolt.life / bolt.dur;
      if (t >= 1) {
        this.activeLightnings.splice(i, 1);
        continue;
      }
      const alpha = 1 - t;

      // Alone ciano esterno + nucleo bianco brillante
      this.vfxGfx.lineStyle(7, 0x38bdf8, alpha * 0.55);
      this.vfxGfx.beginPath();
      this.vfxGfx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let p = 1; p < bolt.points.length; p++) {
        this.vfxGfx.lineTo(bolt.points[p].x, bolt.points[p].y);
      }
      this.vfxGfx.strokePath();

      this.vfxGfx.lineStyle(2.5, 0xf0f9ff, alpha);
      this.vfxGfx.beginPath();
      this.vfxGfx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let p = 1; p < bolt.points.length; p++) {
        this.vfxGfx.lineTo(bolt.points[p].x, bolt.points[p].y);
      }
      this.vfxGfx.strokePath();

      // Anello d'impatto elettrificato sul terreno
      this.vfxGfx.fillStyle(0x38bdf8, alpha * 0.25);
      this.vfxGfx.fillCircle(bolt.x, bolt.y, bolt.radius * (0.85 + t * 0.2));
      this.vfxGfx.lineStyle(2, 0xe0f2fe, alpha * 0.9);
      this.vfxGfx.strokeCircle(bolt.x, bolt.y, bolt.radius * (0.85 + t * 0.2));
    }

    // 4. Pool particelle di impatto & morte
    for (const s of this.sparkPool) {
      if (!s.active) continue;
      s.life += dt;
      if (s.life >= s.dur) {
        s.active = false;
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.92;
      s.vy *= 0.92;
      const alpha = 1 - s.life / s.dur;
      this.vfxGfx.fillStyle(s.color, alpha);
      this.vfxGfx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    }
  }

  _initSparkPool() {
    this.sparkPool = Array.from({ length: GAME_CONFIG.MAX_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 3,
      color: 0xffffff,
      life: 0,
      dur: 0.25
    }));
  }

  _emitSparks(x, y, count, color, speed) {
    let spawned = 0;
    for (const s of this.sparkPool) {
      if (s.active) continue;
      const ang = Math.random() * Math.PI * 2;
      const spd = speed * (0.45 + Math.random() * 0.75);
      s.active = true;
      s.x = x;
      s.y = y;
      s.vx = Math.cos(ang) * spd;
      s.vy = Math.sin(ang) * spd;
      s.size = 2.5 + Math.random() * 2.5;
      s.color = color;
      s.life = 0;
      s.dur = 0.18 + Math.random() * 0.16;
      spawned += 1;
      if (spawned >= count) break;
    }
  }

  /**
   * Particelle atmosferiche ambientali (neve e braci nordiche) sopra il mondo di gioco
   */
  _initWeatherMotes() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.weatherMotes = Array.from({ length: 28 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: -10 - Math.random() * 14,
      vy: 18 + Math.random() * 22,
      size: 1.5 + Math.random() * 2,
      isEmber: i % 5 === 0,
      alpha: 0.22 + Math.random() * 0.35
    }));
  }

  _updateWeather(dt) {
    const w = this.scale.width;
    const h = this.scale.height;
    this.weatherGfx.clear();

    for (const m of this.weatherMotes) {
      m.x += m.vx * dt;
      m.y += (m.isEmber ? -m.vy * 0.85 : m.vy) * dt;
      if (m.x < -8) m.x = w + 8;
      if (m.x > w + 8) m.x = -8;
      if (m.y > h + 8) m.y = -8;
      if (m.y < -8) m.y = h + 8;

      this.weatherGfx.fillStyle(m.isEmber ? 0xfb923c : 0xe2e8f0, m.alpha);
      this.weatherGfx.fillCircle(m.x, m.y, m.size);
    }
  }

  _spawnXpGem(x, y, value) {
    if (this.activeGems.length >= GAME_CONFIG.MAX_GEMS) {
      const donor = this.activeGems[0];
      if (donor) donor.xpValue += value;
      return;
    }

    const key = value >= 15 ? 'gem_gold' : value >= 4 ? 'gem_green' : 'gem_blue';
    const gem = this.gemPool.get(x, y, key);
    if (!gem) return;

    gem.setTexture(key);
    gem.enableBody(true, x, y, true, true);
    gem.xpValue = value;
    gem.magnetized = false;
    gem.setScale(this.hdMode ? 0.30 : 1.05);
    gem.setDepth(DEPTH_LAYERS.GEMS);
    if (!this.activeGems.includes(gem)) {
      this.activeGems.push(gem);
    }
  }

  _updateGems(_dt) {
    if (this.gemComboTimer > 0) {
      this.gemComboTimer -= _dt;
      if (this.gemComboTimer <= 0) this.gemCombo = 0;
    }

    const magSq = this.stats.magnetRadius * this.stats.magnetRadius;
    const pickupSq = 24 * 24;
    const hx = this.hero.x;
    const hy = this.hero.y;

    for (let i = this.activeGems.length - 1; i >= 0; i--) {
      const g = this.activeGems[i];
      if (!g.active) continue;

      const dSq = computeSquaredDistance(hx, hy, g.x, g.y);

      if (dSq <= pickupSq) {
        const gained = g.xpValue || 2;
        this._recycleGem(g);
        this.gemCombo = Math.min(9, this.gemCombo + 1);
        this.gemComboTimer = 0.65;
        audio.playGem(this.gemCombo - 1);
        this._emitSparks(hx, hy - 6, 3, 0x38bdf8, 55);
        this._grantXp(gained);
        continue;
      }

      if (g.magnetized || dSq <= magSq) {
        g.magnetized = true;
        const dist = Math.sqrt(dSq) || 1;
        const pullSpeed = 360;
        g.setVelocity(((hx - g.x) / dist) * pullSpeed, ((hy - g.y) / dist) * pullSpeed);
      }
    }
  }

  _grantXp(amount) {
    this.stats.xp += amount;
    if (this.stats.xp >= this.stats.xpNeeded) {
      this.stats.xp -= this.stats.xpNeeded;
      this.stats.level += 1;
      this.stats.xpNeeded = Math.round(10 + this.stats.level * 8 + Math.pow(this.stats.level, 1.35) * 2);
      this._openLevelUpScreen();
    }
  }

  _openLevelUpScreen() {
    this.gameState = 'LEVEL_UP';
    this.physics.pause();
    this._resetJoystick();
    audio.playLevelUp();

    const available = UPGRADE_CATALOG.filter((u) => this.levels[u.id] < u.maxLevel);
    Phaser.Utils.Array.Shuffle(available);
    const choices = available.slice(0, 3).map((u) => {
      const currentLv = this.levels[u.id];
      const nextLv = currentLv + 1;
      return {
        ...u,
        currentLevel: currentLv,
        nextLevel: nextLv,
        description: u.desc[nextLv - 1] || u.desc[u.desc.length - 1]
      };
    });

    if (choices.length === 0) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 30);
      this.resumeGame();
      return;
    }

    this._syncHud();
    this.bridge?.onLevelUp?.(choices);
  }

  _recycleEnemy(enemy) {
    if (enemy.shadow) enemy.shadow.setVisible(false);
    enemy.disableBody(true, true);
    const idx = this.activeEnemies.indexOf(enemy);
    if (idx !== -1) this.activeEnemies.splice(idx, 1);
  }

  _recycleProjectile(proj) {
    proj.disableBody(true, true);
    const idx = this.activeProjectiles.indexOf(proj);
    if (idx !== -1) this.activeProjectiles.splice(idx, 1);
  }

  _recycleGem(gem) {
    gem.disableBody(true, true);
    const idx = this.activeGems.indexOf(gem);
    if (idx !== -1) this.activeGems.splice(idx, 1);
  }

  _initDamageTextPool() {
    for (let i = 0; i < GAME_CONFIG.MAX_DAMAGE_TEXTS; i++) {
      const txt = this.add.text(0, 0, '', {
        fontFamily: '"Silkscreen", "JetBrains Mono", monospace',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#090d16',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(DEPTH_LAYERS.DAMAGE_TEXT).setVisible(false);
      txt.inUse = false;
      txt.life = 0;
      txt.dur = 0.48;
      txt.startY = 0;
      this.dmgTextPool.push(txt);
    }
  }

  _spawnDamageText(x, y, amount, isCrit) {
    const txt = this.dmgTextPool.find((t) => !t.inUse);
    if (!txt) return;

    txt.inUse = true;
    txt.life = 0;
    txt.dur = 0.48;
    txt.startY = y;
    txt.setText(isCrit ? `${amount}!` : `${amount}`);
    txt.setPosition(x + (Math.random() - 0.5) * 14, y);
    txt.setColor(isCrit ? '#fbbf24' : '#f8fafc');
    txt.setFontSize(isCrit ? '15px' : '12px');
    txt.setAlpha(1).setScale(isCrit ? 1.15 : 1).setVisible(true);
  }

  _updateDamageTexts(dt) {
    for (let i = 0; i < this.dmgTextPool.length; i++) {
      const txt = this.dmgTextPool[i];
      if (!txt.inUse) continue;
      txt.life += dt;
      const t = txt.life / txt.dur;
      if (t >= 1) {
        txt.setVisible(false);
        txt.inUse = false;
        continue;
      }
      const easeOut = 1 - Math.pow(1 - t, 3);
      txt.y = txt.startY - 26 * easeOut;
      txt.setAlpha(1 - t);
    }
  }

  /**
   * Decali estetici non-bloccanti sul terreno (lastre runiche, scudi caduti, crepe glaciali)
   */
  _initGroundDecals() {
    const decalScale = this.hdMode ? 0.42 : 1.0;
    for (let i = 0; i < GAME_CONFIG.DECAL_COUNT; i++) {
      const key = i % 3 === 0 ? 'decal_rune' : i % 3 === 1 ? 'decal_relic' : 'decal_snow';
      const decal = this.add.image(0, 0, key).setDepth(DEPTH_LAYERS.DECALS).setAlpha(0.88).setScale(decalScale);
      this.groundDecals.push(decal);
    }
    this._repositionAllDecals();
  }

  _repositionAllDecals() {
    for (let i = 0; i < this.groundDecals.length; i++) {
      const d = this.groundDecals[i];
      const ang = (i / this.groundDecals.length) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 60 + Math.random() * (GAME_CONFIG.PROP_RECYCLE_RADIUS - 100);
      d.setPosition(Math.cos(ang) * dist, Math.sin(ang) * dist);
    }
  }

  _recycleDecalsAroundHero() {
    const rMaxSq = GAME_CONFIG.PROP_RECYCLE_RADIUS * GAME_CONFIG.PROP_RECYCLE_RADIUS;
    const hx = this.hero.x;
    const hy = this.hero.y;
    for (const d of this.groundDecals) {
      const dx = d.x - hx;
      const dy = d.y - hy;
      if (dx * dx + dy * dy > rMaxSq) {
        const ang = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 1.4;
        const dist = GAME_CONFIG.PROP_RECYCLE_RADIUS - 70 - Math.random() * 70;
        d.setPosition(hx + Math.cos(ang) * dist, hy + Math.sin(ang) * dist);
      }
    }
  }

  /**
   * Ostacoli scenici riciclati (Pini nordici, Monoliti runici, Bracieri accesi)
   */
  _initScenicProps() {
    for (let i = 0; i < GAME_CONFIG.PROP_COUNT; i++) {
      const mod = i % 5;
      const kind = mod === 0 ? 'prop_brazier' : mod === 1 ? 'prop_rock' : 'prop_tree';
      const prop = this.propsGroup.create(0, 0, kind);
      const pScale = this.hdMode
        ? kind === 'prop_tree' ? 0.43 : 0.39
        : kind === 'prop_tree' ? 1.25 : 1.15;
      prop.setScale(pScale);
      prop.kind = kind;
      if (kind === 'prop_brazier') {
        prop.glow = this.add.circle(0, 0, 34, 0xf97316, 0.15).setDepth(DEPTH_LAYERS.DECALS + 1);
      }
      this.propItems.push(prop);
    }
    this._repositionAllProps();
  }

  _repositionAllProps() {
    for (let i = 0; i < this.propItems.length; i++) {
      const p = this.propItems[i];
      let px = 0;
      let py = 0;
      for (let attempt = 0; attempt < 6; attempt++) {
        const ang = (i / this.propItems.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.6 + attempt * 0.45;
        const dist = 175 + Math.random() * (GAME_CONFIG.PROP_RECYCLE_RADIUS - 195);
        px = Math.cos(ang) * dist;
        py = Math.sin(ang) * dist;
        if (!this._isPropCrowded(p, px, py, i)) break;
      }
      this._placeProp(p, px, py);
    }
  }

  _isPropCrowded(selfProp, x, y, maxCheckCount = this.propItems.length) {
    const minPropGapSq = 112 * 112;
    for (let j = 0; j < maxCheckCount; j++) {
      const other = this.propItems[j];
      if (!other || other === selfProp) continue;
      if (computeSquaredDistance(x, y, other.x, other.y) < minPropGapSq) {
        return true;
      }
    }
    return false;
  }

  _placeProp(prop, x, y) {
    prop.setPosition(x, y);
    prop.setDepth(computeEntityDepth(y));
    const baseOffsetY = prop.kind === 'prop_tree' ? 24 : prop.kind === 'prop_rock' ? 16 : 12;
    prop.baseX = x;
    prop.baseY = y + baseOffsetY;
    prop.trunkRadius = prop.kind === 'prop_rock' ? 14 : 11;
    if (prop.glow) {
      prop.glow.setPosition(x, y + 6);
    }
  }

  _recyclePropsAroundHero() {
    const rMaxSq = GAME_CONFIG.PROP_RECYCLE_RADIUS * GAME_CONFIG.PROP_RECYCLE_RADIUS;
    const hx = this.hero.x;
    const hy = this.hero.y;

    for (const p of this.propItems) {
      const dx = p.x - hx;
      const dy = p.y - hy;
      if (dx * dx + dy * dy > rMaxSq) {
        let nx = hx;
        let ny = hy;
        for (let attempt = 0; attempt < 6; attempt++) {
          const ang = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 1.4 + attempt * 0.35;
          const dist = GAME_CONFIG.PROP_RECYCLE_RADIUS - 70 - Math.random() * 55;
          nx = hx + Math.cos(ang) * dist;
          ny = hy + Math.sin(ang) * dist;
          if (!this._isPropCrowded(p, nx, ny)) break;
        }
        this._placeProp(p, nx, ny);
      }
    }
  }

  /**
   * Separazione circolare continua attorno alla base di alberi, monoliti e bracieri.
   * Impedisce qualsiasi incastro pur consentendo di scivolare fluidamente lungo il bordo.
   */
  _resolvePropCollisions() {
    if (!this.propItems || this.propItems.length === 0) return;
    const heroFootX = this.hero.x;
    const heroFootY = this.hero.y + (this.heroFeetOffsetY || 17);
    const heroR = this.heroFeetRadius || 11;

    for (let i = 0; i < this.propItems.length; i++) {
      const prop = this.propItems[i];
      const bx = prop.baseX ?? prop.x;
      const by = prop.baseY ?? prop.y;
      const minHeroDist = heroR + (prop.trunkRadius || 11);
      const dx = heroFootX - bx;
      const dy = heroFootY - by;
      const dSq = dx * dx + dy * dy;

      if (dSq < minHeroDist * minHeroDist) {
        const dist = Math.sqrt(dSq) || 0.001;
        const nx = dx / dist;
        const ny = dy / dist;
        const push = minHeroDist - dist;
        this.hero.x += nx * push;
        this.hero.y += ny * push;
        // Rimuove solo la componente di velocità che spinge contro l'ostacolo, preservando lo scivolamento laterale
        const velDot = this.hero.body.velocity.x * nx + this.hero.body.velocity.y * ny;
        if (velDot < 0) {
          this.hero.body.velocity.x -= velDot * nx;
          this.hero.body.velocity.y -= velDot * ny;
        }
      }
    }

    // Anche i nemici aggirano i tronchi senza incastrarsi
    for (let eIdx = 0; eIdx < this.activeEnemies.length; eIdx++) {
      const enemy = this.activeEnemies[eIdx];
      if (!enemy.active || enemy.isBoss) continue;
      const ex = enemy.x;
      const ey = enemy.y + 12;
      for (let pIdx = 0; pIdx < this.propItems.length; pIdx++) {
        const prop = this.propItems[pIdx];
        const bx = prop.baseX ?? prop.x;
        const by = prop.baseY ?? prop.y;
        const minDist = 10 + (prop.trunkRadius || 11);
        const dx = ex - bx;
        const dy = ey - by;
        const dSq = dx * dx + dy * dy;
        if (dSq < minDist * minDist) {
          const dist = Math.sqrt(dSq) || 0.001;
          const push = minDist - dist;
          enemy.x += (dx / dist) * push;
          enemy.y += (dy / dist) * push;
        }
      }
    }
  }

  _syncHud() {
    if (!this.bridge?.onHudUpdate) return;
    this.bridge.onHudUpdate({
      xp: this.stats.xp,
      xpNeeded: this.stats.xpNeeded,
      level: this.stats.level,
      kills: this.kills,
      elapsedSec: Math.floor(this.elapsedSec),
      remainingSec: Math.max(0, Math.ceil(GAME_CONFIG.RUN_DURATION_SEC - this.elapsedSec)),
      bossSpawned: this.bossSpawned,
      build: this._getBuildSnapshot()
    });
  }

  /**
   * Carica opzionalmente sprite PNG reali dichiarati in ./assets/sprites/manifest.json
   * evitando richieste 404 o errori Phaser "Failed to process file" quando assenti.
   */
  async _loadCustomSpritesFromManifest() {
    if (typeof fetch !== 'function') return;
    try {
      const res = await fetch('./assets/sprites/manifest.json', { cache: 'no-cache' });
      if (!res.ok) return;
      const manifest = await res.json();
      const enabled = Array.isArray(manifest?.enabled) ? manifest.enabled : [];
      if (enabled.length === 0) return;

      let queued = false;
      for (const key of enabled) {
        const url = `./assets/sprites/${key}.png`;
        const probe = await fetch(url, { method: 'GET' });
        const contentType = probe.headers.get('content-type') || '';
        if (probe.ok && contentType.startsWith('image/')) {
          if (this.textures.exists(key)) {
            this.textures.remove(key);
          }
          this.load.image(key, url);
          queued = true;
        }
      }

      if (queued) {
        this.load.once('complete', () => {
          if (this.hero && this.textures.exists('hero_warrior')) this.hero.setTexture('hero_warrior');
          if (this.ground && this.textures.exists('ground_tile')) this.ground.setTexture('ground_tile');
        });
        this.load.start();
      }
    } catch {
      // Mantiene le texture procedurali senza errori
    }
  }

  /**
   * Generatore procedurale avanzato di texture pixel-art 16-bit
   */
  _ensureProceduralTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Terreno Nordico 256x256 ricco (lastroni spezzati, neve, muschio, crepe glaciali e rune)
    if (!this.textures.exists('ground_tile')) {
      g.clear();
      g.fillStyle(0x0f1726, 1);
      g.fillRect(0, 0, 256, 256);

      // Zone organiche di neve e terreno ghiacciato
      const patches = [
        [14, 18, 46, 32, 0x162235],
        [130, 12, 58, 38, 0x152033],
        [45, 118, 66, 44, 0x172438],
        [168, 146, 54, 42, 0x162236],
        [18, 194, 48, 36, 0x141f30],
        [188, 56, 42, 34, 0x1c2b42]
      ];
      for (const [px, py, pw, ph, col] of patches) {
        g.fillStyle(col, 1);
        g.fillRoundedRect(px, py, pw, ph, 10);
      }

      // Lastroni antichi spezzati
      const slabs = [
        [24, 24, 34, 22],
        [142, 86, 42, 26],
        [72, 188, 38, 24],
        [192, 196, 34, 22]
      ];
      for (const [sx, sy, sw, sh] of slabs) {
        g.fillStyle(0x1f2d42, 0.9);
        g.fillRect(sx, sy, sw, sh);
        g.fillStyle(0x334155, 0.55);
        g.fillRect(sx + 2, sy + 2, sw - 4, 2);
        g.fillStyle(0x090f1a, 0.85);
        g.fillRect(sx + Math.floor(sw * 0.45), sy, 2, sh);
      }

      // Crepe di brina + chiazze di muschio artico e pietrisco
      g.fillStyle(0x2d4363, 0.45);
      g.fillRect(88, 46, 24, 2);
      g.fillRect(102, 48, 2, 14);
      g.fillRect(194, 112, 20, 2);
      g.fillRect(40, 144, 18, 2);

      // Ciuffi di muschio nordico desaturato e sassolini
      const pebbles = [
        [14, 72, 0x1e3a34], [62, 62, 0x334155], [118, 32, 0x26413c],
        [214, 28, 0x334155], [96, 134, 0x26413c], [156, 168, 0x334155],
        [34, 226, 0x26413c], [228, 174, 0x1e3a34], [148, 232, 0x334155]
      ];
      for (const [bx, by, bc] of pebbles) {
        g.fillStyle(bc, 0.85);
        g.fillRect(bx, by, 5, 3);
        g.fillRect(bx + 2, by - 1, 3, 2);
      }

      // Piccole rune incise sulla pietra
      g.fillStyle(0x38bdf8, 0.22);
      g.fillRect(160, 94, 2, 10);
      g.fillRect(157, 96, 8, 2);
      g.fillRect(38, 30, 2, 9);
      g.fillRect(36, 33, 6, 2);

      g.generateTexture('ground_tile', 256, 256);
    }

    // Decali terreno non-bloccanti
    if (!this.textures.exists('decal_rune')) {
      g.clear();
      g.fillStyle(0x1e293b, 0.9);
      g.fillRoundedRect(4, 4, 44, 28, 8);
      g.lineStyle(1.5, 0x38bdf8, 0.4);
      g.strokeCircle(26, 18, 9);
      g.fillStyle(0x38bdf8, 0.45);
      g.fillRect(25, 11, 2, 14);
      g.fillRect(20, 17, 12, 2);
      g.generateTexture('decal_rune', 52, 36);
    }

    if (!this.textures.exists('decal_relic')) {
      g.clear();
      g.fillStyle(0x334155, 0.85);
      g.fillCircle(16, 16, 11);
      g.fillStyle(0xb45309, 0.75);
      g.fillCircle(16, 16, 7);
      g.fillStyle(0x94a3b8, 0.9);
      g.fillRect(20, 4, 3, 22);
      g.fillRect(16, 10, 11, 2);
      g.generateTexture('decal_relic', 34, 32);
    }

    if (!this.textures.exists('decal_snow')) {
      g.clear();
      g.fillStyle(0x1e2d44, 0.75);
      g.fillEllipse(24, 12, 42, 18);
      g.fillStyle(0x334c6e, 0.45);
      g.fillEllipse(20, 10, 26, 10);
      g.generateTexture('decal_snow', 48, 24);
    }

    // 2. Eroe 1: Astrid la Valchiria (36x42)
    if (!this.textures.exists('hero_warrior')) {
      g.clear();
      g.fillStyle(0x7c2d12, 1);
      g.fillRect(6, 15, 24, 18);
      g.fillStyle(0x9a3412, 1);
      g.fillRect(8, 15, 20, 14);
      g.fillStyle(0x475569, 1);
      g.fillRect(10, 14, 16, 14);
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(11, 14, 14, 3);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(10, 24, 16, 3);
      g.fillStyle(0xd97706, 1);
      g.fillRect(10, 28, 6, 3);
      g.fillRect(20, 28, 6, 3);
      g.fillStyle(0x1e293b, 1);
      g.fillRect(10, 31, 6, 8);
      g.fillRect(20, 31, 6, 8);
      g.fillStyle(0xfde68a, 1);
      g.fillRect(13, 8, 10, 8);
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(11, 4, 14, 6);
      g.fillStyle(0xf8fafc, 1);
      g.fillRect(7, 2, 4, 6);
      g.fillRect(25, 2, 4, 6);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(14, 11, 2, 2);
      g.fillRect(20, 11, 2, 2);
      g.fillStyle(0x78350f, 1);
      g.fillRect(27, 13, 3, 16);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(29, 9, 6, 9);
      g.fillStyle(0xfef3c7, 1);
      g.fillRect(33, 10, 2, 7);
      g.generateTexture('hero_warrior', 36, 42);
    }

    // 2b. Eroe 2: Skadi l'Assassina d'Ombra (femminile, 36x42)
    if (!this.textures.exists('hero_assassin')) {
      g.clear();
      // Mantello viola scuro sfumato e sciarpa cremisi
      g.fillStyle(0x3b0764, 1);
      g.fillRect(7, 15, 22, 17);
      g.fillStyle(0x581c87, 1);
      g.fillRect(9, 14, 18, 13);
      // Corpetto aderente d'ombra + cintura
      g.fillStyle(0x1e1b4b, 1);
      g.fillRect(12, 15, 12, 13);
      g.fillStyle(0xe879f9, 1);
      g.fillRect(12, 23, 12, 2);
      // Stivali agili
      g.fillStyle(0x0f172a, 1);
      g.fillRect(11, 28, 5, 11);
      g.fillRect(20, 28, 5, 11);
      // Volto + Cappuccio e treccia scura
      g.fillStyle(0xfecdd3, 1);
      g.fillRect(13, 8, 10, 7);
      g.fillStyle(0x4c1d95, 1);
      g.fillRect(11, 3, 14, 6);
      g.fillStyle(0x1e1b4b, 1);
      g.fillRect(9, 6, 3, 11); // treccia laterale
      // Occhi violetti intensi + maschera
      g.fillStyle(0x312e81, 1);
      g.fillRect(13, 12, 10, 3);
      g.fillStyle(0xf0abfc, 1);
      g.fillRect(14, 10, 2, 2);
      g.fillRect(20, 10, 2, 2);
      // Doppi pugnali lucenti
      g.fillStyle(0xe2e8f0, 1);
      g.fillRect(4, 18, 5, 2);
      g.fillRect(27, 17, 7, 2);
      g.fillStyle(0xe879f9, 1);
      g.fillRect(3, 18, 2, 2);
      g.fillRect(32, 17, 3, 2);
      g.generateTexture('hero_assassin', 36, 42);
    }

    // 2c. Eroe 3: Freya la Maga delle Rune (femminile, 36x42)
    if (!this.textures.exists('hero_mage')) {
      g.clear();
      // Tunica lunga blu-ciano con bordi dorati
      g.fillStyle(0x0c4a6e, 1);
      g.fillRect(8, 15, 20, 23);
      g.fillStyle(0x0284c7, 1);
      g.fillRect(10, 16, 16, 18);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(16, 16, 4, 20); // stola dorata centrale
      g.fillRect(9, 36, 18, 2);
      // Spallacci leggeri e mani
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(9, 14, 18, 3);
      // Capelli argentei fluenti e volto + diadema runico
      g.fillStyle(0xe2e8f0, 1);
      g.fillRect(9, 6, 18, 13);
      g.fillStyle(0xfde68a, 1);
      g.fillRect(13, 8, 10, 7);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(12, 4, 12, 3);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(17, 3, 2, 3);
      // Occhi azzurri arcani
      g.fillStyle(0x0ea5e9, 1);
      g.fillRect(14, 10, 2, 2);
      g.fillRect(20, 10, 2, 2);
      // Bastone runico luminoso
      g.fillStyle(0x78350f, 1);
      g.fillRect(28, 10, 3, 28);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(26, 4, 7, 7);
      g.fillStyle(0xf0f9ff, 1);
      g.fillRect(28, 6, 3, 3);
      g.generateTexture('hero_mage', 36, 42);
    }

    // 3. Nemico Swarm: Draugr (30x34)
    if (!this.textures.exists('enemy_swarm')) {
      g.clear();
      g.fillStyle(0x1e3a4c, 1);
      g.fillRect(8, 13, 14, 14);
      g.fillStyle(0x334155, 1);
      g.fillRect(9, 4, 12, 10);
      g.fillStyle(0x64748b, 1);
      g.fillRect(7, 3, 3, 4);
      g.fillRect(20, 3, 3, 4);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(11, 8, 2, 2);
      g.fillRect(17, 8, 2, 2);
      g.fillStyle(0x0f172a, 1);
      g.fillRect(9, 27, 4, 6);
      g.fillRect(17, 27, 4, 6);
      g.fillStyle(0xcbd5e1, 1);
      g.fillRect(23, 10, 3, 11);
      g.generateTexture('enemy_swarm', 30, 34);
    }

    // 4. Nemico Veloce: Lupo Fenrir (34x26)
    if (!this.textures.exists('enemy_fast')) {
      g.clear();
      g.fillStyle(0x312e81, 1);
      g.fillRect(6, 9, 19, 10);
      g.fillStyle(0x4338ca, 1);
      g.fillRect(20, 4, 10, 9);
      g.fillRect(2, 7, 5, 4);
      g.fillStyle(0xf43f5e, 1);
      g.fillRect(25, 7, 2, 2);
      g.fillStyle(0x818cf8, 0.8);
      g.fillRect(12, 6, 8, 3);
      g.fillStyle(0x1e1b4b, 1);
      g.fillRect(8, 19, 3, 6);
      g.fillRect(21, 19, 3, 6);
      g.generateTexture('enemy_fast', 34, 26);
    }

    // 5. Nemico Tank: Jotun Corazzato (40x46)
    if (!this.textures.exists('enemy_tank')) {
      g.clear();
      g.fillStyle(0x334155, 1);
      g.fillRect(6, 14, 28, 22);
      g.fillStyle(0x475569, 1);
      g.fillRect(4, 12, 32, 6);
      g.fillStyle(0x64748b, 1);
      g.fillRect(10, 4, 20, 11);
      g.fillStyle(0xef4444, 1);
      g.fillRect(14, 8, 3, 3);
      g.fillRect(23, 8, 3, 3);
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(1, 16, 7, 17);
      g.fillStyle(0x0f172a, 1);
      g.fillRect(10, 36, 7, 9);
      g.fillRect(23, 36, 7, 9);
      g.generateTexture('enemy_tank', 40, 46);
    }

    // 6. Boss Finale: Hrimthurs (70x80)
    if (!this.textures.exists('boss')) {
      g.clear();
      g.fillStyle(0xbae6fd, 1);
      g.fillRect(10, 2, 7, 14);
      g.fillRect(53, 2, 7, 14);
      g.fillRect(16, 9, 9, 5);
      g.fillRect(45, 9, 9, 5);
      g.fillStyle(0x1e293b, 1);
      g.fillRect(22, 9, 26, 19);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(27, 15, 4, 4);
      g.fillRect(39, 15, 4, 4);
      g.fillStyle(0x334155, 1);
      g.fillRect(13, 26, 44, 32);
      g.fillStyle(0xef4444, 1);
      g.fillRect(33, 33, 4, 16);
      g.fillRect(27, 39, 16, 4);
      g.fillStyle(0x7dd3fc, 1);
      g.fillRect(55, 14, 14, 20);
      g.fillStyle(0x78350f, 1);
      g.fillRect(60, 34, 4, 26);
      g.fillStyle(0x0f172a, 1);
      g.fillRect(18, 58, 12, 20);
      g.fillRect(40, 58, 12, 20);
      g.generateTexture('boss', 70, 80);
    }

    // 7. Pino Nordico (50x68)
    if (!this.textures.exists('prop_tree')) {
      g.clear();
      g.fillStyle(0x451a03, 1);
      g.fillRect(21, 48, 8, 18);
      g.fillStyle(0x064e3b, 1);
      g.fillTriangle(25, 2, 6, 28, 44, 28);
      g.fillTriangle(25, 15, 3, 42, 47, 42);
      g.fillTriangle(25, 28, 2, 52, 48, 52);
      g.fillStyle(0xcbd5e1, 0.85);
      g.fillTriangle(25, 2, 15, 15, 35, 15);
      g.generateTexture('prop_tree', 50, 68);
    }

    // 8. Monolite Runico (36x48)
    if (!this.textures.exists('prop_rock')) {
      g.clear();
      g.fillStyle(0x334155, 1);
      g.fillRect(6, 12, 24, 34);
      g.fillTriangle(18, 2, 6, 12, 30, 12);
      g.fillStyle(0x38bdf8, 0.9);
      g.fillRect(16, 16, 4, 18);
      g.fillRect(11, 22, 14, 3);
      g.generateTexture('prop_rock', 36, 48);
    }

    // 9. Braciere Runico Acceso (32x38)
    if (!this.textures.exists('prop_brazier')) {
      g.clear();
      g.fillStyle(0x334155, 1);
      g.fillRect(8, 20, 16, 16);
      g.fillStyle(0x475569, 1);
      g.fillRect(5, 16, 22, 6);
      g.fillStyle(0xea580c, 1);
      g.fillTriangle(16, 2, 7, 17, 25, 17);
      g.fillStyle(0xfbbf24, 1);
      g.fillTriangle(16, 7, 11, 17, 21, 17);
      g.generateTexture('prop_brazier', 32, 38);
    }

    // 10. Ombra ellittica
    if (!this.textures.exists('shadow_ellipse')) {
      g.clear();
      g.fillStyle(0x020617, 1);
      g.fillEllipse(14, 7, 26, 11);
      g.generateTexture('shadow_ellipse', 28, 14);
    }

    // 11. Proiettile Ascia
    if (!this.textures.exists('axe_proj')) {
      g.clear();
      g.fillStyle(0x92400e, 1);
      g.fillRect(8, 2, 3, 16);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(10, 2, 9, 10);
      g.fillStyle(0xfef3c7, 1);
      g.fillRect(16, 3, 3, 8);
      g.generateTexture('axe_proj', 22, 22);
    }

    // 11b. Proiettile Pugnale d'Ombra
    if (!this.textures.exists('dagger_proj')) {
      g.clear();
      g.fillStyle(0x312e81, 1);
      g.fillRect(1, 5, 5, 3);
      g.fillStyle(0xf8fafc, 1);
      g.fillTriangle(18, 6, 6, 3, 6, 10);
      g.fillStyle(0xe879f9, 1);
      g.fillRect(6, 5, 7, 2);
      g.generateTexture('dagger_proj', 20, 13);
    }

    // 11c. Proiettile Globo Arcano
    if (!this.textures.exists('orb_proj')) {
      g.clear();
      g.fillStyle(0x0284c7, 0.9);
      g.fillCircle(9, 9, 8);
      g.fillStyle(0x7dd3fc, 1);
      g.fillCircle(9, 9, 5);
      g.fillStyle(0xf0f9ff, 1);
      g.fillCircle(8, 8, 2.5);
      g.generateTexture('orb_proj', 18, 18);
    }

    // 12. Lama orbitante
    if (!this.textures.exists('blade_proj')) {
      g.clear();
      g.fillStyle(0xbae6fd, 1);
      g.fillTriangle(8, 0, 2, 16, 14, 16);
      g.fillStyle(0xf8fafc, 1);
      g.fillRect(7, 3, 2, 12);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(4, 16, 8, 3);
      g.generateTexture('blade_proj', 16, 22);
    }

    // 13. Gemme XP
    const drawGem = (key, mainColor, lightColor) => {
      if (this.textures.exists(key)) return;
      g.clear();
      g.fillStyle(mainColor, 1);
      g.fillTriangle(6, 0, 0, 7, 12, 7);
      g.fillTriangle(6, 14, 0, 7, 12, 7);
      g.fillStyle(lightColor, 1);
      g.fillRect(5, 3, 2, 6);
      g.generateTexture(key, 12, 14);
    };
    drawGem('gem_blue', 0x0ea5e9, 0xbae6fd);
    drawGem('gem_green', 0x10b981, 0xa7f3d0);
    drawGem('gem_gold', 0xf59e0b, 0xfef3c7);

    g.destroy();
  }
}
