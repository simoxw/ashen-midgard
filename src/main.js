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

import {
  CODEX_CATEGORIES,
  getCodexView,
  loadCodexState,
  recordRunCodexProgress
} from './codex.js';
import {
  REALM_CATALOG,
  REALM_ORDER,
  CHALLENGE_ORDER,
  REALM_CHALLENGES,
  getRealmConfig,
  loadRealmProgress,
  saveRealmProgress,
  recordRealmVictory,
  isEndlessUnlocked,
  recordEndlessRun
} from './realms.js';
import {
  loadSettings,
  saveSettings,
  resetSettings
} from './settings.js';

const RECORDS_STORAGE_KEY = 'ashen_midgard_records_v1';

// Icone SVG nitide per gli eroi nel selettore
const HERO_PORTRAITS = {
  warrior: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l6 4v5c0 4-3 7-6 9-3-2-6-5-6-9V7l6-4z" fill="currentColor" fill-opacity="0.2"/><path d="M9 11l3 3 3-3"/></svg>',
  assassin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19L19 5M15 5h4v4"/><path d="M19 19L5 5M5 9V5h4"/></svg>',
  mage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="9" r="5" fill="currentColor" fill-opacity="0.22"/><path d="M12 14v7M8 18h8"/></svg>',
  juggernaut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="8" rx="2" fill="currentColor" fill-opacity="0.24"/><path d="M12 12v9M9 21h6"/></svg>'
};

// Icone SVG per le abilità attive degli eroi
const SKILL_ICONS = {
  skill_valkyrie_leap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" fill="currentColor" fill-opacity="0.25"/></svg>',
  skill_shadow_step: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 17l6-6-4-4 12-3-3 12-4-4-7 5z" fill="currentColor" fill-opacity="0.22"/></svg>',
  skill_rune_rupture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.28"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/></svg>',
  skill_iron_skin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l7 3v6c0 5-3.2 8.7-7 11-3.8-2.3-7-6-7-11V5l7-3z" fill="currentColor" fill-opacity="0.26"/><path d="M9 12h6M12 9v6"/></svg>'
};

