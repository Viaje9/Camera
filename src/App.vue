<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWebRTC } from './composables/useWebRTC'
import { useMedia } from './composables/useMedia'
import { useAppState, type Role } from './composables/useAppState'
import InitialRoleSelector from './components/InitialRoleSelector.vue'
import SimplifiedSDPExchange from './components/SimplifiedSDPExchange.vue'
import SenderView from './components/SenderView.vue'
import ReceiverView from './components/ReceiverView.vue'

// 應用狀態管理
const appState = useAppState()
const { 
  currentView, 
  selectedRole, 
  isConnected, 
  localSDP, 
  remoteSDP, 
  connectionStatus, 
  isLoading,
  isSender,
  isReceiver,
  setRole,
  setConnected,
  reset,
  setLocalSDP,
  setRemoteSDP,
  setStatus,
  setLoading
} = appState

// WebRTC 功能
const { 
  localStream, 
  state, 
  createPeerConnection,
  addStream,
  createOffer,
  createAnswer,
  setRemoteDescription,
  onTrack,
  onIceCandidate,
  close
} = useWebRTC()

// 媒體功能
const { getUserMedia } = useMedia()

// 其他狀態
const remoteStream = ref<MediaStream | null>(null)
const currentFacingMode = ref<'user' | 'environment'>('environment')
const allowConnection = ref(false) // 控制是否允許切換到連線畫面

// 檢查 WebRTC 支援
const checkWebRTCSupport = () => {
  if (!('RTCPeerConnection' in window)) {
    setStatus('此瀏覽器不支援 WebRTC。')
    return false
  }
  return true
}

// 偵測是否為手機
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 角色選擇處理
const handleRoleSelection = (role: Role) => {
  setRole(role)
  allowConnection.value = false // 重置連線允許狀態
  
  // 手機預設使用前鏡頭
  if (isMobile() && role === 'sender') {
    currentFacingMode.value = 'user'
  }
  
  // 自動初始化 WebRTC
  setTimeout(() => {
    initializeWebRTC()
  }, 300)
}

// 初始化 WebRTC 連線
const initializeWebRTC = async () => {
  if (!checkWebRTCSupport()) return

  // 確保完全清理之前的狀態
  if (remoteStream.value) {
    remoteStream.value.getTracks().forEach(track => track.stop())
    remoteStream.value = null
  }
  
  setLoading(true)
  setStatus('初始化中...')
  console.log('開始初始化 WebRTC，角色:', selectedRole.value)
  
  try {
    createPeerConnection()

    // 設置 track 事件處理
    onTrack((event) => {
      const [stream] = event.streams
      console.log('收到遠端流:', stream, '當前角色:', selectedRole.value, '允許連線:', allowConnection.value)
      
      // 立即設置遠端流供顯示使用
      remoteStream.value = stream
      
      // 只有在允許連線的情況下才嘗試切換畫面
      if (!allowConnection.value) {
        console.log('尚未允許連線，等待中...')
        return
      }
      
      // 只有當實際收到有效的視訊流時才切換畫面
      if (stream && stream.getVideoTracks().length > 0) {
        const videoTrack = stream.getVideoTracks()[0]
        
        console.log('視訊軌道狀態:', videoTrack.readyState)
        
        // 確保軌道真的是活躍的且有資料
        const handleStreamReady = () => {
          if (videoTrack.readyState === 'live') {
            console.log('視訊流準備就緒，切換到連線完成畫面')
            setStatus('連線成功！')
            setTimeout(() => {
              setConnected()
            }, 500)
          }
        }
        
        // 如果軌道已經準備好，直接處理
        if (videoTrack.readyState === 'live') {
          handleStreamReady()
        } else {
          // 否則監聽軌道狀態變化
          videoTrack.addEventListener('unmute', handleStreamReady)
          videoTrack.addEventListener('started', handleStreamReady)
          
          // 備用檢查機制
          setTimeout(() => {
            if (videoTrack.readyState === 'live' && allowConnection.value) {
              handleStreamReady()
            }
          }, 1000)
        }
      }
    })

    // 設置 ICE candidate 事件處理
    onIceCandidate((description) => {
      if (description) {
        console.log('ICE 蒐集完成:', {
          role: selectedRole.value,
          type: description.type,
          description: description
        })
        setLocalSDP(JSON.stringify(description))
        
        // 如果是接收端且正在處理 Answer，更新狀態
        if (isReceiver.value && description.type === 'answer') {
          setStatus('Answer 已生成，請複製給對方。等待對方完成連線...')
          console.log('接收端 Answer 已準備好')
        }
      }
    })

    if (isSender.value) {
      await initializeSender()
    } else {
      await initializeReceiver()
    }
  } catch (error: unknown) {
    setStatus('初始化失敗：' + (error instanceof Error ? error.message : String(error)))
  }
  
  setLoading(false)
}

