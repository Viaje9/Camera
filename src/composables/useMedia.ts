import { ref, type Ref } from 'vue'

// 擴展 Document 和 HTMLElement 類型以支援舊版瀏覽器 API
interface ExtendedDocument extends Document {
  webkitFullscreenElement?: Element
  msFullscreenElement?: Element
  webkitExitFullscreen?: () => Promise<void>
  msExitFullscreen?: () => Promise<void>
}

interface ExtendedHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>
  msRequestFullscreen?: () => Promise<void>
  webkitEnterFullscreen?: () => void
}

export function useMedia() {
  const localVideo: Ref<HTMLVideoElement | null> = ref(null)
  const remoteVideo: Ref<HTMLVideoElement | null> = ref(null)

  const getUserMedia = async (options: {
    video?: MediaTrackConstraints | boolean
    audio?: boolean
  }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(options)
      return stream
    } catch (error) {
      console.error('無法取得媒體裝置:', error)
      throw error
    }
  }

  const playVideo = async (video: HTMLVideoElement | null) => {
    if (!video) return
    try {
      await video.play()
    } catch (error) {
      console.log('自動播放失敗:', error)
    }
  }

  const setVideoSource = (video: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (video) {
      video.srcObject = stream
      if (stream) {
        playVideo(video)
      }
    }
  }

  const toggleMirror = (video: HTMLVideoElement | null, enabled: boolean) => {
    if (!video) return
    if (enabled) {
      video.classList.add('mirror')
    } else {
      video.classList.remove('mirror')
    }
  }

  const isFullscreen = () => {
    const doc = document as ExtendedDocument
    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.msFullscreenElement
    )
  }

  const enterFullscreen = async (element: HTMLElement) => {
    const extElement = element as ExtendedHTMLElement
    try {
      if (element.requestFullscreen) {
        return await element.requestFullscreen()
      }
      if (extElement.webkitRequestFullscreen) {
        return await extElement.webkitRequestFullscreen()
      }
      if (extElement.msRequestFullscreen) {
        return await extElement.msRequestFullscreen()
      }
    } catch (error) {
      console.log('進入全螢幕失敗:', error)
    }
    
    // iOS Safari 對 video 的後備方案
    try {
      if (extElement.webkitEnterFullscreen) {
        return extElement.webkitEnterFullscreen()
      }
    } catch (error) {
      console.log('iOS 全螢幕失敗:', error)
    }
  }

  const exitFullscreen = async () => {
    const doc = document as ExtendedDocument
    try {
      if (document.exitFullscreen) {
        return await document.exitFullscreen()
      }
      if (doc.webkitExitFullscreen) {
        return await doc.webkitExitFullscreen()
      }
      if (doc.msExitFullscreen) {
        return await doc.msExitFullscreen()
      }
    } catch (error) {
      console.log('退出全螢幕失敗:', error)
    }
  }

  const toggleFullscreen = async (element: HTMLElement | null) => {
    if (!element) return
    
    if (isFullscreen()) {
      await exitFullscreen()
    } else {
      await enterFullscreen(element)
    }
  }

  return {
    localVideo,
    remoteVideo,
    getUserMedia,
    playVideo,
    setVideoSource,
    toggleMirror,
    isFullscreen,
    toggleFullscreen
  }
}