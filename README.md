# 📹 WebRTC Camera Share

一個基於 Vue 3 + TypeScript 的點對點視訊分享應用程式，使用手動 SDP 交換實現兩台裝置間的即時視訊串流，無需任何伺服器。

## ✨ 功能特色

### 🎥 **核心功能**
- **點對點視訊分享**：直接在兩台裝置間建立 WebRTC 連線
- **手動 SDP 交換**：透過複製貼上完成連線建立，無需伺服器
- **雙向角色支援**：可選擇作為發送端或接收端
- **即時視訊串流**：高品質的實時視訊傳輸

### 🔄 **發送端功能**
- **相機切換**：支援前鏡頭/後鏡頭切換
- **鏡像效果**：前鏡頭自動開啟鏡像，後鏡頭關閉
- **即時預覽**：本地視訊預覽畫面
- **連線狀態**：即時顯示連線狀態和資訊

### 📺 **接收端功能**
- **全螢幕模式**：雙擊進入/退出全螢幕
- **畫面控制**：鏡像翻轉、畫面調整
- **智慧控制項**：全螢幕時自動隱藏控制項
- **視訊優化**：自動調整畫面比例和品質

### 📱 **行動裝置優化**
- **響應式設計**：完美支援手機和平板
- **觸控友善**：最佳化觸控操作體驗
- **自動旋轉**：支援橫豎屏切換
- **PWA 支援**：可安裝為原生應用程式

### 🎨 **使用者介面**
- **深色主題**：現代化深色主題設計
- **自定義彈窗**：美觀的確認對話框
- **狀態指示**：清楚的連線狀態顯示
- **直覺操作**：簡潔易用的使用者介面

## 🚀 快速開始

### 環境需求
- Node.js 18+ 
- 現代瀏覽器（支援 WebRTC）
- HTTPS 或 localhost 環境（存取相機需要）

### 安裝與執行

```bash
# 克隆專案
git clone <repository-url>
cd webrtc-camera-share

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 開啟瀏覽器訪問 http://localhost:5173
```

### 生產部署

```bash
# 建置專案
npm run build

# 預覽建置結果
npm run preview

# 程式碼檢查
npm run lint

# 類型檢查
npm run type-check

# 格式化程式碼
npm run format
```

## 📊 WebRTC 通訊時序圖

### 完整通訊流程

```mermaid
sequenceDiagram
    participant S as 📱 發送端
    participant U1 as 👤 發送端使用者
    participant U2 as 👤 接收端使用者  
    participant R as 📺 接收端
    
    Note over S,R: 🚀 初始化階段
    S->>S: 選擇「發送端」角色
    R->>R: 選擇「接收端」角色
    
    Note over S,R: 📹 媒體準備階段
    S->>S: 初始化相機 (getUserMedia)
    S->>S: 創建 RTCPeerConnection
    S->>S: 添加視訊軌道到連線
    R->>R: 創建 RTCPeerConnection
    
    Note over S,R: 🤝 SDP 交換階段 (Offer)
    S->>S: 創建 Offer
    S->>S: 設定本地描述 (setLocalDescription)
    S->>S: 等待 ICE 候選收集完成
    S->>S: 生成完整的 Offer JSON
    
    S-->>U1: 📋 顯示「複製 Offer」按鈕
    U1->>U1: 👆 點擊複製按鈕
    U1->>U1: 📱 透過訊息 app 傳送給接收端
    
    U2->>U2: 📱 收到 Offer JSON
    U2-->>R: 📄 貼上 Offer JSON
    R->>R: 解析並設定遠端描述
    R->>R: 創建 Answer
    R->>R: 設定本地描述
    R->>R: 等待 ICE 候選收集完成
    R->>R: 生成完整的 Answer JSON
    
    Note over S,R: 🤝 SDP 交換階段 (Answer)
    R-->>U2: 📋 顯示「複製 Answer」按鈕
    U2->>U2: 👆 點擊複製按鈕 (重要！)
    Note right of U2: 🔑 只有點擊複製後<br/>接收端才允許進入連線畫面
    U2->>U2: 📱 透過訊息 app 傳送給發送端
    
    U1->>U1: 📱 收到 Answer JSON
    U1-->>S: 📄 貼上 Answer JSON
    S->>S: 解析並設定遠端描述
    
    Note over S,R: 🌐 ICE 連線建立
    S<-->R: ICE 候選交換 (內建於 SDP)
    S<-->R: DTLS 握手
    S<-->R: SRTP 金鑰交換
    
    Note over S,R: 📡 媒體傳輸開始
    S->>R: 🎥 開始傳送視訊流
    R->>R: onTrack 事件觸發
    R->>R: 檢查使用者已複製 Answer
    R->>R: ✅ 切換到接收畫面
    S->>S: ✅ 切換到發送畫面
    
    Note over S,R: 🎮 即時互動功能
    U1->>S: 🔄 切換相機
    S->>S: 停止舊軌道
    S->>S: 獲取新相機流
    S->>R: 替換視訊軌道 (replaceTrack)
    R->>R: 🔄 顯示新相機畫面
    
    U2->>R: 🪞 切換鏡像
    R->>R: 🪞 翻轉顯示畫面
    
    U2->>R: ⊡ 進入全螢幕
    R->>R: 📺 全螢幕顯示
    
    Note over S,R: 🔌 斷線處理
    U1->>S: ❌ 點擊斷開連線
    S->>S: 🔔 顯示自定義確認彈窗
    U1->>S: ✅ 確認斷開
    S->>S: 關閉 PeerConnection
    S->>S: 停止所有媒體軌道
    S->>S: 🏠 返回角色選擇
```

