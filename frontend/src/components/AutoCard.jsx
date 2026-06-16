// Componente que exibe cards e alterna automaticamente entre eles
import { useEffect, useState, useRef } from 'react'

export default function AutoCard({ items = [], interval = 6000 }) {
  const [index, setIndex] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
   
    mounted.current = true
    const id = setInterval(() => {
      if (!mounted.current) return
    
      setIndex(i => (i + 1) % items.length)
    }, interval)

    return () => {
      mounted.current = false
      clearInterval(id)
    }
  }, [items.length, interval])

  if (!items || items.length === 0) return null

  const current = items[index]

  return (
    <div className="auto-card" title={current.title || ''}>
      <div className="auto-card-inner">
        <div className="auto-card-title">{current.title}</div>
        <div className="auto-card-text">{current.text}</div>
      </div>
    </div>
  )
}
