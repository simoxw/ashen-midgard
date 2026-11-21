import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Installa un ambiente browser/Phaser minimale prima di importare i moduli di gioco
function installPhaserMock() {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k)
  };
  globalThis.window = {
    AudioContext: null,
    webkitAudioContext: null,
    devicePixelRatio: 2
  };
  globalThis.performance = globalThis.performance || { now: () => Date.now() };

  class MockBody {
    constructor(owner) {
      this.owner = owner;
      this.velocity = { x: 0, y: 0 };
      this.width = 16;
      this.height = 12;
      this.offsetX = 0;
      this.offsetY = 0;
    }
    setSize(w, h) {
      this.width = w;
      this.height = h;
      return this;
    }
    setOffset(ox, oy) {
      this.offsetX = ox;
      this.offsetY = oy;
      return this;
    }
    setCircle(r, ox = 0, oy = 0) {
      this.width = r * 2;
      this.height = r * 2;
      this.offsetX = ox;
      this.offsetY = oy;
      return this;
    }
  }

  class MockGameObject {
    constructor(x = 0, y = 0, texture = '') {
      this.x = x;
      this.y = y;
      this.texture = texture;
      this.width = 36;
      this.height = 42;
      this.displayWidth = 36;
      this.displayHeight = 42;
      this.depth = 0;
      this.alpha = 1;
      this.visible = true;
      this.active = true;
      this.scaleX = 1;
      this.scaleY = 1;
      this.angle = 0;
      this.rotation = 0;
      this.flipX = false;
      this.scrollFactor = 1;
      this.tint = null;
      this.tilePositionX = 0;
      this.tilePositionY = 0;
      this.body = new MockBody(this);
    }
    setTexture(key) { this.texture = key; return this; }
    setPosition(x, y) { this.x = x; this.y = y; return this; }
    setDepth(d) { this.depth = d; return this; }
    setAlpha(a) { this.alpha = a; return this; }
    setVisible(v) { this.visible = v; return this; }
    setScale(sx, sy = sx) { this.scaleX = sx; this.scaleY = sy; return this; }
    setOrigin() { return this; }
    setScrollFactor(sf) { this.scrollFactor = sf; return this; }
    setFlipX(f) { this.flipX = f; return this; }
    setAngle(a) { this.angle = a; return this; }
    setRotation(r) { this.rotation = r; return this; }
    setFillStyle() { return this; }
    setColor() { return this; }
    setFontSize() { return this; }
    setText(t) { this.text = t; return this; }
    setTintFill(c) { this.tint = c; return this; }
    clearTint() { this.tint = null; return this; }
    setVelocity(vx, vy) { this.body.velocity.x = vx; this.body.velocity.y = vy; return this; }
    refreshBody() { return this; }
    enableBody(_reset, x, y, act = true, vis = true) {
      this.x = x;
      this.y = y;
      this.active = act;
      this.visible = vis;
      return this;
    }
    disableBody(act = true, vis = true) {
      if (act) this.active = false;
      if (vis) this.visible = false;
      return this;
    }
    destroy() { this.active = false; this.visible = false; }
  }

  class MockGraphics extends MockGameObject {
    constructor() {
      super(0, 0, '__gfx');
      this.calls = [];
    }
    clear() { this.calls.length = 0; return this; }
    fillStyle(c, a) { this.calls.push(['fillStyle', c, a]); return this; }
    lineStyle(w, c, a) { this.calls.push(['lineStyle', w, c, a]); return this; }
    fillRect(x, y, w, h) { this.calls.push(['fillRect', x, y, w, h]); return this; }
    fillRoundedRect(x, y, w, h, r) { this.calls.push(['fillRoundedRect', x, y, w, h, r]); return this; }
    fillCircle(x, y, r) { this.calls.push(['fillCircle', x, y, r]); return this; }
    strokeCircle(x, y, r) { this.calls.push(['strokeCircle', x, y, r]); return this; }
    fillEllipse(x, y, w, h) { this.calls.push(['fillEllipse', x, y, w, h]); return this; }
    fillTriangle(...args) { this.calls.push(['fillTriangle', ...args]); return this; }
    beginPath() { return this; }
    moveTo() { return this; }
    lineTo() { return this; }
    strokePath() { return this; }
    generateTexture(key) {
      MockSceneRegistry.textures.add(key);
      return this;
    }
  }

  class MockGroup {
    constructor(maxSize = 300) {
      this.maxSize = maxSize;
      this.items = [];
    }
    get(x, y, key) {
      let item = this.items.find((i) => !i.active);
      if (!item) {
        if (this.items.length >= this.maxSize) return null;
        item = new MockGameObject(x, y, key);
        this.items.push(item);
      }
      item.setTexture(key);
      item.setPosition(x, y);
      return item;
    }
    create(x, y, key) {
      const item = new MockGameObject(x, y, key);
      this.items.push(item);
      return item;
    }
  }

  const MockSceneRegistry = {
    textures: new Set()
  };

  class MockScene {
    constructor() {
      MockSceneRegistry.textures = new Set();
      this.scale = { width: 450, height: 800 };
      this.textures = {
        exists: (k) => MockSceneRegistry.textures.has(k)
      };
      this.load = {
        on: () => {},
        image: () => {}
      };
      this.make = {
        graphics: () => new MockGraphics()
      };
      this.add = {
        tileSprite: (x, y, _w, _h, k) => new MockGameObject(x, y, k),
        graphics: () => new MockGraphics(),
        image: (x, y, k) => new MockGameObject(x, y, k),
        rectangle: (x, y) => new MockGameObject(x, y, '__rect'),
        circle: (x, y) => new MockGameObject(x, y, '__circle'),
        text: (x, y) => new MockGameObject(x, y, '__text')
      };
      this.physics = {
        paused: false,
        pause: () => { this.physics.paused = true; },
        resume: () => { this.physics.paused = false; },
        add: {
          sprite: (x, y, k) => new MockGameObject(x, y, k),
          staticGroup: () => new MockGroup(100),
          group: (cfg) => new MockGroup(cfg?.maxSize || 300),
          collider: () => {},
          overlap: () => {}
        }
      };
      this.cameras = {
        main: {
          scrollX: 0,
          scrollY: 0,
          startFollow: () => {},
          setRoundPixels: () => {},
          shake: () => {}
        }
      };
      this.tweens = {
        add: (cfg) => {
          if (cfg?.onComplete) cfg.onComplete();
          return {};
        }
      };
      this.time = {
        delayedCall: (_ms, fn) => { if (fn) fn(); }
      };
      this.input = {
        on: () => {},
        keyboard: {
          createCursorKeys: () => ({
            up: { isDown: false },
            down: { isDown: false },
            left: { isDown: false },
            right: { isDown: false }
          }),
          addKeys: () => ({
            up: { isDown: false },
            down: { isDown: false },
            left: { isDown: false },
            right: { isDown: false }
          })
        }
      };
    }
  }

  globalThis.Phaser = {
    Scene: MockScene,
    Input: { Keyboard: { KeyCodes: { W: 87, S: 83, A: 65, D: 68 } } },
    Math: {
      Clamp: (v, min, max) => Math.max(min, Math.min(max, v))
    },
    Utils: {
      Array: {
        Shuffle: (arr) => arr
      }
    }
  };
}

installPhaserMock();

const { GameScene, GAME_CONFIG, DEPTH_LAYERS, computeEntityDepth, computeSquaredDistance } =
  await import('../src/gameScene.js');
