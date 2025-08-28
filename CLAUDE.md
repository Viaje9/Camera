# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個 WebRTC 相機分享應用程式，已從原始的單一 HTML 檔案重構為 Vue.js 架構。應用程式使用手動 SDP（Session Description Protocol）交換，實現兩台裝置間的點對點視訊串流，無需伺服器。

## 開發指令

### 專案設置
```bash
npm install
```

### 開發伺服器
```bash
npm run dev
```

### 生產建置
```bash
npm run build
```

### 代碼檢查與修正
```bash
npm run lint       # 執行所有 linting 工具
npm run lint:eslint # 僅執行 ESLint
npm run lint:oxlint # 僅執行 Oxlint
```

### 類型檢查
```bash
npm run type-check
```

### 代碼格式化
```bash
npm run format
```

## 架構

### 技術堆疊
- **Vue 3** + **TypeScript** + **Vite**
- **Pinia** 用於狀態管理
- **Vue Router** 用於路由（如需要）
- **WebRTC APIs**（RTCPeerConnection、MediaStream）
- 響應式設計與深色主題

### 檔案結構
```
src/
├── components/          # Vue 組件
│   ├── InitialRoleSelector.vue    # 角色選擇畫面
│   ├── SimplifiedSDPExchange.vue  # SDP 交換介面
│   ├── SenderView.vue             # 發送端畫面
│   ├── ReceiverView.vue           # 接收端畫面
│   └── VideoPlayer.vue            # 視訊播放器
├── composables/         # 可組合函式
│   ├── useAppState.ts             # 應用狀態管理
│   ├── useWebRTC.ts               # WebRTC 功能
│   ├── useMedia.ts                # 媒體存取功能
│   └── useClipboard.ts            # 剪貼簿功能
└── App.vue             # 主應用程式組件
```

### 核心 Composables

#### `useWebRTC.ts`
提供 WebRTC 核心功能：
- `createPeerConnection()` - 建立 RTCPeerConnection
- `createOffer()` / `createAnswer()` - SDP 處理
- `addStream()` - 添加媒體流
- ICE candidate 和 track 事件處理

#### `useAppState.ts`
管理應用程式狀態：
- 角色選擇（sender/receiver）
- 連線狀態管理
- SDP 資料交換
- UI 狀態控制

#### `useMedia.ts`
處理媒體裝置存取：
- `getUserMedia()` - 相機/麥克風存取
- 裝置切換（前後鏡頭）
- 媒體流管理

### WebRTC 連線流程
1. **角色選擇**：使用者選擇發送端或接收端角色
2. **初始化**：根據角色初始化 WebRTC 連線和媒體流
3. **SDP 交換**：
   - 發送端：生成 offer → 等待 answer
   - 接收端：接收 offer → 生成 answer
4. **連線建立**：完成 SDP 交換後建立 P2P 連線
5. **視訊串流**：開始點對點視訊傳輸

### 舊版本支援
- `test.html` - 保留原始單檔案 HTML 版本作為參考

### 瀏覽器相容性
- 需要 HTTPS 或 localhost 來存取相機
- 支援現代瀏覽器的 WebRTC 功能
- 包含 iOS Safari 和 Android 的行動裝置最佳化
- PWA 支援和響應式設計