// 初始化發送端
const initializeSender = async () => {
  try {
    const stream = await getUserMedia({
      video: { facingMode: currentFacingMode.value },
      audio: false // 簡化版不包含音訊
    })
    
    localStream.value = stream
    addStream(stream)
    
    setStatus('相機已啟動，正在生成 Offer...')
    
    // 自動生成 Offer
    await createOffer({ 
      offerToReceiveVideo: true, 
      offerToReceiveAudio: false
    })
    
    setStatus('Offer 已生成，請複製給對方')
  } catch (error: unknown) {
    setStatus('取得相機失敗：' + (error instanceof Error ? error.message : String(error)))
  }
}

// 初始化接收端
const initializeReceiver = async () => {
  setStatus('等待對方的 Offer...')
}

// 自動處理遠端 SDP
const handleRemoteSDPChange = async (sdp: string) => {
  if (!sdp.trim()) return
  
  try {
    const sdpData = JSON.parse(sdp)
    setLoading(true)
    
    console.log('處理 SDP:', {
      role: selectedRole.value,
      sdpType: sdpData.type,
      sdpData: sdpData
    })
    
    if (isSender.value) {
      // 發送端應該收到 Answer
      if (sdpData.type === 'answer') {
        setStatus('處理 Answer 中...')
        await setRemoteDescription(sdpData)
        allowConnection.value = true // 發送端可以開始連線
        
        setTimeout(() => {
          setConnected()
          setStatus('連線成功')
        }, 1000)
      } else {
        setStatus('錯誤：發送端應該收到 Answer，但收到了 ' + sdpData.type)
        setLoading(false)
        return
      }
    } else {
      // 接收端應該收到 Offer
      if (sdpData.type === 'offer') {
        setStatus('處理 Offer 並生成 Answer...')
        await setRemoteDescription(sdpData)
        await createAnswer()
        setStatus('Answer 正在生成中，等待 ICE 蒐集完成...')
        
        // 等待 ICE gathering 完成後才顯示完成狀態
        // 這個狀態會在 onIceCandidate 回調中更新
        
        // 給對方一些時間處理 Answer，然後允許連線
        setTimeout(() => {
          allowConnection.value = true
          console.log('接收端現在允許連線')
          
          // 檢查是否已經有遠端流，如果有的話嘗試連線
          if (remoteStream.value && remoteStream.value.getVideoTracks().length > 0) {
            const videoTrack = remoteStream.value.getVideoTracks()[0]
            console.log('檢查已存在的遠端流，軌道狀態:', videoTrack.readyState)
            
            if (videoTrack.readyState === 'live') {
              console.log('遠端流已準備好，立即切換畫面')
              setStatus('連線成功！')
              setTimeout(() => {
                setConnected()
              }, 500)
            }
          }
        }, 3000) // 3秒後允許連線
      } else {
        setStatus('錯誤：接收端應該收到 Offer，但收到了 ' + sdpData.type)
        setLoading(false)
        return
      }
    }
  } catch (error: unknown) {
    setStatus('處理 SDP 失敗：' + (error instanceof Error ? error.message : String(error)))
  }
  
  setLoading(false)
}

// 切換相機
const handleCameraSwitch = async (facingMode: 'user' | 'environment') => {
  if (!localStream.value) return
  
  try {
    // 停止當前流
    localStream.value.getTracks().forEach(track => track.stop())
    
    // 獲取新的流
    const newStream = await getUserMedia({
      video: { facingMode },
      audio: false
    })
    
    localStream.value = newStream
    currentFacingMode.value = facingMode
    
    // 重新添加到 peer connection
    // 這裡需要更新 WebRTC composable 來支持替換軌道
    addStream(newStream)
  } catch (error: unknown) {
    setStatus('切換相機失敗：' + (error instanceof Error ? error.message : String(error)))
  }
}

// 斷開連線
const handleDisconnect = () => {
  console.log('斷開連線，清理所有狀態')
  close()
  reset()
  allowConnection.value = false // 重置連線允許狀態
  
  // 停止所有媒體流
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop())
    localStream.value = null
  }
  
  if (remoteStream.value) {
    remoteStream.value.getTracks().forEach(track => track.stop())
    remoteStream.value = null
  }
  
  // 強制清理狀態
  setLocalSDP('')
  setRemoteSDP('')
}

