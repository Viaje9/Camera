export function useClipboard() {
  const writeText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('複製到剪貼簿失敗:', error)
      return false
    }
  }

  const readText = async () => {
    try {
      const text = await navigator.clipboard.readText()
      return text
    } catch (error) {
      console.error('從剪貼簿讀取失敗:', error)
      return ''
    }
  }

  return {
    writeText,
    readText
  }
}