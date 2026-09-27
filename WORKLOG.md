# 工作紀錄

## 2026-09-26 — 初版與既有 Edge 測試

完成 Three.js 層疊字形、逐字 morph、全局 scroll morph、四欄重排、鏡頭推進及 YouTube 嵌入。以 Edge 的實際視窗測到影片可靜音播放；舊版主要穩定階段約 60 FPS，但完整互動驗收尚未完成。

CSS 的跨來源 iframe 倒影測試沒有顯示實際影片影像，因此未將它認定成功。

## 2026-09-26 — 使用者修正影片需求

使用者說明目的為影片與網站有互動感，例如影片色彩帶動環境漸層，且不需要下載影片。保留 YouTube，改成依播放時間編排環境光 cue 和水面光色。移除本機影片與 VideoTexture 倒影路徑；不聲稱即時像素取色或真實影片倒影。

依公開影片各段畫面編排配色，播放器時間每 250ms 更新，光色平滑跟隨。六項自動測試通過。

## 2026-09-26 — 審查與停止電腦操作

獨立審查指出平面命中區與疊層外緣不完全一致。已改成對實際 InstancedMesh 每層交點取 SDF，排除淡出的層，保留移除字母的穩定 hover。已刪除過時的倒影診斷欄位。使用者隨後以 Escape 停止電腦操作，沒有宣稱新版 UI 驗收通過。

## 2026-09-26 — 發布準備

完成正式版建置、GitHub Actions Pages 工作流程、README 與驗收紀錄。受限環境的 `gh auth status` 曾報驗證失敗；在有網路權限的讀取中，`gh api user --jq .login` 成功確認為 `diffusecapital-wq`，所以目前不需要使用者重新登入。

目前進展：可以建置成靜態網站；仍未建立遠端 repo 或發布。下一步是取得發布帳號的選擇，完成新版 Edge 驗證後部署並驗證正式網址。原定 owner 是 `healkeiser`，目前登入的是 `diffusecapital-wq`；未自行更改目的帳號。

## 2026-09-26 — 帳號確認、Edge 驗證與發布

使用者確認使用 `diffusecapital-wq`，並允許恢復 Edge 操作。已建立公開 repo。Edge 已驗證全部 10 個字形、部分進度 hover 回到基準、正反向 scroll、SHOW/REEL 排版、鏡頭推進、同頁播放、退出暫停與重進續播。影片時間與環境光資料一致，沒有未處理例外。

測試視窗為 1355×1006，另驗證最大化的 2390×1392。各階段各取得 1,800 樣本，約 60 FPS。最大化時發現水面光色有矩形邊界，改為橢圓淡出並柔化環境光上緣；另微調尾段紅色光的起始時間。六項測試和正式版建置再次通過。下一步：推送並發布，驗證正式網址。

## 2026-09-26 — 上線與細邊抖動修正

首次 Pages 工作流程 36238328468 成功，正式 HTML／JS／CSS 均回應 200。Edge 正式站的初始畫面及影片播放已保存；內建瀏覽器也確認播放 state=1、error=null。

使用者回報字體細邊抖動。定位為未做像素抗鋸齒的高亮輪廓，加上 UV 波浪與每層獨立形變。改成平整薄片緩慢沿深度移動，亮邊依 fwidth 做覆蓋抗鋸齒，512px／16-bit 距離場，透明層排序與 CPU hover 取樣同步更新。新增 byte carry 與雙線性取樣測試，七項測試通過；獨立審查未發現阻擋發布的問題。本機大視窗目視與效能檢查通過，接著更新既有正式站。

細邊修正 `44d0826` 已由 Pages 工作流程 36239115670 成功部署。API 確認同一使用者 ID 321750111 已更名為 diffusework-wq，正式網址更新為 https://diffusework-wq.github.io/diffuse-showreel/ ，remote 與現行文件同步更新。正式 HTML、JS、CSS 均回應 200。

## 2026-09-26 — 影片聲音與參考配色

使用者再次授權恢復 Edge，並指出影片無聲。新增有聲優先、自動播放受阻時的靜音回退與影片內聲音按鈕；退出仍暫停、重入續播。三項控制流程測試通過。Edge 觀察到第一次滾入受阻後靜音，點擊開聲後出現音訊播放標誌；截圖及診斷留在本機。

使用者提供 Richard Yee 的 KOSMOS TRENDS! Promo，要求分析亮度和彩度。實際觀看頁面內影片，辨識大面積彩色亮面、近亮遠暗的層次、局部白色高光與深黑背景。依此提高字面色彩與亮度、降低白線占比，保留逐字色相和已修正的平穩邊緣。接著建置、發布並複查正式資產。

`4412613` 已由工作流程 36240152801 成功部署；正式 JS/CSS/HTML 均 200。Edge 正式站已複查新配色、變字、影片與點擊開聲，另外取得正式站取消靜音、退出暫停、重入續播的播放器資料；詳見 VERIFICATION.md。完成本輪網站交付與參考影片分析。

