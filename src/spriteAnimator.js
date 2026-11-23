/**
 * Sintetizzatore di animazioni scheletriche 2D per sprite illustrati ad alta definizione (32-bit RGBA).
 * Analizza l'anatomia della silhouette (testa, busto, vita, gamba sinistra/destra o veste inferiore)
 * e genera 8 frame articolati (_f0.._f7) su Canvas HTML5 senza cuciture né tagli netti.
 */

export const CUSTOM_ANIM_PROFILES = {
  hero_warrior: {
    mode: 'stride',
    nativeFacing: 'left',
    frames: 8,
    waistRatio: 0.61,
    hipOverlapRatio: 0.055,
    beltOverlapRatio: 0.045,
    strideRatio: 0.056,
    liftRatio: 0.036,
    legAngleRad: 0.15,
    torsoRollRad: 0.055,
    bounceRatio: 0.032,
    swayRatio: 0.016,
    safeScale: 0.93
  },
  hero_assassin: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.60,
    hipOverlapRatio: 0.055,
    beltOverlapRatio: 0.045,
    strideRatio: 0.068,
    liftRatio: 0.042,
    legAngleRad: 0.18,
    torsoRollRad: 0.068,
    bounceRatio: 0.036,
    swayRatio: 0.020,
    safeScale: 0.92
  },
  hero_mage: {
    mode: 'hover',
    nativeFacing: 'left',
    frames: 8,
    waistRatio: 0.56,
    hipOverlapRatio: 0.060,
    beltOverlapRatio: 0.050,
    hoverBobRatio: 0.036,
    robeSwayRatio: 0.042,
    robeAngleRad: 0.082,
    torsoRollRad: 0.044,
    swayRatio: 0.018,
    safeScale: 0.93
  },
  hero_juggernaut: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.61,
    hipOverlapRatio: 0.060,
    beltOverlapRatio: 0.048,
    strideRatio: 0.048,
    liftRatio: 0.032,
    legAngleRad: 0.13,
    torsoRollRad: 0.050,
    bounceRatio: 0.034,
    swayRatio: 0.016,
    safeScale: 0.93
  },
  boss: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.62,
    hipOverlapRatio: 0.060,
    beltOverlapRatio: 0.048,
    strideRatio: 0.045,
    liftRatio: 0.030,
    legAngleRad: 0.125,
    torsoRollRad: 0.046,
    bounceRatio: 0.032,
    swayRatio: 0.015,
    safeScale: 0.93
  },
  boss_surtr: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.61,
    hipOverlapRatio: 0.060,
    beltOverlapRatio: 0.048,
    strideRatio: 0.048,
    liftRatio: 0.032,
    legAngleRad: 0.135,
    torsoRollRad: 0.052,
    bounceRatio: 0.035,
    swayRatio: 0.017,
    safeScale: 0.93
  },
  boss_hel: {
    mode: 'hover',
    frames: 8,
    waistRatio: 0.55,
    hipOverlapRatio: 0.065,
    beltOverlapRatio: 0.055,
    hoverBobRatio: 0.042,
    robeSwayRatio: 0.048,
    robeAngleRad: 0.090,
    torsoRollRad: 0.050,
    swayRatio: 0.020,
    safeScale: 0.92
  },
  boss_loki: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.59,
    hipOverlapRatio: 0.058,
    beltOverlapRatio: 0.046,
    strideRatio: 0.058,
    liftRatio: 0.036,
    legAngleRad: 0.155,
    torsoRollRad: 0.060,
    bounceRatio: 0.032,
    swayRatio: 0.018,
    safeScale: 0.93
  },
  boss_odin: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.60,
    hipOverlapRatio: 0.060,
    beltOverlapRatio: 0.048,
    strideRatio: 0.050,
    liftRatio: 0.032,
    legAngleRad: 0.138,
    torsoRollRad: 0.048,
    bounceRatio: 0.030,
    swayRatio: 0.015,
    safeScale: 0.93
  },
  enemy_swarm: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.61,
    hipOverlapRatio: 0.055,
    beltOverlapRatio: 0.045,
    strideRatio: 0.054,
    liftRatio: 0.034,
    legAngleRad: 0.145,
    torsoRollRad: 0.054,
    bounceRatio: 0.030,
    swayRatio: 0.016,
    safeScale: 0.92
  },
  enemy_fast: {
    mode: 'lunge',
    frames: 8,
    waistRatio: 0.56,
    hipOverlapRatio: 0.060,
    beltOverlapRatio: 0.050,
    lungeXRatio: 0.044,
    lungeYRatio: 0.042,
    pounceAngleRad: 0.095,
    pawSwingRad: 0.14,
    safeScale: 0.92
  },
  enemy_tank: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.60,
    hipOverlapRatio: 0.062,
    beltOverlapRatio: 0.050,
    strideRatio: 0.044,
    liftRatio: 0.028,
    legAngleRad: 0.118,
    torsoRollRad: 0.044,
    bounceRatio: 0.032,
    swayRatio: 0.015,
    safeScale: 0.92
  },
  enemy_archer: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.61,
    hipOverlapRatio: 0.055,
    beltOverlapRatio: 0.045,
    strideRatio: 0.052,
    liftRatio: 0.032,
    legAngleRad: 0.135,
    torsoRollRad: 0.048,
    bounceRatio: 0.028,
    swayRatio: 0.015,
    safeScale: 0.92
  },
  enemy_berserker: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.62,
    hipOverlapRatio: 0.055,
    beltOverlapRatio: 0.045,
    strideRatio: 0.062,
    liftRatio: 0.038,
    legAngleRad: 0.165,
    torsoRollRad: 0.062,
    bounceRatio: 0.034,
    swayRatio: 0.018,
    safeScale: 0.92
  },
  enemy_elite: {
    mode: 'stride',
    frames: 8,
    waistRatio: 0.61,
    hipOverlapRatio: 0.060,
    beltOverlapRatio: 0.048,
    strideRatio: 0.048,
    liftRatio: 0.032,
    legAngleRad: 0.132,
    torsoRollRad: 0.050,
    bounceRatio: 0.032,
    swayRatio: 0.016,
    safeScale: 0.92
  }
};

