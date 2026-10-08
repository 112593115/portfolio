let charges = [];
    const NUM_CHARGES = 60;
    const NUM_WHISKERS = 8;
    const WHISKER_SEGMENTS = 14;
    const WHISKER_LENGTH = 180;

    function setup() {
      createCanvas(windowWidth, windowHeight, WEBGL);
      angleMode(RADIANS);

      // 初始化極光與風暴電荷微粒
      for (let i = 0; i < NUM_CHARGES; i++) {
        charges.push(createNewCharge());
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }

    function draw() {
      background(6, 10, 20); // 深邃極夜空背景

      // 啟用滑鼠 3D 視角互動 (拖曳旋轉 / 滾輪縮放)
      orbitControl(1.5, 1.5, 0.1);

      let t = frameCount * 0.02;

      // 1. 光源配置 (極光綠 + 風暴紫 + 核心電容脈衝光)
      setupLighting(t);

      // 2. 空間中匯聚被吸入的電荷微粒
      drawCharges(t);

      // 3. 浮晶籠本體
      push();
        // 整體柔和起伏浮動 (上下漂浮 + 輕微傾角自轉)
        let floatY = sin(t * 1.2) * 16;
        let tiltX = sin(t * 0.8) * 0.06;
        let tiltZ = cos(t * 0.9) * 0.06;
        translate(0, floatY, 0);
        rotateX(tiltX);
        rotateZ(tiltZ);
        rotateY(t * 0.2);

        // 由內而外繪製半透明層次
        drawCapacitorCore(t);   // 核心：生物電容囊
        drawThermalBladder(t);  // 中層：熱氣囊
        drawGlassCage(t);       // 外層：多面玻璃籠
        drawAntennae(t);        // 上部：晶體天線
        drawIonicWhiskers(t);   // 下部：離子鬚
      pop();
    }

    function setupLighting(t) {
      ambientLight(40, 60, 90);
      let auroraG = 180 + sin(t) * 40;
      directionalLight(70, auroraG, 220, 0.3, 1, -0.5); // 上方極光光照
      directionalLight(160, 70, 255, -0.8, -0.5, -0.6); // 風暴紫光
      let corePulse = 180 + sin(t * 3.5) * 60;
      pointLight(80, corePulse, 255, 0, 0, 0);          // 核心內部發光源
    }

    // 核心：生物電容囊
    function drawCapacitorCore(t) {
      push();
        let pulse = 1 + sin(t * 3.5) * 0.12;
        scale(pulse);
        noStroke();
        fill(100, 255, 230, 230);
        sphere(22, 8, 6);

        rotateY(-t * 1.5);
        rotateX(t * 1.2);
        stroke(180, 255, 255, 140);
        strokeWeight(1.2);
        fill(130, 80, 255, 70);
        box(34);
      pop();
    }

    // 中層：熱氣囊
    function drawThermalBladder(t) {
      push();
        let breathe = 1 + sin(t * 1.2) * 0.05;
        scale(breathe, 1 + cos(t * 1.2) * 0.04, breathe);
        stroke(120, 230, 255, 90);
        strokeWeight(1);
        fill(80, 180, 240, 110);
        ellipsoid(54, 72, 54, 16, 12);
      pop();
    }

    // 外層：多面玻璃籠
    function drawGlassCage(t) {
      push();
        rotateY(-t * 0.1);
        stroke(160, 245, 255, 210);
        strokeWeight(1.6);
        fill(130, 220, 255, 45);
        sphere(105, 6, 5); // 6x5 切割的多面低多邊形網格

        // 晶格加固節點
        let nodeR = 105;
        for (let lat of [-0.65, 0, 0.65]) {
          let y = lat * nodeR;
          let r = sqrt(max(0, nodeR * nodeR - y * y));
          let count = (lat === 0) ? 6 : 4;
          for (let i = 0; i < count; i++) {
            let angle = (TWO_PI / count) * i;
            push();
              translate(cos(angle) * r, y, sin(angle) * r);
              noStroke();
              fill(190, 255, 255, 220);
              box(5);
            pop();
          }
        }
      pop();
    }

    // 上部：晶體天線
    function drawAntennae(t) {
      push();
        for (let i = 0; i < 4; i++) {
          let angle = (TWO_PI / 4) * i;
          let sway = sin(t * 2 + i * 1.5) * 0.08;
          push();
            translate(cos(angle) * 45, -85, sin(angle) * 45);
            rotateY(-angle);
            rotateZ(PI / 4.5 + sway);
            stroke(180, 255, 255, 200);
            strokeWeight(1.2);
            fill(100, 230, 255, 120);
            cone(6, 60, 4, 1);

            // 尖端集電晶點
            translate(0, -32, 0);
            noStroke();
            fill(160, 180 + sin(t * 8 + i * 2) * 75, 255, 240);
            sphere(3, 4, 3);
          pop();
        }

        // 正中央主天線
        push();
          translate(0, -100, 0);
          rotateZ(sin(t * 2.2) * 0.05);
          stroke(210, 255, 255, 220);
          strokeWeight(1.4);
          fill(140, 240, 255, 150);
          cone(7, 75, 5, 1);
          translate(0, -40, 0);
          noStroke();
          fill(200, 255, 255, 240);
          sphere(4, 5, 4);
        pop();
      pop();
    }

    // 下部：離子鬚
    function drawIonicWhiskers(t) {
      let rootY = 90;
      for (let i = 0; i < NUM_WHISKERS; i++) {
        let angle = (TWO_PI / NUM_WHISKERS) * i;
        let rootX = cos(angle) * 38;
        let rootZ = sin(angle) * 38;

        push();
          noFill();
          strokeWeight(1.8);
          beginShape();
          for (let s = 0; s <= WHISKER_SEGMENTS; s++) {
            let frac = s / WHISKER_SEGMENTS;
            let segY = rootY + frac * WHISKER_LENGTH;
            let waveX = sin(t * 2.5 - frac * 3.8 + i * 0.8) * (12 * frac);
            let waveZ = cos(t * 2.2 - frac * 3.5 + i * 0.8) * (12 * frac);

            let rCol = lerp(80, 200, frac);
            let gCol = lerp(240, 100, frac);
            let bCol = lerp(255, 255, frac);
            let alpha = map(frac, 0, 1, 240, 60);

            stroke(rCol, gCol, bCol, alpha);
            vertex(rootX + waveX, segY, rootZ + waveZ);
          }
          endShape();
        pop();
      }
    }

    // 吸收極光與風暴電荷
    function createNewCharge() {
      let theta = random(TWO_PI);
      let phi = random(-PI * 0.4, PI * 0.4);
      let dist = random(220, 380);
      return {
        x: dist * cos(phi) * cos(theta),
        y: dist * sin(phi),
        z: dist * cos(phi) * sin(theta),
        speed: random(0.8, 1.8),
        size: random(2, 4.5),
        type: random() > 0.5 ? 'aurora' : 'storm'
      };
    }

    function drawCharges(t) {
      for (let i = 0; i < charges.length; i++) {
        let c = charges[i];
        let d = dist(0, 0, 0, c.x, c.y, c.z);

        if (d > 10) {
          c.x += (-c.x / d) * c.speed - c.z * 0.008;
          c.y += (-c.y / d) * c.speed;
          c.z += (-c.z / d) * c.speed + c.x * 0.008;
        }

        // 被核心吸收後重置
        if (d < 30) {
          charges[i] = createNewCharge();
          continue;
        }

        push();
          translate(c.x, c.y, c.z);
          noStroke();
          fill(c.type === 'aurora' ? color(100, 255, 180, 190) : color(150, 190, 255,
  190));
          box(c.size);
        pop();
      }
    }