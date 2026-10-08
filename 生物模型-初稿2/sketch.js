// noprotect
/**
 * 幻想生物 (3D) - 浮晶籠 (Floating Crystal Cage) - 環境風暴互動與全生態模擬版
 * 
 * 生態動態隨風暴 (Storm Intensity: 0.0 ~ 1.0) 反應：
 * 1. 迎風抗風姿態：風暴越強，浮晶籠傾角越深、高空氣流劇烈擾動。
 * 2. 氣囊呼吸頻率：微風時悠然平緩呼吸；強暴風時心率與氣囊急促劇烈收縮。
 * 3. 離子鬚風阻飄揚：離子鬚隨風向後方強烈甩動，高頻波紋抖動。
 * 4. 電荷吸收與過載：電荷微粒高速匯入，核心電容囊高壓過載，閃電頻發。
 * 5. 群居防禦靠攏：強風暴時伴隨個體自動向首領緊密聚攏，並自動串聯天線導電網！
 * 6. 應激釋放孢子：暴風超載時 (>85%)，生物本能自動週期性噴發大量靜電玻璃孢子！
 */

// 風暴強度 (0.0: 微風晴空 ~ 1.0: 狂暴天劫，預設 0.45)
let stormLevel = 0.45;

// 當前生態氛圍主題 ('aurora' | 'abyss' | 'solar')
let currentTheme = 'aurora';

// 群居策略：手動或自動導電網開關
let manualConduction = false;

// 靜電玻璃孢子群
let spores = [];

// 電荷微粒群
let charges = [];
const NUM_CHARGES = 48;

// 遠景負重力懸浮島群
let islands = [];

// 族群個體基礎位置
const FLOCK_BASE = [
  { id: 0, baseX: 0,    baseY: 0,   baseZ: 0,    scale: 1.0,  phase: 0.0, isLeader: true  },
  { id: 1, baseX: -210, baseY: -35, baseZ: -110, scale: 0.64, phase: 1.8, isLeader: false },
  { id: 2, baseX: 220,  baseY: 30,  baseZ: -80,  scale: 0.58, phase: 3.4, isLeader: false }
];

// 核心電容能量強度
let capacitorEnergy = 0;

// 觸鬚參數
const NUM_WHISKERS = 8;
const WHISKER_SEGMENTS = 16;
const WHISKER_LENGTH = 190;

