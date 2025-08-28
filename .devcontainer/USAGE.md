# DevContainer 設定檔案使用說明

## 檔案說明

### 通用檔案（可直接複製使用）
- **Dockerfile**: Node.js 專案的基礎 Docker 映像檔設定，包含必要的開發工具和環境配置
- **init-firewall.sh**: 防火牆初始化腳本，適用於所有 Node.js 專案的安全設定

### 需要調整的檔案
- **devcontainer.json**: 專案特定的開發容器配置，需根據專案需求進行調整

## 使用步驟

1. 複製 `Dockerfile` 和 `init-firewall.sh` 到新專案的 `.devcontainer` 目錄
2. 複製 `devcontainer.json` 並根據專案需求修改以下設定：
   - `name`: 專案名稱
   - `runArgs.name`: 容器名稱（建議使用專案名稱）
   - `mounts`: 掛載設定（特別是 Claude 配置的掛載方式）
   - `forwardPorts`: 專案所需的埠號
   - `postCreateCommand`: 專案初始化指令
   - `customizations`: VS Code 擴充功能和設定

## 注意事項

- 確保 Docker 和 VS Code Dev Containers 擴充功能已安裝
- 首次啟動容器時會自動執行 `init-firewall.sh` 腳本
- `postCreateCommand` 中的 `sleep 10` 用於等待 VS Code 擴充功能初始化完成，避免防火牆過早啟動導致網路連線中斷
- 如需使用 Claude 配置綁定掛載，請確保本機有 `~/.claude` 目錄