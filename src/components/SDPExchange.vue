<template>
  <div class="row">
    <div class="card">
      <div>
        <label for="localSdp">本機 SDP（複製給對方）</label>
        <button class="small" @click="copyLocalSDP">複製</button>
      </div>
      <textarea 
        id="localSdp"
        :value="localSDP"
        readonly 
        placeholder="按步驟產生..."
      ></textarea>
      <div class="status" :class="gatherClass">ICE 蒐集：{{ gatherStatus }}</div>
    </div>
    <div class="card">
      <div>
        <label for="remoteSdp">遠端 SDP（貼上對方給你的）</label>
        <button class="small" @click="pasteRemoteSDP">貼上（支援剪貼簿）</button>
      </div>
      <textarea 
        id="remoteSdp"
        v-model="remoteSDP"
        placeholder="在此貼上對方的 SDP JSON..."
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useClipboard } from '../composables/useClipboard'

interface Props {
  localSDP: string
  gatherStatus: string
  gatherClass: string
}

const props = defineProps<Props>()

const remoteSDP = ref('')
const { writeText, readText } = useClipboard()

const emit = defineEmits<{
  'update:remoteSDP': [value: string]
}>()

const copyLocalSDP = async () => {
  if (props.localSDP) {
    await writeText(props.localSDP)
  }
}

const pasteRemoteSDP = async () => {
  const text = await readText()
  if (text) {
    remoteSDP.value = text
  }
}

watch(remoteSDP, (value) => {
  emit('update:remoteSDP', value)
})

defineExpose({
  remoteSDP
})
</script>