<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop :data-confirm-type="confirmType">
          <div class="modal-header">
            <h3>{{ title }}</h3>
          </div>
          
          <div class="modal-body">
            <p>{{ message }}</p>
          </div>
          
          <div class="modal-actions">
            <button class="cancel-btn" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="confirm-btn" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmType?: 'danger' | 'primary' | 'warning'
}

withDefaults(defineProps<Props>(), {
  title: '確認',
  message: '確定要執行此操作嗎？',
  confirmText: '確定',
  cancelText: '取消',
  confirmType: 'primary'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const handleOverlayClick = () => {
  emit('cancel')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: var(--card);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  color: var(--fg);
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
  font-size: 0.95rem;
}

.modal-actions {
  padding: 16px 24px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
}

.cancel-btn {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
}

.cancel-btn:hover {
  background: var(--border);
  color: var(--fg);
}

.confirm-btn {
  background: var(--accent);
  color: white;
}

.confirm-btn:hover {
  background: #6891ff;
  transform: translateY(-1px);
}

/* 危險操作樣式 */
.modal-container[data-confirm-type="danger"] .confirm-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.modal-container[data-confirm-type="danger"] .confirm-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

/* 警告操作樣式 */
.modal-container[data-confirm-type="warning"] .confirm-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.modal-container[data-confirm-type="warning"] .confirm-btn:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

/* 動畫效果 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}

/* 手機優化 */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 16px;
  }
  
  .modal-container {
    max-width: none;
  }
  
  .modal-header {
    padding: 20px 20px 12px 20px;
  }
  
  .modal-header h3 {
    font-size: 1.1rem;
  }
  
  .modal-body {
    padding: 16px 20px;
  }
  
  .modal-actions {
    padding: 12px 20px 20px 20px;
    flex-direction: column-reverse;
  }
  
  .cancel-btn,
  .confirm-btn {
    width: 100%;
    padding: 12px;
  }
}
</style>