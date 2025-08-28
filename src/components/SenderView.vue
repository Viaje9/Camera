<template>
  <div class="sender-view">
    <div class="header">
      <h2>📹 發送中</h2>
      <div class="connection-status" :class="connectionStatusClass">
        <div class="status-dot"></div>
        <span>{{ connectionStatus }}</span>
      </div>
    </div>

    <div class="video-preview">
      <div class="preview-container">
        <video
          ref="localVideoRef"
          playsinline
          muted
          autoplay
          :class="{ mirror: mirrorEnabled }"
        ></video>
        <div class="video-overlay">
          <button 
            class="mirror-toggle"
            @click="toggleMirror"
            :class="{ active: mirrorEnabled }"
            title="切換鏡像"
          >
            🪞
          </button>
          <button 
            class="camera-switch"
            @click="switchCamera"
            :disabled="switchingCamera"
            title="切換前後鏡頭"
          >
            {{ switchingCamera ? '⏳' : '🔄' }}
          </button>
        </div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-card">
        <h3>📊 連線資訊</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">狀態:</span>
            <span class="value" :class="connectionStatusClass">{{ connectionStatus }}</span>
          </div>
          <div class="info-item">
            <span class="label">角色:</span>
            <span class="value">發送端</span>
          </div>
          <div class="info-item">
            <span class="label">相機:</span>
            <span class="value">{{ currentCamera }}</span>
          </div>
          <div class="info-item" v-if="hasAudio">
            <span class="label">音訊:</span>
            <span class="value">已啟用</span>
          </div>
        </div>
      </div>
    </div>

    <div class="control-section">
      <button class="disconnect-button" @click="disconnect">
        <span class="icon">🔌</span>
        <span>斷開連線</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMedia } from '../composables/useMedia'

interface Props {
  stream: MediaStream | null
  connectionStatus: string
  connectionStatusClass?: string
  hasAudio?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasAudio: false,
  connectionStatusClass: ''
})

const emit = defineEmits<{
  disconnect: []
  cameraSwitch: [facingMode: 'user' | 'environment']
}>()

const { setVideoSource, toggleMirror: toggleVideoMirror, getUserMedia } = useMedia()

const localVideoRef = ref<HTMLVideoElement | null>(null)
const mirrorEnabled = ref(false)
const switchingCamera = ref(false)
const currentCamera = ref<'前鏡頭' | '後鏡頭'>('後鏡頭')
const currentFacingMode = ref<'user' | 'environment'>('environment')

const toggleMirror = () => {
  mirrorEnabled.value = !mirrorEnabled.value
  toggleVideoMirror(localVideoRef.value, mirrorEnabled.value)
}

const switchCamera = async () => {
  if (switchingCamera.value) return
  
  switchingCamera.value = true
  try {
    const newFacingMode = currentFacingMode.value === 'user' ? 'environment' : 'user'
    currentFacingMode.value = newFacingMode
    currentCamera.value = newFacingMode === 'user' ? '前鏡頭' : '後鏡頭'
    
    // 如果是前鏡頭，自動開啟鏡像
    if (newFacingMode === 'user' && !mirrorEnabled.value) {
      toggleMirror()
    }
    
    emit('cameraSwitch', newFacingMode)
  } catch (error) {
    console.error('切換相機失敗:', error)
  }
  switchingCamera.value = false
}

const disconnect = () => {
  if (confirm('確定要斷開連線嗎？')) {
    emit('disconnect')
  }
}

onMounted(() => {
  if (props.stream) {
    setVideoSource(localVideoRef.value, props.stream)
    
    // 檢測相機類型
    const videoTrack = props.stream.getVideoTracks()[0]
    if (videoTrack) {
      const settings = videoTrack.getSettings()
      if (settings.facingMode) {
        currentFacingMode.value = settings.facingMode as 'user' | 'environment'
        currentCamera.value = settings.facingMode === 'user' ? '前鏡頭' : '後鏡頭'
        
        // 前鏡頭預設開啟鏡像
        if (settings.facingMode === 'user') {
          mirrorEnabled.value = true
          toggleVideoMirror(localVideoRef.value, true)
        }
      }
    }
  }
})

onUnmounted(() => {
  if (props.stream) {
    props.stream.getTracks().forEach(track => track.stop())
  }
})
</script>

<style scoped>
.sender-view {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header h2 {
  margin: 0;
  color: var(--fg);
  font-size: 1.5rem;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(122, 162, 255, 0.1);
  border: 1px solid rgba(122, 162, 255, 0.2);
  font-size: 0.9rem;
  color: #b6cffd;
}

.connection-status.ok {
  background: rgba(110, 231, 183, 0.1);
  border-color: rgba(110, 231, 183, 0.2);
  color: #6ee7b7;
}

.connection-status.bad {
  background: rgba(251, 113, 133, 0.1);
  border-color: rgba(251, 113, 133, 0.2);
  color: #fb7185;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.video-preview {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 16/9;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 10px 30px rgba(0,0,0,.3);
}

.preview-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video.mirror {
  transform: scaleX(-1);
}

.video-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
}

.mirror-toggle,
.camera-switch {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mirror-toggle:hover,
.camera-switch:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.mirror-toggle.active {
  background: var(--accent);
}

.camera-switch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.info-section {
  display: flex;
  justify-content: center;
}

.info-card {
  background: var(--card);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
}

.info-card h3 {
  margin: 0 0 16px 0;
  color: var(--fg);
  font-size: 1.1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 0.8rem;
  color: var(--muted);
}

.value {
  font-size: 0.9rem;
  color: var(--fg);
  font-weight: 500;
}

.value.ok {
  color: #6ee7b7;
}

.value.bad {
  color: #fb7185;
}

.control-section {
  display: flex;
  justify-content: center;
}

.disconnect-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.disconnect-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.disconnect-button .icon {
  font-size: 1.3rem;
}

/* 手機優化 */
@media (max-width: 768px) {
  .sender-view {
    padding: 16px;
    gap: 20px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header h2 {
    font-size: 1.3rem;
  }

  .preview-container {
    max-width: none;
  }

  .video-overlay {
    top: 8px;
    right: 8px;
    gap: 6px;
  }

  .mirror-toggle,
  .camera-switch {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .info-card {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .info-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #2e3a6b;
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .disconnect-button {
    padding: 14px 24px;
    font-size: 1rem;
  }
}

/* 小螢幕優化 */
@media (max-width: 480px) {
  .sender-view {
    padding: 12px;
  }

  .connection-status {
    padding: 6px 12px;
    font-size: 0.8rem;
  }

  .disconnect-button {
    width: 100%;
    justify-content: center;
  }
}
</style>