export const STATIC_SPRITE_KEYS = new Set([
  'prop_tree',
  'prop_rock',
  'prop_shrine',
  'prop_brazier',
  'prop_crate',
  'ground_tile'
]);

export function isWalkableCustomSprite(key) {
  return Boolean(key) && !STATIC_SPRITE_KEYS.has(key) && !key.startsWith('prop_');
}

export function getAnimProfile(key) {
  return CUSTOM_ANIM_PROFILES[key] || CUSTOM_ANIM_PROFILES.hero_warrior;
}

/**
 * Analizza i pixel opachi dell'immagine per determinare bounding box, linea della vita (waistY)
 * e linea verticale naturale di separazione tra le due gambe (splitX).
 */
export function analyzeSpriteAnatomy(rgbaData, w, h, waistRatio = 0.6) {
  let xMin = w;
  let yMin = h;
  let xMax = -1;
  let yMax = -1;

  for (let y = 0; y < h; y++) {
    const rowOff = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (rgbaData[rowOff + x * 4 + 3] > 24) {
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
  }

  if (xMax < xMin || yMax < yMin) {
    return {
      xMin: 0,
      yMin: 0,
      xMax: w - 1,
      yMax: h - 1,
      charW: w,
      charH: h,
      centerX: Math.floor(w / 2),
      waistY: Math.floor(h * waistRatio),
      splitX: Math.floor(w / 2)
    };
  }

  const charW = xMax - xMin + 1;
  const charH = yMax - yMin + 1;
  const centerX = Math.round((xMin + xMax) / 2);
  const waistY = Math.round(yMin + charH * waistRatio);

  // Cerca la colonna di minor densità tra le gambe nella fascia inferiore (72% - 92%)
  const scanTop = Math.max(waistY, Math.round(yMin + charH * 0.72));
  const scanBot = Math.min(yMax, Math.round(yMin + charH * 0.92));
  const searchLeft = Math.max(xMin, Math.round(xMin + charW * 0.36));
  const searchRight = Math.min(xMax, Math.round(xMin + charW * 0.64));

  let splitX = centerX;
  let bestScore = Infinity;

  for (let x = searchLeft; x <= searchRight; x++) {
    let colAlpha = 0;
    for (let y = scanTop; y <= scanBot; y++) {
      colAlpha += rgbaData[(y * w + x) * 4 + 3];
    }
    // Leggera preferenza verso il centro per evitare falsi minimi ai bordi di armi o mantelli
    const centerBias = Math.abs(x - centerX) * 18;
    const score = colAlpha + centerBias;
    if (score < bestScore) {
      bestScore = score;
      splitX = x;
    }
  }

  return {
    xMin,
    yMin,
    xMax,
    yMax,
    charW,
    charH,
    centerX,
    waistY,
    splitX
  };
}

function makeOffscreenCanvas(w, h) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

/**
 * Ritaglia l'immagine sorgente in tre layer sfumati (gamba sinistra, gamba destra, busto+testa)
 * così che nessuna cucitura netta appaia durante la rotazione attorno a vita/anche.
 */
function buildFeatheredLayers(sourceImg, w, h, anatomy, profile) {
  const srcCanvas = makeOffscreenCanvas(w, h);
  if (!srcCanvas) return null;
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.clearRect(0, 0, w, h);
  srcCtx.drawImage(sourceImg, 0, 0, w, h);

  const imgData = srcCtx.getImageData(0, 0, w, h);
  const src = imgData.data;

  const hipOverlap = Math.max(4, Math.round(anatomy.charH * (profile.hipOverlapRatio || 0.055)));
  const beltOverlap = Math.max(4, Math.round(anatomy.charH * (profile.beltOverlapRatio || 0.045)));
  const xFeather = Math.max(4, Math.round(anatomy.charW * 0.025));

  const legTop = Math.max(0, anatomy.waistY - hipOverlap);
  const upperBot = Math.min(h - 1, anatomy.waistY + beltOverlap);

  const leftCanvas = makeOffscreenCanvas(w, h);
  const rightCanvas = makeOffscreenCanvas(w, h);
  const upperCanvas = makeOffscreenCanvas(w, h);
  if (!leftCanvas || !rightCanvas || !upperCanvas) return null;

  const lCtx = leftCanvas.getContext('2d');
  const rCtx = rightCanvas.getContext('2d');
  const uCtx = upperCanvas.getContext('2d');

  const lData = lCtx.createImageData(w, h);
  const rData = rCtx.createImageData(w, h);
  const uData = uCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const rowOff = y * w * 4;

    // Maschera busto superiore con sfumatura morbida sotto la cintura
    let upperAlphaScale = 0;
    if (y <= anatomy.waistY) {
      upperAlphaScale = 1;
    } else if (y <= upperBot) {
      upperAlphaScale = 1 - (y - anatomy.waistY) / Math.max(1, beltOverlap);
    }

    // Maschera gambe con sfumatura morbida sopra i fianchi
    let legAlphaScale = 0;
    if (y >= anatomy.waistY) {
      legAlphaScale = 1;
    } else if (y >= legTop) {
      legAlphaScale = (y - legTop) / Math.max(1, hipOverlap);
    }

    for (let x = 0; x < w; x++) {
      const idx = rowOff + x * 4;
      const a = src[idx + 3];
      if (a === 0) continue;

      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];

      if (upperAlphaScale > 0) {
        uData.data[idx] = r;
        uData.data[idx + 1] = g;
        uData.data[idx + 2] = b;
        uData.data[idx + 3] = Math.round(a * upperAlphaScale);
      }

      if (legAlphaScale > 0) {
        let leftFrac = 0;
        if (x <= anatomy.splitX - xFeather) {
          leftFrac = 1;
        } else if (x >= anatomy.splitX + xFeather) {
          leftFrac = 0;
        } else {
          leftFrac = 1 - (x - (anatomy.splitX - xFeather)) / Math.max(1, xFeather * 2);
        }
        const rightFrac = 1 - leftFrac;

        if (leftFrac > 0.01) {
          lData.data[idx] = r;
          lData.data[idx + 1] = g;
          lData.data[idx + 2] = b;
          lData.data[idx + 3] = Math.round(a * legAlphaScale * leftFrac);
        }
        if (rightFrac > 0.01) {
          rData.data[idx] = r;
          rData.data[idx + 1] = g;
          rData.data[idx + 2] = b;
          rData.data[idx + 3] = Math.round(a * legAlphaScale * rightFrac);
        }
      }
    }
  }

  lCtx.putImageData(lData, 0, 0);
  rCtx.putImageData(rData, 0, 0);
  uCtx.putImageData(uData, 0, 0);

  return { leftCanvas, rightCanvas, upperCanvas };
}

