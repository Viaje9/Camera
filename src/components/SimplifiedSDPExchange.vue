<template>
  <div class="sdp-exchange">
    <div class="header">
      <button class="back-button" @click="$emit('back')">
        ← 返回
      </button>
      <h2>{{ isSender ? '發送端' : '接收端' }} - SDP 交換</h2>
    </div>

    <div class="progress-indicator">
      <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <div class="step-number">1</div>
        <div class="step-text">{{ isSender ? '生成 Offer' : '等待 Offer' }}</div>
      </div>
      <div class="progress-line" :class="{ active: currentStep > 1 }"></div>
      <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
        <div class="step-number">2</div>
        <div class="step-text">{{ isSender ? '等待 Answer' : '生成 Answer' }}</div>
      </div>
      <div class="progress-line" :class="{ active: currentStep > 2 }"></div>
      <div class="step" :class="{ active: currentStep >= 3 }">
        <div class="step-number">3</div>
        <div class="step-text">連線完成</div>
      </div>
    </div>

    <div class="sdp-sections">
      <div class="sdp-section local">
        <div class="section-header">
          <h3>{{ isSender ? '我的 Offer' : '我的 Answer' }}</h3>
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
          :placeholder="localSDP ? '' : (isSender ? '正在生成 Offer...' : '等待生成 Answer...')"
          class="sdp-textarea"
        ></textarea>
        <div v-if="!localSDP && isLoading" class="loading">
          <div class="spinner"></div>
          <span>{{ isSender ? '正在取得相機權限並生成 Offer...' : '處理中...' }}</span>
        </div>
      </div>

      <div class="sdp-section remote">
        <div class="section-header">
          <h3>{{ isSender ? '對方的 Answer' : '對方的 Offer' }}</h3>
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
          :placeholder="`請貼上對方的 ${isSender ? 'Answer' : 'Offer'} JSON...`"
          class="sdp-textarea"
          @input="onRemoteSDPChange"
        ></textarea>
        <div v-if="remoteSDP && !isValidJSON(remoteSDP)" class="error">
          ❌ JSON 格式不正確
        </div>
      </div>
    </div>

    <div class="instructions">
      <div class="instruction-step" v-if="currentStep === 1 && isSender">
        <span class="emoji">📱</span>
        <div>
          <p><strong>步驟 1:</strong> 等待相機權限並生成 Offer</p>
          <p>Offer 生成後請複製給對方</p>
        </div>
      </div>
      
      <div class="instruction-step" v-if="currentStep === 1 && !isSender">
        <span class="emoji">⏳</span>
        <div>
          <p><strong>步驟 1:</strong> 等待對方的 Offer</p>
          <p>請將對方給您的 Offer JSON 貼上到下方</p>
        </div>
      </div>

      <div class="instruction-step" v-if="currentStep === 2 && isSender">
        <span class="emoji">⏳</span>
        <div>
          <p><strong>步驟 2:</strong> 等待對方的 Answer</p>
          <p>請將對方回傳的 Answer JSON 貼上到下方</p>
        </div>
      </div>

      <div class="instruction-step" v-if="currentStep === 2 && !isSender">
        <span class="emoji">📤</span>
        <div>
          <p><strong>步驟 2:</strong> Answer 已生成</p>
          <p>請複製 Answer 回傳給對方</p>
        </div>
      </div>

      <div class="instruction-step" v-if="currentStep === 3">
        <span class="emoji">🎉</span>
        <div>
          <p><strong>連線中...</strong></p>
          <p>正在建立 P2P 連線，請稍候</p>
        </div>
      </div>
    </div>

    <div class="status" :class="statusClass">
      {{ connectionStatus }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const currentStep = computed(() => {
  if (!props.localSDP) return 1
  if (!props.remoteSDP || !isValidJSON(props.remoteSDP)) return props.isSender ? 2 : 1
  return 3
})

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

watch(() => props.remoteSDP, (newValue) => {
  if (newValue && isValidJSON(newValue)) {
    // 自動處理有效的 SDP
    setTimeout(() => {
      if (currentStep.value === 3) {
        // 可以觸發連線邏輯
      }
    }, 500)
  }
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

.progress-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 8px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
  transition: opacity 0.3s;
}

.step.active {
  opacity: 1;
}

.step.completed {
  opacity: 0.8;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--card);
  border: 2px solid #2e3a6b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--muted);
  transition: all 0.3s;
}

.step.active .step-number {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.step.completed .step-number {
  background: #6ee7b7;
  border-color: #6ee7b7;
  color: #0f172a;
}

.step-text {
  font-size: 0.8rem;
  color: var(--muted);
  text-align: center;
  white-space: nowrap;
}

.progress-line {
  width: 40px;
  height: 2px;
  background: #2e3a6b;
  transition: background-color 0.3s;
}

.progress-line.active {
  background: var(--accent);
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

.instructions {
  margin: 24px 0;
}

.instruction-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: rgba(122, 162, 255, 0.1);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--accent);
}

.emoji {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.instruction-step p {
  margin: 4px 0;
  color: var(--fg);
  line-height: 1.4;
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

  .progress-indicator {
    margin-bottom: 24px;
  }

  .step-text {
    font-size: 0.7rem;
  }

  .progress-line {
    width: 20px;
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

  .instruction-step {
    gap: 12px;
    padding: 12px;
  }

  .emoji {
    font-size: 1.2rem;
  }
}

/* 小螢幕優化 */
@media (max-width: 480px) {
  .progress-indicator {
    flex-direction: column;
    gap: 16px;
  }

  .progress-line {
    width: 2px;
    height: 20px;
  }

  .step-text {
    white-space: normal;
    max-width: 80px;
  }
}
</style>