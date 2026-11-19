/**
 * Entry point Phaser 3 & Controller UI/PWA per Ashen Midgard.
 * Gestisce configurazione Phaser Portrait, HUD HTML/CSS, schermate Titolo/Pausa/Level-Up,
 * salvataggio record locali, prompt di installazione PWA e indicatore Offline.
 */

import { audio } from './audio.js';
import { StoryManager } from './storyManager.js';
import { GameScene, GAME_CONFIG } from './gameScene.js';
import {
  HERO_ROSTER,
  HERO_ORDER,
  loadMetaProgress,
  saveMetaProgress,
  getHeroLevelFromXp,
  getPerksForHeroLevel,
  getNextUnlockHint,
  grantHeroMetaXp
} from './heroes.js';

const RECORDS_STORAGE_KEY = 'ashen_midgard_records_v1';

// Icone SVG nitide per gli eroi nel selettore
const HERO_PORTRAITS = {
  warrior: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l6 4v5c0 4-3 7-6 9-3-2-6-5-6-9V7l6-4z" fill="currentColor" fill-opacity="0.2"/><path d="M9 11l3 3 3-3"/></svg>',
  assassin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19L19 5M15 5h4v4"/><path d="M19 19L5 5M5 9V5h4"/></svg>',
  mage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="9" r="5" fill="currentColor" fill-opacity="0.22"/><path d="M12 14v7M8 18h8"/></svg>'
};

// Icone SVG nitide per le carte Level-Up e la barra build attiva
const UPGRADE_ICONS = {
  axe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19L19 5"/><path d="M13 3c4 0 8 3 8 7l-6-2-2-5z" fill="currentColor" fill-opacity="0.25"/></svg>',
  aura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" stroke-dasharray="3 2"/></svg>',
  lightning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" fill="currentColor" fill-opacity="0.25"/></svg>',
  blades: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 8-3 3-3-3 3-8z"/><path d="M22 12l-8 3-3-3 3-3 8 3z"/><path d="M12 22l-3-8 3-3 3 3-3 8z"/><path d="M2 12l8-3 3 3-3 3-8-3z"/></svg>',
  dagger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l5-5m11-11l-9 5 4 4 5-9z" fill="currentColor" fill-opacity="0.25"/><path d="M7 13l4 4"/></svg>',
  orb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="6" fill="currentColor" fill-opacity="0.28"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  might: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/></svg>',
  swift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14c4 0 6-4 10-4h6l-3 5h-5l-4 4H4v-5z"/></svg>',
  area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>',
  magnet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v7a6 6 0 0012 0V4"/><path d="M6 4h3v7a3 3 0 006 0V4h3"/></svg>',
  regen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.5-9-9.5C1.5 7.5 4.5 4 8 4c2 0 3.5 1 4 2.5C12.5 5 14 4 16 4c3.5 0 6.5 3.5 5 7.5-2 5-9 9.5-9 9.5z"/></svg>'
};

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignora storage bloccato
  }
  return { bestTimeSec: 0, maxKills: 0, bossesSlain: 0, maxLevel: 1 };
}

function saveRecords(runResult) {
  const prev = loadRecords();
  const isNewRecord =
    runResult.elapsedSec > prev.bestTimeSec ||
    runResult.kills > prev.maxKills ||
    (runResult.bossDefeated && prev.bossesSlain === 0);

  const next = {
    bestTimeSec: Math.max(prev.bestTimeSec, runResult.elapsedSec),
    maxKills: Math.max(prev.maxKills, runResult.kills),
    bossesSlain: prev.bossesSlain + (runResult.bossDefeated ? 1 : 0),
    maxLevel: Math.max(prev.maxLevel, runResult.level)
  };

  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignora storage bloccato
  }
  return { records: next, isNewRecord };
}