// 色彩主題配置表
const THEMES = {
  aurora: {
    bg: [4, 7, 17],
    ambient: [42, 58, 85],
    lightDir1: [60, 210, 190],
    lightDir2: [150, 60, 240],
    cageFill: [130, 220, 255, 40],
    cageStroke: [170, 245, 255, 210],
    cageRail: [100, 200, 255, 50],
    cageNode: [200, 255, 255, 230],
    coreSphere: [100, 255, 230],
    coreBox1: [120, 80, 255, 60],
    coreBox2: [50, 180, 255, 40],
    arcColor: [180, 245, 255, 220],
    bladderInner: [255, 140, 80, 55],
    bladderInnerStroke: [255, 190, 120, 70],
    bladderOuter: [60, 170, 230, 90],
    bladderOuterStroke: [110, 230, 255, 95],
    antennaFill: [100, 230, 255, 130],
    antennaStroke: [190, 255, 255, 210],
    antennaSpark: [170, 220, 255],
    whiskerBase: [70, 245, 255],
    whiskerTip: [210, 90, 255],
    chargeA: [90, 255, 175],
    chargeB: [165, 190, 255],
    sporeColor: [180, 250, 255],
    islandTint: [18, 28, 48]
  },
  abyss: {
    bg: [2, 5, 12],
    ambient: [25, 40, 65],
    lightDir1: [20, 240, 200],
    lightDir2: [190, 40, 210],
    cageFill: [40, 160, 210, 35],
    cageStroke: [90, 240, 255, 200],
    cageRail: [30, 190, 220, 50],
    cageNode: [150, 255, 245, 240],
    coreSphere: [40, 255, 200],
    coreBox1: [190, 30, 180, 60],
    coreBox2: [0, 180, 240, 45],
    arcColor: [120, 255, 240, 210],
    bladderInner: [130, 40, 200, 60],
    bladderInnerStroke: [180, 90, 255, 80],
    bladderOuter: [20, 170, 200, 85],
    bladderOuterStroke: [60, 230, 245, 95],
    antennaFill: [40, 200, 220, 120],
    antennaStroke: [120, 250, 255, 210],
    antennaSpark: [60, 255, 220],
    whiskerBase: [30, 255, 210],
    whiskerTip: [240, 50, 180],
    chargeA: [40, 255, 200],
    chargeB: [220, 70, 210],
    sporeColor: [140, 255, 230],
    islandTint: [12, 18, 32]
  },
  solar: {
    bg: [14, 5, 7],
    ambient: [65, 35, 40],
    lightDir1: [255, 180, 50],
    lightDir2: [240, 50, 70],
    cageFill: [255, 160, 60, 40],
    cageStroke: [255, 215, 130, 220],
    cageRail: [255, 140, 40, 55],
    cageNode: [255, 240, 180, 240],
    coreSphere: [255, 235, 150],
    coreBox1: [255, 60, 40, 70],
    coreBox2: [255, 170, 30, 50],
    arcColor: [255, 225, 150, 220],
    bladderInner: [255, 60, 30, 80],
    bladderInnerStroke: [255, 120, 60, 90],
    bladderOuter: [255, 140, 40, 85],
    bladderOuterStroke: [255, 195, 80, 100],
    antennaFill: [240, 150, 60, 140],
    antennaStroke: [255, 210, 120, 220],
    antennaSpark: [255, 230, 130],
    whiskerBase: [255, 200, 60],
    whiskerTip: [240, 40, 60],
    chargeA: [255, 200, 60],
    chargeB: [255, 70, 70],
    sporeColor: [255, 220, 140],
    islandTint: [32, 16, 20]
  }
};

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(RADIANS);

  for (let i = 0; i < NUM_CHARGES; i++) {
    charges.push(createNewCharge());
  }

  islands = [
    { x: -380, y: 160,  z: -420, scale: 65, rot: 0.3 },
    { x: 420,  y: -120, z: -480, scale: 80, rot: -0.5 },
    { x: 30,   y: 280,  z: -550, scale: 95, rot: 1.1 }
  ];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 供外部 UI 調節風暴強度
window.setStormLevel = function(val) {
  stormLevel = constrain(val, 0.0, 1.0);
};

// 鍵盤互動
function keyPressed() {
  if (keyCode === UP_ARROW) {
    let nextVal = min(1.0, stormLevel + 0.05);
    window.setStormLevel(nextVal);
    syncSliderUI(nextVal);
  } else if (keyCode === DOWN_ARROW) {
    let nextVal = max(0.0, stormLevel - 0.05);
    window.setStormLevel(nextVal);
    syncSliderUI(nextVal);
  } else if (key === 'c' || key === 'C') {
    toggleConductionNetwork();
  } else if (key === ' ') {
    triggerSporesRelease();
  } else if (key === '1') {
    setTheme('aurora');
  } else if (key === '2') {
    setTheme('abyss');
  } else if (key === '3') {
    setTheme('solar');
  }
}

function syncSliderUI(val) {
  let slider = document.getElementById('storm-slider');
  if (slider) {
    let pct = round(val * 100);
    slider.value = pct;
    if (window.updateStormLabel) window.updateStormLabel(pct);
  }
}

window.toggleConductionNetwork = function() {
  manualConduction = !manualConduction;
  updateConductionUI();
};

function isNetworkActive() {
  // 手動啟動，或風暴 >= 0.70 時生物群聚本能強制啟動
  return manualConduction || (stormLevel >= 0.70);
}