const { audio } = await import('../src/audio.js');
const {
  HERO_ROSTER,
  HERO_ORDER,
  getXpRequiredForLevel,
  getHeroLevelFromXp,
  getPerksForHeroLevel,
  loadMetaProgress,
  grantHeroMetaXp,
  computeRunMetaXp
} = await import('../src/heroes.js');
const {
  CODEX_ENTRIES,
  CODEX_STORAGE_KEY,
  getCodexView,
  recordRunCodexProgress
} = await import('../src/codex.js');
const {
  REALM_STORAGE_KEY,
  REALM_ORDER,
  REALM_CATALOG,
  CHALLENGE_ORDER,
  REALM_CHALLENGES,
  getRealmConfig,
  getChallengeConfig,
  getRealmDialogue,
  loadRealmProgress,
  saveRealmProgress,
  recordRealmVictory
} = await import('../src/realms.js');

test('2.5D Depth Layers: entità sempre sopra terreno e ombre anche con Y negative', () => {
  const testYs = [-100000, -1500, -250, -1, 0, 1, 250, 1500, 100000];
  for (const y of testYs) {
    const entityDepth = computeEntityDepth(y);
    assert.ok(
      entityDepth > DEPTH_LAYERS.SHADOWS,
      `Entity depth (${entityDepth}) a y=${y} deve superare SHADOWS (${DEPTH_LAYERS.SHADOWS})`
    );
    assert.ok(
      DEPTH_LAYERS.SHADOWS > DEPTH_LAYERS.DECALS && DEPTH_LAYERS.DECALS > DEPTH_LAYERS.GROUND,
      'Ordine layer terreno -> decali -> ombre non rispettato'
    );
    assert.ok(
      entityDepth < DEPTH_LAYERS.VFX && DEPTH_LAYERS.VFX < DEPTH_LAYERS.DAMAGE_TEXT,
      'Ordine layer entità -> VFX -> testi danno non rispettato'
    );
  }
  assert.ok(computeEntityDepth(-500) < computeEntityDepth(-100));
  assert.ok(computeEntityDepth(-10) < computeEntityDepth(10));
});

test('computeSquaredDistance calcola distanza al quadrato senza radice quadrata', () => {
  assert.equal(computeSquaredDistance(0, 0, 3, 4), 25);
  assert.equal(computeSquaredDistance(-10, -20, -13, -24), 25);
});

test('GameScene: texture procedurali, movimento a Nord (Y < 0), spawning, armi, level-up e boss', async () => {
  const scene = new GameScene();
  const events = {
    ready: false,
    hud: null,
    levelUpChoices: null,
    bossHud: null,
    runResult: null
  };

  scene.configureBridge(
    {
      onSceneReady: () => { events.ready = true; },
      onHudUpdate: (d) => { events.hud = d; },
      onLevelUp: (choices) => { events.levelUpChoices = choices; },
      onBossHudUpdate: (b) => { events.bossHud = b; },
      onRunEnded: (r) => { events.runResult = r; }
    },
    null
  );

  scene.preload();
  scene.create();
  assert.equal(events.ready, true);

  // Verifica generazione di tutte le texture procedurali (inclusi 3 eroi e nuove armi)
  const expectedTextures = [
    'ground_tile', 'decal_rune', 'decal_relic', 'decal_snow',
    'hero_warrior', 'hero_assassin', 'hero_mage',
    'enemy_swarm', 'enemy_fast', 'enemy_tank', 'boss',
    'prop_tree', 'prop_rock', 'prop_brazier', 'shadow_ellipse',
    'axe_proj', 'dagger_proj', 'orb_proj', 'blade_proj',
    'gem_blue', 'gem_green', 'gem_gold'
  ];
  for (const key of expectedTextures) {
    assert.equal(scene.textures.exists(key), true, `Texture mancante: ${key}`);
  }

  await scene.startNewRun();
  assert.equal(scene.gameState, 'PLAYING');
  assert.equal(scene.hero.visible, true);
  assert.equal(scene.hero.texture, 'hero_warrior');
  assert.equal(scene.levels.axe, 1);

  // Simula camminata verso Nord (Y negative) per verificare che hero e nemici non spariscano
  scene.wasd.up.isDown = true;
  for (let frame = 0; frame < 180; frame++) {
    // Integra manualmente velocità mockata come farebbe Arcade Physics
    scene.hero.x += scene.hero.body.velocity.x * 0.033;
    scene.hero.y += scene.hero.body.velocity.y * 0.033;
    scene.cameras.main.scrollX = scene.hero.x - 225;
    scene.cameras.main.scrollY = scene.hero.y - 400;
    for (const e of scene.activeEnemies) {
      e.x += e.body.velocity.x * 0.033;
      e.y += e.body.velocity.y * 0.033;
    }
    for (const p of scene.activeProjectiles) {
      p.x += p.body.velocity.x * 0.033;
      p.y += p.body.velocity.y * 0.033;
    }
    scene.update(frame * 33, 33);
  }
  scene.wasd.up.isDown = false;

  assert.ok(scene.hero.y < -400, `L'eroe doveva trovarsi a Nord (y=${scene.hero.y})`);
  assert.equal(scene.hero.visible, true);
  assert.ok(scene.hero.alpha > 0);
  assert.ok(scene.hero.depth > scene.heroShadow.depth);
  assert.ok(scene.heroShadow.depth > scene.ground.depth);
  assert.ok(scene.activeEnemies.length >= 4, 'I nemici dovrebbero essere attivi e visibili');

  for (const enemy of scene.activeEnemies) {
    assert.equal(enemy.visible, true, 'Ogni nemico attivo deve restare visibile');
    assert.ok(enemy.alpha > 0, 'Alpha nemico deve essere > 0');
    assert.ok(enemy.depth > enemy.shadow.depth, 'Nemico deve essere sopra la sua ombra');
    assert.ok(enemy.shadow.depth > scene.ground.depth, 'Ombra nemico deve essere sopra il terreno');
  }

  // Test armi multiple + Level-Up + VFX
  scene._grantXp(20);
  assert.equal(scene.gameState, 'LEVEL_UP');
  assert.equal(events.levelUpChoices.length, 3);
  scene.applyUpgrade('aura');
  scene.applyUpgrade('lightning');
  scene.applyUpgrade('blades');
  assert.equal(scene.gameState, 'PLAYING');
  assert.equal(scene.bladeSprites.length, 2);

  // Forza attivazione fulmini e aura con almeno un nemico nel raggio
  scene._spawnEnemy('swarm', 0, 0, 120);
  scene.timers.aura = 0;
  scene.timers.lightning = 0;
  scene.update(9000, 33);
  assert.ok(scene.activeAuraPulses.length >= 1, 'Aura pulse VFX dovrebbe attivarsi');
  assert.ok(scene.activeLightnings.length >= 1, 'Saetta di Thor dovrebbe restare visibile per la durata VFX');

  // Test Spawn Boss, telegrafi e sconfitta Boss -> Vittoria
  scene._spawnBoss();
  assert.ok(scene.bossSprite && scene.bossSprite.active);
  assert.ok(events.bossHud && events.bossHud.hp === 4500);
  assert.ok(scene.bossSprite.depth > scene.bossSprite.shadow.depth);

  // Simula attacco telegrafato del boss
  scene.timers.bossAttack = 0;
  scene.update(10000, 33);
  assert.ok(scene.activeTelegraphs.length >= 2, 'Il boss deve generare cerchi rossi telegrafati');

  // Uccidi il boss e attendi la sequenza esplosione -> vittoria (700ms)
  scene._killEnemy(scene.bossSprite);
  assert.equal(scene.bossDefeated, true);
  await new Promise((r) => setTimeout(r, 760));
  assert.equal(events.runResult?.victory, true);

  // Verifica anche flusso Game Over
  await scene.startNewRun();
  scene._onEnemyTouchHero({ damage: 999 });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(scene.gameState, 'ENDED');
  assert.equal(events.runResult?.victory, false);
});

