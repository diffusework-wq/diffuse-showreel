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
| 最新版 Edge 互動與畫面 | 主流程通過 | `edge-all-hover.json` 含 0–9 全部 hover；正反向 wheel 記錄與初始、SHOW/REEL、鏡頭和影片截圖已保存；errors=[] |
| Edge resize | 通過 | 1355×1006 與最大化 2390×1392；DPR 1.6、渲染上限 1.5，字體及影片都完整；`edge-resize-film.json`、`edge-maximized-initial.png` |
| GitHub Pages | 已發布 | 首次工作流程 [36238328468](https://github.com/diffusecapital-wq/diffuse-showreel/actions/runs/36238328468) 成功 |
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