function updateConductionUI() {
  let btn = document.getElementById('btn-network');
  if (btn) {
    if (isNetworkActive()) {
      btn.classList.add('active');
      btn.innerText = (stormLevel >= 0.70 && !manualConduction)
        ? '⚡ 導電網：風暴過載自動串聯'
        : '⚡ 導電網：已串聯過載 (C)';
      capacitorEnergy = max(0.8, capacitorEnergy);
    } else {
      btn.classList.remove('active');
      btn.innerText = '⚡ 串聯導電網 (C)';
    }
  }
}

window.triggerSporesRelease = function() {
  for (let bird of FLOCK_BASE) {
    let count = bird.isLeader ? 75 : 30;
    for (let i = 0; i < count; i++) {
      spores.push(createSpore(bird.curX || 0, bird.curY || 0, bird.curZ || 0, bird.scale));
    }
  }
};

window.setTheme = function(themeName) {
  if (THEMES[themeName]) {
    currentTheme = themeName;
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    let activeBtn = document.getElementById('btn-' + themeName);
    if (activeBtn) activeBtn.classList.add('active');
  }
};

function draw() {
  let pal = THEMES[currentTheme];
  background(pal.bg[0], pal.bg[1], pal.bg[2]);

  orbitControl(1.5, 1.5, 0.1);

  // 時間速率隨風暴強度增快 (微風 t 慢，強風暴 t 急)
  let speedMult = map(stormLevel, 0, 1, 0.6, 2.2);
  let t = (frameCount * 0.02) * speedMult;

  // 風暴過載狀態
  let networkOn = isNetworkActive();
  updateConductionUI();

  if (networkOn) {
    capacitorEnergy = max(0.4 + stormLevel * 0.45, capacitorEnergy * 0.96);
  } else {
    capacitorEnergy = max(stormLevel * 0.25, capacitorEnergy * 0.93);
  }

  // 強風暴自動應激噴發玻璃孢子 (多產不育幼策略)
  if (stormLevel >= 0.88 && frameCount % 35 === 0) {
    for (let i = 0; i < 18; i++) {
      spores.push(createSpore(0, 0, 0, 1.0));
    }
  }

  // 風暴晃動震顫 (Camera Turbulence)
  if (stormLevel > 0.75) {
    let shake = (stormLevel - 0.75) * 4.0;
    translate(random(-shake, shake), random(-shake, shake), 0);
  }

  // 光照與環境
  setupLighting(t, pal);
  drawFloatingIslands(t, pal);
  drawCharges(t, pal);
  drawSpores(t, pal);

  // 族群位置與風暴動態計算
  let leaderAntennaPos = null;
  let companionAntennaPos = [];

  // 風暴越強，族群個體彼此距離越收攏 (群聚避險)
  let flockSpread = map(stormLevel, 0, 1, 1.15, 0.65);

  for (let bird of FLOCK_BASE) {
    push();
      let localT = t + bird.phase;

      // 1. 氣囊呼吸頻率 (微風緩慢心率，暴風急促呼吸)
      let breatheFreq = map(stormLevel, 0, 1, 1.0, 3.2);
      let breathePulse = sin(localT * breatheFreq);

      // 2. 迎風漂移與浮力推力
      let buoyancyY = breathePulse * (12 + stormLevel * 14) * bird.scale;
      let windDriftX = (sin(localT * 0.8) * 10 + stormLevel * 25) * bird.scale;
      let windDriftZ = cos(localT * 0.7) * 8 * bird.scale;

      let curX = bird.baseX * flockSpread + windDriftX;
      let curY = bird.baseY + buoyancyY;
      let curZ = bird.baseZ * flockSpread + windDriftZ;

      bird.curX = curX;
      bird.curY = curY;
      bird.curZ = curZ;

      translate(curX, curY, curZ);
      scale(bird.scale);

      // 3. 迎風抗風姿態傾角 (Aerodynamic Tilt)
      // 風暴將其吹向右側 (+X)，生物本能迎風向下壓低傾角抗風
      let tiltWindZ = -stormLevel * 0.32; // 順風抗風傾斜
      let tiltTurbulence = (noise(localT * 3) - 0.5) * (0.05 + stormLevel * 0.2);
      let tiltX = cos(localT * 0.9) * 0.06 + tiltTurbulence;
      let tiltZ = tiltWindZ + sin(localT * 0.8) * 0.05;

      rotateX(tiltX);
      rotateZ(tiltZ);
      rotateY(localT * 0.15);

      // 繪製個體
      drawSingleCage(localT, pal, bird.isLeader, breathePulse);

      // 計算天線頂端
      let topYWorld = curY - (145 * bird.scale);
      if (bird.isLeader) {
        leaderAntennaPos = { x: curX, y: topYWorld, z: curZ };
      } else {
        companionAntennaPos.push({ x: curX, y: topYWorld, z: curZ });
      }
    pop();
  }

  // 繪製天線串聯導電網
  if (networkOn && leaderAntennaPos) {
    drawConductionNetwork(leaderAntennaPos, companionAntennaPos, pal);
  }
}