// Elementi DOM principali
const el = {
  titleScreen: document.getElementById('title-screen'),
  playBtn: document.getElementById('play-btn'),
  titleMuteBtn: document.getElementById('title-mute-btn'),
  heroSelectorGrid: document.getElementById('hero-selector-grid'),
  heroDetailPanel: document.getElementById('hero-detail-panel'),
  selectedHeroDesc: document.getElementById('selected-hero-desc'),
  selectedHeroStats: document.getElementById('selected-hero-stats'),
  weaponSelectorList: document.getElementById('weapon-selector-list'),
  heroPerksActive: document.getElementById('hero-perks-active'),
  heroNextUnlock: document.getElementById('hero-next-unlock'),
  recTime: document.getElementById('rec-time'),
  recKills: document.getElementById('rec-kills'),
  recBoss: document.getElementById('rec-boss'),
  recLevel: document.getElementById('rec-level'),

  gameHud: document.getElementById('game-hud'),
  xpFill: document.getElementById('xp-fill'),
  hudLevel: document.getElementById('hud-level'),
  hudTimer: document.getElementById('hud-timer'),
  hudKills: document.getElementById('hud-kills'),
  hudBuildStrip: document.getElementById('hud-build-strip'),
  pauseBtn: document.getElementById('pause-btn'),

  bossHud: document.getElementById('boss-hud'),
  bossName: document.getElementById('boss-name'),
  bossHpText: document.getElementById('boss-hp-text'),
  bossHpFill: document.getElementById('boss-hp-fill'),
  bossWarning: document.getElementById('boss-warning'),

  levelupModal: document.getElementById('levelup-modal'),
  levelupCards: document.getElementById('levelup-cards'),

  pauseModal: document.getElementById('pause-modal'),
  resumeBtn: document.getElementById('resume-btn'),
  restartBtn: document.getElementById('restart-btn'),
  quitBtn: document.getElementById('quit-btn'),
  pauseMuteBtn: document.getElementById('pause-mute-btn'),
  pauseBuildList: document.getElementById('pause-build-list'),

  endModal: document.getElementById('end-modal'),
  endTitle: document.getElementById('end-title'),
  endSubtitle: document.getElementById('end-subtitle'),
  endNewRecord: document.getElementById('end-new-record'),
  endTime: document.getElementById('end-time'),
  endKills: document.getElementById('end-kills'),
  endLevel: document.getElementById('end-level'),
  endMetaHero: document.getElementById('end-meta-hero'),
  endMetaXp: document.getElementById('end-meta-xp'),
  endMetaXpFill: document.getElementById('end-meta-xp-fill'),
  endMetaLevelUp: document.getElementById('end-meta-levelup'),
  endMetaUnlocks: document.getElementById('end-meta-unlocks'),
  playAgainBtn: document.getElementById('play-again-btn'),
  endTitleBtn: document.getElementById('end-title-btn'),

  pwaInstallBtn: document.getElementById('pwa-install-btn'),
  iosGuideModal: document.getElementById('ios-guide-modal'),
  iosGuideClose: document.getElementById('ios-guide-close'),
  offlineBanner: document.getElementById('offline-banner')
};

function renderTitleRecords() {
  const rec = loadRecords();
  if (el.recTime) el.recTime.textContent = formatTime(rec.bestTimeSec);
  if (el.recKills) el.recKills.textContent = String(rec.maxKills);
  if (el.recBoss) el.recBoss.textContent = String(rec.bossesSlain);
  if (el.recLevel) el.recLevel.textContent = `LV ${rec.maxLevel}`;
}

function updateMuteButtons() {
  const muted = audio.isMuted();
  const label = muted ? 'Audio: Disattivo' : 'Audio: Attivo';
  if (el.titleMuteBtn) el.titleMuteBtn.textContent = label;
  if (el.pauseMuteBtn) el.pauseMuteBtn.textContent = label;
}

/**
 * Inizializza stato PWA (Install Prompt + guida iOS + stato Offline)
 */
function setupPwaExperience() {
  let deferredPrompt = null;
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  const refreshInstallVisibility = () => {
    if (!el.pwaInstallBtn) return;
    if (isStandalone) {
      el.pwaInstallBtn.classList.add('hidden');
      return;
    }
    if (deferredPrompt || isIOS) {
      el.pwaInstallBtn.classList.remove('hidden');
    }
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    refreshInstallVisibility();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (el.pwaInstallBtn) el.pwaInstallBtn.classList.add('hidden');
  });

  el.pwaInstallBtn?.addEventListener('click', async () => {
    audio.playUiClick();
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
        el.pwaInstallBtn.classList.add('hidden');
      }
    } else if (isIOS && el.iosGuideModal) {
      el.iosGuideModal.classList.remove('hidden');
      el.iosGuideModal.classList.add('flex');
    }
  });

  el.iosGuideClose?.addEventListener('click', () => {
    audio.playUiClick();
    el.iosGuideModal?.classList.add('hidden');
    el.iosGuideModal?.classList.remove('flex');
  });

  const syncOnlineState = () => {
    if (!el.offlineBanner) return;
    if (navigator.onLine) {
      el.offlineBanner.classList.add('hidden');
    } else {
      el.offlineBanner.classList.remove('hidden');
    }
  };
  window.addEventListener('online', syncOnlineState);
  window.addEventListener('offline', syncOnlineState);
  syncOnlineState();
  refreshInstallVisibility();
}

