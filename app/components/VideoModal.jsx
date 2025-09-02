'use client'

import { useEffect } from 'react'

export default function VideoModal({ open, onClose, title, playbackUrl }){
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') onClose?.() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const isMuxStream = (playbackUrl||'').includes('m3u8')
  const isYouTube = /youtube\.com|youtu\.be/.test(playbackUrl||'')
  const isVimeo = /vimeo\.com/.test(playbackUrl||'')
  return (
    <div className="video-modal show" onClick={(e)=>{ if(e.target===e.currentTarget) onClose?.() }}>
      <div className="video-modal-content">
        {isYouTube || isVimeo ? (
          <iframe src={playbackUrl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={title||'Video'} />
        ) : isMuxStream ? (
          <video src={playbackUrl} controls autoPlay playsInline />
        ) : (
          <video src={playbackUrl} controls autoPlay playsInline />
        )}
      </div>
      <button className="video-modal-close" onClick={onClose}>×</button>
    </div>
  )
}