/**
 * 3D 光照系統
 */
function setupLighting(t, pal) {
  // 風暴增強時，環境光略暗、電光更刺眼
  let ambDim = map(stormLevel, 0, 1, 1.0, 0.75);
  ambientLight(pal.ambient[0] * ambDim, pal.ambient[1] * ambDim, pal.ambient[2] * ambDim);

  // 極光/太陽風主光 (暴風時波動急促)
  let waveAmp = 20 + stormLevel * 40;
  let lightWave = sin(t * (1.1 + stormLevel * 1.5)) * waveAmp;
  directionalLight(
    pal.lightDir1[0],
    constrain(pal.lightDir1[1] + lightWave, 0, 255),
    pal.lightDir1[2],
    0.3 + stormLevel * 0.3, 1, -0.4
  );

  // 側向風暴閃光 (強風暴時偶發大電弧閃白)
  let flashChance = (stormLevel > 0.7) ? (random() < 0.15 ? 120 : 0) : 0;
  directionalLight(
    min(255, pal.lightDir2[0] + flashChance),
    min(255, pal.lightDir2[1] + flashChance),
    min(255, pal.lightDir2[2] + flashChance),
    -0.7, -0.6, -0.5
  );

  // 核心發光源
  let corePulse = 140 + sin(t * (3.5 + stormLevel * 2)) * 50 + capacitorEnergy * 250;
  pointLight(
    min(255, pal.coreSphere[0] + capacitorEnergy * 80),
    min(255, corePulse),
    min(255, pal.coreSphere[2] + capacitorEnergy * 60),
    0, 0, 0
  );
}

/**
 * 遠景負重力浮石
 */
function drawFloatingIslands(t, pal) {
  push();
    for (let isl of islands) {
      push();
        let driftY = sin(t * 0.6 + isl.rot) * (12 + stormLevel * 15);
        translate(isl.x, isl.y + driftY, isl.z);
        rotateY(isl.rot + t * 0.02);

        stroke(pal.islandTint[0] * 2, pal.islandTint[1] * 2, pal.islandTint[2] * 2, 110);
        strokeWeight(1);
        fill(pal.islandTint[0], pal.islandTint[1], pal.islandTint[2], 160);

        cylinder(isl.scale * 0.8, isl.scale * 0.25, 6, 1);
        translate(0, isl.scale * 0.5, 0);
        rotateX(PI);
        cone(isl.scale * 0.8, isl.scale * 0.9, 6, 1);
      pop();
    }
  pop();
}

/**
 * 單個浮晶籠繪製
 */
function drawSingleCage(t, pal, isLeader, breathePulse) {
  drawCapacitorCore(t, pal, isLeader);
  drawThermalBladder(t, pal, breathePulse);
  drawGlassCage(t, pal);
  drawCrystalAntennae(t, pal);
  drawIonicWhiskers(t, pal, breathePulse);
}

/**
 * 1. 生物電容囊 (風暴越強，內部微電弧跳躍越劇烈)
 */
