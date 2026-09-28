import { useEffect } from 'react'

const KEYBOARD_HEIGHT_RATIO = 0.78
const ORIENTATION_WIDTH_CHANGE = 120

export function useVisualViewport() {
  useEffect(() => {
    const root = document.documentElement
    const viewport = window.visualViewport
    let frame = 0
    let lastWidth = viewport?.width ?? window.innerWidth
    let maximumHeight = viewport?.height ?? window.innerHeight
    let keyboardWasOpen = false

    function updateViewport() {
      const width = viewport?.width ?? window.innerWidth
      const height = viewport?.height ?? window.innerHeight
      const offsetTop = viewport?.offsetTop ?? 0

      if (Math.abs(width - lastWidth) > ORIENTATION_WIDTH_CHANGE) {
        maximumHeight = height
        lastWidth = width
      } else {
        maximumHeight = Math.max(maximumHeight, height)
      }

      const activeElement = document.activeElement
      const textInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      const keyboardOpen =
        textInputFocused && height < maximumHeight * KEYBOARD_HEIGHT_RATIO
      root.style.setProperty('--app-viewport-height', `${height}px`)
      root.style.setProperty('--app-viewport-offset-top', `${offsetTop}px`)
      document.body.dataset.virtualKeyboard = keyboardOpen ? 'open' : 'closed'

      if (keyboardOpen && !keyboardWasOpen) {
        activeElement.scrollIntoView({ block: 'center' })
      }
      keyboardWasOpen = keyboardOpen
    }

    function scheduleUpdate() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateViewport)
    }

    updateViewport()
    viewport?.addEventListener('resize', scheduleUpdate)
    viewport?.addEventListener('scroll', scheduleUpdate)
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('orientationchange', scheduleUpdate)

    return () => {
      cancelAnimationFrame(frame)
      viewport?.removeEventListener('resize', scheduleUpdate)
      viewport?.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('orientationchange', scheduleUpdate)
      delete document.body.dataset.virtualKeyboard
      root.style.removeProperty('--app-viewport-height')
      root.style.removeProperty('--app-viewport-offset-top')
    }
  }, [])
}
