<template>
  <div>
    <div class="hint" style="display:flex;align-items:center;gap:8px;justify-content:space-between">
      <span>{{ title }}</span>
      <div style="display:flex;align-items:center;gap:8px">
        <label class="small" style="display:flex;align-items:center;gap:6px">
          <input 
            type="checkbox" 
            v-model="mirrorEnabled"
            @change="onMirrorChange"
          > 
          鏡像
        </label>
        <button 
          v-if="showFullscreenButton"
          class="small" 
          @click="onFullscreenClick"
          title="遠端全螢幕"
        >
          全螢幕
        </button>
      </div>
    </div>
    <video 
      ref="videoRef"
      playsinline
      :muted="muted"
      @dblclick="onDoubleClick"
    ></video>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useMedia } from '../composables/useMedia'

interface Props {
  title: string
  stream?: MediaStream | null
  muted?: boolean
  showFullscreenButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  muted: false,
  showFullscreenButton: false
})

const videoRef = ref<HTMLVideoElement | null>(null)
const mirrorEnabled = ref(false)

const { setVideoSource, toggleMirror, toggleFullscreen } = useMedia()

const onMirrorChange = () => {
  toggleMirror(videoRef.value, mirrorEnabled.value)
}

const onFullscreenClick = () => {
  toggleFullscreen(videoRef.value)
}

const onDoubleClick = () => {
  if (props.showFullscreenButton) {
    toggleFullscreen(videoRef.value)
  }
}

watch(() => props.stream, (newStream) => {
  setVideoSource(videoRef.value, newStream || null)
}, { immediate: true })

onMounted(() => {
  if (props.stream) {
    setVideoSource(videoRef.value, props.stream)
  }
})

defineExpose({
  videoElement: videoRef
})
</script>