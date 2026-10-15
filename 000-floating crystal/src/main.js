import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/environments/RoomEnvironment.js';

// =========================================================================
// 1. SCENE & RENDERER SETUP
// =========================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03060b);
scene.fog = new THREE.FogExp2(0x101b25, 0.00075);

const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 2600);
camera.position.set(285, 155, 450);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Procedural studio PMREM environment gives transmission & glass realistic reflections
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new RoomEnvironment();
const envTarget = pmrem.fromScene(envScene, 0.04);
scene.environment = envTarget.texture;
envScene.dispose();
pmrem.dispose();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.045;
controls.minDistance = 160;
controls.maxDistance = 950;
controls.target.set(0, 0, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.48, 0.88);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// =========================================================================
// 2. LIGHTING SETUP
// =========================================================================
scene.add(new THREE.HemisphereLight(0xa8c9df, 0x11131a, 0.72));

const keyLight = new THREE.DirectionalLight(0xd5e7ff, 4.2);
keyLight.position.set(-280, 340, 250);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -400; keyLight.shadow.camera.right = 400;
keyLight.shadow.camera.top = 400; keyLight.shadow.camera.bottom = -400;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x777cff, 2.8);
rimLight.position.set(280, 70, -320);
scene.add(rimLight);

const greenBounce = new THREE.PointLight(0x5cf3bd, 58, 360, 2);
greenBounce.position.set(0, 20, 25);
scene.add(greenBounce);

const violetBounce = new THREE.PointLight(0x8d62ff, 48, 500, 2);
violetBounce.position.set(-100, 100, -80);
scene.add(violetBounce);

// =========================================================================
// 3. PBR TEXTURE GENERATION & LOADING
// =========================================================================
// Generate fast, reliable fallback procedural canvas textures (works under file:// or offline)
// and seamlessly hydrate with high-res PNG files from ./src/textures/ when available.
function createProceduralFallbackCanvases() {
  const w = 512, h = 512;

  // Diffuse
  const cDiff = document.createElement('canvas'); cDiff.width = w; cDiff.height = h;
  const ctxD = cDiff.getContext('2d');
  const gD = ctxD.createLinearGradient(0, 0, 0, h);
  gD.addColorStop(0, '#0c2734'); gD.addColorStop(0.45, '#15525b');
  gD.addColorStop(0.8, '#1b6e70'); gD.addColorStop(1, '#2c9c8e');
  ctxD.fillStyle = gD; ctxD.fillRect(0, 0, w, h);

  // Normal
  const cNorm = document.createElement('canvas'); cNorm.width = w; cNorm.height = h;
  const ctxN = cNorm.getContext('2d');
  ctxN.fillStyle = '#8080ff'; ctxN.fillRect(0, 0, w, h);

  // Roughness
  const cRough = document.createElement('canvas'); cRough.width = w; cRough.height = h;
  const ctxR = cRough.getContext('2d');
  ctxR.fillStyle = '#3d3d3d'; ctxR.fillRect(0, 0, w, h);

  // Emissive
  const cEmiss = document.createElement('canvas'); cEmiss.width = w; cEmiss.height = h;
  const ctxE = cEmiss.getContext('2d');
  ctxE.fillStyle = '#000000'; ctxE.fillRect(0, 0, w, h);

  // Draw 6 main vascular pathways on diffuse, emissive, and normal
  for (let t = 0; t < 6; t++) {
    const xBase = (t / 6 + 0.08) * w;
    ctxD.strokeStyle = 'rgba(64, 255, 225, 0.65)'; ctxD.lineWidth = 4;
    ctxE.strokeStyle = 'rgba(64, 255, 225, 0.95)'; ctxE.lineWidth = 3;
    ctxD.beginPath(); ctxE.beginPath();
    for (let y = 0; y <= h; y += 16) {
      const x = xBase + Math.sin(y * 0.02 + t) * 8;
      if (y === 0) { ctxD.moveTo(x, y); ctxE.moveTo(x, y); }
      else { ctxD.lineTo(x, y); ctxE.lineTo(x, y); }
    }
    ctxD.stroke(); ctxE.stroke();
  }

  // Crystal Normal
  const cCrystNorm = document.createElement('canvas'); cCrystNorm.width = w; cCrystNorm.height = h;
  const ctxCN = cCrystNorm.getContext('2d');
  ctxCN.fillStyle = '#8080ff'; ctxCN.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 4) {
    ctxCN.fillStyle = (y % 8 === 0) ? '#8072ff' : '#8090ff';
    ctxCN.fillRect(0, y, w, 2);
  }

  // Crystal Roughness
  const cCrystRough = document.createElement('canvas'); cCrystRough.width = w; cCrystRough.height = h;
  const ctxCR = cCrystRough.getContext('2d');
  ctxCR.fillStyle = '#141414'; ctxCR.fillRect(0, 0, w, h);

  return { cDiff, cNorm, cRough, cEmiss, cCrystNorm, cCrystRough };
}

const fallbacks = createProceduralFallbackCanvases();
const texLoader = new THREE.TextureLoader();