function drawPivotedLayer(ctx, layerCanvas, pivotX, pivotY, tx, ty, angleRad, sx, sy, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(pivotX + tx, pivotY + ty);
  ctx.rotate(angleRad);
  ctx.scale(sx, sy);
  ctx.drawImage(layerCanvas, -pivotX, -pivotY);
  ctx.restore();
}

/**
 * Genera i frame animati (_f0.._f7) a partire da un'immagine PNG già caricata.
 * Supporta sia camminata/corsa bipede (stride) che levitazione mistica con veste oscillante (hover).
 */
export function buildCustomWalkCanvases(key, sourceImg) {
  if (typeof document === 'undefined' || !sourceImg) return [];
  const w = sourceImg.width || sourceImg.naturalWidth || 0;
  const h = sourceImg.height || sourceImg.naturalHeight || 0;
  if (w <= 0 || h <= 0) return [];

  const profile = getAnimProfile(key);
  const probeCanvas = makeOffscreenCanvas(w, h);
  if (!probeCanvas) return [];
  const probeCtx = probeCanvas.getContext('2d');
  probeCtx.drawImage(sourceImg, 0, 0, w, h);
  const rgba = probeCtx.getImageData(0, 0, w, h).data;

  const anatomy = analyzeSpriteAnatomy(rgba, w, h, profile.waistRatio);
  const layers = buildFeatheredLayers(sourceImg, w, h, anatomy, profile);
  if (!layers) return [];

  const frameCount = profile.frames || 8;
  const safeScale = profile.safeScale || 0.93;
  const hipOffsetX = Math.max(8, Math.round(anatomy.charW * 0.085));
  const leftPivotX = anatomy.splitX - hipOffsetX;
  const rightPivotX = anatomy.splitX + hipOffsetX;
  const waistY = anatomy.waistY;
  const centerX = anatomy.centerX;

  const canvases = [];

  for (let i = 0; i < frameCount; i++) {
    const theta = (i / frameCount) * Math.PI * 2;
    const frameCanvas = makeOffscreenCanvas(w, h);
    if (!frameCanvas) continue;
    const ctx = frameCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    // Centra leggermente in safeScale per impedire il taglio di stivali, elmi o mantelli ai bordi
    ctx.save();
    ctx.translate(w / 2, h * 0.52);
    ctx.scale(safeScale, safeScale);
    ctx.translate(-w / 2, -h * 0.52);

    if (profile.mode === 'lunge') {
      // Balzo quadrupede fluido (Lupo Fenrir): spinta orizzontale, arco di salto verticale e falcata zampe
      const gallop = Math.sin(theta);
      const boundLift = -Math.max(0, Math.sin(theta - 0.35)) * anatomy.charH * (profile.lungeYRatio || 0.042);
      const lungeX = Math.cos(theta) * anatomy.charW * (profile.lungeXRatio || 0.044);
      const bodyPitch = gallop * (profile.pounceAngleRad || 0.095);
      const pawRot = Math.cos(theta) * (profile.pawSwingRad || 0.14);

      drawPivotedLayer(
        ctx,
        layers.leftCanvas,
        leftPivotX,
        waistY,
        lungeX * 0.65 - gallop * anatomy.charW * 0.04,
        boundLift * 0.72,
        -pawRot * 0.85,
        1 + gallop * 0.025,
        1 - Math.max(0, -gallop) * 0.05,
        0.95
      );
      drawPivotedLayer(
        ctx,
        layers.rightCanvas,
        rightPivotX,
        waistY,
        lungeX * 0.85 + gallop * anatomy.charW * 0.045,
        boundLift * 0.82,
        pawRot * 0.95,
        1 + gallop * 0.025,
        1 - Math.max(0, gallop) * 0.05,
        1
      );
      drawPivotedLayer(
        ctx,
        layers.upperCanvas,
        centerX,
        waistY,
        lungeX,
        boundLift,
        bodyPitch,
        1 + Math.abs(gallop) * 0.032,
        1 - Math.abs(gallop) * 0.024,
        1
      );
    } else if (profile.mode === 'hover') {
      const hoverWave = Math.sin(theta);
      const swayWave = Math.cos(theta);
      const bobY = hoverWave * anatomy.charH * (profile.hoverBobRatio || 0.036);
      const swayX = swayWave * anatomy.charW * (profile.swayRatio || 0.018);
      const robeShiftX = Math.sin(theta - 0.4) * anatomy.charW * (profile.robeSwayRatio || 0.042);
      const robeAngle = Math.sin(theta - 0.5) * (profile.robeAngleRad || 0.082);
      const torsoAngle = swayWave * (profile.torsoRollRad || 0.044);

      drawPivotedLayer(
        ctx,
        layers.leftCanvas,
        leftPivotX,
        waistY,
        swayX + robeShiftX * 0.95,
        bobY * 0.85,
        robeAngle * 0.92,
        1,
        1 + hoverWave * 0.025,
        0.96
      );
      drawPivotedLayer(
        ctx,
        layers.rightCanvas,
        rightPivotX,
        waistY,
        swayX + robeShiftX * 1.05,
        bobY * 0.85,
        robeAngle * 1.05,
        1,
        1 - hoverWave * 0.02,
        0.96
      );
      drawPivotedLayer(
        ctx,
        layers.upperCanvas,
        centerX,
        waistY,
        swayX,
        bobY,
        torsoAngle,
        1 - hoverWave * 0.018,
        1 + hoverWave * 0.022,
        1
      );
    } else {
      const stride = Math.sin(theta);
      const stepBounce = -Math.abs(Math.cos(theta)); // Doppio picco: scende all'impatto, sale al passaggio

      const stridePx = anatomy.charW * (profile.strideRatio || 0.055);
      const liftPx = anatomy.charH * (profile.liftRatio || 0.036);
      const bounceY = stepBounce * anatomy.charH * (profile.bounceRatio || 0.032);
      const swayX = stride * anatomy.charW * (profile.swayRatio || 0.016);

      // Gamba sinistra e destra alternate: una avanti/piantata, l'altra indietro/sollevata
      const leftForward = stride;
      const rightForward = -stride;

      const leftLift = Math.max(0, -leftForward) * liftPx + Math.max(0, Math.cos(theta)) * liftPx * 0.35;
      const rightLift = Math.max(0, -rightForward) * liftPx + Math.max(0, -Math.cos(theta)) * liftPx * 0.35;

      const leftShiftX = leftForward * stridePx;
      const rightShiftX = rightForward * stridePx;

      const leftAngle = -leftForward * (profile.legAngleRad || 0.15);
      const rightAngle = -rightForward * (profile.legAngleRad || 0.15);

      const leftScaleY = 1 - Math.max(0, -leftForward) * 0.065;
      const rightScaleY = 1 - Math.max(0, -rightForward) * 0.065;

      const leftSpec = {
        canvas: layers.leftCanvas,
        px: leftPivotX,
        tx: leftShiftX + swayX * 0.4,
        ty: -leftLift + bounceY * 0.45,
        angle: leftAngle,
        sy: leftScaleY,
        isBack: leftForward < 0
      };
      const rightSpec = {
        canvas: layers.rightCanvas,
        px: rightPivotX,
        tx: rightShiftX + swayX * 0.4,
        ty: -rightLift + bounceY * 0.45,
        angle: rightAngle,
        sy: rightScaleY,
        isBack: rightForward < 0
      };

      // Disegna prima la gamba arretrata (con lieve oscuramento di profondità) poi quella avanzata
      const orderedLegs = leftSpec.isBack ? [leftSpec, rightSpec] : [rightSpec, leftSpec];
      for (const leg of orderedLegs) {
        drawPivotedLayer(
          ctx,
          leg.canvas,
          leg.px,
          waistY,
          leg.tx,
          leg.ty,
          leg.angle,
          1,
          leg.sy,
          leg.isBack ? 0.90 : 1
        );
      }

      // Busto superiore: contro-torsione delle spalle rispetto alle gambe e rimbalzo del passo
      const torsoAngle = stride * (profile.torsoRollRad || 0.055);
      const stretchY = 1 + Math.abs(Math.cos(theta)) * 0.028;
      const stretchX = 1 - Math.abs(Math.cos(theta)) * 0.022;

      drawPivotedLayer(
        ctx,
        layers.upperCanvas,
        centerX,
        waistY,
        swayX,
        bounceY,
        torsoAngle,
        stretchX,
        stretchY,
        1
      );
    }

    ctx.restore();
    canvases.push(frameCanvas);
  }

  return canvases;
}

/**
 * Registra i canvas generati nel TextureManager di Phaser sotto `${key}_f0.._f{N-1}`,
 * rimuovendo eventuali vecchi frame procedurali.
 */
export function registerCustomWalkFrames(textures, key, sourceImg) {
  if (!textures || !key || !sourceImg || !isWalkableCustomSprite(key)) return 0;
  const canvases = buildCustomWalkCanvases(key, sourceImg);
  if (canvases.length === 0) return 0;

  for (let i = 0; i < 12; i++) {
    const oldKey = `${key}_f${i}`;
    if (textures.exists?.(oldKey)) {
      textures.remove?.(oldKey);
    }
  }

  for (let i = 0; i < canvases.length; i++) {
    const frameKey = `${key}_f${i}`;
    textures.addCanvas?.(frameKey, canvases[i]);
  }
  return canvases.length;
}
