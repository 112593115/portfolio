# Floating Crystal Cage — VS Code project

這是一個使用 **Three.js + WebGL** 的即時 3D 外星生物場景，採用程序化環境反射與物理材質（PBR），建構高度寫實的深空晶矽浮游生物（Floating Crystal Cage Specimen E-07）。

場景包含半透明生物熱囊、內臟核心、實體化晶矽幾何桁架外骨骼、六方晶柱天線、捕食觸手、離子感應鬚、生物懸索韌帶、吞噬太陽的磁化黑洞、吸積盤、浮空玄武岩島、磁暴極光與電影感色調。

---

## 本次更新重點

### 1. 生物擬真化與解剖結構升級 (Biological Realism)
- **多層透光熱囊 (Thermal Bladder)**：以 6 瓣對流層生物鐘狀幾何造型構建，具備漸層褶邊裙緣與自然波紋。
- **PBR 貼圖系統 (PBR Texture Maps)**：
  - `tissue_diffuse.png`：半透明深海藍綠組織底色、表皮細胞紋理、6 條主循環管束與分支微血管。
  - `tissue_normal.png`：切線空間法線貼圖，提供立體凸起血管、縱向肌纖維與表皮凹凸細節。
  - `tissue_roughness.png`：模擬濕潤黏液層（血管凹槽具備強高光濕潤反光，外皮呈細緻天鵝絨光澤）。
  - `tissue_emissive.png`：自主發光生物電路，與心跳脈動同步放電。
  - `crystal_normal.png`：天然石英生長水平微晶條紋（Striations）與解理階梯。
  - `crystal_roughness.png`：高純度拋光晶體質感與天然微塵磨損。
- **實體化 3D 晶矽骨架 (3D Silicate Exocage)**：將原本單純的 1px 線框全面升級為具備折射與厚度之 3D 六角柱晶體桁架（Instanced Struts）與多面體關節晶結（Joint Nodes），搭配厚度多面晶體護甲片。
- **生物懸索韌帶 (Suspensory Ligaments)**：12 組纖維質肌腱連桿，將內層生物浮力囊牢牢懸吊於外層晶籠骨架，大幅強化結構生物學合理性。
- **六方晶柱天線 (Hexagonal Quartz Antennae)**：5 組具備六角柱柱身、六方錐頂結晶頂蓋與肉質基底套環的天然晶化天線，尖端鑲嵌離子聚焦寶石與放電光暈。
- **飄逸捕食觸手 (Pelagic Feeding Tendrils)**：腹側 8 條隨流體動力學優雅擺動的半透明觸鬚，具備行波波動與發光腺體珠飾。
- **生體蠕動呼吸與心跳脈動**：熱囊頂部至邊緣之行波蠕動形變，配合核心雙拍心跳發光脈衝。

### 2. HUD 介面文字精簡化 (Minimalist HUD)
- 精簡左側 HUD 排版，採用未來科幻觀察標記與膠囊徽章（Badge）條列式呈現：
  - 核心狀態：`SPECIMEN: ACTIVE`、`ION STORM: 88%`、`GRAVITY: -0.82G`
  - 觀察筆記：以「棲境」、「構造」、「共生」、「繁殖」簡明俐落點出物種生態特徵，減少大段文字干擾，極致凸顯 3D 生物視覺。

---

## 專案結構

```text
floating_crystal_vscode/
├── index.html               # 簡潔俐落的 HUD 介面與 Three.js 容器
├── README.md                # 專案說明與寫實化技術規格
├── generate_textures.js     # 6 張 1024x1024 PBR 貼圖純 Node.js 生成器
└── src/
    ├── main.js              # 核心 3D 場景、PBR 材質、流體動態與生體模擬
    ├── style.css            # 毛玻璃科技質感 HUD 樣式
    └── textures/            # 高解析度 PBR 貼圖資源
        ├── tissue_diffuse.png
        ├── tissue_normal.png
        ├── tissue_roughness.png
        ├── tissue_emissive.png
        ├── crystal_normal.png
        └── crystal_roughness.png
```

---

## 執行方式

1. 在 VS Code 開啟 `floating_crystal_vscode` 資料夾。
2. 安裝 VS Code 擴充套件 **Live Server**。
3. 在檔案總管對 `index.html` 按右鍵，選 **Open with Live Server**。
4. 在瀏覽器中查看場景：
   - **滑鼠左鍵拖曳**：旋轉 360 度視角
   - **滾輪**：縮放鏡頭
   - **鍵盤按鍵 `R`**：重設鏡頭至最佳觀察視角