function loadPBRTexture(relPath, isColor, fallbackCanvas) {
  const tex = new THREE.CanvasTexture(fallbackCanvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;

  texLoader.load(
    relPath,
    loaded => {
      loaded.wrapS = THREE.RepeatWrapping;
      loaded.wrapT = THREE.ClampToEdgeWrapping;
      if (isColor) loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.needsUpdate = true;
      tex.image = loaded.image;
      tex.needsUpdate = true;
    },
    undefined,
    () => { /* Local file:// fallback already in place */ }
  );
  return tex;
}

const tissueDiffuseTex = loadPBRTexture('./src/textures/tissue_diffuse.png', true, fallbacks.cDiff);
const tissueNormalTex = loadPBRTexture('./src/textures/tissue_normal.png', false, fallbacks.cNorm);
const tissueRoughTex = loadPBRTexture('./src/textures/tissue_roughness.png', false, fallbacks.cRough);
const tissueEmissTex = loadPBRTexture('./src/textures/tissue_emissive.png', true, fallbacks.cEmiss);
const crystalNormalTex = loadPBRTexture('./src/textures/crystal_normal.png', false, fallbacks.cCrystNorm);
const crystalRoughTex = loadPBRTexture('./src/textures/crystal_roughness.png', false, fallbacks.cCrystRough);

// =========================================================================
// 4. CREATURE ANATOMY CONSTRUCTION
// =========================================================================
const creature = new THREE.Group();
scene.add(creature);

const animated = [];

// -------------------------------------------------------------------------
// 4A. Parametric Living Mantle (Thermal Bladder)
// -------------------------------------------------------------------------
function createMantleGeometry(radSegs = 96, hSegs = 64) {
  const geo = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const basePositions = [];
  const indices = [];

  function smoothstep(min, max, val) {
    const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  for (let j = 0; j <= hSegs; j++) {
    const v = j / hSegs;
    const y = 72 - v * 132; // +72 down to -60

    // Organic bell profile curve
    const rBase = 54 * Math.pow(Math.sin(v * Math.PI), 0.65) * (1.0 - 0.22 * v + 0.18 * Math.pow(v, 4));

    for (let i = 0; i <= radSegs; i++) {
      const u = i / radSegs;
      const theta = u * Math.PI * 2;

      // 6-lobed anatomical ribs
      const lobe = 1.0 + 0.082 * Math.cos(6 * theta) - 0.024 * Math.cos(12 * theta) + 0.035 * Math.cos(3 * theta);
      // Bell skirt frill ripples
      const skirtRipple = smoothstep(0.82, 1.0, v) * 3.6 * Math.sin(24 * theta);
      const yRipple = smoothstep(0.85, 1.0, v) * 2.2 * Math.cos(24 * theta);

      const r = Math.max(0.15, rBase * lobe + skirtRipple);
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const finalY = y + yRipple;

      positions.push(x, finalY, z);
      basePositions.push(x, finalY, z, theta, v, r);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < hSegs; j++) {
    for (let i = 0; i < radSegs; i++) {
      const a = j * (radSegs + 1) + i;
      const b = (j + 1) * (radSegs + 1) + i;
      const c = (j + 1) * (radSegs + 1) + i + 1;
      const d = j * (radSegs + 1) + i + 1;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.userData = { basePositions, radSegs, hSegs };
  return geo;
}

const mantleGeo = createMantleGeometry(96, 64);
const mantleMat = new THREE.MeshPhysicalMaterial({
  map: tissueDiffuseTex,
  normalMap: tissueNormalTex,
  normalScale: new THREE.Vector2(0.85, 0.85),
  roughnessMap: tissueRoughTex,
  roughness: 0.18,
  metalness: 0.02,
  transmission: 0.76,        // Translucent deep-sea tissue
  thickness: 9.0,            // Subsurface volume
  ior: 1.38,                 // Organic mesoglea refraction
  dispersion: 0.025,         // Subtle chromatic dispersion
  clearcoat: 0.95,           // Wet mucous membrane
  clearcoatRoughness: 0.10,
  sheen: 0.65,               // Membrane edge scattering
  sheenColor: new THREE.Color(0x72f9d6),
  iridescence: 0.35,         // Ctenophore pearlescence
  iridescenceIOR: 1.46,
  emissiveMap: tissueEmissTex,
  emissive: new THREE.Color(0x24ffd3),
  emissiveIntensity: 0.55,
  attenuationColor: new THREE.Color(0x146059),
  attenuationDistance: 30,
  side: THREE.DoubleSide
});

const mantleMesh = new THREE.Mesh(mantleGeo, mantleMat);
mantleMesh.castShadow = true;
mantleMesh.receiveShadow = true;
creature.add(mantleMesh);

// -------------------------------------------------------------------------
// 4B. Inner Visceral Sac (Digestive / Metabolic Organ)
// -------------------------------------------------------------------------
const visceraGeo = createMantleGeometry(64, 40);
const visceraMat = new THREE.MeshPhysicalMaterial({
  color: 0x0c363d,
  roughness: 0.32,
  metalness: 0.05,
  transmission: 0.48,
  thickness: 6.0,
  ior: 1.39,
  emissive: 0x094840,
  emissiveIntensity: 0.85,
  side: THREE.DoubleSide
});
const visceraMesh = new THREE.Mesh(visceraGeo, visceraMat);
visceraMesh.scale.set(0.64, 0.64, 0.64);
visceraMesh.position.y = 2;
creature.add(visceraMesh);

// -------------------------------------------------------------------------
// 4C. Bioelectric Organ & Synaptic Nucleus
// -------------------------------------------------------------------------
const core = new THREE.Group();
creature.add(core);

const nucleusGeo = new THREE.DodecahedronGeometry(13, 1);
const nucleusMat = new THREE.MeshPhysicalMaterial({
  color: 0xaaffea,
  roughness: 0.12,
  metalness: 0.08,
  transmission: 0.55,
  thickness: 4.0,
  emissive: 0x3dffb8,
  emissiveIntensity: 3.2
});
const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
core.add(nucleus);

const coreLight = new THREE.PointLight(0x52ffc6, 42, 210, 1.8);
core.add(coreLight);

// 5 Interlocking biomagnetic gimbal rings with conductive textures
const ringGroup = new THREE.Group();
core.add(ringGroup);
for (let i = 0; i < 5; i++) {
  const ringGeo = new THREE.TorusGeometry(20 + i * 4.2, 0.6 + i * 0.08, 8, 120);
  const ringMat = new THREE.MeshStandardMaterial({
    color: i % 2 ? 0x65e8c4 : 0x8adcf0,
    metalness: 0.78,
    roughness: 0.22,
    emissive: i % 2 ? 0x147562 : 0x185a75,
    emissiveIntensity: 0.95
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.set(i * 0.73, i * 0.91, i * 0.36);
  ringGroup.add(ring);
  animated.push({ obj: ring, kind: 'ring', speed: (i % 2 ? 1 : -1) * (0.14 + i * 0.038) });
}

// 6 Neural dendrite filaments branching from core to vascular nodes
const dendriteGroup = new THREE.Group();
core.add(dendriteGroup);
const dendriteMat = new THREE.MeshBasicMaterial({ color: 0x62ffda, transparent: true, opacity: 0.75 });
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2;
  const target = new THREE.Vector3(Math.cos(a) * 36, -8 + Math.sin(i * 2) * 12, Math.sin(a) * 36);
  const mid = target.clone().multiplyScalar(0.45).add(new THREE.Vector3((Math.random() - 0.5) * 8, 8, (Math.random() - 0.5) * 8));
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), mid, target]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.32, 5, false), dendriteMat);
  dendriteGroup.add(tube);
}

// -------------------------------------------------------------------------
// 4D. Biogenic Silicate Exocage (3D Physical Struts, Nodes & Plates)
// -------------------------------------------------------------------------
const cageGroup = new THREE.Group();
creature.add(cageGroup);

const cageBaseGeo = new THREE.IcosahedronGeometry(104, 1);
const cagePos = cageBaseGeo.attributes.position;
for (let i = 0; i < cagePos.count; i++) {
  const v = new THREE.Vector3().fromBufferAttribute(cagePos, i);
  const n = Math.sin(v.x * 0.08 + v.z * 0.06) * 3.5 + Math.sin(v.y * 0.12 - v.x * 0.04) * 2.8;
  v.normalize().multiplyScalar(102 + n);
  cagePos.setXYZ(i, v.x, v.y, v.z);
}
cageBaseGeo.computeVertexNormals();

// Physical Quartz Material with striation normal map
const crystalGlassMat = new THREE.MeshPhysicalMaterial({
  color: 0x9be8e4,
  roughnessMap: crystalRoughTex,
  roughness: 0.08,
  metalness: 0.03,
  transmission: 0.93,
  thickness: 7.5,
  ior: 1.54,                 // Natural quartz refraction
  dispersion: 0.045,         // Prismatic rainbow sparkles
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  normalMap: crystalNormalTex,
  normalScale: new THREE.Vector2(0.4, 0.4),
  attenuationColor: new THREE.Color(0xabf4e7),
  attenuationDistance: 45,
  side: THREE.DoubleSide,
  transparent: true
});

// Extract edges for solid 3D hexagonal struts
const edgesGeo = new THREE.EdgesGeometry(cageBaseGeo);
const edgePositions = edgesGeo.attributes.position;
const edgeCount = edgePositions.count / 2;

const strutGeo = new THREE.CylinderGeometry(0.92, 0.92, 1, 6);
const strutInstMesh = new THREE.InstancedMesh(strutGeo, crystalGlassMat, edgeCount);
strutInstMesh.castShadow = true;
strutInstMesh.receiveShadow = true;

const dummy = new THREE.Object3D();
const upVec = new THREE.Vector3(0, 1, 0);

for (let i = 0; i < edgeCount; i++) {
  const p1 = new THREE.Vector3().fromBufferAttribute(edgePositions, i * 2);
  const p2 = new THREE.Vector3().fromBufferAttribute(edgePositions, i * 2 + 1);
  const mid = p1.clone().add(p2).multiplyScalar(0.5);
  const len = p1.distanceTo(p2);
  const dir = p2.clone().sub(p1).normalize();

  dummy.position.copy(mid);
  dummy.quaternion.setFromUnitVectors(upVec, dir);
  dummy.scale.set(1, len, 1);
  dummy.updateMatrix();
  strutInstMesh.setMatrixAt(i, dummy.matrix);
}
strutInstMesh.instanceMatrix.needsUpdate = true;
cageGroup.add(strutInstMesh);

// Faceted mineral joint nodes at vertices
const nodeGeo = new THREE.IcosahedronGeometry(2.5, 1);
const nodeInstMesh = new THREE.InstancedMesh(nodeGeo, crystalGlassMat, cagePos.count);
for (let i = 0; i < cagePos.count; i++) {
  const v = new THREE.Vector3().fromBufferAttribute(cagePos, i);
  dummy.position.copy(v);
  dummy.rotation.set(v.x * 0.05, v.y * 0.05, v.z * 0.05);
  dummy.scale.setScalar(1.0);
  dummy.updateMatrix();
  nodeInstMesh.setMatrixAt(i, dummy.matrix);
}
nodeInstMesh.instanceMatrix.needsUpdate = true;
cageGroup.add(nodeInstMesh);

// Protective translucent quartz facet shield plates (covers select cage sections)
const shieldMat = new THREE.MeshPhysicalMaterial({
  color: 0x8ecbd5,
  roughness: 0.10,
  metalness: 0.02,
  transmission: 0.88,
  thickness: 5.0,
  ior: 1.54,
  dispersion: 0.035,
  clearcoat: 0.95,
  attenuationColor: new THREE.Color(0xa4ebdf),
  attenuationDistance: 38,
  transparent: true,
  opacity: 0.55,
  side: THREE.DoubleSide
});
const shieldMesh = new THREE.Mesh(cageBaseGeo, shieldMat);
shieldMesh.castShadow = true;
cageGroup.add(shieldMesh);

// -------------------------------------------------------------------------
// 4E. Biomechanical Suspensory Ligaments (Mantle-to-Cage Guy-Wires)
// -------------------------------------------------------------------------
const ligamentMat = new THREE.MeshPhysicalMaterial({
  color: 0x6dd6c4,
  roughness: 0.25,
  metalness: 0.05,
  transmission: 0.65,
  thickness: 2.0,
  emissive: 0x166657,
  emissiveIntensity: 0.35,
  transparent: true,
  opacity: 0.85
});

const ligaments = [];
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2;
  const mantleAnchor = new THREE.Vector3(Math.cos(a) * 44, -10 + Math.sin(a * 3) * 14, Math.sin(a) * 44);
  const cageAnchor = new THREE.Vector3(Math.cos(a) * 98, -8 + Math.sin(a * 2) * 22, Math.sin(a) * 98);
  const midPoint = mantleAnchor.clone().lerp(cageAnchor, 0.5).add(new THREE.Vector3(0, -6, 0));
  const curve = new THREE.CatmullRomCurve3([mantleAnchor, midPoint, cageAnchor]);
  const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.72, 6, false);
  const mesh = new THREE.Mesh(tubeGeo, ligamentMat);
  creature.add(mesh);
  ligaments.push({ mesh, curve, mantleAnchor, cageAnchor, phase: i * 0.8 });
}

