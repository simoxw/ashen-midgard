/**
 * Generatore procedurale di texture pixel-art 16-bit / fallback headless
 * per Midgard, Muspelheim, Helheim e Asgard in Rovine.
 */

export function ensureProceduralTextures(textures, make) {
  if (!textures || !make) return;
  const g = make.graphics({ x: 0, y: 0, add: false });

  // 1. Terreno Nordico 256x256
  if (!textures.exists('ground_tile')) {
    g.clear();
    g.fillStyle(0x0f1726, 1);
    g.fillRect(0, 0, 256, 256);

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

    g.fillStyle(0x2d4363, 0.45);
    g.fillRect(88, 46, 24, 2);
    g.fillRect(102, 48, 2, 14);
    g.fillRect(194, 112, 20, 2);
    g.fillRect(40, 144, 18, 2);

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

    g.fillStyle(0x38bdf8, 0.22);
    g.fillRect(160, 94, 2, 10);
    g.fillRect(157, 96, 8, 2);
    g.fillRect(38, 30, 2, 9);
    g.fillRect(36, 33, 6, 2);

    g.generateTexture('ground_tile', 256, 256);
  }

  // Decali terreno non-bloccanti
  if (!textures.exists('decal_rune')) {
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

  if (!textures.exists('decal_relic')) {
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

  if (!textures.exists('decal_snow')) {
    g.clear();
    g.fillStyle(0x1e2d44, 0.75);
    g.fillEllipse(24, 12, 42, 18);
    g.fillStyle(0x334c6e, 0.45);
    g.fillEllipse(20, 10, 26, 10);
    g.generateTexture('decal_snow', 48, 24);
  }

  // Eroe 1-4 (fallback headless)
  if (!textures.exists('hero_warrior')) {
    g.clear();
    g.fillStyle(0x7c2d12, 1);
    g.fillRect(6, 15, 24, 18);
    g.fillStyle(0x475569, 1);
    g.fillRect(10, 14, 16, 14);
    g.fillStyle(0xf59e0b, 1);
    g.fillRect(29, 9, 6, 9);
    g.generateTexture('hero_warrior', 36, 42);
  }
  if (!textures.exists('hero_assassin')) {
    g.clear();
    g.fillStyle(0x3b0764, 1);
    g.fillRect(7, 15, 22, 17);
    g.fillStyle(0xe879f9, 1);
    g.fillRect(12, 23, 12, 2);
    g.generateTexture('hero_assassin', 36, 42);
  }
  if (!textures.exists('hero_mage')) {
    g.clear();
    g.fillStyle(0x0c4a6e, 1);
    g.fillRect(8, 15, 20, 23);
    g.fillStyle(0x38bdf8, 1);
    g.fillRect(26, 4, 7, 7);
    g.generateTexture('hero_mage', 36, 42);
  }
  if (!textures.exists('hero_juggernaut')) {
    g.clear();
    g.fillStyle(0x451a03, 1);
    g.fillRect(6, 15, 24, 18);
    g.fillStyle(0xfb923c, 1);
    g.fillRect(10, 24, 16, 3);
    g.generateTexture('hero_juggernaut', 36, 42);
  }

  // Nemici Midgard & Boss
  if (!textures.exists('enemy_swarm')) {
    g.clear();
    g.fillStyle(0x1e3a4c, 1);
    g.fillRect(8, 13, 14, 14);
    g.generateTexture('enemy_swarm', 30, 34);
  }
  if (!textures.exists('enemy_fast')) {
    g.clear();
    g.fillStyle(0x312e81, 1);
    g.fillRect(6, 9, 19, 10);
    g.generateTexture('enemy_fast', 34, 26);
  }
  if (!textures.exists('enemy_tank')) {
    g.clear();
    g.fillStyle(0x334155, 1);
    g.fillRect(6, 14, 28, 22);
    g.generateTexture('enemy_tank', 40, 46);
  }
  if (!textures.exists('enemy_archer')) {
    g.clear();
    g.fillStyle(0x0369a1, 1);
    g.fillRect(8, 12, 14, 15);
    g.generateTexture('enemy_archer', 30, 34);
  }
  if (!textures.exists('enemy_berserker')) {
    g.clear();
    g.fillStyle(0x991b1b, 1);
    g.fillRect(8, 13, 20, 17);
    g.generateTexture('enemy_berserker', 36, 40);
  }
  if (!textures.exists('enemy_elite')) {
    g.clear();
    g.fillStyle(0x1e293b, 1);
    g.fillRect(9, 15, 28, 24);
    g.fillStyle(0xfbbf24, 1);
    g.fillRect(14, 4, 18, 11);
    g.generateTexture('enemy_elite', 46, 52);
  }
  if (!textures.exists('boss')) {
    g.clear();
    g.fillStyle(0x334155, 1);
    g.fillRect(13, 26, 44, 32);
    g.fillStyle(0x38bdf8, 1);
    g.fillRect(27, 15, 4, 4);
    g.generateTexture('boss', 70, 80);
  }

  // Props & Ombra
  if (!textures.exists('prop_tree')) {
    g.clear();
    g.fillStyle(0x451a03, 1);
    g.fillRect(21, 48, 8, 18);
    g.fillStyle(0x064e3b, 1);
    g.fillTriangle(25, 2, 6, 28, 44, 28);
    g.generateTexture('prop_tree', 50, 68);
  }
  if (!textures.exists('prop_rock')) {
    g.clear();
    g.fillStyle(0x334155, 1);
    g.fillRect(6, 12, 24, 34);
    g.generateTexture('prop_rock', 36, 48);
  }
  if (!textures.exists('prop_brazier')) {
    g.clear();
    g.fillStyle(0x334155, 1);
    g.fillRect(8, 20, 16, 16);
    g.fillStyle(0xfbbf24, 1);
    g.fillTriangle(16, 7, 11, 17, 21, 17);
    g.generateTexture('prop_brazier', 32, 38);
  }
  if (!textures.exists('shadow_ellipse')) {
    g.clear();
    g.fillStyle(0x020617, 1);
    g.fillEllipse(14, 7, 26, 11);
    g.generateTexture('shadow_ellipse', 28, 14);
  }

  // Proiettili & Gemme & Interactables
  const ensureSimple = (key, color, w = 36, h = 42) => {
    if (textures.exists(key)) return;
    g.clear();
    g.fillStyle(color, 1);
    g.fillRect(2, 2, Math.max(2, w - 4), Math.max(2, h - 4));
    g.generateTexture(key, w, h);
  };

  ensureSimple('axe_proj', 0xf59e0b, 22, 22);
  ensureSimple('dagger_proj', 0xe879f9, 20, 13);
  ensureSimple('orb_proj', 0x38bdf8, 18, 18);
  ensureSimple('blade_proj', 0xbae6fd, 16, 22);
  ensureSimple('spear_proj', 0xfbbf24, 24, 8);
  ensureSimple('scythe_proj', 0xc084fc, 22, 22);
  ensureSimple('fang_proj', 0xd8b4fe, 16, 9);
  ensureSimple('grimoire_proj', 0x60a5fa, 22, 22);
  ensureSimple('flail_proj', 0xfb7185, 18, 18);

  ensureSimple('gem_blue', 0x0ea5e9, 12, 14);
  ensureSimple('gem_green', 0x10b981, 12, 14);
  ensureSimple('gem_gold', 0xf59e0b, 12, 14);

  ensureSimple('prop_crate', 0x78350f, 24, 24);
  ensureSimple('prop_shrine', 0x38bdf8, 32, 38);
  ensureSimple('chest_valhalla', 0xfbbf24, 24, 20);
  ensureSimple('frost_arrow', 0x7dd3fc, 16, 8);
  ensureSimple('meat_pickup', 0xef4444, 16, 14);
  ensureSimple('magnet_pickup', 0x38bdf8, 16, 16);

  // Muspelheim
  ensureSimple('ground_tile_muspel', 0x1a0b08, 256, 256);
  ensureSimple('decal_lava', 0xea580c, 52, 36);
  ensureSimple('decal_ember_rune', 0xf97316, 52, 36);
  ensureSimple('decal_ash', 0x44403c, 48, 24);
  ensureSimple('prop_obsidian', 0x292524, 36, 48);
  ensureSimple('prop_magma_spire', 0x57534e, 50, 68);
  ensureSimple('enemy_muspel_swarm', 0x9a3412, 30, 34);
  ensureSimple('enemy_muspel_fast', 0xea580c, 34, 26);
  ensureSimple('enemy_muspel_archer', 0xc2410c, 30, 34);
  ensureSimple('enemy_muspel_berserker', 0x7c2d12, 36, 40);
  ensureSimple('enemy_muspel_tank', 0x44403c, 40, 46);
  ensureSimple('enemy_muspel_elite', 0xf97316, 46, 52);
  ensureSimple('boss_surtr', 0xea580c, 70, 80);
  ensureSimple('fire_bolt', 0xfb923c, 16, 8);

  // Helheim
  ensureSimple('ground_tile_hel', 0x0a1017, 256, 256);
  ensureSimple('decal_hel_rune', 0x10b981, 52, 36);
  ensureSimple('decal_bones', 0x94a3b8, 34, 32);
  ensureSimple('decal_mist', 0x065f46, 48, 24);
  ensureSimple('prop_soul_brazier', 0x10b981, 32, 38);
  ensureSimple('prop_hel_obelisk', 0x3b0764, 36, 48);
  ensureSimple('prop_dead_tree', 0x334155, 50, 68);
  ensureSimple('enemy_hel_swarm', 0x065f46, 30, 34);
  ensureSimple('enemy_hel_fast', 0x10b981, 34, 26);
  ensureSimple('enemy_hel_archer', 0x6b21a8, 30, 34);
  ensureSimple('enemy_hel_berserker', 0x581c87, 36, 40);
  ensureSimple('enemy_hel_tank', 0x1e293b, 40, 46);
  ensureSimple('enemy_hel_elite', 0xa855f7, 46, 52);
  ensureSimple('boss_hel', 0x7e22ce, 70, 80);
  ensureSimple('shadow_bolt', 0xa855f7, 16, 8);

  // Asgard in Rovine (4° Regno)
  ensureSimple('ground_tile_asgard', 0x141024, 256, 256);
  ensureSimple('decal_bifrost', 0xfbbf24, 52, 36);
  ensureSimple('decal_asgard_gold', 0xeab308, 34, 32);
  ensureSimple('decal_shattered_marble', 0x475569, 48, 24);
  ensureSimple('prop_bifrost_pillar', 0xd4af37, 36, 48);
  ensureSimple('prop_asgard_brazier', 0xf59e0b, 32, 38);
  ensureSimple('enemy_asgard_swarm', 0x475569, 30, 34);
  ensureSimple('enemy_asgard_fast', 0x6366f1, 34, 26);
  ensureSimple('enemy_asgard_archer', 0xd97706, 30, 34);
  ensureSimple('enemy_asgard_berserker', 0xb45309, 36, 40);
  ensureSimple('enemy_asgard_tank', 0x334155, 40, 46);
  ensureSimple('enemy_asgard_elite', 0xfbbf24, 46, 52);
  ensureSimple('boss_loki', 0x10b981, 70, 80);
  ensureSimple('boss_odin', 0xfbbf24, 70, 80);
  ensureSimple('loki_bolt', 0x34d399, 16, 8);
  ensureSimple('astral_spear', 0xfde047, 18, 8);

  for (const prefix of ['enemy', 'enemy_muspel', 'enemy_hel', 'enemy_asgard']) {
    ensureSimple(`${prefix}_shaman`, 0x7e22ce, 32, 37);
    ensureSimple(`${prefix}_bomber`, 0xf97316, 31, 35);
    ensureSimple(`${prefix}_shieldbearer`, 0x64748b, 38, 44);
    ensureSimple(`${prefix}_stalker`, 0xe879f9, 33, 36);
  }

  g.destroy();
}
