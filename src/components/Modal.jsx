import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

const Modal = ({ children, onClose, isOpen = true }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) onClose()
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div 
        className="w-full max-w-md"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export default Modal