## 2026-09-26 — 按新圖校色與加入遠層柔焦

使用者提供 20:15 新圖作為顏色標準，並要求遠處稍微模糊、靠近清晰。改為逐字底色及高光，控制 RGB 範圍，恢復橙、金、紅及藍紫的區別。沿薄片深度計算柔焦，近層保留抗鋸齒、遠層散開邊緣覆蓋，鏡頭前推則平滑減少模糊；不增加幾何、後製 render pass 或移動字形輪廓。10 項測試、正式建置及本機畫面檢查通過。


## 2026-09-26 — 指定 DIFFUSE 色彩系統與玻璃光感

按使用者提供的色彩規範採用八組原始 Highlight/Core/Mid/Deep 色票，十字逐一配對；135° 漸層的節點為 0/18/48/76/100%，深部 alpha .45 並淡至透明黑。背景改成純黑。材質新增切面受光、局部柔光與飽和內側光帶；透明片先在線性光下合成，再單次轉成 sRGB，避免疊色偏暗。

改為十層：固定清晰前片與九層持續流動後片。深度亮度及光學密度連續下降，景深只柔化後片；前片和 16-bit 距離場抗鋸齒保留。這是即時 SDF 光學外觀近似，沒有宣稱物理光線追蹤。Canvas 與 UI 使用明確合成層。

13 項測試包含前片穩定性、透明循環接縫與深度衰減，全部通過；Edge 已驗證材質、I→H、SHOW/REEL、影片環境光、有聲播放與反向回到字母。

## 2026-09-26 — 霧面玻璃與白色暈光

使用者在發布前將方向修正為霧面玻璃，並要求更多白色暈開光感。最終材質已移除窄斜向鏡面反射，改為局部寬幅內部散射；主色用指定 Core 提亮，白色只集中在受光區。降低細邊反射，增加霧面表面的漫射密度，後片白光強度遞減，保留層次。依最新要求，局部高光允許加入中性白；各字核心色票保持原值。先前亮面版本並未單獨發布。

白暈只出現在受光區外圍，不改主輪廓 AA 或 hover 命中。漸層透明尾端加上淡出，避免散射密度重新抬亮透明終點。13 項測試與正式建置通過。

## 2026-09-26 — 參考影片的字面明度

對照使用者提供的 8.32 秒本機影片，檢視逐秒影格與較大的關鍵畫面。參考的光感以整片霧面受光面、帶原色的亮白，以及暗色透明／輪廓薄片的明度落差構成；上一版局部白光斑和外圍暈光過強，主體受光面不足。

改成寬幅帶色漫射，增加前片表面光學密度，保留飽和核心色；取消中性白混色和圓形光斑，局部高光使用指定色系的 Highlight。外圍溢光降低，遠片柔焦由 3.2 降為 1.8 CSS px，讓薄片層次更接近參考。固定前片、循環與 hover 對應保留。影片與擷取畫面僅保存在本機，不加入公開網站。

## 2026-09-26 — 新字形、輪廓線與方向性拖影

依新參考加入自訂幾何 D/I/F/E/U/R/W/H/L/O 字形，開口及筆畫比例重新調整；I 使用分離頂部短橫。S 與分隔符仍由系統粗體字形產生距離場；此為參考比例重繪，未聲稱辨識出圖片的原始字型。D 下方改為 DEFINE / THE VISION，小字加粗、提亮。

加強薄片輪廓與局部光暈，降低大面積字面的遮蔽。拖影使用投影後的 Z 軸移動方向，以 8 次加權 SDF 取樣模擬延長曝光；固定前片的位移嚴格為零，後層才出現方向性模糊。16-bit 距離場與像素覆蓋抗鋸齒保留。

13 項測試、正式建置通過。瀏覽器已確認分離 I 的 hover 可到 H、兩行轉字及 D 新文案。1707×960、DPR 1.5 的開場與鏡頭推進約 60 FPS，11 draw calls / 201 triangles，errors=[]。正式 bundle 約 500.5 kB（gzip 約 130.1 kB），Vite 僅提出大小提示，建置成功。


## 2026-09-27 — Right-turn letter replacement

Hover and wheel now share a reversible turn from -0.38 to +0.70 radians around Y. Replacement begins after the turn starts and finishes before camera push. SHOW / REEL retains the opposite facing. Stable silhouette acquisition and slot retention prevent rotation-induced hover oscillation. Palette and glass rendering are unchanged.

Validation: 14 tests pass; production build passes. Browser checks confirm D to S hover settles at +0.70, all SHOW / REEL letters settle at +0.70 at scroll progress 0.5242, removed letters are transparent, and reverse scroll restores the initial composition.


## 2026-09-27 — Reference angle and color correction

