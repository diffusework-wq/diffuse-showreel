# 驗收紀錄

更新日期：2026-09-26。網站已發布；下方區分已保存的驗收證據與後續視覺修正。

## 目前證據

| 項目 | 狀態 | 證據與限制 |
| --- | --- | --- |
| 字母對應與消失位置 | 通過程式驗證 | `tests/timeline.test.mjs`：上排 SHOW、下排 REEL，索引 2、7 消失 |
| 滾動可逆與轉場順序 | 通過程式驗證 | 同測試：正反向 1,001 個位置；變字完成後鏡頭才開始前推 |
| hover 離開回到當前進度 | 通過程式與 Edge 驗證 | `edge-partial-baseline/hover/release.json`：progress 0.3274，I/H morph 0.685 → 1 → 0.685 |
| 影片配色與時間同步 | 通過函式與 Edge 驗證 | `edge-current-film-a/b.json` 與對應畫面：播放器和 atmosphere 的 time 相同，配色隨段落改變；屬編排光色，不是像素取樣 |
| 正式版建置 | 通過 | `npm run build` 成功；靜態入口使用 `/diffuse-showreel/` |
| Edge 影片可播放與續播 | 通過 | `edge-pause-a/b.json`：state=2、time=2.675445 保持不變；`edge-resume.json`：state=1、time=4.347，未重頭播放，沒有播放錯誤 |
| 效能 | 實機量測完成 | `edge-showreel.json`：五個階段各 1,800 樣本，約 59.76–59.98 FPS，p95 約 16.8ms；限此機器與測試條件，不承諾所有硬體達到 60 FPS |
| 初次部署版 Edge 互動與畫面 | 主流程通過 | `edge-all-hover.json` 含 0–9 全部 hover；正反向 wheel 記錄與初始、SHOW/REEL、鏡頭和影片截圖已保存；errors=[] |
| Edge resize | 通過 | 1355×1006 與最大化 2390×1392；DPR 1.6、渲染上限 1.5，字體及影片都完整；`edge-resize-film.json`、`edge-maximized-initial.png` |
| GitHub Pages | 已發布 | 首次工作流程 [36238328468](https://github.com/diffusework-wq/diffuse-showreel/actions/runs/36238328468) 成功 |
| 公開網址 | 通過 | `production-http.json`：HTML、JS、CSS 均 200；`edge-production-initial.png`、`edge-production-film.png` 顯示正式 HTTPS 網址與播放畫面；內建瀏覽器也觀察到 state=1、error=null |

## Edge 驗收操作與公開站點複查流程

1. 在實際瀏覽器視窗開啟本機 `?debug` 頁，記錄版本、視窗大小與 DPR。
2. 分別經過 10 個字形，包括 D 中空區和可見後層外緣；每個可見字形須觸發正確字母，透明空隙不應任意觸發。
3. 在部分 scroll 進度 hover，再移到空白，確認只回到當前基準而非初始字形。
4. 分段慢慢向下，停在 SHOW/REEL、鏡頭推進與影片階段；反向回到初始。記錄各階段畫面與至少足夠覆蓋穩定動畫的 frame time 樣本。
5. 確認影片在同頁播放；觀察不同播放時間的環境光及水面光色。退出時時間停止，重進時續播，光色跟隨實際播放時間。
6. 確認調整視窗後字母和影片不被裁掉、沒有頁面跳轉或水平捲軸、沒有未處理例外。
7. 在確認的 owner 下建立公開 repo，部署後開啟實際 HTTPS 網址，再檢查靜態資產、影片播放與主要正反向流程。

畫面與本機互動紀錄留在 `.local/evidence/`，不提交使用者桌面的截圖到公開 repo。

## 字體邊緣穩定化

使用者指出初版細邊移動時抖動。修正高亮輪廓的像素覆蓋抗鋸齒，移除 UV 波浪與薄片個別橫移、旋轉、縮放；保留較慢的剛性 Z 軸推進。字形改為 512px、雙 16-bit 距離場並保留邊緣覆蓋資訊；透明薄片持續由遠到近排列，hover 使用相同的解碼與雙線性取樣。

七項測試與正式版建置通過。獨立審查確認 GPU／CPU 解碼相符、循環端點透明且重排連續。本機 1707×960、DPR 1.5 視覺檢查中，直邊已無 UV 扭動；hover 和 SHOW/REEL 轉換正常，穩定與推進階段約 60 FPS、errors=[]。資料在 `smoothing-browser.json`。這些是特定條件下的量測，畫面舒適度仍以使用者實際觀看為準。

修正 commit `44d0826` 的 Pages 工作流程 [36239115670](https://github.com/diffusework-wq/diffuse-showreel/actions/runs/36239115670) 成功，正式資產 `index-CFvtfxIg.js` 與 CSS、HTML 都是 HTTP 200（`smoothing-production-http.json`）。GitHub 帳號已由 diffusecapital-wq 更名為 diffusework-wq，使用者 ID 保持 321750111。

恢復授權後以 Edge 153、1230×1006、DPR 1.4 再次確認直邊、I→H、scroll 變字、完整 SHOW/REEL 與進入影片；截圖為 `edge-smoothing-initial.png`、`edge-smoothing-showreel.png`，約 60 FPS、errors=[]。

## 聲音與參考影片配色

使用者指出影片無聲，已移除每次進入就強制靜音的行為。優先有聲播放，受瀏覽器攔截時只嘗試一次靜音回退，並提供「開啟聲音」。三個新增測試涵蓋有聲請求、回退與點擊恢復、靜音選擇跨退出／重入保留、雙重攔截不無限重試，以及退出後延遲事件不重啟播放。

Edge 實測觀察到受阻後靜音播放（`edge-audio-muted-fallback.json`），點擊後按鈕變成「關閉聲音」、Edge 分頁出現音訊播放標誌（`edge-audio-enabled.png`）。該截圖之後保存的同名 JSON 已是再次靜音狀態，因此不能拿那份 JSON 宣稱持續有聲或喇叭實際音量。

依使用者提供的 [KOSMOS TRENDS! 影片](https://richardyee.design/kosmos-trends-promo)，檢視約 12 秒藍色薄片、26 秒 FUTURE 與結尾主視覺：保留各字色相差异，增強彩色字面、近層亮度，減少白色邊線占比；遠層暗部和既有像素抗鋸齒保留。新版在 1707×960 的瀏覽器畫面已檢查，字形的正面色彩較鮮明。

## 最終正式站驗證

程式 commit `4412613` 的 [Pages 工作流程 36240152801](https://github.com/diffusework-wq/diffuse-showreel/actions/runs/36240152801) 已成功完成安裝、10 項測試、建置與部署。正式 HTML、`index-D7A2C2ID.js`、`index-nevMR12_.css` 均回應 200，JS 不含本機診斷傳送端點。網址為 https://diffusework-wq.github.io/diffuse-showreel/ 。

Edge 正式站已複查更新後的彩色字面、SHOW/REEL、影片播放和點擊開聲；`edge-final-colors.png`、`edge-final-audio.png`、`edge-final-return.png` 保存相應畫面。開聲後 Edge 分頁的音訊標誌可見，返回字體後消失。

另以正式站播放器的診斷確認：開聲後 state=1、muted=false、volume=80、time=20.058；向上離開後 state=2、time=20.467；重入後 state=1、muted=false、time=32.187，均 error=null、errors=[]。這證明網站已取消靜音且保留續播，不代表對使用者作業系統／喇叭音量的量測。現有 hover、對應、轉場、環境光、Edge 主流程證據與上述新功能測試共同覆蓋目前版本；字體材質和配色的主觀偏好仍可繼續調整。

## 最新參考圖校色與景深

依 20:15 參考圖重新設定 10 格的底色與獨立高光；移除高倍率 RGB 增益，避免橙色截頂偏黃、紅色泛粉。線性 RGB 色彩保持有界，高光以各字指定色混合。

逐層柔焦沿玻璃的遠→近位置連續減少，最近約 18% 的層只保留原有抗鋸齒。遠層最大柔化尺度 3.2 CSS px，鏡頭前推時同步減少；輪廓採兩個平滑覆蓋函數之差，使失焦時亮度分散，不增粗亮邊。這是低成本的 SDF 景深近似，不對 UI 或影片套模糊。

10 項測試與正式建置通過。瀏覽器 1707×960 畫面確認逐字配色、近清遠柔、I→H hover；穩定階段 1,800 樣本約 59.98 FPS，errors=[]。唯讀審查確認 DPR 換算、循環端點、正反向景深和 hover 命中保留。