function drawCapacitorCore(t, pal, isLeader) {
  push();
    let pulseScale = 1 + sin(t * (3.5 + stormLevel * 2)) * 0.1 + capacitorEnergy * (isLeader ? 0.35 : 0.18);
    scale(pulseScale);

    noStroke();
    let flashR = lerp(pal.coreSphere[0], 255, capacitorEnergy * 0.7);
    let flashG = lerp(pal.coreSphere[1], 255, capacitorEnergy * 0.7);
    let flashB = lerp(pal.coreSphere[2], 255, capacitorEnergy * 0.7);
    fill(flashR, flashG, flashB, 240);
    sphere(22, 10, 8);

    push();
      rotateY(-t * (1.8 + stormLevel * 1.5));
      rotateX(t * 1.4);
      stroke(pal.arcColor[0], pal.arcColor[1], pal.arcColor[2], 160);
      strokeWeight(1.2);
      fill(pal.coreBox1[0], pal.coreBox1[1], pal.coreBox1[2], pal.coreBox1[3]);
      box(32);
    pop();

    // 電弧跳躍頻率隨風暴與電能提升
    let arcThreshold = 0.85 - stormLevel * 0.5 - capacitorEnergy * 0.3;
    if (random() > arcThreshold) {
      drawCapacitorArcs(pal, isLeader);
    }
  pop();
}

function drawCapacitorArcs(pal, isLeader) {
  let numArcs = floor(map(stormLevel, 0, 1, 1, 6)) + (capacitorEnergy > 0.4 ? 2 : 0);
  stroke(pal.arcColor[0], pal.arcColor[1], pal.arcColor[2], 230);
  strokeWeight(1.5);
  noFill();

  for (let a = 0; a < numArcs; a++) {
    let targetAngle = random(TWO_PI);
    let targetY = random(-55, 55);
    let targetR = 75 + stormLevel * 20; // 強暴風時電弧甚至擊穿玻璃籠
    let targetX = cos(targetAngle) * targetR;
    let targetZ = sin(targetAngle) * targetR;

    beginShape();
    vertex(0, 0, 0);
    for (let k = 1; k <= 3; k++) {
      let frac = k / 4;
      vertex(
        targetX * frac + random(-15, 15),
        targetY * frac + random(-15, 15),
        targetZ * frac + random(-15, 15)
      );
    }
    vertex(targetX, targetY, targetZ);
    endShape();
  }
}

/**
 * 2. 熱氣囊 (呼吸急促程度與氣囊形變受風暴調節)
 */
function drawThermalBladder(t, pal, breathePulse) {
  push();
    let breatheAmp = map(stormLevel, 0, 1, 0.04, 0.12);
    let breatheY = breathePulse * breatheAmp;
    let breatheXZ = -breatheY * 0.45;
    scale(1 + breatheXZ, 1 + breatheY, 1 + breatheXZ);

    push();
      stroke(pal.bladderInnerStroke[0], pal.bladderInnerStroke[1], pal.bladderInnerStroke[2], pal.bladderInnerStroke[3]);
      strokeWeight(0.8);
      fill(pal.bladderInner[0], pal.bladderInner[1], pal.bladderInner[2], pal.bladderInner[3]);
      ellipsoid(42, 58, 42, 14, 10);
    pop();

    stroke(pal.bladderOuterStroke[0], pal.bladderOuterStroke[1], pal.bladderOuterStroke[2], pal.bladderOuterStroke[3]);
    strokeWeight(1.0);
    fill(pal.bladderOuter[0], pal.bladderOuter[1], pal.bladderOuter[2], pal.bladderOuter[3]);
    ellipsoid(55, 75, 55, 18, 14);

    noFill();
    stroke(pal.cageStroke[0], pal.cageStroke[1], pal.cageStroke[2], 130);
    strokeWeight(1.2);
    torus(57, 1.0, 24, 3);
  pop();
}

/**
 * 3. 多面玻璃籠
 */
