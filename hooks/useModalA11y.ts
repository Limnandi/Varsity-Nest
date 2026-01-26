import { useEffect, useRef } from "react"

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
    ),
  )

  return nodes.filter((el) => {
    const style = window.getComputedStyle(el)
    if (style.display === "none" || style.visibility === "hidden") return false
    // Hidden attribute / aria-hidden
    if (el.hasAttribute("hidden")) return false
    if (el.getAttribute("aria-hidden") === "true") return false
    return true
  })
}

/**
 * Minimal, production-safe modal a11y helper:
 * - Focus first focusable element on open
 * - Trap Tab focus within container
 * - Close on Escape
 * - Restore focus on close
 */
export function useModalA11y(params: {
  isOpen: boolean
  containerRef: React.RefObject<HTMLElement | null>
  onClose: () => void
}) {
  const { isOpen, containerRef, onClose } = params
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null

    const container = containerRef.current
    const focusables = container ? getFocusableElements(container) : []
    const initial = (focusables[0] ?? container) as HTMLElement | null
    initial?.focus?.()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key !== "Tab") return
      if (!container) return

      const items = getFocusableElements(container)
      if (items.length === 0) {
        e.preventDefault()
        return
      }

      const current = document.activeElement as HTMLElement | null
      const currentIndex = current ? items.indexOf(current) : -1

      const nextIndex = (() => {
        if (e.shiftKey) {
          return currentIndex <= 0 ? items.length - 1 : currentIndex - 1
        }
        return currentIndex === -1 || currentIndex >= items.length - 1 ? 0 : currentIndex + 1
      })()

      e.preventDefault()
      items[nextIndex]?.focus()
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      // Restore focus after React unmounts the modal content.
      requestAnimationFrame(() => {
        previouslyFocusedRef.current?.focus?.()
      })
    }
  }, [isOpen, containerRef, onClose])
}

