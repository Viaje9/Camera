<template>
  <div class="receiver-view" :class="{ fullscreen: isFullscreen }">
    <div class="header" :class="{ hidden: isFullscreen }">
      <h2>👁️ 接收中</h2>
      <div class="connection-status" :class="connectionStatusClass">
        <div class="status-dot"></div>
        <span>{{ connectionStatus }}</span>
      </div>
    </div>

    <div class="video-container" :class="{ fullscreen: isFullscreen }">
      <video
        ref="remoteVideoRef"
        playsinline
        autoplay
        :class="{ mirror: mirrorEnabled }"
        @dblclick="toggleFullscreen"
        @click="handleVideoClick"
      ></video>
      
      <!-- 無視訊畫面時的占位符 -->
      <div v-if="!hasRemoteStream" class="video-placeholder">
        <div class="placeholder-content">
          <div class="loading-animation">
            <div class="spinner"></div>
          </div>
          <h3>等待對方畫面中...</h3>
          <p>請確保對方已成功連線並開啟相機</p>
        </div>
      </div>

      <!-- 控制覆蓋層 -->
      <div class="video-controls" :class="{ hidden: isFullscreen && !showControls }">
        <div class="control-group left">
          <button 
            class="control-button mirror-toggle"
            @click="toggleMirror"
            :class="{ active: mirrorEnabled }"
            title="切換鏡像"
          >
            🪞
          </button>
        </div>
        
        <div class="control-group center" v-if="hasRemoteStream">
          <button 
            class="control-button fullscreen-toggle"
            @click="toggleFullscreen"
            :title="isFullscreen ? '退出全螢幕' : '進入全螢幕'"
          >
            {{ isFullscreen ? '⊟' : '⊡' }}
          </button>
        </div>
        
        <div class="control-group right">
          <button 
            class="control-button disconnect-button"
            @click="disconnect"
            title="斷開連線"
          >
            ❌
          </button>
        </div>
      </div>
    </div>

    <!-- 底部資訊區 (非全螢幕時顯示) -->
    <div class="info-section" :class="{ hidden: isFullscreen }">
      <div class="info-card">
        <h3>📺 接收資訊</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">狀態:</span>
            <span class="value" :class="connectionStatusClass">{{ connectionStatus }}</span>
          </div>
          <div class="info-item">
            <span class="label">角色:</span>
            <span class="value">接收端</span>
          </div>
          <div class="info-item">
            <span class="label">畫面:</span>
            <span class="value">{{ hasRemoteStream ? '已接收' : '等待中' }}</span>
          </div>
          <div class="info-item">
            <span class="label">全螢幕:</span>
            <span class="value">{{ isFullscreen ? '已開啟' : '雙擊開啟' }}</span>
          </div>
        </div>
      </div>

      <div class="tips">
        <h4>💡 操作提示</h4>
        <ul>
          <li>雙擊畫面可切換全螢幕</li>
          <li>單擊顯示/隱藏控制項</li>
          <li>使用鏡像按鈕翻轉畫面</li>
        </ul>
      </div>
    </div>

    <!-- 全螢幕時的浮動斷線按鈕 -->
    <div v-if="isFullscreen" class="floating-disconnect" :class="{ hidden: !showControls }">
      <button class="floating-button" @click="disconnect">
        <span>❌ 斷開連線</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useMedia } from '../composables/useMedia'

interface Props {
  stream: MediaStream | null
  connectionStatus: string
  connectionStatusClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  connectionStatusClass: ''
})

const emit = defineEmits<{
  disconnect: []
}>()

const { setVideoSource, toggleMirror: toggleVideoMirror, isFullscreen: checkIsFullscreen, toggleFullscreen: toggleVideoFullscreen } = useMedia()

const remoteVideoRef = ref<HTMLVideoElement | null>(null)
const mirrorEnabled = ref(false)
const isFullscreen = ref(false)
const showControls = ref(true)
const hasRemoteStream = ref(false)
const controlsTimer = ref<number | null>(null)

const toggleMirror = () => {
  mirrorEnabled.value = !mirrorEnabled.value
  toggleVideoMirror(remoteVideoRef.value, mirrorEnabled.value)
}

const toggleFullscreen = async () => {
  if (!remoteVideoRef.value) return
  await toggleVideoFullscreen(remoteVideoRef.value)
  updateFullscreenState()
}

const updateFullscreenState = () => {
  isFullscreen.value = checkIsFullscreen()
}

const handleVideoClick = () => {
  if (!isFullscreen.value) return
  
  showControls.value = !showControls.value
  
  if (showControls.value) {
    // 3秒後自動隱藏控制項
    if (controlsTimer.value) {
      clearTimeout(controlsTimer.value)
    }
    controlsTimer.value = window.setTimeout(() => {
      showControls.value = false
    }, 3000)
  }
}