function drawGlassCage(t, pal) {
  push();
    rotateY(-t * 0.08);

    stroke(pal.cageStroke[0], pal.cageStroke[1], pal.cageStroke[2], pal.cageStroke[3]);
    strokeWeight(1.4);
    fill(pal.cageFill[0], pal.cageFill[1], pal.cageFill[2], pal.cageFill[3]);
    sphere(105, 6, 5);

    push();
      rotateY(t * 0.25);
      stroke(pal.cageStroke[0], pal.cageStroke[1], pal.cageStroke[2], 180);
      strokeWeight(1.2);
      fill(pal.cageRail[0], pal.cageRail[1], pal.cageRail[2], pal.cageRail[3]);
      torus(116, 2.0, 6, 4);
    pop();

    drawCageNodes(pal);
  pop();
}

function drawCageNodes(pal) {
  let nodeR = 105;
  for (let ring of [{ yFrac: -0.65, count: 4 }, { yFrac: 0, count: 6 }, { yFrac: 0.65, count: 4 }]) {
    let y = ring.yFrac * nodeR;
    let r = sqrt(max(0, nodeR * nodeR - y * y));
    for (let i = 0; i < ring.count; i++) {
      let angle = (TWO_PI / ring.count) * i;
      push();
        translate(cos(angle) * r, y, sin(angle) * r);
        noStroke();
        fill(pal.cageNode[0], pal.cageNode[1], pal.cageNode[2], pal.cageNode[3]);
        cone(4, 7, 4, 1);
        rotateX(PI);
        cone(4, 7, 4, 1);
      pop();
    }
  }
}

/**
 * 4. 晶體天線 (風暴中晶錐微擺動與尖端放電加劇)
 */
function drawCrystalAntennae(t, pal) {
  push();
    let swayAmp = 0.05 + stormLevel * 0.12;

    for (let i = 0; i < 4; i++) {
      let angle = (TWO_PI / 4) * i;
      let sway = sin(t * (2.0 + stormLevel * 2) + i * 1.5) * swayAmp;

      push();
        translate(cos(angle) * 45, -85, sin(angle) * 45);
        rotateY(-angle);
        rotateZ(PI / 4.4 + sway);

        push();
          noStroke();
          fill(pal.antennaFill[0], pal.antennaFill[1], pal.antennaFill[2], 160);
          cone(8, 14, 5, 1);
        pop();

        translate(0, -28, 0);
        stroke(pal.antennaStroke[0], pal.antennaStroke[1], pal.antennaStroke[2], pal.antennaStroke[3]);
        strokeWeight(1.2);
        fill(pal.antennaFill[0], pal.antennaFill[1], pal.antennaFill[2], 130);
        cone(6, 62, 4, 1);

        translate(0, -32, 0);
        noStroke();
        let sparkPulse = 180 + sin(t * 8 + i * 2.3) * 75 + stormLevel * 40;
        fill(pal.antennaSpark[0], min(255, sparkPulse), pal.antennaSpark[2], 240);
        sphere(3.2 + stormLevel * 1.5, 5, 4);

        stroke(pal.arcColor[0], pal.arcColor[1], pal.arcColor[2], 200);
        strokeWeight(1.2);
        line(0, 0, 0, 0, -14 - stormLevel * 10, 0);
      pop();
    }

    // 正中央主天線
    push();
      translate(0, -100, 0);
      rotateZ(sin(t * 2.0) * swayAmp * 0.7);
      stroke(pal.cageStroke[0], pal.cageStroke[1], pal.cageStroke[2], 220);
      strokeWeight(1.3);
      fill(pal.antennaFill[0], pal.antennaFill[1], pal.antennaFill[2], 170);
      cone(7.5, 78, 5, 1);

      push();
        translate(0, -15, 0);
        noFill();
        stroke(pal.arcColor[0], pal.arcColor[1], pal.arcColor[2], 200);
        strokeWeight(1.2);
        torus(9, 1.2, 16, 3);
      pop();

      translate(0, -42, 0);
      noStroke();
      fill(pal.cageNode[0], pal.cageNode[1], pal.cageNode[2], 250);
      sphere(4.5 + stormLevel * 2, 6, 5);

      stroke(pal.arcColor[0], pal.arcColor[1], pal.arcColor[2], 230);
      strokeWeight(1.5);
      line(0, 0, 0, 0, -18 - stormLevel * 12, 0);
    pop();
  pop();
}

