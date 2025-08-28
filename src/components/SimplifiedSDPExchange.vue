<template>
  <div class="sdp-exchange">
    <div class="header">
      <button class="back-button" @click="$emit('back')">
        ← 返回
      </button>
      <h2>{{ isSender ? '發送端' : '接收端' }} - SDP 交換</h2>
    </div>

    <!-- 接收端：初始等待 Offer -->
    <div v-if="!isSender && !remoteSDP" class="sdp-section">
      <div class="section-header">
        <h3>🎯 等待發送端提供 SDP</h3>
        <button 
          class="paste-button"
          @click="pasteRemoteSDP"
          :disabled="pasting"
        >
          {{ pasting ? '處理中...' : '📄 貼上' }}
        </button>
      </div>
      <textarea
        :value="remoteSDP"
        placeholder="請貼上發送端提供的 Offer JSON..."
        class="sdp-textarea"
        @input="onRemoteSDPChange"
      ></textarea>
      <div v-if="remoteSDP && !isValidJSON(remoteSDP)" class="error">
        ❌ JSON 格式不正確
      </div>
      <div class="instruction">
        <span class="emoji">📱</span>
        <p>請將發送端提供的 SDP 貼上到上方，然後我會為您生成回應的 SDP</p>
      </div>
    </div>

    <!-- 接收端：貼上 Offer 後顯示 Answer -->
    <div v-if="!isSender && remoteSDP && isValidJSON(remoteSDP)" class="sdp-section">
      <div class="section-header">
        <h3>📤 我的 Answer（請複製給發送端）</h3>
        <button 
          v-if="localSDP"
          class="copy-button"
          @click="copyLocalSDP"
          :disabled="copying"
        >
          {{ copying ? '已複製!' : '📋 複製' }}
        </button>
      </div>
      <textarea
        :value="localSDP"
        readonly
        :placeholder="localSDP ? '' : '正在生成 Answer...'"
        class="sdp-textarea"
      ></textarea>
      <div v-if="!localSDP && isLoading" class="loading">
        <div class="spinner"></div>
        <span>正在生成 Answer...</span>
      </div>
      <div class="instruction">
        <span class="emoji">📤</span>
        <p>已接收您的 Offer！請複製上方的 Answer 給發送端</p>
      </div>
    </div>

    <!-- 發送端：初始顯示 Offer -->
    <div v-if="isSender && !copyClicked" class="sdp-section">
      <div class="section-header">
        <h3 v-if="!localSDP">📱 正在生成 Offer...</h3>
        <h3 v-else>📤 我的 Offer（請複製給接收端）</h3>
        <button 
          v-if="localSDP"
          class="copy-button"
          @click="copyLocalSDP"
          :disabled="copying"
        >
          {{ copying ? '已複製!' : '📋 複製' }}
        </button>
      </div>
      <textarea
        :value="localSDP"
        readonly
        :placeholder="localSDP ? '' : '正在生成 Offer...'"
        class="sdp-textarea"
      ></textarea>
      <div v-if="!localSDP && isLoading" class="loading">
        <div class="spinner"></div>
        <span>正在取得相機權限並生成 Offer...</span>
      </div>
      <div class="instruction">
        <span class="emoji">📱</span>
        <p v-if="!localSDP">正在生成 Offer，請稍候...</p>
        <p v-else>Offer 已生成！請複製給接收端，複製後會顯示接收視窗</p>
      </div>
    </div>

    <!-- 發送端：複製後等待 Answer -->
    <div v-if="isSender && copyClicked" class="sdp-section">
      <div class="section-header">
        <h3>🎯 等待接收端回應 SDP</h3>
        <button 
          class="paste-button"
          @click="pasteRemoteSDP"
          :disabled="pasting"
        >
          {{ pasting ? '處理中...' : '📄 貼上' }}
        </button>
      </div>
      <textarea
        :value="remoteSDP"
        placeholder="請貼上接收端回應的 Answer JSON..."
        class="sdp-textarea"
        @input="onRemoteSDPChange"
      ></textarea>
      <div v-if="remoteSDP && !isValidJSON(remoteSDP)" class="error">
        ❌ JSON 格式不正確
      </div>
      <div class="instruction">
        <span class="emoji">⏳</span>
        <p>已複製 Offer！現在等待接收端回傳 Answer JSON</p>
      </div>
    </div>

    <div class="status" :class="statusClass">
      {{ connectionStatus }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useClipboard } from '../composables/useClipboard'

