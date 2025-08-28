import { ref, computed } from 'vue'

export type AppView = 'role-selection' | 'sdp-exchange' | 'connected'
export type Role = 'sender' | 'receiver'

export function useAppState() {
  const currentView = ref<AppView>('role-selection')
  const selectedRole = ref<Role | null>(null)
  const isConnected = ref(false)
  const localSDP = ref('')
  const remoteSDP = ref('')
  const connectionStatus = ref('')
  const isLoading = ref(false)

  const isSender = computed(() => selectedRole.value === 'sender')
  const isReceiver = computed(() => selectedRole.value === 'receiver')

  const setRole = (role: Role) => {
    selectedRole.value = role
    currentView.value = 'sdp-exchange'
  }

  const setConnected = () => {
    isConnected.value = true
    currentView.value = 'connected'
  }

  const reset = () => {
    currentView.value = 'role-selection'
    selectedRole.value = null
    isConnected.value = false
    localSDP.value = ''
    remoteSDP.value = ''
    connectionStatus.value = ''
    isLoading.value = false
  }

  const setLocalSDP = (sdp: string) => {
    localSDP.value = sdp
  }

  const setRemoteSDP = (sdp: string) => {
    remoteSDP.value = sdp
  }

  const setStatus = (status: string) => {
    connectionStatus.value = status
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    // 狀態
    currentView,
    selectedRole,
    isConnected,
    localSDP,
    remoteSDP,
    connectionStatus,
    isLoading,
    
    // 計算屬性
    isSender,
    isReceiver,
    
    // 方法
    setRole,
    setConnected,
    reset,
    setLocalSDP,
    setRemoteSDP,
    setStatus,
    setLoading
  }
}