/**
 * 5. 離子鬚 (強風暴中被強烈向後方/下方吹拂甩動)
 */
function drawIonicWhiskers(t, pal, breathePulse) {
  let rootY = 90;
  // 迎風向後側甩動的風力偏移 (Wind Blowback Offset)
  let windBlowX = stormLevel * 48; // 隨風被吹向側邊
  let whiskerSpeed = 2.4 + stormLevel * 3.5; // 波動頻率劇烈加快

  for (let i = 0; i < NUM_WHISKERS; i++) {
    let angle = (TWO_PI / NUM_WHISKERS) * i;
    let rootX = cos(angle) * 38;
    let rootZ = sin(angle) * 38;

    push();
      noFill();
      strokeWeight(1.9);

      let whiskerPts = [];
      beginShape();
      for (let s = 0; s <= WHISKER_SEGMENTS; s++) {
        let frac = s / WHISKER_SEGMENTS;
        let segY = rootY + frac * WHISKER_LENGTH;

        // 風暴風阻位移 (越接近末端，被狂風吹偏越嚴重)
        let blowX = windBlowX * (frac * frac);
        let waveX = sin(t * whiskerSpeed - frac * 4.2 + i * 0.8) * (12 * frac + stormLevel * 18 * frac) + blowX;
        let waveZ = cos(t * (whiskerSpeed * 0.9) - frac * 3.8 + i * 0.8) * (12 * frac + stormLevel * 12 * frac);

        let curX = rootX + waveX;
        let curZ = rootZ + waveZ;

        whiskerPts.push({ x: curX, y: segY, z: curZ });

        let rCol = lerp(pal.whiskerBase[0], pal.whiskerTip[0], frac);
        let gCol = lerp(pal.whiskerBase[1], pal.whiskerTip[1], frac);
        let bCol = lerp(pal.whiskerBase[2], pal.whiskerTip[2], frac);
        let aVal = map(frac, 0, 1, 255, 45);

        stroke(rCol, gCol, bCol, aVal);
        vertex(curX, segY, curZ);
      }
      endShape();

      // 沿鬚流動的離子發光節點 (暴風中流速翻倍)
      let flowRate = 0.8 + stormLevel * 1.6;
      let glowProgress = (t * flowRate + i * 0.25) % 1.0;
      let pt = whiskerPts[floor(glowProgress * WHISKER_SEGMENTS)];
      if (pt) {
        push();
          translate(pt.x, pt.y, pt.z);
          noStroke();
          fill(pal.arcColor[0], pal.arcColor[1], pal.arcColor[2], 230);
          sphere(2.6 + stormLevel * 1.2, 4, 3);
        pop();
      }

      // 觸鬚末端離子光球
      let tip = whiskerPts[whiskerPts.length - 1];
      push();
        translate(tip.x, tip.y, tip.z);
        noStroke();
        fill(pal.whiskerTip[0], pal.whiskerTip[1], pal.whiskerTip[2], 200);
        sphere(3.0 + stormLevel * 1.5, 5, 4);
      pop();
    pop();
  }
}

/**
 * 天線串聯導電網 (過載電擊分擔)
 */
function drawConductionNetwork(leaderPos, companions, pal) {
  push();
    stroke(pal.arcColor[0], pal.arcColor[1], pal.arcColor[2], 240);
    strokeWeight(2.0 + stormLevel * 1.5);
    noFill();

    for (let comp of companions) {
      drawLightningArc(leaderPos, comp);
    }
    if (companions.length >= 2) {
      drawLightningArc(companions[0], companions[1]);
    }
  pop();
}