const disconnect = () => {
  if (confirm('確定要斷開連線嗎？')) {
    emit('disconnect')
  }
}

// 監聽全螢幕狀態變化
const handleFullscreenChange = () => {
  updateFullscreenState()
  if (isFullscreen.value) {
    showControls.value = true
    handleVideoClick() // 開始控制項自動隱藏計時
  } else {
    showControls.value = true
    if (controlsTimer.value) {
      clearTimeout(controlsTimer.value)
      controlsTimer.value = null
    }
  }
}

watch(() => props.stream, (newStream) => {
  hasRemoteStream.value = !!newStream
  if (remoteVideoRef.value) {
    setVideoSource(remoteVideoRef.value, newStream)
  }
})

onMounted(() => {
  // 監聽全螢幕事件
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('msfullscreenchange', handleFullscreenChange)

  // 設置初始視訊流
  if (props.stream) {
    hasRemoteStream.value = true
    setVideoSource(remoteVideoRef.value, props.stream)
  }

  // 防止螢幕休眠 (如果支援)
  if ('wakeLock' in navigator) {
    const nav = navigator as Navigator & { wakeLock?: { request: (type: string) => Promise<unknown> } }
    nav.wakeLock?.request('screen').catch(() => {
      console.log('無法防止螢幕休眠')
    })
  }
})

onUnmounted(() => {
  // 清理事件監聽器
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('msfullscreenchange', handleFullscreenChange)
  
  if (controlsTimer.value) {
    clearTimeout(controlsTimer.value)
  }
})
</script>

<style scoped>
.receiver-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.receiver-view.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  background: black;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  flex-wrap: wrap;
  gap: 16px;
  transition: opacity 0.3s;
}

.header.hidden {
  opacity: 0;
  pointer-events: none;
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

.video-container {
  flex: 1;
  position: relative;
  background: black;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container.fullscreen {
  width: 100vw;
  height: 100vh;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-container video.mirror {
  transform: scaleX(-1);
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
}

.placeholder-content {
  text-align: center;
  color: white;
  padding: 40px;
}

.loading-animation {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.placeholder-content h3 {
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: #e0e0e0;
}

.placeholder-content p {
  color: #a0a0a0;
  font-size: 1rem;
  line-height: 1.5;
}

.video-controls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  transition: opacity 0.3s;
}

.video-controls.hidden {
  opacity: 0;
}

.control-group {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 16px;
  gap: 12px;
}

.control-group.left {
  align-items: flex-start;
}

.control-group.center {
  flex: 1;
  align-items: center;
  justify-content: center;
}

.control-group.right {
  align-items: flex-end;
}

.control-button {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
  backdrop-filter: blur(10px);
}

.control-button:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.control-button.active {
  background: var(--accent);
}

.fullscreen-toggle {
  width: 60px;
  height: 60px;
  font-size: 1.6rem;
}

.info-section {
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  transition: opacity 0.3s;
}

.info-section.hidden {
  opacity: 0;
  pointer-events: none;
}

.info-card,
.tips {
  background: var(--card);
  border-radius: 12px;
  padding: 20px;
}

.info-card h3,
.tips h4 {
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

.tips ul {
  margin: 0;
  padding-left: 20px;
  color: var(--muted);
  line-height: 1.6;
}

.tips li {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.floating-disconnect {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1001;
  transition: opacity 0.3s;
}

.floating-disconnect.hidden {
  opacity: 0;
  pointer-events: none;
}

.floating-button {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  backdrop-filter: blur(10px);
}

.floating-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.5);
}

/* 手機優化 */
@media (max-width: 768px) {
  .header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header h2 {
    font-size: 1.3rem;
  }

  .info-section {
    padding: 16px;
    grid-template-columns: 1fr;
    gap: 16px;
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

  .control-group {
    padding: 12px;
  }

  .control-button {
    width: 42px;
    height: 42px;
    font-size: 1.2rem;
  }

  .fullscreen-toggle {
    width: 52px;
    height: 52px;
    font-size: 1.4rem;
  }

  .floating-disconnect {
    top: 16px;
    right: 16px;
  }

  .floating-button {
    padding: 10px 16px;
    font-size: 0.9rem;
  }
}

/* 小螢幕優化 */
@media (max-width: 480px) {
  .control-group {
    padding: 8px;
  }

  .placeholder-content {
    padding: 20px;
  }

  .placeholder-content h3 {
    font-size: 1.2rem;
  }

  .placeholder-content p {
    font-size: 0.9rem;
  }
}
</style>