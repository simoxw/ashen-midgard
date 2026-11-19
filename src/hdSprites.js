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

  // 3. EROE 1: Astrid la Valchiria — Vettoriale 4x Super Dettagliata (144x168)
  registerCanvas(textures, 'hero_warrior', 144, 168, (ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Mantello cremisi scolpito con pieghe profonde e bordo ricamato oro
    const cloak = ctx.createLinearGradient(72, 50, 72, 152);
    cloak.addColorStop(0, '#b91c1c');
    cloak.addColorStop(0.45, '#7f1d1d');
    cloak.addColorStop(1, '#3b0712');
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(36, 56);
    ctx.bezierCurveTo(18, 96, 16, 128, 22, 146);
    ctx.quadraticCurveTo(72, 160, 120, 144);
    ctx.bezierCurveTo(124, 122, 118, 92, 106, 56);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Bordo oro e pieghe interne del mantello
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(24, 5, 8, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(46, 86);
    ctx.quadraticCurveTo(40, 122, 42, 148);
    ctx.moveTo(96, 86);
    ctx.quadraticCurveTo(100, 120, 98, 146);
    ctx.stroke();

    // Stivali corazzati con gambali in ferro e fibbie
    const drawBoot = (bx) => {
      const bg = ctx.createLinearGradient(bx, 112, bx + 22, 158);
      bg.addColorStop(0, '#475569');
      bg.addColorStop(0.5, '#1e293b');
      bg.addColorStop(1, '#090d16');
      ctx.fillStyle = bg;
      drawRoundedPath(ctx, bx, 112, 22, 44, 7);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      // Ginocchiera metallica
      ctx.fillStyle = '#94a3b8';
      drawRoundedPath(ctx, bx + 2, 114, 18, 10, 4);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.fillRect(bx + 2, 134, 18, 4);
    };
    drawBoot(42);
    drawBoot(78);

    // Corazza in acciaio temperato con riflesso verticale e stemma norreno
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
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Rim light sul pettorale + intarsio V oro
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(52, 65);
    ctx.lineTo(71, 86);
    ctx.lineTo(90, 65);
    ctx.stroke();
    drawRivets(ctx, [[48, 66], [94, 66], [48, 94], [94, 94]], 2.1);

    // Scarsella & Cintura runica borchiata
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

    // Fibbia runica centrale
    ctx.fillStyle = '#fef3c7';
    drawRoundedPath(ctx, 63, 96, 16, 17, 4);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Spallacci con pelliccia nordica e borchie dorate
    const drawPauldron = (px, dir) => {
      ctx.save();
      ctx.translate(px, 63);
      ctx.rotate(dir * 0.24);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Placchetta ferro + umbone oro
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

    // Trecce biondo oro dietro il viso
    const hair = ctx.createLinearGradient(44, 34, 98, 76);
    hair.addColorStop(0, '#fbbf24');
    hair.addColorStop(1, '#b45309');
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(46, 54, 7.5, 21, 0.22, 0, Math.PI * 2);
    ctx.ellipse(98, 54, 7.5, 21, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Volto scolpito
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

    // Occhi azzurri luminosi
    drawGlowEye(ctx, 64, 47, 2.8, '#f0f9ff', 'rgba(56, 189, 248, 0.85)');
    drawGlowEye(ctx, 80, 47, 2.8, '#f0f9ff', 'rgba(56, 189, 248, 0.85)');

    // Elmo Alato da Valchiria con cresta oro e nasale
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

    // Bordo corona elmo oro
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(72, 36, 19.5, Math.PI * 1.06, -Math.PI * 0.06);
    ctx.stroke();

    // Ali scolpite d'argento
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

    // Ascia Runica nella mano destra con lama incisa
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

    // Filo luminoso + Runa incisa sulla lama
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(136, 34);
    ctx.quadraticCurveTo(140, 48, 134, 62);
    ctx.stroke();
  });

  // 4. EROE 2: Skadi l'Assassina d'Ombra — Vettoriale 4x Super Dettagliata (144x168)
  registerCanvas(textures, 'hero_assassin', 144, 168, (ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Mantello ombra violaceo multi-punta
    const cloak = ctx.createLinearGradient(72, 46, 72, 158);
    cloak.addColorStop(0, '#6b21a8');
    cloak.addColorStop(0.55, '#2e1065');
    cloak.addColorStop(1, '#090d16');
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(40, 54);
    ctx.quadraticCurveTo(16, 102, 18, 150);
    ctx.lineTo(44, 136);
    ctx.lineTo(72, 156);
    ctx.lineTo(100, 136);
    ctx.lineTo(126, 150);
    ctx.quadraticCurveTo(124, 102, 102, 54);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(232, 121, 249, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Stivali agili con fasce di cuoio
    const drawBoot = (bx) => {
      ctx.fillStyle = '#0f172a';
      drawRoundedPath(ctx, bx, 108, 18, 48, 6);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + 2, 122);
      ctx.lineTo(bx + 16, 126);
      ctx.moveTo(bx + 2, 132);
      ctx.lineTo(bx + 16, 136);
      ctx.stroke();
    };
    drawBoot(46);
    drawBoot(78);

    // Corpetto in pelle d'ossidiana + bandoliera diagonale con coltelli
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

    // Bandoliera diagonale in cuoio & pugnali da lancio
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(49, 64);
    ctx.lineTo(94, 100);
    ctx.stroke();
    drawRivets(ctx, [[58, 71], [72, 82], [85, 92]], 2, '#e879f9');

    // Sciarpa / Fascia runica magenta svolazzante
    const sash = ctx.createLinearGradient(44, 94, 100, 134);
    sash.addColorStop(0, '#f0abfc');
    sash.addColorStop(0.5, '#d946ef');
    sash.addColorStop(1, '#701a75');
    ctx.fillStyle = sash;
    drawRoundedPath(ctx, 45, 93, 54, 10, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(85, 99);
    ctx.lineTo(104, 134);
    ctx.lineTo(88, 128);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Volto + Maschera + Occhi violetti brillanti
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(72, 43, 17, 18.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Maschera inferiore
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

    // Cappuccio appuntito con cuciture e rim magenta
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

    // Doppi Pugnali d'Ombra ricurvi con filo brillante
    const drawDagger = (hx, hy, tx, ty, cx, cy) => {
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
    };
    drawDagger(38, 88, 7, 62, 18, 80);
    drawDagger(106, 88, 137, 62, 126, 80);
  });

  // 5. EROE 3: Freya la Maga delle Rune — Vettoriale 4x Super Dettagliata (144x168)
  registerCanvas(textures, 'hero_mage', 144, 168, (ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Veste astrale lunga con bordo ghiaccio luminoso
    const robe = ctx.createLinearGradient(72, 56, 72, 158);
    robe.addColorStop(0, '#0284c7');
    robe.addColorStop(0.5, '#0c4a6e');
    robe.addColorStop(1, '#082f49');
    ctx.fillStyle = robe;
    ctx.beginPath();
    ctx.moveTo(45, 58);
    ctx.bezierCurveTo(30, 102, 28, 132, 28, 152);
    ctx.quadraticCurveTo(72, 163, 116, 152);
    ctx.bezierCurveTo(116, 132, 114, 102, 99, 58);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Stola centrale dorata con simbolo runico inciso
    const stole = ctx.createLinearGradient(62, 62, 82, 154);
    stole.addColorStop(0, '#fde68a');
    stole.addColorStop(0.45, '#f59e0b');
    stole.addColorStop(1, '#92400e');
    ctx.fillStyle = stole;
    drawRoundedPath(ctx, 62, 64, 20, 88, 5);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Runa sulla stola
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(72, 92);
    ctx.lineTo(72, 126);
    ctx.moveTo(65, 102);
    ctx.lineTo(79, 112);
    ctx.lineTo(65, 120);
    ctx.stroke();

    // Mantellina arcana sulle spalle
    const mantle = ctx.createLinearGradient(32, 56, 112, 80);
    mantle.addColorStop(0, '#0ea5e9');
    mantle.addColorStop(1, '#0369a1');
    ctx.fillStyle = mantle;
    ctx.beginPath();
    ctx.moveTo(34, 69);
    ctx.quadraticCurveTo(72, 50, 110, 69);
    ctx.quadraticCurveTo(72, 84, 34, 69);
    ctx.fill();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chioma argentea fluente con ciocche
    const hair = ctx.createLinearGradient(42, 20, 102, 88);
    hair.addColorStop(0, '#ffffff');
    hair.addColorStop(0.55, '#cbd5e1');
    hair.addColorStop(1, '#64748b');
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(72, 48, 27, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Volto
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(72, 44, 17, 18.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawGlowEye(ctx, 64, 44, 2.8, '#f0f9ff', 'rgba(56, 189, 248, 0.95)');
    drawGlowEye(ctx, 80, 44, 2.8, '#f0f9ff', 'rgba(56, 189, 248, 0.95)');

    // Diadema d'oro con gemma del gelo
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(72, 39, 17, Math.PI * 1.15, -Math.PI * 0.15);
    ctx.stroke();
    drawGlowEye(ctx, 72, 23, 4.2, '#ffffff', 'rgba(56, 189, 248, 0.98)');

    // Bastone runico + cristallo sfaccettato levitante + doppio anello dorato
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

    // Cristallo centrale sfaccettato
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
    ctx.ellipse(118, 28, 17, 6.5, -0.45, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 6. NEMICO SWARM: Draugr del Gelo — Vettoriale 4x (120x136)
  registerCanvas(textures, 'enemy_swarm', 120, 136, (ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Stivali logori
    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 36, 94, 16, 34, 5);
    ctx.fill();
    drawRoundedPath(ctx, 68, 94, 16, 34, 5);
    ctx.fill();

    // Torso con maglia di ferro ossidata e piastre glaciali
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

    // Costole & rune spettrali
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(42, 64);
    ctx.lineTo(78, 64);
    ctx.moveTo(46, 76);
    ctx.lineTo(74, 76);
    ctx.stroke();

    // Teschio / Viso cadaverico + Elmo cornuto
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(60, 32, 17, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Corna curve sull'elmo
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

    // Spada antica scheggiata con guardia in ferro
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
    // Guardia trasversale
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(82, 68);
    ctx.lineTo(98, 74);
    ctx.stroke();
  });

  // 7. NEMICO VELOCE: Lupo Fenrir d'Ombra — Vettoriale 4x (144x112)
  registerCanvas(textures, 'enemy_fast', 144, 112, (ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Coda folta di fumo violaceo
    const tail = ctx.createLinearGradient(4, 44, 34, 66);
    tail.addColorStop(0, '#818cf8');
    tail.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(30, 56);
    ctx.quadraticCurveTo(5, 34, 8, 59);
    ctx.quadraticCurveTo(18, 70, 35, 62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Zampe muscolose in corsa + artigli
    const legs = [[32, 72, 14, 32], [53, 74, 13, 30], [86, 72, 14, 32]];
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

    // Corpo slanciato da predatore
    const fur = ctx.createLinearGradient(26, 34, 112, 80);
    fur.addColorStop(0, '#4f46e5');
    fur.addColorStop(0.55, '#312e81');
    fur.addColorStop(1, '#141136');
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(67, 58, 39, 20, -0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Criniera arcana lungo la schiena
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

    // Testa lupina + fauci + zanne + occhio cremisi
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
  });

  // 8. NEMICO TANK: Jotun Corazzato — Vettoriale 4x (168x192)
  registerCanvas(textures, 'enemy_tank', 168, 192, (ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Stivali colossali
    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 42, 138, 30, 44, 8);
    ctx.fill();
    drawRoundedPath(ctx, 96, 138, 30, 44, 8);
    ctx.fill();

    // Corazza massiccia in ferro nero e basalto
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

    drawRivets(ctx, [[45, 68], [123, 68], [45, 132], [123, 132]], 2.5, '#cbd5e1');

    // Enormi spallacci borchiati + punte
    for (const [sx, rot] of [[32, -0.22], [136, 0.22]]) {
      ctx.save();
      ctx.translate(sx, 69);
      ctx.rotate(rot);
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

    // Elmo pesante + occhi cremisi minacciosi
    ctx.fillStyle = '#334155';
    drawRoundedPath(ctx, 54, 18, 60, 44, 13);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    drawGlowEye(ctx, 72, 40, 3.6, '#fee2e2', 'rgba(239, 68, 68, 0.96)');
    drawGlowEye(ctx, 96, 40, 3.6, '#fee2e2', 'rgba(239, 68, 68, 0.96)');

    // Grande scudo runico borchiato a sinistra
    const shield = ctx.createLinearGradient(6, 58, 50, 132);
    shield.addColorStop(0, '#94a3b8');
    shield.addColorStop(1, '#1e293b');
    ctx.fillStyle = shield;
    drawRoundedPath(ctx, 8, 61, 38, 70, 10);
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(27, 96, 7, 0, Math.PI * 2);
    ctx.fill();

    // Ascia pesante a destra
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
  });

  // 9. BOSS FINALE: Hrimthurs, Signore del Gelo — Vettoriale 4x Colosso (280x320)
  registerCanvas(textures, 'boss', 280, 320, (ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Alone gelido attorno al colosso
    const aura = ctx.createRadialGradient(140, 156, 30, 140, 156, 130);
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(140, 156, 130, 0, Math.PI * 2);
    ctx.fill();

    // Gambe corazzate colossali
    ctx.fillStyle = '#0f172a';
    drawRoundedPath(ctx, 74, 224, 48, 78, 13);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawRoundedPath(ctx, 158, 224, 48, 78, 13);
    ctx.fill();
    ctx.stroke();

    // Busto in piastre di ghiaccio nero e acciaio runico
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

    // Nucleo runico scarlatto pulsante sul petto
    const core = ctx.createRadialGradient(140, 162, 5, 140, 162, 34);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.3, '#f87171');
    core.addColorStop(0.6, '#dc2626');
    core.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(140, 162, 34, 0, Math.PI * 2);
    ctx.fill();

    // Spallacci con grandi cristalli di ghiaccio sfaccettati
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

    // Corona di Corna Glaciali + Elmo
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

    // Martello / Alabarda di Ghiaccio colossale
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
  });

  // 10. Props scenici 4x (Pino, Monolite Runico, Braciere)
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

  // 11. Proiettili e Gemme 4x
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
}
