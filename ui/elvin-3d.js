// ============================================================
// ELVIN 3D (three.js) — shows exactly the Wardrobe Engine parts
// ============================================================
// Reads only wardrobe.parts (the same list that goes to BAZIS):
// axis-aligned boxes, Elvin axes X = width, Y = depth (Y = 0 is the
// FRONT), Z = height, millimetres. three.js: x = X, y = Z, z = -Y, metres,
// so the front of the wardrobe faces the camera.
// ============================================================

// "three" and "three/addons/" come from the importmap in index.html
// (OrbitControls itself imports the bare specifier "three").
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const ROLE_STYLE = {
  side: { color: 0xc8a57a }, top: { color: 0xc8a57a }, bottom: { color: 0xc8a57a },
  partition: { color: 0xbf9b70 }, shelf: { color: 0xd8b98f },
  plinth: { color: 0x8d7158 }, back: { color: 0x7a5a3c },
  facade: { color: 0xe6e9ee, opacity: 0.55 }, filler: { color: 0x9fb4c8 }
};
const ROLE_LABEL = {
  side: "боковина", top: "кришка", bottom: "дно", partition: "стійка", shelf: "полиця",
  plinth: "цоколь", back: "задня стінка", facade: "фасад", filler: "планка"
};

let current = null;

/**
 * Mount (or re-mount) the viewer into `host`.
 * @param {HTMLElement} host
 * @param {Array} parts   wardrobe.parts
 * @param {Object} ui     { info, controls: HTMLElement, problems: Set of part ids
 *                          with Engine errors, onSelect(id|null) }
 * Returns { select(id), dispose() }.
 */
export function mountElvin3D(host, parts, ui = {}) {
  if (current) current.dispose();
  current = createViewer(host, parts, ui);
  return current;
}

