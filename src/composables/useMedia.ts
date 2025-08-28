import { ref, type Ref } from 'vue'

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
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement
    )
  }

  const enterFullscreen = async (element: HTMLElement) => {
    try {
      if (element.requestFullscreen) {
        return await element.requestFullscreen()
      }
      if ((element as any).webkitRequestFullscreen) {
        return await (element as any).webkitRequestFullscreen()
      }
      if ((element as any).msRequestFullscreen) {
        return await (element as any).msRequestFullscreen()
      }
    } catch (error) {
      console.log('進入全螢幕失敗:', error)
    }
    
    // iOS Safari 對 video 的後備方案
    try {
      if ((element as any).webkitEnterFullscreen) {
        return (element as any).webkitEnterFullscreen()
      }
    } catch (error) {
      console.log('iOS 全螢幕失敗:', error)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        return await document.exitFullscreen()
      }
      if ((document as any).webkitExitFullscreen) {
        return await (document as any).webkitExitFullscreen()
      }
      if ((document as any).msExitFullscreen) {
        return await (document as any).msExitFullscreen()
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