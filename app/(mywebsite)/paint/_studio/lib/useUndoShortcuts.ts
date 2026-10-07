import { useEffect } from 'react'

const NON_TEXT_INPUTS = new Set(['range', 'color', 'checkbox', 'radio', 'button', 'file', 'submit'])

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true
  return target instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(target.type)
}

function wantsRedo(event: KeyboardEvent, key: string): boolean {
  return (key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey && !event.metaKey)
}

export const UNDO_SHORTCUT = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘Z' : 'Ctrl+Z'
export const REDO_SHORTCUT = UNDO_SHORTCUT === '⌘Z' ? '⇧⌘Z' : 'Ctrl+Y'

export function useUndoShortcuts(undo: () => void, redo: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || isTextEntry(event.target)) return
      const key = event.key.toLowerCase()
      const redoing = wantsRedo(event, key)
      if (key !== 'z' && !redoing) return
      event.preventDefault()
      if (redoing) redo()
      else undo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])
}
