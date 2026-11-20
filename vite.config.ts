import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const base = process.env.GITHUB_ACTIONS === 'true' ? '/ashen-midgard/' : '/';
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      // Copies static PWA files, story.json, icons, and assets into dist/ so both
      // direct GitHub Pages hosting and Vite production builds resolve cleanly.
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

          const staticFiles = [
            'manifest.json',
            'sw.js',
            'story.json',
            'icon.svg',
            'apple-touch-icon.png',
            'pwa-192x192.png',
            'pwa-512x512.png',
            'pwa-maskable-512x512.png',
          ];
          for (const fileName of staticFiles) {
            const fromFile = path.resolve(__dirname, fileName);
            const toFile = path.resolve(distDir, fileName);
            if (fs.existsSync(fromFile)) {
              if (fileName === 'sw.js') {
                const swContent = fs
                  .readFileSync(fromFile, 'utf8')
                  .replace(/const CACHE_VERSION = '[^']+';/, `const CACHE_VERSION = 'build-${Date.now()}';`);
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