// -------------------------------------------------------------------------
// 4F. Ventral Hexagonal Quartz Antennae & Emitter Gems
// -------------------------------------------------------------------------
const antennaGroup = new THREE.Group();
creature.add(antennaGroup);

const crystalSpikeMat = new THREE.MeshPhysicalMaterial({
  color: 0x98d4db,
  roughnessMap: crystalRoughTex,
  roughness: 0.08,
  metalness: 0.05,
  transmission: 0.92,
  thickness: 8.0,
  ior: 1.54,
  dispersion: 0.045,
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  normalMap: crystalNormalTex,
  attenuationColor: new THREE.Color(0x9aebe2),
  attenuationDistance: 40,
  side: THREE.DoubleSide
});

const collarMat = new THREE.MeshStandardMaterial({
  color: 0x2e6b6e,
  roughness: 0.42,
  metalness: 0.25,
  emissive: 0x0c3c3a,
  emissiveIntensity: 0.4
});

for (let i = 0; i < 5; i++) {
  const a = (i / 5) * Math.PI * 2 + 0.3;
  const root = new THREE.Vector3(Math.cos(a) * 44, -76, Math.sin(a) * 44);
  const length = 44 + (i % 3) * 10;

  const antStem = new THREE.Group();
  antStem.position.copy(root);

  // Organic fleshy basal collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.8, 5, 8), collarMat);
  collar.position.y = -2.5;
  antStem.add(collar);

  // Hexagonal crystal prism column
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.2, length, 6), crystalSpikeMat);
  shaft.position.y = -length * 0.5 - 4;
  shaft.castShadow = true;
  antStem.add(shaft);

  // Hexagonal pyramidal termination cap
  const cap = new THREE.Mesh(new THREE.ConeGeometry(3.2, 11, 6), crystalSpikeMat);
  cap.position.y = -length - 9;
  cap.rotation.x = Math.PI;
  antStem.add(cap);

  // Bioluminescent Photophore Emitter Lens at tip
  const tipJewel = new THREE.Mesh(new THREE.OctahedronGeometry(2.4, 1), new THREE.MeshBasicMaterial({ color: 0xb5ffea }));
  tipJewel.position.y = -length - 15;
  antStem.add(tipJewel);

  const lamp = new THREE.PointLight(0x75ffd4, 3.2, 55, 2);
  lamp.position.copy(tipJewel.position);
  antStem.add(lamp);

  antStem.rotation.z = Math.cos(a) * 0.22;
  antStem.rotation.x = Math.sin(a) * 0.22;
  antennaGroup.add(antStem);
}

