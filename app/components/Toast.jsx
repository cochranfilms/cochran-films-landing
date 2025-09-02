'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])
  const push = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, message, type }])
    if (duration) setTimeout(() => remove(id), duration)
  }, [remove])

  const api = useMemo(() => ({ push }), [push])

  useEffect(() => { if (typeof window !== 'undefined') window.cfToast = api }, [api])

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div style={{ position:'fixed', top:20, right:20, zIndex:10001, display:'grid', gap:10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type==='success' ? '#10b981' : t.type==='error' ? '#ef4444' : '#6366f1',
            color:'#fff', padding:'12px 16px', borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <i className={`fas fa-${t.type==='success'?'check-circle':t.type==='error'?'exclamation-circle':'info-circle'}`}></i>
              <span>{t.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast(){
  return useContext(ToastCtx)
}


