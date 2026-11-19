/**
 * StoryManager: gestisce l'overlay narrativo HTML/CSS stile Visual Novel
 * leggendo story.json, applicando effetto Ken Burns, particelle atmosferiche
 * (cenere/gelo) e testo con effetto macchina da scrivere.
 */

const FALLBACK_STORY = {
  onGameStart: [
    {
      speaker: 'Astrid, Figlia del Tuono',
      text: "Le fiamme di Yggdrasil si sono spente. Resisti all'orda per quattro minuti finché il Signore del Gelo non emergerà dalla bufera.",
      image: './assets/story/intro.jpg',
      effect: 'kenBurnsIn',
      particles: 'embers'
    }
  ],
  onBossSpawn: [
    {
      speaker: 'Araldo del Gelo',
      text: 'Hrimthurs degli Jotun è giunto! Evita i cerchi scarlatti sul terreno prima del suo colpo mortale.',
      image: './assets/story/boss.jpg',
      effect: 'kenBurnsIn',
      particles: 'frost'
    }
  ],
  onVictory: [
    {
      speaker: 'Cronache del Valhalla',
      text: 'Il Gigante di Brina è caduto! Il tuo nome risuonerà eterno nelle sale degli Einherjar.',
      image: './assets/story/victory.jpg',
      effect: 'kenBurnsIn',
      particles: 'embers'
    }
  ],
  onGameOver: [
    {
      speaker: 'Eco del Fimbulvetr',
      text: 'Lo scudo si spezza nella tormenta. Rialzati e tempra nuove rune per la prossima battaglia.',
      image: './assets/story/gameover.jpg',
      effect: 'kenBurnsIn',
      particles: 'frost'
    }
  ]
};

export class StoryManager {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.storyData = FALLBACK_STORY;
    this.isPlaying = false;
    this.slides = [];
    this.currentIndex = 0;
    this.typewriterTimer = null;
    this.isTyping = false;
    this.currentFullText = '';
    this.resolvePromise = null;
    this.particleRaf = null;
    this.particles = [];
    this.particleMode = 'embers';

