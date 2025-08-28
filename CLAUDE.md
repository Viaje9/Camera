# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個 WebRTC 相機分享應用程式，以單一 HTML 檔案（`test.html`）實作。該應用程式使用手動 SDP（Session Description Protocol）交換，實現兩台裝置間的點對點視訊串流，無需伺服器。

## 架構

### 核心組件
- **單檔案 HTML 應用程式**：整個應用程式包含在 `test.html` 中，內嵌 CSS 和 JavaScript
- **WebRTC P2P 連線**：使用 RTCPeerConnection 進行直接的點對點視訊串流
- **手動訊令交換**：不使用訊令伺服器，使用者需手動複製/貼上 SDP offers 和 answers
- **角色導向操作**：支援兩種角色 - 發送端（分享相機）和接收端（觀看視訊）

### 主要功能
- 相機/麥克風存取，支援前後鏡頭切換
- 即時視訊串流，可選音訊
- 本機和遠端視訊的鏡像翻轉控制
- 遠端視訊全螢幕支援
- 手動 SDP 交換工作流程，整合剪貼簿功能
- 響應式設計搭配深色主題

### WebRTC 流程
1. **發送端**：建立 offer → 複製 SDP → 接收 answer → 建立連線
2. **接收端**：接收 offer → 建立 answer → 複製 SDP → 建立連線
3. 使用 Google STUN 伺服器進行 NAT 穿透

## 開發

### 檔案結構
- `test.html` - 包含 HTML、CSS 和 JavaScript 的完整單頁應用程式

### 技術堆疊
- Vanilla JavaScript（無框架）
- WebRTC APIs（RTCPeerConnection、MediaStream）
- CSS Grid 和 Flexbox 佈局
- HTML5 video 元素

### 主要 JavaScript 函式（test.html:113-299）
- `makePC()` - 建立配置 STUN 的 RTCPeerConnection
- `start()` - 根據選擇的角色初始化媒體串流
- `createOffer()` - 為發送端建立 SDP offer
- `setOfferAndCreateAnswer()` - 處理 offer 並為接收端建立 answer
- `applyAnswer()` - 套用最終 answer 完成連線

### 瀏覽器相容性
- 需要 HTTPS 或 localhost 來存取相機
- 包含不同全螢幕 API 的後備方案
- iOS Safari 視訊播放的特殊處理