<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWebRTC } from './composables/useWebRTC'
import { useMedia } from './composables/useMedia'
import RoleSelector, { type RoleConfig } from './components/RoleSelector.vue'
import ControlPanel from './components/ControlPanel.vue'
import SDPExchange from './components/SDPExchange.vue'
import VideoPlayer from './components/VideoPlayer.vue'

const { 
  localStream, 
  state, 
  setStatus,
  createPeerConnection,
  addStream,
  createOffer,
  createAnswer,
  setRemoteDescription,
  onTrack,
  onIceCandidate
} = useWebRTC()

const { getUserMedia } = useMedia()

const roleConfig = ref<RoleConfig>({
  role: 'sender',
  withAudio: false,
  facingMode: 'environment'
})

const localSDP = ref('')
const remoteSDP = ref('')
const remoteStream = ref<MediaStream | null>(null)

// 控制按鈕狀態
const canCreateOffer = ref(false)
const canSetOfferAndAnswer = ref(false)
const canApplyAnswer = ref(false)

// 計算屬性
const isSender = computed(() => roleConfig.value.role === 'sender')

const checkWebRTCSupport = () => {
  if (!('RTCPeerConnection' in window)) {
    setStatus('此瀏覽器不支援 WebRTC。', 'bad')
    return false
  }
  return true
}

const start = async () => {
  if (!checkWebRTCSupport()) return

  setStatus('初始化中...')
  createPeerConnection()

  // 設置 track 事件處理
  onTrack((event) => {
    const [stream] = event.streams
    remoteStream.value = stream
  })

  // 設置 ICE candidate 事件處理
  onIceCandidate((description) => {
    if (description) {
      localSDP.value = JSON.stringify(description)
    }
  })

  if (isSender.value) {
    try {
      const stream = await getUserMedia({
        video: { facingMode: roleConfig.value.facingMode },
        audio: roleConfig.value.withAudio
      })
      
      localStream.value = stream
      addStream(stream)
      
      setStatus('本機媒體啟動完成。請按「建立 Offer」。', 'ok')
      canCreateOffer.value = true
      canSetOfferAndAnswer.value = false
      canApplyAnswer.value = true
    } catch (error: unknown) {
      setStatus('取得相機/麥克風失敗：' + (error instanceof Error ? error.message : String(error)), 'bad')
    }
  } else {
    // viewer 不啟用本機相機
    localStream.value = null
    setStatus('接收端就緒。請貼上對方的 Offer，然後按「設定遠端 Offer 並建立 Answer」。', 'warn')
    canCreateOffer.value = false
    canSetOfferAndAnswer.value = true
    canApplyAnswer.value = false
  }
}

const handleCreateOffer = async () => {
  try {
    await createOffer({ 
      offerToReceiveVideo: true, 
      offerToReceiveAudio: roleConfig.value.withAudio 
    })
  } catch (error: unknown) {
    setStatus('建立 Offer 失敗：' + (error instanceof Error ? error.message : String(error)), 'bad')
  }
}

const handleSetOfferAndAnswer = async () => {
  try {
    const txt = remoteSDP.value.trim()
    if (!txt) {
      alert('請先貼上對方的 Offer (JSON)')
      return
    }
    
    const offer = JSON.parse(txt)
    await setRemoteDescription(offer)
    setStatus('已設定遠端 Offer，建立 Answer 中...')
    await createAnswer()
  } catch (error: unknown) {
    setStatus('處理 Offer/Answer 失敗：' + (error instanceof Error ? error.message : String(error)), 'bad')
  }
}

const handleApplyAnswer = async () => {
  try {
    const txt = remoteSDP.value.trim()
    if (!txt) {
      alert('請先貼上對方回傳的 Answer (JSON)')
      return
    }
    
    const answer = JSON.parse(txt)
    await setRemoteDescription(answer)
    setStatus('連線完成（等待 ICE 連上）。', 'ok')
  } catch (error: unknown) {
    setStatus('設定遠端 Answer 失敗：' + (error instanceof Error ? error.message : String(error)), 'bad')
  }
}

onMounted(() => {
  checkWebRTCSupport()
})
</script>

<template>
  <div class="wrap">
    <h1>一頁版 WebRTC 相機分享（無伺服器手動訊令）</h1>
    <p class="hint">
      兩台裝置皆開啟本頁，選擇角色後依步驟複製貼上 <b>SDP</b> 即可直接 P2P 傳送相機畫面。
      需要 <b>HTTPS</b>（或 <code>localhost</code>）。行動 Safari 請點擊按鈕觸發播放。
    </p>

    <div class="card">
      <RoleSelector @change="roleConfig = $event" />
      
      <ControlPanel
        :can-create-offer="canCreateOffer"
        :can-set-offer-and-answer="canSetOfferAndAnswer"
        :can-apply-answer="canApplyAnswer"
        @start="start"
        @create-offer="handleCreateOffer"
        @set-offer-and-answer="handleSetOfferAndAnswer"
        @apply-answer="handleApplyAnswer"
      />

      <SDPExchange
        :local-s-d-p="localSDP"
        :gather-status="state.gatherStatus"
        :gather-class="state.gatherClass"
        v-model:remote-s-d-p="remoteSDP"
      />

      <div class="videos" style="margin-top:12px">
        <VideoPlayer
          title="本機預覽"
          :stream="localStream"
          muted
        />
        <VideoPlayer
          title="遠端畫面"
          :stream="remoteStream"
          show-fullscreen-button
        />
      </div>

      <div class="status" :class="state.statusClass">狀態：{{ state.status }}</div>
      <p class="hint small">
        若在嚴苛 NAT 環境下無法連線，可能需 TURN 伺服器。可在程式中加入 
        <code>iceServers: [{ urls: 'turn:YOUR_TURN', username: 'u', credential: 'p' }]</code>。
      </p>
    </div>
  </div>
</template>

<style>
:root { 
  --bg:#0b1020; 
  --fg:#e9eef7; 
  --muted:#9fb0c3; 
  --card:#131a32; 
  --accent:#7aa2ff; 
}

html, body {
  height: 100%
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font: 16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC, Helvetica, Arial, Apple Color Emoji, Noto Color Emoji, Segoe UI Emoji
}

.wrap {
  max-width: 980px;
  margin: 0 auto;
  padding: 16px
}

h1 {
  font-size: 20px;
  margin: 8px 0 12px
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px
}

.card {
  background: var(--card);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.25)
}

fieldset {
  border: 1px solid #2a355b;
  border-radius: 10px
}

legend {
  color: var(--muted)
}

label {
  margin-right: 12px;
  white-space: nowrap
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0
}

button, select {
  background: #1a2345;
  border: 1px solid #2e3a6b;
  color: var(--fg);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer
}

button[disabled] {
  opacity: .5;
  cursor: not-allowed
}

textarea {
  width: 100%;
  min-height: 140px;
  background: #0f142a;
  color: var(--fg);
  border: 1px solid #2e3a6b;
  border-radius: 10px;
  padding: 8px
}

.videos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px
}

video {
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 12px
}

.mirror { 
  transform: scaleX(-1); 
  transform-origin: center; 
}

.hint {
  color: var(--muted);
  font-size: 13px
}

.status {
  margin-top: 6px;
  color: #b6cffd;
  font-size: 13px
}

.ok {
  color: #6ee7b7
}

.warn {
  color: #fbbf24
}

.bad {
  color: #fb7185
}

.small {
  font-size: 13px
}

a {
  color: var(--accent)
}
</style>
