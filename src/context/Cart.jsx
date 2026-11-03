import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const KEY = 'gbh-cart-v1'
const CartContext = createContext(null)

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { items: Array.isArray(v.items) ? v.items : [], code: v.code || '' }
  } catch {
    return { items: [], code: '' }
  }
}

const sameLine = (a, b) => a.type === b.type && a.id === b.id && (a.weight || null) === (b.weight || null)

// Panier stocké dans le navigateur : [{ type: 'product'|'pack', id, weight?, qty }]
export function CartProvider({ children }) {
  const [cart, setCart] = useState(read)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart))
    } catch {
      /* stockage indisponible (navigation privée) : le panier reste en mémoire */
    }
  }, [cart])

  const add = useCallback((line, label) => {
    setCart((c) => {
      const existing = c.items.find((i) => sameLine(i, line))
      const items = existing
        ? c.items.map((i) => (i === existing ? { ...i, qty: Math.min(50, i.qty + (line.qty || 1)) } : i))
        : [...c.items, { ...line, weight: line.weight || null, qty: line.qty || 1 }]
      return { ...c, items }
    })
    setToast({ label, at: Date.now() })
  }, [])

  const setQty = useCallback((line, qty) => {
    setCart((c) => ({
      ...c,
      items: qty <= 0 ? c.items.filter((i) => !sameLine(i, line)) : c.items.map((i) => (sameLine(i, line) ? { ...i, qty: Math.min(50, qty) } : i)),
    }))
  }, [])

  const remove = useCallback((line) => setQty(line, 0), [setQty])
  const setCode = useCallback((code) => setCart((c) => ({ ...c, code })), [])
  const clear = useCallback(() => setCart({ items: [], code: '' }), [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const count = cart.items.reduce((n, i) => n + i.qty, 0)

  const value = useMemo(
    () => ({ items: cart.items, code: cart.code, count, add, setQty, remove, setCode, clear, toast }),
    [cart, count, add, setQty, remove, setCode, clear, toast],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
