# 喵町英語社 🐾

> 社員募集中！每天一點點・26 週衝多益 750

把多益學習做成手機遊戲的線上社團：主角是機器人社長貓「餅乾」。電腦、平板、手機都能用（PWA，可加入主畫面）。

## 玩法
- **今日任務**：單字卡、AI 口說、聽力 Part 2、文法 Part 5、跟讀。完成 1 項就算過關，每項都能拿「罐罐」。
- **昭和扭蛋機**：30 罐罐轉一次，抽餅乾的裝備（帽子、披風、火箭背包、鏡片）、稱號和貼紙，可以在衣櫃換裝。
- **26 週冒險地圖**：一週一關，第 6、12、18、24 週是魔王週。
- **遊戲中心**：每日猜字、單字隕石、文法魔王、迷你模擬考。
- **社員證**：等級、成就、統計、排行榜（需開啟雲端）。

## 檔案
| 檔案 | 內容 |
|---|---|
| `index.html` / `style.css` | 介面（依 `design/v6` 風格規範） |
| `app.js` | 主程式 |
| `data.js` | 課程內容、扭蛋獎品 |
| `mascot.js` / `icons.js` | 主角貓與圖示 |
| `firebase-config.js` | **填入 Firebase 設定的地方** |
| `firebase.js` / `firestore.rules` | 雲端登入、同步、排行榜與安全規則 |

## 開啟雲端同步
1. 在 Firebase 建立專案，開啟 Authentication（Google）與 Firestore。
2. 把網頁應用程式的 `firebaseConfig` 貼進 `firebase-config.js`。
3. 把 `firestore.rules` 的內容貼到 Firestore › 規則，按發布。
4. 在 Authentication › 設定 › 授權網域加入你的 GitHub Pages 網域。
