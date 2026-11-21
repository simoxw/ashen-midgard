/**
 * BossController: macchina a stati multi-fase (Fase I, II, III) per tutti i Boss dei 4 Regni,
 * inclusa la trasformazione a doppia forma Loki -> Odino in Asgard in Rovine.
 */

import { audio } from './audio.js';
import { swapPopPush } from './spatialGrid.js';

const PHASE_LABELS = {
  1: 'FASE I',
  2: 'FASE II',
  3: 'FASE III'
};

export class BossController {
  constructor(scene) {
    this.scene = scene;
  }

  getHudPayload(boss) {
    if (!boss || !boss.active) return null;
    const phase = boss.phase || 1;
    const realmBoss = this.scene.activeRealm?.boss;
    const fallbackName = boss.isTransformed && realmBoss?.stage2Name
      ? realmBoss.stage2Name
      : (realmBoss?.name || 'Boss');
    return {
      name: boss.displayName || fallbackName,
      hp: Math.max(0, boss.hp),
      maxHp: boss.maxHp,
      phase,
      phaseLabel: PHASE_LABELS[phase] || 'FASE I',
      transformed: Boolean(boss.isTransformed)
    };
  }

  onBossDamaged(boss) {
    if (!boss || !boss.active) return;
    const s = this.scene;
    const ratio = boss.maxHp > 0 ? boss.hp / boss.maxHp : 0;

    // 1. Doppia forma Asgard: Loki -> Odino a <= 55% HP
    if (
      boss.attackProfile === 'asgard_dual' &&
      !boss.isTransformed &&
      boss.hp > 0 &&
      ratio <= 0.55
    ) {
      this._transformLokiToOdin(boss);
    }

    // 2. Transizione multi-fase 1 -> 2 (< 66%) e 2 -> 3 (< 33%)
    const targetPhase = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;
    if (targetPhase > (boss.phase || 1) && boss.hp > 0) {
      boss.phase = targetPhase;
      const accentCol = boss.phase === 3 ? 0xf87171 : (s.activeRealm?.boss?.telegraphColor || 0xfbbf24);
      s._emitSparks(boss.x, boss.y, 20, accentCol, 190);
      s.activeExplosions.push({ x: boss.x, y: boss.y, maxR: 110, life: 0, dur: 0.34, color: accentCol });
      if (targetPhase === 2) s._emitDialogue('boss_phase2');
      else if (targetPhase === 3) s._emitDialogue('boss_phase3');
    }

    // 3. Compatibilità dialogo mid-HP (50%)
    if (!s.bossHalfHpTriggered && boss.hp > 0 && ratio <= 0.5) {
      s.bossHalfHpTriggered = true;
      s._emitDialogue('boss_half');
      s._emitSparks(boss.x, boss.y, 18, s.activeRealm?.boss?.telegraphColor || 0xf87171, 180);
    }

    s.bridge?.onBossHudUpdate?.(this.getHudPayload(boss));
  }

  _transformLokiToOdin(boss) {
    const s = this.scene;
    const realmBoss = s.activeRealm?.boss || {};
    boss.isTransformed = true;
    s.bossTransformed = true;
    const stage2Key = realmBoss.stage2TexKey || 'boss_odin';
    if (s.textures?.exists?.(stage2Key)) {
      boss.setTexture(stage2Key);
    }
    boss.baseTexKey = stage2Key;
    boss.displayName = realmBoss.stage2Name || 'Odino, il Padre Caduto';
    boss.speed = Math.round((boss.speed || 78) * 1.15);
    boss.damage = Math.round((boss.damage || 44) * 1.12);

    audio.playBossAlarm();
    s._emitSparks(boss.x, boss.y, 28, 0xfbbf24, 220);
    s.activeExplosions.push({ x: boss.x, y: boss.y, maxR: 155, life: 0, dur: 0.45, color: 0xfbbf24 });
    if (s.settings?.screenShake !== false) {
      s.cameras?.main?.shake?.(260, 0.009);
    }
    s._emitDialogue('boss_transform');
  }