// -------------------------------------------------------------------------
// 4G. Ventral Pelagic Feeding Tendrils (Graceful Flowing Ribbon Tentacles)
// -------------------------------------------------------------------------
const tendrils = [];
const tendrilMat = new THREE.MeshPhysicalMaterial({
  color: 0x58ccb9,
  roughness: 0.22,
  metalness: 0.03,
  transmission: 0.82,
  thickness: 2.5,
  ior: 1.36,
  sheen: 0.75,
  sheenColor: new THREE.Color(0x78fbd4),
  transparent: true,
  opacity: 0.82,
  side: THREE.DoubleSide
});

const tendrilGroup = new THREE.Group();
creature.add(tendrilGroup);

for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2;
  const length = 160 + (i % 4) * 22;
  const pts = [];
  for (let j = 0; j <= 24; j++) {
    const f = j / 24;
    pts.push(new THREE.Vector3(Math.cos(a) * 32, -60 - f * length, Math.sin(a) * 32));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.95 - (i % 3) * 0.12, 6, false);
  const mesh = new THREE.Mesh(tubeGeo, tendrilMat);
  tendrilGroup.add(mesh);

  // Spaced photophore gems along tendril
  const beads = [];
  for (let b = 0; b < 3; b++) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0x8affdd }));
    tendrilGroup.add(bead);
    beads.push({ mesh: bead, frac: 0.35 + b * 0.28 });
  }

  tendrils.push({ mesh, a, length, phase: i * 1.35, beads });
}

// -------------------------------------------------------------------------
// 4H. Dorsal Sensory Ion Whiskers
// -------------------------------------------------------------------------
const whiskers = [];
const whiskerMat = new THREE.MeshStandardMaterial({
  color: 0x81d6c5,
  roughness: 0.28,
  metalness: 0.22,
  emissive: 0x228271,
  emissiveIntensity: 0.75
});

for (let i = 0; i < 14; i++) {
  const a = (i / 14) * Math.PI * 2;
  const length = 135 + (i % 4) * 22;
  const pts = [];
  for (let j = 0; j <= 28; j++) {
    const f = j / 28;
    pts.push(new THREE.Vector3(
      Math.cos(a) * 36 + Math.sin(f * 5 + i) * 8 * f,
      72 + f * length,
      Math.sin(a) * 36 + Math.cos(f * 4 + i * 0.7) * 8 * f
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.6 + (i % 3) * 0.14, 6, false);
  const mesh = new THREE.Mesh(tubeGeo, whiskerMat);
  creature.add(mesh);
  whiskers.push({ mesh, a, length, phase: i * 1.6, baseRadius: 0.6 + (i % 3) * 0.14 });
}

// =========================================================================
// 5. SURROUNDING ENVIRONMENT & ASTROPHYSICAL PHENOMENA
// =========================================================================

// Floating basalt / lunar pumice islands
const rockMat = new THREE.MeshStandardMaterial({ color: 0x292c30, roughness: 0.98, metalness: 0.025, flatShading: true, envMapIntensity: 0.38 });
const rockTopMat = new THREE.MeshStandardMaterial({ color: 0x34383b, roughness: 0.97, metalness: 0.02, flatShading: true, envMapIntensity: 0.35 });
const islands = [];
function createIsland(x, y, z, s, seed) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
  const geo = new THREE.IcosahedronGeometry(1, 3); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const wav = Math.sin(v.x * 11 + seed) * 0.07 + Math.cos(v.y * 14 - seed) * 0.055 + Math.sin(v.z * 16 + v.x * 5) * 0.045;
    v.x *= 1 + wav; v.y *= 1 + wav; v.z *= 1 + wav;
    if (v.y < 0) v.y *= 1.6;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const rock = new THREE.Mesh(geo, rockMat); rock.scale.set(1.55, 0.63, 1.18); rock.castShadow = true; rock.receiveShadow = true; g.add(rock);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.18, 0.22, 9, 1), rockTopMat); cap.scale.set(1.48, 1, 1.12); cap.position.y = 0.27; cap.rotation.y = seed; cap.castShadow = true; g.add(cap);
  for (let k = 0; k < 5; k++) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.09 + ((k + seed) % 3) * 0.035, 0.35 + ((k * 7 + seed) % 5) * 0.11, 5), rockMat);
    shard.position.set(Math.sin(k * 12.4 + seed) * 0.8, -0.55 - Math.random() * 0.2, Math.cos(k * 7.7 + seed) * 0.6); shard.rotation.z = Math.PI + Math.random() * 0.4; g.add(shard);
  }
  scene.add(g); islands.push({ group: g, baseY: y, phase: seed });
}
createIsland(-310, -130, -120, 75, 1);
createIsland(360, 65, -240, 60, 2);
createIsland(-400, 220, -390, 42, 3);
createIsland(190, -245, -360, 83, 4);
createIsland(500, -190, -510, 47, 5);
createIsland(-130, 300, -550, 55, 6);
createIsland(50, -360, -220, 38, 7);

