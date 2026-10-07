import { useLayoutEffect, useState, type RefObject } from 'react'

export interface Size {
  width: number
  height: number
}

function contentBox(element: HTMLElement): Size {
  const style = getComputedStyle(element)
  const horizontal = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  const vertical = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
  return { width: element.clientWidth - horizontal, height: element.clientHeight - vertical }
}

function containWithin(box: Size, aspect: Size): Size {
  const scale = Math.min(box.width / aspect.width, box.height / aspect.height)
  return { width: Math.max(1, Math.floor(aspect.width * scale)), height: Math.max(1, Math.floor(aspect.height * scale)) }
}

export function useContainedSize(container: RefObject<HTMLElement | null>, aspect: Size): Size | null {
  const [size, setSize] = useState<Size | null>(null)
  const { width, height } = aspect

  useLayoutEffect(() => {
    const element = container.current
    if (!element) return
    const measure = () => setSize(containWithin(contentBox(element), { width, height }))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [container, width, height])

  return size
}