    this._cacheElements();
    this._bindEvents();
  }

  _cacheElements() {
    this.overlay = document.getElementById('story-overlay');
    this.imgEl = document.getElementById('story-image');
    this.fallbackBg = document.getElementById('story-fallback-bg');
    this.canvasEl = document.getElementById('story-particles');
    this.ctx = this.canvasEl ? this.canvasEl.getContext('2d') : null;
    this.speakerEl = document.getElementById('story-speaker');
    this.textEl = document.getElementById('story-text');
    this.progressEl = document.getElementById('story-progress');
    this.nextBtn = document.getElementById('story-next-btn');
    this.skipBtn = document.getElementById('story-skip-btn');
    this.dialogueBox = document.getElementById('story-dialogue-box');
  }

  _bindEvents() {
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audio?.playUiClick();
        this._advanceOrComplete();
      });
    }

    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audio?.playUiClick();
        this.finish();
      });
    }

    if (this.dialogueBox) {
      this.dialogueBox.addEventListener('click', () => {
        this._advanceOrComplete();
      });
    }

    if (this.imgEl) {
      this.imgEl.addEventListener('error', () => {
        // Fallback elegante su sfondo atmosferico CSS se l'immagine non è presente
        this.imgEl.classList.add('hidden');
        if (this.fallbackBg) this.fallbackBg.classList.remove('hidden');
      });
      this.imgEl.addEventListener('load', () => {
        this.imgEl.classList.remove('hidden');
        if (this.fallbackBg) this.fallbackBg.classList.add('hidden');
      });
    }
  }

  async load(url = './story.json') {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (response.ok) {
        const json = await response.json();
        if (json && typeof json === 'object') {
          this.storyData = { ...FALLBACK_STORY, ...json };
        }
      }
    } catch {
      // Mantiene FALLBACK_STORY se offline prima del caching
    }
  }

  getSlidesFor(triggerName, heroId = null) {
    const heroSlides = heroId ? this.storyData.heroes?.[heroId]?.[triggerName] : null;
    if (Array.isArray(heroSlides) && heroSlides.length > 0) {
      return heroSlides;
    }
    return this.storyData[triggerName] || [];
  }

  /**
   * Avvia la sequenza di vignette per un trigger specifico e un eroe, restituendo una Promise.
   */
  play(triggerName, heroId = null) {
    const slides = this.getSlidesFor(triggerName, heroId);
    if (!slides || slides.length === 0 || !this.overlay) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.slides = slides;
      this.currentIndex = 0;
      this.isPlaying = true;

      this.overlay.classList.remove('hidden');
      this.overlay.classList.add('flex');
      this._resizeCanvas();
      this._startParticles();
      this._renderSlide(0);
    });
  }

  _renderSlide(index) {
    const slide = this.slides[index];
    if (!slide) {
      this.finish();
      return;
    }

    this.particleMode = slide.particles || 'embers';

    if (this.speakerEl) {
      this.speakerEl.textContent = slide.speaker || 'Cronista';
    }

    if (this.progressEl) {
      this.progressEl.textContent = `${index + 1} / ${this.slides.length}`;
    }

    if (this.nextBtn) {
      this.nextBtn.textContent = index >= this.slides.length - 1 ? 'Continua' : 'Avanti';
    }

    // Imposta sfondo fallback coerente con il mood
    if (this.fallbackBg) {
      this.fallbackBg.dataset.mood = this.particleMode;
    }

    // Reset e riavvio animazione Ken Burns
    if (this.imgEl) {
      this.imgEl.classList.remove('kb-in', 'kb-pan');
      void this.imgEl.offsetWidth; // Reflow controllato per riavviare i keyframe CSS
      if (slide.image) {
        this.imgEl.src = slide.image;
        this.imgEl.classList.remove('hidden');
        if (this.fallbackBg) this.fallbackBg.classList.add('hidden');
      } else {
        this.imgEl.classList.add('hidden');
        if (this.fallbackBg) this.fallbackBg.classList.remove('hidden');
      }
      this.imgEl.classList.add(slide.effect === 'kenBurnsPan' ? 'kb-pan' : 'kb-in');
    }

    this._startTypewriter(slide.text || '');
  }

  _startTypewriter(fullText) {
    clearInterval(this.typewriterTimer);
    this.currentFullText = fullText;
    this.isTyping = true;
    if (this.textEl) this.textEl.textContent = '';

    let cursor = 0;
    this.typewriterTimer = setInterval(() => {
      cursor += 1;
      if (this.textEl) {
        this.textEl.textContent = fullText.slice(0, cursor);
      }
      if (cursor >= fullText.length) {
        clearInterval(this.typewriterTimer);
        this.isTyping = false;
      }
    }, 20);
  }

  _advanceOrComplete() {
    if (!this.isPlaying) return;

    // Se il testo sta ancora scorrendo, completalo istantaneamente al primo tap
    if (this.isTyping) {
      clearInterval(this.typewriterTimer);
      this.isTyping = false;
      if (this.textEl) this.textEl.textContent = this.currentFullText;
      return;
    }

    this.currentIndex += 1;
    if (this.currentIndex >= this.slides.length) {
      this.finish();
    } else {
      this._renderSlide(this.currentIndex);
    }
  }

  finish() {
    if (!this.isPlaying) return;
    clearInterval(this.typewriterTimer);
    this.isPlaying = false;
    this.isTyping = false;
    this._stopParticles();

    if (this.overlay) {
      this.overlay.classList.add('hidden');
      this.overlay.classList.remove('flex');
    }

    if (this.resolvePromise) {
      const done = this.resolvePromise;
      this.resolvePromise = null;
      done();
    }
  }

  _resizeCanvas() {
    if (!this.canvasEl || !this.overlay) return;
    const rect = this.overlay.getBoundingClientRect();
    this.canvasEl.width = Math.max(1, Math.floor(rect.width));
    this.canvasEl.height = Math.max(1, Math.floor(rect.height));
  }

  _startParticles() {
    if (!this.ctx || !this.canvasEl) return;
    this._stopParticles();

    const count = 34;
    this.particles = Array.from({ length: count }, () => this._spawnParticle(true));

    const tick = () => {
      if (!this.isPlaying || !this.ctx || !this.canvasEl) return;
      const w = this.canvasEl.width;
      const h = this.canvasEl.height;
      this.ctx.clearRect(0, 0, w, h);

      const isFrost = this.particleMode === 'frost';
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += isFrost ? Math.abs(p.vy) : -Math.abs(p.vy);
        p.alpha += p.va;
        if (p.alpha <= 0.1 || p.alpha >= 0.85) p.va *= -1;

        if (isFrost && p.y > h + 10) {
          Object.assign(p, this._spawnParticle(false, true));
        } else if (!isFrost && p.y < -10) {
          Object.assign(p, this._spawnParticle(false, false));
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = isFrost
          ? `rgba(186, 230, 253, ${p.alpha.toFixed(2)})`
          : `rgba(251, 146, 60, ${p.alpha.toFixed(2)})`;
        this.ctx.fill();
      }
      this.particleRaf = requestAnimationFrame(tick);
    };
    this.particleRaf = requestAnimationFrame(tick);
  }

  _spawnParticle(randomY = false, topEdge = false) {
    const w = this.canvasEl?.width || 400;
    const h = this.canvasEl?.height || 800;
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : topEdge ? -8 : h + 8,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 0.45 + Math.random() * 1.15,
      size: 1.2 + Math.random() * 2.4,
      alpha: 0.25 + Math.random() * 0.5,
      va: (Math.random() > 0.5 ? 1 : -1) * 0.008
    };
  }

  _stopParticles() {
    if (this.particleRaf) {
      cancelAnimationFrame(this.particleRaf);
      this.particleRaf = null;
    }
    this.particles = [];
  }
}