// Distant cratered moon
const moonGroup = new THREE.Group();
moonGroup.position.set(-640, 235, -980);
moonGroup.rotation.set(0.18, -0.38, 0.12);
scene.add(moonGroup);
const moonGeo = new THREE.IcosahedronGeometry(178, 6);
const moonPos = moonGeo.attributes.position;
for (let i = 0; i < moonPos.count; i++) {
  const v = new THREE.Vector3().fromBufferAttribute(moonPos, i);
  const n = Math.sin(v.x * 0.055 + 2.1) * 1.9 + Math.sin(v.y * 0.082 - v.z * 0.037) * 1.2 + Math.cos(v.z * 0.061 + v.x * 0.04) * 1.4;
  v.normalize().multiplyScalar(178 + n);
  moonPos.setXYZ(i, v.x, v.y, v.z);
}
moonGeo.computeVertexNormals();
const moonMat = new THREE.MeshStandardMaterial({ color: 0x62666b, roughness: 1, metalness: 0, flatShading: false, envMapIntensity: 0.18 });
const moon = new THREE.Mesh(moonGeo, moonMat); moon.receiveShadow = true; moonGroup.add(moon);
const craterMat = new THREE.MeshStandardMaterial({ color: 0x34383d, roughness: 1, metalness: 0, flatShading: true });
const craterRimMat = new THREE.MeshStandardMaterial({ color: 0x777b7f, roughness: 0.95, metalness: 0.01, flatShading: true });
for (let i = 0; i < 42; i++) {
  const dir = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
  const radius = 4 + Math.random() * 15;
  const crater = new THREE.Mesh(new THREE.CircleGeometry(radius, 9), craterMat);
  crater.position.copy(dir.clone().multiplyScalar(178.3));
  crater.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  crater.translateZ(0.3); crater.rotation.z = Math.random() * Math.PI; moonGroup.add(crater);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.91, Math.max(0.65, radius * 0.075), 5, 16), craterRimMat);
  rim.position.copy(dir.clone().multiplyScalar(179.0));
  rim.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  rim.rotation.z = Math.random() * Math.PI; moonGroup.add(rim);
}

// Distant planetary horizon
const horizon = new THREE.Mesh(new THREE.SphereGeometry(1250, 48, 24), new THREE.MeshBasicMaterial({ color: 0x111b25, side: THREE.BackSide, transparent: true, opacity: 0.44 }));
horizon.position.set(0, -280, -700); scene.add(horizon);

// Starfield
const starCount = 1900; const starPositions = new Float32Array(starCount * 3); const starColors = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 650 + Math.random() * 900, theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
  starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = r * Math.cos(phi);
  starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  const c = new THREE.Color().setHSL(0.52 + Math.random() * 0.16, 0.18, 0.48 + Math.random() * 0.48);
  starColors[i * 3] = c.r; starColors[i * 3 + 1] = c.g; starColors[i * 3 + 2] = c.b;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.05, vertexColors: true, transparent: true, opacity: 0.68, sizeAttenuation: true }));
scene.add(stars);

// Magnetic aurora curtains
const aurorae = [];
function createAurora(color, phase, depth, width, height) {
  const rows = 24, cols = 100; const vertices = [], colors = [], indices = [];
  const c = new THREE.Color(color);
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) {
    const u = x / cols, v = y / rows;
    vertices.push((u - 0.5) * width, v * height, depth);
    const fade = Math.sin(v * Math.PI) * 0.7 + 0.15;
    colors.push(c.r * fade, c.g * fade, c.b * fade);
    if (x < cols && y < rows) {
      const a = y * (cols + 1) + x, b = a + 1, d = (y + 1) * (cols + 1) + x, e = d + 1;
      indices.push(a, d, b, b, d, e);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 80, 0);
  scene.add(mesh);
  aurorae.push({ mesh, base: vertices.slice(), phase, width, height, cols, rows });
}
createAurora(0x61ffc4, 0.4, -500, 1250, 250);
createAurora(0x8e67ff, 1.8, -560, 1450, 310);
createAurora(0x65a6ff, 3.2, -620, 1550, 190);