function createViewer(host, parts, ui) {
  host.innerHTML = "";
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  // Dimension labels are HTML on top of the canvas.
  const labels = new CSS2DRenderer();
  labels.domElement.style.cssText = "position:absolute;top:0;left:0;pointer-events:none";
  host.style.position = "relative";
  host.appendChild(labels.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const sky = new THREE.HemisphereLight(0xffffff, 0x4a5563, 2.2);
  scene.add(sky);
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(-3, 6, 8);
  scene.add(sun, sun.target);

  // Door hinges: in each module the left half of the facades opens to the
  // left, the right half to the right (a single door opens to the left).
  // Visual only — the hinge side is not part of the Engine data.
  const facadeSpan = {};
  for (const p of parts) {
    if (p.role !== "facade") continue;
    const k = p.module ?? 0, x0 = +p.x_mm, x1 = +p.x_mm + +p.size_x_mm;
    const r = facadeSpan[k] || (facadeSpan[k] = { x0, x1 });
    r.x0 = Math.min(r.x0, x0); r.x1 = Math.max(r.x1, x1);
  }
  const openers = [];

  const group = new THREE.Group();
  scene.add(group);
  const meshes = [];
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b2118 });
  for (const p of parts) {
    const sx = +p.size_x_mm || 0, sy = +p.size_y_mm || 0, sz = +p.size_z_mm || 0;
    if (!(sx > 0 && sy > 0 && sz > 0)) continue;
    const style = ROLE_STYLE[p.role] || { color: 0xb0b0b0 };
    const mat = new THREE.MeshStandardMaterial({ color: style.color, roughness: 0.8,
      transparent: !!style.opacity, opacity: style.opacity ?? 1 });
    const geo = new THREE.BoxGeometry(sx / 1000, sz / 1000, sy / 1000);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = mesh.receiveShadow = true;
    const center = new THREE.Vector3((+p.x_mm + sx / 2) / 1000, (+p.z_mm + sz / 2) / 1000, -(+p.y_mm + sy / 2) / 1000);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
    mesh.add(edges);
    mesh.userData = { part: p, baseColor: style.color, edges, problem: !!ui.problems?.has(p.id) };
    if (p.role === "facade") {
      // A pivot on the hinge line (door) or the front plane (drawer) moves the facade when opened.
      const span = facadeSpan[p.module ?? 0];
      const leftHinge = (+p.x_mm + sx / 2) <= (span.x0 + span.x1) / 2;
      const pivot = new THREE.Group();
      pivot.position.set(leftHinge ? +p.x_mm / 1000 : (+p.x_mm + sx) / 1000, center.y, -(+p.y_mm) / 1000);
      mesh.position.copy(center).sub(pivot.position);
      pivot.add(mesh);
      group.add(pivot);
      openers.push({ pivot, drawer: p.kind === "drawer", sign: leftHinge ? -1 : 1, depth: 0.45 * sy / 1000 + 0.3 });
    } else {
      mesh.position.copy(center);
      group.add(mesh);
    }
    meshes.push(mesh);
  }

  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z, 0.3);
  const views = {
    iso: () => camera.position.set(center.x - radius * 0.9, center.y + radius * 0.5, center.z + radius * 1.7),
    front: () => camera.position.set(center.x, center.y, center.z + radius * 2.1)
  };
  const setView = name => { views[name](); controls.target.copy(center); controls.update(); };
  setView("iso");

  // Exploded view: every top-level object moves away from the centre.
  for (const o of group.children) {
    const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
    o.userData.base = o.position.clone();
    o.userData.dir = c.sub(center).multiplyScalar(0.45);
  }
  let explodeTarget = 0, explodeNow = 0;

  // Dimensions: carcass width / height / depth and each module's width (mm),
  // read from the same parts (facades and fillers are outside the carcass).
  const dims = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color: 0x7f93a8 });
  // The HDF back sits behind the carcass and is not part of its size.
  const carcass = parts.filter(p => !["facade", "filler", "back"].includes(p.role) && +p.size_x_mm > 0);
  const mm = (f, k) => Math[f](...carcass.map(k));
  if (carcass.length) {
    const X0 = mm("min", p => +p.x_mm), X1 = mm("max", p => +p.x_mm + +p.size_x_mm);
    const Z0 = mm("min", p => +p.z_mm), Z1 = mm("max", p => +p.z_mm + +p.size_z_mm);
    const Y0 = mm("min", p => +p.y_mm), Y1 = mm("max", p => +p.y_mm + +p.size_y_mm);
    const v = (x, y, z) => new THREE.Vector3(x / 1000, y / 1000, -z / 1000);
    const dim = (a, b, text, tick) => {
      dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat));
      for (const q of [a, b]) dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([q.clone().sub(tick), q.clone().add(tick)]), lineMat));
      const el = document.createElement("div");
      el.textContent = text;
      el.style.cssText = "font:600 12px Arial;color:#0d1117;background:#e9edf2;border-radius:6px;padding:2px 6px;white-space:nowrap";
      const label = new CSS2DObject(el);
      label.position.copy(a).add(b).multiplyScalar(0.5);
      dims.add(label);
    };
    const yTop = box.max.y * 1000, up = new THREE.Vector3(0, 0.03, 0), side = new THREE.Vector3(0.03, 0, 0);
    dim(v(X0, yTop + 300, Y0), v(X1, yTop + 300, Y0), Math.round(X1 - X0) + "", up);
    const modules = [...new Set(carcass.map(p => p.module).filter(m => m !== undefined))];
    if (modules.length > 1) for (const m of modules) {
      const ps = carcass.filter(p => p.module === m);
      const a = Math.min(...ps.map(p => +p.x_mm)), b = Math.max(...ps.map(p => +p.x_mm + +p.size_x_mm));
      dim(v(a, yTop + 70, Y0), v(b, yTop + 70, Y0), Math.round(b - a) + "", up);
    }
    const xLeft = box.min.x * 1000 - 80;
    dim(v(xLeft, Z0, Y0), v(xLeft, Z1, Y0), Math.round(Z1 - Z0) + "", side);
    const xRight = box.max.x * 1000 + 80;
    dim(v(xRight, Z1, Y0), v(xRight, Z1, Y1), Math.round(Y1 - Y0) + "", up);
  }
  scene.add(dims);

  // Visualisation: a room (floor + wall), shadows, order colours, opaque facades.
  const room = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(radius * 6, radius * 6), new THREE.MeshStandardMaterial({ color: 0xd9d4cc, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(center.x, box.min.y - 0.001, box.min.z + radius * 2);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(radius * 6, radius * 3), new THREE.MeshStandardMaterial({ color: 0xf2efea, roughness: 1 }));
  wall.position.set(center.x, box.min.y + radius * 1.5, box.min.z - 0.002);
  floor.receiveShadow = wall.receiveShadow = true;
  room.add(floor, wall);
  room.visible = false;
  scene.add(room);
  sun.position.set(center.x - radius * 1.2, center.y + radius * 2, center.z + radius * 2.2);
  sun.target.position.copy(center);
  Object.assign(sun.shadow.camera, { left: -radius * 1.5, right: radius * 1.5, top: radius * 1.5, bottom: -radius * 1.5, near: 0.1, far: radius * 8 });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;

  const colours = { carcass: 0xc8a57a, facade: 0xf1efe9 };
  let viz = false;
  const applyLook = () => {
    scene.background = new THREE.Color(viz ? 0xe9e6e1 : 0x0d1117);
    room.visible = viz;
    sun.castShadow = viz;
    sky.intensity = viz ? 1.6 : 2.2;
    for (const m of meshes) {
      const role = m.userData.part.role, style = ROLE_STYLE[role] || { color: 0xb0b0b0 };
      const colour = !viz ? (m.userData.problem ? 0xe06c6c : style.color) : role === "facade" ? colours.facade
        : role === "back" ? style.color : colours.carcass;
      m.userData.baseColor = colour;
      if (m !== selected) m.material.color.setHex(colour);
      m.material.transparent = !viz && !!style.opacity;
      m.material.opacity = viz ? 1 : style.opacity ?? 1;
      m.material.needsUpdate = true;
      m.userData.edges.visible = !viz;
    }
  };

  let openTarget = 0, openNow = 0;

  // Click a part -> its size, edges and note (same data as in the part list and BAZIS).
  let selected = null;
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let downAt = null;
  renderer.domElement.addEventListener("pointerdown", e => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(meshes.filter(m => m.visible), false)[0];
    selectMesh(hit ? hit.object : null);
    ui.onSelect?.(selected ? selected.userData.part.id : null);
  });
  function selectMesh(mesh) {
    if (selected) selected.material.color.setHex(selected.userData.baseColor);
    selected = mesh;
    if (selected) selected.material.color.setHex(0x5fb3ff);
    if (ui.info) ui.info.textContent = selected ? describe(selected.userData.part) : "Натисніть на деталь, щоб побачити її розміри.";
  }

  // Toolbar: facades on/off, back on/off, views, fullscreen.
  if (ui.controls) {
    ui.controls.innerHTML = "";
    const button = (label, onClick) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "viewBtn"; b.textContent = label;
      b.addEventListener("click", () => onClick(b));
      ui.controls.appendChild(b);
      return b;
    };
    const toggle = (role, on, off) => {
      if (!meshes.some(m => m.userData.part.role === role)) return;
      button(on, b => {
        const show = b.textContent === off;
        meshes.filter(m => m.userData.part.role === role).forEach(m => { m.visible = show; });
        b.textContent = show ? on : off;
      });
    };
    button("Візуалізація", b => { viz = !viz; b.textContent = viz ? "Креслення" : "Візуалізація"; applyLook(); });
    if (openers.length) button("Відчинити фасади", b => { openTarget = openTarget ? 0 : 1; b.textContent = openTarget ? "Зачинити фасади" : "Відчинити фасади"; });
    // Dimensions belong to the assembled wardrobe, so they hide while it is taken apart.
    let dimsShown = true;
    button("Розібрати", b => {
      explodeTarget = explodeTarget ? 0 : 1;
      b.textContent = explodeTarget ? "Зібрати" : "Розібрати";
      dims.visible = !explodeTarget && dimsShown;
    });
    if (dims.children.length) button("Сховати розміри", b => {
      dimsShown = !dimsShown;
      dims.visible = dimsShown && !explodeTarget;
      b.textContent = dimsShown ? "Сховати розміри" : "Показати розміри";
    });
    toggle("facade", "Сховати фасади", "Показати фасади");
    toggle("back", "Сховати задню стінку", "Показати задню стінку");
    button("Спереду", () => setView("front"));
    button("3D", () => setView("iso"));
    if (host.requestFullscreen) button("На весь екран", () => host.requestFullscreen());
  }

  const resize = () => {
    const w = host.clientWidth || 600, h = host.clientHeight || 400;
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  let alive = true;
  const loop = () => {
    if (!alive) return;
    // Doors swing up to 100 degrees, drawers slide out; eased towards the target.
    if (Math.abs(openNow - openTarget) > 0.001 || Math.abs(explodeNow - explodeTarget) > 0.001) {
      openNow += (openTarget - openNow) * 0.12;
      explodeNow += (explodeTarget - explodeNow) * 0.12;
      for (const o of group.children) o.position.copy(o.userData.base).addScaledVector(o.userData.dir, explodeNow);
      for (const o of openers) {
        if (o.drawer) o.pivot.position.z += o.depth * openNow;
        else o.pivot.rotation.y = o.sign * openNow * Math.PI * 100 / 180;
      }
    }
    controls.update(); renderer.render(scene, camera); labels.render(scene, camera); requestAnimationFrame(loop);
  };
  loop();

  // Apply the drawing look once so problem parts are red from the start.
  applyLook();

  return {
    select(id) {
      selectMesh(meshes.find(m => m.userData.part.id === id) || null);
    },
    dispose() {
      alive = false;
      observer.disconnect();
      controls.dispose();
      meshes.forEach(m => { m.geometry.dispose(); m.material.dispose(); });
      renderer.dispose();
      host.innerHTML = "";
    }
  };
}

function describe(p) {
  const dims = [p.size_x_mm, p.size_y_mm, p.size_z_mm].filter(v => v !== p.thickness_mm).sort((a, b) => b - a);
  const edges = p.edges ? Object.entries(p.edges).filter(([, v]) => v).map(([k, v]) => k + ": " + v).join(", ") : "";
  return (p.name || p.id) + (ROLE_LABEL[p.role] ? " (" + ROLE_LABEL[p.role] + ")" : "") +
    " · " + dims.join(" × ") + " × " + p.thickness_mm + " мм" +
    (p.material ? " · " + p.material : "") + (edges ? " · кромка " + edges : "") + (p.note ? " · " + p.note : "");
}