### 關鍵時序點說明

| 階段 | 關鍵點 | 說明 |
|------|--------|------|
| **初始化** | 角色選擇 | 使用者選擇發送端或接收端角色 |
| **媒體準備** | 相機權限 | 發送端請求相機存取權限 |
| **Offer 階段** | ICE 收集 | 等待所有 ICE 候選收集完成 |
| **答案階段** | 使用者複製 | 🔑 接收端必須手動複製 Answer |
| **連線建立** | 狀態檢查 | 確認雙方都完成 SDP 交換 |
| **媒體傳輸** | 軌道事件 | onTrack 觸發並檢查連線條件 |

## 🏗️ 技術架構

### 核心技術棧
- **Vue 3** - 現代化前端框架
- **TypeScript** - 類型安全開發
- **Vite** - 快速建置工具
- **Pinia** - 狀態管理
- **WebRTC** - 點對點通訊

### 檔案結構
```
src/
├── components/           # Vue 組件
│   ├── InitialRoleSelector.vue      # 角色選擇畫面
│   ├── SimplifiedSDPExchange.vue    # SDP 交換介面  
│   ├── SenderView.vue               # 發送端畫面
│   ├── ReceiverView.vue             # 接收端畫面
│   ├── VideoPlayer.vue              # 視訊播放器
│   └── ConfirmModal.vue             # 自定義確認彈窗
├── composables/         # 可組合函式
│   ├── useAppState.ts               # 應用狀態管理
│   ├── useWebRTC.ts                 # WebRTC 核心功能
│   ├── useMedia.ts                  # 媒體裝置存取
│   └── useClipboard.ts              # 剪貼簿功能
├── App.vue             # 主應用程式
└── main.ts            # 應用程式入口
```

### 核心 Composables

#### `useWebRTC.ts`
WebRTC 連線管理的核心功能：
- `createPeerConnection()` - 建立 RTCPeerConnection
- `createOffer()` / `createAnswer()` - SDP 處理
- `replaceTrack()` - 動態替換媒體軌道
- ICE candidate 和 track 事件處理

#### `useAppState.ts`
全域應用狀態管理：
- 角色選擇（sender/receiver）
- 連線狀態追踪
- SDP 資料交換
- UI 狀態控制

#### `useMedia.ts`
媒體裝置存取與控制：
- `getUserMedia()` - 相機/麥克風存取
- 裝置切換（前後鏡頭）
- 全螢幕控制
- 媒體流管理

## 🔧 進階功能

