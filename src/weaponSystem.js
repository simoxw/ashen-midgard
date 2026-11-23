/**
 * WeaponSystem: gestisce le 12 armi automatiche, le evoluzioni leggendarie,
 * i proiettili, le lame orbitanti e le 4 abilità attive degli eroi.
 */

import { audio } from './audio.js';
import { HERO_ROSTER } from './heroes.js';
import { triggerHaptic } from './settings.js';
import { swapPopPush } from './spatialGrid.js';

export class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
  }

  _sqDist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  _depth(y) {
    return y;
  }

  _shake(dur, intensity) {
    if (this.scene.settings?.screenShake === false) return;
    this.scene.cameras?.main?.shake?.(dur, intensity);
  }

  getNearestActiveEnemies(maxRangeSq, limit) {
    const s = this.scene;
    const out = s._targetScratch;
    out.length = 0;
    const hx = s.hero.x;
    const hy = s.hero.y;

    for (let i = 0; i < s.activeEnemies.length; i++) {
      const e = s.activeEnemies[i];
      if (!e.active) continue;
      const dSq = this._sqDist(hx, hy, e.x, e.y);
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

  rebuildValkyrieBlades() {
    const s = this.scene;
    for (const b of s.bladeSprites) b.destroy();
    s.bladeSprites.length = 0;

    const lv = s.levels.blades;
    if (lv <= 0) return;

    const counts = [0, 2, 3, 3, 4, 5];
    const evo = Boolean(s.evolvedWeapons?.blades);
    const count = evo ? 6 : counts[lv];
    const bladeScale = s.hdMode ? 0.33 : 1.18;
    for (let i = 0; i < count; i++) {
      const blade = s.add.image(s.hero.x, s.hero.y, 'blade_proj').setScale(bladeScale);
      if (evo) blade.setTintFill(0xfde047);
      s.bladeSprites.push(blade);
    }
  }

  update(dt) {
    const s = this.scene;

    // 1. Ascia Runica
    const axeLv = s.levels.axe;
    if (axeLv > 0) {
      s.timers.axe -= dt;
      if (s.timers.axe <= 0) {
        const cooldowns = [0, 1.0, 0.9, 0.78, 0.68, 0.55];
        s.timers.axe = s.evolvedWeapons.axe ? 0.46 : cooldowns[axeLv];
        this._fireRunicAxes(axeLv);
      }
    }

    // 2. Pugnali d'Ombra
    const daggerLv = s.levels.dagger;
    if (daggerLv > 0) {
      s.timers.dagger -= dt;
      if (s.timers.dagger <= 0) {
        const cds = [0, 0.56, 0.48, 0.42, 0.36, 0.3];
        s.timers.dagger = s.evolvedWeapons.dagger ? 0.25 : cds[daggerLv];
        this._fireShadowDaggers(daggerLv);
      }
    }

    // 3. Globo Arcano
    const orbLv = s.levels.orb;
    if (orbLv > 0) {
      s.timers.orb -= dt;
      if (s.timers.orb <= 0) {
        const cds = [0, 1.35, 1.2, 1.05, 0.9, 0.78];
        s.timers.orb = s.evolvedWeapons.orb ? 0.68 : cds[orbLv];
        this._fireArcaneOrbs(orbLv);
      }
    }

    // 4. Martello Sismico
    const hammerLv = s.levels.hammer;
    if (hammerLv > 0) {
      s.timers.hammer -= dt;
      if (s.timers.hammer <= 0) {
        const cds = [0, 1.45, 1.3, 1.15, 1.0, 0.85];
        s.timers.hammer = s.evolvedWeapons.hammer ? 0.72 : cds[hammerLv];
        this._fireSeismicHammer(hammerLv);
      }
    }

    // 5. Lancia di Odino
    const spearLv = s.levels.spear;
    if (spearLv > 0) {
      s.timers.spear -= dt;
      if (s.timers.spear <= 0) {
        const cds = [0, 1.12, 1.0, 0.9, 0.78, 0.65];
        s.timers.spear = s.evolvedWeapons.spear ? 0.54 : cds[spearLv];
        this._fireOdinSpears(spearLv);
      }
    }

    // 6. Falci del Crepuscolo
    const scytheLv = s.levels.scythe;
    if (scytheLv > 0) {
      s.timers.scythe -= dt;
      if (s.timers.scythe <= 0) {
        const cds = [0, 1.35, 1.2, 1.08, 0.96, 0.82];
        s.timers.scythe = s.evolvedWeapons.scythe ? 0.68 : cds[scytheLv];
        this._fireTwilightScythes(scytheLv);
      }
    }

    // 7. Spine d'Ombra
    const fangsLv = s.levels.fangs;
    if (fangsLv > 0) {
      s.timers.fangs -= dt;
      if (s.timers.fangs <= 0) {
        const cds = [0, 0.82, 0.74, 0.66, 0.58, 0.48];
        s.timers.fangs = s.evolvedWeapons.fangs ? 0.4 : cds[fangsLv];
        this._fireShadowFangs(fangsLv);
      }
    }

    // 8. Grimorio Astrale
    const grimoireLv = s.levels.grimoire;
    if (grimoireLv > 0) {
      s.timers.grimoire -= dt;
      if (s.timers.grimoire <= 0) {
        const cds = [0, 1.65, 1.48, 1.32, 1.18, 1.02];
        s.timers.grimoire = s.evolvedWeapons.grimoire ? 0.85 : cds[grimoireLv];
        this._castAstralGrimoire(grimoireLv);
      }
    }

    // 9. Flagello a Catena
    const flailLv = s.levels.flail;
    if (flailLv > 0) {
      s.timers.flail -= dt;
      if (s.timers.flail <= 0) {
        const cds = [0, 1.25, 1.12, 0.98, 0.86, 0.74];
        s.timers.flail = s.evolvedWeapons.flail ? 0.62 : cds[flailLv];
        this._triggerChainFlail(flailLv);
      }
    }
    if (s.activeFlailSwing) {
      this._updateFlailSwing(dt);
    }

    // 10. Aura del Crepuscolo / Manto di Surtr
    const auraLv = s.levels.aura;
    if (auraLv > 0) {
      const evoAura = Boolean(s.evolvedWeapons.aura);
      const baseRadius = (62 + auraLv * 13 + (evoAura ? 18 : 0)) * s.stats.areaMult;
      const pulse = 0.97 + Math.sin(s.elapsedSec * 5.2) * 0.03;
      const drawRadius = baseRadius * pulse;
      const cx = s.hero.x;
      const cy = s.hero.y + 10;

      const fillCol = evoAura ? 0xf97316 : 0x7e22ce;
      const ringCol = evoAura ? 0xfbbf24 : 0xc084fc;
      const innerCol = evoAura ? 0xfde68a : 0xf0abfc;

      s.auraGfx.fillStyle(fillCol, 0.14);
      s.auraGfx.fillCircle(cx, cy, drawRadius);
      s.auraGfx.fillStyle(ringCol, 0.09);
      s.auraGfx.fillCircle(cx, cy, drawRadius * 0.66);

      s.auraGfx.lineStyle(2, ringCol, 0.72);
      s.auraGfx.strokeCircle(cx, cy, drawRadius);
      s.auraGfx.lineStyle(1.5, innerCol, 0.42);
      s.auraGfx.strokeCircle(cx, cy, drawRadius * 0.72);

      const runeCount = evoAura ? 12 : 8;
      const rot = s.elapsedSec * (evoAura ? 2.1 : 1.4);
      s.auraGfx.fillStyle(innerCol, 0.88);
      for (let r = 0; r < runeCount; r++) {
        const ang = rot + (r * Math.PI * 2) / runeCount;
        const rx = cx + Math.cos(ang) * (drawRadius - 3);
        const ry = cy + Math.sin(ang) * (drawRadius - 3);
        s.auraGfx.fillCircle(rx, ry, 2.4);
      }

      s.timers.aura -= dt;
      if (s.timers.aura <= 0) {
        const tickRates = [0, 0.5, 0.44, 0.38, 0.33, 0.26];
        s.timers.aura = evoAura ? 0.23 : tickRates[auraLv];
        const auraDmg = Math.round((9 + auraLv * 6) * (evoAura ? 1.45 : 1) * s.stats.mightMult);
        const rSq = baseRadius * baseRadius;
        let hitAny = false;

        s.activeAuraPulses.push({ x: cx, y: cy, maxR: drawRadius, life: 0, dur: 0.28, color: ringCol });

        for (let i = s.activeEnemies.length - 1; i >= 0; i--) {
          const e = s.activeEnemies[i];
          if (!e.active) continue;
          const dx = e.x - cx;
          const dy = e.y - cy;
          if (dx * dx + dy * dy <= rSq) {
            s._damageEnemy(e, auraDmg, dx, dy, e.isBoss ? 15 : 95, false, ringCol, 'aura', true);
            hitAny = true;
          }
        }
        s._damageCratesInRadius(cx, cy, baseRadius);
        if (evoAura && hitAny && s.stats.hp < s.stats.maxHp) {
          s.stats.hp = Math.min(s.stats.maxHp, s.stats.hp + 2);
        }
        if (hitAny) audio.playAuraPulse();
      }
    }

    // 11. Saetta di Thor
    const lightLv = s.levels.lightning;
    if (lightLv > 0) {
      s.timers.lightning -= dt;
      if (s.timers.lightning <= 0) {
        const cds = [0, 2.4, 2.1, 1.8, 1.5, 1.2];
        s.timers.lightning = s.evolvedWeapons.lightning ? 0.95 : cds[lightLv];
        this._castLightningStrikes(lightLv);
      }
    }

    // 12. Lame di Valchiria
    const bladeLv = s.levels.blades;
    if (bladeLv > 0 && s.bladeSprites.length > 0) {
      const evoBlades = Boolean(s.evolvedWeapons.blades);
      const orbitSpeed = (2.8 + bladeLv * 0.45) * (evoBlades ? 1.35 : 1);
      const orbitRadius = (66 + bladeLv * 7 + (evoBlades ? 12 : 0)) * s.stats.areaMult;
      s.timers.bladeAngle += orbitSpeed * dt;

      const count = s.bladeSprites.length;
      const bladeDmg = Math.round((15 + bladeLv * 7) * (evoBlades ? 1.45 : 1) * s.stats.mightMult);
      const hitRadiusSq = 30 * 30;
      const reducedVfx = s.settings?.vfxQuality === 'reduced';

      for (let i = 0; i < count; i++) {
        const b = s.bladeSprites[i];
        const ang = s.timers.bladeAngle + (i * Math.PI * 2) / count;
        b.x = s.hero.x + Math.cos(ang) * orbitRadius;
        b.y = s.hero.y + Math.sin(ang) * orbitRadius;
        b.setRotation(ang + Math.PI / 2);
        b.setDepth(this._depth(b.y) + 20);

        if (!reducedVfx || i % 2 === 0) {
          const trailSlot = s.bladeTrails[s._bladeTrailCursor];
          s._bladeTrailCursor = (s._bladeTrailCursor + 1) % s.bladeTrails.length;
          trailSlot.active = true;
          trailSlot.x = b.x;
          trailSlot.y = b.y;
          trailSlot.life = 0;
          trailSlot.dur = 0.16;
        }

        s._damageCratesInRadius(b.x, b.y, 26);

        for (let j = s.activeEnemies.length - 1; j >= 0; j--) {
          const e = s.activeEnemies[j];
          if (!e.active || e.bladeCooldown > 0) continue;
          const dx = e.x - b.x;
          const dy = e.y - b.y;
          if (dx * dx + dy * dy <= hitRadiusSq) {
            e.bladeCooldown = evoBlades ? 0.18 : 0.24;
            const isCrit = Math.random() < (evoBlades ? 0.32 : 0.2);
            s._damageEnemy(
              e,
              isCrit ? Math.round(bladeDmg * 1.6) : bladeDmg,
              e.x - s.hero.x,
              e.y - s.hero.y,
              115,
              isCrit,
              evoBlades ? 0xfde047 : 0xbae6fd,
              'blades',
              false
            );
          }
        }
      }
    }
  }

  _fireRunicAxes(level) {
    const s = this.scene;
    if (s.activeEnemies.length === 0) return;

    const evo = Boolean(s.evolvedWeapons?.axe);
    const counts = [0, 1, 2, 2, 3, 4];
    const pierces = [0, 1, 1, 2, 2, 3];
    const count = evo ? 5 : counts[level];
    const pierce = evo ? 4 : pierces[level];
    const targets = this.getNearestActiveEnemies(540 * 540, count);
    if (targets.length === 0) return;

    const dmg = Math.round((19 + level * 8) * (evo ? 1.35 : 1) * s.stats.mightMult);
    const speed = 300 + level * 22 + (evo ? 40 : 0);

    audio.playThrow();

    for (let i = 0; i < count; i++) {
      const target = targets[i % targets.length].enemy;
      const dx = target.x - s.hero.x;
      const dy = target.y - s.hero.y;
      const baseAng = Math.atan2(dy, dx) + (i > 0 && targets.length === 1 ? (i - 0.5) * 0.24 : 0);

      const proj = s.projPool.get(s.hero.x, s.hero.y, 'axe_proj');
      if (!proj) break;

      proj.setTexture('axe_proj');
      proj.clearTint();
      if (evo) proj.setTintFill(0xfbbf24);
      proj.enableBody(true, s.hero.x, s.hero.y, true, true);
      const axeBase = s.hdMode ? 0.32 : 1.22;
      proj.baseScale = axeBase * (1 + (s.stats.areaMult - 1) * 0.45) * (evo ? 1.18 : 1);
      proj.setScale(proj.baseScale);
      proj.setDepth(80000000 - 10);
      proj.setVelocity(Math.cos(baseAng) * speed, Math.sin(baseAng) * speed);
      proj.kind = 'axe';
      proj.sourceId = 'axe';
      proj.evolved = evo;
      proj.damage = dmg;
      proj.pierce = pierce;
      proj.life = 1.65;
      proj.trailTimer = 0;
      proj.ribbonTimer = 0;
      if (proj.trail) proj.trail.length = 0;
      if (!proj.hitSet) proj.hitSet = new Set();
      else proj.hitSet.clear();

      swapPopPush(s.activeProjectiles, proj, '_poolIdx');
    }
  }

  _fireShadowDaggers(level) {
    const s = this.scene;
    if (s.activeEnemies.length === 0) return;
    const targets = this.getNearestActiveEnemies(520 * 520, 1);
    if (targets.length === 0) return;

    const evo = Boolean(s.evolvedWeapons?.dagger);
    const counts = [0, 1, 2, 2, 3, 5];
    const pierces = [0, 1, 1, 2, 2, 3];
    const count = evo ? 8 : counts[level];
    const pierce = evo ? 4 : pierces[level];
    const dmg = Math.round((13 + level * 6) * (evo ? 1.32 : 1) * s.stats.mightMult);
    const speed = 440 + level * 25 + (evo ? 60 : 0);

    audio.playThrow();

    const target = targets[0].enemy;
    const centerAng = Math.atan2(target.y - s.hero.y, target.x - s.hero.x);
    const spread = evo ? 0.11 : 0.14;

    for (let i = 0; i < count; i++) {
      const ang = centerAng + (i - (count - 1) / 2) * spread;
      const proj = s.projPool.get(s.hero.x, s.hero.y, 'dagger_proj');
      if (!proj) break;

      proj.setTexture('dagger_proj');
      proj.clearTint();
      if (evo) proj.setTintFill(0xf0abfc);
      proj.enableBody(true, s.hero.x, s.hero.y, true, true);
      proj.baseScale = s.hdMode ? 0.32 : 1.1;
      proj.setScale(proj.baseScale);
      proj.setRotation(ang);
      proj.setDepth(80000000 - 10);
      proj.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      proj.kind = 'dagger';
      proj.sourceId = 'dagger';
      proj.evolved = evo;
      proj.damage = dmg;
      proj.pierce = pierce;
      proj.life = 1.15;
      proj.trailTimer = 0;
      proj.ribbonTimer = 0;
      if (proj.trail) proj.trail.length = 0;
      if (!proj.hitSet) proj.hitSet = new Set();
      else proj.hitSet.clear();

      swapPopPush(s.activeProjectiles, proj, '_poolIdx');
    }
  }

  _fireArcaneOrbs(level) {
    const s = this.scene;
    if (s.activeEnemies.length === 0) return;

    const evo = Boolean(s.evolvedWeapons?.orb);
    const counts = [0, 1, 1, 2, 2, 3];
    const count = evo ? 4 : counts[level];
    const targets = this.getNearestActiveEnemies(540 * 540, count);
    if (targets.length === 0) return;

    const dmg = Math.round((22 + level * 10) * (evo ? 1.38 : 1) * s.stats.mightMult);
    const blastRadius = (48 + level * 9) * s.stats.areaMult * (evo ? 1.35 : 1);
    const speed = 235 + level * 15;

    audio.playAuraPulse();

    for (let i = 0; i < count; i++) {
      const target = targets[i % targets.length].enemy;
      const ang = Math.atan2(target.y - s.hero.y, target.x - s.hero.x);
      const proj = s.projPool.get(s.hero.x, s.hero.y, 'orb_proj');
      if (!proj) break;

      proj.setTexture('orb_proj');
      proj.clearTint();
      proj.enableBody(true, s.hero.x, s.hero.y, true, true);
      proj.baseScale = (s.hdMode ? 0.31 : 1.15) * (evo ? 1.25 : 1);
      proj.setScale(proj.baseScale);
      proj.setRotation(0);
      proj.setDepth(80000000 - 8);
      proj.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      proj.kind = 'orb';
      proj.sourceId = 'orb';
      proj.evolved = evo;
      proj.damage = dmg;
      proj.blastRadius = blastRadius;
      proj.pierce = 1;
      proj.life = 1.9;
      proj.trailTimer = 0;
      proj.ribbonTimer = 0;
      if (proj.trail) proj.trail.length = 0;
      if (!proj.hitSet) proj.hitSet = new Set();
      else proj.hitSet.clear();

      swapPopPush(s.activeProjectiles, proj, '_poolIdx');
    }
  }

  _fireSeismicHammer(level) {
    const s = this.scene;
    const evo = Boolean(s.evolvedWeapons?.hammer);
    const waveCounts = [0, 1, 1, 2, 2, 3];
    const waves = evo ? 3 : waveCounts[level];
    const baseRadius = (72 + level * 13 + (evo ? 24 : 0)) * s.stats.areaMult;
    const dmg = Math.round((24 + level * 11) * (evo ? 1.45 : 1) * s.stats.mightMult);
    const hx = s.hero.x;
    const hy = s.hero.y + 8;

    audio.playHammerSlam();
    this._shake(110, evo ? 0.006 : 0.0038);

    for (let w = 0; w < waves; w++) {
      const r = baseRadius * (1 + w * 0.28);
      const rSq = r * r;
      const ringCol = evo ? 0xfbbf24 : 0xfb923c;
      s.activeExplosions.push({ x: hx, y: hy, maxR: r, life: -w * 0.08, dur: 0.32, color: ringCol });
      if (w === 0) s._spawnGroundMark?.('fissure', hx, hy, Math.min(75, baseRadius * 0.65), ringCol);
      s._emitSparks(hx, hy, 8, ringCol, 150);

      for (let i = s.activeEnemies.length - 1; i >= 0; i--) {
        const e = s.activeEnemies[i];
        if (!e.active) continue;
        const dx = e.x - hx;
        const dy = e.y - hy;
        if (dx * dx + dy * dy <= rSq) {
          const isCrit = evo && Math.random() < 0.3;
          const finalDmg = isCrit ? Math.round(dmg * 1.65) : dmg;
          s._damageEnemy(e, finalDmg, dx, dy, e.isBoss ? 20 : 175, isCrit, ringCol, 'hammer', true);
        }
      }
      s._damageCratesInRadius(hx, hy, r);
    }
  }

  _fireOdinSpears(level) {
    const s = this.scene;
    if (s.activeEnemies.length === 0) return;
    const targets = this.getNearestActiveEnemies(560 * 560, 1);
    if (targets.length === 0) return;

    const evo = Boolean(s.evolvedWeapons?.spear);
    const counts = [0, 1, 1, 2, 2, 3];
    const pierces = [0, 2, 3, 3, 4, 5];
    const count = evo ? 4 : counts[level];
    const pierce = evo ? 7 : pierces[level];
    const dmg = Math.round((23 + level * 9) * (evo ? 1.4 : 1) * s.stats.mightMult);
    const speed = 510 + level * 28 + (evo ? 70 : 0);

    audio.playSpearThrow();

    const target = targets[0].enemy;
    const centerAng = Math.atan2(target.y - s.hero.y, target.x - s.hero.x);
    const spread = evo ? 0.12 : 0.15;

    for (let i = 0; i < count; i++) {
      const ang = centerAng + (i - (count - 1) / 2) * spread;
      const proj = s.projPool.get(s.hero.x, s.hero.y, 'spear_proj');
      if (!proj) break;

      proj.setTexture('spear_proj');
      proj.clearTint();
      if (evo) proj.setTintFill(0xfde047);
      proj.enableBody(true, s.hero.x, s.hero.y, true, true);
      proj.baseScale = (s.hdMode ? 0.36 : 1.15) * (1 + (s.stats.areaMult - 1) * 0.35);
      proj.setScale(proj.baseScale);
      proj.setRotation(ang);
      proj.setDepth(80000000 - 10);
      proj.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      proj.kind = 'spear';
      proj.sourceId = 'spear';
      proj.evolved = evo;
      proj.damage = dmg;
      proj.pierce = pierce;
      proj.life = 1.25;
      proj.trailTimer = 0;
      proj.ribbonTimer = 0;
      if (proj.trail) proj.trail.length = 0;
      if (!proj.hitSet) proj.hitSet = new Set();
      else proj.hitSet.clear();
      swapPopPush(s.activeProjectiles, proj, '_poolIdx');
    }
  }

  _fireTwilightScythes(level) {
    const s = this.scene;
    if (s.activeEnemies.length === 0) return;
    const targets = this.getNearestActiveEnemies(480 * 480, 1);
    const evo = Boolean(s.evolvedWeapons?.scythe);
    const counts = [0, 1, 1, 2, 2, 3];
    const count = evo ? 4 : counts[level];
    const dmg = Math.round((18 + level * 8) * (evo ? 1.42 : 1) * s.stats.mightMult);
    const speed = 340 + level * 20 + (evo ? 45 : 0);

    audio.playThrow();
    const baseAng = targets.length > 0
      ? Math.atan2(targets[0].enemy.y - s.hero.y, targets[0].enemy.x - s.hero.x)
      : Math.random() * Math.PI * 2;

    for (let i = 0; i < count; i++) {
      const ang = baseAng + (i * Math.PI * 2) / count;
      const proj = s.projPool.get(s.hero.x, s.hero.y, 'scythe_proj');
      if (!proj) break;

      proj.setTexture('scythe_proj');
      proj.clearTint();
      if (evo) proj.setTintFill(0xf0abfc);
      proj.enableBody(true, s.hero.x, s.hero.y, true, true);
      proj.baseScale = (s.hdMode ? 0.34 : 1.15) * (1 + (s.stats.areaMult - 1) * 0.45) * (evo ? 1.2 : 1);
      proj.setScale(proj.baseScale);
      proj.setRotation(0);
      proj.setDepth(80000000 - 9);
      proj.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      proj.kind = 'scythe';
      proj.sourceId = 'scythe';
      proj.evolved = evo;
      proj.damage = dmg;
      proj.pierce = 99;
      proj.life = 1.55;
      proj.maxLife = 1.55;
      proj.outSpeed = speed;
      proj.launchAngle = ang;
      proj.returning = false;
      proj.trailTimer = 0;
      proj.ribbonTimer = 0;
      if (proj.trail) proj.trail.length = 0;
      if (!proj.hitSet) proj.hitSet = new Set();
      else proj.hitSet.clear();
      swapPopPush(s.activeProjectiles, proj, '_poolIdx');
    }
  }

  _fireShadowFangs(level) {
    const s = this.scene;
    if (s.activeEnemies.length === 0) return;
    const targets = this.getNearestActiveEnemies(480 * 480, 3);
    if (targets.length === 0) return;

    const evo = Boolean(s.evolvedWeapons?.fangs);
    const counts = [0, 1, 1, 2, 2, 3];
    const bounces = [0, 1, 2, 2, 3, 4];
    const count = evo ? 4 : counts[level];
    const maxBounces = evo ? 6 : bounces[level];
    const dmg = Math.round((15 + level * 7) * (evo ? 1.38 : 1) * s.stats.mightMult);
    const speed = 420 + level * 22 + (evo ? 50 : 0);

    audio.playThrow();

    for (let i = 0; i < count; i++) {
      const target = targets[i % targets.length].enemy;
      const ang = Math.atan2(target.y - s.hero.y, target.x - s.hero.x);
      const proj = s.projPool.get(s.hero.x, s.hero.y, 'fang_proj');
      if (!proj) break;

      proj.setTexture('fang_proj');
      proj.clearTint();
      if (evo) proj.setTintFill(0xd8b4fe);
      proj.enableBody(true, s.hero.x, s.hero.y, true, true);
      proj.baseScale = s.hdMode ? 0.34 : 1.1;
      proj.setScale(proj.baseScale);
      proj.setRotation(ang);
      proj.setDepth(80000000 - 10);
      proj.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      proj.kind = 'fangs';
      proj.sourceId = 'fangs';
      proj.evolved = evo;
      proj.damage = dmg;
      proj.pierce = maxBounces + 1;
      proj.bouncesLeft = maxBounces;
      proj.speedVal = speed;
      proj.life = 1.4;
      proj.trailTimer = 0;
      proj.ribbonTimer = 0;
      if (proj.trail) proj.trail.length = 0;
      if (!proj.hitSet) proj.hitSet = new Set();
      else proj.hitSet.clear();
      swapPopPush(s.activeProjectiles, proj, '_poolIdx');
    }
  }

  _castAstralGrimoire(level) {
    const s = this.scene;
    const visible = [];
    for (let i = 0; i < s.activeEnemies.length; i++) {
      const e = s.activeEnemies[i];
      if (e.active && this._sqDist(s.hero.x, s.hero.y, e.x, e.y) < 340 * 340) {
        visible.push(e);
      }
    }
    if (visible.length === 0) return;

    const evo = Boolean(s.evolvedWeapons?.grimoire);
    const pillarCounts = [0, 1, 1, 2, 2, 3];
    const count = evo ? 5 : pillarCounts[level];
    const radius = (52 + level * 10) * s.stats.areaMult * (evo ? 1.3 : 1);
    const rSq = radius * radius;
    const dmg = Math.round((28 + level * 13) * (evo ? 1.4 : 1) * s.stats.mightMult);

    audio.playAuraPulse();

    for (let k = 0; k < count; k++) {
      const pick = visible[Math.floor(Math.random() * visible.length)];
      if (!pick || !pick.active) continue;
      const tx = pick.x;
      const ty = pick.y;
      const col = evo ? 0x38bdf8 : 0x60a5fa;

      s.activeAstralPillars.push({ x: tx, y: ty, radius, life: 0, dur: 0.38, color: col });
      s.activeExplosions.push({ x: tx, y: ty, maxR: radius, life: 0, dur: 0.34, color: col });
      s._spawnGroundMark?.('rune', tx, ty, radius * 0.72, col);
      s._emitSparks(tx, ty, 12, 0xbae6fd, 155);

      for (let i = s.activeEnemies.length - 1; i >= 0; i--) {
        const e = s.activeEnemies[i];
        if (!e.active) continue;
        const dx = e.x - tx;
        const dy = e.y - ty;
        if (dx * dx + dy * dy <= rSq) {
          const isCrit = Math.random() < (s.stats.critChance || 0.16) + (evo ? 0.14 : 0);
          s._damageEnemy(e, isCrit ? Math.round(dmg * 1.65) : dmg, dx, dy, 105, isCrit, col, 'grimoire', true);
        }
      }
      s._damageCratesInRadius(tx, ty, radius);
    }
  }

  _triggerChainFlail(level) {
    const s = this.scene;
    const evo = Boolean(s.evolvedWeapons?.flail);
    const radius = (76 + level * 11 + (evo ? 20 : 0)) * s.stats.areaMult;
    const dmg = Math.round((22 + level * 10) * (evo ? 1.45 : 1) * s.stats.mightMult);
    const sweepTotal = (level >= 5 || evo) ? Math.PI * 2 : Math.PI * (1.25 + level * 0.15);
    const startAng = s.hero.flipX ? Math.PI - sweepTotal * 0.5 : -sweepTotal * 0.5;
    audio.playChainSweep();
    s.activeFlailSwing = {
      startAng,
      sweepTotal,
      life: 0,
      dur: evo ? 0.48 : 0.44,
      radius,
      dmg,
      evo,
      hitSet: new Set()
    };
  }

  _updateFlailSwing(dt) {
    const s = this.scene;
    const sw = s.activeFlailSwing;
    if (!sw) return;
    sw.life += dt;
    const t = Math.min(1, sw.life / sw.dur);
    const hx = s.hero.x;
    const hy = s.hero.y + 4;
    const headCount = sw.evo ? 2 : 1;
    const hitSq = 36 * 36;

    for (let h = 0; h < headCount; h++) {
      const ang = sw.startAng + sw.sweepTotal * t + h * Math.PI;
      const bx = hx + Math.cos(ang) * sw.radius;
      const by = hy + Math.sin(ang) * sw.radius;

      s.auraGfx.lineStyle(3, sw.evo ? 0xfb7185 : 0x94a3b8, 0.85);
      s.auraGfx.beginPath();
      s.auraGfx.moveTo(hx, hy);
      s.auraGfx.lineTo(bx, by);
      s.auraGfx.strokePath();

      s.auraGfx.fillStyle(sw.evo ? 0xfb7185 : 0xe2e8f0, 0.95);
      s.auraGfx.fillCircle(bx, by, sw.evo ? 11 : 9);
      s.auraGfx.lineStyle(2, 0xfb923c, 0.9);
      s.auraGfx.strokeCircle(bx, by, sw.evo ? 13 : 10.5);

      s._damageCratesInRadius(bx, by, 28);

      for (let i = s.activeEnemies.length - 1; i >= 0; i--) {
        const e = s.activeEnemies[i];
        if (!e.active || sw.hitSet.has(e)) continue;
        const dx = e.x - bx;
        const dy = e.y - by;
        if (dx * dx + dy * dy <= hitSq) {
          sw.hitSet.add(e);
          const isCrit = Math.random() < (s.stats.critChance || 0.14) + (sw.evo ? 0.15 : 0);
          s._damageEnemy(
            e,
            isCrit ? Math.round(sw.dmg * 1.65) : sw.dmg,
            e.x - hx,
            e.y - hy,
            e.isBoss ? 24 : 185,
            isCrit,
            sw.evo ? 0xfb7185 : 0xfb923c,
            'flail',
            true
          );
        }
      }
    }

    if (t >= 1) {
      s.activeFlailSwing = null;
    }
  }

  _castLightningStrikes(level) {
    const s = this.scene;
    const visible = [];
    for (let i = 0; i < s.activeEnemies.length; i++) {
      const e = s.activeEnemies[i];
      if (e.active && this._sqDist(s.hero.x, s.hero.y, e.x, e.y) < 340 * 340) {
        visible.push(e);
      }
    }
    if (visible.length === 0) return;

    const evo = Boolean(s.evolvedWeapons?.lightning);
    const strikeCounts = [0, 1, 2, 2, 3, 4];
    const count = evo ? 5 : strikeCounts[level];
    const aoeRadius = (48 + level * 8) * s.stats.areaMult * (evo ? 1.25 : 1);
    const aoeSq = aoeRadius * aoeRadius;
    const dmg = Math.round((30 + level * 15) * (evo ? 1.35 : 1) * s.stats.mightMult);

    audio.playLightning();
    this._shake(105, 0.0045);

    for (let k = 0; k < count; k++) {
      const pick = visible[Math.floor(Math.random() * visible.length)];
      if (!pick || !pick.active) continue;

      const tx = pick.x;
      const ty = pick.y;
      const points = [
        { x: tx + (Math.random() - 0.5) * 38, y: ty - 290 },
        { x: tx + (Math.random() - 0.5) * 26, y: ty - 200 },
        { x: tx + (Math.random() - 0.5) * 24, y: ty - 115 },
        { x: tx + (Math.random() - 0.5) * 14, y: ty - 48 },
        { x: tx, y: ty }
      ];
      s.activeLightnings.push({ x: tx, y: ty, radius: aoeRadius, points, life: 0, dur: 0.26 });
      s._spawnGroundMark?.('rune', tx, ty, aoeRadius * 0.65, 0x38bdf8);
      s._emitSparks(tx, ty, 10, 0x7dd3fc, 150);

      for (let i = s.activeEnemies.length - 1; i >= 0; i--) {
        const e = s.activeEnemies[i];
        if (!e.active) continue;
        const dx = e.x - tx;
        const dy = e.y - ty;
        if (dx * dx + dy * dy <= aoeSq) {
          s._damageEnemy(e, dmg, dx, dy, 105, true, 0x38bdf8, 'lightning', true);
        }
      }

      if (evo && visible.length > 1) {
        const chain = visible[Math.floor(Math.random() * visible.length)];
        if (chain && chain.active && chain !== pick) {
          s.activeLightnings.push({
            x: chain.x,
            y: chain.y,
            radius: aoeRadius * 0.75,
            points: [{ x: tx, y: ty }, { x: (tx + chain.x) / 2, y: (ty + chain.y) / 2 - 18 }, { x: chain.x, y: chain.y }],
            life: 0,
            dur: 0.22
          });
          s._damageEnemy(chain, Math.round(dmg * 0.7), chain.x - tx, chain.y - ty, 90, true, 0xfbbf24, 'lightning', true);
        }
      }
    }
  }

  onProjectileHitEnemy(proj, enemy) {
    const s = this.scene;
    if (proj.hitSet && proj.hitSet.has(enemy)) return;
    if (proj.hitSet) proj.hitSet.add(enemy);
    const sourceId = proj.sourceId || proj.kind || 'axe';

    if (proj.kind === 'orb') {
      const r = proj.blastRadius || 54;
      const rSq = r * r;
      const ex = proj.x;
      const ey = proj.y;
      s.activeExplosions.push({ x: ex, y: ey, maxR: r, life: 0, dur: 0.28, color: 0x38bdf8 });
      s._spawnGroundMark?.('scorch', ex, ey, r * 0.72, 0x38bdf8);
      s._emitSparks(ex, ey, 12, 0x7dd3fc, 145);
      audio.playLightning();

      for (let i = s.activeEnemies.length - 1; i >= 0; i--) {
        const e = s.activeEnemies[i];
        if (!e.active) continue;
        const dx = e.x - ex;
        const dy = e.y - ey;
        if (dx * dx + dy * dy <= rSq) {
          const isCrit = Math.random() < (s.stats.critChance || 0.18);
          const dmg = isCrit ? Math.round(proj.damage * 1.6) : proj.damage;
          s._damageEnemy(e, dmg, dx, dy, 95, isCrit, 0x38bdf8, sourceId, true);
        }
      }
      if (proj.evolved) {
        for (let m = 0; m < 3; m++) {
          const ang = (m * Math.PI * 2) / 3 + 0.4;
          const sx = ex + Math.cos(ang) * 46;
          const sy = ey + Math.sin(ang) * 46;
          s.activeExplosions.push({ x: sx, y: sy, maxR: r * 0.55, life: -0.06, dur: 0.26, color: 0xbae6fd });
        }
      }
      s._recycleProjectile(proj);
      return;
    }

    const critBonus = (proj.kind === 'dagger' ? 0.12 : proj.kind === 'spear' ? 0.1 : 0) + (proj.evolved ? 0.12 : 0);
    const isCrit = Math.random() < (s.stats.critChance || 0.18) + critBonus;
    const critMult = proj.kind === 'dagger' ? 1.85 : 1.65;
    const finalDmg = isCrit ? Math.round(proj.damage * critMult) : proj.damage;
    const sparkColor = proj.kind === 'dagger' ? 0xe879f9 : proj.kind === 'scythe' ? 0xc084fc : proj.kind === 'fangs' ? 0xd8b4fe : 0xfbbf24;
    s._damageEnemy(enemy, finalDmg, proj.body.velocity.x, proj.body.velocity.y, 130, isCrit, sparkColor, sourceId, false);

    if (proj.kind === 'axe' && proj.evolved) {
      s.activeExplosions.push({ x: enemy.x, y: enemy.y, maxR: 46, life: 0, dur: 0.22, color: 0xfbbf24 });
    }

    if (proj.kind === 'fangs' && proj.bouncesLeft > 0) {
      let nextEnemy = null;
      let bestDSq = 230 * 230;
      for (let i = 0; i < s.activeEnemies.length; i++) {
        const cand = s.activeEnemies[i];
        if (!cand.active || (proj.hitSet && proj.hitSet.has(cand))) continue;
        const dSq = this._sqDist(proj.x, proj.y, cand.x, cand.y);
        if (dSq < bestDSq) {
          bestDSq = dSq;
          nextEnemy = cand;
        }
      }
      if (nextEnemy) {
        proj.bouncesLeft -= 1;
        proj.pierce -= 1;
        const ang = Math.atan2(nextEnemy.y - proj.y, nextEnemy.x - proj.x);
        const spd = proj.speedVal || 430;
        proj.setRotation(ang);
        proj.setVelocity(Math.cos(ang) * spd, Math.sin(ang) * spd);
        return;
      }
    }

    proj.pierce -= 1;
    if (proj.pierce <= 0) {
      s._recycleProjectile(proj);
    }
  }

  triggerActiveSkill() {
    const s = this.scene;
    if (s.gameState !== 'PLAYING') return false;
    if (s.activeSkillCooldown > 0) return false;
    const hero = HERO_ROSTER[s.activeHeroId] || HERO_ROSTER.warrior;
    const skill = hero.activeSkill;
    if (!skill) return false;

    s.activeSkillCooldown = skill.cooldownSec;
    s.skillsUsed = (s.skillsUsed || 0) + 1;
    audio.playActiveSkill(s.activeHeroId);
    triggerHaptic(22, s.settings);

    const hx = s.hero.x;
    const hy = s.hero.y;
    const areaM = s.stats.areaMult || 1;
    const mightM = s.stats.mightMult || 1;

    if (skill.id === 'skill_valkyrie_leap') {
      const r = 145 * areaM;
      const rSq = r * r;
      const dmg = Math.round(52 * mightM);
      s.activeSkillBuffTimer = 2.2;
      s._recomputeStatsFromLevels();
      s.activeExplosions.push({ x: hx, y: hy, maxR: r, life: 0, dur: 0.36, color: 0xfbbf24 });
      s.activeAuraPulses.push({ x: hx, y: hy, maxR: r * 1.15, life: 0, dur: 0.42, color: 0xfef08a });
      s._spawnGroundMark?.('fissure', hx, hy + 12, 68, 0xfbbf24);
      s._emitSparks(hx, hy, 18, 0xfbbf24, 190);
      this._shake(150, 0.006);
      for (let i = s.activeEnemies.length - 1; i >= 0; i--) {
        const e = s.activeEnemies[i];
        if (!e.active) continue;
        const dx = e.x - hx;
        const dy = e.y - hy;
        if (dx * dx + dy * dy <= rSq) {
          e.freezeTimer = Math.max(e.freezeTimer || 0, 1.4);
          s._damageEnemy(e, dmg, dx, dy, e.isBoss ? 25 : 190, true, 0xfbbf24, skill.id, true);
        }
      }
      s._damageCratesInRadius(hx, hy, r);
    } else if (skill.id === 'skill_shadow_step') {
      s.stats.invulnTimer = Math.max(s.stats.invulnTimer, 0.95);
      const moveX = s.hero.body.velocity.x;
      const moveY = s.hero.body.velocity.y;
      const dashAng = (Math.hypot(moveX, moveY) > 10)
        ? Math.atan2(moveY, moveX)
        : (s.hero.flipX ? Math.PI : 0);
      const stepDist = 105;
      s._emitSparks(hx, hy, 12, 0xe879f9, 130);
      s.hero.setPosition(hx + Math.cos(dashAng) * stepDist, hy + Math.sin(dashAng) * stepDist);
      s._resolvePropCollisions();
      s.activeAuraPulses.push({ x: s.hero.x, y: s.hero.y, maxR: 72, life: 0, dur: 0.32, color: 0xf0abfc });
      s._emitSparks(s.hero.x, s.hero.y, 16, 0xf0abfc, 160);

      const fanCount = 10;
      const dmg = Math.round(28 * mightM);
      for (let i = 0; i < fanCount; i++) {
        const ang = (i / fanCount) * Math.PI * 2;
        const proj = s.projPool.get(s.hero.x, s.hero.y, 'dagger_proj');
        if (!proj) break;
        proj.setTexture('dagger_proj');
        proj.clearTint();
        proj.setTintFill(0xf0abfc);
        proj.enableBody(true, s.hero.x, s.hero.y, true, true);
        proj.baseScale = s.hdMode ? 0.36 : 1.15;
        proj.setScale(proj.baseScale);
        proj.setRotation(ang);
        proj.setDepth(80000000 - 10);
        proj.setVelocity(Math.cos(ang) * 490, Math.sin(ang) * 490);
        proj.kind = 'dagger';
        proj.sourceId = skill.id;
        proj.evolved = true;
        proj.damage = dmg;
        proj.pierce = 3;
        proj.life = 0.85;
        proj.trailTimer = 0;
        proj.ribbonTimer = 0;
        if (proj.trail) proj.trail.length = 0;
        if (!proj.hitSet) proj.hitSet = new Set();
        else proj.hitSet.clear();
        swapPopPush(s.activeProjectiles, proj, '_poolIdx');
      }
    } else if (skill.id === 'skill_rune_rupture') {
      const r = 175 * areaM;
      const rSq = r * r;
      const dmg = Math.round(46 * mightM);
      s.activeExplosions.push({ x: hx, y: hy, maxR: r, life: 0, dur: 0.42, color: 0x38bdf8 });
      s.activeAuraPulses.push({ x: hx, y: hy, maxR: r * 1.12, life: 0, dur: 0.46, color: 0x7dd3fc });
      s._spawnGroundMark?.('rune', hx, hy + 10, 76, 0x38bdf8);
      s._emitSparks(hx, hy, 22, 0x7dd3fc, 200);
      this._shake(130, 0.005);
      for (let i = s.activeEnemies.length - 1; i >= 0; i--) {
        const e = s.activeEnemies[i];
        if (!e.active) continue;
        const dx = e.x - hx;
        const dy = e.y - hy;
        if (dx * dx + dy * dy <= rSq) {
          e.freezeTimer = Math.max(e.freezeTimer || 0, 3.0);
          e.setTintFill(0x7dd3fc);
          s._damageEnemy(e, dmg, dx, dy, 80, false, 0x38bdf8, skill.id, true);
        }
      }
      for (const g of s.activeGems) {
        if (g.active) g.magnetized = true;
      }
      s._damageCratesInRadius(hx, hy, r);
    } else if (skill.id === 'skill_iron_skin') {
      s.ironSkinTimer = 4.0;
      const r = 150 * areaM;
      const rSq = r * r;
      const dmg = Math.round(62 * mightM);
      s.activeExplosions.push({ x: hx, y: hy, maxR: r, life: 0, dur: 0.36, color: 0xfb923c });
      s.activeAuraPulses.push({ x: hx, y: hy, maxR: r * 1.1, life: 0, dur: 0.42, color: 0xfdba74 });
      s._spawnGroundMark?.('fissure', hx, hy + 12, 72, 0xfb923c);
      s._emitSparks(hx, hy, 20, 0xfb923c, 190);
      this._shake(180, 0.0075);
      for (let i = s.activeEnemies.length - 1; i >= 0; i--) {
        const e = s.activeEnemies[i];
        if (!e.active) continue;
        const dx = e.x - hx;
        const dy = e.y - hy;
        if (dx * dx + dy * dy <= rSq) {
          s._damageEnemy(e, dmg, dx, dy, e.isBoss ? 25 : 210, true, 0xfb923c, skill.id, true);
        }
      }
      s._damageCratesInRadius(hx, hy, r);
    }

    s._syncHud();
    return true;
  }
}