// Atmospheric charged particles
const particleCount = 620; const particlePositions = new Float32Array(particleCount * 3); const particleVel = [];
for (let i = 0; i < particleCount; i++) {
  const a = Math.random() * Math.PI * 2, r = 130 + Math.random() * 350;
  particlePositions[i * 3] = Math.cos(a) * r;
  particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 450;
  particlePositions[i * 3 + 2] = Math.sin(a) * r;
  particleVel.push({ a, r, phase: Math.random() * Math.PI * 2, speed: 0.06 + Math.random() * 0.3 });
}
const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMat = new THREE.PointsMaterial({ color: 0x8ef5d0, size: 1.8, transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false });
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// Magnetized Black Hole swallowed sun
const blackHole = new THREE.Group();
blackHole.position.set(620, 120, -1120);
blackHole.rotation.set(0.42, -0.25, 0.18);
scene.add(blackHole);
const holeMat = new THREE.MeshBasicMaterial({ color: 0x010205 });
const holeSphere = new THREE.Mesh(new THREE.SphereGeometry(74, 64, 48), holeMat);
blackHole.add(holeSphere);
const photonRing = new THREE.Mesh(new THREE.TorusGeometry(82, 2.4, 12, 180), new THREE.MeshBasicMaterial({ color: 0xc8d5ff, transparent: true, opacity: 0.9 }));
photonRing.scale.set(1.65, 0.32, 1);
blackHole.add(photonRing);
for (let i = 0; i < 5; i++) {
  const disk = new THREE.Mesh(
    new THREE.TorusGeometry(94 + i * 10, 3.5 + (i % 2), 8, 180),
    new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff9a55 : 0x6c83ff, transparent: true, opacity: 0.22 - i * 0.025, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  disk.scale.set(1.85, 0.16 + i * 0.018, 1);
  disk.rotation.x = (i - 2) * 0.035;
  blackHole.add(disk);
  animated.push({ obj: disk, kind: 'accretion', speed: (i % 2 ? 1 : -1) * (0.08 + i * 0.018) });
}
const holeHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeRadialTexture(), color: 0x8275ff, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false }));
holeHalo.scale.set(470, 270, 1);
holeHalo.position.z = -4;
blackHole.add(holeHalo);
function makeRadialTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d'); const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,220,170,0.75)'); g.addColorStop(0.18, 'rgba(146,112,255,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

// Sulfur-rich superheated atmosphere clouds
const sulfurClouds = [];
for (let i = 0; i < 18; i++) {
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const mat = new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xb5a05b : 0x665b4c, transparent: true, opacity: 0.045 + Math.random() * 0.035, depthWrite: false, side: THREE.DoubleSide });
  const cloud = new THREE.Mesh(geo, mat);
  cloud.position.set((Math.random() - 0.5) * 1350, -80 + Math.random() * 520, -300 - Math.random() * 700);
  cloud.scale.set(55 + Math.random() * 140, 12 + Math.random() * 36, 25 + Math.random() * 70);
  scene.add(cloud);
  sulfurClouds.push({ mesh: cloud, base: cloud.position.clone(), phase: Math.random() * 6.28, drift: 5 + Math.random() * 14 });
}

// Magnetized iron-sand storm
const ironCount = 1800, ironPositions = new Float32Array(ironCount * 3), ironVel = [];
for (let i = 0; i < ironCount; i++) {
  ironPositions[i * 3] = (Math.random() - 0.5) * 1200;
  ironPositions[i * 3 + 1] = (Math.random() - 0.5) * 650;
  ironPositions[i * 3 + 2] = -100 - Math.random() * 850;
  ironVel.push({ speed: 45 + Math.random() * 180, phase: Math.random() * 6.28 });
}
const ironGeo = new THREE.BufferGeometry();
ironGeo.setAttribute('position', new THREE.BufferAttribute(ironPositions, 3));
const ironMat = new THREE.PointsMaterial({ color: 0x9ca6ad, size: 1.3, transparent: true, opacity: 0.6, depthWrite: false });
const ironStorm = new THREE.Points(ironGeo, ironMat);
scene.add(ironStorm);

// Static glass spores drifting from specimen
const sporeCount = 420, sporePositions = new Float32Array(sporeCount * 3), sporeData = [];
for (let i = 0; i < sporeCount; i++) {
  const dir = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
  const r = 110 + Math.random() * 280;
  sporePositions[i * 3] = dir.x * r; sporePositions[i * 3 + 1] = dir.y * r; sporePositions[i * 3 + 2] = dir.z * r;
  sporeData.push({ phase: Math.random() * 6.28, speed: 3 + Math.random() * 15 });
}
const sporeGeo = new THREE.BufferGeometry();
sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
const sporeMat = new THREE.PointsMaterial({ color: 0xc4fff5, size: 2.2, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
const spores = new THREE.Points(sporeGeo, sporeMat);
creature.add(spores);

// Neighbouring colony & antenna electrical links
const colony = new THREE.Group(); scene.add(colony); const colonyLinks = [];
for (let i = 0; i < 3; i++) {
  const a = (i / 3) * Math.PI * 2 + 0.6, radius = 205 + (i % 2) * 38;
  const g = new THREE.Group();
  g.position.set(Math.cos(a) * radius, 55 + Math.sin(a * 2) * 52, Math.sin(a) * radius - 35);
  g.scale.setScalar(0.34 + (i % 2) * 0.05); colony.add(g);
  const miniShell = new THREE.Mesh(new THREE.IcosahedronGeometry(62, 1), new THREE.MeshPhysicalMaterial({ color: 0x75aeb9, roughness: 0.16, metalness: 0.05, transmission: 0.62, thickness: 2, transparent: true, opacity: 0.35, side: THREE.DoubleSide, envMapIntensity: 1.1 }));
  g.add(miniShell);
  const miniCore = new THREE.Mesh(new THREE.IcosahedronGeometry(8, 2), new THREE.MeshBasicMaterial({ color: 0x78ffd0 }));
  g.add(miniCore);
  const tip = new THREE.Vector3(Math.cos(a) * radius, 55 + Math.sin(a * 2) * 52 + 42, Math.sin(a) * radius - 35);
  const mainTip = new THREE.Vector3(Math.cos(a) * 105, 130, Math.sin(a) * 105);
  const curve = new THREE.CatmullRomCurve3([mainTip, mainTip.clone().lerp(tip, 0.33).add(new THREE.Vector3(0, 35, 0)), tip]);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), new THREE.LineBasicMaterial({ color: 0x91ffe0, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }));
  scene.add(line); colonyLinks.push({ line, phase: i * 2.1 });
  animated.push({ obj: g, kind: 'colony', speed: 0.15 + i * 0.04 });
}

