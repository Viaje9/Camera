import { ref, type Ref } from 'vue'

export interface WebRTCState {
  status: string
  gatherStatus: string
  statusClass: string
  gatherClass: string
}

export function useWebRTC() {
  const pc: Ref<RTCPeerConnection | null> = ref(null)
  const localStream: Ref<MediaStream | null> = ref(null)
  const state = ref<WebRTCState>({
    status: '尚未啟動',
    gatherStatus: '—',
    statusClass: '',
    gatherClass: ''
  })

  const setStatus = (text: string, cls = '') => {
    state.value.status = text
    state.value.statusClass = cls
  }

  const setGatherStatus = (text: string, cls = '') => {
    state.value.gatherStatus = text
    state.value.gatherClass = cls
  }

  const createPeerConnection = () => {
    if (pc.value) pc.value.close()
    
    pc.value = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    pc.value.onicegatheringstatechange = () => {
      if (pc.value) {
        setGatherStatus(pc.value.iceGatheringState)
      }
    }

    pc.value.onconnectionstatechange = () => {
      if (pc.value) {
        const connectionState = pc.value.connectionState
        setStatus('PeerConnection：' + connectionState,
          connectionState === 'connected' ? 'ok' : (connectionState === 'failed' ? 'bad' : ''))
      }
    }

    return pc.value
  }

  const addStream = (stream: MediaStream) => {
    if (!pc.value) return
    stream.getTracks().forEach(track => {
      pc.value!.addTrack(track, stream)
    })
  }

  const createOffer = async (options?: RTCOfferOptions) => {
    if (!pc.value) throw new Error('PeerConnection not initialized')
    
    setStatus('建立 Offer 中...')
    const offer = await pc.value.createOffer(options)
    await pc.value.setLocalDescription(offer)
    setStatus('已建立本機 Offer，等待 ICE 蒐集完成，複製「本機 SDP」給對方。', 'ok')
    
    return offer
  }

  const createAnswer = async () => {
    if (!pc.value) throw new Error('PeerConnection not initialized')
    
    setStatus('建立 Answer 中...')
    const answer = await pc.value.createAnswer()
    await pc.value.setLocalDescription(answer)
    setStatus('已建立本機 Answer。等待 ICE 完成後，複製「本機 SDP」回傳給對方。', 'ok')
    
    return answer
  }

  const setRemoteDescription = async (description: RTCSessionDescriptionInit) => {
    if (!pc.value) throw new Error('PeerConnection not initialized')
    await pc.value.setRemoteDescription(description)
  }

  const onTrack = (callback: (event: RTCTrackEvent) => void) => {
    if (pc.value) {
      pc.value.ontrack = callback
    }
  }

  const onIceCandidate = (callback: (localDescription: RTCSessionDescription | null) => void) => {
    if (pc.value) {
      pc.value.onicecandidate = (e) => {
        if (!e.candidate) {
          callback(pc.value!.localDescription)
        }
      }
    }
  }

  const close = () => {
    if (pc.value) {
      pc.value.close()
      pc.value = null
    }
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => track.stop())
      localStream.value = null
    }
  }

  return {
    pc,
    localStream,
    state,
    setStatus,
    setGatherStatus,
    createPeerConnection,
    addStream,
    createOffer,
    createAnswer,
    setRemoteDescription,
    onTrack,
    onIceCandidate,
    close
  }
}