  update(dt) {
    const s = this.scene;
    const boss = s.bossSprite;
    if (!boss || !boss.active) return;

    s.timers.bossAttack -= dt;
    if (s.timers.bossAttack > 0) return;

    const phase = boss.phase || 1;
    const enraged = phase >= 2 || boss.hp < boss.maxHp * 0.5;
    const profile = boss.attackProfile || 'frost';
    s.bossAttackStep = (s.bossAttackStep || 0) + 1;
    s.timers.bossAttack = phase === 3 ? 2.15 : phase === 2 ? 2.5 : 3.05;

    const hx = s.hero.x;
    const hy = s.hero.y;

    if (profile === 'asgard_dual') {
      if (!boss.isTransformed) {
        // LOKI: Dardi d'illusione smeraldo + cerchi miraggio
        const count = phase >= 2 ? 4 : 3;
        for (let c = 0; c < count; c++) {
          const offsetAng = (c / count) * Math.PI * 2 + s.bossAttackStep * 0.4;
          const offsetR = c === 0 ? 18 : 72;
          s.activeTelegraphs.push({
            x: hx + Math.cos(offsetAng) * offsetR,
            y: hy + Math.sin(offsetAng) * offsetR,
            radius: 58,
            elapsed: -c * 0.1,
            duration: 1.15,
            color: 0x34d399,
            damage: 28
          });
        }
        this.fireRadialVolley(boss, phase >= 2 ? 9 : 6, 'loki_bolt', 200, s.bossAttackStep * 0.42);
      } else {
        // ODINO: Croci astrali di Gungnir + ventaglio di lance dorate
        const armStep = 56;
        const arms = phase === 3 ? [-2, -1, 0, 1, 2] : [-1, 0, 1];
        for (let k = 0; k < arms.length; k++) {
          const d = arms[k] * armStep;
          s.activeTelegraphs.push({
            x: hx + d,
            y: hy,
            radius: 52,
            elapsed: -Math.abs(arms[k]) * 0.1,
            duration: 1.1,
            color: 0xfbbf24,
            damage: 34
          });
          if (arms[k] !== 0) {
            s.activeTelegraphs.push({
              x: hx,
              y: hy + d,
              radius: 52,
              elapsed: -Math.abs(arms[k]) * 0.1,
              duration: 1.1,
              color: 0xfbbf24,
              damage: 34
            });
          }
        }
        this.fireRadialVolley(boss, phase === 3 ? 12 : 8, 'astral_spear', 225, s.bossAttackStep * 0.3);
      }
    } else if (profile === 'fire') {
      // Surtr: Schianti lavici & meteore a cascata
      const meteorCount = (s.bossAttackStep % 2 === 0 ? 4 : 3) + (phase === 3 ? 3 : phase === 2 ? 2 : 0);
      for (let c = 0; c < meteorCount; c++) {
        const offsetAng = (c / meteorCount) * Math.PI * 2 + Math.random() * 0.5;
        const offsetR = c === 0 ? 16 : 56 + Math.random() * 95;
        s.activeTelegraphs.push({
          x: hx + Math.cos(offsetAng) * offsetR,
          y: hy + Math.sin(offsetAng) * offsetR,
          radius: 62,
          elapsed: -c * 0.12,
          duration: phase === 3 ? 1.1 : 1.25,
          color: 0xfb923c,
          damage: 28
        });
      }
      if (enraged || s.bossAttackStep % 2 === 1) {
        this.fireRadialVolley(boss, phase === 3 ? 10 : phase === 2 ? 8 : 5, 'fire_bolt', 200);
      }
    } else if (profile === 'shadow') {
      // Hel: Anelli necrotici + spirale d'ombra rotante
      const ringCount = 3 + (phase === 3 ? 2 : phase === 2 ? 1 : 0);
      for (let c = 0; c < ringCount; c++) {
        const offsetAng = Math.random() * Math.PI * 2;
        const offsetR = c === 0 ? 14 : 64 + Math.random() * 88;
        s.activeTelegraphs.push({
          x: hx + Math.cos(offsetAng) * offsetR,
          y: hy + Math.sin(offsetAng) * offsetR,
          radius: 64,
          elapsed: 0,
          duration: phase === 3 ? 1.05 : 1.15,
          color: 0xa855f7,
          damage: 30
        });
      }
      this.fireRadialVolley(boss, phase === 3 ? 12 : phase === 2 ? 10 : 7, 'shadow_bolt', 185, s.bossAttackStep * 0.35);
    } else {
      // Hrimthurs (Midgard): Maglio Glaciale + schegge di brina in Fase II/III
      const count = 2 + (phase === 3 ? 2 : phase === 2 ? 1 : 0);
      for (let c = 0; c < count; c++) {
        const offsetAng = Math.random() * Math.PI * 2;
        const offsetR = c === 0 ? 18 : 65 + Math.random() * 85;
        s.activeTelegraphs.push({
          x: hx + Math.cos(offsetAng) * offsetR,
          y: hy + Math.sin(offsetAng) * offsetR,
          radius: 66,
          elapsed: 0,
          duration: phase === 3 ? 1.1 : 1.25,
          color: 0xf87171,
          damage: 26
        });
      }
      if (phase >= 2) {
        this.fireRadialVolley(boss, phase === 3 ? 8 : 5, 'frost_arrow', 180, s.bossAttackStep * 0.4);
      }
    }
  }

  fireRadialVolley(boss, count, projKey, speed = 185, angleOffset = 0) {
    const s = this.scene;
    if (!boss || !boss.active) return;
    const tex = s.textures.exists(projKey) ? projKey : 'frost_arrow';
    for (let i = 0; i < count; i++) {
      const proj = s.enemyProjPool.get(boss.x, boss.y, tex);
      if (!proj) break;
      const ang = angleOffset + (i / count) * Math.PI * 2;
      proj.setTexture(tex);
      proj.enableBody(true, boss.x, boss.y, true, true);
      proj.setScale(s.hdMode ? 0.44 : 1.2);
      proj.setRotation(ang);
      proj.setDepth(80000000 - 5);
      proj.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      proj.life = 3.2;
      proj.damage = Math.round((boss.damage || 28) * 0.72);
      swapPopPush(s.activeEnemyProjectiles, proj, '_poolIdx');
    }
  }
}
