import React from 'react'
import { ChevronRight } from 'lucide-react'
import { LiquidModal, Button } from '../ui/UIComponents'
import logoImg from '../../logo.jpg'
import easterEggImg from '../../easter-egg-logo.jpg'

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
  spinCount: number
  flyoutRotation: number
  onFlyoutLogoClick: () => void
  confettiCanvasRef: React.RefObject<HTMLCanvasElement>
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  spinCount,
  flyoutRotation,
  onFlyoutLogoClick,
  confettiCanvasRef,
}) => {
  return (
    <LiquidModal
      isOpen={isOpen}
      onClose={onClose}
      size="small"
    >
      <div className="flex flex-col text-center items-center py-2 relative overflow-hidden">
        <canvas ref={confettiCanvasRef} className="absolute inset-0 pointer-events-none z-0 w-full h-full" />
        <img 
          src={spinCount >= 10 ? easterEggImg : logoImg} 
          alt="RateVietProfessors Logo" 
          tabIndex={0}
          onClick={onFlyoutLogoClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onFlyoutLogoClick() }}
          className="w-20 h-20 object-cover rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] mb-3 z-10 relative cursor-pointer outline-none focus-visible:ring-2 ring-brand-primary transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ transform: `rotate(${flyoutRotation}deg)` }}
        />
        <h2 className="text-lg font-bold text-text-primary z-10 relative mb-1">RateVietProfessors</h2>
        <p className="text-xs text-text-secondary z-10 relative mb-6 leading-relaxed">
          © {new Date().getFullYear()} RateVietProfessors<br />
          Phiên bản 1.0.0 (Build 42)
        </p>

        <div className="w-full flex flex-col glass-panel rounded-2xl overflow-hidden text-left z-10 relative mb-6">
          <a href="https://github.com/Merz26/ratevietprofessors" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-3.5 border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-primary text-sm font-medium group">
            <span>GitHub</span>
            <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
          </a>
          <a href="https://github.com/Merz26/ratevietprofessors/wiki" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-3.5 border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-primary text-sm font-medium group">
            <span>Về chúng tôi</span>
            <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
          </a>
          <a href="https://github.com/Merz26/ratevietprofessors/wiki" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-3.5 border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-primary text-sm font-medium group">
            <span>Quy tắc cộng đồng</span>
            <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
          </a>
          <a href="https://github.com/Merz26/ratevietprofessors/wiki" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-primary text-sm font-medium group">
            <span>Bảo mật</span>
            <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
          </a>
        </div>
        
        <Button 
          variant="neutral"
          size="medium"
          onClick={onClose} 
          className="min-w-[140px] z-10 relative"
        >
          Đóng
        </Button>
      </div>
    </LiquidModal>
  )
}
