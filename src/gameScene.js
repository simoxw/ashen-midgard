/**
 * GameScene: Core loop 2.5D Survivors-like / Bullet Heaven per Phaser 3.
 * Orchestratore snello a 60 FPS tramite SpatialHashGrid, Object Pooling O(1),
 * WeaponSystem modulare, BossController multi-fase, Modalità Infinita e Impostazioni.
 */

import { audio } from './audio.js';
import { generateHdTextures } from './hdSprites.js';
import { getRealmConfig, getRealmDialogue, getChallengeConfig } from './realms.js';
import { HERO_ROSTER } from './heroes.js';
import { loadSettings, saveSettings, triggerHaptic } from './settings.js';
import { SpatialHashGrid, swapPopPush, swapPopRemove } from './spatialGrid.js';
import {
  UPGRADE_CATALOG,
  WEAPON_EVOLUTIONS,
  getAvailableEvolutions,
  getWeaponEvolutionStatus
} from './weapons.js';
import { ensureProceduralTextures } from './proceduralTextures.js';
import { WeaponSystem } from './weaponSystem.js';
import { BossController } from './bossController.js';
import { registerCustomWalkFrames, getAnimProfile } from './spriteAnimator.js';

export { UPGRADE_CATALOG, WEAPON_EVOLUTIONS };

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

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.bridge = null;
    this.storyManager = null;
    this.settings = loadSettings();
    this.weaponSystem = new WeaponSystem(this);
    this.bossController = new BossController(this);
  }

  configureBridge(bridge, storyManager) {
    this.bridge = bridge;
    this.storyManager = storyManager;
  }

  applySettings(nextSettings = {}) {
    this.settings = saveSettings({ ...(this.settings || loadSettings()), ...nextSettings });
    audio.applySettings(this.settings);
    if (this.settings.damageNumbers === false && this.dmgTextPool) {
      for (const txt of this.dmgTextPool) {
        txt.setVisible(false);
        txt.inUse = false;
      }
    }
    if (this.joyActive) {
      this._resetJoystick();
    }
    return this.settings;
  }

  preload() {
    this.load.on('loaderror', () => {});
  }

  create() {
    this.settings = loadSettings();
    audio.applySettings(this.settings);

    // 1. Texture HD moderne (Canvas 2D in browser) + fallback procedurale in ambienti headless
    this.hdMode = typeof document !== 'undefined' && typeof this.textures?.addCanvas === 'function';
    this.customIllustratedKeys = new Set();
    this.customWalkFrameCounts = new Map();
    if (this.hdMode) {
      generateHdTextures(this.textures);
      this._generateAtmosphereTextures();
    }
    ensureProceduralTextures(this.textures, this.make);
    this._loadCustomSpritesFromManifest();

    // 2. Stato iniziale
    this.gameState = 'IDLE';
    this.activeRealmId = 'midgard';
    this.activeRealm = getRealmConfig('midgard');
    this.runMode = 'campaign';
    this.endlessWave = 0;
    this.bossesDefeatedCount = 0;
    this.nextEndlessBossSec = GAME_CONFIG.RUN_DURATION_SEC + 180;
    this.triggeredDialogues = new Set();
    this.bossHalfHpTriggered = false;
    this.bossTransformed = false;
    this.bossAttackStep = 0;
    this.elapsedSec = 0;
    this.kills = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossSprite = null;
    this.gemCombo = 0;
    this.gemComboTimer = 0;
    this.lastWaveIndex = -1;
    this.nextEncirclementSec = GAME_CONFIG.ENCIRCLEMENT_INTERVAL_SEC;

    // 3. Terreno infinito
    const camW = this.scale.width;
    const camH = this.scale.height;
    this.ground = this.add.tileSprite(camW / 2, camH / 2, camW + 64, camH + 64, 'ground_tile');
    this.ground.setScrollFactor(0).setDepth(DEPTH_LAYERS.GROUND);

    // 4. Layer grafici dedicati
    this.groundMarksGfx = this.add.graphics().setDepth(DEPTH_LAYERS.DECALS + 1);
    this.auraGfx = this.add.graphics().setDepth(DEPTH_LAYERS.AURA);
    this.telegraphGfx = this.add.graphics().setDepth(DEPTH_LAYERS.TELEGRAPHS);
    this.vfxGfx = this.add.graphics().setDepth(DEPTH_LAYERS.VFX);
    this.weatherGfx = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_LAYERS.WEATHER);
    this.joystickGfx = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_LAYERS.JOYSTICK);

    this.vignetteOverlay = this.textures.exists('vignette_overlay')
      ? this.add.image(camW / 2, camH / 2, 'vignette_overlay')
          .setScrollFactor(0)
          .setDepth(DEPTH_LAYERS.WEATHER + 5)
          .setAlpha(0.55)
      : null;

    this.heroGlow = this.textures.exists('glow_soft')
      ? this.add.image(0, 0, 'glow_soft')
          .setDepth(DEPTH_LAYERS.AURA - 5)
          .setAlpha(0.24)
          .setScale(1.15)
      : null;
    if (this.heroGlow && globalThis.Phaser?.BlendModes?.ADD !== undefined) {
      this.heroGlow.setBlendMode?.(Phaser.BlendModes.ADD);
    }
    this.bossGlow = null;

    // 5. Eroe con ombra e hitbox ai piedi
    this.heroBaseScale = this.hdMode ? 0.382 : 1.45;
    this.heroShadow = this.add
      .image(0, 0, 'shadow_ellipse')
      .setDepth(DEPTH_LAYERS.SHADOWS)
      .setAlpha(0.52)
      .setScale(this.hdMode ? 0.41 : 1.38);

    this.hero = this.physics.add.sprite(0, 0, 'hero_warrior');
    this.hero.setScale(this.heroBaseScale);
    const heroHbW = this.hdMode ? 52 : 20;
    const heroHbH = this.hdMode ? 40 : 14;
    this.hero.body.setSize(heroHbW, heroHbH);
    this.hero.body.setOffset(
      Math.max(0, (this.hero.width - heroHbW) / 2),
      Math.max(0, this.hero.height - heroHbH - (this.hdMode ? 6 : 1))
    );

    this.heroHpBg = this.add
      .rectangle(0, 0, 40, 6, 0x090d16, 0.9)
      .setDepth(DEPTH_LAYERS.HERO_HP_BAR);
    this.heroHpFill = this.add
      .rectangle(0, 0, 38, 4, 0x22c55e, 1)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH_LAYERS.HERO_HP_BAR + 1);

    this.cameras.main.startFollow(this.hero, true, 0.16, 0.16);
    this.cameras.main.setRoundPixels(false);

    // 6. Decali terreno e ostacoli scenici indicizzati con SpatialHashGrid
    this.groundDecals = [];
    this._initGroundDecals();

    this.propGrid = new SpatialHashGrid(112);
    this._propQueryScratch = [];
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

    this.enemyProjPool = this.physics.add.group({
      maxSize: 48,
      runChildUpdate: false
    });
    this.activeEnemyProjectiles = [];

    this.crateItems = [];
    this.shrineItems = [];
    this.pickupItems = [];
    this._initWorldInteractables();

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
    this.activeAstralPillars = [];
    this.activeGroundMarks = [];
    this.activeSparks = [];
    this._initSparkPool();
    this._initWeatherMotes();

    this.dmgTextPool = [];
    this._initDamageTextPool();
    this.activeTelegraphs = [];

    // 8. Collisioni Arcade & separazione fluida sugli ostacoli
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

    // 9. Input: Joystick virtuale + Tastiera WASD/Frecce
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

  _shake(duration, intensity) {
    if (this.settings?.screenShake === false) return;
    this.cameras?.main?.shake?.(duration, intensity);
  }

  async startNewRun(runConfig = {}) {
    this._resetRunState(runConfig);
    this.gameState = 'CUTSCENE';
    this.physics.pause();

    if (this.storyManager) {
      await this.storyManager.play('onGameStart', this.activeHeroId, this.activeRealmId);
    }

    this.gameState = 'PLAYING';
    this.physics.resume();
    this._syncHud();
  }

  _resetRunState(runConfig = {}) {
    for (const e of this.activeEnemies) {
      if (e.shadow) e.shadow.setVisible(false);
      e._poolIdx = -1;
      e.disableBody(true, true);
    }
    this.activeEnemies.length = 0;

    for (const p of this.activeProjectiles) {
      p._poolIdx = -1;
      p.disableBody(true, true);
    }
    this.activeProjectiles.length = 0;

    for (const g of this.activeGems) {
      g._poolIdx = -1;
      g.disableBody(true, true);
    }
    this.activeGems.length = 0;

    for (const ep of this.activeEnemyProjectiles) {
      ep._poolIdx = -1;
      ep.disableBody(true, true);
    }
    this.activeEnemyProjectiles.length = 0;

    for (const pk of this.pickupItems) {
      pk.active = false;
      pk.setVisible(false);
    }

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
    this.activeAstralPillars.length = 0;
    this.activeGroundMarks.length = 0;
    this.telegraphGfx.clear();
    this.vfxGfx.clear();
    this.auraGfx.clear();
    this.groundMarksGfx?.clear();
    if (this.bossGlow) this.bossGlow.setVisible(false);

    this.activeHeroId = runConfig.heroId || 'warrior';
    this.activeWeaponId = runConfig.startingWeaponId || 'axe';
    this.activeRealmId = runConfig.realmId || 'midgard';
    this.activeRealm = getRealmConfig(this.activeRealmId);
    this.activeChallengeId = runConfig.challengeId || 'standard';
    this.activeChallenge = getChallengeConfig(this.activeChallengeId);
    this.runMode = runConfig.runMode === 'endless' ? 'endless' : 'campaign';
    this.endlessWave = 0;
    this.bossesDefeatedCount = 0;
    this.nextEndlessBossSec = GAME_CONFIG.RUN_DURATION_SEC + 180;
    this.triggeredDialogues = new Set();
    this.bossHalfHpTriggered = false;
    this.bossTransformed = false;
    this.bossAttackStep = 0;

    if (this.ground && this.textures.exists(this.activeRealm.groundKey)) {
      this.ground.setTexture(this.activeRealm.groundKey);
    }
    this.cameras?.main?.setBackgroundColor?.(this.activeRealm.bgColor);

    const textureMap = {
      warrior: 'hero_warrior',
      assassin: 'hero_assassin',
      mage: 'hero_mage',
      juggernaut: 'hero_juggernaut'
    };
    const chosenTexture = runConfig.textureKey || textureMap[this.activeHeroId] || 'hero_warrior';
    this.heroBaseTexKey = chosenTexture;
    this.heroWalkPhase = 0;
    this._lastHeroStepIdx = -1;
    this._heroLeanAngle = 0;
    this._lastSkillHudSec = 0;
    if (this.textures.exists(chosenTexture)) {
      this.hero.setTexture(chosenTexture);
    }

    this.hero.setPosition(0, 0);
    this.hero.setVelocity(0, 0);
    this.hero.clearTint();
    this.hero.setAlpha(1);
    this.hero.setVisible(true);
    this.hero.setFlipX(this._isSpriteNativeFacingLeft(this.heroBaseTexKey));
    this._refreshHeroSpriteMetrics();
    this.hero.setDepth(computeEntityDepth(0));
    this.heroShadow.setPosition(0, 24).setVisible(true).setDepth(DEPTH_LAYERS.SHADOWS);
    if (this.heroGlow) {
      const heroAccentMap = {
        warrior: 0xf59e0b,
        assassin: 0xe879f9,
        mage: 0x38bdf8,
        juggernaut: 0xfb923c
      };
      this.heroGlow.setPosition(0, 8).setVisible(true).setTint?.(heroAccentMap[this.activeHeroId] || 0xf59e0b);
    }

    this.elapsedSec = 0;
    this.kills = 0;
    this.miniBossesSlain = 0;
    this.cratesBroken = 0;
    this.shrinesActivated = 0;
    this.evolutionsForged = 0;
    this.skillsUsed = 0;
    this.encounteredEnemies = new Set();
    this.weaponDamageStats = {};
    this.activeSkillCooldown = 0;
    this.activeSkillBuffTimer = 0;
    this.ironSkinTimer = 0;
    this.activeFlailSwing = null;
    this.miniBossSchedule = [60, 120, 180];
    this.nextMiniBossIdx = 0;
    this.activeMiniBoss = null;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossSprite = null;
    this.lastWaveIndex = -1;
    this.nextEncirclementSec = GAME_CONFIG.ENCIRCLEMENT_INTERVAL_SEC;
    this.gemCombo = 0;
    this.gemComboTimer = 0;
    this.activeBuff = null;
    this.evolvedWeapons = {};

    const eff = runConfig.effectiveStats || {};
    this.baseRunStats = {
      maxHp: eff.maxHp || 110,
      speed: eff.speed || 138,
      mightMult: eff.mightMult || 1.0,
      areaMult: eff.areaMult || 1.0,
      magnetMult: eff.magnetMult || 1.0,
      critChance: eff.critChance || 0.18,
      xpGainMult: eff.xpGainMult || 1.0,
      damageReduction: eff.damageReduction || 0,
      revivals: eff.revivals || 0
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
      xpGainMult: this.baseRunStats.xpGainMult,
      damageReduction: this.baseRunStats.damageReduction,
      revivalsLeft: this.baseRunStats.revivals,
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
      hammer: 0,
      spear: 0,
      scythe: 0,
      fangs: 0,
      grimoire: 0,
      flail: 0,
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
      hammer: 0.4,
      spear: 0.35,
      scythe: 0.4,
      fangs: 0.3,
      grimoire: 0.55,
      flail: 0.45,
      bladeAngle: 0,
      bossAttack: 2.8
    };

    if (this.levels.blades > 0) {
      this._rebuildValkyrieBlades();
    }

    this._applyRealmToDecalsAndProps();
    this._repositionAllDecals();
    this._repositionAllProps();
    this._repositionCratesAndShrines();
    this.bridge?.onBossHudUpdate?.(null);
    this._syncHud();
  }

  _emitDialogue(triggerKey) {
    if (!this.triggeredDialogues) this.triggeredDialogues = new Set();
    if (this.triggeredDialogues.has(triggerKey)) return;
    this.triggeredDialogues.add(triggerKey);
    const dlg = getRealmDialogue(this.activeRealmId, triggerKey, this.activeHeroId);
    if (dlg) {
      this.bridge?.onDialogue?.(dlg);
    }
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
    if (this.gameState !== 'PAUSED' && this.gameState !== 'LEVEL_UP' && this.gameState !== 'CHEST') return;
    this.gameState = 'PLAYING';
    this.physics.resume();
    this._syncHud();
  }

  _getAvailableEvolutions() {
    return getAvailableEvolutions(this.levels, this.evolvedWeapons);
  }

  applyUpgrade(upgradeId) {
    if (typeof upgradeId === 'string' && upgradeId.startsWith('evo_')) {
      const evo = Object.values(WEAPON_EVOLUTIONS).find((e) => e.id === upgradeId);
      if (evo && !this.evolvedWeapons[evo.weaponId]) {
        this.evolvedWeapons[evo.weaponId] = true;
        this.evolutionsForged += 1;
        audio.playEvolution();
        const evoCol = parseInt((evo.accent || '#fbbf24').replace('#', ''), 16) || 0xfbbf24;
        this.activeExplosions.push({ x: this.hero.x, y: this.hero.y, maxR: 135, life: 0, dur: 0.42, color: evoCol });
        this.activeAuraPulses.push({ x: this.hero.x, y: this.hero.y, maxR: 175, life: 0, dur: 0.5, color: 0xfef08a });
        this._spawnGroundMark('rune', this.hero.x, this.hero.y + 12, 62, evoCol);
        this._emitSparks(this.hero.x, this.hero.y, 24, evoCol, 200);
        if (evo.weaponId === 'blades') {
          this._rebuildValkyrieBlades();
        }
      }
      this.resumeGame();
      return;
    }

    if (!(upgradeId in this.levels)) return;
    this.levels[upgradeId] = Math.min(5, this.levels[upgradeId] + 1);
    this._recomputeStatsFromLevels();

    if (upgradeId === 'blades') {
      this._rebuildValkyrieBlades();
    }

    this.resumeGame();
  }

  _recomputeStatsFromLevels() {
    const furyBonus = this.activeBuff?.id === 'fury' ? 0.35 : 0;
    const swiftBonus = this.activeBuff?.id === 'frost_shield' ? 0.25 : 0;
    const skillSpeedBonus = this.activeSkillBuffTimer > 0 ? 0.35 : 0;

    this.stats.mightMult = this.baseRunStats.mightMult + this.levels.might * 0.18 + furyBonus;
    this.stats.speedMult = 1 + this.levels.swift * 0.12 + swiftBonus + skillSpeedBonus;
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
  }

  _getBuildSnapshot() {
    return UPGRADE_CATALOG
      .filter((u) => this.levels[u.id] > 0)
      .map((u) => {
        const evolved = Boolean(this.evolvedWeapons?.[u.id]);
        const evo = evolved ? WEAPON_EVOLUTIONS[u.id] : null;
        const evoStatus = u.type === 'weapon'
          ? getWeaponEvolutionStatus(u.id, this.levels, this.evolvedWeapons)
          : null;
        return {
          ...u,
          name: evo ? evo.name : u.name,
          accent: evo ? evo.accent : u.accent,
          level: this.levels[u.id],
          evolved,
          evoStatus
        };
      });
  }

  _getDamageBreakdown() {
    const entries = Object.entries(this.weaponDamageStats || {}).filter(([, dmg]) => dmg > 0);
    const total = entries.reduce((sum, [, dmg]) => sum + dmg, 0);
    return entries
      .map(([id, damage]) => {
        const evo = this.evolvedWeapons?.[id] ? WEAPON_EVOLUTIONS[id] : null;
        const upg = UPGRADE_CATALOG.find((u) => u.id === id);
        let name = evo?.name || upg?.name;
        let accent = evo?.accent || upg?.accent || '#f59e0b';
        if (!name && id.startsWith('skill_')) {
          const heroSkill = Object.values(HERO_ROSTER).find((h) => h.activeSkill?.id === id)?.activeSkill;
          name = heroSkill ? `${heroSkill.name} (Abilità)` : 'Abilità Attiva';
          accent = heroSkill?.accent || '#38bdf8';
        }
        return {
          id,
          name: name || id,
          accent,
          damage: Math.round(damage),
          percent: total > 0 ? Math.round((damage / total) * 100) : 0
        };
      })
      .sort((a, b) => b.damage - a.damage);
  }

  triggerActiveSkill() {
    return this.weaponSystem.triggerActiveSkill();
  }

  _rebuildValkyrieBlades() {
    this.weaponSystem.rebuildValkyrieBlades();
  }

  _getNearestActiveEnemies(maxRangeSq, limit) {
    return this.weaponSystem.getNearestActiveEnemies(maxRangeSq, limit);
  }

  _onProjectileHitEnemy(proj, enemy) {
    this.weaponSystem.onProjectileHitEnemy(proj, enemy);
  }

  update(_time, deltaMs) {
    if (this.gameState !== 'PLAYING') return;

    const dt = Math.min(deltaMs / 1000, 0.05);
    this.elapsedSec += dt;

    // 1. Movimento Eroe
    this._updateHeroMovement(dt);

    // 2. Rigenerazione, Invulnerabilità e Cooldown Abilità Attiva
    if (this.stats.regenPerSec > 0 && this.stats.hp < this.stats.maxHp) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + this.stats.regenPerSec * dt);
    }
    let skillSecondChanged = false;
    if (this.activeSkillCooldown > 0) {
      this.activeSkillCooldown = Math.max(0, this.activeSkillCooldown - dt);
      const secCeil = Math.ceil(this.activeSkillCooldown);
      if (secCeil !== this._lastSkillHudSec) {
        this._lastSkillHudSec = secCeil;
        skillSecondChanged = true;
      }
    } else if (this._lastSkillHudSec !== 0) {
      this._lastSkillHudSec = 0;
      skillSecondChanged = true;
    }
    if (this.activeSkillBuffTimer > 0) {
      this.activeSkillBuffTimer -= dt;
      if (this.activeSkillBuffTimer <= 0) {
        this.activeSkillBuffTimer = 0;
        this._recomputeStatsFromLevels();
      }
    }
    if (this.ironSkinTimer > 0) {
      this.ironSkinTimer = Math.max(0, this.ironSkinTimer - dt);
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

    // 4. Ondate progressive, Modalità Infinita ed eventi Boss
    const waveIdx = Math.floor(this.elapsedSec / GAME_CONFIG.WAVE_INTERVAL_SEC);
    if (waveIdx !== this.lastWaveIndex) {
      this.lastWaveIndex = waveIdx;
      if (waveIdx === 1) this._emitDialogue('wave_1');
      else if (waveIdx === 3) this._emitDialogue('wave_3');
      else if (waveIdx === 5) this._emitDialogue('wave_5');
    }

    if (this.runMode === 'endless' && this.elapsedSec >= GAME_CONFIG.RUN_DURATION_SEC) {
      const nextEndlessWave = 1 + Math.floor((this.elapsedSec - GAME_CONFIG.RUN_DURATION_SEC) / 60);
      if (nextEndlessWave > this.endlessWave) {
        this.endlessWave = nextEndlessWave;
      }
    }

    if ((!this.bossSpawned || (this.runMode === 'endless' && !this.bossSprite?.active)) && this.elapsedSec >= this.nextEncirclementSec) {
      this.nextEncirclementSec += GAME_CONFIG.ENCIRCLEMENT_INTERVAL_SEC;
      this._spawnEncirclementRing(waveIdx);
    }

    if (
      !this.bossSpawned &&
      this.nextMiniBossIdx < this.miniBossSchedule.length &&
      this.elapsedSec >= this.miniBossSchedule[this.nextMiniBossIdx]
    ) {
      const mbIdx = this.nextMiniBossIdx;
      this.nextMiniBossIdx += 1;
      this._spawnMiniBoss(mbIdx);
    }

    if (!this.bossSpawned && this.elapsedSec >= GAME_CONFIG.RUN_DURATION_SEC) {
      this._syncHud();
      this._triggerBossSequence();
      return;
    }

    if (
      this.runMode === 'endless' &&
      this.bossSpawned &&
      (!this.bossSprite || !this.bossSprite.active) &&
      this.elapsedSec >= this.nextEndlessBossSec
    ) {
      this.nextEndlessBossSec = this.elapsedSec + 180;
      this._syncHud();
      this._triggerBossSequence();
      return;
    }

    if (this.activeBuff) {
      this.activeBuff.remaining -= dt;
      if (this.activeBuff.remaining <= 0) {
        this.activeBuff = null;
        this._recomputeStatsFromLevels();
      }
    }

    this._updateSpawning(dt, waveIdx);

    // 5. Armi, altari/casse, nemici, proiettili e VFX
    this.auraGfx.clear();
    if (this.ironSkinTimer > 0) {
      this.auraGfx.lineStyle(3, 0xfb923c, 0.78);
      this.auraGfx.strokeCircle(this.hero.x, this.hero.y + 4, 24);
    }
    this._updateCratesAndShrines(dt);
    this.weaponSystem.update(dt);
    this._updateEnemiesAndBoss(dt);
    this._resolvePropCollisions();
    this._updateProjectiles(dt);
    this._updateEnemyProjectiles(dt);
    this._updateGems(dt);
    this._updatePickups(dt);
    this._updateTelegraphs(dt);
    this._updateGroundMarks(dt);
    this._updateVfx(dt);
    this._updateDamageTexts(dt);
    this._updateWeather(dt);
    this._updateAtmosphericGlows();

    // 6. Y-Sorting Eroe & Barra HP
    this.hero.setDepth(computeEntityDepth(this.hero.y));
    this.heroShadow.setPosition(this.hero.x, this.hero.y + 24);
    this.heroHpBg.setPosition(this.hero.x, this.hero.y + 35);
    const hpRatio = Phaser.Math.Clamp(this.stats.hp / this.stats.maxHp, 0, 1);
    this.heroHpFill.width = Math.max(0, 38 * hpRatio);
    this.heroHpFill.setPosition(this.hero.x - 19, this.hero.y + 35);
    this.heroHpFill.setFillStyle(hpRatio > 0.35 ? 0x22c55e : 0xef4444);

    // 7. HUD sync throttled (o immediato su cambio secondo del cooldown abilità)
    this._hudSyncAcc = (this._hudSyncAcc || 0) + dt;
    if (skillSecondChanged || this._hudSyncAcc >= 0.1) {
      this._hudSyncAcc = 0;
      this._syncHud();
    }
  }

  _computeSpriteScale(texKey, targetDisplayH, fallbackScale) {
    if (this.customIllustratedKeys?.has(texKey)) {
      const img = this.textures?.get?.(texKey)?.getSourceImage?.();
      if (img && img.height > 0) {
        return Number((targetDisplayH / img.height).toFixed(4));
      }
    }
    return fallbackScale;
  }

  _refreshHeroSpriteMetrics() {
    if (!this.hero) return;
    const texKey = this.heroBaseTexKey || 'hero_warrior';
    const isCustom = Boolean(this.customIllustratedKeys?.has(texKey));
    this.heroBaseScale = this._computeSpriteScale(texKey, 76, this.hdMode ? 0.382 : 1.45);
    this.hero.setScale(this.heroBaseScale);
    if (this.hero.body) {
      const heroHbW = isCustom ? Math.max(14, Math.round(20 / this.heroBaseScale)) : (this.hdMode ? 52 : 20);
      const heroHbH = isCustom ? Math.max(11, Math.round(15 / this.heroBaseScale)) : (this.hdMode ? 40 : 14);
      this.hero.body.setSize(heroHbW, heroHbH);
      this.hero.body.setOffset(
        Math.max(0, (this.hero.width - heroHbW) / 2),
        Math.max(0, this.hero.height - heroHbH - (isCustom ? 10 : this.hdMode ? 6 : 1))
      );
    }
  }

  _refreshBossSpriteMetrics(boss) {
    if (!boss) return;
    const texKey = boss.baseTexKey || 'boss';
    const isCustom = Boolean(this.customIllustratedKeys?.has(texKey));
    boss.baseScale = this._computeSpriteScale(texKey, 126, this.hdMode ? 0.413 : 1.60);
    boss.setScale(boss.baseScale);
    if (boss.body) {
      const bHbW = isCustom ? Math.max(24, Math.round(52 / boss.baseScale)) : (this.hdMode ? 120 : 48);
      const bHbH = isCustom ? Math.max(16, Math.round(28 / boss.baseScale)) : (this.hdMode ? 64 : 26);
      boss.body.setSize(bHbW, bHbH);
      boss.body.setOffset(
        Math.max(0, (boss.width - bHbW) / 2),
        Math.max(0, boss.height - bHbH - (isCustom ? 10 : 5))
      );
    }
  }

  _refreshEnemySpriteMetrics(enemy) {
    if (!enemy) return;
    const texKey = enemy.baseTexKey || 'enemy_swarm';
    const isCustom = Boolean(this.customIllustratedKeys?.has(texKey));
    const arch = enemy.archetype || 'swarm';

    const specs = {
      tank: { targetH: 60, fbHd: 0.363, fbLo: 1.34, hdW: 70, hdH: 42, loW: 24, loH: 15 },
      shieldbearer: { targetH: 58, fbHd: 0.355, fbLo: 1.30, hdW: 64, hdH: 38, loW: 22, loH: 14 },
      fast: { targetH: 40, fbHd: 0.330, fbLo: 1.19, hdW: 58, hdH: 32, loW: 20, loH: 11 },
      archer: { targetH: 46, fbHd: 0.322, fbLo: 1.18, hdW: 54, hdH: 32, loW: 18, loH: 11 },
      shaman: { targetH: 48, fbHd: 0.338, fbLo: 1.24, hdW: 56, hdH: 34, loW: 20, loH: 12 },
      bomber: { targetH: 46, fbHd: 0.330, fbLo: 1.22, hdW: 56, hdH: 34, loW: 19, loH: 12 },
      stalker: { targetH: 46, fbHd: 0.332, fbLo: 1.22, hdW: 56, hdH: 34, loW: 19, loH: 12 },
      berserker: { targetH: 52, fbHd: 0.345, fbLo: 1.28, hdW: 62, hdH: 36, loW: 22, loH: 13 },
      elite: { targetH: 70, fbHd: 0.385, fbLo: 1.44, hdW: 84, hdH: 48, loW: 30, loH: 18 },
      swarm: { targetH: 46, fbHd: 0.322, fbLo: 1.19, hdW: 54, hdH: 32, loW: 18, loH: 11 }
    };
    const cfg = specs[arch] || specs.swarm;
    const fallback = this.hdMode ? cfg.fbHd : cfg.fbLo;
    enemy.baseScale = this._computeSpriteScale(texKey, cfg.targetH, fallback);
    enemy.setScale(enemy.baseScale);

    if (enemy.body) {
      const hbW = isCustom ? Math.max(12, Math.round(cfg.loW / enemy.baseScale)) : (this.hdMode ? cfg.hdW : cfg.loW);
      const hbH = isCustom ? Math.max(10, Math.round(cfg.loH / enemy.baseScale)) : (this.hdMode ? cfg.hdH : cfg.loH);
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(
        Math.max(0, (enemy.width - hbW) / 2),
        Math.max(0, enemy.height - hbH - (isCustom ? 8 : 3))
      );
    }
  }

  _refreshPropMetrics(prop) {
    if (!prop) return;
    const kind = prop.kind || 'prop_tree';
    const isTree = kind === 'prop_tree' || kind === 'prop_dead_tree' || kind === 'prop_magma_spire' || kind === 'prop_bifrost_pillar';
    const targetH = kind === 'prop_tree' ? 96 : kind === 'prop_shrine' ? 56 : kind === 'prop_rock' ? 60 : isTree ? 88 : 54;
    const fallback = this.hdMode ? (isTree ? 0.43 : 0.39) : (isTree ? 1.25 : 1.15);
    prop.setScale(this._computeSpriteScale(kind, targetH, fallback));
  }

  _applyWalkTextureFrame(sprite, baseKey, phase, isMoving = true) {
    if (!sprite || !baseKey) return;
    const curTexKey = typeof sprite.texture === 'string' ? sprite.texture : sprite.texture?.key;
    const isCustom = Boolean(this.customIllustratedKeys?.has(baseKey));
    const customCount = this.customWalkFrameCounts?.get(baseKey) || 0;

    if (isCustom && customCount === 0) {
      return;
    }

    if (!isMoving) {
      const idleKey = isCustom ? baseKey : `${baseKey}_f0`;
      if (this.textures.exists(idleKey) && curTexKey !== idleKey) {
        sprite.setTexture(idleKey);
      }
      return;
    }

    const frameCount = isCustom ? customCount : 4;
    const fIdx = Math.floor(phase) % frameCount;
    const frameKey = `${baseKey}_f${fIdx}`;
    if (this.textures.exists(frameKey) && curTexKey !== frameKey) {
      sprite.setTexture(frameKey);
    }
  }

  _isSpriteNativeFacingLeft(texKey) {
    if (!texKey || !this.customIllustratedKeys?.has(texKey)) return false;
    return getAnimProfile(texKey).nativeFacing === 'left';
  }

  _getRealmDustColor() {
    switch (this.activeRealmId) {
      case 'muspelheim': return 0xf97316;
      case 'helheim': return 0x67e8f9;
      case 'asgard': return 0xfde047;
      default: return 0x94a3b8;
    }
  }

  _updateHeroMovement(dt) {
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
      const nativeLeft = this._isSpriteNativeFacingLeft(this.heroBaseTexKey);
      this.hero.setFlipX(nativeLeft ? vx > 0 : vx < 0);
    }

    const baseS = this.heroBaseScale || 1.45;
    const shBase = this.hdMode ? 0.41 : 1.38;
    const frameCount = this.customWalkFrameCounts?.get(this.heroBaseTexKey) || 4;
    const animProfile = getAnimProfile(this.heroBaseTexKey);
    const isMoving = Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05;

    if (isMoving) {
      const cadence = frameCount >= 8 ? 11.8 : 10;
      const speedRatio = Phaser.Math.Clamp(this.stats?.speedMult || 1, 0.75, 2.0);
      this.heroWalkPhase = (this.heroWalkPhase || 0) + (dt || 0.016) * cadence * speedRatio;
      this._applyWalkTextureFrame(this.hero, this.heroBaseTexKey, this.heroWalkPhase, true);

      const cycleTheta = ((this.heroWalkPhase % frameCount) / frameCount) * Math.PI * 2;
      const strideSin = Math.sin(cycleTheta);
      const stepLift = Math.abs(strideSin);

      const targetLean = (Math.abs(vx) > 0.08 ? Math.sign(vx) * 2.6 : 0) + strideSin * (animProfile.mode === 'hover' ? 1.8 : 2.3);
      this._heroLeanAngle = (this._heroLeanAngle || 0) + (targetLean - (this._heroLeanAngle || 0)) * Math.min(1, (dt || 0.016) * 14);

      this.hero.setScale(baseS * (1 - stepLift * 0.025), baseS * (1 + stepLift * 0.032));
      this.hero.setAngle(this._heroLeanAngle);

      if (this.heroShadow) {
        this.heroShadow.setScale(shBase * (1 - stepLift * 0.14), shBase * (1 - stepLift * 0.10));
        this.heroShadow.setAlpha(0.52 - stepLift * 0.12);
      }

      const stepIdx = Math.floor(this.heroWalkPhase / (frameCount / 2));
      if (stepIdx !== this._lastHeroStepIdx) {
        this._lastHeroStepIdx = stepIdx;
        if (this.settings?.vfxQuality !== 'reduced') {
          const footOffX = strideSin >= 0 ? -6 : 6;
          this._emitSparks(this.hero.x + footOffX, this.hero.y + 26, 2, this._getRealmDustColor(), 38);
        }
      }
    } else {
      this.heroWalkPhase = 0;
      this._lastHeroStepIdx = -1;
      this._applyWalkTextureFrame(this.hero, this.heroBaseTexKey, 0, false);

      const breath = Math.sin(this.elapsedSec * 3.4);
      this._heroLeanAngle = (this._heroLeanAngle || 0) * 0.84;
      const breathY = animProfile.mode === 'hover' ? breath * 0.030 : breath * 0.022;
      this.hero.setScale(baseS * (1 - breath * 0.012), baseS * (1 + breathY));
      this.hero.setAngle(this._heroLeanAngle);

      if (this.heroShadow) {
        const hoverScale = animProfile.mode === 'hover' ? 1 - breath * 0.08 : 1;
        this.heroShadow.setScale(shBase * hoverScale, shBase * hoverScale);
        this.heroShadow.setAlpha(0.52);
      }
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

    const updateKnob = (px, py) => {
      const dx = px - this.joyOrigin.x;
      const dy = py - this.joyOrigin.y;
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
    };

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

      if (this.settings?.joystickMode === 'fixed') {
        const camW = this.scale?.width || 450;
        const camH = this.scale?.height || 800;
        this.joyOrigin.x = Math.min(camW * 0.25, 92);
        this.joyOrigin.y = camH - 112;
        updateKnob(pointer.x, pointer.y);
      } else {
        this.joyOrigin.x = pointer.x;
        this.joyOrigin.y = pointer.y;
        this.joyKnob.x = pointer.x;
        this.joyKnob.y = pointer.y;
        this.joyVec.x = 0;
        this.joyVec.y = 0;
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.joyActive || pointer.id !== this.joyPointerId) return;
      updateKnob(pointer.x, pointer.y);
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

  _updateSpawning(dt, waveIdx) {
    this.timers.spawn -= dt;
    if (this.timers.spawn > 0) return;

    const spawnMult = (this.activeChallenge?.spawnMult || 1.0) * (1 + (this.endlessWave || 0) * 0.14);
    const interval = Math.max(0.14, (0.92 - waveIdx * 0.065) / spawnMult);
    this.timers.spawn = interval;

    const activeBoss = Boolean(this.bossSprite && this.bossSprite.active);
    const batchCount = activeBoss
      ? 1
      : Math.min(6, Math.max(1, Math.round((1 + Math.floor(waveIdx * 0.5)) * (spawnMult > 1.3 ? 1.25 : 1))));

    for (let i = 0; i < batchCount; i++) {
      if (this.activeEnemies.length >= GAME_CONFIG.MAX_ENEMIES) break;

      let archetype = 'swarm';
      const roll = Math.random();
      if (waveIdx >= 1) {
        if (roll < 0.16) archetype = 'fast';
        else if (roll < 0.28) archetype = 'archer';
        else if (roll < 0.40) archetype = 'stalker';
      }
      if (waveIdx >= 2) {
        if (roll >= 0.40 && roll < 0.50) archetype = 'bomber';
        else if (roll >= 0.50 && roll < 0.59) archetype = 'shaman';
        else if (roll >= 0.59 && roll < 0.69) archetype = 'shieldbearer';
        else if (roll >= 0.69 && roll < 0.83) archetype = 'berserker';
        else if (roll >= 0.83) archetype = 'tank';
      }
      if (waveIdx >= 5 && roll >= 0.72) archetype = roll >= 0.86 ? 'tank' : 'shieldbearer';

      this._spawnEnemy(archetype, waveIdx);
    }
  }

  _spawnEncirclementRing(waveIdx) {
    const ringCount = Math.min(16, 8 + waveIdx);
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

    const realm = this.activeRealm || getRealmConfig('midgard');
    const ch = this.activeChallenge || getChallengeConfig('standard');
    const texKey = realm.enemyTexMap?.[archetype] || 'enemy_swarm';

    const enemy = this.enemyPool.get(sx, sy, texKey);
    if (!enemy) return null;

    enemy.setTexture(texKey);
    enemy.baseTexKey = texKey;
    enemy.enableBody(true, sx, sy, true, true);
    enemy.clearTint();
    enemy.setAlpha(1);
    enemy.setVisible(true);

    const endlessHpBoost = this.runMode === 'endless' && this.endlessWave > 0 ? 1 + this.endlessWave * 0.42 : 1;
    const endlessSpdBoost = this.runMode === 'endless' && this.endlessWave > 0 ? 1 + Math.min(0.35, this.endlessWave * 0.05) : 1;
    const hpScale = (1 + waveIdx * 0.25) * (realm.hpMult || 1.0) * (ch.hpMult || 1.0) * endlessHpBoost;
    const speedScale = (1 + Math.min(0.45, waveIdx * 0.04)) * (realm.speedMult || 1.0) * (ch.speedMult || 1.0) * endlessSpdBoost;

    enemy.summonCooldown = 0;
    enemy.summonWindup = 0;
    enemy.summonCount = 0;
    enemy.bomberTriggered = false;
    enemy.dashCooldown = 0;
    enemy.dashTime = 0;
    enemy.dashVx = 0;
    enemy.dashVy = 0;
    enemy.freezeTimer = 0;

    if (archetype === 'tank') {
      enemy.baseScale = this.hdMode ? 0.363 : 1.34;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(140 * hpScale);
      enemy.speed = 48 * speedScale;
      enemy.damage = 16;
      enemy.xpValue = 6;
      const hbW = this.hdMode ? 70 : 24;
      const hbH = this.hdMode ? 42 : 15;
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(Math.max(0, (enemy.width - hbW) / 2), Math.max(0, enemy.height - hbH - 3));
    } else if (archetype === 'shieldbearer') {
      enemy.baseScale = this.hdMode ? 0.355 : 1.30;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(135 * hpScale);
      enemy.speed = 46 * speedScale;
      enemy.damage = 15;
      enemy.xpValue = 6;
      const hbW = this.hdMode ? 64 : 22;
      const hbH = this.hdMode ? 38 : 14;
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(Math.max(0, (enemy.width - hbW) / 2), Math.max(0, enemy.height - hbH - 3));
    } else if (archetype === 'fast') {
      enemy.baseScale = this.hdMode ? 0.330 : 1.19;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(38 * hpScale);
      enemy.speed = 96 * speedScale;
      enemy.damage = 10;
      enemy.xpValue = 3;
      const hbW = this.hdMode ? 58 : 20;
      const hbH = this.hdMode ? 32 : 11;
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(Math.max(0, (enemy.width - hbW) / 2), Math.max(0, enemy.height - hbH - 3));
    } else if (archetype === 'archer') {
      enemy.baseScale = this.hdMode ? 0.322 : 1.18;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(42 * hpScale);
      enemy.speed = 62 * speedScale;
      enemy.damage = 10;
      enemy.xpValue = 4;
      enemy.archerCooldown = 1.6 + Math.random() * 0.9;
      enemy.archerWindup = 0;
      const hbW = this.hdMode ? 54 : 18;
      const hbH = this.hdMode ? 32 : 11;
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(Math.max(0, (enemy.width - hbW) / 2), Math.max(0, enemy.height - hbH - 3));
    } else if (archetype === 'shaman') {
      enemy.baseScale = this.hdMode ? 0.338 : 1.24;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(64 * hpScale);
      enemy.speed = 54 * speedScale;
      enemy.damage = 11;
      enemy.xpValue = 6;
      enemy.summonCooldown = 2.4 + Math.random() * 1.4;
      const hbW = this.hdMode ? 56 : 20;
      const hbH = this.hdMode ? 34 : 12;
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(Math.max(0, (enemy.width - hbW) / 2), Math.max(0, enemy.height - hbH - 3));
    } else if (archetype === 'bomber') {
      enemy.baseScale = this.hdMode ? 0.330 : 1.22;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(48 * hpScale);
      enemy.speed = 76 * speedScale;
      enemy.damage = 14;
      enemy.xpValue = 5;
      const hbW = this.hdMode ? 56 : 19;
      const hbH = this.hdMode ? 34 : 12;
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(Math.max(0, (enemy.width - hbW) / 2), Math.max(0, enemy.height - hbH - 3));
    } else if (archetype === 'stalker') {
      enemy.baseScale = this.hdMode ? 0.332 : 1.22;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(52 * hpScale);
      enemy.speed = 84 * speedScale;
      enemy.damage = 13;
      enemy.xpValue = 5;
      enemy.dashCooldown = 1.8 + Math.random();
      const hbW = this.hdMode ? 56 : 19;
      const hbH = this.hdMode ? 34 : 12;
      enemy.body.setSize(hbW, hbH);
      enemy.body.setOffset(Math.max(0, (enemy.width - hbW) / 2), Math.max(0, enemy.height - hbH - 3));
    } else if (archetype === 'berserker') {
      enemy.baseScale = this.hdMode ? 0.345 : 1.28;
      enemy.setScale(enemy.baseScale);
      enemy.maxHp = Math.round(88 * hpScale);
      enemy.speed = 70 * speedScale;
      enemy.damage = 15;
      enemy.xpValue = 6;
      enemy.chargeCooldown = 2.4 + Math.random();
      enemy.chargeWindup = 0;
      enemy.chargeTime = 0;
      enemy.chargeVx = 0;
      enemy.chargeVy = 0;
      const hbW = this.hdMode ? 62 : 22;
      const hbH = this.hdMode ? 36 : 13;
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
    enemy.waveIdx = waveIdx;
    enemy.isBoss = false;
    enemy.isMiniBoss = false;
    enemy.knockbackTimer = 0;
    enemy.flashTimer = 0;
    enemy.bladeCooldown = 0;
    enemy.walkPhase = Math.random() * 4;
    this._refreshEnemySpriteMetrics(enemy);
    enemy.setDepth(computeEntityDepth(sy));

    this.encounteredEnemies?.add(archetype);

    const shOffset = (archetype === 'tank' || archetype === 'shieldbearer') ? 23 : 15;
    if (!enemy.shadow) {
      enemy.shadow = this.add.image(sx, sy + shOffset, 'shadow_ellipse').setDepth(DEPTH_LAYERS.SHADOWS).setAlpha(0.42);
    } else {
      enemy.shadow.setPosition(sx, sy + shOffset).setVisible(true).setDepth(DEPTH_LAYERS.SHADOWS);
    }
    const shScale = this.hdMode
      ? (archetype === 'tank' || archetype === 'shieldbearer') ? 0.38 : 0.28
      : (archetype === 'tank' || archetype === 'shieldbearer') ? 1.54 : 1.08;
    enemy.shadow.setScale(shScale);

    swapPopPush(this.activeEnemies, enemy, '_poolIdx');
    return enemy;
  }

  _spawnMiniBoss(idx = 0) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 280;
    const bx = this.hero.x + Math.cos(ang) * dist;
    const by = this.hero.y + Math.sin(ang) * dist;

    if (this.activeEnemies.length >= GAME_CONFIG.MAX_ENEMIES) {
      const drop = this.activeEnemies[this.activeEnemies.length - 1];
      if (drop) this._recycleEnemy(drop);
    }

    const realm = this.activeRealm || getRealmConfig('midgard');
    const ch = this.activeChallenge || getChallengeConfig('standard');
    const eliteKey = realm.enemyTexMap?.elite || 'enemy_elite';
    const elite = this.enemyPool.get(bx, by, eliteKey);
    if (!elite) return;

    elite.setTexture(eliteKey);
    elite.baseTexKey = eliteKey;
    elite.enableBody(true, bx, by, true, true);
    elite.baseScale = this.hdMode ? 0.385 : 1.44;
    elite.setScale(elite.baseScale);
    elite.clearTint();
    elite.setAlpha(1);
    elite.setVisible(true);
    elite.isBoss = false;
    elite.isMiniBoss = true;
    elite.archetype = 'elite';
    elite.maxHp = Math.round((620 + idx * 340) * (realm.hpMult || 1.0) * (ch.hpMult || 1.0));
    elite.hp = elite.maxHp;
    elite.speed = Math.round((66 + idx * 4) * (realm.speedMult || 1.0) * (ch.speedMult || 1.0));
    elite.damage = 20;
    elite.xpValue = 25;
    elite.knockbackTimer = 0;
    elite.flashTimer = 0;
    elite.bladeCooldown = 0;
    elite.freezeTimer = 0;
    elite.walkPhase = 0;
    elite.setDepth(computeEntityDepth(by));
    this._refreshEnemySpriteMetrics(elite);

    if (!elite.shadow) {
      elite.shadow = this.add.image(bx, by + 28, 'shadow_ellipse').setDepth(DEPTH_LAYERS.SHADOWS).setAlpha(0.5);
    } else {
      elite.shadow.setPosition(bx, by + 28).setVisible(true).setDepth(DEPTH_LAYERS.SHADOWS);
    }
    elite.shadow.setScale(this.hdMode ? 0.52 : 1.9);

    this.activeMiniBoss = elite;
    swapPopPush(this.activeEnemies, elite, '_poolIdx');
    audio.playBossAlarm();
    const titles = realm.miniBossTitles || ['Campione Jotun', 'Valkiria Caduta', 'Signore delle Ceneri'];
    elite.displayName = `${titles[idx % titles.length]} (Elite)`;
    this.bridge?.onBossHudUpdate?.({
      name: elite.displayName,
      hp: elite.hp,
      maxHp: elite.maxHp,
      phase: 1,
      phaseLabel: 'ELITE'
    });
    if (idx === 0) {
      this._emitDialogue('miniboss_0');
    }
  }

  async _triggerBossSequence() {
    this.bossSpawned = true;
    this.gameState = 'CUTSCENE';
    this.physics.pause();
    this._resetJoystick();

    const realm = this.activeRealm || getRealmConfig('midgard');
    audio.playBossAlarm();
    triggerHaptic(40, this.settings);
    this.bridge?.onBossWarning?.(true, realm.boss.warningText);

    await new Promise((r) => setTimeout(r, 1200));
    this.bridge?.onBossWarning?.(false);

    if (this.storyManager && (this.bossesDefeatedCount || 0) === 0) {
      await this.storyManager.play('onBossSpawn', this.activeHeroId, this.activeRealmId);
    }

    this._spawnBoss();
    this._emitDialogue('boss_enter');
    this.gameState = 'PLAYING';
    this.physics.resume();
    this._shake(300, 0.008);
  }

  _spawnBoss() {
    const bx = this.hero.x;
    const by = this.hero.y - 250;

    if (this.activeEnemies.length >= GAME_CONFIG.MAX_ENEMIES) {
      const drop = this.activeEnemies[this.activeEnemies.length - 1];
      if (drop) this._recycleEnemy(drop);
    }

    const realm = this.activeRealm || getRealmConfig('midgard');
    const ch = this.activeChallenge || getChallengeConfig('standard');
    const bossCfg = realm.boss;
    const bossTex = realm.enemyTexMap?.boss || 'boss';
    const boss = this.enemyPool.get(bx, by, bossTex);
    if (!boss) return;

    boss.setTexture(bossTex);
    boss.baseTexKey = bossTex;
    boss.enableBody(true, bx, by, true, true);
    boss.clearTint();
    boss.setAlpha(1);
    boss.setVisible(true);
    boss.isBoss = true;
    boss.isMiniBoss = false;
    boss.archetype = 'boss';
    const endlessBossScale = this.runMode === 'endless' && (this.bossesDefeatedCount || 0) > 0
      ? 1 + this.bossesDefeatedCount * 0.65
      : 1;
    boss.maxHp = Math.round(bossCfg.maxHp * (ch.hpMult || 1.0) * endlessBossScale);
    boss.hp = boss.maxHp;
    boss.speed = Math.round(bossCfg.speed * (ch.speedMult || 1.0));
    boss.damage = bossCfg.damage;
    boss.displayName = bossCfg.name;
    boss.attackProfile = bossCfg.attackProfile;
    boss.phase = 1;
    boss.isTransformed = false;
    boss.xpValue = 60;
    boss.knockbackTimer = 0;
    boss.flashTimer = 0;
    boss.bladeCooldown = 0;
    boss.freezeTimer = 0;
    boss.walkPhase = 0;
    boss.setDepth(computeEntityDepth(by));
    this._refreshBossSpriteMetrics(boss);

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
    this.bossHalfHpTriggered = false;
    this.bossTransformed = false;
    this.bossAttackStep = 0;
    if (this.textures.exists('glow_soft')) {
      if (!this.bossGlow) {
        this.bossGlow = this.add.image(bx, by + 16, 'glow_soft').setDepth(DEPTH_LAYERS.AURA - 4).setScale(1.85).setAlpha(0.32);
        if (globalThis.Phaser?.BlendModes?.ADD !== undefined) {
          this.bossGlow.setBlendMode?.(Phaser.BlendModes.ADD);
        }
      }
      const bossGlowCol = realm.boss?.telegraphColor || 0xf87171;
      this.bossGlow.setPosition(bx, by + 16).setVisible(true).setTint?.(bossGlowCol);
    }
    swapPopPush(this.activeEnemies, boss, '_poolIdx');
    this.bridge?.onBossHudUpdate?.(this.bossController.getHudPayload(boss));
  }

  _damageEnemy(enemy, amount, dirX, dirY, knockbackForce, isCrit, sparkColor = 0xfef08a, sourceId = null, bypassShield = false) {
    if (!enemy.active) return;

    let finalAmount = amount;
    let finalKnockback = knockbackForce;
    let blockedFrontal = false;

    if (enemy.archetype === 'shieldbearer' && !bypassShield && (dirX !== 0 || dirY !== 0)) {
      const toHeroX = this.hero.x - enemy.x;
      const toHeroY = this.hero.y - enemy.y;
      const dirLen = Math.hypot(dirX, dirY) || 1;
      const heroLen = Math.hypot(toHeroX, toHeroY) || 1;
      const dot = (dirX * toHeroX + dirY * toHeroY) / (dirLen * heroLen);
      if (dot < -0.25) {
        blockedFrontal = true;
        finalAmount = Math.max(1, Math.round(amount * 0.35));
        finalKnockback = Math.round(knockbackForce * 0.5);
        audio.playShieldBlock();
      }
    }

    const effectiveDmg = Math.max(0, Math.min(enemy.hp, finalAmount));
    if (sourceId && effectiveDmg > 0) {
      if (!this.weaponDamageStats) this.weaponDamageStats = {};
      this.weaponDamageStats[sourceId] = (this.weaponDamageStats[sourceId] || 0) + effectiveDmg;
    }

    enemy.hp -= finalAmount;
    enemy.setTintFill(blockedFrontal ? 0x94a3b8 : 0xffffff);
    enemy.flashTimer = 0.08;

    const kbFactor = enemy.isBoss ? 0.08 : enemy.isMiniBoss ? 0.22 : (enemy.archetype === 'tank' || enemy.archetype === 'shieldbearer') ? 0.42 : 1;
    const len = Math.hypot(dirX, dirY) || 1;
    if (finalKnockback > 0 && kbFactor > 0) {
      enemy.setVelocity((dirX / len) * finalKnockback * kbFactor, (dirY / len) * finalKnockback * kbFactor);
      enemy.knockbackTimer = 0.11;
    }

    this._emitSparks(enemy.x, enemy.y - 4, isCrit ? 7 : 4, blockedFrontal ? 0x94a3b8 : sparkColor, isCrit ? 120 : 80);
    this._spawnDamageText(enemy.x, enemy.y - 18, finalAmount, isCrit && !blockedFrontal);
    if (!blockedFrontal) audio.playHit(isCrit);

    if (isCrit && !blockedFrontal) {
      this._shake(65, 0.0028);
    }

    if (enemy.isBoss) {
      this.bossController.onBossDamaged(enemy);
    } else if (enemy.isMiniBoss && !this.bossSpawned) {
      this.bridge?.onBossHudUpdate?.({
        name: enemy.displayName || 'Campione Elite',
        hp: Math.max(0, enemy.hp),
        maxHp: enemy.maxHp,
        phase: 1,
        phaseLabel: 'ELITE'
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
    const wasMiniBoss = enemy.isMiniBoss;
    const wasBomber = enemy.archetype === 'bomber' && !enemy.bomberTriggered;
    const burstColor = enemy.archetype === 'fast' ? 0x818cf8 : enemy.archetype === 'tank' ? 0xf87171 : enemy.archetype === 'elite' ? 0xfbbf24 : enemy.archetype === 'bomber' ? 0xf97316 : 0x38bdf8;

    this._emitSparks(ex, ey, wasBoss ? 28 : wasMiniBoss ? 18 : 8, burstColor, wasBoss ? 210 : 120);
    this.kills += 1;
    if (wasBomber) {
      enemy.bomberTriggered = true;
      this._spawnGroundMark('scorch', ex, ey, 54, 0xf97316);
      this.activeTelegraphs.push({
        x: ex,
        y: ey,
        radius: 66,
        elapsed: 0,
        duration: 0.75,
        color: 0xf97316,
        damage: 24
      });
    }
    this._recycleEnemy(enemy);
    this._spawnXpGem(ex, ey, xpVal);

    if (wasMiniBoss) {
      this.miniBossesSlain += 1;
      if (this.activeMiniBoss === enemy) {
        this.activeMiniBoss = null;
        if (!this.bossSprite?.active) this.bridge?.onBossHudUpdate?.(null);
      }
      this._spawnPickup(ex, ey, 'chest');
    }

    if (wasBoss && !this.bossDefeated) {
      this._onBossDefeated(ex, ey);
    }
  }

  async _onBossDefeated(ex = this.hero.x, ey = this.hero.y) {
    this.bossesDefeatedCount = (this.bossesDefeatedCount || 0) + 1;
    this.bossSprite = null;
    if (this.bossGlow) this.bossGlow.setVisible(false);
    this.activeTelegraphs.length = 0;
    this.telegraphGfx.clear();

    audio.playExplosion(1.0);
    this._shake(450, 0.015);
    this.bridge?.onBossHudUpdate?.(null);

    if (this.runMode === 'endless') {
      this.bossDefeated = false;
      this.nextEndlessBossSec = this.elapsedSec + 180;
      this._spawnPickup(ex, ey, 'chest');
      this._spawnXpGem(ex - 16, ey + 8, 25);
      this._spawnXpGem(ex + 16, ey + 8, 25);
      this._syncHud();
      return;
    }

    this.bossDefeated = true;
    this.gameState = 'CUTSCENE';
    this.physics.pause();
    this._resetJoystick();

    await new Promise((r) => setTimeout(r, 700));
    audio.playVictory();

    if (this.storyManager) {
      await this.storyManager.play('onVictory', this.activeHeroId, this.activeRealmId);
    }

    this.gameState = 'ENDED';
    this.bridge?.onRunEnded?.(this._buildRunSummary(true));
  }

  _buildRunSummary(victory) {
    const combinedXpMult = Number(
      ((this.activeRealm?.xpBonusMult || 1.0) * (this.activeChallenge?.xpMult || 1.0)).toFixed(2)
    );
    return {
      victory,
      runMode: this.runMode || 'campaign',
      endlessWave: this.endlessWave || 0,
      realmId: this.activeRealmId,
      challengeId: this.activeChallengeId || 'standard',
      xpBonusMult: combinedXpMult,
      heroId: this.activeHeroId,
      startingWeaponId: this.activeWeaponId,
      elapsedSec: Math.floor(this.elapsedSec),
      kills: this.kills,
      level: this.stats.level,
      bossDefeated: Boolean(this.bossDefeated || (this.bossesDefeatedCount || 0) > 0),
      bossesDefeatedCount: this.bossesDefeatedCount || 0,
      miniBossesSlain: this.miniBossesSlain,
      cratesBroken: this.cratesBroken,
      shrinesActivated: this.shrinesActivated,
      evolutionsForged: this.evolutionsForged,
      skillsUsed: this.skillsUsed || 0,
      encounteredEnemies: Array.from(this.encounteredEnemies || []),
      damageBreakdown: this._getDamageBreakdown()
    };
  }

  _onEnemyTouchHero(enemy) {
    if (this.stats.invulnTimer > 0) return;

    const shieldMult = this.activeBuff?.id === 'frost_shield' ? 0.55 : 1;
    const ironMult = this.ironSkinTimer > 0 ? 0.25 : 1;
    const wardMult = Math.max(0.25, 1 - (this.stats.damageReduction || 0));
    const dmg = Math.max(1, Math.round((enemy.damage || 10) * shieldMult * ironMult * wardMult));
    this.stats.hp = Math.max(0, this.stats.hp - dmg);
    this.stats.invulnTimer = 0.48;
    audio.playPlayerHurt();
    triggerHaptic(30, this.settings);
    this._shake(120, 0.006);
    this._emitSparks(this.hero.x, this.hero.y, 8, 0xef4444, 110);
    this.hero.setTintFill(0xef4444);
    this.time.delayedCall(90, () => {
      if (this.hero && this.hero.active) this.hero.clearTint();
    });

    if (this.stats.hp <= 0) {
      if ((this.stats.revivalsLeft || 0) > 0) {
        this._triggerAltarRevival();
        return;
      }
      this._triggerGameOver();
    }
  }

  _triggerAltarRevival() {
    this.stats.revivalsLeft = Math.max(0, (this.stats.revivalsLeft || 1) - 1);
    this.stats.hp = Math.max(1, Math.round(this.stats.maxHp * 0.5));
    this.stats.invulnTimer = 2.6;
    audio.playRevival();
    triggerHaptic([35, 40, 50], this.settings);
    this._shake(220, 0.01);
    this.hero.clearTint();
    this._emitSparks(this.hero.x, this.hero.y, 26, 0xfbbf24, 220);
    this.activeExplosions.push({ x: this.hero.x, y: this.hero.y, maxR: 210, life: 0, dur: 0.48, color: 0xfbbf24 });

    for (const e of this.activeEnemies) {
      if (!e.active || e.isBoss) continue;
      const dx = e.x - this.hero.x;
      const dy = e.y - this.hero.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < 220 * 220) {
        const dist = Math.sqrt(dSq) || 1;
        e.knockbackTimer = 0.3;
        e.setVelocity((dx / dist) * 290, (dy / dist) * 290);
      }
    }

    this.bridge?.onDialogue?.({
      triggerKey: 'altar_revival',
      speaker: 'Fiamma del Valhalla',
      role: 'Altare delle Rune',
      text: 'Le rune eterne ti rialzano dalla polvere! (+50% HP)',
      accent: '#fbbf24'
    });
    this._syncHud();
  }

  async _triggerGameOver() {
    if (this.gameState === 'ENDED' || this.gameState === 'CUTSCENE') return;
    this.gameState = 'CUTSCENE';
    this.physics.pause();
    this._resetJoystick();
    audio.playGameOver();

    if (this.storyManager) {
      await this.storyManager.play('onGameOver', this.activeHeroId, this.activeRealmId);
    }

    this.gameState = 'ENDED';
    this.bridge?.onRunEnded?.(this._buildRunSummary(false));
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
        if (e.flashTimer <= 0 && !(e.freezeTimer > 0)) e.clearTint();
      }
      if (e.bladeCooldown > 0) e.bladeCooldown -= dt;

      const dx = hx - e.x;
      const dy = hy - e.y;
      const dSq = dx * dx + dy * dy;

      if (!e.isBoss && !e.isMiniBoss && dSq > recycleDistSq) {
        const ang = Math.random() * Math.PI * 2;
        e.setPosition(hx + Math.cos(ang) * 380, hy + Math.sin(ang) * 380);
      }

      if (e.freezeTimer > 0) {
        e.freezeTimer -= dt;
        if (e.freezeTimer <= 0) e.clearTint();
      }

      if (e.knockbackTimer > 0) {
        e.knockbackTimer -= dt;
      } else if (e.freezeTimer > 0 && !e.isBoss) {
        e.setVelocity(0, 0);
      } else if (e.archetype === 'archer') {
        const dist = Math.sqrt(dSq) || 1;
        e.setFlipX(dx < 0);
        if (e.archerWindup > 0) {
          e.archerWindup -= dt;
          e.setVelocity(0, 0);
          if (e.archerWindup <= 0) {
            e.clearTint();
            this._fireEnemyFrostArrow(e, hx, hy);
            e.archerCooldown = 2.4;
          }
        } else {
          if (dist > 235) {
            e.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
          } else if (dist < 155) {
            e.setVelocity(-(dx / dist) * e.speed * 0.75, -(dy / dist) * e.speed * 0.75);
          } else {
            e.setVelocity((-dy / dist) * e.speed * 0.45, (dx / dist) * e.speed * 0.45);
          }
          e.archerCooldown -= dt;
          if (e.archerCooldown <= 0 && dist <= 280) {
            e.archerWindup = 0.42;
            e.setTintFill(0x7dd3fc);
          }
        }
      } else if (e.archetype === 'shaman') {
        const dist = Math.sqrt(dSq) || 1;
        e.setFlipX(dx < 0);
        if (e.summonWindup > 0) {
          e.summonWindup -= dt;
          e.setVelocity(0, 0);
          if (e.summonWindup <= 0) {
            e.clearTint();
            e.summonCooldown = 4.2;
            const maxToSpawn = Math.min(2, Math.max(0, 6 - (e.summonCount || 0)));
            for (let s = 0; s < maxToSpawn; s++) {
              if (this.activeEnemies.length >= GAME_CONFIG.MAX_ENEMIES) break;
              const ang = Math.atan2(dy, dx) + (s === 0 ? -0.65 : 0.65);
              const minion = this._spawnEnemy('swarm', e.waveIdx || 0, ang, Math.max(80, dist - 28));
              if (minion) {
                minion.setPosition(e.x + Math.cos(ang) * 32, e.y + Math.sin(ang) * 32);
                e.summonCount = (e.summonCount || 0) + 1;
              }
            }
            this._emitSparks(e.x, e.y - 6, 10, 0xc084fc, 110);
          }
        } else {
          if (dist > 250) {
            e.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
          } else if (dist < 170) {
            e.setVelocity(-(dx / dist) * e.speed * 0.8, -(dy / dist) * e.speed * 0.8);
          } else {
            e.setVelocity((-dy / dist) * e.speed * 0.4, (dx / dist) * e.speed * 0.4);
          }
          e.summonCooldown -= dt;
          if (e.summonCooldown <= 0 && dist < 310 && (e.summonCount || 0) < 6 && this.activeEnemies.length < GAME_CONFIG.MAX_ENEMIES) {
            e.summonWindup = 0.6;
            e.setTintFill(0xc084fc);
          }
        }
      } else if (e.archetype === 'bomber') {
        const dist = Math.sqrt(dSq) || 1;
        e.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
        e.setFlipX(dx < 0);
        if (dist <= 46 && !e.bomberTriggered) {
          this._killEnemy(e);
          continue;
        }
      } else if (e.archetype === 'stalker') {
        const dist = Math.sqrt(dSq) || 1;
        if (e.dashTime > 0) {
          e.dashTime -= dt;
          e.setVelocity(e.dashVx, e.dashVy);
        } else {
          e.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
          e.setFlipX(dx < 0);
          e.dashCooldown -= dt;
          if (e.dashCooldown <= 0 && dist >= 85 && dist <= 245) {
            e.dashTime = 0.28;
            e.dashCooldown = 2.6;
            const side = Math.random() < 0.5 ? 1 : -1;
            const baseAng = Math.atan2(dy, dx) + side * 0.72;
            e.dashVx = Math.cos(baseAng) * 235;
            e.dashVy = Math.sin(baseAng) * 235;
            this._emitSparks(e.x, e.y, 5, 0xe879f9, 85);
          }
        }
      } else if (e.archetype === 'berserker') {
        const dist = Math.sqrt(dSq) || 1;
        if (e.chargeTime > 0) {
          e.chargeTime -= dt;
          e.setVelocity(e.chargeVx, e.chargeVy);
          if (e.chargeTime <= 0) e.clearTint();
        } else if (e.chargeWindup > 0) {
          e.chargeWindup -= dt;
          e.setVelocity(0, 0);
          if (e.chargeWindup <= 0) {
            e.chargeTime = 0.55;
            e.chargeVx = (dx / dist) * 215;
            e.chargeVy = (dy / dist) * 215;
          }
        } else {
          e.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
          e.setFlipX(dx < 0);
          e.chargeCooldown -= dt;
          if (e.chargeCooldown <= 0 && dist < 210 && dist > 55) {
            e.chargeWindup = 0.45;
            e.chargeCooldown = 3.8;
            e.setTintFill(0xf87171);
          }
        }
      } else {
        const dist = Math.sqrt(dSq) || 1;
        e.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
        e.setFlipX(dx < 0);
      }

      const eFrameCount = e.baseTexKey ? (this.customWalkFrameCounts?.get(e.baseTexKey) || 4) : 4;
      const walkCadence = e.isBoss ? (eFrameCount >= 8 ? 7.8 : 5.5) : 8.5;
      e.walkPhase += dt * walkCadence;
      if (e.baseTexKey) {
        this._applyWalkTextureFrame(e, e.baseTexKey, e.walkPhase, true);
      }
      const baseScale =
        e.baseScale ||
        (e.isBoss
          ? this.hdMode ? 0.413 : 1.60
          : (e.archetype === 'tank' || e.archetype === 'shieldbearer')
            ? this.hdMode ? 0.363 : 1.34
            : this.hdMode ? 0.322 : 1.19);
      const cycleTheta = e.isBoss && eFrameCount >= 8
        ? ((e.walkPhase % eFrameCount) / eFrameCount) * Math.PI * 2
        : e.walkPhase * 1.4;
      const wobble = Math.sin(cycleTheta);
      e.setScale(baseScale * (1 - Math.abs(wobble) * 0.025), baseScale * (1 + Math.abs(wobble) * 0.035));
      if (e.isBoss) {
        e.setAngle(wobble * 1.9);
      }

      e.setDepth(computeEntityDepth(e.y));
      if (e.shadow) {
        e.shadow.setPosition(e.x, e.y + (e.isBoss ? 37 : e.isMiniBoss ? 28 : (e.archetype === 'tank' || e.archetype === 'shieldbearer') ? 23 : 15));
        if (e.isBoss) {
          const bossLift = Math.abs(wobble);
          const shBaseX = this.hdMode ? 0.73 : 2.97;
          const shBaseY = this.hdMode ? 0.48 : 1.87;
          e.shadow.setScale(shBaseX * (1 - bossLift * 0.12), shBaseY * (1 - bossLift * 0.09));
          e.shadow.setAlpha(0.54 - bossLift * 0.10);
        }
      }
    }

    this.bossController.update(dt);
  }

  _updateTelegraphs(dt) {
    this.telegraphGfx.clear();
    if (this.activeTelegraphs.length === 0) return;

    for (let i = this.activeTelegraphs.length - 1; i >= 0; i--) {
      const t = this.activeTelegraphs[i];
      t.elapsed += dt;
      if (t.elapsed < 0) continue;
      const progress = Math.min(1, t.elapsed / t.duration);
      const col = t.color || 0xf87171;

      this.telegraphGfx.lineStyle(2.5, col, 0.92);
      this.telegraphGfx.fillStyle(col, 0.14);
      this.telegraphGfx.fillCircle(t.x, t.y, t.radius);
      this.telegraphGfx.strokeCircle(t.x, t.y, t.radius);

      this.telegraphGfx.fillStyle(col, 0.36);
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
    const col = t.color || 0xf87171;
    audio.playBossAttack();
    this._shake(160, 0.0075);
    this._emitSparks(t.x, t.y, 16, col, 180);
    const markKind = col === 0xa855f7 || col === 0x34d399 || col === 0xfbbf24 ? 'rune' : col === 0xfb923c ? 'scorch' : 'fissure';
    this._spawnGroundMark(markKind, t.x, t.y, Math.max(36, t.radius * 0.78), col);

    const ring = this.add
      .circle(t.x, t.y, t.radius, col, 0.48)
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
      const ironMult = this.ironSkinTimer > 0 ? 0.25 : 1;
      const dmg = Math.max(1, Math.round((t.damage || 26) * ironMult));
      this.stats.hp = Math.max(0, this.stats.hp - dmg);
      this.stats.invulnTimer = 0.55;
      audio.playPlayerHurt();
      triggerHaptic(30, this.settings);
      if (this.stats.hp <= 0) {
        this._triggerGameOver();
      }
    }
  }

  _fireEnemyFrostArrow(archer, targetX, targetY) {
    const projKey = this.activeRealm?.rangedProjKey || 'frost_arrow';
    const tex = this.textures.exists(projKey) ? projKey : 'frost_arrow';
    const proj = this.enemyProjPool.get(archer.x, archer.y, tex);
    if (!proj) return;
    const ang = Math.atan2(targetY - archer.y, targetX - archer.x);
    const speed = 185;
    proj.setTexture(tex);
    proj.enableBody(true, archer.x, archer.y, true, true);
    proj.setScale(this.hdMode ? 0.36 : 1.1);
    proj.setRotation(ang);
    proj.setDepth(DEPTH_LAYERS.VFX - 5);
    proj.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
    proj.life = 2.6;
    proj.damage = archer.damage || 11;
    swapPopPush(this.activeEnemyProjectiles, proj, '_poolIdx');
  }

  _updateEnemyProjectiles(dt) {
    const hx = this.hero.x;
    const hy = this.hero.y;
    const hitSq = 15 * 15;
    for (let i = this.activeEnemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.activeEnemyProjectiles[i];
      if (!ep.active) continue;
      ep.life -= dt;
      ep.setDepth(computeEntityDepth(ep.y) + 15);
      if (computeSquaredDistance(hx, hy, ep.x, ep.y) <= hitSq) {
        this._onEnemyTouchHero({ damage: ep.damage || 11 });
        ep.disableBody(true, true);
        swapPopRemove(this.activeEnemyProjectiles, ep, '_poolIdx');
        continue;
      }
      if (ep.life <= 0) {
        ep.disableBody(true, true);
        swapPopRemove(this.activeEnemyProjectiles, ep, '_poolIdx');
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
      } else if (p.kind === 'scythe') {
        p.angle += 780 * dt;
        const halfLife = (p.maxLife || 1.55) * 0.55;
        if (!p.returning && p.life <= halfLife) {
          p.returning = true;
          if (p.hitSet) p.hitSet.clear();
        }
        if (p.returning) {
          const ang = Math.atan2(this.hero.y - p.y, this.hero.x - p.x);
          const retSpd = (p.outSpeed || 360) * 1.15;
          p.setVelocity(Math.cos(ang) * retSpd, Math.sin(ang) * retSpd);
          if (computeSquaredDistance(this.hero.x, this.hero.y, p.x, p.y) <= 22 * 22) {
            this._recycleProjectile(p);
            continue;
          }
        }
      } else if (p.kind === 'orb') {
        const obs = p.baseScale || 1.15;
        const pulse = obs * (1.0 + Math.sin(this.elapsedSec * 14) * 0.12);
        p.setScale(pulse);
      }
      p.setDepth(computeEntityDepth(p.y) + 25);

      if (this._damageCratesInRadius(p.x, p.y, 26) && p.kind === 'orb') {
        this.activeExplosions.push({ x: p.x, y: p.y, maxR: p.blastRadius || 48, life: 0, dur: 0.25, color: 0x38bdf8 });
        this._spawnGroundMark('scorch', p.x, p.y, (p.blastRadius || 48) * 0.72, 0x38bdf8);
        this._recycleProjectile(p);
        continue;
      }

      if (this.settings?.vfxQuality !== 'reduced') {
        if (!p.trail) p.trail = [];
        p.ribbonTimer = (p.ribbonTimer || 0) - dt;
        if (p.ribbonTimer <= 0) {
          p.ribbonTimer = 0.018;
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 6) p.trail.shift();
        }
      }

      p.trailTimer -= dt;
      if (p.trailTimer <= 0) {
        p.trailTimer = p.kind === 'dagger' || p.kind === 'spear' ? 0.03 : 0.045;
        const trailCol = p.kind === 'dagger' ? 0xe879f9 : p.kind === 'orb' ? 0x38bdf8 : p.kind === 'scythe' ? 0xc084fc : p.kind === 'fangs' ? 0xd8b4fe : 0xfbbf24;
        this._emitSparks(p.x, p.y, 1, trailCol, 24);
      }

      if (p.life <= 0) {
        this._recycleProjectile(p);
      }
    }
  }

  _updateVfx(dt) {
    this.vfxGfx.clear();

    // Scie luminose affusolate dietro ai proiettili attivi
    if (this.settings?.vfxQuality !== 'reduced') {
      for (let i = 0; i < this.activeProjectiles.length; i++) {
        const p = this.activeProjectiles[i];
        if (!p.active || !p.trail || p.trail.length === 0) continue;
        const trailCol = p.evolved
          ? 0xfde047
          : p.kind === 'dagger'
            ? 0xe879f9
            : p.kind === 'orb'
              ? 0x38bdf8
              : p.kind === 'scythe'
                ? 0xc084fc
                : p.kind === 'spear'
                  ? 0x7dd3fc
                  : p.kind === 'fangs'
                    ? 0xd8b4fe
                    : 0xfbbf24;
        const len = p.trail.length;
        for (let k = 0; k < len; k++) {
          const ptA = p.trail[k];
          const ptB = k + 1 < len ? p.trail[k + 1] : p;
          const frac = (k + 1) / (len + 1);
          const width = (p.kind === 'orb' ? 6.5 : p.kind === 'axe' || p.kind === 'scythe' ? 4.8 : 3.4) * frac;
          this.vfxGfx.lineStyle(width, trailCol, frac * 0.52);
          this.vfxGfx.beginPath();
          this.vfxGfx.moveTo(ptA.x, ptA.y);
          this.vfxGfx.lineTo(ptB.x, ptB.y);
          this.vfxGfx.strokePath();
        }
      }
    }

    for (let i = this.activeAuraPulses.length - 1; i >= 0; i--) {
      const p = this.activeAuraPulses[i];
      p.life += dt;
      const t = p.life / p.dur;
      if (t >= 1) {
        this.activeAuraPulses.splice(i, 1);
        continue;
      }
      const r = p.maxR * (0.45 + t * 0.65);
      this.vfxGfx.lineStyle(2.5, p.color || 0xe879f9, (1 - t) * 0.75);
      this.vfxGfx.strokeCircle(p.x, p.y, r);
    }

    for (let i = (this.activeAstralPillars?.length || 0) - 1; i >= 0; i--) {
      const pl = this.activeAstralPillars[i];
      pl.life += dt;
      const t = pl.life / pl.dur;
      if (t >= 1) {
        this.activeAstralPillars.splice(i, 1);
        continue;
      }
      const alpha = 1 - t;
      const col = pl.color || 0x60a5fa;
      const w = pl.radius * 0.42 * (1 - t * 0.35);
      this.vfxGfx.fillStyle(col, alpha * 0.32);
      this.vfxGfx.fillRect(pl.x - w, pl.y - 210, w * 2, 210);
      this.vfxGfx.fillStyle(0xe0f2fe, alpha * 0.55);
      this.vfxGfx.fillRect(pl.x - w * 0.35, pl.y - 210, w * 0.7, 210);
    }

    for (let i = this.activeExplosions.length - 1; i >= 0; i--) {
      const ex = this.activeExplosions[i];
      ex.life += dt;
      const t = ex.life / ex.dur;
      if (t >= 1) {
        this.activeExplosions.splice(i, 1);
        continue;
      }
      if (t < 0) continue;
      const r = ex.maxR * (0.35 + t * 0.72);
      const alpha = 1 - t;
      this.vfxGfx.fillStyle(ex.color, alpha * 0.28);
      this.vfxGfx.fillCircle(ex.x, ex.y, r);
      this.vfxGfx.lineStyle(2.5, 0xe0f2fe, alpha * 0.9);
      this.vfxGfx.strokeCircle(ex.x, ex.y, r);
    }

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

    for (let i = this.activeLightnings.length - 1; i >= 0; i--) {
      const bolt = this.activeLightnings[i];
      bolt.life += dt;
      const t = bolt.life / bolt.dur;
      if (t >= 1) {
        this.activeLightnings.splice(i, 1);
        continue;
      }
      const alpha = 1 - t;

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

      this.vfxGfx.fillStyle(0x38bdf8, alpha * 0.25);
      this.vfxGfx.fillCircle(bolt.x, bolt.y, bolt.radius * (0.85 + t * 0.2));
      this.vfxGfx.lineStyle(2, 0xe0f2fe, alpha * 0.9);
      this.vfxGfx.strokeCircle(bolt.x, bolt.y, bolt.radius * (0.85 + t * 0.2));
    }

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
    const targetCount = this.settings?.vfxQuality === 'reduced'
      ? Math.max(1, Math.ceil(count * 0.5))
      : count;
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
      if (spawned >= targetCount) break;
    }
  }

  _generateAtmosphereTextures() {
    if (!this.textures || typeof document === 'undefined') return;
    if (!this.textures.exists('glow_soft')) {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.42)');
      grad.addColorStop(0.75, 'rgba(255,255,255,0.10)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      this.textures.addCanvas('glow_soft', c);
    }
    if (!this.textures.exists('vignette_overlay')) {
      const w = 450;
      const h = 800;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.48, w * 0.34, w * 0.5, h * 0.5, h * 0.64);
      grad.addColorStop(0, 'rgba(2, 6, 16, 0)');
      grad.addColorStop(0.62, 'rgba(2, 6, 16, 0.14)');
      grad.addColorStop(1, 'rgba(2, 6, 16, 0.64)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      this.textures.addCanvas('vignette_overlay', c);
    }
  }

  _spawnGroundMark(kind, x, y, radius = 44, color = 0xfbbf24) {
    if (!this.activeGroundMarks) this.activeGroundMarks = [];
    if (this.activeGroundMarks.length >= 26) {
      this.activeGroundMarks.shift();
    }
    this.activeGroundMarks.push({
      kind: kind || 'fissure',
      x,
      y,
      radius,
      color,
      life: 0,
      dur: kind === 'rune' ? 2.6 : 2.2,
      seed: Math.random() * Math.PI * 2
    });
  }

  _updateGroundMarks(dt) {
    if (!this.groundMarksGfx) return;
    this.groundMarksGfx.clear();
    if (!this.activeGroundMarks || this.activeGroundMarks.length === 0) return;

    for (let i = this.activeGroundMarks.length - 1; i >= 0; i--) {
      const m = this.activeGroundMarks[i];
      m.life += dt;
      const t = m.life / m.dur;
      if (t >= 1) {
        this.activeGroundMarks.splice(i, 1);
        continue;
      }
      const fade = Math.pow(1 - t, 1.35);

      if (m.kind === 'scorch') {
        this.groundMarksGfx.fillStyle(0x090d16, 0.42 * fade);
        this.groundMarksGfx.fillCircle(m.x, m.y, m.radius * 0.68);
        this.groundMarksGfx.lineStyle(2.2, m.color, 0.48 * fade);
        this.groundMarksGfx.strokeCircle(m.x, m.y, m.radius * 0.78);
      } else if (m.kind === 'rune') {
        this.groundMarksGfx.lineStyle(2, m.color, 0.56 * fade);
        this.groundMarksGfx.strokeCircle(m.x, m.y, m.radius * 0.76);
        this.groundMarksGfx.beginPath();
        for (let r = 0; r < 6; r++) {
          const ang = m.seed + (r * Math.PI * 2) / 6;
          this.groundMarksGfx.moveTo(m.x + Math.cos(ang) * m.radius * 0.2, m.y + Math.sin(ang) * m.radius * 0.2);
          this.groundMarksGfx.lineTo(m.x + Math.cos(ang) * m.radius * 0.75, m.y + Math.sin(ang) * m.radius * 0.75);
        }
        this.groundMarksGfx.strokePath();
      } else {
        // Fessure radiali nel terreno (Martello / Flagello / Schianti)
        this.groundMarksGfx.fillStyle(0x090d16, 0.34 * fade);
        this.groundMarksGfx.fillCircle(m.x, m.y, m.radius * 0.34);
        this.groundMarksGfx.lineStyle(2.4, 0x090d16, 0.65 * fade);
        this.groundMarksGfx.beginPath();
        for (let f = 0; f < 6; f++) {
          const ang = m.seed + (f * Math.PI * 2) / 6;
          const midR = m.radius * 0.45;
          const endR = m.radius * 0.88;
          this.groundMarksGfx.moveTo(m.x, m.y);
          this.groundMarksGfx.lineTo(m.x + Math.cos(ang + 0.12) * midR, m.y + Math.sin(ang + 0.12) * midR);
          this.groundMarksGfx.lineTo(m.x + Math.cos(ang - 0.08) * endR, m.y + Math.sin(ang - 0.08) * endR);
        }
        this.groundMarksGfx.strokePath();
        this.groundMarksGfx.lineStyle(1.4, m.color, 0.42 * fade);
        this.groundMarksGfx.strokeCircle(m.x, m.y, m.radius * 0.42);
      }
    }
  }

  _updateAtmosphericGlows() {
    if (this.heroGlow && this.hero) {
      const hasBuff = (this.activeSkillBuffTimer || 0) > 0 || (this.ironSkinTimer || 0) > 0 || Boolean(this.activeBuff);
      const pulse = 1 + Math.sin(this.elapsedSec * (hasBuff ? 7 : 3.2)) * 0.12;
      this.heroGlow.setPosition(this.hero.x, this.hero.y + 8);
      this.heroGlow.setScale((hasBuff ? 1.48 : 1.12) * pulse);
      this.heroGlow.setAlpha(hasBuff ? 0.38 : 0.22);
    }
    if (this.bossGlow) {
      if (this.bossSprite && this.bossSprite.active) {
        const pulse = 1 + Math.sin(this.elapsedSec * 4.2) * 0.1;
        this.bossGlow.setPosition(this.bossSprite.x, this.bossSprite.y + 16);
        this.bossGlow.setScale((this.bossSprite.isTransformed ? 2.15 : 1.85) * pulse);
        this.bossGlow.setVisible(true);
      } else {
        this.bossGlow.setVisible(false);
      }
    }
    if (this.propItems) {
      for (let i = 0; i < this.propItems.length; i++) {
        const glow = this.propItems[i].glow;
        if (!glow || !glow.visible) continue;
        const flicker = 0.92 + Math.sin(this.elapsedSec * 6.5 + i * 1.7) * 0.08;
        glow.setAlpha((glow.baseAlpha || 0.26) * flicker);
      }
    }
  }

  _initWeatherMotes() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.weatherMotes = Array.from({ length: 30 }, (_, i) => ({
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

    const mode = this.activeRealm?.weatherMode || 'snow';
    const reduced = this.settings?.vfxQuality === 'reduced';
    const step = reduced ? 2 : 1;

    for (let i = 0; i < this.weatherMotes.length; i += step) {
      const m = this.weatherMotes[i];
      if (mode === 'embers') {
        m.x += m.vx * 0.6 * dt;
        m.y -= m.vy * 1.15 * dt;
      } else if (mode === 'spectral') {
        m.x += m.vx * 0.45 * dt;
        m.y -= m.vy * 0.55 * dt;
      } else if (mode === 'astral') {
        m.x += m.vx * 0.35 * dt;
        m.y -= m.vy * 0.65 * dt;
      } else {
        m.x += m.vx * dt;
        m.y += (m.isEmber ? -m.vy * 0.85 : m.vy) * dt;
      }
      if (m.x < -8) m.x = w + 8;
      if (m.x > w + 8) m.x = -8;
      if (m.y > h + 8) m.y = -8;
      if (m.y < -8) m.y = h + 8;

      const color =
        mode === 'embers'
          ? m.isEmber ? 0xfef08a : 0xf97316
          : mode === 'spectral'
            ? m.isEmber ? 0xc084fc : 0x34d399
            : mode === 'astral'
              ? m.isEmber ? 0x7dd3fc : 0xfbbf24
              : m.isEmber ? 0xfb923c : 0xe2e8f0;
      this.weatherGfx.fillStyle(color, m.alpha);
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
    swapPopPush(this.activeGems, gem, '_poolIdx');
  }

  _updateGems(dt) {
    if (this.gemComboTimer > 0) {
      this.gemComboTimer -= dt;
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
    const scaled = Math.max(1, Math.round(amount * (this.stats.xpGainMult || 1)));
    this.stats.xp += scaled;
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
    triggerHaptic(15, this.settings);

    const heroWeapons = (HERO_ROSTER[this.activeHeroId]?.weapons || []).map((w) => w.id);
    const evos = this._getAvailableEvolutions();
    const available = UPGRADE_CATALOG.filter((u) => {
      if (this.levels[u.id] >= u.maxLevel) return false;
      if (u.type === 'weapon' && heroWeapons.length > 0 && !heroWeapons.includes(u.id)) return false;
      return true;
    });
    Phaser.Utils.Array.Shuffle(available);

    const choices = [];
    if (evos.length > 0) {
      const evo = evos[0];
      choices.push({
        id: evo.id,
        weaponId: evo.weaponId,
        type: 'evolution',
        isEvolution: true,
        name: evo.name,
        accent: evo.accent,
        currentLevel: 5,
        nextLevel: 'MAX',
        description: evo.description,
        evoStatus: {
          status: 'evolved',
          badgeLabel: 'EVOLUZIONE',
          shortHint: `★ ${evo.name}`,
          accent: evo.accent
        }
      });
    }

    for (const u of available) {
      if (choices.length >= 3) break;
      const currentLv = this.levels[u.id];
      const nextLv = currentLv + 1;
      let evoStatus = null;
      if (u.type === 'weapon') {
        evoStatus = getWeaponEvolutionStatus(u.id, this.levels, this.evolvedWeapons);
      } else {
        const pairedEvo = Object.values(WEAPON_EVOLUTIONS).find(
          (e) => e.passiveId === u.id && (this.levels[e.weaponId] || 0) > 0 && !this.evolvedWeapons[e.weaponId]
        );
        if (pairedEvo) {
          const wName = UPGRADE_CATALOG.find((x) => x.id === pairedEvo.weaponId)?.name || pairedEvo.weaponId;
          evoStatus = {
            status: 'synergy',
            badgeLabel: 'SINERGIA',
            shortHint: `Evolve ${wName} → ${pairedEvo.name}`,
            accent: pairedEvo.accent
          };
        }
      }
      choices.push({
        ...u,
        currentLevel: currentLv,
        nextLevel: nextLv,
        description: u.desc[nextLv - 1] || u.desc[u.desc.length - 1],
        evoStatus
      });
    }

    if (choices.length === 0) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 30);
      this.resumeGame();
      return;
    }

    this._syncHud();
    this.bridge?.onLevelUp?.(choices);
  }

  _initWorldInteractables() {
    for (let i = 0; i < 6; i++) {
      const crate = this.add.image(0, 0, 'prop_crate').setScale(this.hdMode ? 0.42 : 1.05);
      crate.activeCrate = true;
      crate.respawnTimer = 0;
      this.crateItems.push(crate);
    }
    for (let i = 0; i < 2; i++) {
      const shrine = this.add.image(0, 0, 'prop_shrine');
      shrine.kind = 'prop_shrine';
      shrine.charge = 0;
      shrine.cooldown = 0;
      this._refreshPropMetrics(shrine);
      this.shrineItems.push(shrine);
    }
    for (let i = 0; i < 12; i++) {
      const pk = this.add.image(0, 0, 'chest_valhalla').setVisible(false).setDepth(DEPTH_LAYERS.GEMS + 5);
      pk.active = false;
      pk.kind = 'chest';
      this.pickupItems.push(pk);
    }
  }

  _repositionCratesAndShrines() {
    for (let i = 0; i < this.crateItems.length; i++) {
      const c = this.crateItems[i];
      const ang = (i / this.crateItems.length) * Math.PI * 2 + 0.3;
      const dist = 160 + (i % 3) * 110;
      c.setPosition(Math.cos(ang) * dist, Math.sin(ang) * dist);
      c.setDepth(computeEntityDepth(c.y));
      c.activeCrate = true;
      c.respawnTimer = 0;
      c.setVisible(true);
    }
    for (let i = 0; i < this.shrineItems.length; i++) {
      const s = this.shrineItems[i];
      const ang = i === 0 ? -Math.PI * 0.45 : Math.PI * 0.65;
      const dist = 240 + i * 110;
      s.setPosition(Math.cos(ang) * dist, Math.sin(ang) * dist);
      s.setDepth(computeEntityDepth(s.y));
      s.charge = 0;
      s.cooldown = 0;
      s.setAlpha(1);
    }
  }

  _damageCratesInRadius(x, y, radius) {
    if (!this.crateItems || this.crateItems.length === 0) return false;
    const rSq = (radius + 14) * (radius + 14);
    let broke = false;
    for (let i = 0; i < this.crateItems.length; i++) {
      const c = this.crateItems[i];
      if (!c.activeCrate) continue;
      if (computeSquaredDistance(x, y, c.x, c.y) <= rSq) {
        c.activeCrate = false;
        c.respawnTimer = 9.0;
        c.setVisible(false);
        this.cratesBroken += 1;
        audio.playCrateBreak();
        this._emitSparks(c.x, c.y, 10, 0xfbbf24, 130);
        const roll = Math.random();
        if (roll < 0.45) {
          this._spawnPickup(c.x, c.y, 'meat');
        } else if (roll < 0.7) {
          this._spawnPickup(c.x, c.y, 'magnet');
        } else {
          this._spawnXpGem(c.x, c.y, 18);
        }
        broke = true;
      }
    }
    return broke;
  }

  _updateCratesAndShrines(dt) {
    const hx = this.hero.x;
    const hy = this.hero.y;
    const maxRSq = GAME_CONFIG.PROP_RECYCLE_RADIUS * GAME_CONFIG.PROP_RECYCLE_RADIUS;

    for (let i = 0; i < this.crateItems.length; i++) {
      const c = this.crateItems[i];
      if (!c.activeCrate) {
        c.respawnTimer -= dt;
        if (c.respawnTimer <= 0) {
          const ang = Math.random() * Math.PI * 2;
          const dist = 280 + Math.random() * 240;
          c.setPosition(hx + Math.cos(ang) * dist, hy + Math.sin(ang) * dist);
          c.setDepth(computeEntityDepth(c.y));
          c.activeCrate = true;
          c.setVisible(true);
        }
      } else if (computeSquaredDistance(hx, hy, c.x, c.y) > maxRSq) {
        const ang = Math.atan2(hy - c.y, hx - c.x) + (Math.random() - 0.5) * 1.2;
        const dist = GAME_CONFIG.PROP_RECYCLE_RADIUS - 90;
        c.setPosition(hx + Math.cos(ang) * dist, hy + Math.sin(ang) * dist);
        c.setDepth(computeEntityDepth(c.y));
      }
    }

    const shrineRadius = 54;
    const shrineRSq = shrineRadius * shrineRadius;
    for (let i = 0; i < this.shrineItems.length; i++) {
      const s = this.shrineItems[i];
      if (computeSquaredDistance(hx, hy, s.x, s.y) > maxRSq) {
        const ang = Math.atan2(hy - s.y, hx - s.x) + (Math.random() - 0.5) * 1.2;
        const dist = GAME_CONFIG.PROP_RECYCLE_RADIUS - 110;
        s.setPosition(hx + Math.cos(ang) * dist, hy + Math.sin(ang) * dist);
        s.setDepth(computeEntityDepth(s.y));
        s.charge = 0;
        s.cooldown = 0;
        s.setAlpha(1);
      }

      if (s.cooldown > 0) {
        s.cooldown -= dt;
        if (s.cooldown <= 0) s.setAlpha(1);
        continue;
      }

      const sy = s.y + 12;
      this.auraGfx.lineStyle(2, 0x38bdf8, 0.55);
      this.auraGfx.strokeCircle(s.x, sy, shrineRadius);

      if (computeSquaredDistance(hx, hy, s.x, sy) <= shrineRSq) {
        s.charge = Math.min(1.5, s.charge + dt);
        const pct = s.charge / 1.5;
        this.auraGfx.fillStyle(0x38bdf8, 0.12 + pct * 0.22);
        this.auraGfx.fillCircle(s.x, sy, shrineRadius * pct);
        if (s.charge >= 1.5) {
          this._activateShrine(s);
        }
      } else if (s.charge > 0) {
        s.charge = Math.max(0, s.charge - dt * 0.6);
      }
    }
  }

  _activateShrine(shrine) {
    shrine.charge = 0;
    shrine.cooldown = 28;
    shrine.setAlpha(0.45);
    this.shrinesActivated += 1;
    audio.playShrineActivate();
    this._emitSparks(shrine.x, shrine.y, 18, 0x38bdf8, 160);

    const roll = Math.random();
    if (roll < 0.36) {
      this.activeBuff = { id: 'fury', label: 'Furia Runica +35% Danno', accent: '#f59e0b', remaining: 15 };
    } else if (roll < 0.72) {
      this.activeBuff = { id: 'frost_shield', label: 'Egida del Gelo · Scudo & Vel.', accent: '#38bdf8', remaining: 15 };
    } else {
      const heal = Math.round(this.stats.maxHp * 0.4);
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + heal);
      this.activeExplosions.push({ x: this.hero.x, y: this.hero.y, maxR: 130, life: 0, dur: 0.34, color: 0x34d399 });
      this.activeBuff = { id: 'fury', label: `Benedizione +${heal} HP & Furia`, accent: '#34d399', remaining: 10 };
    }
    this._recomputeStatsFromLevels();
    this._syncHud();
  }

  _spawnPickup(x, y, kind) {
    const slot = this.pickupItems.find((p) => !p.active);
    if (!slot) return null;
    const texMap = { chest: 'chest_valhalla', meat: 'meat_pickup', magnet: 'magnet_pickup' };
    slot.setTexture(texMap[kind] || 'chest_valhalla');
    slot.setPosition(x, y);
    slot.setScale(this.hdMode ? (kind === 'chest' ? 0.42 : 0.45) : 1.05);
    slot.setDepth(computeEntityDepth(y) - 10);
    slot.kind = kind;
    slot.active = true;
    slot.setVisible(true);
    return slot;
  }

  _updatePickups(_dt) {
    const hx = this.hero.x;
    const hy = this.hero.y;
    const pickupSq = 28 * 28;
    for (let i = 0; i < this.pickupItems.length; i++) {
      const pk = this.pickupItems[i];
      if (!pk.active) continue;
      if (computeSquaredDistance(hx, hy, pk.x, pk.y) <= pickupSq) {
        const kind = pk.kind;
        pk.active = false;
        pk.setVisible(false);
        if (kind === 'chest') {
          this._openChestReward();
          return;
        } else if (kind === 'meat') {
          this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 25);
          audio.playGem(6);
          this._emitSparks(hx, hy, 10, 0x34d399, 100);
        } else if (kind === 'magnet') {
          audio.playShrineActivate();
          for (const g of this.activeGems) {
            if (g.active) g.magnetized = true;
          }
          this._emitSparks(hx, hy, 12, 0x38bdf8, 120);
        }
      }
    }
  }

  _openChestReward() {
    this.gameState = 'CHEST';
    this.physics.pause();
    this._resetJoystick();
    audio.playChestOpen();

    let reward = null;
    const evos = this._getAvailableEvolutions();
    if (evos.length > 0) {
      const evo = evos[0];
      this.evolvedWeapons[evo.weaponId] = true;
      this.evolutionsForged += 1;
      audio.playEvolution();
      const evoCol = parseInt((evo.accent || '#fbbf24').replace('#', ''), 16) || 0xfbbf24;
      this.activeExplosions.push({ x: this.hero.x, y: this.hero.y, maxR: 135, life: 0, dur: 0.42, color: evoCol });
      this.activeAuraPulses.push({ x: this.hero.x, y: this.hero.y, maxR: 175, life: 0, dur: 0.5, color: 0xfef08a });
      this._spawnGroundMark('rune', this.hero.x, this.hero.y + 12, 62, evoCol);
      this._emitSparks(this.hero.x, this.hero.y, 24, evoCol, 200);
      if (evo.weaponId === 'blades') {
        this._rebuildValkyrieBlades();
      }
      reward = {
        isEvolution: true,
        iconId: evo.weaponId,
        title: evo.name,
        subtitle: evo.description,
        accent: evo.accent,
        tag: 'EVOLUZIONE LEGGENDARIA'
      };
    } else {
      const heroWeapons = (HERO_ROSTER[this.activeHeroId]?.weapons || []).map((w) => w.id);
      const upgradable = UPGRADE_CATALOG.filter((u) => {
        if (this.levels[u.id] >= u.maxLevel) return false;
        if (u.type === 'weapon' && heroWeapons.length > 0 && !heroWeapons.includes(u.id)) return false;
        return true;
      });
      if (upgradable.length > 0) {
        const owned = upgradable.filter((u) => this.levels[u.id] > 0);
        const pickPool = owned.length > 0 ? owned : upgradable;
        const pick = pickPool[Math.floor(Math.random() * pickPool.length)];
        this.levels[pick.id] += 1;
        this._recomputeStatsFromLevels();
        if (pick.id === 'blades') this._rebuildValkyrieBlades();
        const lv = this.levels[pick.id];
        reward = {
          isEvolution: false,
          iconId: pick.id,
          title: pick.name,
          subtitle: pick.desc[lv - 1] || pick.desc[0],
          accent: pick.accent,
          tag: `POTENZIAMENTO · LV ${lv}`
        };
      } else {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 40);
        reward = {
          isEvolution: false,
          iconId: 'regen',
          title: 'Dono del Valhalla',
          subtitle: 'Tutte le armi sono al massimo: +40 HP recuperati!',
          accent: '#34d399',
          tag: 'TESORO'
        };
      }
    }

    this._syncHud();
    if (this.bridge?.onChestOpened) {
      this.bridge.onChestOpened(reward);
    } else {
      this.resumeGame();
    }
  }

  _recycleEnemy(enemy) {
    if (enemy.shadow) enemy.shadow.setVisible(false);
    enemy.disableBody(true, true);
    swapPopRemove(this.activeEnemies, enemy, '_poolIdx');
  }

  _recycleProjectile(proj) {
    if (proj.trail) proj.trail.length = 0;
    proj.disableBody(true, true);
    swapPopRemove(this.activeProjectiles, proj, '_poolIdx');
  }

  _recycleGem(gem) {
    gem.disableBody(true, true);
    swapPopRemove(this.activeGems, gem, '_poolIdx');
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
    if (this.settings?.damageNumbers === false) return;
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

  _setPropGlowVisual(glow, color, alpha) {
    if (!glow) return;
    if (glow.isSoftGlow) {
      glow.setTint?.(color);
      glow.setAlpha(alpha);
    } else {
      glow.setFillStyle?.(color, alpha);
    }
  }

  _applyRealmToDecalsAndProps() {
    const realm = this.activeRealm || getRealmConfig('midgard');
    const decals = realm.decalKeys || ['decal_rune', 'decal_relic', 'decal_snow'];
    for (let i = 0; i < (this.groundDecals?.length || 0); i++) {
      const key = decals[i % decals.length];
      if (this.textures.exists(key)) {
        this.groundDecals[i].setTexture(key);
      }
    }

    const props = realm.propKeys || ['prop_brazier', 'prop_rock', 'prop_tree', 'prop_tree', 'prop_tree'];
    for (let i = 0; i < (this.propItems?.length || 0); i++) {
      const prop = this.propItems[i];
      const kind = props[i % props.length];
      prop.kind = kind;
      if (this.textures.exists(kind)) {
        prop.setTexture(kind);
      }
      this._refreshPropMetrics(prop);
      if (prop.glow) {
        const hasGlow = kind === 'prop_brazier' || kind === 'prop_soul_brazier' || kind === 'prop_magma_spire' || kind === 'prop_asgard_brazier';
        prop.glow.setVisible(hasGlow);
        if (kind === 'prop_soul_brazier') this._setPropGlowVisual(prop.glow, 0x10b981, 0.22);
        else if (kind === 'prop_asgard_brazier') this._setPropGlowVisual(prop.glow, 0xfbbf24, 0.24);
        else this._setPropGlowVisual(prop.glow, 0xf97316, 0.22);
      }
    }
  }

  _initScenicProps() {
    const useSoftGlow = this.textures.exists('glow_soft');
    for (let i = 0; i < GAME_CONFIG.PROP_COUNT; i++) {
      const mod = i % 5;
      const kind = mod === 0 ? 'prop_brazier' : mod === 1 ? 'prop_rock' : 'prop_tree';
      const prop = this.propsGroup.create(0, 0, kind);
      prop.kind = kind;
      this._refreshPropMetrics(prop);
      if (mod === 0 || mod === 2) {
        if (useSoftGlow) {
          prop.glow = this.add.image(0, 0, 'glow_soft')
            .setDepth(DEPTH_LAYERS.DECALS + 1)
            .setScale(0.95)
            .setAlpha(0.22);
          prop.glow.isSoftGlow = true;
          prop.glow.setTint?.(0xf97316);
          if (globalThis.Phaser?.BlendModes?.ADD !== undefined) {
            prop.glow.setBlendMode?.(Phaser.BlendModes.ADD);
          }
        } else {
          prop.glow = this.add.circle(0, 0, 34, 0xf97316, 0.15).setDepth(DEPTH_LAYERS.DECALS + 1);
        }
        if (mod !== 0) prop.glow.setVisible(false);
      }
      this.propItems.push(prop);
    }
    this._repositionAllProps();
  }

  _repositionAllProps() {
    this.propGrid.clear();
    for (let i = 0; i < this.propItems.length; i++) {
      const p = this.propItems[i];
      let px = 0;
      let py = 0;
      for (let attempt = 0; attempt < 6; attempt++) {
        const ang = (i / this.propItems.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.6 + attempt * 0.45;
        const dist = 175 + Math.random() * (GAME_CONFIG.PROP_RECYCLE_RADIUS - 195);
        px = Math.cos(ang) * dist;
        py = Math.sin(ang) * dist;
        if (!this._isPropCrowded(p, px, py)) break;
      }
      this._placeProp(p, px, py);
    }
  }

  _isPropCrowded(selfProp, x, y) {
    const minPropGapSq = 112 * 112;
    const nearby = this.propGrid.queryRadius(x, y, 140, this._propQueryScratch);
    for (let j = 0; j < nearby.length; j++) {
      const other = nearby[j];
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
    const isTall = prop.kind === 'prop_tree' || prop.kind === 'prop_dead_tree' || prop.kind === 'prop_bifrost_pillar';
    const isWide = prop.kind === 'prop_rock' || prop.kind === 'prop_obsidian';
    const baseOffsetY = isTall ? 24 : isWide ? 16 : 12;
    prop.baseX = x;
    prop.baseY = y + baseOffsetY;
    prop.trunkRadius = isWide ? 14 : 11;
    if (prop.glow) {
      prop.glow.setPosition(x, y + 6);
    }
    this.propGrid?.insert(prop, prop.baseX, prop.baseY);
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

  _resolvePropCollisions() {
    if (!this.propItems || this.propItems.length === 0) return;
    const heroFootX = this.hero.x;
    const heroFootY = this.hero.y + (this.heroFeetOffsetY || 17);
    const heroR = this.heroFeetRadius || 11;

    const heroNearby = this.propGrid.queryRadius(heroFootX, heroFootY, 56, this._propQueryScratch);
    for (let i = 0; i < heroNearby.length; i++) {
      const prop = heroNearby[i];
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
        const velDot = this.hero.body.velocity.x * nx + this.hero.body.velocity.y * ny;
        if (velDot < 0) {
          this.hero.body.velocity.x -= velDot * nx;
          this.hero.body.velocity.y -= velDot * ny;
        }
      }
    }

    for (let eIdx = 0; eIdx < this.activeEnemies.length; eIdx++) {
      const enemy = this.activeEnemies[eIdx];
      if (!enemy.active || enemy.isBoss) continue;
      const ex = enemy.x;
      const ey = enemy.y + 12;
      const nearProps = this.propGrid.queryRadius(ex, ey, 44, this._propQueryScratch);
      for (let pIdx = 0; pIdx < nearProps.length; pIdx++) {
        const prop = nearProps[pIdx];
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
    const heroSkill = (HERO_ROSTER[this.activeHeroId] || HERO_ROSTER.warrior).activeSkill;
    this.bridge.onHudUpdate({
      xp: this.stats.xp,
      xpNeeded: this.stats.xpNeeded,
      level: this.stats.level,
      kills: this.kills,
      elapsedSec: Math.floor(this.elapsedSec),
      remainingSec: Math.max(0, Math.ceil(GAME_CONFIG.RUN_DURATION_SEC - this.elapsedSec)),
      runMode: this.runMode || 'campaign',
      endlessWave: this.endlessWave || 0,
      bossSpawned: Boolean(this.bossSprite && this.bossSprite.active) || (this.runMode === 'campaign' && this.bossSpawned),
      revivalsLeft: this.stats.revivalsLeft || 0,
      buff: this.activeBuff ? { ...this.activeBuff } : null,
      activeSkill: heroSkill ? {
        ...heroSkill,
        cooldownRemaining: Number(Math.max(0, this.activeSkillCooldown || 0).toFixed(1)),
        maxCooldown: heroSkill.cooldownSec,
        ready: (this.activeSkillCooldown || 0) <= 0,
        activeTimer: Number(Math.max(0, this.activeSkillBuffTimer || 0, this.ironSkinTimer || 0).toFixed(1))
      } : null,
      build: this._getBuildSnapshot()
    });
  }

  async _loadCustomSpritesFromManifest() {
    if (typeof fetch !== 'function') return;
    try {
      const res = await fetch('./assets/sprites/manifest.json', { cache: 'no-cache' });
      if (!res.ok) return;
      const manifest = await res.json();
      const enabled = Array.isArray(manifest?.enabled) ? manifest.enabled : [];
      if (enabled.length === 0) return;

      const probes = await Promise.all(
        enabled.map(async (key) => {
          const url = `./assets/sprites/${key}.png`;
          try {
            const probe = await fetch(url, { method: 'GET' });
            const contentType = probe.headers.get('content-type') || '';
            if (probe.ok && contentType.startsWith('image/')) {
              return { key, url };
            }
          } catch {
            // Ignora asset singolo non raggiungibile
          }
          return null;
        })
      );

      if (!this.textures || !this.load || this.sys?.isDestroyed) return;

      const queued = [];
      for (const entry of probes) {
        if (!entry) continue;
        const tempKey = `__custom_${entry.key}`;
        if (this.textures.exists(tempKey)) {
          this.textures.remove(tempKey);
        }
        this.load.image(tempKey, entry.url);
        queued.push({ key: entry.key, tempKey });
      }

      if (queued.length > 0) {
        this.load.once('complete', () => {
          if (!this.textures || this.sys?.isDestroyed) return;

          const swappedKeys = new Set();
          for (const { key, tempKey } of queued) {
            if (!this.textures.exists(tempKey)) continue;
            const srcImg = this.textures.get(tempKey)?.getSourceImage?.();
            const imgW = srcImg?.naturalWidth || srcImg?.width || 0;
            const imgH = srcImg?.naturalHeight || srcImg?.height || 0;

            if (srcImg && imgW > 0 && imgH > 0) {
              this.textures.remove(tempKey);
              if (this.textures.exists(key)) {
                this.textures.remove(key);
              }
              this.textures.addImage(key, srcImg);
              this.customIllustratedKeys.add(key);
              const count = registerCustomWalkFrames(this.textures, key, srcImg);
              if (count > 0) {
                this.customWalkFrameCounts.set(key, count);
              }
              swappedKeys.add(key);
            } else {
              this.textures.remove(tempKey);
            }
          }

          if (swappedKeys.size === 0) return;

          const activeHeroTex = this.heroBaseTexKey || 'hero_warrior';
          if (this.hero && this.textures.exists(activeHeroTex)) {
            this.hero.setTexture(activeHeroTex);
            this.hero.setFlipX(this._isSpriteNativeFacingLeft(activeHeroTex));
            this._refreshHeroSpriteMetrics();
          }
          if (this.bossSprite && this.bossSprite.active && this.bossSprite.baseTexKey && this.textures.exists(this.bossSprite.baseTexKey)) {
            this.bossSprite.setTexture(this.bossSprite.baseTexKey);
            this._refreshBossSpriteMetrics(this.bossSprite);
          }
          if (this.ground && swappedKeys.has('ground_tile') && this.textures.exists('ground_tile')) {
            this.ground.setTexture('ground_tile');
          }
          for (const enemy of this.enemyPool?.getChildren?.() || this.activeEnemies || []) {
            if (!enemy) continue;
            const targetKey = enemy.baseTexKey || enemy.texture?.key?.replace(/_f\d+$/, '');
            if (targetKey && swappedKeys.has(targetKey) && this.textures.exists(targetKey)) {
              enemy.setTexture(targetKey);
              if (enemy.active) {
                if (enemy.isBoss) {
                  this._refreshBossSpriteMetrics(enemy);
                } else {
                  this._refreshEnemySpriteMetrics(enemy);
                }
              }
            }
          }
          for (const prop of this.propItems || []) {
            if (prop?.kind && swappedKeys.has(prop.kind) && this.textures.exists(prop.kind)) {
              prop.setTexture(prop.kind);
              this._refreshPropMetrics(prop);
            }
          }
          for (const shrine of this.shrineItems || []) {
            if (shrine && swappedKeys.has('prop_shrine') && this.textures.exists('prop_shrine')) {
              shrine.setTexture('prop_shrine');
              this._refreshPropMetrics(shrine);
            }
          }
          for (const child of this.children?.list || []) {
            const curKey = typeof child?.texture === 'string' ? child.texture : child?.texture?.key;
            if (!curKey) continue;
            const baseKey = swappedKeys.has(curKey) ? curKey : curKey.replace(/_f\d+$/, '');
            if (swappedKeys.has(baseKey) && child.texture?.manager === null && this.textures.exists(baseKey)) {
              child.setTexture(baseKey);
            }
          }
        });
        this.load.start();
      }
    } catch {
      // Mantiene le texture procedurali senza errori
    }
  }
}