// Distant lightning filaments
const lightningGroup = new THREE.Group(); scene.add(lightningGroup); const lightningLines = [];
function buildLightning(seed) {
  const pts = []; let x = (Math.random() - 0.5) * 1000, y = 180 + Math.random() * 180, z = -420 - Math.random() * 180;
  pts.push(new THREE.Vector3(x, y, z));
  for (let i = 0; i < 18; i++) {
    x += (Math.random() - 0.5) * 42; y -= 10 + Math.random() * 16; z += (Math.random() - 0.5) * 16;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: seed % 2 ? 0x9a87ff : 0x8fffe0, transparent: true, opacity: 0 }));
  lightningGroup.add(line);
  lightningLines.push({ line, phase: Math.random() * 8 });
}
for (let i = 0; i < 5; i++) buildLightning(i);

// =========================================================================
// 6. ANIMATION & VITAL DYNAMICS LOOP
// =========================================================================
const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  elapsed += dt;

  // Creature gentle levitation and swimming drift
  creature.position.y = Math.sin(elapsed * 0.55) * 8;
  creature.rotation.y = elapsed * 0.055;
  creature.rotation.z = Math.sin(elapsed * 0.27) * 0.025;
  creature.rotation.x = Math.cos(elapsed * 0.22) * 0.018;

  // -----------------------------------------------------------------------
  // Vital Signs: Peristaltic Breathing & Heartbeat Pulse
  // -----------------------------------------------------------------------
  // Heartbeat pulse cycle (period ~2.2s)
  const beatTime = (elapsed % 2.2) / 2.2;
  const systolic = Math.exp(-Math.pow((beatTime - 0.12) / 0.06, 2)) * 1.0;
  const diastolic = Math.exp(-Math.pow((beatTime - 0.28) / 0.08, 2)) * 0.45;
  const pulseIntensity = systolic + diastolic;

  // Nucleus and core lighting heartbeat
  nucleus.scale.setScalar(1.0 + pulseIntensity * 0.14 + Math.sin(elapsed * 2.8) * 0.03);
  coreLight.intensity = 34 + pulseIntensity * 32;

  // Dynamic emissive intensity on living vascular tissue
  mantleMat.emissiveIntensity = 0.42 + pulseIntensity * 0.85;

  // Peristaltic traveling wave along the living mantle vertices
  const mPos = mantleGeo.attributes.position;
  const bData = mantleGeo.userData.basePositions;
  const vertCount = mPos.count;

  for (let idx = 0; idx < vertCount; idx++) {
    const k = idx * 6;
    const baseTheta = bData[k + 3];
    const baseV = bData[k + 4];
    const baseR = bData[k + 5];

    // Traveling breathing wave from apex (v=0) to margin (v=1)
    const wave = Math.sin(elapsed * 1.8 - baseV * 4.2) * 0.042;
    const pulseExpansion = pulseIntensity * 0.035 * (1.0 - baseV * 0.4);
    const rFactor = 1.0 + wave + pulseExpansion;

    const newR = Math.max(0.12, baseR * rFactor);
    const newX = Math.cos(baseTheta) * newR;
    const newZ = Math.sin(baseTheta) * newR;
    const newY = bData[k + 1] + Math.sin(elapsed * 1.8 - baseV * 3.5) * 1.4 * baseV;

    mPos.setXYZ(idx, newX, newY, newZ);
  }
  mPos.needsUpdate = true;
  mantleGeo.computeVertexNormals();

  // Viscera subtle breathing pulsation
  visceraMesh.scale.set(
    0.64 * (1.0 + Math.sin(elapsed * 1.2) * 0.025 + pulseIntensity * 0.03),
    0.64 * (1.0 + Math.cos(elapsed * 1.2) * 0.02 + pulseIntensity * 0.02),
    0.64 * (1.0 + Math.sin(elapsed * 1.2) * 0.025 + pulseIntensity * 0.03)
  );

  // Gimbal conductive rings rotation
  animated.forEach(({ obj, kind, speed }) => {
    if (kind === 'ring') { obj.rotation.x += dt * speed; obj.rotation.y += dt * speed * 0.73; }
    if (kind === 'accretion') { obj.rotation.z += dt * speed; }
    if (kind === 'colony') { obj.rotation.y += dt * speed * 0.22; }
  });

  // -----------------------------------------------------------------------
  // Trailing Pelagic Feeding Tendrils Fluid Undulation
  // -----------------------------------------------------------------------
  tendrils.forEach(td => {
    const pts = [];
    const segs = 24;
    for (let j = 0; j <= segs; j++) {
      const f = j / segs;
      const y = -60 - f * td.length;
      // Fluid drag traveling wave
      const waveX = Math.sin(elapsed * 1.5 - f * 4.5 + td.phase) * 14 * f;
      const waveZ = Math.cos(elapsed * 1.2 - f * 3.8 + td.phase) * 14 * f;
      const curlX = Math.sin(elapsed * 0.7 + td.phase) * 6 * Math.pow(f, 2);
      pts.push(new THREE.Vector3(
        Math.cos(td.a) * 32 + waveX + curlX,
        y,
        Math.sin(td.a) * 32 + waveZ
      ));
    }
    const newCurve = new THREE.CatmullRomCurve3(pts);
    const attr = td.mesh.geometry.attributes.position;
    const frames = newCurve.computeFrenetFrames(48, false);

    for (let j = 0; j <= 48; j++) {
      const point = newCurve.getPointAt(j / 48);
      const radius = Math.max(0.2, (1.0 - (j / 48) * 0.65) * 0.95);
      for (let k = 0; k <= 6; k++) {
        const theta = (k / 6) * Math.PI * 2;
        const norm = frames.normals[j].clone().multiplyScalar(Math.cos(theta) * radius);
        const binorm = frames.binormals[j].clone().multiplyScalar(Math.sin(theta) * radius);
        const v = point.clone().add(norm).add(binorm);
        attr.setXYZ(j * 7 + k, v.x, v.y, v.z);
      }
    }
    attr.needsUpdate = true;
    td.mesh.geometry.computeVertexNormals();

    // Position photophore beads along the moving curve
    td.beads.forEach(bd => {
      const pt = newCurve.getPointAt(bd.frac);
      bd.mesh.position.copy(pt);
    });
  });

  // -----------------------------------------------------------------------
  // Dorsal Sensory Ion Whiskers Fluid Wave
  // -----------------------------------------------------------------------
  whiskers.forEach(w => {
    const pts = [];
    for (let j = 0; j <= 28; j++) {
      const f = j / 28;
      pts.push(new THREE.Vector3(
        Math.cos(w.a) * 36 + Math.sin(f * 5 + elapsed * 0.8 + w.phase) * 8 * f,
        72 + f * w.length,
        Math.sin(w.a) * 36 + Math.cos(f * 4 + elapsed * 0.65 + w.phase) * 8 * f
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const attr = w.mesh.geometry.attributes.position;
    const frames = curve.computeFrenetFrames(64, false);
    for (let j = 0; j <= 64; j++) {
      const point = curve.getPointAt(j / 64);
      for (let k = 0; k <= 6; k++) {
        const theta = (k / 6) * Math.PI * 2;
        const normal = frames.normals[j].clone().multiplyScalar(Math.cos(theta) * w.baseRadius);
        const binormal = frames.binormals[j].clone().multiplyScalar(Math.sin(theta) * w.baseRadius);
        const v = point.clone().add(normal).add(binormal);
        attr.setXYZ(j * 7 + k, v.x, v.y, v.z);
      }
    }
    attr.needsUpdate = true;
    w.mesh.geometry.computeVertexNormals();
  });

  // -----------------------------------------------------------------------
  // Environment Dynamics: Islands, Clouds, Storm, Spores, Aurorae
  // -----------------------------------------------------------------------
  islands.forEach(it => {
    const gravityWave = Math.sin(elapsed * 0.18 + it.phase);
    it.group.position.y = it.baseY + gravityWave * 9;
    it.group.rotation.y = Math.sin(elapsed * 0.09 + it.phase) * 0.04;
    it.group.rotation.z = Math.sin(elapsed * 0.14 + it.phase) * 0.025;
  });

  sulfurClouds.forEach(c => {
    c.mesh.position.x = c.base.x + Math.sin(elapsed * 0.07 + c.phase) * c.drift;
    c.mesh.position.y = c.base.y + Math.sin(elapsed * 0.11 + c.phase) * 7;
    c.mesh.rotation.z = Math.sin(elapsed * 0.04 + c.phase) * 0.08;
  });

  const ip = ironStorm.geometry.attributes.position.array;
  for (let i = 0; i < ironCount; i++) {
    const k = i * 3, q = ironVel[i];
    ip[k] -= dt * q.speed;
    ip[k + 1] += Math.sin(elapsed * 1.8 + q.phase) * dt * 8;
    ip[k + 2] += Math.cos(elapsed * 0.7 + q.phase) * dt * 5;
    if (ip[k] < -650) {
      ip[k] = 650;
      ip[k + 1] = (Math.random() - 0.5) * 650;
      ip[k + 2] = -100 - Math.random() * 850;
    }
  }
  ironStorm.geometry.attributes.position.needsUpdate = true;

  const sp = spores.geometry.attributes.position.array;
  for (let i = 0; i < sporeCount; i++) {
    const k = i * 3, q = sporeData[i];
    sp[k] += dt * q.speed * (0.35 + Math.sin(elapsed + q.phase) * 0.18);
    sp[k + 1] += dt * (q.speed * 0.55 + Math.sin(elapsed * 0.6 + q.phase) * 3);
    sp[k + 2] += dt * Math.cos(q.phase) * q.speed * 0.35;
    if (Math.abs(sp[k]) > 330 || sp[k + 1] > 330 || Math.abs(sp[k + 2]) > 330) {
      const d = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(112);
      sp[k] = d.x; sp[k + 1] = d.y; sp[k + 2] = d.z;
    }
  }
  spores.geometry.attributes.position.needsUpdate = true;

  const stormPulse = 0.18 + 0.2 * (0.5 + 0.5 * Math.sin(elapsed * 1.7));
  colonyLinks.forEach(o => {
    o.line.material.opacity = stormPulse + 0.16 * (0.5 + 0.5 * Math.sin(elapsed * 3 + o.phase));
  });

  blackHole.rotation.y = 0.12 * Math.sin(elapsed * 0.025);
  holeHalo.material.opacity = 0.32 + 0.12 * (0.5 + 0.5 * Math.sin(elapsed * 0.4));
  stars.rotation.y = elapsed * 0.002;

  const pp = particles.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    const q = particleVel[i];
    q.a += dt * q.speed * 0.32;
    const r = q.r + Math.sin(elapsed * 0.5 + q.phase) * 12;
    pp[i * 3] = Math.cos(q.a) * r;
    pp[i * 3 + 1] = Math.sin(elapsed * 0.45 + q.phase) * 140 + Math.sin(q.a * 2) * 24;
    pp[i * 3 + 2] = Math.sin(q.a) * r;
  }
  particles.geometry.attributes.position.needsUpdate = true;

  aurorae.forEach(a => {
    const arr = a.mesh.geometry.attributes.position.array;
    for (let y = 0; y <= a.rows; y++) for (let x = 0; x <= a.cols; x++) {
      const k = (y * (a.cols + 1) + x) * 3, u = x / a.cols, v = y / a.rows;
      arr[k] = (u - 0.5) * a.width;
      arr[k + 1] = v * a.height + Math.sin(u * 12 + elapsed * 0.35 + a.phase) * 20 * v + Math.sin(u * 31 - elapsed * 0.5 + a.phase) * 7 * v;
      arr[k + 2] = a.base[k + 2] + Math.sin(u * 9 + elapsed * 0.4 + a.phase) * 32 + Math.sin(v * 8 + elapsed * 0.2) * 13;
    }
    a.mesh.geometry.attributes.position.needsUpdate = true;
    a.mesh.geometry.computeVertexNormals();
    a.mesh.material.opacity = 0.075 + 0.065 * (0.5 + 0.5 * Math.sin(elapsed * 0.3 + a.phase));
  });

  lightningLines.forEach(o => {
    const cycle = (elapsed + o.phase) % 7;
    o.line.material.opacity = cycle < 0.16 ? 0.95 : cycle < 0.28 ? 0.25 : 0;
  });

  controls.update();
  composer.render();
}

// Window resize & camera reset
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'r') {
    camera.position.set(285, 155, 450);
    controls.target.set(0, 0, 0);
    controls.update();
  }
});

setTimeout(() => {
  const el = document.getElementById('loading');
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 900);
  }
}, 900);

animate();
