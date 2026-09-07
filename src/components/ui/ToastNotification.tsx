import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export interface ToastNotificationProps {
  message: string
  variant?: 'default' | 'success' | 'error'
  duration?: number
  onDismiss: () => void
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  variant = 'default',
  duration = 4000,
  onDismiss,
}) => {
  const [isExiting, setIsExiting] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const remainingTimeRef = useRef(duration)
  const startTimeRef = useRef(Date.now())

  const handleDismiss = () => {
    if (isExiting) return
    setIsExiting(true)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setTimeout(() => {
      onDismiss()
    }, 200)
  }

  // Auto-dismiss countdown
  useEffect(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setTimeout(() => {
      handleDismiss()
    }, remainingTimeRef.current)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      const elapsed = Date.now() - startTimeRef.current
      remainingTimeRef.current = Math.max(1000, remainingTimeRef.current - elapsed)
    }
  }

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now()
    timerRef.current = setTimeout(() => {
      handleDismiss()
    }, remainingTimeRef.current)
  }

  // Icons and borders by variant
  const iconMap = {
    success: <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400 shrink-0" />,
    error: <AlertCircle size={18} className="text-rose-500 dark:text-rose-400 shrink-0" />,
    default: <Info size={18} className="text-brand-primary shrink-0" />
  }

  const borderMap = {
    success: 'border-emerald-500/30 dark:border-emerald-500/40 shadow-emerald-500/10',
    error: 'border-rose-500/30 dark:border-rose-500/40 shadow-rose-500/10',
    default: 'border-black/10 dark:border-white/15'
  }

  return (
    <aside
      id="confirmation-toast"
      aria-label="Thông báo xác nhận"
      className="fixed bottom-20 md:bottom-8 inset-x-0 mx-auto z-50 flex justify-center pointer-events-none px-4"
    >
      <div
        role="status"
        aria-live="polite"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`pointer-events-auto flex items-center gap-3 pl-4 pr-2.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl transition-all max-w-md w-auto ${borderMap[variant]} ${
          isExiting ? 'animate-toastFloatDown' : 'animate-toastFloatUp'
        } bg-white/95 dark:bg-[#0f172a]/95 text-slate-900 dark:text-slate-100 border shadow-black/15 dark:shadow-black/60`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {iconMap[variant]}
          <p className="text-sm font-medium leading-snug tracking-tight">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Đóng thông báo"
          title="Đóng"
          className="shrink-0 p-1.5 ml-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
    </aside>
  )
}
