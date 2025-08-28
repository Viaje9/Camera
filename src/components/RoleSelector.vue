<template>
  <fieldset>
    <legend>角色</legend>
    <div class="controls">
      <label>
        <input 
          type="radio" 
          name="role" 
          value="sender" 
          v-model="selectedRole"
        > 
        發送端（分享相機）
      </label>
      <label>
        <input 
          type="radio" 
          name="role" 
          value="viewer" 
          v-model="selectedRole"
        > 
        接收端（觀看）
      </label>
      <label class="small">
        <input 
          type="checkbox" 
          v-model="withAudio"
        > 
        包含麥克風（可選）
      </label>
      <label class="small">
        後鏡頭偏好：
        <select v-model="facingMode">
          <option value="environment">後鏡頭</option>
          <option value="user">前鏡頭</option>
        </select>
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

export interface RoleConfig {
  role: 'sender' | 'viewer'
  withAudio: boolean
  facingMode: 'environment' | 'user'
}

const selectedRole = ref<'sender' | 'viewer'>('sender')
const withAudio = ref(false)
const facingMode = ref<'environment' | 'user'>('environment')

const emit = defineEmits<{
  change: [config: RoleConfig]
}>()

watch([selectedRole, withAudio, facingMode], () => {
  emit('change', {
    role: selectedRole.value,
    withAudio: withAudio.value,
    facingMode: facingMode.value
  })
}, { immediate: true })
</script>