interface Props {
  localSDP: string
  remoteSDP: string
  connectionStatus: string
  statusClass?: string
  isLoading: boolean
  isSender: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:remoteSDP': [value: string]
  'back': []
}>()

const { writeText, readText } = useClipboard()

const copying = ref(false)
const pasting = ref(false)
const copyClicked = ref(false)

const isValidJSON = (str: string) => {
  if (!str.trim()) return false
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

const copyLocalSDP = async () => {
  if (!props.localSDP) return
  copying.value = true
  await writeText(props.localSDP)
  
  // 發送端複製後設置標記，切換到接收視窗
  if (props.isSender) {
    copyClicked.value = true
  }
  
  setTimeout(() => {
    copying.value = false
  }, 2000)
}

const pasteRemoteSDP = async () => {
  pasting.value = true
  try {
    const text = await readText()
    if (text) {
      emit('update:remoteSDP', text)
    }
  } catch (error) {
    console.log('貼上失敗:', error)
  }
  pasting.value = false
}

const onRemoteSDPChange = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:remoteSDP', target.value)
}

// 當用戶選擇新角色時重置狀態
watch(() => props.isSender, () => {
  copyClicked.value = false
})
</script>

<style scoped>
.sdp-exchange {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-button {
  background: var(--card);
  border: 1px solid #2e3a6b;
  color: var(--fg);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: #2a355b;
}

.header h2 {
  font-size: 1.5rem;
  color: var(--fg);
  margin: 0;
}


.sdp-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

.sdp-section {
  background: var(--card);
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--fg);
}

.copy-button,
.paste-button {
  background: var(--accent);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.copy-button:hover,
.paste-button:hover {
  background: #5a8bff;
  transform: translateY(-1px);
}

.copy-button:disabled,
.paste-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.sdp-textarea {
  width: 100%;
  min-height: 120px;
  background: #0f142a;
  color: var(--fg);
  border: 1px solid #2e3a6b;
  border-radius: 8px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  resize: vertical;
}

.sdp-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(122, 162, 255, 0.2);
}

.loading {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  font-size: 0.9rem;
  margin-top: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #2e3a6b;
  border-top: 2px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #fb7185;
  font-size: 0.85rem;
  margin-top: 8px;
}

.instruction {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(122, 162, 255, 0.1);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--accent);
  margin-top: 16px;
}

.emoji {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.instruction p {
  margin: 0;
  color: var(--fg);
  line-height: 1.5;
  font-size: 0.9rem;
}

.status {
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  background: rgba(122, 162, 255, 0.1);
  color: #b6cffd;
  border: 1px solid rgba(122, 162, 255, 0.2);
}

.status.ok {
  background: rgba(110, 231, 183, 0.1);
  color: #6ee7b7;
  border-color: rgba(110, 231, 183, 0.2);
}

.status.bad {
  background: rgba(251, 113, 133, 0.1);
  color: #fb7185;
  border-color: rgba(251, 113, 133, 0.2);
}

.status.warn {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.2);
}

/* 手機優化 */
@media (max-width: 768px) {
  .sdp-exchange {
    padding: 16px;
  }

  .header {
    margin-bottom: 24px;
  }


  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .sdp-textarea {
    min-height: 100px;
    font-size: 0.8rem;
  }

  .instruction {
    gap: 12px;
    padding: 14px;
    margin-top: 12px;
  }

  .emoji {
    font-size: 1.2rem;
  }
}

/* 小螢幕優化 */
@media (max-width: 480px) {
  .sdp-exchange {
    padding: 12px;
  }
}
</style>