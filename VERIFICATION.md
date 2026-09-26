# 驗收紀錄

更新日期：2026-09-26。這是進度紀錄，不代表專案已完成或上線。

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
| GitHub Pages | 正在發布 | 使用者已確認 diffusecapital-wq；公開 repo 已建立，待工作流程完成 |
| 公開網址 | 待驗證 | 沒有遠端部署成功紀錄，不宣稱已上線 |

## Edge 驗收操作與公開站點複查流程

1. 在實際瀏覽器視窗開啟本機 `?debug` 頁，記錄版本、視窗大小與 DPR。
2. 分別經過 10 個字形，包括 D 中空區和可見後層外緣；每個可見字形須觸發正確字母，透明空隙不應任意觸發。
3. 在部分 scroll 進度 hover，再移到空白，確認只回到當前基準而非初始字形。
4. 分段慢慢向下，停在 SHOW/REEL、鏡頭推進與影片階段；反向回到初始。記錄各階段畫面與至少足夠覆蓋穩定動畫的 frame time 樣本。
5. 確認影片在同頁播放；觀察不同播放時間的環境光及水面光色。退出時時間停止，重進時續播，光色跟隨實際播放時間。
6. 確認調整視窗後字母和影片不被裁掉、沒有頁面跳轉或水平捲軸、沒有未處理例外。
7. 在確認的 owner 下建立公開 repo，部署後開啟實際 HTTPS 網址，再檢查靜態資產、影片播放與主要正反向流程。

畫面與本機互動紀錄留在 `.local/evidence/`，不提交使用者桌面的截圖到公開 repo。
