<template>
  <div class="role-selector">
    <div class="title">
      <h1>WebRTC 相機分享</h1>
      <p>請選擇您的角色</p>
    </div>
    
    <div class="role-buttons">
      <button 
        class="role-button sender-button"
        @click="selectRole('sender')"
      >
        <div class="icon">📹</div>
        <div class="text">
          <div class="main-text">我是發送端</div>
          <div class="sub-text">分享我的相機畫面</div>
        </div>
      </button>

      <button 
        class="role-button receiver-button"
        @click="selectRole('receiver')"
      >
        <div class="icon">👁️</div>
        <div class="text">
          <div class="main-text">我是接收端</div>
          <div class="sub-text">觀看對方的畫面</div>
        </div>
      </button>
    </div>

    <div class="hint">
      <p>需要 HTTPS 或 localhost 環境</p>
      <p>兩個裝置都需要打開此頁面</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Role } from '../composables/useAppState'

const emit = defineEmits<{
  roleSelected: [role: Role]
}>()

const selectRole = (role: Role) => {
  emit('roleSelected', role)
}
</script>

<style scoped>
.role-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  text-align: center;
}

.title {
  margin-bottom: 60px;
}

.title h1 {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--fg);
}

.title p {
  font-size: 1.2rem;
  color: var(--muted);
  margin: 0;
}

.role-buttons {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 60px;
}

.role-button {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 32px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
  min-height: 120px;
  font-family: inherit;
}

.sender-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sender-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
}

.receiver-button {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.receiver-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(240, 147, 251, 0.3);
}

.icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.text {
  flex: 1;
}

.main-text {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.sub-text {
  font-size: 1rem;
  opacity: 0.9;
}

.hint {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.6;
}

.hint p {
  margin: 4px 0;
}

/* 手機優化 */
@media (max-width: 768px) {
  .role-selector {
    padding: 16px;
  }

  .title {
    margin-bottom: 40px;
  }

  .title h1 {
    font-size: 2rem;
  }

  .title p {
    font-size: 1.1rem;
  }

  .role-buttons {
    gap: 16px;
    margin-bottom: 40px;
  }

  .role-button {
    gap: 16px;
    padding: 20px 24px;
    min-height: 100px;
  }

  .icon {
    font-size: 2.5rem;
  }

  .main-text {
    font-size: 1.2rem;
  }

  .sub-text {
    font-size: 0.9rem;
  }
}

/* 小螢幕優化 */
@media (max-width: 480px) {
  .role-button {
    flex-direction: column;
    text-align: center;
    gap: 12px;
    padding: 24px 16px;
  }

  .text {
    width: 100%;
  }
}
</style>