### 相機切換機制
使用 WebRTC 的 `replaceTrack` API 實現無縫相機切換：
1. 獲取新的媒體流
2. 替換 PeerConnection 中的視訊軌道
3. 更新本地預覽
4. 對方即時看到新畫面

### 自定義彈窗系統
替代瀏覽器原生對話框：
- 美觀的 UI 設計
- 支援不同類型（primary/danger/warning）
- 完整的鍵盤和觸控支援
- 動畫過渡效果

### 狀態同步機制
確保雙方操作同步：
- 追踪使用者 SDP 複製狀態
- 防止過早進入連線畫面
- 明確的流程控制點

## 🌐 瀏覽器支援

### 桌面瀏覽器
- ✅ Chrome 88+
- ✅ Firefox 84+  
- ✅ Safari 14+
- ✅ Edge 88+

### 行動瀏覽器
- ✅ Chrome Mobile 88+
- ✅ Safari iOS 14+
- ✅ Firefox Mobile 84+
- ✅ Samsung Internet 15+

### WebRTC 功能需求
- RTCPeerConnection
- getUserMedia
- MediaStream
- RTCDataChannel (未來擴展)

## 🔒 安全性考量

### HTTPS 需求
- **生產環境**：必須使用 HTTPS
- **開發環境**：localhost 自動被信任
- **相機存取**：現代瀏覽器安全要求

### 隱私保護
- **點對點連線**：資料不經過伺服器
- **本地處理**：所有媒體處理在本地進行
- **無資料收集**：不收集任何使用者資料

### 網路安全
- **DTLS 加密**：WebRTC 內建端到端加密
- **SRTP 協定**：安全的即時傳輸協定
- **ICE 框架**：安全的連線建立機制

## 🐛 故障排除

### 常見問題

**Q: 無法存取相機**
- 確認使用 HTTPS 或 localhost
- 檢查瀏覽器相機權限設定
- 確認相機沒有被其他應用程式占用

**Q: 連線建立失敗**
- 檢查網路連線狀況
- 確認防火牆設定
- 嘗試重新整理頁面

**Q: 畫面卡頓或延遲**
- 檢查網路頻寬
- 關閉其他網路密集應用
- 嘗試切換網路環境

**Q: 接收端沒有畫面**
- 確認已正確複製並貼上 SDP
- 檢查 JSON 格式是否正確
- 確認雙方都完成了 SDP 交換

### 除錯技巧
1. **開啟瀏覽器開發者工具**查看 console 訊息
2. **檢查 Network 標籤**確認無網路錯誤
3. **查看 console.log 輸出**了解連線狀態
4. **重新整理頁面**清除暫存狀態

## 🚀 部署指南

### Vercel 部署
```bash
npm run build
vercel --prod
```

### Netlify 部署
```bash
npm run build
# 將 dist/ 資料夾拖拽到 Netlify 
```

### GitHub Pages
```bash
npm run build
# 設定 GitHub Pages 指向 dist/ 分支
```

### 自主託管
```bash
npm run build
# 將 dist/ 內容上傳到 web 伺服器
# 確認支援 HTTPS
```

## 📈 效能最佳化

### 建置最佳化
- Tree-shaking 移除未使用程式碼
- 程式碼分割提升載入速度
- 壓縮最佳化減少檔案大小

### 執行時最佳化
- 響應式資料最小化
- 事件監聽器適當清理
- 媒體流資源管理

### 網路最佳化
- ICE 候選快取
- 連線狀態監控
- 自動重連機制

## 🤝 貢獻指南

### 開發環境設置
```bash
git clone <repository-url>
cd webrtc-camera-share
npm install
npm run dev
```

### 程式碼品質
```bash
# 執行所有檢查
npm run lint
npm run type-check

# 自動格式化
npm run format
```

### 提交規範
- `feat:` 新功能
- `fix:` 錯誤修正  
- `docs:` 文件更新
- `style:` 樣式調整
- `refactor:` 程式碼重構

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 文件。

## 🙏 致謝

- WebRTC 社群的技術支持
- Vue.js 團隊提供優秀的框架
- 所有貢獻者的寶貴建議

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**

*如有任何問題或建議，歡迎提交 Issue 或 Pull Request！*