// Pixel grid shimmer effect for .hub-card (vanilla JS)
// Inspired by the React PixelCard component you shared

(function(){
  class Pixel {
    constructor(canvas, ctx, x, y, color, speed, delay){
      this.width = canvas.width;
      this.height = canvas.height;
      this.ctx = ctx;
      this.x = x;
      this.y = y;
      this.color = color;
      this.speed = Pixel.random(0.1, 0.9) * speed;
      this.size = 0;
      this.sizeStep = Math.random() * 0.4;
      this.minSize = 0.5;
      this.maxSizeInteger = 2;
      this.maxSize = Pixel.random(this.minSize, this.maxSizeInteger);
      this.delay = delay;
      this.counter = 0;
      this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
      this.isIdle = false;
      this.isReverse = false;
      this.isShimmer = false;
    }

    static random(min, max){ return Math.random() * (max - min) + min; }

    draw(){
      const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
    }

    appear(){
      this.isIdle = false;
      if (this.counter <= this.delay){ this.counter += this.counterStep; return; }
      if (this.size >= this.maxSize) this.isShimmer = true;
      if (this.isShimmer) this.shimmer(); else this.size += this.sizeStep;
      this.draw();
    }

    disappear(){
      this.isShimmer = false;
      this.counter = 0;
      if (this.size <= 0){ this.isIdle = true; return; }
      else this.size -= 0.1;
      this.draw();
    }

    shimmer(){
      if (this.size >= this.maxSize) this.isReverse = true;
      else if (this.size <= this.minSize) this.isReverse = false;
      this.size += this.isReverse ? -this.speed : this.speed;
    }
  }

  const VARIANTS = {
    default: { activeColor: null, gap: 5, speed: 35, colors: '#f8fafc,#f1f5f9,#cbd5e1', noFocus: false },
    blue:    { activeColor: '#e0f2fe', gap: 10, speed: 25, colors: '#e0f2fe,#7dd3fc,#0ea5e9', noFocus: false },
    yellow:  { activeColor: '#fef08a', gap: 3,  speed: 20, colors: '#fef08a,#fde047,#eab308', noFocus: false },
    pink:    { activeColor: '#fecdd3', gap: 6,  speed: 80, colors: '#fecdd3,#fda4af,#e11d48', noFocus: true }
  };

  function getEffectiveSpeed(value, reduced){
    const min = 0, max = 100, throttle = 0.001;
    const parsed = parseInt(value, 10);
    if (parsed <= min || reduced) return min;
    if (parsed >= max) return max * throttle;
    return parsed * throttle;
  }

  class PixelCardEffect {
    constructor(cardEl, options={}){
      this.card = cardEl;
      this.opts = options;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'pixel-canvas';
      this.ctx = this.canvas.getContext('2d');
      this.isTextTarget = this.card.classList.contains('pixel-target');
      // For text targets, place canvas on top; for cards, behind content
      if (this.isTextTarget) {
        this.card.appendChild(this.canvas);
      } else {
        // Insert as first child so it sits behind, combined with CSS z-index
        this.card.insertBefore(this.canvas, this.card.firstChild);
      }

      this.pixels = [];
      this.raf = 0;
      this.timePrev = performance.now();
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.onEnter = this.onEnter.bind(this);
      this.onLeave = this.onLeave.bind(this);
      this.onFocusIn = this.onFocusIn.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);
      this._animate = this._animate.bind(this);

      this._initPixels();
      this._attach();
    }

    _getConfig(){
      const variantName = this.card.dataset.pixelVariant || this.opts.variant || 'default';
      const base = VARIANTS[variantName] || VARIANTS.default;
      return {
        gap: Number(this.card.dataset.pixelGap || this.opts.gap || base.gap),
        speed: Number(this.card.dataset.pixelSpeed || this.opts.speed || base.speed),
        colors: String(this.card.dataset.pixelColors || this.opts.colors || base.colors),
        noFocus: (this.card.dataset.pixelNoFocus || this.opts.noFocus || base.noFocus) ? true : false
      };
    }

    _initPixels(){
      const cfg = this._getConfig();
      const rect = this.card.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      this.canvas.width = width; this.canvas.height = height;
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';

      const cols = cfg.colors.split(',');
      const gap = Math.max(1, parseInt(cfg.gap, 10));
      const effSpeed = getEffectiveSpeed(cfg.speed, this.reducedMotion);
      const cx = width / 2, cy = height / 2;

      this.pixels = [];
      for (let x = 0; x < width; x += gap){
        for (let y = 0; y < height; y += gap){
          const color = cols[Math.floor(Math.random() * cols.length)];
          const dx = x - cx, dy = y - cy;
          const distance = Math.sqrt(dx*dx + dy*dy);
          const delay = this.reducedMotion ? 0 : distance;
          this.pixels.push(new Pixel(this.canvas, this.ctx, x, y, color, effSpeed, delay));
        }
      }
    }

    _attach(){
      this.card.addEventListener('mouseenter', this.onEnter);
      this.card.addEventListener('mouseleave', this.onLeave);
      this.card.addEventListener('focusin', this.onFocusIn);
      this.card.addEventListener('focusout', this.onFocusOut);

      // Resize observer
      this.ro = new ResizeObserver(() => this._initPixels());
      this.ro.observe(this.card);
    }

    _drawTextMask(){
      if (!this.isTextTarget) return;
      const ctx = this.ctx;
      if (!ctx) return;
      const style = window.getComputedStyle(this.card);
      const size = style.fontSize || '48px';
      const weight = style.fontWeight || '700';
      const family = style.fontFamily || 'sans-serif';
      ctx.save();
      ctx.font = `${weight} ${size} ${family}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = (this.card.textContent || '').trim();
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.fillStyle = '#000';
      ctx.fillText(text, w/2, h/2);
      ctx.restore();
    }

    _animate(method){
      cancelAnimationFrame(this.raf);
      const step = () => {
        this.raf = requestAnimationFrame(step);
        const now = performance.now();
        const elapsed = now - this.timePrev;
        const interval = 1000/60;
        if (elapsed < interval) return;
        this.timePrev = now - (elapsed % interval);
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let allIdle = true;
        for (let i=0;i<this.pixels.length;i++){
          const p = this.pixels[i];
          p[method]();
          if (!p.isIdle) allIdle = false;
        }
        // If this is a text target, clip pixels to the text shape
        if (this.isTextTarget) {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-in';
          this._drawTextMask();
          ctx.restore();
        }
        if (allIdle) cancelAnimationFrame(this.raf);
      };
      this.raf = requestAnimationFrame(step);
    }

    onEnter(){ this._animate('appear'); }
    onLeave(){ this._animate('disappear'); }
    onFocusIn(){ if (!this._getConfig().noFocus) this._animate('appear'); }
    onFocusOut(){ if (!this._getConfig().noFocus) this._animate('disappear'); }

    destroy(){
      cancelAnimationFrame(this.raf);
      this.ro?.disconnect?.();
      this.card.removeEventListener('mouseenter', this.onEnter);
      this.card.removeEventListener('mouseleave', this.onLeave);
      this.card.removeEventListener('focusin', this.onFocusIn);
      this.card.removeEventListener('focusout', this.onFocusOut);
      try { this.card.removeChild(this.canvas); } catch {}
    }
  }

  // Init on DOM ready for all .hub-card elements on the home page
  document.addEventListener('DOMContentLoaded', () => {
    const targets = document.querySelectorAll('.hub-card, .pixel-target');
    targets.forEach(el => {
      // Avoid double init if any
      if (!el.__pixelEffect) el.__pixelEffect = new PixelCardEffect(el);
    });
  });
})();
