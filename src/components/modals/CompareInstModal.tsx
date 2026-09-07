import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Avatar } from '@figma/astraui'
import { LiquidModal, Button, ButtonGroup, Badge, ScoreBadge } from '../ui/UIComponents'
import DebouncedInput from '../DebouncedInput'
import { Institution, InstStats } from '../../types'

interface CompareInstModalProps {
  isOpen: boolean
  onClose: () => void
  selectedInst: Institution | null
  institutions: Institution[]
  calculateInstStats: (id: number) => InstStats
}

export const CompareInstModal: React.FC<CompareInstModalProps> = ({
  isOpen,
  onClose,
  selectedInst,
  institutions,
  calculateInstStats,
}) => {
  const [compareInstSearch, setCompareInstSearch] = useState('')
  const [compareInstSelected, setCompareInstSelected] = useState<Institution | null>(null)

  const handleClose = () => {
    onClose()
    setCompareInstSelected(null)
    setCompareInstSearch('')
  }

  if (!selectedInst) return null

  return (
    <LiquidModal
      isOpen={isOpen}
      onClose={handleClose}
      title="So sánh trường"
      size="medium"
      footer={
        <ButtonGroup align="end">
          <Button variant="neutral" onClick={handleClose}>Đóng</Button>
        </ButtonGroup>
      }
    >
      {compareInstSelected ? (
        <div className="flex flex-col gap-xl">
          <div className="grid grid-cols-2 gap-xl">
            {[{ inst: selectedInst, label: 'Hiện tại' }, { inst: compareInstSelected, label: 'So sánh' }].map(({ inst, label }) => {
              const stats = calculateInstStats(inst.id)
              return (
                <div key={inst.id} className="glass-panel rounded-2xl border border-black/5 dark:border-white/10 p-xl flex flex-col gap-lg">
                  <div>
                    <Badge label={label} variant={label === 'Hiện tại' ? 'brand' : 'secondary'} />
                    <p className="text-label text-text-primary font-semibold mt-sm">{inst.name}</p>
                    <p className="text-video-title text-text-secondary">{inst.short_name}</p>
                    <p className="text-video-title text-text-tertiary">{inst.location}</p>
                  </div>
                  <div className="flex flex-col gap-sm">
                    {[
                      { key: 'Uy tín trường', val: stats.metricsAvg['Uy tín trường'] || '0.0' },
                      { key: 'Cơ hội việc làm', val: stats.metricsAvg['Cơ hội việc làm'] || '0.0' },
                      { key: 'Cơ sở vật chất', val: stats.metricsAvg['Cơ sở vật chất'] || '0.0' },
                      { key: 'Tổng quan', val: stats.overall.toFixed(1) },
                      { key: 'Đánh giá', val: stats.total },
                    ].map(({ key, val }) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-video-title text-text-secondary">{key}</span>
                        <span className="text-label-sm text-text-primary font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <Button variant="subtle" size="small" onClick={() => setCompareInstSelected(null)} iconStart={<X size={14} />}>
            Chọn lại
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-lg">
          <p className="text-label-sm text-text-secondary">Tìm trường để so sánh với <strong>{selectedInst.name}</strong></p>
          
          <div className="relative flex items-center gap-md glass-search shadow-sm rounded-corner-md focus-within:border-brand-primary transition-colors px-xl">
            <Search size={18} className="text-text-secondary shrink-0" />
            <DebouncedInput
              type="text"
              value={compareInstSearch}
              placeholder="Tìm theo tên trường..."
              onChange={val => setCompareInstSearch(val)}
              className="flex-1 bg-transparent border-none py-lg text-label text-text-primary focus:outline-none w-full"
            />
          </div>

          <div className="flex flex-col gap-sm max-h-72 overflow-y-auto dropdown-scrollbar scroll-smooth overscroll-contain pr-xs">
            {institutions
              .filter(i =>
                i.id !== selectedInst.id &&
                (!compareInstSearch || i.name.toLowerCase().includes(compareInstSearch.toLowerCase()) || i.short_name.toLowerCase().includes(compareInstSearch.toLowerCase()))
              )
              .map(i => {
                const stats = calculateInstStats(i.id)
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setCompareInstSelected(i)}
                    className="flex items-center justify-between gap-lg p-lg rounded-corner-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-md">
                      <Avatar type="initial" initials={i.short_name.charAt(0) || 'I'} size="small" shape="circle" />
                      <div>
                        <p className="text-label-sm text-text-primary">{i.short_name}</p>
                        <p className="text-video-title text-text-secondary">{i.name}</p>
                      </div>
                    </div>
                    <ScoreBadge value={stats.overall} />
                  </button>
                )
              })}
            {institutions.filter(i =>
              i.id !== selectedInst.id &&
              (!compareInstSearch || i.name.toLowerCase().includes(compareInstSearch.toLowerCase()) || i.short_name.toLowerCase().includes(compareInstSearch.toLowerCase()))
            ).length === 0 && (
              <p className="text-center text-label-sm text-text-secondary py-lg">Không tìm thấy trường nào phù hợp.</p>
            )}
          </div>
        </div>
      )}
    </LiquidModal>
  )
}
