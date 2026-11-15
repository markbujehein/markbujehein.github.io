// Detector pixels over the hero rings: one transparent WebGL canvas on top of the SVG rings.
// The rings, their entrance and their scroll-apart are untouched. The canvas is a lattice of dots, like detector
// pixels; moving the pointer makes the pixels it passes "fire" (a few cells at a time, each its own way), and each
// fired pixel then decays back to nothing. Nothing is distorted, dimmed or lit as a spotlight.

export interface GlowRing {
  r: number; // radius in SVG viewBox units
  w: number; // stroke width in viewBox units
  c: string; // "#rrggbb"
  depth: number; // scroll parallax depth
  grow: number; // scroll scale change
}

const MAX_RINGS = 8;
const MAX_TRAIL = 14;
const MAX_BURN = 24;
const BURN_LIFE = 2.6; // seconds a flash or an ejected electron keeps its pixels hot
const BURN_SAMPLE_MS = 33;
const MAX_DPR = 1.5;
const TRAIL_LIFE = 1.4; // seconds a pointer position keeps firing pixels
const MIN_STEP = 8; // css px the pointer must travel to leave a new trail point
const FRAME_MS = 1000 / 60;

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 uCentre;   // ring centre, device px (origin bottom-left)
uniform float uScale;   // device px per viewBox unit
uniform float uPitch;   // pixel lattice pitch, device px
uniform float uP;       // hero scroll progress 0..1
uniform vec3 uWave;     // glow pulse: front radius (device px), opacity, ignition at the centre (read from the CSS animation)
uniform float uRem;     // 1rem in device px
uniform vec3 uBurn[${MAX_BURN}];   // burn-in sources: x, y (device px), age (s; < 0 = unused)
  uniform vec3 uTrail[${MAX_TRAIL}];  // pointer x, y (device px), age (s; < 0 = unused)
uniform vec4 uRing[${MAX_RINGS}];   // radius, width, depth, grow
uniform vec3 uCol[${MAX_RINGS}];