Supersedes the previous shallow final tilt: final yaw +0.55 rad, pitch -0.50 rad. Narrow 16-degree camera FOV and proportionally increased distance reduce inconsistent perspective across columns while preserving framing and the camera-push timeline. Glass depth projects diagonally down-left. Replace broad pastel face illumination with two localized white transmission cuts and saturated core areas; reduce rear defocus and trail length to retain thin contours.

Browser visual verification: SHOW / REEL at progress 0.5242 has the revised diagonal depth and stronger color/white contrast, no console errors.


## 2026-09-27 — Live glass effect controls

Added accessible collapsible effect panel: individual letter core/highlight colors; global saturation, highlight strength/softness, 2–24 glass layers, transparent-to-solid fill, overall opacity, contour strength and halo. Preview scrubber stops at SHOW/REEL. Changes persist locally with validated bounded settings, reset and JSON export; they do not publish visitor changes. Broader soft highlights are the new defaults. Panel wheel/touch input is isolated from scene scroll.

Validation: 16 tests pass, including malformed saved settings and every layer count. Browser verified 24-layer rendering, live softness/fill, preview scrub, scroll isolation (progress stays 0.53), reload persistence, reset and no console errors.


## 2026-09-27 — Light shapes, depth curves and font editing

Added dual-strip, strip, elliptical and rectangular analytic light profiles with width/height, position and angle. Highlight colors now directly use the selected color without forced neutral-white mixing. Material panel includes roughness and explicitly labeled approximate Schlick IOR (no physical scene refraction). Three-node draggable depth curves independently control fill and contours across rear/middle/front layers, with numeric alternatives and a 0/1/0 fill preset.

Font selection rebuilds SDF textures and disposes prior GPU textures. Built-in system font choices persist. Local FontFace files remain in the current tab only, are never uploaded and are not embedded in JSON; reload falls back safely to design glyphs. Settings export now includes the new fields.

Verification: 18 tests pass including curve interpolation bounds, preset migration and font validation. Browser verified ellipse selection, 0/1/0 fill, direct midpoint drag to 0.49, Georgia rendering, successful local Arial TTF loading, saved curve/Georgia after reload, reset, and no console errors. Production build passed.


## 2026-09-27 — Smooth halo, light count and independent transforms

Glow now uses a stable texture-space Gaussian distance with neighboring SDF averaging, avoiding derivative-driven corner spikes while keeping face/contour AA separate. Added 1–6 area-light copies with plus/minus buttons and bounded slider. DIFFUSE and SHOW/REEL independently expose XYZ degrees and center/front/rear pivot, with endpoint preview buttons. Hover and scroll interpolate endpoint settings. Visible mesh acquisition handles custom rotations, with slot retention during hover. Settings persist/export with backward-compatible defaults.

Verification: 19 tests pass and build passes. Browser verified count 2 to 3, saved values after reload, SHOW/REEL Y=-10 degrees yields -0.175 radians while DIFFUSE remains -0.38, front-pivot selection, smooth-halo appearance, reset and no console errors.


## 2026-09-27 — Contour-preserving letter transitions

The reported W/E and R/L notches came from interpolated signed-distance fields, not simply pixel aliasing. Default now shades complete source and target glyphs independently, then crossfades premultiplied linear-light results. Added rear-to-front layer replacement; original SDF morph is an explicitly labeled optional mode. Endpoint rendering skips the extra glyph evaluation. Raycast coverage follows the selected mode; previous material/font/axis settings are retained.

Verification: 20 tests pass, production build passes. Browser verified crossfade and layer replacement at progress 0.2773, intact W/E and R/L contours rather than interpolated dents, no console errors, approximately 60 FPS on the current preview.

## 2026-09-27 — Subtle hover diffusion

Added a separate, padded and Gaussian-blurred glyph glow behind each hovered letter. The glow inherits letter color, follows source/target changes and rotations, eases in and fades out. New persisted controls expose spread distance, blur dissipation and strength; conservative defaults keep it subtle without blurring the glass contours. Texture regeneration is debounced and old textures are disposed.

Verification: 21 tests pass, production build passes. Browser verified hover activation, fade-out, all three controls and visibly broader/softer glow at increased settings. No console errors.

## 2026-09-28 — Additional diffusion and independent background gradient

Preserved small hover glow. Added an independently masked, billboarded additive glyph diffusion layer with directional multi-sample streaks, animated expansion and decay, and subtle distortion. This is an artistic glyph-mask effect, not physical illumination or temporal motion blur. Added independent two-color background wash with intensity, range, position and angle controls. Settings persist/export and migrate older presets. Both effects can be disabled with strength zero.

Verification: 22 tests and production build pass. Browser confirmed large hover color spread, editable background color and intensity, scrolling and no console errors. Background uses the same linear compositing/output pass and fades with the scene at cinema entry.
