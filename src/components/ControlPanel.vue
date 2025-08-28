<template>
  <div class="controls">
    <button @click="onStart">1) 啟動</button>
    <button 
      :disabled="!canCreateOffer"
      @click="onCreateOffer"
    >
      2) 建立 Offer（發送端）
    </button>
    <button 
      :disabled="!canSetOfferAndAnswer"
      @click="onSetOfferAndAnswer"
    >
      2) 設定遠端 Offer 並建立 Answer（接收端）
    </button>
    <button 
      :disabled="!canApplyAnswer"
      @click="onApplyAnswer"
    >
      3) 設定遠端 Answer（發送端）
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  canCreateOffer: boolean
  canSetOfferAndAnswer: boolean
  canApplyAnswer: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  start: []
  createOffer: []
  setOfferAndAnswer: []
  applyAnswer: []
}>()

const onStart = () => emit('start')
const onCreateOffer = () => emit('createOffer')
const onSetOfferAndAnswer = () => emit('setOfferAndAnswer')
const onApplyAnswer = () => emit('applyAnswer')
</script>