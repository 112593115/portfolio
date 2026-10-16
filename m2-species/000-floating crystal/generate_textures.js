const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG Encoder using pure Node.js
function createPNG(width, height, rgbaBuffer) {
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c;
    }
    
    let crc = 0 ^ (-1);
    for (let i = 0; i < typeBuf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ typeBuf[i]) & 0xFF];
    }
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
    }
    crc = (crc ^ (-1)) >>> 0;
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0;
    rgbaBuffer.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(scanlines, { level: 6 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const outDir = 'C:\\Users\\admin\\Desktop\\作業\\物件導向\\3floating_crystal_vscode\\floating_crystal_vscode\\src\\textures';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const W = 1024, H = 1024;

// 1. Generate Tissue Diffuse, Emissive, Height, and Roughness buffers simultaneously
const diffBuf = Buffer.alloc(W * H * 4);
const emissBuf = Buffer.alloc(W * H * 4);
const roughBuf = Buffer.alloc(W * H * 4);
const heightMap = new Float32Array(W * H);

// Simplex-like smooth noise helper
function smoothNoise(nx, ny) {
  const s1 = Math.sin(nx * 18.3 + ny * 22.1);
  const s2 = Math.cos(nx * 37.7 - ny * 31.4);
  const s3 = Math.sin(nx * 73.1 + ny * 67.8);
  return s1 * 0.5 + s2 * 0.35 + s3 * 0.15;
}

// Precompute vascular branches: 6 primary trunks
const numTrunks = 6;
const trunkPaths = [];
for (let t = 0; t < numTrunks; t++) {
  const baseU = t / numTrunks;
  const branches = [];
  // 32 secondary branches per trunk
  for (let b = 0; b < 32; b++) {
    const vStart = 0.12 + (b / 32) * 0.78;
    const dir = (b % 2 === 0 ? 1 : -1);
    const lenU = 0.045 + (Math.sin(b * 12.3) * 0.5 + 0.5) * 0.055;
    const lenV = 0.035 + (Math.cos(b * 7.7) * 0.5 + 0.5) * 0.045;
    branches.push({ vStart, dir, lenU, lenV });
  }
  trunkPaths.push({ baseU, branches });
}

console.log("Generating biological tissue maps...");

for (let y = 0; y < H; y++) {
  const v = y / H; // 0 = apex, 1 = margin
  
  // Base anatomical color gradient:
  // v = 0.0: apex - deep cyan #0b2733
  // v = 0.4: belly - translucent turquoise #134e56 & jade #1a6b6d
  // v = 0.75: waist - deep oceanic emerald #155557
  // v = 1.0: margin - bright luminous aquamarine #278f84
  let baseR, baseG, baseB;
  if (v < 0.45) {
    const t = v / 0.45;
    baseR = 11 + t * 8;
    baseG = 39 + t * 39;
    baseB = 51 + t * 35;
  } else if (v < 0.8) {
    const t = (v - 0.45) / 0.35;
    baseR = 19 + t * 2;
    baseG = 78 + t * 7;
    baseB = 86 + t * 1;
  } else {
    const t = (v - 0.8) / 0.2;
    baseR = 21 + t * 18;
    baseG = 85 + t * 58;
    baseB = 87 + t * 45;
  }

  for (let x = 0; x < W; x++) {
    const u = x / W;
    const theta = u * Math.PI * 2;
    const idx = (y * W + x) * 4;

    // Organic cellular noise (epidermal cells)
    const n = smoothNoise(u, v);
    const cellNoise = Math.sin(theta * 36 + n * 4) * Math.cos(v * 48 - n * 3);
    
    // 6-lobed anatomical ribs
    const rib = Math.cos(theta * 6) * 0.5 + 0.5;
    const ribGroove = Math.sin(theta * 6);

    // Compute proximity to vascular network
    let veinDist = 1.0;
    let veinIntensity = 0.0;
    let photophoreGlow = 0.0;

    for (let t = 0; t < numTrunks; t++) {
      const trunk = trunkPaths[t];
      // Trunk line with organic harmonic wander
      const trunkU = (trunk.baseU + Math.sin(v * 9.4 + t) * 0.012 + 1.0) % 1.0;
      let du = Math.abs(u - trunkU);
      if (du > 0.5) du = 1.0 - du;
      
      // Distance in normalized texture space
      const dTrunk = du * 1.6;
      if (dTrunk < 0.016) {
        const falloff = 1.0 - dTrunk / 0.016;
        if (falloff > veinIntensity) {
          veinIntensity = falloff;
        }
      }

      // Check secondary branches
      for (let b = 0; b < trunk.branches.length; b++) {
        const br = trunk.branches[b];
        const dv = v - br.vStart;
        if (dv >= 0 && dv < br.lenV) {
          const targetU = (trunkU + br.dir * (dv / br.lenV) * br.lenU + 1.0) % 1.0;
          let dBranchU = Math.abs(u - targetU);
          if (dBranchU > 0.5) dBranchU = 1.0 - dBranchU;
          if (dBranchU < 0.009) {
            const brFalloff = (1.0 - dBranchU / 0.009) * (1.0 - dv / br.lenV);
            if (brFalloff > veinIntensity) {
              veinIntensity = brFalloff;
            }
          }
        }
      }

      // Photophores along margin
      if (v > 0.86 && v < 0.94) {
        const marginU = (trunk.baseU + 1.0 / 12) % 1.0;
        let dMarg = Math.abs(u - marginU);
        if (dMarg > 0.5) dMarg = 1.0 - dMarg;
        const dSpot = Math.hypot(dMarg * 2.5, (v - 0.9) * 4.0);
        if (dSpot < 0.04) {
          photophoreGlow = Math.max(photophoreGlow, 1.0 - dSpot / 0.04);
        }
      }
    }

    // Blend Albedo
    let r = baseR + n * 8 + cellNoise * 5 + rib * 12;
    let g = baseG + n * 16 + cellNoise * 10 + rib * 22;
    let b = baseB + n * 14 + cellNoise * 8 + rib * 18;

    // Subsurface vein coloring
    if (veinIntensity > 0) {
      r = r * (1 - veinIntensity * 0.4) + 40 * veinIntensity;
      g = g * (1 - veinIntensity * 0.2) + 210 * veinIntensity;
      b = b * (1 - veinIntensity * 0.1) + 225 * veinIntensity;
    }

    // Photophore bright spots
    if (photophoreGlow > 0) {
      r += photophoreGlow * 120;
      g += photophoreGlow * 255;
      b += photophoreGlow * 240;
    }

    diffBuf[idx] = Math.max(0, Math.min(255, Math.floor(r)));
    diffBuf[idx + 1] = Math.max(0, Math.min(255, Math.floor(g)));
    diffBuf[idx + 2] = Math.max(0, Math.min(255, Math.floor(b)));
    diffBuf[idx + 3] = 255;

    // Emissive Map: Glowing vascular channels and photophores
    const eGlow = Math.pow(veinIntensity, 1.4) * 0.85 + Math.pow(photophoreGlow, 1.2) * 1.0;
    emissBuf[idx] = Math.floor(Math.min(255, eGlow * 85));
    emissBuf[idx + 1] = Math.floor(Math.min(255, eGlow * 255));
    emissBuf[idx + 2] = Math.floor(Math.min(255, eGlow * 230));
    emissBuf[idx + 3] = 255;

    // Height Map: Veins and muscle cords raised
    const height = rib * 0.35 + cellNoise * 0.08 + n * 0.06 + veinIntensity * 0.45;
    heightMap[y * W + x] = height;

    // Roughness Map: Veins and grooves are wet & glossy (low roughness), skin is satin
    const wetness = veinIntensity * 0.65 + Math.abs(ribGroove) * 0.25;
    const rough = Math.floor((0.38 - wetness * 0.26 + n * 0.04) * 255);
    roughBuf[idx] = rough;
    roughBuf[idx + 1] = rough;
    roughBuf[idx + 2] = rough;
    roughBuf[idx + 3] = 255;
  }
}

// 2. Compute Tangent Space Normal Map from Heightmap with seamless wrapping
console.log("Computing tangent normal map...");
const normBuf = Buffer.alloc(W * H * 4);
const strength = 4.2;

for (let y = 0; y < H; y++) {
  const yPrev = (y - 1 + H) % H;
  const yNext = (y + 1) % H;
  for (let x = 0; x < W; x++) {
    const xPrev = (x - 1 + W) % W;
    const xNext = (x + 1) % W;

    const dx = (heightMap[y * W + xNext] - heightMap[y * W + xPrev]) * strength;
    const dy = (heightMap[yNext * W + x] - heightMap[yPrev * W + x]) * strength;

    const len = Math.sqrt(dx * dx + dy * dy + 1.0);
    const nx = -dx / len;
    const ny = -dy / len;
    const nz = 1.0 / len;

    const idx = (y * W + x) * 4;
    normBuf[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
    normBuf[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
    normBuf[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
    normBuf[idx + 3] = 255;
  }
}

// 3. Generate Quartz Crystal Normal & Roughness Maps
console.log("Generating crystal striation maps...");
const crystNormBuf = Buffer.alloc(W * H * 4);
const crystRoughBuf = Buffer.alloc(W * H * 4);

for (let y = 0; y < H; y++) {
  const ny = y / H;
  // Natural quartz horizontal growth striations
  const striation = Math.sin(ny * 240) * 0.15 + Math.sin(ny * 680) * 0.08;
  const cleavage = (Math.sin(ny * 32) > 0.92 ? 0.25 : 0.0);

  for (let x = 0; x < W; x++) {
    const nx = x / W;
    const idx = (y * W + x) * 4;

    // Normal striation slope
    const dStr = Math.cos(ny * 240) * 0.45;
    const len = Math.sqrt(dStr * dStr + 1.0);
    const n_y = -dStr / len;
    const n_z = 1.0 / len;

    crystNormBuf[idx] = 128; // Flat X
    crystNormBuf[idx + 1] = Math.floor((n_y * 0.5 + 0.5) * 255);
    crystNormBuf[idx + 2] = Math.floor((n_z * 0.5 + 0.5) * 255);
    crystNormBuf[idx + 3] = 255;

    // Crystal roughness: mostly 0.06 (ultra smooth clear quartz) with subtle micro-dust
    const microDust = (Math.sin(nx * 120 + ny * 140) * Math.cos(nx * 80 - ny * 90) > 0.75) ? 0.18 : 0.05;
    const rVal = Math.floor((microDust + cleavage * 0.12) * 255);
    crystRoughBuf[idx] = rVal;
    crystRoughBuf[idx + 1] = rVal;
    crystRoughBuf[idx + 2] = rVal;
    crystRoughBuf[idx + 3] = 255;
  }
}

// Write files
console.log("Writing PNG files to disk...");
fs.writeFileSync(path.join(outDir, 'tissue_diffuse.png'), createPNG(W, H, diffBuf));
fs.writeFileSync(path.join(outDir, 'tissue_normal.png'), createPNG(W, H, normBuf));
fs.writeFileSync(path.join(outDir, 'tissue_roughness.png'), createPNG(W, H, roughBuf));
fs.writeFileSync(path.join(outDir, 'tissue_emissive.png'), createPNG(W, H, emissBuf));
fs.writeFileSync(path.join(outDir, 'crystal_normal.png'), createPNG(W, H, crystNormBuf));
fs.writeFileSync(path.join(outDir, 'crystal_roughness.png'), createPNG(W, H, crystRoughBuf));

console.log("All 6 PBR texture files successfully generated in:", outDir);
