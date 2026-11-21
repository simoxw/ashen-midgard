import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

function collectDistAssetUrls(distDir: string): string[] {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) return [];
  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'aistudio') continue;
        walk(full);
      } else if (!entry.name.endsWith('.map')) {
        const rel = path.relative(distDir, full).replace(/\\/g, '/');
        results.push(`./${rel}`);
      }
    }
  };
  walk(assetsDir);
  return results;
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const rawBase =
    env.VITE_BASE_PATH ||
    process.env.VITE_BASE_PATH ||
    (process.env.GITHUB_ACTIONS === 'true' ? '/ashen-midgard/' : '/');
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  return {
    base,
    plugins: [
      // Assicura che /sw.js non venga mai servito da cache HTTP in dev/preview
      {
        name: 'sw-nocache-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.split('?')[0] === '/sw.js') {
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
              res.setHeader('Pragma', 'no-cache');
            }
            next();
          });
        },
      },
      // Copia i file PWA statici, story.json, icone, asset e aggiorna la versione cache di dist/sw.js
      {
        name: 'copy-static-game-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          if (!fs.existsSync(distDir)) return;

          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distSrcAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distSrcAssets, {recursive: true, force: true});
          }

          const staticDirs = ['assets'];
          for (const dirName of staticDirs) {
            const fromDir = path.resolve(__dirname, dirName);
            const toDir = path.resolve(distDir, dirName);
            if (fs.existsSync(fromDir)) {
              fs.cpSync(fromDir, toDir, {recursive: true, force: true});
            }
          }

          const distAssetUrls = collectDistAssetUrls(distDir);

          const staticFiles = [
            'styles.css',
            'manifest.json',
            'sw.js',
            'story.json',
            'icon.svg',
            'apple-touch-icon.png',
            'pwa-192x192.png',
            'pwa-512x512.png',
            'pwa-maskable-512x512.png',
            '.nojekyll',
          ];
          for (const fileName of staticFiles) {
            const fromFile = path.resolve(__dirname, fileName);
            const toFile = path.resolve(distDir, fileName);
            if (fs.existsSync(fromFile)) {
              if (fileName === 'sw.js') {
                const buildAssets = Array.from(
                  new Set([
                    './',
                    './index.html',
                    './styles.css',
                    './manifest.json',
                    './story.json',
                    './icon.svg',
                    './apple-touch-icon.png',
                    './pwa-192x192.png',
                    './pwa-512x512.png',
                    './pwa-maskable-512x512.png',
                    ...distAssetUrls,
                    'https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js',
                  ]),
                );
                const swContent = fs
                  .readFileSync(fromFile, 'utf8')
                  .replace(/const CACHE_VERSION = '[^']+';/, `const CACHE_VERSION = 'build-${Date.now()}';`)
                  .replace(
                    /const PRECACHE_ASSETS = \[[\s\S]*?\];/,
                    `const PRECACHE_ASSETS = ${JSON.stringify(buildAssets, null, 2)};`,
                  );
                fs.writeFileSync(toFile, swContent);
              } else {
                fs.copyFileSync(fromFile, toFile);
              }
            }
          }

          const distIndex = path.resolve(distDir, 'index.html');
          if (fs.existsSync(distIndex)) {
            const html = fs
              .readFileSync(distIndex, 'utf8')
              .replace(/href="[^"]*manifest-[^"]+\.json"/, `href="${base}manifest.json"`);
            fs.writeFileSync(distIndex, html);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