float rnd(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 cell = floor(gl_FragCoord.xy / uPitch);
  vec2 centre = (cell + 0.5) * uPitch;
  float r1 = rnd(cell + 3.7);   // this pixel's own sensitivity
  float r2 = rnd(cell + 19.1);  // and its own flash length

  // how strongly the pointer's recent path reaches this pixel (its own cell centre, so each pixel acts alone)
  float reach = 0.0;
  for (int i = 0; i < ${MAX_TRAIL}; i++) {
    vec3 t = uTrail[i];
    if (t.z < 0.0) continue;
    vec2 d = (centre - t.xy) / (uScale * 46.0);
    reach = max(reach, exp(-dot(d, d)) * exp(-t.z / (${TRAIL_LIFE.toFixed(2)} * (0.5 + r2))));
  }
  // only some pixels fire, the most sensitive ones first
  float fire = step(r1, reach * 0.8) * reach;

  // burn-in: pixels near a recent photon flash or ejected electron stay hot, then cool off slowly
  float heat = 0.0;
  for (int i = 0; i < ${MAX_BURN}; i++) {
    vec3 b = uBurn[i];
    if (b.z < 0.0) continue;
    vec2 d = (centre - b.xy) / (uScale * 20.0);
    heat = max(heat, exp(-dot(d, d)) * exp(-b.z / ${BURN_LIFE.toFixed(2)}));
  }
  float burn = step(r1 * 0.75, heat) * heat; // the most sensitive pixels burn in first

  // ring colour at this pixel (wide halo weights, so off-ring pixels still pick up the nearest ring)
  vec2 q = (centre - uCentre) / uScale;
  float onRing = 0.0;
  vec3 tint = vec3(0.0);
  float wsum = 0.0001;
  for (int i = 0; i < ${MAX_RINGS}; i++) {
    vec4 ring = uRing[i];
    if (ring.x <= 0.0) break;
    vec2 shift = vec2(-uP * ring.z * 1.5, -uP * ring.z * 2.5);
    float rad = ring.x * (1.0 + uP * ring.w * 2.0);
    float d = abs(length(q - shift) - rad);
    float hw = ring.y * 2.4 + 16.0;
    float g = exp(-(d * d) / (hw * hw));
    onRing = max(onRing, exp(-(d * d) / ((ring.y * 0.9 + 2.0) * (ring.y * 0.9 + 2.0))));
    tint += uCol[i] * g;
    wsum += g;
  }
  tint /= wsum;

  // the glow pulse passes: pixels just behind the front fire, thinning out into a trail, plus the ignition at the centre
  float dc = length(centre - uCentre);
  float behind = exp(-max(uWave.x - dc, 0.0) / (5.0 * uRem));
  float ahead = exp(-pow(max(dc - uWave.x, 0.0) / uRem, 2.0));
  float fade = exp(-max(dc - 20.0 * uRem, 0.0) / (20.0 * uRem)); // the burst weakens with distance (also keeps the text readable)
  float w = uWave.y * (dc < uWave.x ? behind : ahead) * fade + uWave.z * exp(-pow(dc / (7.0 * uRem), 2.0));
  float waveFire = step(r1, w * 0.9) * w;
  vec3 waveCol = vec3(0.43, 1.0, 0.67);

  // every pixel is faintly there (a bit stronger on the rings), each with its own gain like a real detector
  float base = mix(0.12, 0.26, onRing) * (0.5 + r2);
  vec3 baseCol = mix(tint, vec3(0.96, 0.94, 1.0), 0.25);

  // a fired pixel flashes pale, then settles into its ring's colour as it decays
  vec3 flash = vec3(0.99, 0.99, 0.75);
  vec3 col = mix(baseCol, mix(tint, flash, smoothstep(0.35, 0.9, fire)), smoothstep(0.0, 0.25, fire));
  col = mix(col, waveCol, smoothstep(0.0, 0.3, waveFire) * step(fire, waveFire));
  vec3 hot = mix(vec3(0.87, 0.29, 0.41), vec3(0.99, 0.99, 0.75), smoothstep(0.2, 0.9, burn));
  col = mix(col, hot, smoothstep(0.0, 0.25, burn) * step(max(fire, waveFire), burn));
  float lit = max(max(fire, waveFire), burn);
  float alpha = max(base, lit * mix(0.5, 1.0, onRing));   // fired pixels are fainter in the gaps between rings
  float radius = max(0.17, (0.2 + 0.22 * lit) * mix(0.8, 1.0, onRing));

  vec2 local = fract(gl_FragCoord.xy / uPitch) - 0.5;
  float aa = 0.6 / uPitch;
  float m = (1.0 - smoothstep(radius - aa, radius + aa, length(local))) * alpha;
  gl_FragColor = vec4(col * m, m);
}`;

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

/** Start the pixels on `canvas`; `art` is the ring SVG (gives the ring centre and scale). Returns a stop function. */
export function startHeroGlow(
  canvas: HTMLCanvasElement,
  art: Element,
  rings: GlowRing[],
  hero: HTMLElement,
) {
  // Reduced motion: no interaction layer at all, the rings stay as they are.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
  if (!gl) throw new Error("no webgl");

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
  gl.useProgram(prog);

  // one oversized triangle covers the screen
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const ringData = new Float32Array(MAX_RINGS * 4);
  const colData = new Float32Array(MAX_RINGS * 3);
  rings.slice(0, MAX_RINGS).forEach((ring, i) => {
    ringData.set([ring.r, ring.w, ring.depth, ring.grow], i * 4);
    colData.set(hexToRgb(ring.c), i * 3);
  });
  gl.uniform4fv(u("uRing"), ringData);
  gl.uniform3fv(u("uCol"), colData);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // pointer path: a small ring buffer of (x, y, time-stamp)
  const trail: { x: number; y: number; t: number }[] = [];
  const trailData = new Float32Array(MAX_TRAIL * 3);
  // burn-in sources: the strike flashes, the nucleus flash and the ejected electrons, sampled from the CSS animations
  const burn: { x: number; y: number; t: number }[] = [];
  const burnData = new Float32Array(MAX_BURN * 3);
  const flashes = [...hero.querySelectorAll<SVGElement>(".flash, .nucleus-flash")];
  const ejected = [...hero.querySelectorAll<SVGElement>(".e-out")]; // the groups: their animation says when the electron really flies
  const lastBurn = new Map<Element, { x: number; y: number; t: number }>();
  let lastSample = 0;
  let dpr = 1;
  const dawn = hero.querySelector(".hero-dawn");
  const wave = { r: 0, on: 0, core: 0 };
  // the pulse is a CSS animation: read its live front radius (--r, a registered length, so computed in px) and strength
  const readWave = () => {
    if (!dawn) return;
    const cs = getComputedStyle(dawn);
    wave.r = (parseFloat(cs.getPropertyValue("--r")) || 0) * dpr;
    wave.on = parseFloat(cs.opacity) || 0;
    wave.core = (parseFloat(cs.getPropertyValue("--core")) || 0) * wave.on * 0.6;
  };

  const sampleBurn = (now: number) => {
    if (now - lastSample < BURN_SAMPLE_MS) return;
    lastSample = now;
    if (hero.hasAttribute("data-paused") || hero.hasAttribute("data-held")) return;
    const h = hero.getBoundingClientRect();
    // A burn point is written once, at the spot where something happened, and then never moves: it is static on the pixels.
    const add = (el: Element, at: Element, once: boolean) => {
      const r = at.getBoundingClientRect();
      const x = (r.left + r.width / 2 - h.left) * dpr;
      const y = canvas.height - (r.top + r.height / 2 - h.top) * dpr;
      const prev = lastBurn.get(el);
      if (prev && (once ? now - prev.t < 5000 : Math.hypot(x - prev.x, y - prev.y) < 10 * dpr))
        return;
      lastBurn.set(el, { x, y, t: now });
      burn.push({ x, y, t: now });
    };
    // a flash burns where it fires, once per burst
    for (const el of flashes)
      if ((parseFloat(getComputedStyle(el).opacity) || 0) > 0.4) add(el, el, true);
    // an ejected electron burns along its flight only (not before it is struck, and not while it is gone)
    for (const el of ejected) {
      const a = el.getAnimations().find((x) => (x as CSSAnimation).animationName === "e-out");
      const prog = Number(a?.effect?.getComputedTiming().progress ?? -1);
      if (prog > 0.1 && prog < 0.145) add(el, el.querySelector(".electron")!, false);
    }
    while (burn.length > MAX_BURN) burn.shift();
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const h = hero.getBoundingClientRect();
    const a = art.getBoundingClientRect();
    canvas.width = Math.round(h.width * dpr);
    canvas.height = Math.round(h.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(
      u("uCentre"),
      (a.left + a.width / 2 - h.left) * dpr,
      canvas.height - (a.top + a.height / 2 - h.top) * dpr,
    );
    gl.uniform1f(u("uScale"), (a.width / 600) * dpr); // the SVG viewBox is 600 wide
    gl.uniform1f(u("uPitch"), 5 * dpr);
  };

  const draw = (now: number) => {
    while (trail.length && now - trail[0].t > TRAIL_LIFE * 1.5 * 1000) trail.shift();
    readWave();
    while (burn.length && now - burn[0].t > BURN_LIFE * 1.5 * 1000) burn.shift();
    dirty = trail.length > 0 || burn.length > 0 || wave.on > 0.01; // one more draw after trail and pulse end clears the canvas
    for (let i = 0; i < MAX_TRAIL; i++) {
      const p = trail[trail.length - 1 - i];
      trailData.set(p ? [p.x, p.y, (now - p.t) / 1000] : [0, 0, -1], i * 3);
    }
    for (let i = 0; i < MAX_BURN; i++) {
      const b = burn[burn.length - 1 - i];
      burnData.set(b ? [b.x, b.y, (now - b.t) / 1000] : [0, 0, -1], i * 3);
    }
    gl.uniform3fv(u("uBurn"), burnData);
    gl.uniform3fv(u("uTrail"), trailData);
    gl.uniform1f(u("uP"), parseFloat(hero.style.getPropertyValue("--p")) || 0);
    gl.uniform3f(u("uWave"), wave.r, wave.on, wave.core);
    gl.uniform1f(
      u("uRem"),
      (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) * dpr,
    );
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let visible = true;
  let raf = 0;
  let last = 0;
  let stopped = false;
  let dirty = false;

  const frame = (now: number) => {
    raf = 0;
    if (stopped || !canvas.isConnected) return;
    // idle (no live trail, no pulse, canvas already clear): nothing to draw, so just keep watching
    readWave();
    if (wave.on > 0.01 || burn.length) sampleBurn(now); // the strikes happen while the pulse passes
    // the pulse alone needs only 30 fps; pointer trails get the full rate
    const gap = trail.length ? FRAME_MS : 2 * FRAME_MS;
    if (
      visible &&
      !document.hidden &&
      (trail.length || burn.length || dirty || wave.on > 0.01) &&
      now - last >= gap - 2
    ) {
      last = now;
      draw(now);
    }
    raf = requestAnimationFrame(frame);
  };

  const onMove = (e: PointerEvent) => {
    const h = hero.getBoundingClientRect();
    const x = (e.clientX - h.left) * dpr;
    const y = canvas.height - (e.clientY - h.top) * dpr;
    const prev = trail[trail.length - 1];
    if (prev && Math.hypot(x - prev.x, y - prev.y) < MIN_STEP * dpr) return;
    trail.push({ x, y, t: performance.now() });
    dirty = true;
    if (trail.length > 64) trail.shift();
  };
  const onScroll = () => (dirty = true); // the rings move with scroll, so the pixel colours must follow
  const onLost = (e: Event) => {
    e.preventDefault();
    stop();
    hero.dataset.glow = "fallback";
  };

  const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
  const ro = new ResizeObserver(() => {
    resize();
    dirty = true; // resizing clears the canvas
  });

  io.observe(hero);
  ro.observe(hero);
  canvas.addEventListener("webglcontextlost", onLost);
  resize();
  draw(performance.now());
  hero.dataset.glow = "running";
  hero.addEventListener("pointermove", onMove, { passive: true });
  addEventListener("scroll", onScroll, { passive: true });
  raf = requestAnimationFrame(frame);

  function stop() {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    hero.removeEventListener("pointermove", onMove);
    removeEventListener("scroll", onScroll);
  }
  return stop;
}

/** The gamma burst makes the hero text fluoresce: as the pulse front passes a text block it gets a green glow (--fl, 0..1). */
export function startFluorescence(hero: HTMLElement, art: Element) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const dawn = hero.querySelector(".hero-dawn");
  const targets = [...hero.querySelectorAll<HTMLElement>(".hero-copy > *")];
  if (!dawn || !targets.length) return () => {};
  let raf = 0;
  let lit = false;
  const range = document.createRange();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!hero.isConnected) return stop();
    const cs = getComputedStyle(dawn);
    const on = parseFloat(cs.opacity) || 0;
    if (on < 0.01 && !lit) return;
    const R = parseFloat(cs.getPropertyValue("--r")) || 0;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const a = art.getBoundingClientRect();
    const cx = a.left + a.width / 2;
    const cy = a.top + a.height / 2;
    let any = false;
    for (const el of targets) {
      // the extent of the actual text (not the wider block box), so the glow starts where the letters start
      range.selectNodeContents(el);
      const r = [...range.getClientRects()].reduce(
        (u, q) => ({
          left: Math.min(u.left, q.left),
          right: Math.max(u.right, q.right),
          top: Math.min(u.top, q.top),
          bottom: Math.max(u.bottom, q.bottom),
        }),
        { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity },
      );
      if (!Number.isFinite(r.left)) continue;
      // the block's nearest and farthest points from the nucleus: the burst reaches the block at dNear and has
      // passed it entirely at dFar. The glow is on while the front is inside the block, then lingers and fades.
      const dNear = Math.hypot(
        Math.max(r.left - cx, 0, cx - r.right),
        Math.max(r.top - cy, 0, cy - r.bottom),
      );
      const dFar = Math.hypot(
        Math.max(cx - r.left, r.right - cx),
        Math.max(cy - r.top, r.bottom - cy),
      );
      // on once the front has irradiated almost all of the text, until it is well past the far end, then fades out
      const dStart = dNear + 0.92 * (dFar - dNear); // the burst has passed almost all of the text
      const arrive = Math.min(Math.max((R - dStart) / (1.5 * rem), 0), 1);
      const hold = Math.exp(-Math.max(R - dFar - 8 * rem, 0) / (14 * rem));
      const f = Math.min(on * 4, 1) * arrive * hold;
      el.style.setProperty("--fl", f.toFixed(3));
      any ||= f > 0.004;
    }
    lit = any;
  };
  raf = requestAnimationFrame(loop);
  function stop() {
    cancelAnimationFrame(raf);
    for (const el of targets) el.style.removeProperty("--fl");
  }
  return stop;
}