// Avvio principale al caricamento DOM
window.addEventListener('DOMContentLoaded', async () => {
  let metaState = loadMetaProgress();

  const buildRunConfig = () => {
    const heroId = HERO_ROSTER[metaState.selectedHero] ? metaState.selectedHero : 'warrior';
    const hero = HERO_ROSTER[heroId];
    const lvInfo = getHeroLevelFromXp(metaState.heroXp[heroId] || 0);
    const perks = getPerksForHeroLevel(heroId, lvInfo.level);
    const storedWep = metaState.selectedWeapons[heroId];
    const startingWeaponId = perks.unlockedWeapons.includes(storedWep)
      ? storedWep
      : hero.weapons[0].id;
    return {
      heroId,
      startingWeaponId,
      textureKey: hero.textureKey,
      effectiveStats: perks
    };
  };

  const renderHeroSelection = () => {
    metaState = loadMetaProgress();
    const activeHeroId = HERO_ROSTER[metaState.selectedHero] ? metaState.selectedHero : 'warrior';
    const activeHero = HERO_ROSTER[activeHeroId];
    const activeLvInfo = getHeroLevelFromXp(metaState.heroXp[activeHeroId] || 0);
    const activePerks = getPerksForHeroLevel(activeHeroId, activeLvInfo.level);

    if (!activePerks.unlockedWeapons.includes(metaState.selectedWeapons[activeHeroId])) {
      metaState.selectedWeapons[activeHeroId] = activeHero.weapons[0].id;
      saveMetaProgress(metaState);
    }
    const activeWeaponId = metaState.selectedWeapons[activeHeroId];

    if (el.heroSelectorGrid) {
      el.heroSelectorGrid.innerHTML = '';
      HERO_ORDER.forEach((hId) => {
        const hero = HERO_ROSTER[hId];
        const lvInfo = getHeroLevelFromXp(metaState.heroXp[hId] || 0);
        const pct = Math.min(100, Math.round((lvInfo.currentLevelXp / lvInfo.xpToNextLevel) * 100));
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `hero-card${hId === activeHeroId ? ' is-selected' : ''}`;
        card.style.setProperty('--hero-accent', hero.accent);
        card.setAttribute('aria-pressed', String(hId === activeHeroId));
        card.innerHTML = `
          <div class="hero-avatar" style="color:${hero.accent};border-color:${hero.accent}55">
            ${HERO_PORTRAITS[hId] || ''}
          </div>
          <span class="hero-card-name">${hero.name}</span>
          <span class="hero-card-role">${hero.title}</span>
          <span class="hero-card-lv">LV ${lvInfo.level}</span>
          <div class="hero-xp-track"><div class="hero-xp-fill" style="width:${pct}%"></div></div>
        `;
        card.addEventListener('click', () => {
          audio.unlock();
          audio.playUiClick();
          metaState.selectedHero = hId;
          saveMetaProgress(metaState);
          renderHeroSelection();
        });
        el.heroSelectorGrid.appendChild(card);
      });
    }

    if (el.heroDetailPanel) {
      el.heroDetailPanel.style.setProperty('--hero-accent', activeHero.accent);
    }
    if (el.selectedHeroDesc) {
      el.selectedHeroDesc.textContent = `${activeHero.name} (${activeHero.title}) — ${activeHero.summary}`;
    }
    if (el.selectedHeroStats) {
      const dmgPct = Math.round(activePerks.mightMult * 100);
      const critPct = Math.round(activePerks.critChance * 100);
      el.selectedHeroStats.textContent = `HP ${activePerks.maxHp} · VEL ${activePerks.speed} · DANNO ${dmgPct}% · CRIT ${critPct}%`;
    }

    if (el.weaponSelectorList) {
      el.weaponSelectorList.innerHTML = '';
      activeHero.weapons.forEach((w) => {
        const unlocked = activeLvInfo.level >= w.unlockLevel;
        const selected = unlocked && w.id === activeWeaponId;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `weapon-choice-btn${selected ? ' is-selected' : ''}`;
        btn.disabled = !unlocked;
        btn.style.setProperty('--hero-accent', activeHero.accent);
        btn.setAttribute('aria-pressed', String(selected));
        btn.innerHTML = `
          <span class="weapon-choice-icon" style="color:${unlocked ? activeHero.accent : '#64748b'}">
            ${UPGRADE_ICONS[w.id] || ''}
          </span>
          <span class="weapon-choice-name">${w.name}</span>
          <span class="weapon-choice-lock">${unlocked ? w.role : `Sblocca Lv.${w.unlockLevel}`}</span>
        `;
        if (unlocked) {
          btn.addEventListener('click', () => {
            audio.unlock();
            audio.playUiClick();
            metaState.selectedWeapons[activeHeroId] = w.id;
            saveMetaProgress(metaState);
            renderHeroSelection();
          });
        }
        el.weaponSelectorList.appendChild(btn);
      });
    }

    if (el.heroPerksActive) {
      el.heroPerksActive.textContent =
        activePerks.activeLabels.length > 0
          ? `Bonus attivi: ${activePerks.activeLabels.join(' · ')}`
          : 'Bonus attivi: Nessuno (sopravvivi per salire di grado)';
    }
    if (el.heroNextUnlock) {
      el.heroNextUnlock.textContent = getNextUnlockHint(activeHeroId, activeLvInfo.level);
    }
  };

  renderHeroSelection();
  renderTitleRecords();
  updateMuteButtons();
  setupPwaExperience();

  const storyManager = new StoryManager(audio);
  await storyManager.load('./story.json');

  const gameScene = new GameScene();

  // Bridge eventi tra Phaser GameScene e Overlay HTML/CSS
  const bridge = {
    onSceneReady() {
      // Abilita pulsante GIOCA una volta pronte le texture procedurali
      if (el.playBtn) el.playBtn.disabled = false;
    },

    onHudUpdate(data) {
      const pct = Math.min(100, Math.max(0, (data.xp / Math.max(1, data.xpNeeded)) * 100));
      if (el.xpFill) el.xpFill.style.width = `${pct.toFixed(1)}%`;
      if (el.hudLevel) el.hudLevel.textContent = `LV ${data.level}`;
      if (el.hudKills) el.hudKills.textContent = String(data.kills);
      if (el.hudTimer) {
        el.hudTimer.textContent = data.bossSpawned
          ? `BOSS · ${formatTime(data.elapsedSec)}`
          : formatTime(data.remainingSec);
        el.hudTimer.classList.toggle('is-boss', data.bossSpawned);
      }
      if (el.hudBuildStrip && Array.isArray(data.build)) {
        el.hudBuildStrip.innerHTML = data.build
          .map(
            (item) => `
            <div class="build-chip" title="${item.name}" style="border-color:${item.accent}44;color:${item.accent}">
              <span class="build-chip-icon">${UPGRADE_ICONS[item.id] || ''}</span>
              <span class="build-chip-lv">${item.level}</span>
            </div>`
          )
          .join('');
      }
    },

    onBossWarning(active) {
      if (!el.bossWarning) return;
      el.bossWarning.classList.toggle('hidden', !active);
    },

    onBossHudUpdate(bossData) {
      if (!el.bossHud) return;
      if (!bossData) {
        el.bossHud.classList.add('hidden');
        return;
      }
      el.bossHud.classList.remove('hidden');
      if (el.bossName) el.bossName.textContent = bossData.name;
      if (el.bossHpText) el.bossHpText.textContent = `${Math.ceil(bossData.hp)} / ${bossData.maxHp}`;
      if (el.bossHpFill) {
        const pct = Math.max(0, Math.min(100, (bossData.hp / bossData.maxHp) * 100));
        el.bossHpFill.style.width = `${pct.toFixed(1)}%`;
      }
    },

    onLevelUp(choices) {
      if (!el.levelupModal || !el.levelupCards) return;
      el.levelupCards.innerHTML = '';

      choices.forEach((choice) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'upgrade-card';
        const levelTag =
          choice.currentLevel === 0
            ? 'NUOVO'
            : `LV ${choice.currentLevel} → LV ${choice.nextLevel}`;

        card.innerHTML = `
          <div class="upgrade-icon" style="color:${choice.accent};border-color:${choice.accent}55">
            ${UPGRADE_ICONS[choice.id] || ''}
          </div>
          <div class="upgrade-body">
            <div class="upgrade-head">
              <span class="upgrade-name">${choice.name}</span>
              <span class="upgrade-lv">${levelTag}</span>
            </div>
            <p class="upgrade-desc">${choice.description}</p>
          </div>
        `;
        card.addEventListener('click', () => {
          audio.playUiClick();
          el.levelupModal.classList.add('hidden');
          el.levelupModal.classList.remove('flex');
          gameScene.applyUpgrade(choice.id);
        });
        el.levelupCards.appendChild(card);
      });

      el.levelupModal.classList.remove('hidden');
      el.levelupModal.classList.add('flex');
    },

    onPauseChanged(isPaused, build) {
      if (!el.pauseModal) return;
      if (isPaused) {
        if (el.pauseBuildList && Array.isArray(build)) {
          el.pauseBuildList.innerHTML = build
            .map(
              (item) => `
              <div class="pause-build-item">
                <span class="pause-build-name" style="color:${item.accent}">${item.name}</span>
                <span class="pause-build-lv">LV ${item.level}/${item.maxLevel}</span>
              </div>`
            )
            .join('');
        }
        el.pauseModal.classList.remove('hidden');
        el.pauseModal.classList.add('flex');
      } else {
        el.pauseModal.classList.add('hidden');
        el.pauseModal.classList.remove('flex');
      }
    },

    onRunEnded(result) {
      const { isNewRecord } = saveRecords(result);
      const metaUpdate = grantHeroMetaXp(result.heroId || metaState.selectedHero, result);
      metaState = metaUpdate.meta;
      renderTitleRecords();
      renderHeroSelection();

      if (el.gameHud) el.gameHud.classList.add('hidden');
      if (el.bossHud) el.bossHud.classList.add('hidden');

      if (el.endTitle) {
        el.endTitle.textContent = result.victory ? 'VITTORIA A MIDGARD' : 'CADUTO NELL’INVERNO';
        el.endTitle.classList.toggle('is-victory', result.victory);
      }
      if (el.endSubtitle) {
        el.endSubtitle.textContent = result.victory
          ? 'Hrimthurs è stato abbattuto. Le rune brillano ancora.'
          : 'L’orda ti ha sopraffatto, ma il Valhalla attende la tua rivincita.';
      }
      if (el.endNewRecord) {
        el.endNewRecord.classList.toggle('hidden', !isNewRecord);
      }
      if (el.endTime) el.endTime.textContent = formatTime(result.elapsedSec);
      if (el.endKills) el.endKills.textContent = String(result.kills);
      if (el.endLevel) el.endLevel.textContent = `LV ${result.level}`;

      const heroObj = HERO_ROSTER[metaUpdate.heroId] || HERO_ROSTER.warrior;
      const xpPct = Math.min(
        100,
        Math.round((metaUpdate.levelInfo.currentLevelXp / metaUpdate.levelInfo.xpToNextLevel) * 100)
      );
      if (el.endMetaHero) {
        el.endMetaHero.textContent = `${heroObj.name} · LV ${metaUpdate.newLevel}`;
        el.endMetaHero.style.color = heroObj.accent;
      }
      if (el.endMetaXp) {
        el.endMetaXp.textContent = `+${metaUpdate.gainedXp} EXP`;
      }
      if (el.endMetaXpFill) {
        el.endMetaXpFill.style.width = `${xpPct}%`;
        el.endMetaXpFill.style.background = heroObj.accent;
      }
      if (el.endMetaLevelUp) {
        el.endMetaLevelUp.classList.toggle('hidden', !metaUpdate.leveledUp);
        if (metaUpdate.leveledUp) {
          el.endMetaLevelUp.textContent = `NUOVO GRADO! LV ${metaUpdate.prevLevel} → LV ${metaUpdate.newLevel}`;
        }
      }
      if (el.endMetaUnlocks) {
        const unlockedNames = metaUpdate.unlockedWeapons.map((w) => w.name);
        if (metaUpdate.leveledUp && metaUpdate.newLevel >= 3 && metaUpdate.prevLevel < 3) {
          unlockedNames.push('+12% Danno permanente');
        }
        if (metaUpdate.leveledUp && metaUpdate.newLevel >= 4 && metaUpdate.prevLevel < 4) {
          unlockedNames.push('+8% Velocità permanente');
        }
        if (metaUpdate.leveledUp && metaUpdate.newLevel >= 5 && metaUpdate.prevLevel < 5) {
          unlockedNames.push('+15% Area & +18% Magnete');
        }
        if (unlockedNames.length > 0) {
          el.endMetaUnlocks.textContent = `Sbloccato: ${unlockedNames.join(' · ')}`;
          el.endMetaUnlocks.classList.remove('hidden');
        } else {
          el.endMetaUnlocks.classList.add('hidden');
        }
      }

      if (el.endModal) {
        el.endModal.classList.remove('hidden');
        el.endModal.classList.add('flex');
      }
    }
  };

  gameScene.configureBridge(bridge, storyManager);

  // Configurazione Phaser 3 Portrait ottimizzata per Mobile + Grafica HD moderna
  const phaserConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 450,
    height: 800,
    backgroundColor: '#0f172a',
    pixelArt: false,
    roundPixels: false,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [gameScene]
  };

  // eslint-disable-next-line no-unused-vars
  const game = new Phaser.Game(phaserConfig);

  // Collegamento bottoni UI
  const startGameFlow = async () => {
    audio.unlock();
    audio.playUiClick();
    el.titleScreen?.classList.add('hidden');
    el.endModal?.classList.add('hidden');
    el.endModal?.classList.remove('flex');
    el.pauseModal?.classList.add('hidden');
    el.pauseModal?.classList.remove('flex');
    el.gameHud?.classList.remove('hidden');

    await gameScene.startNewRun(buildRunConfig());
  };

  el.playBtn?.addEventListener('click', startGameFlow);
  el.playAgainBtn?.addEventListener('click', startGameFlow);

  el.titleMuteBtn?.addEventListener('click', () => {
    audio.unlock();
    audio.toggleMute();
    updateMuteButtons();
    audio.playUiClick();
  });

  el.pauseMuteBtn?.addEventListener('click', () => {
    audio.unlock();
    audio.toggleMute();
    updateMuteButtons();
    audio.playUiClick();
  });

  el.pauseBtn?.addEventListener('click', () => {
    audio.playUiClick();
    gameScene.pauseGame(false);
  });

  el.resumeBtn?.addEventListener('click', () => {
    audio.playUiClick();
    bridge.onPauseChanged(false);
    gameScene.resumeGame();
  });

  el.restartBtn?.addEventListener('click', startGameFlow);

  const returnToTitle = () => {
    audio.playUiClick();
    el.pauseModal?.classList.add('hidden');
    el.pauseModal?.classList.remove('flex');
    el.endModal?.classList.add('hidden');
    el.endModal?.classList.remove('flex');
    el.gameHud?.classList.add('hidden');
    el.bossHud?.classList.add('hidden');
    el.titleScreen?.classList.remove('hidden');
    gameScene.gameState = 'IDLE';
    gameScene.physics.pause();
    renderHeroSelection();
    renderTitleRecords();
  };

  el.quitBtn?.addEventListener('click', returnToTitle);
  el.endTitleBtn?.addEventListener('click', returnToTitle);

  // Tasto ESC o P per mettere in pausa su desktop
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' || ev.key === 'p' || ev.key === 'P') {
      if (gameScene.gameState === 'PLAYING') {
        gameScene.pauseGame(false);
      } else if (gameScene.gameState === 'PAUSED') {
        bridge.onPauseChanged(false);
        gameScene.resumeGame();
      }
    }
  });

  // Pausa automatica se l'utente cambia app o mette in background il telefono
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameScene.gameState === 'PLAYING') {
      gameScene.pauseGame(false);
    }
  });

  // Esponi riferimento utile per debug console (opzionale, non invasivo)
  window.__ASHEN_MIDGARD_CONFIG__ = GAME_CONFIG;
});
