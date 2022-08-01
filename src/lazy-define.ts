const dynamicElements = new Map<string, Array<() => void>>()

const ready = new Promise<void>(resolve => {
  if (document.readyState !== 'loading') {
    resolve()
  } else {
    document.addEventListener('readystatechange', () => resolve(), {once: true})
  }
})

const firstInteraction = new Promise<void>(resolve => {
  const controller = new AbortController()
  controller.signal.addEventListener('abort', () => resolve())
  const listenerOptions = {once: true, passive: true, signal: controller.signal}
  const handler = () => controller.abort()

  document.addEventListener('mousedown', handler, listenerOptions)
  document.addEventListener('touchstart', handler, listenerOptions)
  document.addEventListener('keydown', handler, listenerOptions)
  document.addEventListener('pointerdown', handler, listenerOptions)
})

const strategies = {
  ready,
  firstInteraction
}

const timers = new WeakMap<Element, number>()
function scan(node: Element = document.body) {
  cancelAnimationFrame(timers.get(node) || 0)
  timers.set(
    node,
    requestAnimationFrame(() => {
      for (const tagName of dynamicElements.keys()) {
        const child: Element | null = node.matches(tagName) ? node : node.querySelector(tagName)
        if (customElements.get(tagName) || child) {
          const strategyName = (child?.getAttribute('data-load-on') || 'ready') as keyof typeof strategies
          const strategy = strategyName in strategies ? strategies[strategyName] : strategies.ready
          // eslint-disable-next-line github/no-then
          for (const cb of dynamicElements.get(tagName) || []) strategy.then(cb)
          dynamicElements.delete(tagName)
          timers.delete(node)
        }
      }
    })
  )
}

const elementLoader = new MutationObserver(mutations => {
  if (!dynamicElements.size) return
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) scan(node)
    }
  }
})

let first = true
export function whenSeen(tagName: string, callback: () => void) {
  if (!dynamicElements.has(tagName)) dynamicElements.set(tagName, [])
  dynamicElements.get(tagName)!.push(callback)

  if (first) {
    scan(document.body)
    elementLoader.observe(document, {subtree: true, childList: true})
    first = false
  }
}
