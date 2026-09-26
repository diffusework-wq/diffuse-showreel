# DIFFUSE.WORK — Showreel

Three.js 玻璃疊層字體、滑鼠感應、可逆的滾輪轉場，以及 YouTube 影片同步環境光。

## 本機執行

需要 Node.js 22.12 以上。

```sh
npm ci
npm run dev
```

開啟 `http://127.0.0.1:5173/diffuse-showreel/`。

```sh
npm test
npm run build
npm run preview
```

正式版預覽網址為 `http://127.0.0.1:4173/diffuse-showreel/`。不要直接以檔案總管開啟 HTML。

## 操作與內容

- 初始為 `DIFFU / SE-WR`，每個字母由 15 層持續流動的透明平面組成。
- 滑鼠碰到字形時，該字母漸變成對應字母；離開後回到目前滾輪進度的形狀。
- 往下滾動，所有字母過渡至 `SHOW / REEL`，中間兩格消失，鏡頭繼續推進影片；往上可原路返回。
- 影片保留 YouTube 嵌入，在同一頁靜音自動播放。離開影片階段暫停，重新進入續播，結尾循環。
- 背景與水面使用依影片段落編排的配色，跟隨播放器回報的播放時間。這不是逐幀取色，也不是影片畫面的鏡像倒影。網站不下載或保存影片。
- 觸控裝置可上下滑動瀏覽流程；沒有滑鼠的裝置沒有 hover 效果。

| 初始上排 | D | I | F | F | U |
| --- | --- | --- | --- | --- | --- |
| 轉換上排 | S | H | 消失 | O | W |
| 初始下排 | S | E | - | W | R |
| 轉換下排 | R | E | 消失 | E | L |

## 維護位置

- `src/timeline.js`：字母對應、色彩、標籤與轉場區間。
- `src/glyphs.js`：字形距離場與玻璃材質。字形在瀏覽器生成，無外部模型。
- `src/main.js`：場景、實際疊層字形命中、鏡頭、滾輪與動畫。
- `src/config.js`：YouTube 影片 ID。
- `src/video.js`：YouTube 播放控制。
- `src/atmosphere.js`：影片時間與環境光配色。更換影片時應一起更新 cue 時間與色彩。
- `src/style.css`：排版、水面與環境光。

## GitHub Pages

此專案使用公開 repo `diffusecapital-wq/diffuse-showreel`。正式網址為 `https://diffusecapital-wq.github.io/diffuse-showreel/`，發布驗證進度見 `VERIFICATION.md`。

`.github/workflows/pages.yml` 已包含安裝、測試、建置和部署。設定 repo 的 **Settings → Pages → Source → GitHub Actions** 後，推送 `main` 會發布 `dist`。不需要後端、付費主機或自訂網域。

若更改 repo 名稱，需同步修改 `vite.config.js` 的 `base`。公開 repo 只應提交程式與文件，`.local`、`node_modules`、`dist` 和私人檔案已排除。

部署設定參考 [GitHub Pages 官方文件](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 與 [Vite 官方部署文件](https://vite.dev/guide/static-deploy.html#github-pages)。

## 驗證

`npm test` 驗證字母映射、轉場順序與可逆性、hover 返回滾輪基準、最終字距，以及影片光色 cue 的尋址和範圍。

本機開發網址加 `?debug` 會顯示可檢查的診斷面板；`?debug=quiet` 隱藏面板但保留記錄。開發伺服器每 2.5 秒將診斷存到 `.local/evidence/edge-latest.json`；這只發送到本機，不會在正式版傳送。面板記錄瀏覽器、視窗大小、各階段 frame time、互動事件、影片狀態、環境光時間和例外。

Edge 本機主要互動與播放驗證已完成，部署與公開網址狀態詳見 `VERIFICATION.md`。實機五個階段各 1,800 樣本約 60 FPS；效能仍取決於裝置與視窗大小。

## 外部服務

影片使用 [Diffuse.work 的指定 YouTube 影片](https://www.youtube.com/watch?v=FUFHxqJYgkk)。YouTube 的嵌入許可、網路或瀏覽器自動播放設定會影響播放；發生錯誤時網站顯示狀態訊息並保留向上返回的操作。UI 字體透過 Google Fonts 載入，失敗時使用本機 Arial。