// Icone SVG nitide per le carte Level-Up e la barra build attiva
const UPGRADE_ICONS = {
  axe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19L19 5"/><path d="M13 3c4 0 8 3 8 7l-6-2-2-5z" fill="currentColor" fill-opacity="0.25"/></svg>',
  aura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" stroke-dasharray="3 2"/></svg>',
  lightning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" fill="currentColor" fill-opacity="0.25"/></svg>',
  blades: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 8-3 3-3-3 3-8z"/><path d="M22 12l-8 3-3-3 3-3 8 3z"/><path d="M12 22l-3-8 3-3 3 3-3 8z"/><path d="M2 12l8-3 3 3-3 3-8-3z"/></svg>',
  dagger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l5-5m11-11l-9 5 4 4 5-9z" fill="currentColor" fill-opacity="0.25"/><path d="M7 13l4 4"/></svg>',
  orb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="6" fill="currentColor" fill-opacity="0.28"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  hammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="4" width="14" height="7" rx="1.5" fill="currentColor" fill-opacity="0.26"/><path d="M12 11v10"/></svg>',
  spear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20L17 7"/><path d="M14 4l6 0 0 6-6-6z" fill="currentColor" fill-opacity="0.28"/></svg>',
  scythe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19L15 5c4 1 6 5 5 10"/><path d="M15 5c-4 1-7 4-8 8" stroke-opacity="0.65"/></svg>',
  fangs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 18l5-12 3 5 6-7-4 14-4-4-6 4z" fill="currentColor" fill-opacity="0.25"/></svg>',
  grimoire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor" fill-opacity="0.2"/><path d="M9 8h6M12 8v8M9 12h6"/></svg>',
  flail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l7-7" stroke-dasharray="2 2"/><circle cx="16" cy="8" r="4" fill="currentColor" fill-opacity="0.28"/><path d="M16 2v2M22 8h-2M16 14v-2M10 8h2"/></svg>',
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
  titleSettingsBtn: document.getElementById('title-settings-btn'),
  modeCampaignBtn: document.getElementById('mode-campaign-btn'),
  modeEndlessBtn: document.getElementById('mode-endless-btn'),
  modeEndlessSub: document.getElementById('mode-endless-sub'),
  endlessRecordBar: document.getElementById('endless-record-bar'),
  playBtn: document.getElementById('play-btn'),
  titleMuteBtn: document.getElementById('title-mute-btn'),
  realmSelectorList: document.getElementById('realm-selector-list'),
  challengeSelectorList: document.getElementById('challenge-selector-list'),
  heroSelectorGrid: document.getElementById('hero-selector-grid'),
  heroDetailPanel: document.getElementById('hero-detail-panel'),
  selectedHeroDesc: document.getElementById('selected-hero-desc'),
  selectedHeroStats: document.getElementById('selected-hero-stats'),
  weaponSelectorList: document.getElementById('weapon-selector-list'),
  heroActiveSkillBox: document.getElementById('hero-active-skill-box'),
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
  hudBuffBar: document.getElementById('hud-buff-bar'),
  pauseBtn: document.getElementById('pause-btn'),
  activeSkillBtn: document.getElementById('active-skill-btn'),
  activeSkillRing: document.getElementById('active-skill-ring'),
  activeSkillIcon: document.getElementById('active-skill-icon'),
  activeSkillLabel: document.getElementById('active-skill-label'),

  inrunDialogue: document.getElementById('inrun-dialogue'),
  inrunDialogueSpeaker: document.getElementById('inrun-dialogue-speaker'),
  inrunDialogueRole: document.getElementById('inrun-dialogue-role'),
  inrunDialogueText: document.getElementById('inrun-dialogue-text'),

  bossHud: document.getElementById('boss-hud'),
  bossName: document.getElementById('boss-name'),
  bossPhase: document.getElementById('boss-phase'),
  bossHpText: document.getElementById('boss-hp-text'),
  bossHpFill: document.getElementById('boss-hp-fill'),
  bossWarning: document.getElementById('boss-warning'),

  levelupModal: document.getElementById('levelup-modal'),
  levelupCards: document.getElementById('levelup-cards'),

  chestModal: document.getElementById('chest-modal'),
  chestRewardBox: document.getElementById('chest-reward-box'),
  chestIcon: document.getElementById('chest-icon'),
  chestTag: document.getElementById('chest-tag'),
  chestTitle: document.getElementById('chest-title'),
  chestDesc: document.getElementById('chest-desc'),
  chestClaimBtn: document.getElementById('chest-claim-btn'),

  codexBtn: document.getElementById('codex-btn'),
  codexModal: document.getElementById('codex-modal'),
  codexProgress: document.getElementById('codex-progress'),
  codexTabs: document.getElementById('codex-tabs'),
  codexList: document.getElementById('codex-list'),
  codexCloseBtn: document.getElementById('codex-close-btn'),

  pauseModal: document.getElementById('pause-modal'),
  resumeBtn: document.getElementById('resume-btn'),
  pauseSettingsBtn: document.getElementById('pause-settings-btn'),
  restartBtn: document.getElementById('restart-btn'),
  quitBtn: document.getElementById('quit-btn'),
  pauseMuteBtn: document.getElementById('pause-mute-btn'),
  pauseBuildList: document.getElementById('pause-build-list'),

  settingsModal: document.getElementById('settings-modal'),
  setMasterVol: document.getElementById('set-master-vol'),
  setMasterVal: document.getElementById('set-master-val'),
  setSfxVol: document.getElementById('set-sfx-vol'),
  setSfxVal: document.getElementById('set-sfx-val'),
  setBgmVol: document.getElementById('set-bgm-vol'),
  setBgmVal: document.getElementById('set-bgm-val'),
  setMutedBtn: document.getElementById('set-muted-btn'),
  setVfxHigh: document.getElementById('set-vfx-high'),
  setVfxReduced: document.getElementById('set-vfx-reduced'),
  setShakeBtn: document.getElementById('set-shake-btn'),
  setDmgnumBtn: document.getElementById('set-dmgnum-btn'),
  setJoyDynamic: document.getElementById('set-joy-dynamic'),
  setJoyFixed: document.getElementById('set-joy-fixed'),
  setHapticsBtn: document.getElementById('set-haptics-btn'),
  setResetBtn: document.getElementById('set-reset-btn'),
  settingsCloseBtn: document.getElementById('settings-close-btn'),

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
  endCodexUnlocks: document.getElementById('end-codex-unlocks'),
  endRealmUnlock: document.getElementById('end-realm-unlock'),
  endDamageCard: document.getElementById('end-damage-card'),
  endDamageList: document.getElementById('end-damage-list'),
  nextRealmBtn: document.getElementById('next-realm-btn'),
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
  let realmState = loadRealmProgress(loadRecords());
  let pendingNextRealmId = null;

  let currentSettings = loadSettings();
  audio.applySettings(currentSettings);

  const buildRunConfig = () => {
    const heroId = HERO_ROSTER[metaState.selectedHero] ? metaState.selectedHero : 'warrior';
    const hero = HERO_ROSTER[heroId];
    const lvInfo = getHeroLevelFromXp(metaState.heroXp[heroId] || 0);
    const perks = getPerksForHeroLevel(heroId, lvInfo.level);
    const storedWep = metaState.selectedWeapons[heroId];
    const startingWeaponId = perks.unlockedWeapons.includes(storedWep)
      ? storedWep
      : hero.weapons[0].id;
    const realmId = realmState.unlockedRealms.includes(realmState.selectedRealm)
      ? realmState.selectedRealm
      : 'midgard';
    const challengeId = REALM_CHALLENGES[realmState.selectedChallenge]
      ? realmState.selectedChallenge
      : 'standard';
    const endlessAllowed = isEndlessUnlocked(realmState, loadRecords());
    const runMode = endlessAllowed && realmState.selectedMode === 'endless' ? 'endless' : 'campaign';
    return {
      heroId,
      startingWeaponId,
      textureKey: hero.textureKey,
      effectiveStats: perks,
      realmId,
      challengeId,
      runMode
    };
  };

  const renderModeSelection = () => {
    const records = loadRecords();
    realmState = loadRealmProgress(records);
    const endlessAllowed = isEndlessUnlocked(realmState, records);
    const activeMode = endlessAllowed && realmState.selectedMode === 'endless' ? 'endless' : 'campaign';

    if (el.modeCampaignBtn) {
      const isCamp = activeMode === 'campaign';
      el.modeCampaignBtn.classList.toggle('is-active', isCamp);
      el.modeCampaignBtn.setAttribute('aria-pressed', String(isCamp));
    }
    if (el.modeEndlessBtn) {
      const isEnd = activeMode === 'endless';
      el.modeEndlessBtn.disabled = !endlessAllowed;
      el.modeEndlessBtn.classList.toggle('is-active', isEnd);
      el.modeEndlessBtn.setAttribute('aria-pressed', String(isEnd));
      el.modeEndlessBtn.title = endlessAllowed
        ? 'Sopravvivi oltre il 4° minuto tra ondate scalari e boss ciclici'
        : 'Sconfiggi Hrimthurs a Midgard per sbloccare la Modalità Infinita';
    }
    if (el.modeEndlessSub) {
      el.modeEndlessSub.textContent = endlessAllowed ? 'Orda Eterna' : 'Sconfiggi 1° Boss';
    }
    if (el.endlessRecordBar) {
      const rId = realmState.unlockedRealms.includes(realmState.selectedRealm)
        ? realmState.selectedRealm
        : 'midgard';
      const realmName = getRealmConfig(rId).name;
      const eRec = realmState.endlessRecords?.[rId];
      if (endlessAllowed && (activeMode === 'endless' || (eRec && eRec.bestTimeSec > 0))) {
        el.endlessRecordBar.classList.remove('hidden');
        el.endlessRecordBar.textContent = eRec && eRec.bestTimeSec > 0
          ? `Record Infinita (${realmName}): ${formatTime(eRec.bestTimeSec)} · Wave ${eRec.maxWave || 0} · ${eRec.bestKills || 0} K`
          : `Infinita (${realmName}): Nessun record ancora salvato`;
      } else {
        el.endlessRecordBar.classList.add('hidden');
      }
    }
  };

  const renderRealmSelection = () => {
    realmState = loadRealmProgress(loadRecords());
    if (!el.realmSelectorList) return;
    el.realmSelectorList.innerHTML = '';

    REALM_ORDER.forEach((rId) => {
      const realm = REALM_CATALOG[rId];
      const unlocked = realmState.unlockedRealms.includes(rId);
      const selected = unlocked && realmState.selectedRealm === rId;
      const clearedCount = realmState.clearedRealms?.[rId] || 0;
      const xpPct = Math.round((realm.xpBonusMult - 1) * 100);

      let metaLabel = 'Bloccato';
      if (unlocked) {
        if (clearedCount > 0) {
          metaLabel = xpPct > 0 ? `Completato · +${xpPct}% EXP` : 'Completato';
        } else {
          metaLabel = xpPct > 0 ? `Disponibile · +${xpPct}% EXP` : 'Disponibile';
        }
      }

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `realm-card${selected ? ' is-selected' : ''}${unlocked ? '' : ' is-locked'}`;
      card.disabled = !unlocked;
      card.style.setProperty('--realm-accent', realm.accent);
      card.setAttribute('aria-pressed', String(selected));
      if (!unlocked) card.title = realm.unlockHint;
      card.innerHTML = `
        <span class="realm-card-order">AREA ${realm.order}</span>
        <span class="realm-card-name">${realm.name}</span>
        <span class="realm-card-meta">${metaLabel}</span>
      `;
      if (unlocked) {
        card.addEventListener('click', () => {
          audio.unlock();
          audio.playUiClick();
          realmState.selectedRealm = rId;
          saveRealmProgress(realmState);
          renderRealmSelection();
          renderModeSelection();
        });
      }
      el.realmSelectorList.appendChild(card);
    });
  };

  const renderChallengeSelection = () => {
    realmState = loadRealmProgress(loadRecords());
    if (!el.challengeSelectorList) return;
    el.challengeSelectorList.innerHTML = '';

    const activeChallengeId = REALM_CHALLENGES[realmState.selectedChallenge]
      ? realmState.selectedChallenge
      : 'standard';

    CHALLENGE_ORDER.forEach((cId) => {
      const ch = REALM_CHALLENGES[cId];
      const selected = activeChallengeId === cId;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `challenge-card${selected ? ' is-selected' : ''}`;
      card.style.setProperty('--challenge-accent', ch.accent);
      card.setAttribute('aria-pressed', String(selected));
      card.innerHTML = `
        <div class="challenge-card-head">
          <span class="challenge-card-name">${ch.name}</span>
          <span class="challenge-card-exp">${ch.badge}</span>
        </div>
        <span class="challenge-card-desc">${ch.description}</span>
      `;
      card.addEventListener('click', () => {
        audio.unlock();
        audio.playUiClick();
        realmState.selectedChallenge = cId;
        saveRealmProgress(realmState);
        renderChallengeSelection();
      });
      el.challengeSelectorList.appendChild(card);
    });
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

    if (el.heroActiveSkillBox) {
      const skill = activeHero.activeSkill;
      if (skill) {
        el.heroActiveSkillBox.innerHTML = `
          <div class="hero-skill-badge" style="color:${activeHero.accent};border-color:${activeHero.accent}55">
            ${SKILL_ICONS[skill.id] || ''}
          </div>
          <div class="hero-skill-meta">
            <div class="hero-skill-title">
              <span>Abilità: ${skill.name}</span>
              <span class="hero-skill-cd">${skill.cooldownSec}s CD</span>
            </div>
            <div class="hero-skill-desc">${skill.description}</div>
          </div>
        `;
      } else {
        el.heroActiveSkillBox.innerHTML = '';
      }
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

  let activeCodexCategory = 'all';

  const updateCodexButtonLabel = () => {
    if (!el.codexBtn) return;
    const view = getCodexView(loadCodexState(), 'all');
    el.codexBtn.textContent = `Codex (${view.unlockedCount}/${view.totalCount})`;
  };

  const renderCodexModal = (category = activeCodexCategory) => {
    activeCodexCategory = category;
    const view = getCodexView(loadCodexState(), activeCodexCategory);

    if (el.codexProgress) {
      el.codexProgress.textContent = `${view.unlockedCount} / ${view.totalCount}`;
    }

    if (el.codexTabs) {
      el.codexTabs.innerHTML = '';
      CODEX_CATEGORIES.forEach((cat) => {
        const tabBtn = document.createElement('button');
        tabBtn.type = 'button';
        tabBtn.className = `codex-tab${cat.id === activeCodexCategory ? ' is-active' : ''}`;
        tabBtn.textContent = cat.label;
        tabBtn.addEventListener('click', () => {
          audio.playUiClick();
          renderCodexModal(cat.id);
        });
        el.codexTabs.appendChild(tabBtn);
      });
    }

    if (el.codexList) {
      el.codexList.innerHTML = '';
      view.entries.forEach((entry) => {
        const card = document.createElement('article');
        card.className = `codex-entry${entry.unlocked ? '' : ' is-locked'}`;
        card.style.setProperty('--entry-accent', entry.accent || '#f59e0b');

        if (entry.unlocked) {
          card.innerHTML = `
            <div class="codex-entry-title">${entry.title}</div>
            <div class="codex-entry-meta">${entry.subtitle}</div>
            <p class="codex-entry-body">${entry.body}</p>
          `;
        } else {
          card.innerHTML = `
            <div class="codex-entry-title">Runa Sigillata</div>
            <div class="codex-entry-meta">Sblocco · ${entry.unlockHint}</div>
            <p class="codex-entry-body">Continua a combattere a Midgard per decifrare questa incisione runica.</p>
          `;
        }
        el.codexList.appendChild(card);
      });
    }
  };

  const syncSettingsUi = () => {
    const s = currentSettings;
    const mPct = Math.round((s.masterVolume ?? 0.85) * 100);
    const sPct = Math.round((s.sfxVolume ?? 1.0) * 100);
    const bPct = Math.round((s.bgmVolume ?? 0.35) * 100);
    if (el.setMasterVol) el.setMasterVol.value = String(mPct);
    if (el.setMasterVal) el.setMasterVal.textContent = `${mPct}%`;
    if (el.setSfxVol) el.setSfxVol.value = String(sPct);
    if (el.setSfxVal) el.setSfxVal.textContent = `${sPct}%`;
    if (el.setBgmVol) el.setBgmVol.value = String(bPct);
    if (el.setBgmVal) el.setBgmVal.textContent = `${bPct}%`;

    if (el.setMutedBtn) {
      el.setMutedBtn.textContent = s.muted ? 'SÌ' : 'NO';
      el.setMutedBtn.classList.toggle('is-active', Boolean(s.muted));
      el.setMutedBtn.setAttribute('aria-pressed', String(Boolean(s.muted)));
    }
    if (el.setVfxHigh && el.setVfxReduced) {
      const high = s.vfxQuality !== 'reduced';
      el.setVfxHigh.classList.toggle('is-active', high);
      el.setVfxHigh.setAttribute('aria-pressed', String(high));
      el.setVfxReduced.classList.toggle('is-active', !high);
      el.setVfxReduced.setAttribute('aria-pressed', String(!high));
    }
    if (el.setShakeBtn) {
      const on = s.screenShake !== false;
      el.setShakeBtn.textContent = on ? 'ATTIVO' : 'NO';
      el.setShakeBtn.classList.toggle('is-active', on);
      el.setShakeBtn.setAttribute('aria-pressed', String(on));
    }
    if (el.setDmgnumBtn) {
      const on = s.damageNumbers !== false;
      el.setDmgnumBtn.textContent = on ? 'ATTIVO' : 'NO';
      el.setDmgnumBtn.classList.toggle('is-active', on);
      el.setDmgnumBtn.setAttribute('aria-pressed', String(on));
    }
    if (el.setJoyDynamic && el.setJoyFixed) {
      const dyn = s.joystickMode !== 'fixed';
      el.setJoyDynamic.classList.toggle('is-active', dyn);
      el.setJoyDynamic.setAttribute('aria-pressed', String(dyn));
      el.setJoyFixed.classList.toggle('is-active', !dyn);
      el.setJoyFixed.setAttribute('aria-pressed', String(!dyn));
    }
    if (el.setHapticsBtn) {
      const on = s.haptics !== false;
      el.setHapticsBtn.textContent = on ? 'ATTIVO' : 'NO';
      el.setHapticsBtn.classList.toggle('is-active', on);
      el.setHapticsBtn.setAttribute('aria-pressed', String(on));
    }
    updateMuteButtons();
  };

  renderModeSelection();
  renderRealmSelection();
  renderChallengeSelection();
  renderHeroSelection();
  renderTitleRecords();
  updateCodexButtonLabel();
  syncSettingsUi();
  setupPwaExperience();

  const storyManager = new StoryManager(audio);
  await storyManager.load('./story.json');

  let dialogueQueue = [];
  let dialogueShowing = false;
  let dialogueHideTimer = null;
  let dialogueFadeTimer = null;

  const clearDialogueQueue = () => {
    dialogueQueue = [];
    dialogueShowing = false;
    if (dialogueHideTimer) {
      clearTimeout(dialogueHideTimer);
      dialogueHideTimer = null;
    }
    if (dialogueFadeTimer) {
      clearTimeout(dialogueFadeTimer);
      dialogueFadeTimer = null;
    }
    if (el.inrunDialogue) {
      el.inrunDialogue.classList.remove('is-visible');
      el.inrunDialogue.classList.add('hidden');
    }
  };

  const pumpDialogueQueue = () => {
    if (dialogueShowing || dialogueQueue.length === 0 || !el.inrunDialogue) return;
    const dlg = dialogueQueue.shift();
    dialogueShowing = true;

    if (el.inrunDialogueSpeaker) {
      el.inrunDialogueSpeaker.textContent = dlg.speaker || 'Voce Runica';
      el.inrunDialogueSpeaker.style.color = dlg.accent || '#f59e0b';
    }
    if (el.inrunDialogueRole) {
      el.inrunDialogueRole.textContent = dlg.role || '';
    }
    if (el.inrunDialogueText) {
      el.inrunDialogueText.textContent = dlg.text || '';
    }
    el.inrunDialogue.style.borderColor = `${dlg.accent || '#f59e0b'}55`;
    el.inrunDialogue.classList.remove('hidden');
    requestAnimationFrame(() => {
      el.inrunDialogue?.classList.add('is-visible');
    });

    dialogueHideTimer = setTimeout(() => {
      el.inrunDialogue?.classList.remove('is-visible');
      dialogueFadeTimer = setTimeout(() => {
        el.inrunDialogue?.classList.add('hidden');
        dialogueShowing = false;
        pumpDialogueQueue();
      }, 220);
    }, 3900);
  };

  const gameScene = new GameScene();

  // Cache valori HUD per aggiornamento DOM con dirty checking (zero reflow inutili a 60 FPS)
  let hudCache = {};
  const resetHudCache = () => {
    hudCache = {};
  };

  // Bridge eventi tra Phaser GameScene e Overlay HTML/CSS
  const bridge = {
    onSceneReady() {
      // Abilita pulsante GIOCA una volta pronte le texture procedurali
      if (el.playBtn) el.playBtn.disabled = false;
    },

    onDialogue(dlg) {
      if (!dlg || !dlg.text) return;
      if (dialogueQueue.length >= 2) dialogueQueue.shift();
      dialogueQueue.push(dlg);
      pumpDialogueQueue();
    },

    onHudUpdate(data) {
      const pct = Math.min(100, Math.max(0, (data.xp / Math.max(1, data.xpNeeded)) * 100)).toFixed(1);
      if (el.xpFill && hudCache.xpPct !== pct) {
        hudCache.xpPct = pct;
        el.xpFill.style.width = `${pct}%`;
      }
      if (el.hudLevel && hudCache.level !== data.level) {
        hudCache.level = data.level;
        el.hudLevel.textContent = `LV ${data.level}`;
      }
      if (el.hudKills && hudCache.kills !== data.kills) {
        hudCache.kills = data.kills;
        el.hudKills.textContent = String(data.kills);
      }
      if (el.hudTimer) {
        const isEndlessPhase = data.runMode === 'endless' && !data.bossSpawned && data.elapsedSec >= 240;
        const timerText = data.bossSpawned
          ? `BOSS · ${formatTime(data.elapsedSec)}`
          : isEndlessPhase
            ? `INF W${Math.max(1, data.endlessWave || 1)} · ${formatTime(data.elapsedSec)}`
            : formatTime(data.remainingSec);
        if (hudCache.timerText !== timerText) {
          hudCache.timerText = timerText;
          el.hudTimer.textContent = timerText;
        }
        const isBoss = Boolean(data.bossSpawned);
        if (hudCache.timerBoss !== isBoss) {
          hudCache.timerBoss = isBoss;
          el.hudTimer.classList.toggle('is-boss', isBoss);
        }
        if (hudCache.timerEndless !== isEndlessPhase) {
          hudCache.timerEndless = isEndlessPhase;
          el.hudTimer.classList.toggle('is-endless', isEndlessPhase);
        }
      }
      if (el.hudBuildStrip && Array.isArray(data.build)) {
        const buildSig = data.build
          .map((item) => `${item.id}:${item.level}:${item.evolved ? 1 : 0}:${item.evoStatus?.badgeLabel || ''}`)
          .join('|');
        if (hudCache.buildSig !== buildSig) {
          hudCache.buildSig = buildSig;
          el.hudBuildStrip.innerHTML = data.build
            .map(
              (item) => `
              <div class="build-chip${item.evolved ? ' is-evolved' : ''}" title="${item.evoStatus?.shortHint || item.name}" style="border-color:${item.accent}44;color:${item.accent}">
                <span class="build-chip-icon">${UPGRADE_ICONS[item.id] || ''}</span>
                <span class="build-chip-lv">${item.evolved ? '★' : item.level}</span>
                ${item.evoStatus ? `<span class="build-chip-evo" style="color:${item.evoStatus.accent}">${item.evoStatus.badgeLabel}</span>` : ''}
              </div>`
            )
            .join('');
        }
      }
      if (el.hudBuffBar) {
        const buffText = data.buff
          ? `${data.buff.label} · ${Math.max(1, Math.ceil(data.buff.remaining))}s`
          : '';
        if (hudCache.buffText !== buffText) {
          hudCache.buffText = buffText;
          if (data.buff) {
            el.hudBuffBar.classList.remove('hidden');
            el.hudBuffBar.style.borderLeftColor = data.buff.accent || '#38bdf8';
            el.hudBuffBar.style.color = data.buff.accent || '#e0f2fe';
            el.hudBuffBar.textContent = buffText;
          } else {
            el.hudBuffBar.classList.add('hidden');
          }
        }
      }
      if (el.activeSkillBtn && data.activeSkill) {
        const sk = data.activeSkill;
        if (hudCache.skillKey !== sk.id) {
          hudCache.skillKey = sk.id;
          el.activeSkillBtn.style.setProperty('--skill-accent', sk.accent || '#f59e0b');
          if (el.activeSkillIcon) {
            el.activeSkillIcon.innerHTML = SKILL_ICONS[sk.id] || '';
          }
        }
        const ready = Boolean(sk.ready);
        const activeOn = (sk.activeTimer || 0) > 0;
        if (hudCache.skillReady !== ready) {
          hudCache.skillReady = ready;
          el.activeSkillBtn.classList.toggle('is-ready', ready);
          el.activeSkillBtn.classList.toggle('is-cooldown', !ready);
        }
        if (hudCache.skillActive !== activeOn) {
          hudCache.skillActive = activeOn;
          el.activeSkillBtn.classList.toggle('is-active', activeOn);
        }
        const label = ready ? (sk.shortName || 'ATTIVA') : `${Math.ceil(sk.cooldownRemaining)}s`;
        if (el.activeSkillLabel && hudCache.skillLabel !== label) {
          hudCache.skillLabel = label;
          el.activeSkillLabel.textContent = label;
        }
        if (el.activeSkillRing) {
          const circ = 157.08;
          const ratio = ready ? 0 : Math.min(1, Math.max(0, sk.cooldownRemaining / Math.max(1, sk.maxCooldown)));
          const dashOffset = (circ * ratio).toFixed(2);
          if (hudCache.skillDash !== dashOffset) {
            hudCache.skillDash = dashOffset;
            el.activeSkillRing.style.strokeDashoffset = dashOffset;
          }
        }
      }
    },

    onBossWarning(active, warningText) {
      if (!el.bossWarning) return;
      if (warningText) el.bossWarning.textContent = warningText;
      el.bossWarning.classList.toggle('hidden', !active);
    },

    onBossHudUpdate(bossData) {
      if (!el.bossHud) return;
      if (!bossData) {
        if (hudCache.bossVisible !== false) {
          hudCache.bossVisible = false;
          el.bossHud.classList.add('hidden');
        }
        return;
      }
      if (hudCache.bossVisible !== true) {
        hudCache.bossVisible = true;
        el.bossHud.classList.remove('hidden');
      }
      if (el.bossName && hudCache.bossName !== bossData.name) {
        hudCache.bossName = bossData.name;
        el.bossName.textContent = bossData.name;
      }
      if (el.bossPhase) {
        const phase = bossData.phase || 1;
        const phaseLabel = bossData.phaseLabel || 'FASE I';
        if (hudCache.bossPhaseLabel !== phaseLabel || hudCache.bossPhase !== phase) {
          hudCache.bossPhaseLabel = phaseLabel;
          hudCache.bossPhase = phase;
          el.bossPhase.textContent = phaseLabel;
          el.bossPhase.classList.toggle('is-phase2', phase === 2);
          el.bossPhase.classList.toggle('is-phase3', phase >= 3);
        }
      }
      const hpText = `${Math.ceil(bossData.hp)} / ${bossData.maxHp}`;
      if (el.bossHpText && hudCache.bossHpText !== hpText) {
        hudCache.bossHpText = hpText;
        el.bossHpText.textContent = hpText;
      }
      if (el.bossHpFill) {
        const pct = Math.max(0, Math.min(100, (bossData.hp / Math.max(1, bossData.maxHp)) * 100)).toFixed(1);
        if (hudCache.bossHpPct !== pct) {
          hudCache.bossHpPct = pct;
          el.bossHpFill.style.width = `${pct}%`;
        }
      }
    },

    onLevelUp(choices) {
      if (!el.levelupModal || !el.levelupCards) return;
      el.levelupCards.innerHTML = '';

      choices.forEach((choice) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `upgrade-card${choice.isEvolution ? ' is-evolution' : ''}`;
        const levelTag = choice.isEvolution
          ? 'EVOLUZIONE ★'
          : choice.currentLevel === 0
            ? 'NUOVO'
            : `LV ${choice.currentLevel} → LV ${choice.nextLevel}`;

        const iconKey = choice.weaponId || choice.id;
        const evoHtml = choice.evoStatus
          ? `<span class="upgrade-evo-badge" style="color:${choice.evoStatus.accent}">${choice.evoStatus.shortHint}</span>`
          : '';

        card.innerHTML = `
          <div class="upgrade-icon" style="color:${choice.accent};border-color:${choice.accent}55">
            ${UPGRADE_ICONS[iconKey] || ''}
          </div>
          <div class="upgrade-body">
            <div class="upgrade-head">
              <span class="upgrade-name">${choice.name}</span>
              <span class="upgrade-lv">${levelTag}</span>
            </div>
            <p class="upgrade-desc">${choice.description}</p>
            ${evoHtml}
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

    onChestOpened(reward) {
      if (!el.chestModal || !reward) {
        gameScene.resumeGame();
        return;
      }
      if (el.chestRewardBox) {
        el.chestRewardBox.classList.toggle('is-evolution', Boolean(reward.isEvolution));
        el.chestRewardBox.style.borderColor = reward.accent || '#fbbf24';
      }
      if (el.chestIcon) {
        el.chestIcon.style.color = reward.accent || '#fbbf24';
        el.chestIcon.innerHTML = UPGRADE_ICONS[reward.iconId] || UPGRADE_ICONS.might;
      }
      if (el.chestTag) {
        el.chestTag.textContent = reward.tag || 'TESORO';
        el.chestTag.style.color = reward.accent || '#fbbf24';
      }
      if (el.chestTitle) el.chestTitle.textContent = reward.title || 'Ricompensa';
      if (el.chestDesc) el.chestDesc.textContent = reward.subtitle || '';

      el.chestModal.classList.remove('hidden');
      el.chestModal.classList.add('flex');
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
      clearDialogueQueue();
      const { records, isNewRecord } = saveRecords(result);
      const metaUpdate = grantHeroMetaXp(result.heroId || metaState.selectedHero, result);
      metaState = metaUpdate.meta;

      const realmCfg = getRealmConfig(result.realmId || realmState.selectedRealm);
      let realmOutcome = { progress: realmState, newlyUnlockedRealmId: null };
      if (result.victory) {
        realmOutcome = recordRealmVictory(realmCfg.id, records);
        realmState = realmOutcome.progress;
      }
      if (result.runMode === 'endless') {
        realmState = recordEndlessRun(realmCfg.id, result, records);
      }

      const codexUpdate = recordRunCodexProgress(result);
      renderRealmSelection();
      renderModeSelection();
      renderChallengeSelection();
      renderTitleRecords();
      renderHeroSelection();
      updateCodexButtonLabel();

      if (el.gameHud) el.gameHud.classList.add('hidden');
      if (el.bossHud) el.bossHud.classList.add('hidden');
      if (el.hudBuffBar) el.hudBuffBar.classList.add('hidden');

      const isEndless = result.runMode === 'endless';
      if (el.endTitle) {
        el.endTitle.textContent = result.victory
          ? realmCfg.victoryTitle
          : isEndless
            ? `ASSEDIATO A ${realmCfg.name.toUpperCase()}`
            : `CADUTO A ${realmCfg.name.toUpperCase()}`;
        el.endTitle.classList.toggle('is-victory', result.victory);
      }
      if (el.endSubtitle) {
        if (result.victory) {
          el.endSubtitle.textContent = realmCfg.victorySub;
        } else if (isEndless) {
          const eRec = realmState.endlessRecords?.[realmCfg.id];
          const bestTxt = eRec ? ` · Record: ${formatTime(eRec.bestTimeSec)}` : '';
          el.endSubtitle.textContent = `Modalità Infinita · Ondata ${result.endlessWave || 0} · Boss abbattuti: ${result.bossesDefeatedCount || 0}${bestTxt}`;
        } else {
          el.endSubtitle.textContent = 'L’orda ti ha sopraffatto, ma il Valhalla attende la tua rivincita.';
        }
      }
      if (el.endRealmUnlock) {
        if (result.victory && realmOutcome.newlyUnlockedRealmId) {
          const unlockedCfg = getRealmConfig(realmOutcome.newlyUnlockedRealmId);
          el.endRealmUnlock.textContent = `Nuovo Regno Sbloccato: ${unlockedCfg.fullName}!`;
          el.endRealmUnlock.classList.remove('hidden');
        } else {
          el.endRealmUnlock.classList.add('hidden');
        }
      }

      pendingNextRealmId = result.victory && realmCfg.nextRealmId ? realmCfg.nextRealmId : null;
      if (el.nextRealmBtn && el.playAgainBtn) {
        if (pendingNextRealmId) {
          const nextCfg = getRealmConfig(pendingNextRealmId);
          el.nextRealmBtn.textContent = `PROSEGUI A ${nextCfg.name.toUpperCase()}`;
          el.nextRealmBtn.classList.remove('hidden');
          el.playAgainBtn.className = 'btn-secondary';
          el.playAgainBtn.textContent = `Rigioca ${realmCfg.name}`;
        } else {
          el.nextRealmBtn.classList.add('hidden');
          el.playAgainBtn.className = 'btn-primary';
          el.playAgainBtn.textContent = 'GIOCA ANCORA';
        }
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
      if (el.endCodexUnlocks) {
        if (codexUpdate.newlyUnlocked.length > 0) {
          el.endCodexUnlocks.textContent = `Codex sbloccato: ${codexUpdate.newlyUnlocked.map((e) => e.title).join(' · ')}`;
          el.endCodexUnlocks.classList.remove('hidden');
        } else {
          el.endCodexUnlocks.classList.add('hidden');
        }
      }
      if (el.endDamageCard && el.endDamageList) {
        const rows = Array.isArray(result.damageBreakdown) ? result.damageBreakdown : [];
        if (rows.length > 0) {
          el.endDamageList.innerHTML = rows
            .map(
              (row) => `
              <div class="damage-row">
                <div class="damage-row-head">
                  <span class="damage-row-name" style="color:${row.accent}">${row.name}</span>
                  <span class="damage-row-val">${row.damage.toLocaleString('it-IT')} (${row.percent}%)</span>
                </div>
                <div class="damage-bar-track">
                  <div class="damage-bar-fill" style="width:${Math.max(4, row.percent)}%;background:${row.accent}"></div>
                </div>
              </div>`
            )
            .join('');
          el.endDamageCard.classList.remove('hidden');
        } else {
          el.endDamageCard.classList.add('hidden');
          el.endDamageList.innerHTML = '';
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
    clearDialogueQueue();
    resetHudCache();
    el.titleScreen?.classList.add('hidden');
    el.endModal?.classList.add('hidden');
    el.endModal?.classList.remove('flex');
    el.pauseModal?.classList.add('hidden');
    el.pauseModal?.classList.remove('flex');
    el.chestModal?.classList.add('hidden');
    el.chestModal?.classList.remove('flex');
    el.codexModal?.classList.add('hidden');
    el.codexModal?.classList.remove('flex');
    el.settingsModal?.classList.add('hidden');
    el.settingsModal?.classList.remove('flex');
    el.hudBuffBar?.classList.add('hidden');
    el.bossHud?.classList.add('hidden');
    el.gameHud?.classList.remove('hidden');

    await gameScene.startNewRun(buildRunConfig());
  };

  el.modeCampaignBtn?.addEventListener('click', () => {
    audio.unlock();
    audio.playUiClick();
    realmState.selectedMode = 'campaign';
    saveRealmProgress(realmState);
    renderModeSelection();
  });

  el.modeEndlessBtn?.addEventListener('click', () => {
    if (!isEndlessUnlocked(realmState, loadRecords())) return;
    audio.unlock();
    audio.playUiClick();
    realmState.selectedMode = 'endless';
    saveRealmProgress(realmState);
    renderModeSelection();
  });

  const openSettingsModal = () => {
    audio.unlock();
    audio.playUiClick();
    currentSettings = loadSettings();
    syncSettingsUi();
    el.settingsModal?.classList.remove('hidden');
    el.settingsModal?.classList.add('flex');
  };

  const closeSettingsModal = () => {
    audio.playUiClick();
    el.settingsModal?.classList.add('hidden');
    el.settingsModal?.classList.remove('flex');
  };

  const updateSettings = (patch) => {
    currentSettings = gameScene.applySettings({ ...currentSettings, ...patch });
    audio.applySettings(currentSettings);
    syncSettingsUi();
  };

  el.titleSettingsBtn?.addEventListener('click', openSettingsModal);
  el.pauseSettingsBtn?.addEventListener('click', openSettingsModal);
  el.settingsCloseBtn?.addEventListener('click', closeSettingsModal);

  el.setMasterVol?.addEventListener('input', (ev) => {
    updateSettings({ masterVolume: Number(ev.target.value) / 100 });
  });
  el.setSfxVol?.addEventListener('input', (ev) => {
    updateSettings({ sfxVolume: Number(ev.target.value) / 100 });
  });
  el.setBgmVol?.addEventListener('input', (ev) => {
    updateSettings({ bgmVolume: Number(ev.target.value) / 100 });
  });
  el.setMutedBtn?.addEventListener('click', () => {
    audio.unlock();
    updateSettings({ muted: !currentSettings.muted });
    if (!currentSettings.muted) audio.playUiClick();
  });
  el.setVfxHigh?.addEventListener('click', () => {
    audio.playUiClick();
    updateSettings({ vfxQuality: 'high' });
  });
  el.setVfxReduced?.addEventListener('click', () => {
    audio.playUiClick();
    updateSettings({ vfxQuality: 'reduced' });
  });
  el.setShakeBtn?.addEventListener('click', () => {
    audio.playUiClick();
    updateSettings({ screenShake: currentSettings.screenShake === false });
  });
  el.setDmgnumBtn?.addEventListener('click', () => {
    audio.playUiClick();
    updateSettings({ damageNumbers: currentSettings.damageNumbers === false });
  });
  el.setJoyDynamic?.addEventListener('click', () => {
    audio.playUiClick();
    updateSettings({ joystickMode: 'dynamic' });
  });
  el.setJoyFixed?.addEventListener('click', () => {
    audio.playUiClick();
    updateSettings({ joystickMode: 'fixed' });
  });
  el.setHapticsBtn?.addEventListener('click', () => {
    audio.playUiClick();
    updateSettings({ haptics: currentSettings.haptics === false });
  });
  el.setResetBtn?.addEventListener('click', () => {
    currentSettings = resetSettings();
    currentSettings = gameScene.applySettings(currentSettings);
    audio.applySettings(currentSettings);
    syncSettingsUi();
    audio.playUiClick();
  });

  el.playBtn?.addEventListener('click', startGameFlow);
  el.playAgainBtn?.addEventListener('click', startGameFlow);
  el.nextRealmBtn?.addEventListener('click', async () => {
    if (!pendingNextRealmId || !REALM_CATALOG[pendingNextRealmId]) {
      await startGameFlow();
      return;
    }
    realmState.selectedRealm = pendingNextRealmId;
    saveRealmProgress(realmState);
    renderRealmSelection();
    renderModeSelection();
    await startGameFlow();
  });

  el.codexBtn?.addEventListener('click', () => {
    audio.unlock();
    audio.playUiClick();
    renderCodexModal('all');
    el.codexModal?.classList.remove('hidden');
    el.codexModal?.classList.add('flex');
  });

  el.codexCloseBtn?.addEventListener('click', () => {
    audio.playUiClick();
    el.codexModal?.classList.add('hidden');
    el.codexModal?.classList.remove('flex');
  });

  el.chestClaimBtn?.addEventListener('click', () => {
    audio.playUiClick();
    el.chestModal?.classList.add('hidden');
    el.chestModal?.classList.remove('flex');
    gameScene.resumeGame();
  });

  el.titleMuteBtn?.addEventListener('click', () => {
    audio.unlock();
    const muted = audio.toggleMute();
    currentSettings = saveSettings({ ...currentSettings, muted });
    gameScene.applySettings(currentSettings);
    syncSettingsUi();
    audio.playUiClick();
  });

  el.pauseMuteBtn?.addEventListener('click', () => {
    audio.unlock();
    const muted = audio.toggleMute();
    currentSettings = saveSettings({ ...currentSettings, muted });
    gameScene.applySettings(currentSettings);
    syncSettingsUi();
    audio.playUiClick();
  });

  el.pauseBtn?.addEventListener('click', () => {
    audio.playUiClick();
    gameScene.pauseGame(false);
  });

  el.activeSkillBtn?.addEventListener('pointerdown', (ev) => {
    ev.stopPropagation();
  });
  el.activeSkillBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    audio.unlock();
    gameScene.triggerActiveSkill();
  });

  el.resumeBtn?.addEventListener('click', () => {
    audio.playUiClick();
    bridge.onPauseChanged(false);
    gameScene.resumeGame();
  });

  el.restartBtn?.addEventListener('click', startGameFlow);

  const returnToTitle = () => {
    audio.playUiClick();
    clearDialogueQueue();
    resetHudCache();
    el.pauseModal?.classList.add('hidden');
    el.pauseModal?.classList.remove('flex');
    el.settingsModal?.classList.add('hidden');
    el.settingsModal?.classList.remove('flex');
    el.endModal?.classList.add('hidden');
    el.endModal?.classList.remove('flex');
    el.chestModal?.classList.add('hidden');
    el.chestModal?.classList.remove('flex');
    el.gameHud?.classList.add('hidden');
    el.bossHud?.classList.add('hidden');
    el.hudBuffBar?.classList.add('hidden');
    el.titleScreen?.classList.remove('hidden');
    gameScene.gameState = 'IDLE';
    gameScene.physics.pause();
    audio.stopBgm();
    renderRealmSelection();
    renderModeSelection();
    renderChallengeSelection();
    renderHeroSelection();
    renderTitleRecords();
    updateCodexButtonLabel();
  };

  el.quitBtn?.addEventListener('click', returnToTitle);
  el.endTitleBtn?.addEventListener('click', returnToTitle);

  // Tasto ESC o P per mettere in pausa/chiudere Impostazioni e Spazio/E per Abilità Attiva su desktop
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && el.settingsModal?.classList.contains('flex')) {
      closeSettingsModal();
      return;
    }
    if (ev.key === 'Escape' || ev.key === 'p' || ev.key === 'P') {
      if (gameScene.gameState === 'PLAYING') {
        gameScene.pauseGame(false);
      } else if (gameScene.gameState === 'PAUSED') {
        bridge.onPauseChanged(false);
        gameScene.resumeGame();
      }
    } else if ((ev.code === 'Space' || ev.key === 'e' || ev.key === 'E') && gameScene.gameState === 'PLAYING') {
      ev.preventDefault();
      audio.unlock();
      gameScene.triggerActiveSkill();
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
