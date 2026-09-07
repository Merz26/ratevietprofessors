import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Avatar } from '@figma/astraui'
import { LiquidModal, Button, ButtonGroup, Badge, ScoreBadge, SearchableDropdown } from '../ui/UIComponents'
import DebouncedInput from '../DebouncedInput'
import { Professor, Institution, ProfStats } from '../../types'

interface CompareProfModalProps {
  isOpen: boolean
  onClose: () => void
  selectedProf: Professor | null
  professors: Professor[]
  institutions: Institution[]
  calculateProfStats: (id: number) => ProfStats
}

export const CompareProfModal: React.FC<CompareProfModalProps> = ({
  isOpen,
  onClose,
  selectedProf,
  professors,
  institutions,
  calculateProfStats,
}) => {
  const [compareSearch, setCompareSearch] = useState('')
  const [compareUniv, setCompareUniv] = useState('')
  const [compareDept, setCompareDept] = useState('')
  const [compareProf, setCompareProf] = useState<Professor | null>(null)

  const handleClose = () => {
    onClose()
    setCompareProf(null)
    setCompareSearch('')
    setCompareUniv('')
    setCompareDept('')
  }

  if (!selectedProf) return null

  return (
    <LiquidModal
      isOpen={isOpen}
      onClose={handleClose}
      title="So sánh giảng viên"
      size="medium"
      footer={
        <ButtonGroup align="end">
          <Button variant="neutral" onClick={handleClose}>Đóng</Button>
        </ButtonGroup>
      }
    >
      {compareProf ? (
        <div className="flex flex-col gap-xl">
          <div className="grid grid-cols-2 gap-xl">
            {[{ prof: selectedProf, label: 'Hiện tại' }, { prof: compareProf, label: 'So sánh' }].map(({ prof, label }) => {
              const s = calculateProfStats(prof.id)
              return (
                <div key={prof.id} className="glass-panel rounded-2xl border border-black/5 dark:border-white/10 p-xl flex flex-col gap-lg">
                  <div>
                    <Badge label={label} variant={label === 'Hiện tại' ? 'brand' : 'secondary'} />
                    <p className="text-label text-text-primary font-semibold mt-sm">{prof.name}</p>
                    <p className="text-video-title text-text-secondary">{prof.department}</p>
                    <p className="text-video-title text-text-tertiary">{prof.university}</p>
                  </div>
                  <div className="flex flex-col gap-sm">
                    {[
                      { key: 'Chất lượng', val: s.avg_rating.toFixed(1) },
                      { key: 'Độ khó', val: s.avg_difficulty.toFixed(1) },
                      { key: 'Học lại', val: `${s.would_take_again_pct}%` },
                      { key: 'Đánh giá', val: s.total_ratings },
                    ].map(({ key, val }) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-video-title text-text-secondary">{key}</span>
                        <span className="text-label-sm text-text-primary font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-xs">
                    {(prof.tags || []).map(t => <Badge key={t} label={t} variant="secondary" />)}
                  </div>
                </div>
              )
            })}
          </div>
          <Button variant="subtle" size="small" onClick={() => setCompareProf(null)} iconStart={<X size={14} />}>
            Chọn lại
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-lg">
          <p className="text-label-sm text-text-secondary">Tìm giảng viên để so sánh với <strong>{selectedProf.name}</strong></p>
          
          <div className="relative flex items-center gap-md glass-search shadow-sm rounded-corner-md focus-within:border-brand-primary transition-colors px-xl">
            <Search size={18} className="text-text-secondary shrink-0" />
            <DebouncedInput
              type="text"
              value={compareSearch}
              placeholder="Tìm theo tên giảng viên..."
              onChange={val => setCompareSearch(val)}
              className="flex-1 bg-transparent border-none py-lg text-label text-text-primary focus:outline-none w-full"
            />
          </div>

          <div className="flex gap-sm flex-wrap">
            <div className="flex-1 min-w-40">
              <SearchableDropdown
                placeholder="Lọc theo trường"
                options={[
                  { value: '', label: 'Tất cả trường' },
                  ...institutions
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(i => ({ value: i.name, label: i.short_name + ' - ' + i.name })),
                ]}
                value={compareUniv}
                onChange={v => { setCompareUniv(v); setCompareDept('') }}
              />
            </div>
            <div className="flex-1 min-w-40">
              <SearchableDropdown
                placeholder="Lọc theo khoa"
                options={[
                  { value: '', label: 'Tất cả khoa' },
                  ...(institutions.find(i => i.name === compareUniv)?.departments || [])
                    .slice()
                    .sort((a, b) => a.localeCompare(b))
                    .map(d => ({ value: d, label: d })),
                ]}
                value={compareDept}
                onChange={setCompareDept}
                disabled={!compareUniv}
              />
            </div>
          </div>
          <div className="flex flex-col gap-sm max-h-72 overflow-y-auto dropdown-scrollbar scroll-smooth overscroll-contain pr-xs">
            {professors
              .filter(p =>
                p.id !== selectedProf.id &&
                (!compareSearch || p.name.toLowerCase().includes(compareSearch.toLowerCase())) &&
                (!compareUniv || p.university === compareUniv) &&
                (!compareDept || p.department === compareDept)
              )
              .map(p => {
                const s = calculateProfStats(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCompareProf(p)}
                    className="flex items-center justify-between gap-lg p-lg rounded-corner-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-md">
                      <Avatar type="initial" initials={p.name.split(' ').pop()?.charAt(0) || 'P'} size="small" shape="circle" />
                      <div>
                        <p className="text-label-sm text-text-primary">{p.name}</p>
                        <p className="text-video-title text-text-secondary">{p.department} • {p.university}</p>
                      </div>
                    </div>
                    <ScoreBadge value={s.avg_rating} />
                  </button>
                )
              })}
            {professors.filter(p =>
              p.id !== selectedProf.id &&
              (!compareSearch || p.name.toLowerCase().includes(compareSearch.toLowerCase())) &&
              (!compareUniv || p.university === compareUniv) &&
              (!compareDept || p.department === compareDept)
            ).length === 0 && (
              <p className="text-label-sm text-text-tertiary text-center p-xl">Không tìm thấy giảng viên</p>
            )}
          </div>
        </div>
      )}
    </LiquidModal>
  )
}
