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

  // every pixel is faintly there (a bit stronger on the rings), each with its own gain like a real detector
  float base = mix(0.12, 0.26, onRing) * (0.5 + r2);
  vec3 baseCol = mix(tint, vec3(0.96, 0.94, 1.0), 0.25);

  // a fired pixel flashes pale, then settles into its ring's colour as it decays
  vec3 flash = vec3(0.99, 0.99, 0.75);
  vec3 col = mix(baseCol, mix(tint, flash, smoothstep(0.35, 0.9, fire)), smoothstep(0.0, 0.25, fire));
  float alpha = max(base, fire * mix(0.5, 1.0, onRing));   // fired pixels are fainter in the gaps between rings
  float radius = max(0.17, (0.2 + 0.22 * fire) * mix(0.8, 1.0, onRing));

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
  let dpr = 1;

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
    dirty = trail.length > 0; // one more draw after the trail empties clears the canvas
    for (let i = 0; i < MAX_TRAIL; i++) {
      const p = trail[trail.length - 1 - i];
      trailData.set(p ? [p.x, p.y, (now - p.t) / 1000] : [0, 0, -1], i * 3);
    }
    gl.uniform3fv(u("uTrail"), trailData);
    gl.uniform1f(u("uP"), parseFloat(hero.style.getPropertyValue("--p")) || 0);
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
    // idle (no live trail, canvas already clear): nothing to draw, so just keep watching
    if (visible && !document.hidden && (trail.length || dirty) && now - last >= FRAME_MS - 2) {
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