test('AudioEngine: toggle mute e rate-limiting sicuri', () => {
  const initial = audio.isMuted();
  assert.equal(audio.toggleMute(), !initial);
  assert.equal(audio.toggleMute(), initial);
  // Verifica che tutte le chiamate synth siano sicure in ambiente senza AudioContext
  audio.playUiClick();
  audio.playGem(3);
  audio.playLevelUp();
  audio.playBossAlarm();
  audio.playExplosion(1);
});

test('Config PWA & Story: manifest.json, story.json e file statici presenti', () => {
  const root = process.cwd();
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'portrait');
  assert.ok(manifest.short_name.length <= 12);
  for (const icon of manifest.icons) {
    const iconPath = path.join(root, icon.src.replace(/^\.\//, ''));
    assert.equal(fs.existsSync(iconPath), true, `Icona PWA mancante: ${icon.src}`);
  }

  const story = JSON.parse(fs.readFileSync(path.join(root, 'story.json'), 'utf8'));
  for (const trigger of ['onGameStart', 'onBossSpawn', 'onVictory', 'onGameOver']) {
    assert.ok(Array.isArray(story[trigger]) && story[trigger].length > 0, `Trigger mancante: ${trigger}`);
    for (const slide of story[trigger]) {
      const imgPath = path.join(root, slide.image.replace(/^\.\//, ''));
      assert.equal(fs.existsSync(imgPath), true, `Immagine storia mancante: ${slide.image}`);
    }
  }

  // Verifica storie e immagini dedicate per tutti e 4 gli eroi
  assert.equal(GAME_CONFIG.RUN_DURATION_SEC, 240, 'Il boss deve arrivare dopo 4 minuti (240s)');
  for (const heroId of ['warrior', 'assassin', 'mage', 'juggernaut']) {
    const heroStory = story.heroes?.[heroId];
    assert.ok(heroStory, `Storia eroe mancante: ${heroId}`);
    for (const trigger of ['onGameStart', 'onVictory', 'onGameOver']) {
      assert.ok(Array.isArray(heroStory[trigger]) && heroStory[trigger].length > 0, `Slide ${heroId}.${trigger} mancante`);
      for (const slide of heroStory[trigger]) {
        const imgPath = path.join(root, slide.image.replace(/^\.\//, ''));
        assert.equal(fs.existsSync(imgPath), true, `Immagine ${heroId} mancante: ${slide.image}`);
      }
    }
  }

  // Verifica storie e immagini per i Regni Muspelheim & Helheim
  for (const realmId of ['muspelheim', 'helheim']) {
    const realmStory = story.realms?.[realmId];
    assert.ok(realmStory, `Storia regno mancante: ${realmId}`);
    for (const trigger of ['onGameStart', 'onBossSpawn', 'onVictory', 'onGameOver']) {
      assert.ok(Array.isArray(realmStory[trigger]) && realmStory[trigger].length > 0, `Slide ${realmId}.${trigger} mancante`);
      for (const slide of realmStory[trigger]) {
        const imgPath = path.join(root, slide.image.replace(/^\.\//, ''));
        assert.equal(fs.existsSync(imgPath), true, `Immagine ${realmId} mancante: ${slide.image}`);
      }
    }
  }

  // Verifica strategia aggiornamento forzato SW (Network-First per codice/HTML + updateViaCache: none)
  const swSource = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(swSource.includes('networkFirst'), 'sw.js deve usare networkFirst per codice e HTML');
  assert.ok(swSource.includes("cache: 'reload'"), 'sw.js deve bypassare HTTP cache in installazione');
  assert.ok(swSource.includes('./src/codex.js') && swSource.includes('./assets/story/bjorn_intro.jpg'), 'sw.js deve pre-caricare codex.js e immagini storia di Bjorn');
  assert.ok(
    swSource.includes('./src/realms.js') &&
      swSource.includes('./assets/story/boss_surtr.jpg') &&
      swSource.includes('./assets/story/boss_hel.jpg'),
    'sw.js deve pre-caricare realms.js e le vignette di Muspelheim/Helheim'
  );
  const htmlSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(htmlSource.includes("updateViaCache: 'none'"), 'index.html deve registrare SW con updateViaCache: none');
  assert.ok(htmlSource.includes('controllerchange'), 'index.html deve gestire reload su controllerchange');
});

test('StoryManager & HD Sprites: selezione vignette per eroe e generazione Canvas HD 4x senza errori', async () => {
  const registered = new Map();
  const noop = () => {};
  const mockGrad = { addColorStop: noop };
  const mockCtx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    fillRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    quadraticCurveTo: noop,
    bezierCurveTo: noop,
    arc: noop,
    ellipse: noop,
    fill: noop,
    stroke: noop,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    createLinearGradient: () => mockGrad,
    createRadialGradient: () => mockGrad
  };
  globalThis.document = {
    getElementById: () => null,
    createElement: () => ({ width: 0, height: 0, getContext: () => mockCtx })
  };

  const { StoryManager } = await import('../src/storyManager.js');
  const { generateHdTextures } = await import('../src/hdSprites.js');
  assert.equal(typeof generateHdTextures, 'function');

  generateHdTextures({
    exists: (k) => registered.has(k),
    addCanvas: (k, canvas) => {
      registered.set(k, { width: canvas.width, height: canvas.height });
    }
  });
  for (const expectedKey of [
    'ground_tile', 'hero_warrior', 'hero_assassin', 'hero_mage', 'hero_juggernaut',
    'hero_warrior_f0', 'hero_warrior_f1', 'hero_warrior_f2', 'hero_warrior_f3',
    'hero_juggernaut_f1', 'enemy_swarm', 'enemy_swarm_f1',
    'enemy_fast', 'enemy_tank', 'enemy_archer', 'enemy_berserker', 'enemy_elite', 'boss', 'boss_f2',
    'prop_tree', 'prop_rock', 'prop_brazier', 'prop_crate', 'prop_shrine',
    'chest_valhalla', 'frost_arrow', 'meat_pickup', 'magnet_pickup', 'shadow_ellipse',
    'axe_proj', 'dagger_proj', 'orb_proj', 'blade_proj',
    'spear_proj', 'scythe_proj', 'fang_proj', 'grimoire_proj', 'flail_proj',
    'enemy_shaman', 'enemy_shaman_f1', 'enemy_bomber', 'enemy_shieldbearer', 'enemy_stalker',
    'gem_blue', 'gem_green', 'gem_gold',
    'ground_tile_muspel', 'enemy_muspel_swarm', 'enemy_muspel_swarm_f1', 'enemy_muspel_shaman', 'boss_surtr', 'boss_surtr_f2', 'fire_bolt',
    'ground_tile_hel', 'enemy_hel_swarm', 'enemy_hel_swarm_f1', 'enemy_hel_stalker', 'boss_hel', 'boss_hel_f2', 'shadow_bolt'
  ]) {
    assert.equal(registered.has(expectedKey), true, `Sprite HD 4x mancante: ${expectedKey}`);
  }
  assert.deepEqual(registered.get('hero_warrior'), { width: 144, height: 168 });
  assert.deepEqual(registered.get('hero_assassin'), { width: 144, height: 168 });
  assert.deepEqual(registered.get('hero_mage'), { width: 144, height: 168 });
  assert.deepEqual(registered.get('hero_juggernaut'), { width: 144, height: 168 });
  assert.deepEqual(registered.get('enemy_swarm'), { width: 120, height: 136 });
  assert.deepEqual(registered.get('enemy_fast'), { width: 144, height: 112 });
  assert.deepEqual(registered.get('enemy_tank'), { width: 168, height: 192 });
  assert.deepEqual(registered.get('boss'), { width: 280, height: 320 });
  assert.deepEqual(registered.get('boss_surtr'), { width: 280, height: 320 });
  assert.deepEqual(registered.get('boss_hel'), { width: 280, height: 320 });

  const root = process.cwd();
  const story = JSON.parse(fs.readFileSync(path.join(root, 'story.json'), 'utf8'));
  const sm = new StoryManager(audio);
  sm.storyData = story;

  const skadiStart = sm.getSlidesFor('onGameStart', 'assassin', 'midgard');
  assert.equal(skadiStart[0].image, './assets/story/skadi_intro.jpg');
  const freyaVictory = sm.getSlidesFor('onVictory', 'mage', 'midgard');
  assert.equal(freyaVictory[0].image, './assets/story/freya_victory.jpg');
  const bossSlides = sm.getSlidesFor('onBossSpawn', 'assassin', 'midgard');
  assert.equal(bossSlides[0].image, './assets/story/boss.jpg');

  const muspelBossSlides = sm.getSlidesFor('onBossSpawn', 'warrior', 'muspelheim');
  assert.equal(muspelBossSlides[0].image, './assets/story/boss_surtr.jpg');
  const helVictorySlides = sm.getSlidesFor('onVictory', 'mage', 'helheim');
  assert.equal(helVictorySlides[0].image, './assets/story/helheim_victory.jpg');
});

test('Heroes & Meta-Progression: 4 eroi, armi sbloccabili e EXP permanente', () => {
  assert.deepEqual(HERO_ORDER, ['warrior', 'assassin', 'mage', 'juggernaut']);
  for (const id of HERO_ORDER) {
    const h = HERO_ROSTER[id];
    assert.equal(h.weapons.length, 3);
    assert.equal(h.weapons[0].unlockLevel, 1);
    assert.equal(h.weapons[1].unlockLevel, 2);
    assert.equal(h.weapons[2].unlockLevel, 4);
  }

  // Soglie livello e sblocchi progressivi
  assert.equal(getXpRequiredForLevel(1), 0);
  const lv2Req = getXpRequiredForLevel(2);
  const lv4Req = getXpRequiredForLevel(4);
  assert.ok(lv4Req > lv2Req && lv2Req > 0);

  const lv1Perks = getPerksForHeroLevel('assassin', 1);
  assert.deepEqual(lv1Perks.unlockedWeapons, ['dagger']);

  const lv2Perks = getPerksForHeroLevel('assassin', 2);
  assert.deepEqual(lv2Perks.unlockedWeapons, ['dagger', 'scythe']);
  assert.equal(lv2Perks.maxHp, HERO_ROSTER.assassin.baseStats.maxHp + 12);

  const lv4Perks = getPerksForHeroLevel('mage', 4);
  assert.deepEqual(lv4Perks.unlockedWeapons, ['orb', 'lightning', 'grimoire']);
  assert.ok(lv4Perks.mightMult > HERO_ROSTER.mage.baseStats.mightMult);
  assert.ok(lv4Perks.speed > HERO_ROSTER.mage.baseStats.speed);

  // Zero sovrapposizione: 12 armi esclusive totali tra i 4 eroi
  const allHeroWeaponIds = HERO_ORDER.flatMap((id) => HERO_ROSTER[id].weapons.map((w) => w.id));
  assert.equal(new Set(allHeroWeaponIds).size, 12, 'Tutti i 4 eroi devono avere 3 armi esclusive senza duplicati');

  // Guadagno EXP permanente salvato su localStorage
  localStorage.removeItem('ashen_midgard_meta_v1');
  const res = grantHeroMetaXp('assassin', { elapsedSec: 120, kills: 100, bossDefeated: false });
  assert.ok(res.gainedXp >= 120);
  assert.ok(res.newLevel >= 2);
  assert.equal(res.unlockedWeapons.some((w) => w.id === 'scythe'), true);

  const reloaded = loadMetaProgress();
  assert.equal(getHeroLevelFromXp(reloaded.heroXp.assassin).level, res.newLevel);
});

test('GameScene Multi-Eroe: Assassina (pugnali) e Maga (globo esplosivo) con spawn bilanciato', async () => {
  const scene = new GameScene();
  scene.configureBridge({}, null);
  scene.preload();
  scene.create();

  // 1. Avvio run con Skadi (Assassina) + Pugnali d'Ombra
  const skadiPerks = getPerksForHeroLevel('assassin', 3);
  await scene.startNewRun({
    heroId: 'assassin',
    startingWeaponId: 'dagger',
    textureKey: 'hero_assassin',
    effectiveStats: skadiPerks
  });

  assert.equal(scene.hero.texture, 'hero_assassin');
  assert.equal(scene.levels.dagger, 1);
  assert.equal(scene.levels.axe, 0);
  assert.equal(scene.stats.maxHp, skadiPerks.maxHp);

  // Spawn 1 nemico vicino e attiva i pugnali
  scene._spawnEnemy('swarm', 0, 0, 120);
  scene.timers.dagger = 0;
  scene.update(100, 33);
  assert.ok(
    scene.activeProjectiles.some((p) => p.kind === 'dagger' && p.texture === 'dagger_proj'),
    'Assassina deve scagliare dagger_proj'
  );

  // Verifica ritmo di spawn iniziale bilanciato (non satura subito il pool)
  for (let f = 1; f < 90; f++) {
    scene.update(100 + f * 33, 33);
  }
  assert.ok(
    scene.activeEnemies.length <= 20,
    `Spawn iniziale troppo alto (${scene.activeEnemies.length} nemici in 3s)`
  );

  // 2. Avvio run con Freya (Maga) + Globo Arcano + Esplosione ad area
  const freyaPerks = getPerksForHeroLevel('mage', 2);
  await scene.startNewRun({
    heroId: 'mage',
    startingWeaponId: 'orb',
    textureKey: 'hero_mage',
    effectiveStats: freyaPerks
  });
  assert.equal(scene.hero.texture, 'hero_mage');
  assert.equal(scene.levels.orb, 1);

  scene._spawnEnemy('swarm', 0, 0, 90);
  const target = scene.activeEnemies[0];
  scene.timers.orb = 0;
  scene.update(200, 33);
  const orbProj = scene.activeProjectiles.find((p) => p.kind === 'orb' && p.texture === 'orb_proj');
  assert.ok(orbProj, 'Maga deve lanciare orb_proj');

  scene._onProjectileHitEnemy(orbProj, target);
  assert.ok(scene.activeExplosions.length >= 1, 'Globo Arcano deve generare esplosione VFX ad area');
});

test('Bilanciamento Nemici (+60% HP) & Scala 4x (+10% dimensione + hitbox)', async () => {
  const prevDoc = globalThis.document;
  globalThis.document = undefined;
  const scene = new GameScene();
  scene.configureBridge({}, null);
  scene.preload();
  scene.create();
  await scene.startNewRun({ heroId: 'warrior', startingWeaponId: 'axe' });

  // Verifica HP base invariato per Draugr (32) e buff HP per i nemici non base
  scene._spawnEnemy('swarm', 0, 0, 150);
  scene._spawnEnemy('fast', 0, 1, 150);
  scene._spawnEnemy('tank', 0, 2, 150);
  scene._spawnEnemy('archer', 0, 3, 150);
  scene._spawnEnemy('berserker', 0, 4, 150);
  const [swarm, fast, tank, archer, berserker] = scene.activeEnemies;

  assert.equal(swarm.maxHp, 32, 'Draugr base deve restare a 32 HP');
  assert.equal(fast.maxHp, 38, 'Lupo Fenrir non-base deve avere 38 HP');
  assert.equal(tank.maxHp, 140, 'Jotun Corazzato non-base deve avere 140 HP');
  assert.equal(archer.maxHp, 42, 'Arciere non-base deve avere 42 HP');
  assert.equal(berserker.maxHp, 88, 'Berserker non-base deve avere 88 HP');

  // 1 colpo non critico di Ascia Lv.1 (27 danni) lascia vivo il Draugr (2 colpi richiesti)
  scene._damageEnemy(swarm, 27, 1, 0, 80, false);
  assert.equal(swarm.active, true);
  assert.equal(swarm.hp, 5);
  scene._damageEnemy(swarm, 27, 1, 0, 80, false);
  assert.equal(swarm.active, false);

  // Verifica calibrazione scala 4x (+10% su schermo) quando hdMode = true
  scene.hdMode = true;
  scene._spawnEnemy('swarm', 0, 0, 140);
  const hdSwarm = scene.activeEnemies.find((e) => e.active && e.archetype === 'swarm');
  assert.equal(hdSwarm.baseScale, 0.322);
  assert.equal(hdSwarm.body.width, 54);
  assert.equal(hdSwarm.body.height, 32);

  scene._spawnBoss();
  assert.equal(scene.bossSprite.baseScale, 0.413);
  assert.equal(scene.bossSprite.body.width, 120);
  assert.equal(scene.bossSprite.body.height, 64);

  globalThis.document = prevDoc;
});

test('Anti-Incastro Ostacoli, Zero-GC Pool & Prontezza GitHub Pages PWA', async () => {
  const prevDoc = globalThis.document;
  globalThis.document = undefined;
  const scene = new GameScene();
  scene.configureBridge({}, null);
  scene.preload();
  scene.create();
  await scene.startNewRun({ heroId: 'warrior', startingWeaponId: 'axe' });

  // 1. Scivolamento fluido attorno a un albero (nessun incastro con movimento diagonale)
  const tree = scene.propItems.find((p) => p.kind === 'prop_tree') || scene.propItems[0];
  scene.hero.setPosition(0, 0);
  scene._placeProp(tree, 0, -4); // Base albero a (0, +20), piedi eroe a (0, +17) -> sovrapposizione radiale
  scene.hero.setVelocity(100, 100);
  scene._resolvePropCollisions();
  const minDist = (scene.heroFeetRadius || 11) + (tree.trunkRadius || 11);
  const resolvedDist = Math.hypot(
    scene.hero.x - tree.baseX,
    scene.hero.y + scene.heroFeetOffsetY - tree.baseY
  );
  assert.ok(resolvedDist >= minDist - 0.01, `Eroe non respinto fuori dal tronco (${resolvedDist} < ${minDist})`);
  assert.ok(Math.abs(scene.hero.body.velocity.x) > 0, 'Velocità tangenziale laterale deve restare attiva');

  // 2. Ring-buffer bladeTrails fisso e ricerca bersagli in-place
  assert.equal(scene.bladeTrails.length, 48);
  scene._spawnEnemy('swarm', 0, 0, 100);
  scene._spawnEnemy('swarm', 0, 1, 200);
  const nearest = scene._getNearestActiveEnemies(500 * 500, 1);
  assert.equal(nearest.length, 1);
  assert.ok(nearest[0].dSq <= 105 * 105);

  // 3. Animazione testi danno senza Tween Phaser
  scene._spawnDamageText(10, 20, 42, true);
  const activeTxt = scene.dmgTextPool.find((t) => t.inUse);
  assert.ok(activeTxt, 'Testo danno dovrebbe essere attivo nel pool');
  scene._updateDamageTexts(0.24);
  assert.ok(activeTxt.y < 20, 'Testo danno deve salire progressivamente');
  scene._updateDamageTexts(0.30);
  assert.equal(activeTxt.inUse, false, 'Testo danno deve liberarsi automaticamente nel pool');

  // 4. Recovery automatico joystick se il puntatore browser viene perso
  scene.input.manager = { pointers: [{ id: 7, isDown: false }] };
  scene.joyActive = true;
  scene.joyPointerId = 7;
  scene.joyVec.x = 0.8;
  scene._updateHeroMovement(0.016);
  assert.equal(scene.joyActive, false, 'Joystick deve resettarsi se pointer.isDown è false');
  assert.equal(scene.joyVec.x, 0);

  // 5. Verifica pubblicazione GitHub Pages statica senza npm install + AI Studio ('/')
  const root = process.cwd();
  const viteSrc = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
  const htmlSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const manifestSrc = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const swSrc = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const deployYml = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
  assert.equal(fs.existsSync(path.join(root, '.nojekyll')), true, '.nojekyll deve esistere nella root per GitHub Pages');
  assert.ok(deployYml.includes('actions/deploy-pages@v4') && deployYml.includes('actions/configure-pages@v5'), 'deploy.yml deve pubblicare con configure-pages + deploy-pages');
  assert.equal(deployYml.includes('npm install'), false, 'deploy.yml non deve eseguire npm install');
  assert.equal(manifestSrc.start_url, './', 'manifest.json deve usare start_url relativo ./');
  assert.equal(manifestSrc.scope, './', 'manifest.json deve usare scope relativo ./');
  assert.ok(viteSrc.includes('VITE_BASE_PATH') && viteSrc.includes(": '/'"), 'vite.config.ts deve supportare / in AI Studio');
  assert.equal(viteSrc.includes("base: './'"), false, 'vite.config.ts non deve forzare base ./ in dev server');
  assert.ok(htmlSrc.includes('src="./src/main.js"') && htmlSrc.includes("register('./sw.js'"), 'index.html deve usare percorsi relativi ./');
  assert.ok(swSrc.includes('key !== CACHE_NAME') && !swSrc.includes('FONT_CACHE'), 'sw.js deve eliminare ogni vecchia cache diversa da CACHE_NAME');
  assert.equal(swSrc.includes('__ASHEN_BUILD'), false, 'sw.js deve avere una versione esplicita pronta senza build');

  globalThis.document = prevDoc;
});

test('Espansione Gameplay: Bjorn + Martello Sismico, Evoluzioni, Mini-Boss/Forziere, Casse, Altari, Arciere e Codex', async () => {
  const prevDoc = globalThis.document;
  globalThis.document = undefined;

  const scene = new GameScene();
  const bridgeEvents = {
    levelUpChoices: null,
    chestReward: null,
    hud: null
  };
  scene.configureBridge(
    {
      onLevelUp: (choices) => { bridgeEvents.levelUpChoices = choices; },
      onChestOpened: (reward) => { bridgeEvents.chestReward = reward; },
      onHudUpdate: (data) => { bridgeEvents.hud = data; }
    },
    null
  );
  scene.preload();
  scene.create();

  // 1. Bjorn (juggernaut) + Martello Sismico
  const bjornPerks = getPerksForHeroLevel('juggernaut', 1);
  await scene.startNewRun({
    heroId: 'juggernaut',
    startingWeaponId: 'hammer',
    textureKey: 'hero_juggernaut',
    effectiveStats: bjornPerks
  });
  assert.equal(scene.hero.texture, 'hero_juggernaut');
  assert.equal(scene.levels.hammer, 1);

  scene._spawnEnemy('swarm', 0, 0, 60);
  const swarm = scene.activeEnemies[0];
  const swarmBefore = swarm.hp;
  scene.timers.hammer = 0;
  scene.update(100, 33);
  assert.ok(swarm.hp < swarmBefore || scene.kills >= 1, 'Martello Sismico deve colpire o abbattere ad area i nemici vicini');
  assert.ok(scene.activeExplosions.length >= 1, 'Martello Sismico deve generare onda VFX');

  // 2. Evoluzione Arma (Ascia Lv.5 + Furia di Tyr Lv.1 -> Ascia Cremisi del Ragnarok)
  scene.levels.axe = 5;
  scene.levels.might = 1;
  const evos = scene._getAvailableEvolutions();
  assert.equal(evos.some((e) => e.weaponId === 'axe'), true);
  scene._openLevelUpScreen();
  assert.equal(bridgeEvents.levelUpChoices[0].isEvolution, true);
  assert.equal(bridgeEvents.levelUpChoices[0].id, 'evo_axe');
  scene.applyUpgrade('evo_axe');
  assert.equal(scene.evolvedWeapons.axe, true);
  assert.equal(scene.evolutionsForged, 1);

  // 3. Mini-Boss Elite + Forziere del Valhalla
  scene._spawnMiniBoss(0);
  assert.ok(scene.activeMiniBoss && scene.activeMiniBoss.isMiniBoss === true);
  assert.equal(scene.activeMiniBoss.isBoss, false);
  scene._killEnemy(scene.activeMiniBoss);
  assert.equal(scene.miniBossesSlain, 1);
  assert.equal(scene.bossDefeated, false, 'Sconfiggere un mini-boss non deve attivare la vittoria finale');
  const chestPickup = scene.pickupItems.find((p) => p.active && p.kind === 'chest');
  assert.ok(chestPickup, 'Il mini-boss deve rilasciare un forziere');
  scene.hero.setPosition(chestPickup.x, chestPickup.y);
  scene._updatePickups(0.016);
  assert.equal(scene.gameState, 'CHEST');
  assert.ok(bridgeEvents.chestReward && bridgeEvents.chestReward.title);
  scene.resumeGame();
  assert.equal(scene.gameState, 'PLAYING');

  // 4. Casse distruttibili, Altari Runici e Arciere di Brina
  const crate = scene.crateItems.find((c) => c.activeCrate);
  assert.ok(crate);
  const broke = scene._damageCratesInRadius(crate.x, crate.y, 40);
  assert.equal(broke, true);
  assert.equal(scene.cratesBroken, 1);

  const shrine = scene.shrineItems[0];
  scene._activateShrine(shrine);
  assert.equal(scene.shrinesActivated, 1);
  assert.ok(scene.activeBuff && scene.activeBuff.remaining > 0);
  assert.ok(bridgeEvents.hud?.buff, 'Il buff attivo dell altare deve essere sincronizzato nell HUD');

  scene._spawnEnemy('archer', 0, 0, 200);
  const archer = scene.activeEnemies.find((e) => e.archetype === 'archer');
  assert.ok(archer);
  scene._fireEnemyFrostArrow(archer, scene.hero.x, scene.hero.y);
  assert.equal(scene.activeEnemyProjectiles.length, 1);
  assert.equal(scene.activeEnemyProjectiles[0].texture, 'frost_arrow');

  // 5. Codex delle Rune persistente
  localStorage.removeItem(CODEX_STORAGE_KEY);
  const initialCodex = getCodexView();
  assert.equal(initialCodex.totalCount, CODEX_ENTRIES.length);
  assert.ok(initialCodex.unlockedCount >= 4);

  const codexProgress = recordRunCodexProgress({
    heroId: 'juggernaut',
    kills: 150,
    elapsedSec: 100,
    cratesBroken: 4,
    shrinesActivated: 2,
    miniBossesSlain: 1,
    evolutionsForged: 1,
    bossDefeated: true,
    victory: true
  });
  assert.ok(codexProgress.newlyUnlocked.length >= 6);
  const afterCodex = getCodexView();
  assert.equal(afterCodex.unlockedCount > initialCodex.unlockedCount, true);

  globalThis.document = prevDoc;
});

test('Campagna Multi-Regno (Muspelheim/Surtr & Helheim/Hel), Dialoghi In-Run & Sblocchi', async () => {
  const prevDoc = globalThis.document;
  globalThis.document = undefined;

  // 1. Progressione Regni, migrazione vecchi salvataggi e bonus EXP
  assert.deepEqual(REALM_ORDER, ['midgard', 'muspelheim', 'helheim']);
  localStorage.removeItem(REALM_STORAGE_KEY);
  const freshRealms = loadRealmProgress(null);
  assert.deepEqual(freshRealms.unlockedRealms, ['midgard']);

  // Migrazione automatica per chi aveva già sconfitto Hrimthurs
  const migratedRealms = loadRealmProgress({ bossesSlain: 1 });
  assert.equal(migratedRealms.unlockedRealms.includes('muspelheim'), true);

  const muspelUnlock = recordRealmVictory('muspelheim', { bossesSlain: 1 });
  assert.equal(muspelUnlock.newlyUnlockedRealmId, 'helheim');
  assert.equal(muspelUnlock.progress.unlockedRealms.includes('helheim'), true);
  assert.equal(getRealmConfig('helheim').boss.id, 'hel');

  const xpBase = computeRunMetaXp({ elapsedSec: 120, kills: 100, bossDefeated: true, xpBonusMult: 1.0 });
  const xpMuspel = computeRunMetaXp({ elapsedSec: 120, kills: 100, bossDefeated: true, xpBonusMult: 1.25 });
  assert.ok(xpMuspel > xpBase, 'Muspelheim deve assegnare bonus EXP +25%');

  const dlgHero = getRealmDialogue('muspelheim', 'wave_1', 'assassin');
  assert.equal(dlgHero.speaker, 'Skadi');
  const dlgSurtr = getRealmDialogue('muspelheim', 'boss_enter', 'warrior');
  assert.equal(dlgSurtr.speaker, 'Surtr');

  // 2. Partita a Muspelheim: terreno lavico, nemici fire, dialoghi in-run, Surtr e meteoriti/fire_bolt
  const scene = new GameScene();
  const dialogues = [];
  const warnings = [];
  let lastEndResult = null;
  let lastBossHud = null;

  scene.configureBridge(
    {
      onDialogue: (d) => dialogues.push(d),
      onBossWarning: (active, txt) => warnings.push({ active, txt }),
      onBossHudUpdate: (b) => { lastBossHud = b; },
      onRunEnded: (r) => { lastEndResult = r; }
    },
    null
  );
  scene.preload();
  scene.create();

  await scene.startNewRun({
    heroId: 'warrior',
    startingWeaponId: 'axe',
    textureKey: 'hero_warrior',
    realmId: 'muspelheim'
  });

  assert.equal(scene.activeRealmId, 'muspelheim');
  assert.equal(scene.ground.texture, 'ground_tile_muspel');

  // Trigger ondate 1, 3, 5 e primo Mini-Boss -> dialoghi brevi emessi senza duplicati
  scene.elapsedSec = 31;
  scene.update(1000, 16);
  scene.elapsedSec = 91;
  scene.update(2000, 16);
  scene.elapsedSec = 151;
  scene.update(3000, 16);
  scene._spawnMiniBoss(0);

  assert.equal(dialogues.some((d) => d.triggerKey === 'wave_1'), true);
  assert.equal(dialogues.some((d) => d.triggerKey === 'wave_3'), true);
  assert.equal(dialogues.some((d) => d.triggerKey === 'wave_5'), true);
  assert.equal(dialogues.some((d) => d.triggerKey === 'miniboss_0'), true);

  // Spawn nemico Muspelheim -> texture dedicata & HP scalati +35%
  scene._spawnEnemy('swarm', 0, 0, 140);
  const muspelSwarm = scene.activeEnemies.find((e) => e.archetype === 'swarm');
  assert.equal(muspelSwarm.texture, 'enemy_muspel_swarm');
  assert.ok(muspelSwarm.maxHp >= 43, `HP Muspelheim atteso >= 43, ricevuto ${muspelSwarm.maxHp}`);

  // Trigger sequenza Surtr (warning, boss_enter, telegrafi fuoco + fase 50% HP + victory payload)
  await scene._triggerBossSequence();
  assert.equal(scene.bossSprite.texture, 'boss_surtr');
  assert.equal(lastBossHud.name, 'Surtr, Signore delle Braci');
  assert.equal(warnings.some((w) => w.active && w.txt.includes('SURTR')), true);
  assert.equal(dialogues.some((d) => d.triggerKey === 'boss_enter' && d.speaker === 'Surtr'), true);

  scene.timers.bossAttack = 0;
  scene.update(11000, 33);
  assert.ok(scene.activeTelegraphs.length >= 3, 'Surtr deve evocare pioggia di meteore telegrafata');
  assert.equal(
    scene.activeEnemyProjectiles.some((p) => p.texture === 'fire_bolt'),
    true,
    'Surtr deve scagliare una raffica radiale di fire_bolt'
  );

  // Porta Surtr sotto il 50% HP -> dialogo boss_half
  scene._damageEnemy(scene.bossSprite, 4000, 1, 0, 0, false);
  assert.equal(dialogues.some((d) => d.triggerKey === 'boss_half'), true);

  // Sconfiggi Surtr -> risultato vittoria con realmId e xpBonusMult
  scene._killEnemy(scene.bossSprite);
  await new Promise((r) => setTimeout(r, 760));
  assert.equal(lastEndResult?.victory, true);
  assert.equal(lastEndResult?.realmId, 'muspelheim');
  assert.equal(lastEndResult?.xpBonusMult, 1.25);

  // 3. Partita ad Helheim: terreno spettrale, Hel e spirale di shadow_bolt
  await scene.startNewRun({
    heroId: 'mage',
    startingWeaponId: 'orb',
    textureKey: 'hero_mage',
    realmId: 'helheim'
  });
  assert.equal(scene.ground.texture, 'ground_tile_hel');
  scene._spawnBoss();
  assert.equal(scene.bossSprite.texture, 'boss_hel');
  scene.timers.bossAttack = 0;
  scene.update(12000, 33);
  assert.equal(
    scene.activeEnemyProjectiles.some((p) => p.texture === 'shadow_bolt'),
    true,
    'Hel deve lanciare una spirale rotante di shadow_bolt'
  );

  // 4. Sblocco voci Codex per Muspelheim e Helheim
  localStorage.removeItem(CODEX_STORAGE_KEY);
  const muspelCodex = recordRunCodexProgress({
    realmId: 'muspelheim',
    heroId: 'warrior',
    kills: 40,
    elapsedSec: 245,
    bossDefeated: true,
    victory: true
  });
  const helCodex = recordRunCodexProgress({
    realmId: 'helheim',
    heroId: 'mage',
    kills: 40,
    elapsedSec: 245,
    bossDefeated: true,
    victory: true
  });
  const unlockedIds = new Set([
    ...muspelCodex.newlyUnlocked.map((e) => e.id),
    ...helCodex.newlyUnlocked.map((e) => e.id)
  ]);
  assert.equal(unlockedIds.has('enemy_muspel_legion'), true);
  assert.equal(unlockedIds.has('enemy_muspel_boss'), true);
  assert.equal(unlockedIds.has('enemy_hel_legion'), true);
  assert.equal(unlockedIds.has('enemy_hel_boss'), true);
  assert.equal(unlockedIds.has('lore_muspelheim'), true);
  assert.equal(unlockedIds.has('lore_helheim'), true);

  globalThis.document = prevDoc;
});

test('5 Nuove Armi Esclusive, Evoluzioni, Level-Up Filtrato & Riepilogo Danni', async () => {
  const prevDoc = globalThis.document;
  globalThis.document = undefined;

  const scene = new GameScene();
  let lastChoices = null;
  scene.configureBridge({ onLevelUp: (c) => { lastChoices = c; } }, null);
  scene.preload();
  scene.create();

  // 1. Astrid (warrior) -> Lancia di Odino + filtro Level-Up solo sulle sue 3 armi
  await scene.startNewRun({ heroId: 'warrior', startingWeaponId: 'spear', textureKey: 'hero_warrior' });
  scene._spawnEnemy('tank', 0, 0, 110);
  scene.timers.spear = 0;
  scene.update(100, 33);
  const spearProj = scene.activeProjectiles.find((p) => p.kind === 'spear' && p.texture === 'spear_proj');
  assert.ok(spearProj, 'Lancia di Odino deve lanciare spear_proj');

  scene._openLevelUpScreen();
  const warriorForbidden = ['dagger', 'scythe', 'fangs', 'orb', 'lightning', 'grimoire', 'hammer', 'aura', 'flail'];
  assert.equal(
    lastChoices.some((c) => warriorForbidden.includes(c.id)),
    false,
    'Il Level-Up di Astrid non deve proporre armi esclusive di altri eroi'
  );
  scene.resumeGame();

  // 2. Skadi (assassin) -> Falci del Crepuscolo (ritorno boomerang) & Spine d'Ombra (rimbalzo)
  await scene.startNewRun({ heroId: 'assassin', startingWeaponId: 'scythe', textureKey: 'hero_assassin' });
  scene._spawnEnemy('tank', 0, 0, 120);
  scene._spawnEnemy('tank', 0, 0.5, 160);
  scene.timers.scythe = 0;
  scene.update(100, 33);
  const scytheProj = scene.activeProjectiles.find((p) => p.kind === 'scythe' && p.texture === 'scythe_proj');
  assert.ok(scytheProj, 'Falci del Crepuscolo deve lanciare scythe_proj');
  scytheProj.life = 0.5;
  scene._updateProjectiles(0.02);
  assert.equal(scytheProj.returning, true, 'La falce deve invertire la rotta in fase di ritorno');

  scene.applyUpgrade('fangs');
  scene.timers.fangs = 0;
  scene.update(200, 33);
  const fangProj = scene.activeProjectiles.find((p) => p.kind === 'fangs' && p.texture === 'fang_proj');
  assert.ok(fangProj, 'Spine d Ombra deve lanciare fang_proj');
  const firstTarget = scene.activeEnemies[0];
  scene._onProjectileHitEnemy(fangProj, firstTarget);
  assert.equal(fangProj.active, true, 'La spina deve rimbalzare sul secondo nemico anziché riciclarsi subito');

  // 3. Freya (mage) -> Grimorio Astrale (pilastri VFX + danno)
  await scene.startNewRun({ heroId: 'mage', startingWeaponId: 'grimoire', textureKey: 'hero_mage' });
  const grimoireTarget = scene._spawnEnemy('tank', 0, 0, 120);
  const hpBeforeGrimoire = grimoireTarget.hp;
  scene.timers.grimoire = 0;
  scene.update(100, 33);
  assert.ok(scene.activeAstralPillars.length >= 1, 'Grimorio Astrale deve generare pilastri runici');
  assert.ok(grimoireTarget.hp < hpBeforeGrimoire, 'Grimorio Astrale deve danneggiare i nemici sotto il pilastro');

  // 4. Bjorn (juggernaut) -> Flagello a Catena (spazzata rotante) + Evoluzioni + Riepilogo Danni
  await scene.startNewRun({ heroId: 'juggernaut', startingWeaponId: 'flail', textureKey: 'hero_juggernaut' });
  const flailTarget = scene._spawnEnemy('tank', 0, 0, 82);
  const hpBeforeFlail = flailTarget.hp;
  scene.timers.flail = 0;
  scene.update(100, 33);
  assert.ok(scene.activeFlailSwing, 'Flagello a Catena deve attivare la spazzata rotante');
  for (let s = 0; s < 14; s++) {
    scene.update(133 + s * 33, 33);
  }
  assert.ok(flailTarget.hp < hpBeforeFlail, 'Il Flagello a Catena deve colpire i nemici lungo l arco');

  for (const [wId, passiveId, evoId] of [
    ['spear', 'swift', 'evo_spear'],
    ['scythe', 'might', 'evo_scythe'],
    ['fangs', 'area', 'evo_fangs'],
    ['grimoire', 'regen', 'evo_grimoire'],
    ['flail', 'area', 'evo_flail']
  ]) {
    scene.levels[wId] = 5;
    scene.levels[passiveId] = 1;
    assert.equal(scene._getAvailableEvolutions().some((e) => e.id === evoId), true, `Evoluzione mancante: ${evoId}`);
    scene.applyUpgrade(evoId);
    assert.equal(scene.evolvedWeapons[wId], true);
  }

  const breakdown = scene._getDamageBreakdown();
  assert.ok(breakdown.length >= 1, 'Il riepilogo danni deve contenere le armi usate');
  assert.equal(breakdown[0].id, 'flail');
  assert.ok(breakdown[0].damage > 0 && breakdown[0].percent === 100);

  globalThis.document = prevDoc;
});

test('4 Nuovi Archetipi Nemici, Abilità Attive Eroi, Modificatori Sfida & Codex Esteso', async () => {
  const prevDoc = globalThis.document;
  globalThis.document = undefined;

  const scene = new GameScene();
  let lastHud = null;
  let lastEnd = null;
  scene.configureBridge(
    {
      onHudUpdate: (h) => { lastHud = h; },
      onRunEnded: (r) => { lastEnd = r; }
    },
    null
  );
  scene.preload();
  scene.create();

  // 1. Verifica Modificatore Sfida Titanomachy (+55% HP, +60% EXP, persistenza storage)
  assert.deepEqual(CHALLENGE_ORDER, ['standard', 'double_horde', 'dark_frenzy', 'titanomachy']);
  localStorage.removeItem(REALM_STORAGE_KEY);
  const rp = loadRealmProgress();
  rp.selectedChallenge = 'titanomachy';
  saveRealmProgress(rp);
  assert.equal(loadRealmProgress().selectedChallenge, 'titanomachy');
  assert.equal(getChallengeConfig('titanomachy').hpMult, 1.55);

  await scene.startNewRun({
    heroId: 'mage',
    startingWeaponId: 'orb',
    realmId: 'midgard',
    challengeId: 'titanomachy'
  });

  const titanSwarm = scene._spawnEnemy('swarm', 0, 0, 180);
  assert.equal(titanSwarm.maxHp, Math.round(32 * 1.55), 'Titanomachia deve scalare gli HP nemici del +55%');

  // 2. Sciamano Runico evoca alleati nell'orda
  const shaman = scene._spawnEnemy('shaman', 0, 0, 220);
  shaman.summonWindup = 0.01;
  const countBeforeSummon = scene.activeEnemies.length;
  scene._updateEnemiesAndBoss(0.03);
  assert.ok(scene.activeEnemies.length > countBeforeSummon, 'Lo Sciamano Runico deve evocare alleati nell orda');

  // 3. Portatore Esplosivo detona con telegrafo alla morte
  const bomber = scene._spawnEnemy('bomber', 0, 1, 200);
  const teleBefore = scene.activeTelegraphs.length;
  scene._killEnemy(bomber);
  assert.equal(scene.activeTelegraphs.length, teleBefore + 1, 'Il Portatore Esplosivo deve creare un telegrafo esplosivo alla morte');

  // 4. Scudiero Corazzato riduce i colpi frontali ma non quelli bypassShield
  const shield = scene._spawnEnemy('shieldbearer', 0, 0, 140);
  shield.setPosition(140, 0);
  scene.hero.setPosition(0, 0);
  const shieldHpBefore = shield.hp;
  scene._damageEnemy(shield, 40, 1, 0, 50, false, 0xffffff, 'axe', false);
  assert.equal(shieldHpBefore - shield.hp, 14, 'Lo Scudiero Corazzato deve bloccare il 65% dei colpi frontali (40 -> 14)');
  const hpAfterBlock = shield.hp;
  scene._damageEnemy(shield, 40, 1, 0, 50, false, 0xffffff, 'aura', true);
  assert.equal(hpAfterBlock - shield.hp, 40, 'Gli attacchi ad area/aura con bypassShield devono infliggere danno pieno');

  // 5. Ombra Guizzante esegue scatto laterale improvviso
  const stalker = scene._spawnEnemy('stalker', 0, 0, 160);
  stalker.dashCooldown = 0;
  scene._updateEnemiesAndBoss(0.03);
  assert.ok(stalker.dashTime > 0, 'L Ombra Guizzante deve attivare lo scatto laterale');

  // 6. Abilità Attive per tutti e 4 gli eroi (Freya congelamento + magnete, Astrid, Skadi, Bjorn)
  scene._spawnXpGem(120, 120, 3);
  assert.equal(scene.triggerActiveSkill(), true);
  assert.ok(lastHud?.activeSkill && lastHud.activeSkill.ready === false);
  assert.ok(shield.freezeTimer >= 2.8, 'Rottura Runica di Freya deve congelare i nemici vicini');
  assert.equal(scene.activeGems.some((g) => g.active && g.magnetized), true, 'Rottura Runica deve attirare le gemme');

  for (const hId of ['warrior', 'assassin', 'juggernaut']) {
    await scene.startNewRun({ heroId: hId, startingWeaponId: HERO_ROSTER[hId].weapons[0].id, challengeId: 'titanomachy' });
    scene._spawnEnemy('swarm', 0, 0, 90);
    assert.equal(scene.triggerActiveSkill(), true, `Abilità attiva non attivata per ${hId}`);
    if (hId === 'warrior') assert.ok(scene.activeSkillBuffTimer > 0);
    if (hId === 'assassin') assert.ok(scene.activeProjectiles.some((p) => p.kind === 'dagger'));
    if (hId === 'juggernaut') assert.ok(scene.ironSkinTimer > 0);
  }

  // Verifica Game Over con challengeId e xpBonusMult combinato
  scene._triggerGameOver();
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(lastEnd?.challengeId, 'titanomachy');
  assert.equal(lastEnd?.xpBonusMult, 1.6);
  assert.ok(lastEnd?.skillsUsed >= 1);

  // 7. Sblocco nuove voci Codex
  localStorage.removeItem(CODEX_STORAGE_KEY);
  const codexRes = recordRunCodexProgress({
    heroId: 'warrior',
    kills: 35,
    elapsedSec: 60,
    skillsUsed: 2,
    encounteredEnemies: ['shaman', 'bomber', 'shieldbearer', 'stalker'],
    damageBreakdown: [{ id: 'axe', damage: 200, percent: 100 }]
  });
  const newCodexIds = new Set(codexRes.newlyUnlocked.map((e) => e.id));
  for (const expectedId of ['enemy_shaman', 'enemy_bomber', 'enemy_shieldbearer', 'enemy_stalker', 'wpn_exclusive_arsenal', 'lore_active_skills']) {
    assert.equal(newCodexIds.has(expectedId), true, `Voce Codex non sbloccata: ${expectedId}`);
  }

  globalThis.document = prevDoc;
});


