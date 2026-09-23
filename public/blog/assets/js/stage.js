import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const YELLOW = 0xffb200;
const RED = 0xd0362e;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOut(t) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}

function bokehTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  const glow = g.createRadialGradient(64, 64, 0, 64, 64, 62);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.18, "rgba(255,255,255,0.72)");
  glow.addColorStop(0.45, "rgba(255,255,255,0.16)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function bladeShape() {
  const s = new THREE.Shape();
  s.moveTo(0.04, 0.02);
  s.lineTo(0.2, 1.18);
  s.quadraticCurveTo(0.58, 0.78, 0.1, 0.02);
  s.closePath();
  return new THREE.ShapeGeometry(s, 8);
}

function watchVisibility(el, onChange) {
  let visible = true;
  const io = new IntersectionObserver(function (entries) {
    visible = entries.some(function (entry) { return entry.isIntersecting; });
    onChange(visible && document.visibilityState !== "hidden");
  }, { threshold: 0.08 });
  io.observe(el);
  document.addEventListener("visibilitychange", function () {
    onChange(visible && document.visibilityState !== "hidden");
  });
}

export function mountViewfinder(canvas, hero) {
  if (reducedMotion() || !canvas || !hero) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
  } catch (err) {
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.z = 7.2;

  const tex = bokehTexture();
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    premultipliedAlpha: false,
    toneMapped: false
  });
  const count = 42;
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, count);
  const dummy = new THREE.Object3D();
  const palette = [YELLOW, RED, 0xffe2a8, 0xfff6e4, RED];
  const seeds = [];
  for (let i = 0; i < count; i++) {
    const z = (Math.random() - 0.5) * 4.2;
    const spread = 5.4 + Math.random() * 1.6;
    seeds.push({
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * 3.6,
      z: z,
      sx: 0.28 + Math.random() * 1.35,
      sy: 0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.25 + Math.random() * 0.45
    });
    seeds[i].sy = seeds[i].sx * (0.16 + Math.random() * 0.2);
    mesh.setColorAt(i, new THREE.Color(palette[i % palette.length]));
  }
  scene.add(mesh);

  const iris = new THREE.Group();
  const bladeGeo = bladeShape();
  const bladeMat = new THREE.MeshBasicMaterial({
    color: 0x070707,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const blades = [];
  const bladeCount = 8;
  for (let i = 0; i < bladeCount; i++) {
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    iris.add(blade);
    blades.push(blade);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.014, 12, 72),
    new THREE.MeshBasicMaterial({ color: YELLOW, toneMapped: false })
  );
  const ringOuter = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.005, 10, 72),
    new THREE.MeshBasicMaterial({ color: RED, toneMapped: false })
  );
  iris.add(ring);
  iris.add(ringOuter);
  scene.add(iris);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  function onPointer(e) {
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }
  hero.addEventListener("pointermove", onPointer);

  const clock = new THREE.Clock();
  const started = performance.now();
  let raf = 0;
  let running = true;

  function layoutIris(open) {
    for (let i = 0; i < blades.length; i++) {
      const a = (i / blades.length) * Math.PI * 2 + open * 0.85;
      const r = 0.18 + open * 1.12;
      blades[i].position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      blades[i].rotation.z = a + Math.PI * 0.5;
    }
    const scale = 0.42 + open * 1.05;
    ring.scale.setScalar(scale);
    ringOuter.scale.setScalar(scale * 1.04);
  }

  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame() {
    if (!running) {
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    const open = easeOut((performance.now() - started) / 1700);
    layoutIris(open);

    const wide = window.innerWidth >= 800;
    iris.visible = wide;
    iris.position.x = 2.35 + pointer.x * 0.38;
    iris.position.y = 0.2 - pointer.y * 0.28;
    iris.rotation.z = pointer.x * 0.08 + Math.sin(t * 0.35) * 0.02;
    iris.scale.setScalar(1);
    camera.position.x = pointer.x * 0.18;
    camera.position.y = -pointer.y * 0.1;

    for (let i = 0; i < seeds.length; i++) {
      const p = seeds[i];
      const drift = Math.sin(t * p.speed + p.phase) * 0.16;
      dummy.position.set(
        p.x + pointer.x * (0.12 + p.z * 0.08),
        p.y + drift - pointer.y * (0.08 + p.z * 0.05),
        p.z
      );
      dummy.scale.set(p.sx, p.sy, 1);
      dummy.rotation.z = p.phase * 0.2;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function setRunning(next) {
    running = next;
    if (running && !raf) frame();
  }

  resize();
  window.addEventListener("resize", resize);
  watchVisibility(hero, setRunning);
  setRunning(true);
}

export function mountGrade(hero) {
  if (reducedMotion() || !hero) return;
  const img = hero.querySelector(".post-hero-img");
  if (!img) return;
  const canvas = document.createElement("canvas");
  canvas.className = "grade-canvas";
  canvas.setAttribute("aria-hidden", "true");
  img.insertAdjacentElement("afterend", canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance"
    });
  } catch (err) {
    canvas.remove();
    return;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uMap: { value: null },
    uTexScale: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) }
  };
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: [
      "varying vec2 vUv;",
      "void main() {",
      "  vUv = uv;",
      "  gl_Position = vec4(position.xy, 0.0, 1.0);",
      "}"
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "uniform sampler2D uMap;",
      "uniform vec2 uTexScale;",
      "uniform float uTime;",
      "uniform float uScroll;",
      "uniform vec2 uPointer;",
      "varying vec2 vUv;",
      "float hash(vec2 p) {",
      "  vec3 p3 = fract(vec3(p.xyx) * 0.1031);",
      "  p3 += dot(p3, p3.yzx + 33.33);",
      "  return fract((p3.x + p3.y) * p3.z);",
      "}",
      "void main() {",
      "  vec2 uv = (vUv - 0.5) * uTexScale + 0.5;",
      "  float ken = 1.0 - uScroll * 0.055;",
      "  uv = (uv - 0.5) / ken + 0.5;",
      "  uv += (uPointer - 0.5) * 0.018;",
      "  uv = clamp(uv, 0.001, 0.999);",
      "  vec3 col = texture2D(uMap, uv).rgb;",
      "  col = (col - 0.5) * 1.05 + 0.5;",
      "  col *= vec3(1.03, 0.99, 0.95);",
      "  float luma = dot(col, vec3(0.299, 0.587, 0.114));",
      "  col = mix(vec3(luma), col, 1.08);",
      "  vec2 leakC = vec2(mix(-0.05, 1.05, uScroll), mix(0.88, 0.18, uScroll));",
      "  vec2 d = uv - leakC;",
      "  d.x *= 0.55;",
      "  float leak = exp(-dot(d, d) * 3.4);",
      "  col += vec3(1.0, 0.5, 0.1) * leak * 0.62;",
      "  col += vec3(0.75, 0.1, 0.05) * leak * leak * 0.35;",
      "  float vig = smoothstep(0.9, 0.28, length(vUv - 0.5));",
      "  col *= mix(0.7, 1.0, vig);",
      "  float g = hash(gl_FragCoord.xy + fract(uTime) * 40.0) - 0.5;",
      "  col += g * 0.05;",
      "  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);",
      "}"
    ].join("\n")
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  window.addEventListener("pointermove", function (e) {
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.tx = (e.clientX - rect.left) / rect.width;
    pointer.ty = 1 - (e.clientY - rect.top) / rect.height;
  }, { passive: true });

  function coverScale() {
    const frame = hero.clientWidth / Math.max(1, hero.clientHeight);
    const image = (img.naturalWidth || 16) / Math.max(1, img.naturalHeight || 9);
    if (image > frame) {
      uniforms.uTexScale.value.set(frame / image, 1);
    } else {
      uniforms.uTexScale.value.set(1, image / frame);
    }
  }

  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    coverScale();
  }

  const clock = new THREE.Clock();
  let raf = 0;
  let onScreen = true;
  let running = false;
  let ready = false;

  function scrollAmt() {
    const rect = hero.getBoundingClientRect();
    const total = Math.max(rect.height, 1);
    return Math.min(1, Math.max(0, -rect.top / total));
  }

  function frame() {
    if (!running || !ready) {
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uScroll.value = scrollAmt();
    uniforms.uPointer.value.set(pointer.x, pointer.y);
    renderer.render(scene, camera);
  }

  function setRunning(next) {
    onScreen = next;
    running = onScreen && ready;
    if (running && !raf) frame();
  }

  function bootTexture() {
    const loader = new THREE.TextureLoader();
    loader.load(img.currentSrc || img.src, function (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      uniforms.uMap.value = texture;
      ready = true;
      resize();
      hero.classList.add("is-graded");
      running = onScreen;
      if (running && !raf) frame();
    });
  }

  if (img.complete && img.naturalWidth) bootTexture();
  else img.addEventListener("load", bootTexture, { once: true });

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", function () {
    if (ready) uniforms.uScroll.value = scrollAmt();
  }, { passive: true });
  watchVisibility(hero, setRunning);
}
