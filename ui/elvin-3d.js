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
 * @param {Object} ui     { info: HTMLElement, controls: HTMLElement }
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
  host.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a5563, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(-3, 6, 8);
  scene.add(sun);

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
    mesh.position.set((+p.x_mm + sx / 2) / 1000, (+p.z_mm + sz / 2) / 1000, -(+p.y_mm + sy / 2) / 1000);
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    mesh.userData.part = p;
    mesh.userData.baseColor = style.color;
    group.add(mesh);
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
    if (selected) selected.material.color.setHex(selected.userData.baseColor);
    selected = hit ? hit.object : null;
    if (selected) selected.material.color.setHex(0x5fb3ff);
    if (ui.info) ui.info.textContent = selected ? describe(selected.userData.part) : "Натисніть на деталь, щоб побачити її розміри.";
  });

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
    toggle("facade", "Сховати фасади", "Показати фасади");
    toggle("back", "Сховати задню стінку", "Показати задню стінку");
    button("Спереду", () => setView("front"));
    button("3D", () => setView("iso"));
    if (host.requestFullscreen) button("На весь екран", () => host.requestFullscreen());
  }

  const resize = () => {
    const w = host.clientWidth || 600, h = host.clientHeight || 400;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  let alive = true;
  const loop = () => { if (!alive) return; controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); };
  loop();

  return {
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