// 返回角色選擇
const handleBack = () => {
  handleDisconnect()
}

// 監聽遠端 SDP 變化
watch(remoteSDP, (newValue) => {
  if (newValue && newValue.trim()) {
    handleRemoteSDPChange(newValue)
  }
})

// 監聽 WebRTC 狀態變化
watch(() => state.value.status, (newStatus) => {
  setStatus(newStatus)
})

// 監聽連線允許狀態變化
watch(allowConnection, (newValue) => {
  console.log('allowConnection 狀態變化:', newValue)
  
  // 如果允許連線且已經有遠端流，嘗試切換畫面
  if (newValue && remoteStream.value && remoteStream.value.getVideoTracks().length > 0) {
    const videoTrack = remoteStream.value.getVideoTracks()[0]
    console.log('檢查連線狀態變化時的遠端流，軌道狀態:', videoTrack.readyState)
    
    if (videoTrack.readyState === 'live') {
      console.log('因連線狀態變化切換到連線完成畫面')
      setStatus('連線成功！')
      setTimeout(() => {
        setConnected()
      }, 500)
    }
  }
})

onMounted(() => {
  checkWebRTCSupport()
})
</script>

<template>
  <!-- 角色選擇畫面 -->
  <InitialRoleSelector 
    v-if="currentView === 'role-selection'"
    @role-selected="handleRoleSelection"
  />

  <!-- SDP 交換畫面 -->
  <SimplifiedSDPExchange 
    v-else-if="currentView === 'sdp-exchange'"
    :local-s-d-p="localSDP"
    :remote-s-d-p="remoteSDP"
    :connection-status="connectionStatus"
    :is-loading="isLoading"
    :is-sender="isSender"
    @update:remote-s-d-p="setRemoteSDP"
    @back="handleBack"
  />

  <!-- 發送端連線後畫面 -->
  <SenderView 
    v-else-if="currentView === 'connected' && isSender"
    :stream="localStream"
    :connection-status="connectionStatus"
    :connection-status-class="'ok'"
    :has-audio="false"
    @disconnect="handleDisconnect"
    @camera-switch="handleCameraSwitch"
  />

  <!-- 接收端連線後畫面 -->
  <ReceiverView 
    v-else-if="currentView === 'connected' && isReceiver"
    :stream="remoteStream"
    :connection-status="connectionStatus"
    :connection-status-class="'ok'"
    @disconnect="handleDisconnect"
  />
</template>

<style>
/* 全域 CSS 變数 */
:root { 
  --bg: #0b1020; 
  --fg: #e9eef7; 
  --muted: #9fb0c3; 
  --card: #131a32; 
  --accent: #7aa2ff;
  --border: #2e3a6b;
  --error: #fb7185;
  --success: #6ee7b7;
  --warning: #fbbf24;
}

/* 重設和基本樣式 */
* {
  box-sizing: border-box;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
               'Noto Sans TC', 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 手機版最佳化 */
@media (max-width: 768px) {
  body {
    font-size: 14px;
    line-height: 1.5;
  }
}

/* 觸摸優化 */
@media (hover: none) and (pointer: coarse) {
  /* 手機裝置的觸摸優化 */
  button {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 全局組件樣式 */
.mirror { 
  transform: scaleX(-1);
  transform-origin: center;
}

.ok {
  color: var(--success) !important;
}

.warn {
  color: var(--warning) !important;
}

.bad {
  color: var(--error) !important;
}

.small {
  font-size: 0.85rem;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* 通用动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* 屏幕方向鎖定 */
@media screen and (orientation: portrait) {
  /* 竖屏樣式 */
  .mobile-optimize {
    flex-direction: column;
  }
}

@media screen and (orientation: landscape) {
  /* 横屏樣式 */
  .mobile-optimize {
    flex-direction: row;
  }
}

/* 可訪問性優化 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  :root {
    --bg: #000000;
    --fg: #ffffff;
    --card: #1a1a1a;
    --border: #666666;
  }
}

/* 暗色主題優化 */
@media (prefers-color-scheme: light) {
  /* 如果需要支持亮色主題，可在這裡添加 */
}

/* PWA 支持 */
@media (display-mode: standalone) {
  /* PWA 模式下的樣式調整 */
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* iOS Safari 優化 */
@supports (-webkit-touch-callout: none) {
  /* iOS 裝置特定樣式 */
  body {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
  
  input, textarea, button {
    -webkit-user-select: auto;
    user-select: auto;
  }
}

/* Android 優化 */
@media screen and (-webkit-min-device-pixel-ratio: 2) {
  /* 高密度螢幕優化 */
}
</style>
