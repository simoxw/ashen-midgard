/**
 * Generatore di sprite vettoriali HD 4x super dettagliati su HTML5 Canvas 2D.
 * Tutti i personaggi, nemici, boss, ostacoli e proiettili usano tracciati Bézier
 * ad alta definizione (risoluzione 4x per downsampling nitido su schermi Retina),
 * contorni scuri di separazione, riflessi di bordo (rim lights), rune incise
 * e gradienti volumetrici multi-stop.
 */

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

function registerCanvas(textures, key, w, h, drawFn) {
  if (textures.exists(key)) return;
  const { canvas, ctx } = makeCanvas(w, h);
  drawFn(ctx, w, h);
  textures.addCanvas(key, canvas);
}

function drawRoundedPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawGlowEye(ctx, x, y, r, coreColor, glowColor) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
  grad.addColorStop(0, coreColor);
  grad.addColorStop(0.4, glowColor);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawRivets(ctx, points, r, fill = '#e2e8f0', shadow = '#0f172a') {
  for (const [rx, ry] of points) {
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(rx + 0.8, ry + 1.0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpecularArc(ctx, x, y, rx, ry, rot = -0.35, alpha = 0.35) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const grad = ctx.createLinearGradient(0, -ry, 0, ry);
  grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawArmorBevel(ctx, x, y, w, h, r, highlight = 'rgba(255,255,255,0.38)', shadow = 'rgba(2,6,23,0.45)') {
  ctx.save();
  drawRoundedPath(ctx, x + 2, y + 2, w - 4, h - 4, Math.max(2, r - 2));
  ctx.strokeStyle = shadow;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + r, y + 2.5);
  ctx.lineTo(x + w - r, y + 2.5);
  ctx.strokeStyle = highlight;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();
}

function drawShoulderPlate(ctx, x, y, w, h, trimColor = '#fbbf24') {
  ctx.save();
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#475569');
  g.addColorStop(0.55, '#1e293b');
  g.addColorStop(1, '#0f172a');
  ctx.fillStyle = g;
  drawRoundedPath(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  drawArmorBevel(ctx, x + 2, y + 2, w - 4, h - 4, 8, 'rgba(255,255,255,0.35)');
  ctx.restore();
}

export function generateHdTextures(textures) {
  // 1. Terreno Tundra Nordica 512x512 con lastroni di basalto scolpiti, brina e rune
  registerCanvas(textures, 'ground_tile', 512, 512, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#0b1220');
    bg.addColorStop(0.5, '#101a2d');
    bg.addColorStop(1, '#0b111e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Brina morbida e venature fredde sul terreno (basso contrasto per leggibilità)
    const frostPatches = [
      [84, 72, 118, 0.14],
      [340, 96, 136, 0.12],
      [140, 310, 150, 0.13],
      [410, 380, 124, 0.14],
      [250, 210, 102, 0.1]
    ];
    for (const [fx, fy, fr, fa] of frostPatches) {
      const rg = ctx.createRadialGradient(fx, fy, 8, fx, fy, fr);
      rg.addColorStop(0, `rgba(56, 189, 248, ${fa * 0.6})`);
      rg.addColorStop(0.55, `rgba(30, 58, 95, ${fa})`);
      rg.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lastroni di basalto smussati con bordo superiore illuminato e crepe profonde
    const slabs = [
      [34, 42, 94, 62, -0.04],
      [270, 140, 110, 68, 0.03],
      [110, 358, 98, 64, 0.02],
      [366, 360, 92, 58, -0.05]
    ];
    for (const [sx, sy, sw, sh, rot] of slabs) {
      ctx.save();
      ctx.translate(sx + sw / 2, sy + sh / 2);
      ctx.rotate(rot);

      ctx.fillStyle = 'rgba(2, 6, 23, 0.52)';
      drawRoundedPath(ctx, -sw / 2 + 2, -sh / 2 + 4, sw, sh, 10);
      ctx.fill();

      drawRoundedPath(ctx, -sw / 2, -sh / 2, sw, sh, 10);
      const sg = ctx.createLinearGradient(0, -sh / 2, 0, sh / 2);
      sg.addColorStop(0, '#223149');
      sg.addColorStop(1, '#121c2e');
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
      ctx.stroke();

      // Crepa ramificata
      ctx.beginPath();
      ctx.moveTo(-sw * 0.15, -sh / 2 + 3);
      ctx.lineTo(-sw * 0.04, 0);
      ctx.lineTo(sw * 0.11, sh / 2 - 3);
      ctx.moveTo(-sw * 0.04, 0);
      ctx.lineTo(-sw * 0.24, sh * 0.22);
      ctx.strokeStyle = 'rgba(5, 8, 15, 0.72)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // Ciottoli e muschio nordico
    const stones = [
      [38, 184, 10, '#1e3a34'], [182, 54, 8, '#28394f'], [438, 64, 11, '#1e3a34'],
      [212, 272, 9, '#2c3d55'], [48, 434, 12, '#1e3a34'], [304, 466, 9, '#28394f'],
      [462, 232, 10, '#243c39'], [172, 464, 8, '#334155']
    ];
    for (const [px, py, pr, col] of stones) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
      ctx.beginPath();
      ctx.ellipse(px + 2, py + 3, pr, pr * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rune sottili incise nella pietra
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(318, 158);
    ctx.lineTo(318, 190);
    ctx.moveTo(318, 166);
    ctx.lineTo(332, 174);
    ctx.lineTo(318, 182);
    ctx.moveTo(76, 62);
    ctx.lineTo(76, 86);
    ctx.moveTo(68, 72);
    ctx.lineTo(84, 72);
    ctx.stroke();
  });

  // 1b. Decali terreno HD
  registerCanvas(textures, 'decal_rune', 128, 92, (ctx) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    drawRoundedPath(ctx, 10, 12, 108, 68, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const rg = ctx.createRadialGradient(64, 46, 4, 64, 46, 30);
    rg.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    rg.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(64, 46, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.72)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(64, 46, 20, 0, Math.PI * 2);
    ctx.moveTo(64, 30);
    ctx.lineTo(64, 62);
    ctx.moveTo(52, 42);
    ctx.lineTo(76, 42);
    ctx.stroke();
  });

  registerCanvas(textures, 'decal_relic', 96, 90, (ctx) => {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.48)';
    ctx.beginPath();
    ctx.ellipse(46, 52, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    const sg = ctx.createLinearGradient(20, 22, 70, 72);
    sg.addColorStop(0, '#475569');
    sg.addColorStop(1, '#1e293b');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(44, 46, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#92400e';
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(44, 46, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(58, 16);
    ctx.lineTo(48, 56);
    ctx.stroke();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(48, 22);
    ctx.lineTo(67, 27);
    ctx.stroke();
  });

  registerCanvas(textures, 'decal_snow', 132, 68, (ctx) => {
    const g = ctx.createRadialGradient(66, 34, 6, 66, 34, 60);
    g.addColorStop(0, 'rgba(51, 76, 110, 0.55)');
    g.addColorStop(0.65, 'rgba(30, 45, 68, 0.35)');
    g.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(66, 34, 60, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Ombra ellittica morbida 4x (128x64)
  registerCanvas(textures, 'shadow_ellipse', 128, 64, (ctx) => {
    const g = ctx.createRadialGradient(64, 32, 6, 64, 32, 58);
    g.addColorStop(0, 'rgba(2, 6, 23, 0.78)');
    g.addColorStop(0.58, 'rgba(2, 6, 23, 0.42)');
    g.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(64, 32, 58, 27, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Helper animazione multi-frame 4x (registra <key> = frame 0 + <key>_f0.._f3)
  const registerAnimated = (baseKey, w, h, drawFrameFn) => {
    registerCanvas(textures, baseKey, w, h, (ctx) => drawFrameFn(ctx, 0));
    for (let f = 0; f < 4; f++) {
      registerCanvas(textures, `${baseKey}_f${f}`, w, h, (ctx) => drawFrameFn(ctx, f));
    }
  };

  const getFrameKinematics = (frameIdx) => {
    const stride = frameIdx === 1 ? 6.5 : frameIdx === 3 ? -6.5 : 0;
    const bob = frameIdx === 1 || frameIdx === 3 ? -3.2 : frameIdx === 2 ? 1.4 : 0;
    const sway = frameIdx === 1 ? 0.06 : frameIdx === 3 ? -0.06 : 0;
    return { stride, bob, sway };
  };

  // 3. EROE 1: Astrid la Valchiria — Vettoriale 4x Multi-Frame (144x168)
  registerAnimated('hero_warrior', 144, 168, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Mantello cremisi scolpito con ondeggio camminata e bordo oro
    const cloak = ctx.createLinearGradient(72, 50, 72, 152);
    cloak.addColorStop(0, '#b91c1c');
    cloak.addColorStop(0.45, '#7f1d1d');
    cloak.addColorStop(1, '#3b0712');
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(36, 56 + bob);
    ctx.bezierCurveTo(18 - stride * 0.5, 96 + bob, 16 + stride * 0.6, 128, 22 + stride * 0.8, 146);
    ctx.quadraticCurveTo(72, 160 + bob * 0.4, 120 + stride * 0.8, 144);
    ctx.bezierCurveTo(124 + stride * 0.4, 122, 118, 92 + bob, 106, 56 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(24, 5, 8, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(46, 86 + bob);
    ctx.quadraticCurveTo(40 + stride * 0.3, 122, 42 + stride * 0.5, 148);
    ctx.moveTo(96, 86 + bob);
    ctx.quadraticCurveTo(100 + stride * 0.3, 120, 98 + stride * 0.5, 146);
    ctx.stroke();

    // Stivali corazzati con passo alternato
    const drawBoot = (bx, byOff) => {
      const by = 112 + byOff;
      const bg = ctx.createLinearGradient(bx, by, bx + 22, by + 46);
      bg.addColorStop(0, '#475569');
      bg.addColorStop(0.5, '#1e293b');
      bg.addColorStop(1, '#090d16');
      ctx.fillStyle = bg;
      drawRoundedPath(ctx, bx, by, 22, 44, 7);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      drawRoundedPath(ctx, bx + 2, by + 2, 18, 10, 4);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.fillRect(bx + 2, by + 22, 18, 4);
    };
    drawBoot(42 - stride * 0.45, -stride * 0.8);
    drawBoot(78 + stride * 0.45, stride * 0.8);

    ctx.save();
    ctx.translate(0, bob);

    // Corazza in acciaio temperato
    const armor = ctx.createLinearGradient(38, 56, 106, 120);
    armor.addColorStop(0, '#cbd5e1');
    armor.addColorStop(0.32, '#64748b');
    armor.addColorStop(0.75, '#334155');
    armor.addColorStop(1, '#0f172a');
    ctx.fillStyle = armor;
    drawRoundedPath(ctx, 41, 57, 60, 60, 13);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    drawArmorBevel(ctx, 41, 57, 60, 60, 13, 'rgba(254, 243, 199, 0.55)');
    drawSpecularArc(ctx, 64, 70, 16, 7, -0.2, 0.28);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(52, 65);
    ctx.lineTo(71, 86);
    ctx.lineTo(90, 65);
    ctx.stroke();
    drawRivets(ctx, [[48, 66], [94, 66], [48, 94], [94, 94]], 2.1);

    const belt = ctx.createLinearGradient(39, 98, 103, 110);
    belt.addColorStop(0, '#78350f');
    belt.addColorStop(0.5, '#f59e0b');
    belt.addColorStop(1, '#78350f');
    ctx.fillStyle = belt;
    drawRoundedPath(ctx, 40, 98, 62, 13, 4);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    drawRoundedPath(ctx, 63, 96, 16, 17, 4);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.stroke();

    const drawPauldron = (px, dir) => {
      ctx.save();
      ctx.translate(px, 63);
      ctx.rotate(dir * 0.24 + sway * 0.5);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      const pg = ctx.createLinearGradient(-12, -8, 12, 8);
      pg.addColorStop(0, '#94a3b8');
      pg.addColorStop(1, '#334155');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(0, -1, 13, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -1, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawPauldron(40, -1);
    drawPauldron(102, 1);

    const hair = ctx.createLinearGradient(44, 34, 98, 76);
    hair.addColorStop(0, '#fbbf24');
    hair.addColorStop(1, '#b45309');
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(46, 54, 7.5, 21, 0.22 + sway * 0.4, 0, Math.PI * 2);
    ctx.ellipse(98, 54, 7.5, 21, -0.22 + sway * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.stroke();

    const skin = ctx.createLinearGradient(56, 30, 88, 62);
    skin.addColorStop(0, '#fde68a');
    skin.addColorStop(1, '#d97706');
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(72, 46, 18.5, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    drawGlowEye(ctx, 64, 47, 2.8, '#f0f9ff', 'rgba(56, 189, 248, 0.85)');
    drawGlowEye(ctx, 80, 47, 2.8, '#f0f9ff', 'rgba(56, 189, 248, 0.85)');

    const helm = ctx.createLinearGradient(48, 16, 94, 44);
    helm.addColorStop(0, '#f1f5f9');
    helm.addColorStop(0.55, '#64748b');
    helm.addColorStop(1, '#1e293b');
    ctx.fillStyle = helm;
    ctx.beginPath();
    ctx.arc(72, 36, 21, Math.PI, 0);
    ctx.lineTo(93, 42);
    ctx.lineTo(75, 38);
    ctx.lineTo(72, 46);
    ctx.lineTo(69, 38);
    ctx.lineTo(51, 42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(72, 36, 19.5, Math.PI * 1.06, -Math.PI * 0.06);
    ctx.stroke();

    const drawWing = (wx, dir) => {
      const wg = ctx.createLinearGradient(wx, 34, wx + dir * 24, 6);
      wg.addColorStop(0, '#cbd5e1');
      wg.addColorStop(1, '#ffffff');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(wx, 34);
      ctx.quadraticCurveTo(wx + dir * 28, 17, wx + dir * 22, 5);
      ctx.quadraticCurveTo(wx + dir * 10, 14, wx + dir * 4, 27);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    };
    drawWing(50, -1);
    drawWing(94, 1);

    // Ascia Runica oscillante col passo
    ctx.save();
    ctx.translate(116, 86);
    ctx.rotate(sway * 1.4);
    ctx.translate(-116, -86);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.moveTo(116, 36);
    ctx.lineTo(116, 126);
    ctx.stroke();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    const axeBlade = ctx.createLinearGradient(112, 26, 141, 68);
    axeBlade.addColorStop(0, '#ffffff');
    axeBlade.addColorStop(0.35, '#fbbf24');
    axeBlade.addColorStop(0.75, '#d97706');
    axeBlade.addColorStop(1, '#78350f');
    ctx.fillStyle = axeBlade;
    ctx.beginPath();
    ctx.moveTo(116, 33);
    ctx.quadraticCurveTo(142, 24, 140, 52);
    ctx.quadraticCurveTo(138, 72, 116, 63);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(136, 34);
    ctx.quadraticCurveTo(140, 48, 134, 62);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  // 4. EROE 2: Skadi l'Assassina d'Ombra — Vettoriale 4x Multi-Frame (144x168)
  registerAnimated('hero_assassin', 144, 168, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const cloak = ctx.createLinearGradient(72, 46, 72, 158);
    cloak.addColorStop(0, '#6b21a8');
    cloak.addColorStop(0.55, '#2e1065');
    cloak.addColorStop(1, '#090d16');
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(40, 54 + bob);
    ctx.quadraticCurveTo(16 - stride * 0.4, 102 + bob, 18 + stride, 150);
    ctx.lineTo(44 + stride * 0.6, 136);
    ctx.lineTo(72 + stride * 0.4, 156);
    ctx.lineTo(100 + stride * 0.6, 136);
    ctx.lineTo(126 + stride, 150);
    ctx.quadraticCurveTo(124 + stride * 0.4, 102 + bob, 102, 54 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(232, 121, 249, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const drawBoot = (bx, byOff) => {
      const by = 108 + byOff;
      ctx.fillStyle = '#0f172a';
      drawRoundedPath(ctx, bx, by, 18, 48, 6);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + 2, by + 14);
      ctx.lineTo(bx + 16, by + 18);
      ctx.moveTo(bx + 2, by + 24);
      ctx.lineTo(bx + 16, by + 28);
      ctx.stroke();
    };
    drawBoot(46 - stride * 0.5, -stride * 0.85);
    drawBoot(78 + stride * 0.5, stride * 0.85);

    ctx.save();
    ctx.translate(0, bob);

    const leather = ctx.createLinearGradient(44, 56, 100, 116);
    leather.addColorStop(0, '#312e81');
    leather.addColorStop(0.6, '#1e1b4b');
    leather.addColorStop(1, '#090d16');
    ctx.fillStyle = leather;
    drawRoundedPath(ctx, 46, 58, 52, 56, 12);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.8;
    ctx.stroke();
    drawArmorBevel(ctx, 46, 58, 52, 56, 12, 'rgba(232, 121, 249, 0.45)');
    drawSpecularArc(ctx, 64, 70, 14, 6, -0.3, 0.22);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(49, 64);
    ctx.lineTo(94, 100);
    ctx.stroke();
    drawRivets(ctx, [[58, 71], [72, 82], [85, 92]], 2, '#e879f9');

    const sash = ctx.createLinearGradient(44, 94, 100, 134);
    sash.addColorStop(0, '#f0abfc');
    sash.addColorStop(0.5, '#d946ef');
    sash.addColorStop(1, '#701a75');
    ctx.fillStyle = sash;
    drawRoundedPath(ctx, 45, 93, 54, 10, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(85, 99);
    ctx.lineTo(104 + stride * 0.8, 134);
    ctx.lineTo(88 + stride * 0.5, 128);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(72, 43, 17, 18.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(54, 44);
    ctx.quadraticCurveTo(72, 39, 90, 44);
    ctx.lineTo(87, 60);
    ctx.quadraticCurveTo(72, 65, 57, 60);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    drawGlowEye(ctx, 64, 40, 2.8, '#fdf4ff', 'rgba(232, 121, 249, 0.92)');
    drawGlowEye(ctx, 80, 40, 2.8, '#fdf4ff', 'rgba(232, 121, 249, 0.92)');

    const hood = ctx.createLinearGradient(44, 8, 98, 46);
    hood.addColorStop(0, '#9333ea');
    hood.addColorStop(1, '#2e1065');
    ctx.fillStyle = hood;
    ctx.beginPath();
    ctx.moveTo(46, 44);
    ctx.quadraticCurveTo(48, 14, 72, 6);
    ctx.quadraticCurveTo(96, 14, 98, 44);
    ctx.quadraticCurveTo(72, 28, 46, 44);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.8;
    ctx.stroke();
    ctx.strokeStyle = '#e879f9';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    const drawDagger = (hx, hy, tx, ty, cx, cy, rot) => {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(rot);
      ctx.translate(-hx, -hy);
      const dg = ctx.createLinearGradient(hx, hy, tx, ty);
      dg.addColorStop(0, '#701a75');
      dg.addColorStop(0.55, '#e879f9');
      dg.addColorStop(1, '#ffffff');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.moveTo(hx, hy - 3);
      ctx.quadraticCurveTo(cx, cy - 6, tx, ty);
      ctx.quadraticCurveTo(cx + 2, cy + 6, hx, hy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };
    drawDagger(38, 88, 7, 62, 18, 80, -sway * 1.8);
    drawDagger(106, 88, 137, 62, 126, 80, sway * 1.8);

    ctx.restore();
  });

  // 5. EROE 3: Freya la Maga delle Rune — Vettoriale 4x Multi-Frame (144x168)
  registerAnimated('hero_mage', 144, 168, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const robe = ctx.createLinearGradient(72, 56, 72, 158);
    robe.addColorStop(0, '#0284c7');
    robe.addColorStop(0.5, '#0c4a6e');
    robe.addColorStop(1, '#082f49');
    ctx.fillStyle = robe;
    ctx.beginPath();
    ctx.moveTo(45, 58 + bob);
    ctx.bezierCurveTo(30 - stride * 0.4, 102 + bob, 28 + stride * 0.5, 132, 28 + stride * 0.7, 152);
    ctx.quadraticCurveTo(72, 163 + bob * 0.3, 116 + stride * 0.7, 152);
    ctx.bezierCurveTo(116 + stride * 0.3, 132, 114, 102 + bob, 99, 58 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(0, bob);

    const stole = ctx.createLinearGradient(62, 62, 82, 154);
    stole.addColorStop(0, '#fde68a');
    stole.addColorStop(0.45, '#f59e0b');
    stole.addColorStop(1, '#92400e');
    ctx.fillStyle = stole;
    drawRoundedPath(ctx, 62 + stride * 0.2, 64, 20, 88, 5);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(72 + stride * 0.2, 92);
    ctx.lineTo(72 + stride * 0.2, 126);
    ctx.moveTo(65 + stride * 0.2, 102);
    ctx.lineTo(79 + stride * 0.2, 112);
    ctx.lineTo(65 + stride * 0.2, 120);
    ctx.stroke();

    const mantle = ctx.createLinearGradient(32, 56, 112, 80);
    mantle.addColorStop(0, '#38bdf8');
    mantle.addColorStop(0.5, '#0ea5e9');
    mantle.addColorStop(1, '#0369a1');
    ctx.fillStyle = mantle;
    ctx.beginPath();
    ctx.moveTo(34, 69);
    ctx.quadraticCurveTo(72, 50, 110, 69);
    ctx.quadraticCurveTo(72, 84, 34, 69);
    ctx.fill();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    drawSpecularArc(ctx, 72, 64, 24, 5, 0, 0.25);

    const hair = ctx.createLinearGradient(42, 20, 102, 88);
    hair.addColorStop(0, '#ffffff');
    hair.addColorStop(0.55, '#cbd5e1');
    hair.addColorStop(1, '#64748b');
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(72, 48, 27, 32, sway * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(72, 44, 17, 18.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawGlowEye(ctx, 64, 44, 2.8, '#f0f9ff', 'rgba(56, 189, 248, 0.95)');
    drawGlowEye(ctx, 80, 44, 2.8, '#f0f9ff', 'rgba(56, 189, 248, 0.95)');

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(72, 39, 17, Math.PI * 1.15, -Math.PI * 0.15);
    ctx.stroke();
    drawGlowEye(ctx, 72, 23, 4.2, '#ffffff', 'rgba(56, 189, 248, 0.98)');

    // Bastone runico + cristallo oscillante
    ctx.save();
    ctx.translate(118, 95);
    ctx.rotate(sway * 0.9);
    ctx.translate(-118, -95);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(118, 42);
    ctx.lineTo(118, 152);
    ctx.stroke();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.stroke();

    const orbGlow = ctx.createRadialGradient(118, 28, 3, 118, 28, 25);
    orbGlow.addColorStop(0, '#ffffff');
    orbGlow.addColorStop(0.35, '#38bdf8');
    orbGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = orbGlow;
    ctx.beginPath();
    ctx.arc(118, 28, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.moveTo(118, 14);
    ctx.lineTo(127, 28);
    ctx.lineTo(118, 42);
    ctx.lineTo(109, 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(118, 28, 17, 6.5, -0.45 + sway, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  // 5b. EROE 4: Bjorn Martello di Ferro — Vettoriale 4x Multi-Frame (144x168)
  registerAnimated('hero_juggernaut', 144, 168, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Mantello pesante di pelliccia d'orso bruna dietro le spalle
    const furCloak = ctx.createLinearGradient(72, 48, 72, 150);
    furCloak.addColorStop(0, '#78350f');
    furCloak.addColorStop(0.6, '#451a03');
    furCloak.addColorStop(1, '#1c1917');
    ctx.fillStyle = furCloak;
    ctx.beginPath();
    ctx.moveTo(30, 56 + bob);
    ctx.bezierCurveTo(16 - stride * 0.4, 98 + bob, 16 + stride * 0.5, 134, 24 + stride * 0.6, 148);
    ctx.quadraticCurveTo(72, 158, 118 + stride * 0.6, 146);
    ctx.bezierCurveTo(124 + stride * 0.3, 128, 120, 96 + bob, 112, 56 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Stivali pesanti in ferro scuro
    const drawHeavyBoot = (bx, byOff) => {
      const by = 110 + byOff;
      ctx.fillStyle = '#1e293b';
      drawRoundedPath(ctx, bx, by, 25, 45, 7);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(bx + 3, by + 16, 19, 5);
    };
    drawHeavyBoot(38 - stride * 0.4, -stride * 0.75);
    drawHeavyBoot(79 + stride * 0.4, stride * 0.75);

    ctx.save();
    ctx.translate(0, bob);

    // Corazza massiccia in ferro nero e bordature rame/ambra
    const chest = ctx.createLinearGradient(34, 54, 110, 118);
    chest.addColorStop(0, '#475569');
    chest.addColorStop(0.55, '#1e293b');
    chest.addColorStop(1, '#0f172a');
    ctx.fillStyle = chest;
    drawRoundedPath(ctx, 35, 56, 72, 60, 14);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawArmorBevel(ctx, 35, 56, 72, 60, 14, 'rgba(253, 186, 116, 0.5)');
    drawSpecularArc(ctx, 64, 69, 20, 7, -0.15, 0.26);

    // Runa della forgia sul pettorale
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(71, 66);
    ctx.lineTo(71, 96);
    ctx.moveTo(59, 75);
    ctx.lineTo(83, 87);
    ctx.moveTo(83, 75);
    ctx.lineTo(59, 87);
    ctx.stroke();
    drawRivets(ctx, [[43, 65], [99, 65], [43, 99], [99, 99]], 2.2, '#fb923c');

    // Cintura di forgia
    ctx.fillStyle = '#9a3412';
    drawRoundedPath(ctx, 36, 100, 70, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    drawRoundedPath(ctx, 62, 98, 18, 15, 4);
    ctx.fill();

    // Spallacci con pelliccia chiara + borchie rame
    for (const [px, dir] of [[34, -1], [108, 1]]) {
      ctx.save();
      ctx.translate(px, 62);
      ctx.rotate(dir * 0.2 + sway * 0.4);
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Volto + folta barba rossiccia intrecciata
    ctx.fillStyle = '#fdba74';
    ctx.beginPath();
    ctx.ellipse(71, 43, 18, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2;
    ctx.stroke();

    const beard = ctx.createLinearGradient(54, 48, 88, 72);
    beard.addColorStop(0, '#c2410c');
    beard.addColorStop(1, '#7c2d12');
    ctx.fillStyle = beard;
    ctx.beginPath();
    ctx.moveTo(54, 46);
    ctx.quadraticCurveTo(71, 78, 88, 46);
    ctx.quadraticCurveTo(71, 56, 54, 46);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawGlowEye(ctx, 64, 41, 2.7, '#fff7ed', 'rgba(251, 146, 60, 0.92)');
    drawGlowEye(ctx, 78, 41, 2.7, '#fff7ed', 'rgba(251, 146, 60, 0.92)');

    // Elmo cornuto da Fabbro-Guerriero
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(71, 33, 20, Math.PI, 0);
    ctx.lineTo(91, 38);
    ctx.lineTo(74, 34);
    ctx.lineTo(71, 41);
    ctx.lineTo(68, 34);
    ctx.lineTo(51, 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    for (const [hx, dir] of [[50, -1], [92, 1]]) {
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.moveTo(hx, 30);
      ctx.quadraticCurveTo(hx + dir * 20, 20, hx + dir * 16, 7);
      ctx.quadraticCurveTo(hx + dir * 7, 17, hx - dir * 3, 24);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Martello Sismico massiccio nella mano destra
    ctx.save();
    ctx.translate(120, 82);
    ctx.rotate(sway * 1.5);
    ctx.translate(-120, -82);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.moveTo(120, 34);
    ctx.lineTo(120, 128);
    ctx.stroke();

    const hammerHead = ctx.createLinearGradient(102, 20, 141, 52);
    hammerHead.addColorStop(0, '#94a3b8');
    hammerHead.addColorStop(0.5, '#334155');
    hammerHead.addColorStop(1, '#0f172a');
    ctx.fillStyle = hammerHead;
    drawRoundedPath(ctx, 102, 22, 38, 26, 6);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(114, 28);
    ctx.lineTo(128, 28);
    ctx.moveTo(121, 28);
    ctx.lineTo(121, 42);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  // 6. NEMICO SWARM: Draugr del Gelo — Vettoriale 4x Multi-Frame (120x136)
  registerAnimated('enemy_swarm', 120, 136, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 36 - stride * 0.4, 94 - stride * 0.7, 16, 34, 5);
    ctx.fill();
    drawRoundedPath(ctx, 68 + stride * 0.4, 94 + stride * 0.7, 16, 34, 5);
    ctx.fill();

    ctx.save();
    ctx.translate(0, bob);

    const body = ctx.createLinearGradient(32, 46, 88, 98);
    body.addColorStop(0, '#256073');
    body.addColorStop(0.55, '#133140');
    body.addColorStop(1, '#090d16');
    ctx.fillStyle = body;
    drawRoundedPath(ctx, 32, 48, 56, 50, 11);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(42, 64);
    ctx.lineTo(78, 64);
    ctx.moveTo(46, 76);
    ctx.lineTo(74, 76);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(60, 32, 17, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    const drawHorn = (hx, dir) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(hx, 26);
      ctx.quadraticCurveTo(hx + dir * 20, 16, hx + dir * 15, 5);
      ctx.quadraticCurveTo(hx + dir * 7, 14, hx - dir * 3, 21);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    drawHorn(43, -1);
    drawHorn(77, 1);

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(60, 29, 17, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    drawGlowEye(ctx, 53, 34, 2.8, '#e0f2fe', 'rgba(56, 189, 248, 0.96)');
    drawGlowEye(ctx, 67, 34, 2.8, '#e0f2fe', 'rgba(56, 189, 248, 0.96)');

    ctx.save();
    ctx.translate(90, 72);
    ctx.rotate(sway * 1.4);
    ctx.translate(-90, -72);
    const sw = ctx.createLinearGradient(90, 28, 108, 72);
    sw.addColorStop(0, '#f8fafc');
    sw.addColorStop(0.6, '#94a3b8');
    sw.addColorStop(1, '#334155');
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.moveTo(90, 72);
    ctx.lineTo(104, 28);
    ctx.stroke();
    ctx.strokeStyle = sw;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(82, 68);
    ctx.lineTo(98, 74);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  // 7. NEMICO VELOCE: Lupo Fenrir d'Ombra — Vettoriale 4x Multi-Frame (144x112)
  registerAnimated('enemy_fast', 144, 112, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const tail = ctx.createLinearGradient(4, 44, 34, 66);
    tail.addColorStop(0, '#818cf8');
    tail.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(30, 56 + bob);
    ctx.quadraticCurveTo(5, 34 + stride * 0.7, 8, 59 + stride * 0.4);
    ctx.quadraticCurveTo(18, 70, 35, 62 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    const legs = [
      [32 - stride * 0.8, 72 - stride * 0.3, 14, 32],
      [53 + stride * 0.5, 74 + stride * 0.25, 13, 30],
      [86 + stride * 0.9, 72 - stride * 0.35, 14, 32]
    ];
    for (const [lx, ly, lw, lh] of legs) {
      ctx.fillStyle = '#1e1b4b';
      drawRoundedPath(ctx, lx, ly, lw, lh, 5);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(lx + 4, ly + lh - 4, 7, 3);
    }

    ctx.save();
    ctx.translate(0, bob * 0.8);

    const fur = ctx.createLinearGradient(26, 34, 112, 80);
    fur.addColorStop(0, '#4f46e5');
    fur.addColorStop(0.55, '#312e81');
    fur.addColorStop(1, '#141136');
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(67, 58, 39, 20, -0.06 + sway * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#a5b4fc';
    ctx.beginPath();
    ctx.moveTo(36, 42);
    ctx.lineTo(50, 28);
    ctx.lineTo(64, 38);
    ctx.lineTo(78, 26);
    ctx.lineTo(92, 37);
    ctx.lineTo(88, 48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#3730a3';
    ctx.beginPath();
    ctx.moveTo(85, 34);
    ctx.lineTo(98, 12);
    ctx.lineTo(110, 29);
    ctx.lineTo(135, 40);
    ctx.lineTo(128, 56);
    ctx.lineTo(93, 59);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(118, 52);
    ctx.lineTo(122, 61);
    ctx.lineTo(126, 52);
    ctx.closePath();
    ctx.fill();

    drawGlowEye(ctx, 110, 37, 3.2, '#fecdd3', 'rgba(244, 63, 94, 0.98)');
    ctx.restore();
  });

  // 8. NEMICO TANK: Jotun Corazzato — Vettoriale 4x Multi-Frame (168x192)
  registerAnimated('enemy_tank', 168, 192, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 42, 138 - stride * 0.65, 30, 44, 8);
    ctx.fill();
    drawRoundedPath(ctx, 96, 138 + stride * 0.65, 30, 44, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(0, bob * 0.9);

    const armor = ctx.createLinearGradient(30, 50, 138, 150);
    armor.addColorStop(0, '#64748b');
    armor.addColorStop(0.5, '#334155');
    armor.addColorStop(1, '#090d16');
    ctx.fillStyle = armor;
    drawRoundedPath(ctx, 33, 56, 102, 90, 18);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawArmorBevel(ctx, 33, 56, 102, 90, 18, 'rgba(226, 232, 240, 0.4)');
    drawSpecularArc(ctx, 76, 76, 28, 9, -0.15, 0.25);

    drawRivets(ctx, [[45, 68], [123, 68], [45, 132], [123, 132]], 2.5, '#cbd5e1');

    for (const [sx, rot] of [[32, -0.22], [136, 0.22]]) {
      ctx.save();
      ctx.translate(sx, 69);
      ctx.rotate(rot + sway * 0.4);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = '#334155';
    drawRoundedPath(ctx, 54, 18, 60, 44, 13);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    drawGlowEye(ctx, 72, 40, 3.6, '#fee2e2', 'rgba(239, 68, 68, 0.96)');
    drawGlowEye(ctx, 96, 40, 3.6, '#fee2e2', 'rgba(239, 68, 68, 0.96)');

    const shield = ctx.createLinearGradient(6, 58, 50, 132);
    shield.addColorStop(0, '#94a3b8');
    shield.addColorStop(1, '#1e293b');
    ctx.fillStyle = shield;
    drawRoundedPath(ctx, 8, 61 - stride * 0.25, 38, 70, 10);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(27, 96 - stride * 0.25, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(141, 76);
    ctx.rotate(sway * 1.2);
    ctx.translate(-141, -76);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(141, 48);
    ctx.quadraticCurveTo(165, 62, 158, 96);
    ctx.lineTo(138, 86);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  // 8b. NEMICO TIRATORE: Arciere di Brina — Vettoriale 4x Multi-Frame (120x136)
  registerAnimated('enemy_archer', 120, 136, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 38 - stride * 0.4, 94 - stride * 0.65, 14, 34, 5);
    ctx.fill();
    drawRoundedPath(ctx, 68 + stride * 0.4, 94 + stride * 0.65, 14, 34, 5);
    ctx.fill();

    ctx.save();
    ctx.translate(0, bob);

    // Mantello glaciale ciano scuro
    const cloak = ctx.createLinearGradient(34, 42, 86, 114);
    cloak.addColorStop(0, '#0369a1');
    cloak.addColorStop(0.6, '#0c4a6e');
    cloak.addColorStop(1, '#082f49');
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(38, 44);
    ctx.lineTo(24, 112);
    ctx.quadraticCurveTo(60, 120, 96, 112);
    ctx.lineTo(82, 44);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.8;
    ctx.stroke();
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Cappuccio acuminato
    ctx.fillStyle = '#075985';
    ctx.beginPath();
    ctx.moveTo(38, 42);
    ctx.quadraticCurveTo(42, 12, 60, 8);
    ctx.quadraticCurveTo(78, 12, 82, 42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    drawGlowEye(ctx, 53, 31, 2.7, '#ffffff', 'rgba(56, 189, 248, 0.98)');
    drawGlowEye(ctx, 67, 31, 2.7, '#ffffff', 'rgba(56, 189, 248, 0.98)');

    // Arco di ghiaccio + freccia incoccata
    ctx.save();
    ctx.translate(92, 66);
    ctx.rotate(sway * 0.8);
    ctx.translate(-92, -66);
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(84, 66, 26, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(86, 41);
    ctx.lineTo(86, 91);
    ctx.stroke();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(80, 66);
    ctx.lineTo(114, 66);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  // 8c. NEMICO CARICA: Predone Berserker — Vettoriale 4x Multi-Frame (144x160)
  registerAnimated('enemy_berserker', 144, 160, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.fillStyle = '#1c1917';
    drawRoundedPath(ctx, 40 - stride * 0.5, 110 - stride * 0.85, 21, 40, 6);
    ctx.fill();
    drawRoundedPath(ctx, 82 + stride * 0.5, 110 + stride * 0.85, 21, 40, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(0, bob);

    // Torso muscoloso con pitture di guerra cremisi e cintura teschi
    const torso = ctx.createLinearGradient(36, 52, 108, 120);
    torso.addColorStop(0, '#991b1b');
    torso.addColorStop(0.55, '#450a0a');
    torso.addColorStop(1, '#1c1917');
    ctx.fillStyle = torso;
    drawRoundedPath(ctx, 36, 54, 72, 64, 15);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Pitture runiche rosse
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(52, 64);
    ctx.lineTo(72, 96);
    ctx.moveTo(92, 64);
    ctx.lineTo(72, 96);
    ctx.stroke();

    // Spallacci spinati
    for (const [sx, dir] of [[34, -1], [110, 1]]) {
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.ellipse(sx, 60, 18, 13, dir * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(sx, 48);
      ctx.lineTo(sx + dir * 12, 34);
      ctx.lineTo(sx + dir * 8, 52);
      ctx.closePath();
      ctx.fill();
    }

    // Testa + elmo cornuto furioso
    ctx.fillStyle = '#292524';
    drawRoundedPath(ctx, 50, 20, 44, 38, 12);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    drawGlowEye(ctx, 63, 39, 3.2, '#ffffff', 'rgba(239, 68, 68, 1)');
    drawGlowEye(ctx, 81, 39, 3.2, '#ffffff', 'rgba(239, 68, 68, 1)');

    // Doppie mannaie dentate
    for (const [ax, dir] of [[24, -1], [120, 1]]) {
      ctx.save();
      ctx.translate(ax, 84);
      ctx.rotate(dir * sway * 1.6);
      ctx.translate(-ax, -84);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(ax, 54);
      ctx.quadraticCurveTo(ax + dir * 24, 62, ax + dir * 18, 96);
      ctx.lineTo(ax, 86);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  });

  // 8d. MINI-BOSS ELITE: Campione Jotun — Vettoriale 4x Multi-Frame (184x208)
  registerAnimated('enemy_elite', 184, 208, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const aura = ctx.createRadialGradient(92, 104, 18, 92, 104, 86);
    aura.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
    aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(92, 104, 86, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 48, 148 - stride * 0.7, 32, 50, 9);
    ctx.fill();
    drawRoundedPath(ctx, 104, 148 + stride * 0.7, 32, 50, 9);
    ctx.fill();

    ctx.save();
    ctx.translate(0, bob);

    const armor = ctx.createLinearGradient(34, 58, 150, 160);
    armor.addColorStop(0, '#475569');
    armor.addColorStop(0.5, '#1e293b');
    armor.addColorStop(1, '#090d16');
    ctx.fillStyle = armor;
    drawRoundedPath(ctx, 36, 62, 112, 92, 20);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Cuore cremisi/oro
    const heart = ctx.createRadialGradient(92, 104, 4, 92, 104, 22);
    heart.addColorStop(0, '#fef08a');
    heart.addColorStop(0.5, '#f59e0b');
    heart.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = heart;
    ctx.beginPath();
    ctx.arc(92, 104, 22, 0, Math.PI * 2);
    ctx.fill();

    // Corona d'oro + corna scure
    for (const [hx, dir] of [[60, -1], [124, 1]]) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(hx, 38);
      ctx.quadraticCurveTo(hx + dir * 28, 22, hx + dir * 24, 5);
      ctx.quadraticCurveTo(hx + dir * 10, 18, hx - dir * 5, 30);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }

    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 58, 22, 68, 46, 14);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    drawGlowEye(ctx, 78, 45, 4, '#fffbeb', 'rgba(251, 191, 36, 1)');
    drawGlowEye(ctx, 106, 45, 4, '#fffbeb', 'rgba(251, 191, 36, 1)');

    // Grande ascia bipenne
    ctx.save();
    ctx.translate(154, 86);
    ctx.rotate(sway * 1.1);
    ctx.translate(-154, -86);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(154, 28);
    ctx.lineTo(154, 156);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(154, 34);
    ctx.quadraticCurveTo(182, 46, 174, 82);
    ctx.lineTo(154, 72);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  // 9. BOSS FINALE: Hrimthurs, Signore del Gelo — Vettoriale 4x Multi-Frame (280x320)
  registerAnimated('boss', 280, 320, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const aura = ctx.createRadialGradient(140, 156, 30, 140, 156, 130);
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(140, 156, 130, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 74, 224 - stride * 0.9, 48, 78, 13);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawRoundedPath(ctx, 158, 224 + stride * 0.9, 48, 78, 13);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(0, bob * 1.1);

    const plate = ctx.createLinearGradient(54, 92, 226, 238);
    plate.addColorStop(0, '#64748b');
    plate.addColorStop(0.5, '#1e293b');
    plate.addColorStop(1, '#090d16');
    ctx.fillStyle = plate;
    drawRoundedPath(ctx, 58, 98, 164, 134, 28);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    const core = ctx.createRadialGradient(140, 162, 5, 140, 162, 34);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.3, '#f87171');
    core.addColorStop(0.6, '#dc2626');
    core.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(140, 162, 34, 0, Math.PI * 2);
    ctx.fill();

    const iceGrad = ctx.createLinearGradient(24, 62, 86, 132);
    iceGrad.addColorStop(0, '#f0f9ff');
    iceGrad.addColorStop(0.5, '#38bdf8');
    iceGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = iceGrad;

    ctx.beginPath();
    ctx.moveTo(28, 112);
    ctx.lineTo(18, 60);
    ctx.lineTo(58, 82);
    ctx.lineTo(72, 54);
    ctx.lineTo(84, 112);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(252, 112);
    ctx.lineTo(262, 60);
    ctx.lineTo(222, 82);
    ctx.lineTo(208, 54);
    ctx.lineTo(196, 112);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = iceGrad;
    ctx.beginPath();
    ctx.moveTo(96, 56);
    ctx.quadraticCurveTo(58, 32, 61, 5);
    ctx.quadraticCurveTo(85, 22, 109, 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(184, 56);
    ctx.quadraticCurveTo(222, 32, 219, 5);
    ctx.quadraticCurveTo(195, 22, 171, 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 94, 37, 92, 70, 18);
    ctx.fill();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    drawGlowEye(ctx, 120, 69, 5.2, '#ffffff', 'rgba(56, 189, 248, 0.98)');
    drawGlowEye(ctx, 160, 69, 5.2, '#ffffff', 'rgba(56, 189, 248, 0.98)');

    ctx.save();
    ctx.translate(242, 148);
    ctx.rotate(sway * 1.1);
    ctx.translate(-242, -148);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(242, 72);
    ctx.lineTo(242, 244);
    ctx.stroke();

    ctx.fillStyle = iceGrad;
    drawRoundedPath(ctx, 212, 42, 60, 54, 10);
    ctx.fill();
    ctx.strokeStyle = '#f0f9ff';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  // 10. Props scenici 4x (Pino, Monolite Runico, Braciere, Cassa Runica, Altare Runico)
  registerCanvas(textures, 'prop_tree', 144, 196, (ctx) => {
    ctx.fillStyle = '#451a03';
    drawRoundedPath(ctx, 60, 138, 24, 52, 6);
    ctx.fill();

    const tiers = [
      [72, 92, 64, 62],
      [72, 52, 53, 58],
      [72, 13, 40, 54]
    ];
    for (const [cx, ty, halfW, h] of tiers) {
      const tg = ctx.createLinearGradient(cx, ty, cx, ty + h);
      tg.addColorStop(0, '#0f766e');
      tg.addColorStop(1, '#064e3b');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.moveTo(cx, ty);
      ctx.lineTo(cx - halfW, ty + h);
      ctx.quadraticCurveTo(cx, ty + h + 9, cx + halfW, ty + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#022c22';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      ctx.beginPath();
      ctx.moveTo(cx, ty);
      ctx.lineTo(cx - halfW * 0.45, ty + h * 0.4);
      ctx.quadraticCurveTo(cx, ty + h * 0.32, cx + halfW * 0.45, ty + h * 0.4);
      ctx.closePath();
      ctx.fill();
    }
  });

  registerCanvas(textures, 'prop_rock', 108, 144, (ctx) => {
    const stone = ctx.createLinearGradient(20, 14, 88, 132);
    stone.addColorStop(0, '#64748b');
    stone.addColorStop(1, '#1e293b');
    ctx.fillStyle = stone;
    ctx.beginPath();
    ctx.moveTo(54, 9);
    ctx.lineTo(88, 38);
    ctx.lineTo(92, 130);
    ctx.lineTo(16, 130);
    ctx.lineTo(20, 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(54, 47);
    ctx.lineTo(54, 98);
    ctx.moveTo(38, 65);
    ctx.lineTo(70, 65);
    ctx.moveTo(54, 47);
    ctx.lineTo(68, 58);
    ctx.stroke();
  });

  registerCanvas(textures, 'prop_brazier', 100, 118, (ctx) => {
    ctx.fillStyle = '#334155';
    drawRoundedPath(ctx, 25, 64, 50, 45, 9);
    ctx.fill();
    ctx.fillStyle = '#475569';
    drawRoundedPath(ctx, 16, 50, 68, 18, 7);
    ctx.fill();

    const fg = ctx.createRadialGradient(50, 38, 4, 50, 38, 36);
    fg.addColorStop(0, '#fef08a');
    fg.addColorStop(0.45, '#f97316');
    fg.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(50, 38, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(50, 11);
    ctx.quadraticCurveTo(25, 38, 32, 52);
    ctx.lineTo(68, 52);
    ctx.quadraticCurveTo(75, 38, 50, 11);
    ctx.fill();
  });

  registerCanvas(textures, 'prop_crate', 88, 88, (ctx) => {
    const wood = ctx.createLinearGradient(12, 16, 76, 78);
    wood.addColorStop(0, '#92400e');
    wood.addColorStop(0.55, '#78350f');
    wood.addColorStop(1, '#451a03');
    ctx.fillStyle = wood;
    drawRoundedPath(ctx, 12, 18, 64, 58, 9);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Assi e bande in ferro
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(14, 34);
    ctx.lineTo(74, 34);
    ctx.moveTo(14, 62);
    ctx.lineTo(74, 62);
    ctx.stroke();

    // Runa luminosa centrale
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(44, 38);
    ctx.lineTo(44, 58);
    ctx.moveTo(36, 44);
    ctx.lineTo(52, 52);
    ctx.stroke();
  });

  registerCanvas(textures, 'prop_shrine', 128, 160, (ctx) => {
    const base = ctx.createLinearGradient(28, 90, 100, 148);
    base.addColorStop(0, '#475569');
    base.addColorStop(1, '#1e293b');
    ctx.fillStyle = base;
    drawRoundedPath(ctx, 26, 112, 76, 36, 10);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();

    const pillar = ctx.createLinearGradient(42, 22, 86, 116);
    pillar.addColorStop(0, '#64748b');
    pillar.addColorStop(1, '#1e293b');
    ctx.fillStyle = pillar;
    ctx.beginPath();
    ctx.moveTo(64, 14);
    ctx.lineTo(86, 36);
    ctx.lineTo(84, 114);
    ctx.lineTo(44, 114);
    ctx.lineTo(42, 36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();

    const glow = ctx.createRadialGradient(64, 64, 4, 64, 64, 44);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.72)');
    glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(64, 64, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(64, 38);
    ctx.lineTo(64, 92);
    ctx.moveTo(50, 56);
    ctx.lineTo(78, 56);
    ctx.moveTo(54, 72);
    ctx.lineTo(74, 72);
    ctx.stroke();
  });

  registerCanvas(textures, 'chest_valhalla', 96, 84, (ctx) => {
    const halo = ctx.createRadialGradient(48, 42, 6, 48, 42, 44);
    halo.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
    halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(48, 42, 44, 0, Math.PI * 2);
    ctx.fill();

    const wood = ctx.createLinearGradient(16, 22, 80, 74);
    wood.addColorStop(0, '#b45309');
    wood.addColorStop(1, '#451a03');
    ctx.fillStyle = wood;
    drawRoundedPath(ctx, 16, 28, 64, 42, 8);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    drawRoundedPath(ctx, 14, 22, 68, 16, 6);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    drawRoundedPath(ctx, 41, 34, 14, 18, 4);
    ctx.fill();
  });

  // 11. Proiettili, Pickup e Gemme 4x
  registerCanvas(textures, 'axe_proj', 88, 88, (ctx) => {
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(40, 13);
    ctx.lineTo(40, 75);
    ctx.stroke();

    const blade = ctx.createLinearGradient(40, 10, 80, 50);
    blade.addColorStop(0, '#fef3c7');
    blade.addColorStop(0.5, '#f59e0b');
    blade.addColorStop(1, '#b45309');
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(40, 16);
    ctx.quadraticCurveTo(80, 8, 75, 35);
    ctx.quadraticCurveTo(72, 56, 40, 48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  });

  registerCanvas(textures, 'dagger_proj', 80, 50, (ctx) => {
    const dg = ctx.createLinearGradient(16, 25, 75, 25);
    dg.addColorStop(0, '#701a75');
    dg.addColorStop(0.5, '#e879f9');
    dg.addColorStop(1, '#ffffff');
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.moveTo(75, 25);
    ctx.lineTo(24, 12);
    ctx.lineTo(32, 25);
    ctx.lineTo(24, 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#312e81';
    drawRoundedPath(ctx, 5, 20, 21, 10, 4);
    ctx.fill();
  });

  registerCanvas(textures, 'orb_proj', 76, 76, (ctx) => {
    const og = ctx.createRadialGradient(38, 38, 4, 38, 38, 34);
    og.addColorStop(0, '#ffffff');
    og.addColorStop(0.35, '#7dd3fc');
    og.addColorStop(0.7, '#0284c7');
    og.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(38, 38, 34, 0, Math.PI * 2);
    ctx.fill();
  });

  registerCanvas(textures, 'blade_proj', 64, 84, (ctx) => {
    const bg = ctx.createLinearGradient(32, 5, 32, 68);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(0.6, '#38bdf8');
    bg.addColorStop(1, '#0284c7');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(32, 5);
    ctx.lineTo(53, 63);
    ctx.lineTo(32, 55);
    ctx.lineTo(11, 63);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    drawRoundedPath(ctx, 19, 63, 26, 10, 4);
    ctx.fill();
  });

  registerCanvas(textures, 'frost_arrow', 64, 24, (ctx) => {
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(8, 12);
    ctx.lineTo(52, 12);
    ctx.stroke();
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#f0f9ff';
    ctx.beginPath();
    ctx.moveTo(60, 12);
    ctx.lineTo(44, 4);
    ctx.lineTo(48, 12);
    ctx.lineTo(44, 20);
    ctx.closePath();
    ctx.fill();
  });

  registerCanvas(textures, 'meat_pickup', 56, 48, (ctx) => {
    ctx.fillStyle = '#fef3c7';
    drawRoundedPath(ctx, 32, 19, 18, 10, 4);
    ctx.fill();
    const meat = ctx.createLinearGradient(8, 10, 38, 38);
    meat.addColorStop(0, '#ef4444');
    meat.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = meat;
    ctx.beginPath();
    ctx.ellipse(23, 24, 16, 12, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  });

  registerCanvas(textures, 'magnet_pickup', 56, 56, (ctx) => {
    const mg = ctx.createRadialGradient(28, 28, 3, 28, 28, 25);
    mg.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
    mg.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(28, 28, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(28, 24, 14, 0, Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(10, 12, 8, 12);
    ctx.fillRect(38, 12, 8, 12);
  });

  const drawHdGem = (key, mainHex, lightHex, glowRgba) => {
    registerCanvas(textures, key, 48, 56, (ctx) => {
      const gg = ctx.createRadialGradient(24, 28, 3, 24, 28, 22);
      gg.addColorStop(0, glowRgba);
      gg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(24, 28, 22, 0, Math.PI * 2);
      ctx.fill();

      const cg = ctx.createLinearGradient(10, 7, 38, 49);
      cg.addColorStop(0, lightHex);
      cg.addColorStop(1, mainHex);
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(24, 5);
      ctx.lineTo(41, 28);
      ctx.lineTo(24, 51);
      ctx.lineTo(7, 28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });
  };
  drawHdGem('gem_blue', '#0284c7', '#bae6fd', 'rgba(56, 189, 248, 0.55)');
  drawHdGem('gem_green', '#059669', '#a7f3d0', 'rgba(52, 211, 153, 0.55)');
  drawHdGem('gem_gold', '#d97706', '#fef3c7', 'rgba(251, 191, 36, 0.6)');

  // ===========================================================================
  // 12. BIOMA MUSPELHEIM (Terreno lavico, decali, prop, nemici 4x, Surtr)
  // ===========================================================================
  registerCanvas(textures, 'ground_tile_muspel', 512, 512, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#160907');
    bg.addColorStop(0.5, '#1e0c09');
    bg.addColorStop(1, '#120705');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Alone di calore vulcanico
    const heatPatches = [
      [96, 84, 128, 0.14],
      [352, 112, 140, 0.12],
      [152, 336, 146, 0.13],
      [410, 390, 120, 0.14]
    ];
    for (const [fx, fy, fr, fa] of heatPatches) {
      const rg = ctx.createRadialGradient(fx, fy, 6, fx, fy, fr);
      rg.addColorStop(0, `rgba(249, 115, 22, ${fa})`);
      rg.addColorStop(0.55, `rgba(154, 52, 18, ${fa * 0.6})`);
      rg.addColorStop(1, 'rgba(26, 11, 8, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lastroni d'ossidiana scura
    const slabs = [
      [36, 46, 98, 62, -0.05],
      [272, 134, 108, 66, 0.04],
      [104, 344, 102, 62, 0.03],
      [362, 356, 94, 58, -0.04]
    ];
    for (const [sx, sy, sw, sh, rot] of slabs) {
      ctx.save();
      ctx.translate(sx + sw / 2, sy + sh / 2);
      ctx.rotate(rot);
      drawRoundedPath(ctx, -sw / 2, -sh / 2, sw, sh, 10);
      const sg = ctx.createLinearGradient(0, -sh / 2, 0, sh / 2);
      sg.addColorStop(0, '#331c18');
      sg.addColorStop(1, '#1b0d0a');
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.18)';
      ctx.stroke();
      ctx.restore();
    }

    // Crepe incandescenti di magma nel basalto
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.34)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(48, 220);
    ctx.lineTo(94, 242);
    ctx.lineTo(132, 228);
    ctx.moveTo(310, 48);
    ctx.lineTo(342, 82);
    ctx.lineTo(330, 120);
    ctx.moveTo(220, 412);
    ctx.lineTo(266, 434);
    ctx.stroke();
  });

  registerCanvas(textures, 'decal_lava', 132, 88, (ctx) => {
    const g = ctx.createRadialGradient(66, 44, 8, 66, 44, 58);
    g.addColorStop(0, 'rgba(251, 191, 36, 0.65)');
    g.addColorStop(0.45, 'rgba(234, 88, 12, 0.48)');
    g.addColorStop(1, 'rgba(26, 11, 8, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(66, 44, 58, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  registerCanvas(textures, 'decal_ember_rune', 124, 92, (ctx) => {
    ctx.fillStyle = 'rgba(28, 13, 10, 0.72)';
    drawRoundedPath(ctx, 10, 12, 104, 68, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.55)';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(62, 46, 18, 0, Math.PI * 2);
    ctx.moveTo(62, 28);
    ctx.lineTo(74, 54);
    ctx.lineTo(50, 54);
    ctx.closePath();
    ctx.stroke();
  });

  registerCanvas(textures, 'decal_ash', 128, 68, (ctx) => {
    const g = ctx.createRadialGradient(64, 34, 6, 64, 34, 58);
    g.addColorStop(0, 'rgba(87, 83, 78, 0.5)');
    g.addColorStop(1, 'rgba(28, 25, 23, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(64, 34, 58, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  registerCanvas(textures, 'prop_obsidian', 112, 148, (ctx) => {
    const stone = ctx.createLinearGradient(20, 12, 92, 136);
    stone.addColorStop(0, '#44403c');
    stone.addColorStop(0.55, '#1c1917');
    stone.addColorStop(1, '#090d16');
    ctx.fillStyle = stone;
    ctx.beginPath();
    ctx.moveTo(56, 8);
    ctx.lineTo(94, 46);
    ctx.lineTo(86, 134);
    ctx.lineTo(22, 134);
    ctx.lineTo(18, 48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(56, 40);
    ctx.lineTo(48, 80);
    ctx.lineTo(66, 108);
    ctx.stroke();
  });

  registerCanvas(textures, 'prop_magma_spire', 132, 184, (ctx) => {
    const spire = ctx.createLinearGradient(34, 16, 98, 170);
    spire.addColorStop(0, '#57534e');
    spire.addColorStop(0.5, '#292524');
    spire.addColorStop(1, '#0c0a09');
    ctx.fillStyle = spire;
    ctx.beginPath();
    ctx.moveTo(66, 10);
    ctx.lineTo(106, 94);
    ctx.lineTo(96, 168);
    ctx.lineTo(34, 168);
    ctx.lineTo(26, 94);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    const glow = ctx.createRadialGradient(66, 96, 4, 66, 96, 44);
    glow.addColorStop(0, 'rgba(251, 146, 60, 0.78)');
    glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(66, 96, 44, 0, Math.PI * 2);
    ctx.fill();
  });

  // Nemici Muspelheim 4x multi-frame
  registerAnimated('enemy_muspel_swarm', 120, 136, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = '#1c1917';
    drawRoundedPath(ctx, 36 - stride * 0.4, 94 - stride * 0.7, 16, 34, 5);
    ctx.fill();
    drawRoundedPath(ctx, 68 + stride * 0.4, 94 + stride * 0.7, 16, 34, 5);
    ctx.fill();

    ctx.save();
    ctx.translate(0, bob);
    const body = ctx.createLinearGradient(32, 46, 88, 98);
    body.addColorStop(0, '#9a3412');
    body.addColorStop(0.55, '#431407');
    body.addColorStop(1, '#090d16');
    ctx.fillStyle = body;
    drawRoundedPath(ctx, 32, 48, 56, 50, 11);
    ctx.fill();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.ellipse(60, 32, 17, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    for (const [hx, dir] of [[44, -1], [76, 1]]) {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(hx, 24);
      ctx.quadraticCurveTo(hx + dir * 18, 12, hx + dir * 14, 3);
      ctx.lineTo(hx - dir * 2, 18);
      ctx.closePath();
      ctx.fill();
    }
    drawGlowEye(ctx, 53, 33, 2.8, '#fef08a', 'rgba(249, 115, 22, 0.98)');
    drawGlowEye(ctx, 67, 33, 2.8, '#fef08a', 'rgba(249, 115, 22, 0.98)');

    ctx.save();
    ctx.translate(93, 62);
    ctx.rotate(sway * 1.4);
    ctx.translate(-93, -62);
    ctx.fillStyle = '#fb923c';
    drawRoundedPath(ctx, 89, 34, 10, 44, 4);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  });

  registerAnimated('enemy_muspel_fast', 144, 112, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    for (const [lx, ly] of [[32 - stride * 0.8, 72], [53 + stride * 0.5, 74], [86 + stride * 0.9, 72]]) {
      ctx.fillStyle = '#431407';
      drawRoundedPath(ctx, lx, ly, 14, 31, 5);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(0, bob * 0.8);
    const fur = ctx.createLinearGradient(26, 34, 112, 80);
    fur.addColorStop(0, '#ea580c');
    fur.addColorStop(0.55, '#7c2d12');
    fur.addColorStop(1, '#1c1917');
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(67, 58, 39, 20, -0.06 + sway * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(85, 34);
    ctx.lineTo(100, 12);
    ctx.lineTo(134, 40);
    ctx.lineTo(126, 56);
    ctx.lineTo(92, 58);
    ctx.closePath();
    ctx.fill();
    drawGlowEye(ctx, 110, 37, 3.2, '#fef08a', 'rgba(249, 115, 22, 0.98)');
    ctx.restore();
  });

  registerAnimated('enemy_muspel_archer', 120, 136, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#1c1917';
    drawRoundedPath(ctx, 38 - stride * 0.4, 94 - stride * 0.65, 14, 34, 5);
    ctx.fill();
    drawRoundedPath(ctx, 68 + stride * 0.4, 94 + stride * 0.65, 14, 34, 5);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    const cloak = ctx.createLinearGradient(34, 42, 86, 114);
    cloak.addColorStop(0, '#c2410c');
    cloak.addColorStop(1, '#431407');
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(38, 44);
    ctx.lineTo(24, 112);
    ctx.quadraticCurveTo(60, 120, 96, 112);
    ctx.lineTo(82, 44);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.moveTo(38, 42);
    ctx.quadraticCurveTo(60, 4, 82, 42);
    ctx.closePath();
    ctx.fill();
    drawGlowEye(ctx, 53, 31, 2.7, '#fffbeb', 'rgba(251, 146, 60, 0.98)');
    drawGlowEye(ctx, 67, 31, 2.7, '#fffbeb', 'rgba(251, 146, 60, 0.98)');

    ctx.save();
    ctx.translate(92, 66);
    ctx.rotate(sway * 0.8);
    ctx.translate(-92, -66);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(92, 28);
    ctx.lineTo(92, 108);
    ctx.stroke();
    drawGlowEye(ctx, 92, 26, 5, '#fffbeb', 'rgba(249, 115, 22, 0.95)');
    ctx.restore();
    ctx.restore();
  });

  registerAnimated('enemy_muspel_berserker', 144, 160, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#1c1917';
    drawRoundedPath(ctx, 40 - stride * 0.5, 110 - stride * 0.85, 21, 40, 6);
    ctx.fill();
    drawRoundedPath(ctx, 82 + stride * 0.5, 110 + stride * 0.85, 21, 40, 6);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#7c2d12';
    drawRoundedPath(ctx, 36, 54, 72, 64, 15);
    ctx.fill();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = '#292524';
    drawRoundedPath(ctx, 50, 20, 44, 38, 12);
    ctx.fill();
    drawGlowEye(ctx, 63, 39, 3.2, '#fef08a', 'rgba(249, 115, 22, 1)');
    drawGlowEye(ctx, 81, 39, 3.2, '#fef08a', 'rgba(249, 115, 22, 1)');
    for (const [ax, dir] of [[24, -1], [120, 1]]) {
      ctx.save();
      ctx.translate(ax, 84);
      ctx.rotate(dir * sway * 1.5);
      ctx.translate(-ax, -84);
      ctx.fillStyle = '#fb923c';
      drawRoundedPath(ctx, ax - 5, 52, 14, 38, 4);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  });

  registerAnimated('enemy_muspel_tank', 168, 192, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#1c1917';
    drawRoundedPath(ctx, 42, 138 - stride * 0.65, 30, 44, 8);
    ctx.fill();
    drawRoundedPath(ctx, 96, 138 + stride * 0.65, 30, 44, 8);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob * 0.9);
    const armor = ctx.createLinearGradient(30, 50, 138, 150);
    armor.addColorStop(0, '#57534e');
    armor.addColorStop(0.5, '#292524');
    armor.addColorStop(1, '#0c0a09');
    ctx.fillStyle = armor;
    drawRoundedPath(ctx, 33, 56, 102, 90, 18);
    ctx.fill();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#292524';
    drawRoundedPath(ctx, 54, 18, 60, 44, 13);
    ctx.fill();
    drawGlowEye(ctx, 72, 40, 3.6, '#fef08a', 'rgba(249, 115, 22, 0.96)');
    drawGlowEye(ctx, 96, 40, 3.6, '#fef08a', 'rgba(249, 115, 22, 0.96)');
    ctx.fillStyle = '#44403c';
    drawRoundedPath(ctx, 8, 61 - stride * 0.25, 38, 70, 10);
    ctx.fill();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.save();
    ctx.translate(141, 76);
    ctx.rotate(sway * 1.1);
    ctx.translate(-141, -76);
    ctx.fillStyle = '#fb923c';
    drawRoundedPath(ctx, 135, 48, 22, 46, 6);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  });

  registerAnimated('enemy_muspel_elite', 184, 208, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    const aura = ctx.createRadialGradient(92, 104, 18, 92, 104, 86);
    aura.addColorStop(0, 'rgba(249, 115, 22, 0.34)');
    aura.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(92, 104, 86, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    drawRoundedPath(ctx, 48, 148 - stride * 0.7, 32, 50, 9);
    ctx.fill();
    drawRoundedPath(ctx, 104, 148 + stride * 0.7, 32, 50, 9);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#292524';
    drawRoundedPath(ctx, 36, 62, 112, 92, 20);
    ctx.fill();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 3;
    ctx.stroke();
    drawGlowEye(ctx, 92, 104, 11, '#fffbeb', 'rgba(249, 115, 22, 0.95)');
    ctx.fillStyle = '#1c1917';
    drawRoundedPath(ctx, 58, 22, 68, 46, 14);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    drawGlowEye(ctx, 78, 45, 4, '#fffbeb', 'rgba(251, 146, 60, 1)');
    drawGlowEye(ctx, 106, 45, 4, '#fffbeb', 'rgba(251, 146, 60, 1)');
    ctx.save();
    ctx.translate(154, 86);
    ctx.rotate(sway * 1.1);
    ctx.translate(-154, -86);
    ctx.fillStyle = '#fb923c';
    drawRoundedPath(ctx, 148, 26, 14, 120, 6);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  });

  // BOSS MUSPELHEIM: Surtr, Signore delle Braci (280x320)
  registerAnimated('boss_surtr', 280, 320, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const aura = ctx.createRadialGradient(140, 156, 30, 140, 156, 134);
    aura.addColorStop(0, 'rgba(249, 115, 22, 0.34)');
    aura.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(140, 156, 134, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    drawRoundedPath(ctx, 74, 224 - stride * 0.9, 48, 78, 13);
    ctx.fill();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    drawRoundedPath(ctx, 158, 224 + stride * 0.9, 48, 78, 13);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(0, bob * 1.1);

    const plate = ctx.createLinearGradient(54, 92, 226, 238);
    plate.addColorStop(0, '#44403c');
    plate.addColorStop(0.5, '#1c1917');
    plate.addColorStop(1, '#090d16');
    ctx.fillStyle = plate;
    drawRoundedPath(ctx, 58, 98, 164, 134, 28);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Nucleo lavico sul petto
    const core = ctx.createRadialGradient(140, 162, 6, 140, 162, 38);
    core.addColorStop(0, '#fffbeb');
    core.addColorStop(0.35, '#fbbf24');
    core.addColorStop(0.7, '#ea580c');
    core.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(140, 162, 38, 0, Math.PI * 2);
    ctx.fill();

    // Spallacci vulcanici & corna di fiamma
    const fireGrad = ctx.createLinearGradient(24, 52, 92, 132);
    fireGrad.addColorStop(0, '#fef08a');
    fireGrad.addColorStop(0.5, '#f97316');
    fireGrad.addColorStop(1, '#9a3412');
    ctx.fillStyle = fireGrad;
    for (const [cx, dir] of [[92, -1], [188, 1]]) {
      ctx.beginPath();
      ctx.moveTo(cx, 56);
      ctx.quadraticCurveTo(cx + dir * 40, 26, cx + dir * 32, 4);
      ctx.quadraticCurveTo(cx + dir * 10, 22, cx - dir * 10, 44);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.6;
      ctx.stroke();
    }

    ctx.fillStyle = '#1c1917';
    drawRoundedPath(ctx, 94, 37, 92, 70, 18);
    ctx.fill();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.8;
    ctx.stroke();
    drawGlowEye(ctx, 120, 69, 5.4, '#fffbeb', 'rgba(249, 115, 22, 0.98)');
    drawGlowEye(ctx, 160, 69, 5.4, '#fffbeb', 'rgba(249, 115, 22, 0.98)');

    // Spada colossale del crepuscolo di Surtr
    ctx.save();
    ctx.translate(242, 148);
    ctx.rotate(sway * 1.1);
    ctx.translate(-242, -148);
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.moveTo(242, 24);
    ctx.lineTo(264, 62);
    ctx.lineTo(256, 200);
    ctx.lineTo(228, 200);
    ctx.lineTo(220, 62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = '#44403c';
    drawRoundedPath(ctx, 214, 198, 56, 14, 5);
    ctx.fill();
    ctx.fillRect(236, 212, 12, 34);
    ctx.restore();

    ctx.restore();
  });

  registerCanvas(textures, 'fire_bolt', 64, 24, (ctx) => {
    const fg = ctx.createLinearGradient(6, 12, 60, 12);
    fg.addColorStop(0, '#ea580c');
    fg.addColorStop(0.55, '#fb923c');
    fg.addColorStop(1, '#fffbeb');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(60, 12);
    ctx.lineTo(18, 3);
    ctx.lineTo(24, 12);
    ctx.lineTo(18, 21);
    ctx.closePath();
    ctx.fill();
  });

  // ===========================================================================
  // 13. BIOMA HELHEIM (Terreno spettrale, decali, prop, nemici 4x, Hel)
  // ===========================================================================
  registerCanvas(textures, 'ground_tile_hel', 512, 512, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#070b11');
    bg.addColorStop(0.5, '#0c131c');
    bg.addColorStop(1, '#060a0f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const mistPatches = [
      [92, 82, 130, 0.12],
      [350, 118, 142, 0.11],
      [148, 330, 152, 0.12],
      [402, 382, 124, 0.12]
    ];
    for (const [fx, fy, fr, fa] of mistPatches) {
      const rg = ctx.createRadialGradient(fx, fy, 8, fx, fy, fr);
      rg.addColorStop(0, `rgba(16, 185, 129, ${fa})`);
      rg.addColorStop(0.6, `rgba(88, 28, 135, ${fa * 0.45})`);
      rg.addColorStop(1, 'rgba(7, 11, 17, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }

    const slabs = [
      [40, 44, 92, 60, -0.04],
      [268, 138, 108, 66, 0.03],
      [114, 354, 98, 62, 0.02],
      [364, 358, 92, 58, -0.05]
    ];
    for (const [sx, sy, sw, sh, rot] of slabs) {
      ctx.save();
      ctx.translate(sx + sw / 2, sy + sh / 2);
      ctx.rotate(rot);
      drawRoundedPath(ctx, -sw / 2, -sh / 2, sw, sh, 10);
      ctx.fillStyle = '#131d29';
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.18)';
      ctx.stroke();
      ctx.restore();
    }
  });

  registerCanvas(textures, 'decal_hel_rune', 128, 92, (ctx) => {
    ctx.fillStyle = 'rgba(10, 16, 23, 0.7)';
    drawRoundedPath(ctx, 10, 12, 108, 68, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(64, 46, 20, 0, Math.PI * 2);
    ctx.moveTo(52, 34);
    ctx.lineTo(76, 58);
    ctx.moveTo(76, 34);
    ctx.lineTo(52, 58);
    ctx.stroke();
  });

  registerCanvas(textures, 'decal_bones', 96, 84, (ctx) => {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(22, 24);
    ctx.lineTo(74, 58);
    ctx.moveTo(74, 24);
    ctx.lineTo(22, 58);
    ctx.stroke();
  });

  registerCanvas(textures, 'decal_mist', 132, 68, (ctx) => {
    const g = ctx.createRadialGradient(66, 34, 6, 66, 34, 60);
    g.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    g.addColorStop(1, 'rgba(10, 16, 23, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(66, 34, 60, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  registerCanvas(textures, 'prop_soul_brazier', 100, 118, (ctx) => {
    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 25, 64, 50, 45, 9);
    ctx.fill();
    ctx.fillStyle = '#334155';
    drawRoundedPath(ctx, 16, 50, 68, 18, 7);
    ctx.fill();
    const fg = ctx.createRadialGradient(50, 38, 4, 50, 38, 36);
    fg.addColorStop(0, '#a7f3d0');
    fg.addColorStop(0.5, '#10b981');
    fg.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(50, 38, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(50, 10);
    ctx.quadraticCurveTo(25, 38, 32, 52);
    ctx.lineTo(68, 52);
    ctx.quadraticCurveTo(75, 38, 50, 10);
    ctx.fill();
  });

  registerCanvas(textures, 'prop_hel_obelisk', 108, 144, (ctx) => {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(54, 8);
    ctx.lineTo(88, 38);
    ctx.lineTo(90, 130);
    ctx.lineTo(18, 130);
    ctx.lineTo(20, 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(54, 40);
    ctx.lineTo(54, 102);
    ctx.moveTo(38, 64);
    ctx.lineTo(70, 64);
    ctx.stroke();
  });

  registerCanvas(textures, 'prop_dead_tree', 144, 196, (ctx) => {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(72, 182);
    ctx.lineTo(72, 60);
    ctx.moveTo(72, 110);
    ctx.lineTo(32, 64);
    ctx.moveTo(72, 92);
    ctx.lineTo(112, 48);
    ctx.moveTo(72, 64);
    ctx.lineTo(54, 22);
    ctx.stroke();
  });

  // Nemici Helheim 4x multi-frame
  registerAnimated('enemy_hel_swarm', 120, 136, (ctx, frameIdx) => {
    const { stride, bob } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 36 - stride * 0.4, 94 - stride * 0.7, 16, 34, 5);
    ctx.fill();
    drawRoundedPath(ctx, 68 + stride * 0.4, 94 + stride * 0.7, 16, 34, 5);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    const body = ctx.createLinearGradient(32, 46, 88, 98);
    body.addColorStop(0, '#065f46');
    body.addColorStop(1, '#090d16');
    ctx.fillStyle = body;
    drawRoundedPath(ctx, 32, 48, 56, 50, 12);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(60, 32, 17, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    drawGlowEye(ctx, 53, 33, 2.8, '#ecfdf5', 'rgba(16, 185, 129, 0.98)');
    drawGlowEye(ctx, 67, 33, 2.8, '#ecfdf5', 'rgba(16, 185, 129, 0.98)');
    ctx.restore();
  });

  registerAnimated('enemy_hel_fast', 144, 112, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    for (const [lx, ly] of [[32 - stride * 0.8, 72], [53 + stride * 0.5, 74], [86 + stride * 0.9, 72]]) {
      ctx.fillStyle = '#0f172a';
      drawRoundedPath(ctx, lx, ly, 14, 31, 5);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(0, bob * 0.8);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(67, 58, 39, 20, -0.06 + sway * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.moveTo(85, 34);
    ctx.lineTo(100, 12);
    ctx.lineTo(134, 40);
    ctx.lineTo(126, 56);
    ctx.lineTo(92, 58);
    ctx.closePath();
    ctx.fill();
    drawGlowEye(ctx, 110, 37, 3.2, '#a7f3d0', 'rgba(16, 185, 129, 0.98)');
    ctx.restore();
  });

  registerAnimated('enemy_hel_archer', 120, 136, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 38 - stride * 0.4, 94 - stride * 0.65, 14, 34, 5);
    ctx.fill();
    drawRoundedPath(ctx, 68 + stride * 0.4, 94 + stride * 0.65, 14, 34, 5);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.moveTo(38, 44);
    ctx.lineTo(24, 112);
    ctx.quadraticCurveTo(60, 120, 96, 112);
    ctx.lineTo(82, 44);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#2e1065';
    ctx.beginPath();
    ctx.moveTo(38, 42);
    ctx.quadraticCurveTo(60, 4, 82, 42);
    ctx.closePath();
    ctx.fill();
    drawGlowEye(ctx, 53, 31, 2.7, '#faf5ff', 'rgba(168, 85, 247, 0.98)');
    drawGlowEye(ctx, 67, 31, 2.7, '#faf5ff', 'rgba(168, 85, 247, 0.98)');
    ctx.save();
    ctx.translate(92, 66);
    ctx.rotate(sway * 0.8);
    ctx.translate(-92, -66);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(92, 28);
    ctx.lineTo(92, 108);
    ctx.stroke();
    drawGlowEye(ctx, 92, 26, 5, '#ecfdf5', 'rgba(16, 185, 129, 0.95)');
    ctx.restore();
    ctx.restore();
  });

  registerAnimated('enemy_hel_berserker', 144, 160, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 40 - stride * 0.5, 110 - stride * 0.85, 21, 40, 6);
    ctx.fill();
    drawRoundedPath(ctx, 82 + stride * 0.5, 110 + stride * 0.85, 21, 40, 6);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#3b0764';
    drawRoundedPath(ctx, 36, 54, 72, 64, 15);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    drawRoundedPath(ctx, 50, 20, 44, 38, 12);
    ctx.fill();
    drawGlowEye(ctx, 63, 39, 3.2, '#ecfdf5', 'rgba(16, 185, 129, 1)');
    drawGlowEye(ctx, 81, 39, 3.2, '#ecfdf5', 'rgba(16, 185, 129, 1)');
    for (const [ax, dir] of [[24, -1], [120, 1]]) {
      ctx.save();
      ctx.translate(ax, 84);
      ctx.rotate(dir * sway * 1.5);
      ctx.translate(-ax, -84);
      ctx.fillStyle = '#a855f7';
      drawRoundedPath(ctx, ax - 5, 52, 14, 38, 4);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  });

  registerAnimated('enemy_hel_tank', 168, 192, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 42, 138 - stride * 0.65, 30, 44, 8);
    ctx.fill();
    drawRoundedPath(ctx, 96, 138 + stride * 0.65, 30, 44, 8);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob * 0.9);
    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 33, 56, 102, 90, 18);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    drawRoundedPath(ctx, 54, 18, 60, 44, 13);
    ctx.fill();
    drawGlowEye(ctx, 72, 40, 3.6, '#ecfdf5', 'rgba(16, 185, 129, 0.96)');
    drawGlowEye(ctx, 96, 40, 3.6, '#ecfdf5', 'rgba(16, 185, 129, 0.96)');
    ctx.fillStyle = '#334155';
    drawRoundedPath(ctx, 8, 61 - stride * 0.25, 38, 70, 10);
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.save();
    ctx.translate(141, 76);
    ctx.rotate(sway * 1.1);
    ctx.translate(-141, -76);
    ctx.fillStyle = '#34d399';
    drawRoundedPath(ctx, 135, 48, 22, 46, 6);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  });

  registerAnimated('enemy_hel_elite', 184, 208, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    const aura = ctx.createRadialGradient(92, 104, 18, 92, 104, 86);
    aura.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    aura.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(92, 104, 86, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 48, 148 - stride * 0.7, 32, 50, 9);
    ctx.fill();
    drawRoundedPath(ctx, 104, 148 + stride * 0.7, 32, 50, 9);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 36, 62, 112, 92, 20);
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.stroke();
    drawGlowEye(ctx, 92, 104, 11, '#ecfdf5', 'rgba(16, 185, 129, 0.95)');
    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 58, 22, 68, 46, 14);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    drawGlowEye(ctx, 78, 45, 4, '#ecfdf5', 'rgba(16, 185, 129, 1)');
    drawGlowEye(ctx, 106, 45, 4, '#ecfdf5', 'rgba(16, 185, 129, 1)');
    ctx.save();
    ctx.translate(154, 86);
    ctx.rotate(sway * 1.1);
    ctx.translate(-154, -86);
    ctx.fillStyle = '#c084fc';
    drawRoundedPath(ctx, 148, 26, 14, 120, 6);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  });

  // BOSS HELHEIM: Hel, Regina degli Abissi (280x320)
  registerAnimated('boss_hel', 280, 320, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    const aura = ctx.createRadialGradient(140, 156, 30, 140, 156, 134);
    aura.addColorStop(0, 'rgba(168, 85, 247, 0.28)');
    aura.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
    aura.addColorStop(1, 'rgba(10, 16, 23, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(140, 156, 134, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 78, 224 - stride * 0.8, 44, 76, 12);
    ctx.fill();
    drawRoundedPath(ctx, 158, 224 + stride * 0.8, 44, 76, 12);
    ctx.fill();

    ctx.save();
    ctx.translate(0, bob * 1.1);

    const robe = ctx.createLinearGradient(58, 92, 222, 242);
    robe.addColorStop(0, '#3b0764');
    robe.addColorStop(0.55, '#0f172a');
    robe.addColorStop(1, '#064e3b');
    ctx.fillStyle = robe;
    drawRoundedPath(ctx, 64, 96, 152, 138, 28);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Corona d'ossa e cristalli
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(94, 48);
    ctx.lineTo(80, 8);
    ctx.lineTo(114, 34);
    ctx.lineTo(140, 4);
    ctx.lineTo(166, 34);
    ctx.lineTo(200, 8);
    ctx.lineTo(186, 48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 98, 40, 84, 66, 18);
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    drawGlowEye(ctx, 122, 70, 5.2, '#ecfdf5', 'rgba(16, 185, 129, 0.98)');
    drawGlowEye(ctx, 158, 70, 5.2, '#faf5ff', 'rgba(168, 85, 247, 0.98)');

    // Anelli runici fluttuanti attorno alle mani
    ctx.save();
    ctx.translate(140, 162);
    ctx.rotate(sway * 1.4);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-84, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(84, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  registerCanvas(textures, 'shadow_bolt', 64, 24, (ctx) => {
    const sg = ctx.createLinearGradient(6, 12, 60, 12);
    sg.addColorStop(0, '#7e22ce');
    sg.addColorStop(0.55, '#a855f7');
    sg.addColorStop(1, '#a7f3d0');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(60, 12);
    ctx.lineTo(18, 3);
    ctx.lineTo(24, 12);
    ctx.lineTo(18, 21);
    ctx.closePath();
    ctx.fill();
  });

  // ===========================================================================
  // 14. NUOVE ARMI ESCLUSIVE — Proiettili HD 4x
  // ===========================================================================
  registerCanvas(textures, 'spear_proj', 96, 32, (ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // Asta dorata con incavo runico
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(8, 16);
    ctx.lineTo(66, 16);
    ctx.stroke();
    const shaft = ctx.createLinearGradient(8, 12, 66, 20);
    shaft.addColorStop(0, '#78350f');
    shaft.addColorStop(0.5, '#f59e0b');
    shaft.addColorStop(1, '#fde68a');
    ctx.strokeStyle = shaft;
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // Punta alata di Odino
    const tip = ctx.createLinearGradient(58, 5, 93, 27);
    tip.addColorStop(0, '#fbbf24');
    tip.addColorStop(0.5, '#f8fafc');
    tip.addColorStop(1, '#ffffff');
    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.moveTo(93, 16);
    ctx.lineTo(60, 5);
    ctx.lineTo(67, 16);
    ctx.lineTo(60, 27);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  registerCanvas(textures, 'scythe_proj', 84, 84, (ctx) => {
    ctx.lineJoin = 'round';
    const glow = ctx.createRadialGradient(42, 42, 4, 42, 42, 38);
    glow.addColorStop(0, 'rgba(232, 121, 249, 0.35)');
    glow.addColorStop(1, 'rgba(232, 121, 249, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(42, 42, 38, 0, Math.PI * 2);
    ctx.fill();

    const blade = ctx.createLinearGradient(12, 12, 72, 72);
    blade.addColorStop(0, '#fdf4ff');
    blade.addColorStop(0.5, '#e879f9');
    blade.addColorStop(1, '#581c87');
    ctx.fillStyle = blade;
    // Doppia mezzaluna rotante
    for (const rot of [0, Math.PI]) {
      ctx.save();
      ctx.translate(42, 42);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(-6, -34);
      ctx.quadraticCurveTo(36, -24, 34, 8);
      ctx.quadraticCurveTo(18, -14, -4, -18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(42, 42, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  registerCanvas(textures, 'fang_proj', 64, 36, (ctx) => {
    const fg = ctx.createLinearGradient(8, 18, 60, 18);
    fg.addColorStop(0, '#581c87');
    fg.addColorStop(0.55, '#c084fc');
    fg.addColorStop(1, '#ffffff');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(60, 18);
    ctx.lineTo(18, 6);
    ctx.lineTo(28, 18);
    ctx.lineTo(18, 30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  registerCanvas(textures, 'grimoire_proj', 88, 88, (ctx) => {
    const rg = ctx.createRadialGradient(44, 44, 4, 44, 44, 40);
    rg.addColorStop(0, '#ffffff');
    rg.addColorStop(0.35, '#38bdf8');
    rg.addColorStop(0.75, 'rgba(99, 102, 241, 0.5)');
    rg.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(44, 44, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(44, 44, 24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(44, 14);
    ctx.lineTo(68, 58);
    ctx.lineTo(20, 58);
    ctx.closePath();
    ctx.stroke();
  });

  registerCanvas(textures, 'flail_proj', 72, 72, (ctx) => {
    ctx.lineJoin = 'round';
    // Punte della sfera ferrata
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8;
      ctx.save();
      ctx.translate(36, 36);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(16, -5);
      ctx.lineTo(33, 0);
      ctx.lineTo(16, 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
    const ball = ctx.createRadialGradient(31, 31, 3, 36, 36, 20);
    ball.addColorStop(0, '#94a3b8');
    ball.addColorStop(0.55, '#334155');
    ball.addColorStop(1, '#090d16');
    ctx.fillStyle = ball;
    ctx.beginPath();
    ctx.arc(36, 36, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  });

  // ===========================================================================
  // 15. QUATTRO NUOVI ARCHETIPI NEMICI 4x PER TUTTI I 3 REGNI (12 set animati)
  // ===========================================================================
  const ARCHETYPE_PALETTES = [
    {
      suffix: '',
      robeTop: '#581c87', robeBot: '#1e1b4b', robeRim: '#c084fc', orbCore: '#f5d0fe', orbGlow: 'rgba(168, 85, 247, 0.96)',
      bomberBody: '#9a3412', bomberCore: '#fef08a', bomberGlow: 'rgba(249, 115, 22, 0.98)',
      shieldPlate: '#475569', shieldRim: '#7dd3fc', shieldArmor: '#334155',
      stalkerBody: '#312e81', stalkerTrim: '#e879f9', stalkerEye: 'rgba(232, 121, 249, 0.98)'
    },
    {
      suffix: '_muspel',
      robeTop: '#9a3412', robeBot: '#292524', robeRim: '#fb923c', orbCore: '#fffbeb', orbGlow: 'rgba(249, 115, 22, 0.98)',
      bomberBody: '#7f1d1d', bomberCore: '#fef08a', bomberGlow: 'rgba(239, 68, 68, 0.98)',
      shieldPlate: '#44403c', shieldRim: '#fb923c', shieldArmor: '#292524',
      stalkerBody: '#7c2d12', stalkerTrim: '#fbbf24', stalkerEye: 'rgba(251, 146, 60, 0.98)'
    },
    {
      suffix: '_hel',
      robeTop: '#065f46', robeBot: '#0f172a', robeRim: '#34d399', orbCore: '#ecfdf5', orbGlow: 'rgba(16, 185, 129, 0.98)',
      bomberBody: '#3b0764', bomberCore: '#d8b4fe', bomberGlow: 'rgba(168, 85, 247, 0.98)',
      shieldPlate: '#1e293b', shieldRim: '#34d399', shieldArmor: '#0f172a',
      stalkerBody: '#064e3b', stalkerTrim: '#a855f7', stalkerEye: 'rgba(52, 211, 153, 0.98)'
    },
    {
      suffix: '_asgard',
      robeTop: '#78350f', robeBot: '#1e1b4b', robeRim: '#fbbf24', orbCore: '#fef9c3', orbGlow: 'rgba(251, 191, 36, 0.98)',
      bomberBody: '#b45309', bomberCore: '#fef08a', bomberGlow: 'rgba(251, 191, 36, 0.98)',
      shieldPlate: '#475569', shieldRim: '#fbbf24', shieldArmor: '#1e293b',
      stalkerBody: '#312e81', stalkerTrim: '#fbbf24', stalkerEye: 'rgba(251, 191, 36, 0.98)'
    }
  ];

  for (const pal of ARCHETYPE_PALETTES) {
    const prefix = `enemy${pal.suffix}`;

    // A) Sciamano Runico (128x148)
    registerAnimated(`${prefix}_shaman`, 128, 148, (ctx, frameIdx) => {
      const { stride, bob, sway } = getFrameKinematics(frameIdx);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.save();
      ctx.translate(0, bob * 0.9);

      const robe = ctx.createLinearGradient(34, 48, 94, 134);
      robe.addColorStop(0, pal.robeTop);
      robe.addColorStop(0.65, pal.robeBot);
      robe.addColorStop(1, '#090d16');
      ctx.fillStyle = robe;
      ctx.beginPath();
      ctx.moveTo(40, 50);
      ctx.lineTo(24 + stride * 0.3, 130);
      ctx.quadraticCurveTo(64, 142, 104 + stride * 0.3, 130);
      ctx.lineTo(88, 50);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = pal.robeRim;
      ctx.lineWidth = 2;
      ctx.stroke();

      for (const [hx, dir] of [[44, -1], [84, 1]]) {
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(hx, 30);
        ctx.quadraticCurveTo(hx + dir * 22, 18, hx + dir * 18, 4);
        ctx.lineTo(hx - dir * 3, 22);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = pal.robeBot;
      ctx.beginPath();
      ctx.moveTo(40, 48);
      ctx.quadraticCurveTo(64, 8, 88, 48);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal.robeRim;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      drawGlowEye(ctx, 56, 35, 2.9, pal.orbCore, pal.orbGlow);
      drawGlowEye(ctx, 72, 35, 2.9, pal.orbCore, pal.orbGlow);

      ctx.save();
      ctx.translate(104, 78);
      ctx.rotate(sway * 1.1);
      ctx.translate(-104, -78);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(104, 34);
      ctx.lineTo(104, 132);
      ctx.stroke();
      drawGlowEye(ctx, 104, 24, 6.2, pal.orbCore, pal.orbGlow);
      ctx.restore();
      ctx.restore();
    });

    // B) Portatore Esplosivo (124x140)
    registerAnimated(`${prefix}_bomber`, 124, 140, (ctx, frameIdx) => {
      const { stride, bob, sway } = getFrameKinematics(frameIdx);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.fillStyle = '#0f172a';
      drawRoundedPath(ctx, 36 - stride * 0.45, 96 - stride * 0.7, 17, 34, 5);
      ctx.fill();
      drawRoundedPath(ctx, 70 + stride * 0.45, 96 + stride * 0.7, 17, 34, 5);
      ctx.fill();

      ctx.save();
      ctx.translate(0, bob);

      ctx.fillStyle = '#292524';
      drawRoundedPath(ctx, 32, 50, 60, 52, 15);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3;
      ctx.stroke();

      const bombGrad = ctx.createRadialGradient(62, 76, 4, 62, 76, 28);
      bombGrad.addColorStop(0, pal.bomberCore);
      bombGrad.addColorStop(0.5, pal.bomberBody);
      bombGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bombGrad;
      ctx.beginPath();
      ctx.arc(62, 76, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pal.bomberBody;
      ctx.beginPath();
      ctx.arc(62, 76, 17 + (frameIdx % 2) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.bomberCore;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.ellipse(62, 34, 16, 15, sway * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      drawGlowEye(ctx, 55, 34, 2.8, pal.bomberCore, pal.bomberGlow);
      drawGlowEye(ctx, 69, 34, 2.8, pal.bomberCore, pal.bomberGlow);
      drawGlowEye(ctx, 62, 12, 4.2, '#ffffff', pal.bomberGlow);
      ctx.restore();
    });

    // C) Scudiero Corazzato (152x176)
    registerAnimated(`${prefix}_shieldbearer`, 152, 176, (ctx, frameIdx) => {
      const { stride, bob, sway } = getFrameKinematics(frameIdx);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.fillStyle = '#0f172a';
      drawRoundedPath(ctx, 42, 126 - stride * 0.55, 24, 38, 7);
      ctx.fill();
      drawRoundedPath(ctx, 86, 126 + stride * 0.55, 24, 38, 7);
      ctx.fill();

      ctx.save();
      ctx.translate(0, bob * 0.8);

      ctx.fillStyle = pal.shieldArmor;
      drawRoundedPath(ctx, 38, 52, 78, 78, 15);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = pal.shieldPlate;
      drawRoundedPath(ctx, 52, 16, 48, 40, 12);
      ctx.fill();
      ctx.strokeStyle = pal.shieldRim;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      drawGlowEye(ctx, 67, 36, 2.8, '#ffffff', pal.shieldRim);
      drawGlowEye(ctx, 85, 36, 2.8, '#ffffff', pal.shieldRim);

      ctx.save();
      ctx.translate(128, 78);
      ctx.rotate(sway * 1.1);
      ctx.translate(-128, -78);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(128, 22);
      ctx.lineTo(128, 134);
      ctx.stroke();
      ctx.restore();

      const sg = ctx.createLinearGradient(14, 52, 78, 146);
      sg.addColorStop(0, '#94a3b8');
      sg.addColorStop(0.45, pal.shieldPlate);
      sg.addColorStop(1, '#090d16');
      ctx.fillStyle = sg;
      drawRoundedPath(ctx, 16, 54 - stride * 0.2, 62, 92, 12);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3.2;
      ctx.stroke();
      ctx.strokeStyle = pal.shieldRim;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      drawArmorBevel(ctx, 16, 54 - stride * 0.2, 62, 92, 12, 'rgba(255,255,255,0.45)');
      drawRivets(ctx, [[26, 66], [68, 66], [26, 132], [68, 132]], 2.4, pal.shieldRim);

      ctx.restore();
    });

    // D) Ombra Guizzante (132x144)
    registerAnimated(`${prefix}_stalker`, 132, 144, (ctx, frameIdx) => {
      const { stride, bob, sway } = getFrameKinematics(frameIdx);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.fillStyle = pal.stalkerBody;
      ctx.beginPath();
      ctx.moveTo(46, 54 + bob);
      ctx.quadraticCurveTo(10, 86 + stride * 0.8, 18 + stride, 130);
      ctx.lineTo(54, 108 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal.stalkerTrim;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = '#090d16';
      drawRoundedPath(ctx, 42 - stride * 0.7, 94 - stride * 0.5, 16, 36, 5);
      ctx.fill();
      drawRoundedPath(ctx, 74 + stride * 0.7, 94 + stride * 0.5, 16, 36, 5);
      ctx.fill();

      ctx.save();
      ctx.translate(0, bob * 0.9);
      ctx.fillStyle = pal.stalkerBody;
      ctx.beginPath();
      ctx.ellipse(66, 70, 26, 28, sway * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.stalkerTrim;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(44, 48);
      ctx.quadraticCurveTo(66, 12, 88, 48);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal.stalkerTrim;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawGlowEye(ctx, 59, 38, 3.1, '#ffffff', pal.stalkerEye);
      drawGlowEye(ctx, 75, 38, 3.1, '#ffffff', pal.stalkerEye);

      for (const [cx, dir] of [[30, -1], [102, 1]]) {
        ctx.strokeStyle = pal.stalkerTrim;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, 72);
        ctx.quadraticCurveTo(cx + dir * 20, 86, cx + dir * 12, 106);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // ===========================================================================
  // 16. BIOMA 4° REGNO: ASGARD IN ROVINE (Bifrost, Einherjar, Loki & Odino)
  // ===========================================================================
  registerCanvas(textures, 'ground_tile_asgard', 512, 512, (ctx) => {
    ctx.fillStyle = '#121022';
    ctx.fillRect(0, 0, 512, 512);

    // Lastre di marmo scuro e venature d'oro spezzate
    for (let i = 0; i < 6; i++) {
      const gx = (i % 3) * 172 + 12;
      const gy = Math.floor(i / 3) * 256 + 18;
      ctx.fillStyle = '#1d1935';
      drawRoundedPath(ctx, gx, gy, 148, 198, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.16)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Venature astrali del Bifrost
    const bifrost = ctx.createLinearGradient(0, 120, 512, 390);
    bifrost.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
    bifrost.addColorStop(0.5, 'rgba(251, 191, 36, 0.11)');
    bifrost.addColorStop(1, 'rgba(168, 85, 247, 0.08)');
    ctx.fillStyle = bifrost;
    ctx.fillRect(0, 190, 512, 92);

    ctx.strokeStyle = 'rgba(253, 224, 71, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(42, 88);
    ctx.lineTo(138, 142);
    ctx.lineTo(226, 118);
    ctx.moveTo(310, 340);
    ctx.lineTo(425, 390);
    ctx.stroke();
  });

  registerCanvas(textures, 'decal_bifrost', 144, 108, (ctx) => {
    const g = ctx.createLinearGradient(10, 10, 134, 98);
    g.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    g.addColorStop(0.5, 'rgba(251, 191, 36, 0.35)');
    g.addColorStop(1, 'rgba(192, 132, 252, 0.35)');
    ctx.fillStyle = g;
    drawRoundedPath(ctx, 12, 16, 120, 76, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  });

  registerCanvas(textures, 'decal_asgard_gold', 96, 96, (ctx) => {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(48, 48, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(48, 14);
    ctx.lineTo(48, 82);
    ctx.moveTo(24, 48);
    ctx.lineTo(72, 48);
    ctx.stroke();
  });

  registerCanvas(textures, 'decal_shattered_marble', 136, 72, (ctx) => {
    ctx.fillStyle = 'rgba(71, 85, 105, 0.55)';
    ctx.beginPath();
    ctx.ellipse(68, 36, 56, 22, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  registerCanvas(textures, 'prop_bifrost_pillar', 112, 148, (ctx) => {
    ctx.lineJoin = 'round';
    const colG = ctx.createLinearGradient(26, 20, 86, 136);
    colG.addColorStop(0, '#64748b');
    colG.addColorStop(0.5, '#334155');
    colG.addColorStop(1, '#1e293b');
    ctx.fillStyle = colG;
    drawRoundedPath(ctx, 28, 30, 56, 106, 8);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    drawRoundedPath(ctx, 20, 22, 72, 14, 5);
    ctx.fill();
    drawGlowEye(ctx, 56, 80, 6, '#fef9c3', 'rgba(251, 191, 36, 0.95)');
  });

  registerCanvas(textures, 'prop_asgard_brazier', 96, 114, (ctx) => {
    ctx.fillStyle = '#334155';
    drawRoundedPath(ctx, 22, 56, 52, 46, 8);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();
    const flame = ctx.createRadialGradient(48, 38, 4, 48, 42, 30);
    flame.addColorStop(0, '#ffffff');
    flame.addColorStop(0.45, '#fbbf24');
    flame.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.arc(48, 40, 30, 0, Math.PI * 2);
    ctx.fill();
  });

  registerAnimated('enemy_asgard_swarm', 120, 136, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 36 - stride * 0.5, 96 - stride * 0.8, 18, 32, 5);
    ctx.fill();
    drawRoundedPath(ctx, 66 + stride * 0.5, 96 + stride * 0.8, 18, 32, 5);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#334155';
    drawRoundedPath(ctx, 32, 50, 56, 52, 12);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = '#475569';
    drawRoundedPath(ctx, 38, 16, 44, 38, 11);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();
    drawGlowEye(ctx, 52, 34, 2.8, '#fef9c3', 'rgba(251, 191, 36, 0.95)');
    drawGlowEye(ctx, 68, 34, 2.8, '#fef9c3', 'rgba(251, 191, 36, 0.95)');
    ctx.save();
    ctx.translate(98, 72);
    ctx.rotate(sway);
    ctx.translate(-98, -72);
    ctx.fillStyle = '#e2e8f0';
    drawRoundedPath(ctx, 94, 34, 10, 44, 3);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  });

  registerAnimated('enemy_asgard_fast', 144, 112, (ctx, frameIdx) => {
    const { stride, bob } = getFrameKinematics(frameIdx);
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.ellipse(72, 56, 44, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    // Ali spettrali da corvo
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.moveTo(64, 48);
    ctx.quadraticCurveTo(22, 12 - stride * 1.4, 12, 46);
    ctx.lineTo(54, 60);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(80, 48);
    ctx.quadraticCurveTo(122, 12 + stride * 1.4, 132, 46);
    ctx.lineTo(90, 60);
    ctx.closePath();
    ctx.fill();
    drawGlowEye(ctx, 102, 52, 3, '#fef08a', 'rgba(251, 191, 36, 0.98)');
    ctx.restore();
  });

  registerAnimated('enemy_asgard_archer', 120, 136, (ctx, frameIdx) => {
    const { stride, bob } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 38, 96 - stride * 0.5, 16, 32, 5);
    ctx.fill();
    drawRoundedPath(ctx, 66, 96 + stride * 0.5, 16, 32, 5);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#78350f';
    drawRoundedPath(ctx, 34, 50, 52, 52, 12);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = '#d97706';
    drawRoundedPath(ctx, 40, 16, 40, 36, 10);
    ctx.fill();
    drawGlowEye(ctx, 53, 34, 2.8, '#fffbeb', 'rgba(251, 191, 36, 0.98)');
    drawGlowEye(ctx, 67, 34, 2.8, '#fffbeb', 'rgba(251, 191, 36, 0.98)');
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(92, 66, 26, -1.1, 1.1);
    ctx.stroke();
    ctx.restore();
  });

  registerAnimated('enemy_asgard_berserker', 144, 160, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#1e1b4b';
    drawRoundedPath(ctx, 40 - stride * 0.5, 110 - stride * 0.8, 21, 40, 6);
    ctx.fill();
    drawRoundedPath(ctx, 82 + stride * 0.5, 110 + stride * 0.8, 21, 40, 6);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#92400e';
    drawRoundedPath(ctx, 36, 54, 72, 64, 15);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    drawRoundedPath(ctx, 50, 20, 44, 38, 12);
    ctx.fill();
    drawGlowEye(ctx, 63, 39, 3.2, '#ffffff', 'rgba(251, 191, 36, 1)');
    drawGlowEye(ctx, 81, 39, 3.2, '#ffffff', 'rgba(251, 191, 36, 1)');
    for (const [ax, dir] of [[24, -1], [120, 1]]) {
      ctx.save();
      ctx.translate(ax, 84);
      ctx.rotate(dir * sway * 1.4);
      ctx.translate(-ax, -84);
      ctx.fillStyle = '#fde047';
      drawRoundedPath(ctx, ax - 5, 52, 14, 38, 4);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  });

  registerAnimated('enemy_asgard_tank', 168, 192, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 42, 138 - stride * 0.65, 30, 44, 8);
    ctx.fill();
    drawRoundedPath(ctx, 96, 138 + stride * 0.65, 30, 44, 8);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob * 0.9);
    ctx.fillStyle = '#334155';
    drawRoundedPath(ctx, 33, 56, 102, 90, 18);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    drawRoundedPath(ctx, 54, 18, 60, 44, 13);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();
    drawGlowEye(ctx, 72, 40, 3.6, '#fef9c3', 'rgba(251, 191, 36, 0.98)');
    drawGlowEye(ctx, 96, 40, 3.6, '#fef9c3', 'rgba(251, 191, 36, 0.98)');
    ctx.save();
    ctx.translate(141, 76);
    ctx.rotate(sway * 1.1);
    ctx.translate(-141, -76);
    ctx.fillStyle = '#fbbf24';
    drawRoundedPath(ctx, 135, 48, 22, 46, 6);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  });

  registerAnimated('enemy_asgard_elite', 184, 208, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    const aura = ctx.createRadialGradient(92, 104, 18, 92, 104, 86);
    aura.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
    aura.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(92, 104, 86, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 48, 148 - stride * 0.7, 32, 50, 9);
    ctx.fill();
    drawRoundedPath(ctx, 104, 148 + stride * 0.7, 32, 50, 9);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#475569';
    drawRoundedPath(ctx, 36, 62, 112, 92, 20);
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3.2;
    ctx.stroke();
    drawGlowEye(ctx, 92, 104, 11, '#fffbeb', 'rgba(251, 191, 36, 0.98)');
    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 58, 22, 68, 46, 14);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();
    drawGlowEye(ctx, 78, 45, 4, '#fffbeb', 'rgba(251, 191, 36, 1)');
    drawGlowEye(ctx, 106, 45, 4, '#fffbeb', 'rgba(251, 191, 36, 1)');
    ctx.save();
    ctx.translate(154, 86);
    ctx.rotate(sway * 1.1);
    ctx.translate(-154, -86);
    ctx.fillStyle = '#fbbf24';
    drawRoundedPath(ctx, 148, 22, 14, 126, 6);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  });

  // BOSS ASGARD FASE 1: Loki, l'Ingannatore (280x320)
  registerAnimated('boss_loki', 280, 320, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    const aura = ctx.createRadialGradient(140, 156, 26, 140, 156, 132);
    aura.addColorStop(0, 'rgba(16, 185, 129, 0.34)');
    aura.addColorStop(0.55, 'rgba(251, 191, 36, 0.2)');
    aura.addColorStop(1, 'rgba(17, 15, 29, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(140, 156, 132, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 82, 224 - stride * 0.85, 40, 76, 12);
    ctx.fill();
    drawRoundedPath(ctx, 158, 224 + stride * 0.85, 40, 76, 12);
    ctx.fill();

    ctx.save();
    ctx.translate(0, bob * 1.05);

    // Mantello smeraldo e nero
    const cloak = ctx.createLinearGradient(58, 92, 222, 240);
    cloak.addColorStop(0, '#065f46');
    cloak.addColorStop(0.55, '#064e3b');
    cloak.addColorStop(1, '#090d16');
    ctx.fillStyle = cloak;
    drawRoundedPath(ctx, 64, 96, 152, 138, 26);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Corna dorate curve di Loki
    for (const [hx, dir] of [[106, -1], [174, 1]]) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(hx, 48);
      ctx.quadraticCurveTo(hx + dir * 48, 22, hx + dir * 32, 4);
      ctx.lineTo(hx + dir * 10, 32);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }

    // Volto & elmo d'inganno
    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 98, 42, 84, 62, 16);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    drawGlowEye(ctx, 122, 70, 4.8, '#ecfdf5', 'rgba(52, 211, 153, 0.98)');
    drawGlowEye(ctx, 158, 70, 4.8, '#ecfdf5', 'rgba(52, 211, 153, 0.98)');

    // Scettro runico smeraldo rotante
    ctx.save();
    ctx.translate(226, 156);
    ctx.rotate(sway * 1.15);
    ctx.translate(-226, -156);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(226, 48);
    ctx.lineTo(226, 260);
    ctx.stroke();
    drawGlowEye(ctx, 226, 42, 13, '#ecfdf5', 'rgba(16, 185, 129, 0.98)');
    ctx.restore();
    ctx.restore();
  });

  // BOSS ASGARD TRASFORMAZIONE: Odino, il Padre Caduto (280x320)
  registerAnimated('boss_odin', 280, 320, (ctx, frameIdx) => {
    const { stride, bob, sway } = getFrameKinematics(frameIdx);
    const aura = ctx.createRadialGradient(140, 156, 34, 140, 156, 136);
    aura.addColorStop(0, 'rgba(251, 191, 36, 0.42)');
    aura.addColorStop(0.55, 'rgba(56, 189, 248, 0.24)');
    aura.addColorStop(1, 'rgba(17, 15, 29, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(140, 156, 136, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 78, 222 - stride * 0.75, 46, 78, 12);
    ctx.fill();
    drawRoundedPath(ctx, 156, 222 + stride * 0.75, 46, 78, 12);
    ctx.fill();

    ctx.save();
    ctx.translate(0, bob);

    // Mantello reale blu-notte & corazza d'oro e ossidiana
    const cloak = ctx.createLinearGradient(52, 88, 228, 244);
    cloak.addColorStop(0, '#1e1b4b');
    cloak.addColorStop(0.5, '#334155');
    cloak.addColorStop(1, '#78350f');
    ctx.fillStyle = cloak;
    drawRoundedPath(ctx, 56, 92, 168, 144, 28);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.6;
    ctx.stroke();

    // Spallacci alati reali
    drawShoulderPlate(ctx, 40, 92, 48, 36, '#fbbf24');
    drawShoulderPlate(ctx, 192, 92, 48, 36, '#fbbf24');

    // Corona & elmo alato + un solo occhio brillante (Huginn/Muninn glow)
    ctx.fillStyle = '#1e293b';
    drawRoundedPath(ctx, 94, 34, 92, 68, 18);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    drawRoundedPath(ctx, 114, 74, 52, 34, 12);
    ctx.fill();
    drawGlowEye(ctx, 154, 58, 6.2, '#ffffff', 'rgba(251, 191, 36, 0.98)');

    // Gungnir la Lancia Eterna
    ctx.save();
    ctx.translate(232, 152);
    ctx.rotate(sway * 1.1);
    ctx.translate(-232, -152);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(232, 28);
    ctx.lineTo(232, 278);
    ctx.stroke();
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.moveTo(232, 4);
    ctx.lineTo(214, 42);
    ctx.lineTo(250, 42);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
  });

  registerCanvas(textures, 'loki_bolt', 64, 24, (ctx) => {
    const lg = ctx.createLinearGradient(6, 12, 60, 12);
    lg.addColorStop(0, '#065f46');
    lg.addColorStop(0.55, '#34d399');
    lg.addColorStop(1, '#fef9c3');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(60, 12);
    ctx.lineTo(18, 3);
    ctx.lineTo(26, 12);
    ctx.lineTo(18, 21);
    ctx.closePath();
    ctx.fill();
  });

  registerCanvas(textures, 'astral_spear', 72, 26, (ctx) => {
    const ag = ctx.createLinearGradient(6, 13, 68, 13);
    ag.addColorStop(0, '#92400e');
    ag.addColorStop(0.55, '#fbbf24');
    ag.addColorStop(1, '#ffffff');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.moveTo(68, 13);
    ctx.lineTo(20, 4);
    ctx.lineTo(28, 13);
    ctx.lineTo(20, 22);
    ctx.closePath();
    ctx.fill();
  });
}