function drawLightningArc(p1, p2) {
  beginShape();
  vertex(p1.x, p1.y, p1.z);
  let segments = 5;
  let jitter = 18 + stormLevel * 25; // 風暴越強電弧越狂暴
  for (let i = 1; i < segments; i++) {
    let frac = i / segments;
    vertex(
      lerp(p1.x, p2.x, frac) + random(-jitter, jitter),
      lerp(p1.y, p2.y, frac) + random(-jitter, jitter),
      lerp(p1.z, p2.z, frac) + random(-jitter, jitter)
    );
  }
  vertex(p2.x, p2.y, p2.z);
  endShape();
}

/**
 * 靜電玻璃孢子 (多產不育幼)
 */
function createSpore(ox, oy, oz, birdScale) {
  let theta = random(TWO_PI);
  let phi = random(-PI * 0.45, PI * 0.45);
  let burstSpeed = random(2.5, 6.0 + stormLevel * 4.0) * birdScale;

  return {
    x: ox + random(-20, 20),
    y: oy + random(-30, 10),
    z: oz + random(-20, 20),
    vx: burstSpeed * cos(phi) * cos(theta) + stormLevel * 2.5, // 隨狂風帶有側向初速
    vy: burstSpeed * sin(phi) - 1.2,
    vz: burstSpeed * cos(phi) * sin(theta),
    life: 1.0,
    decay: random(0.005, 0.012),
    size: random(2.5, 4.5)
  };
}

function drawSpores(t, pal) {
  if (spores.length === 0) return;

  push();
    for (let i = spores.length - 1; i >= 0; i--) {
      let sp = spores[i];

      sp.vy -= 0.025;
      sp.vx *= 0.985;
      sp.vz *= 0.985;
      // 狂暴風阻將孢子漫天捲走
      let stormDrift = stormLevel * 1.8;
      sp.x += sp.vx + stormDrift + sin(t + sp.y * 0.01) * 0.4;
      sp.y += sp.vy;
      sp.z += sp.vz + cos(t + sp.x * 0.01) * 0.4;

      sp.life -= sp.decay;

      if (sp.life <= 0) {
        spores.splice(i, 1);
        continue;
      }

      strokeWeight(sp.size * sp.life);
      let aVal = sp.life * 240;
      stroke(pal.sporeColor[0], pal.sporeColor[1], pal.sporeColor[2], aVal);
      point(sp.x, sp.y, sp.z);
    }
  pop();
}

/**
 * 電荷微粒吸取 (風暴增強時，微粒速度暴增、吸入過載)
 */
function createNewCharge() {
  let theta = random(TWO_PI);
  let phi = random(-PI * 0.42, PI * 0.42);
  let spawnR = random(240, 380);

  return {
    x: spawnR * cos(phi) * cos(theta),
    y: spawnR * sin(phi),
    z: spawnR * cos(phi) * sin(theta),
    speed: random(1.0, 2.2),
    size: random(3.0, 5.2),
    isTypeA: random() > 0.45,
    spiralSeed: random(-0.015, 0.015)
  };
}

function drawCharges(t, pal) {
  let speedBoost = 1.0 + stormLevel * 2.8;

  for (let i = 0; i < charges.length; i++) {
    let c = charges[i];
    let d = sqrt(c.x * c.x + c.y * c.y + c.z * c.z);

    if (d > 15) {
      let normFactor = (c.speed * speedBoost) / d;
      c.x += -c.x * normFactor + (-c.z) * c.spiralSeed * 10;
      c.y += -c.y * normFactor;
      c.z += -c.z * normFactor + (c.x) * c.spiralSeed * 10;
    }

    if (d < 28) {
      capacitorEnergy = min(1.0, capacitorEnergy + 0.35);
      charges[i] = createNewCharge();
      continue;
    }

    push();
      strokeWeight(c.size + stormLevel * 1.5);
      let pCol = c.isTypeA ? pal.chargeA : pal.chargeB;
      stroke(pCol[0], pCol[1], pCol[2], 230);
      point(c.x, c.y, c.z);
    pop();
  }
}
