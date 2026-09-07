import React, { useState, type FormEvent } from 'react'
import { InputField, TextareaField } from '@figma/astraui'
import { Institution, Suggestion } from '../types'
import { VIETNAM_PROVINCES } from '../constants'
import {
  Button,
  ButtonGroup,
  Badge,
  SearchableDropdown,
} from '../components/ui/UIComponents'
import { supabase } from '../supabaseClient'

interface SuggestViewProps {
  institutions: Institution[]
  suggestions: Suggestion[]
  onSuggestionAdded: (newSuggestion: Suggestion) => void
  navigate: (view: string) => void
  showToast: (message: string, variant?: 'default' | 'success' | 'error') => void
}

export const SuggestView: React.FC<SuggestViewProps> = ({
  institutions,
  suggestions,
  onSuggestionAdded,
  navigate,
  showToast,
}) => {
  const [suggAuthorName, setSuggAuthorName] = useState('')
  const [suggestionType, setSuggestionType] = useState<'professor' | 'institution' | 'department'>('professor')
  const [suggProfName, setSuggProfName] = useState('')
  const [suggSelectedUniv, setSuggSelectedUniv] = useState('')
  const [suggSelectedDept, setSuggSelectedDept] = useState('')
  const [suggInstName, setSuggInstName] = useState('')
  const [suggInstShortName, setSuggInstShortName] = useState('')
  const [suggInstLocation, setSuggInstLocation] = useState('')
  const [suggInstDepts, setSuggInstDepts] = useState('')
  const [suggNewDeptName, setSuggNewDeptName] = useState('')
  const [suggestionContent, setSuggestionContent] = useState('')

  const univOptions = institutions
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(i => ({ value: i.name, label: `${i.short_name} - ${i.name}` }))
  
  const selectedUnivObj = institutions.find(i => i.name === suggSelectedUniv)
  
  const deptOptions = (selectedUnivObj?.departments || [])
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .map(d => ({ value: d, label: d }))
  
  const provinceOptions = VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const finalName = suggAuthorName.trim() || 'Ẩn danh'
    let newSugg: Partial<Suggestion> = { type: suggestionType, author_name: finalName, content: suggestionContent.trim(), status: 'Chờ xét duyệt' }

    if (suggestionType === 'professor') {
      if (!suggProfName.trim() || !suggSelectedUniv || !suggSelectedDept) {
        showToast('Vui lòng nhập đầy đủ thông tin', 'error')
        return
      }
      newSugg = { ...newSugg, targetName: suggProfName.trim(), university: suggSelectedUniv, department: suggSelectedDept }
    } else if (suggestionType === 'institution') {
      if (!suggInstName.trim() || !suggInstShortName.trim() || !suggInstLocation) {
        showToast('Vui lòng nhập đầy đủ thông tin', 'error')
        return
      }
      newSugg = { ...newSugg, targetName: suggInstName.trim(), short_name: suggInstShortName.trim(), location: suggInstLocation, departments: suggInstDepts ? suggInstDepts.split(',').map(d => d.trim()).filter(Boolean) : [] }
    } else {
      if (!suggSelectedUniv || !suggNewDeptName.trim()) {
        showToast('Vui lòng nhập đầy đủ thông tin', 'error')
        return
      }
      newSugg = { ...newSugg, targetName: suggNewDeptName.trim(), university: suggSelectedUniv, department: suggNewDeptName.trim() }
    }

    const { data, error } = await supabase.from('suggestions').insert([newSugg]).select() as any
    if (error) {
      showToast(error.message, 'error')
      return
    }
    if (data) {
      onSuggestionAdded(data[0] as Suggestion)
    }
    showToast('Đề xuất đã được gửi thành công!', 'success')
    setSuggAuthorName('')
    setSuggProfName('')
    setSuggInstName('')
    setSuggInstShortName('')
    setSuggInstLocation('')
    setSuggInstDepts('')
    setSuggNewDeptName('')
    setSuggestionContent('')
  }

  return (
    <div className="flex flex-col gap-2xl max-w-2xl mx-auto">
      <div className="flex flex-col gap-xs">
        <h1 className="text-title text-text-primary">Đề xuất thêm dữ liệu</h1>
        <p className="text-label-sm text-text-secondary">Gửi đề xuất thêm trường, khoa hoặc giảng viên mới vào hệ thống</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-xl">
        <div className="glass-panel rounded-3xl p-xl flex flex-col gap-lg">
          <InputField
            label="Tên hiển thị (Tùy chọn)"
            placeholder="VD: Nguyễn Văn A..."
            value={suggAuthorName}
            onChange={setSuggAuthorName}
          />
          
          <SearchableDropdown
            label="Loại đề xuất *"
            options={[
              { value: 'professor', label: 'Giảng viên mới' },
              { value: 'institution', label: 'Trường đại học mới' },
              { value: 'department', label: 'Khoa / Viện mới' },
            ]}
            value={suggestionType}
            onChange={v => setSuggestionType(v as any)}
            placeholder="-- Chọn loại đề xuất --"
          />

          {suggestionType === 'professor' && (
            <div className="flex flex-col gap-lg">
              <InputField label="Tên giảng viên *" placeholder="VD: PGS. TS Nguyễn Văn B" value={suggProfName} onChange={setSuggProfName} />
              <SearchableDropdown label="Trường đại học *" placeholder="-- Chọn trường --" options={univOptions} value={suggSelectedUniv} onChange={v => { setSuggSelectedUniv(v); setSuggSelectedDept('') }} />
              <SearchableDropdown label="Khoa / Viện *" placeholder={suggSelectedUniv ? '-- Chọn khoa --' : 'Chọn trường trước'} options={deptOptions} value={suggSelectedDept} onChange={setSuggSelectedDept} disabled={!suggSelectedUniv} />
            </div>
          )}

          {suggestionType === 'institution' && (
            <div className="flex flex-col gap-lg">
              <InputField label="Tên đầy đủ *" placeholder="VD: Trường Đại học Ngoại thương" value={suggInstName} onChange={setSuggInstName} />
              <InputField label="Tên viết tắt *" placeholder="VD: FTU" value={suggInstShortName} onChange={setSuggInstShortName} />
              <SearchableDropdown label="Tỉnh / Thành phố *" placeholder="-- Chọn tỉnh thành --" options={provinceOptions} value={suggInstLocation} onChange={setSuggInstLocation} />
              <InputField label="Danh sách khoa (phân cách bằng dấu phẩy)" placeholder="Khoa A, Khoa B..." value={suggInstDepts} onChange={setSuggInstDepts} />
            </div>
          )}

          {suggestionType === 'department' && (
            <div className="flex flex-col gap-lg">
              <SearchableDropdown label="Trường đại học *" placeholder="-- Chọn trường --" options={univOptions} value={suggSelectedUniv} onChange={setSuggSelectedUniv} />
              <InputField label="Tên Khoa / Viện mới *" placeholder="VD: Khoa Khởi nghiệp..." value={suggNewDeptName} onChange={setSuggNewDeptName} />
            </div>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-xl">
          <TextareaField
            label="Ghi chú thêm"
            placeholder="Cung cấp thêm thông tin xác thực..."
            rows={3}
            value={suggestionContent}
            onChange={setSuggestionContent}
          />
        </div>

        <ButtonGroup align="justify">
          <Button variant="neutral" onClick={() => navigate('home')}>Hủy</Button>
          <Button variant="primary" type="submit">Gửi đề xuất</Button>
        </ButtonGroup>
      </form>

      {suggestions.length > 0 && (
        <div className="glass-panel rounded-3xl p-xl flex flex-col gap-lg">
          <h2 className="text-heading text-text-primary">Đề xuất gần đây ({suggestions.length})</h2>
          {suggestions.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-lg border-b border-border-secondary last:border-0">
              <div className="flex flex-col gap-xs">
                <Badge label={s.type} variant="brand" />
                <p className="text-label text-text-primary">{s.targetName}</p>
                <p className="text-video-title text-text-secondary">{s.university && `${s.university}`}{s.department && ` • ${s.department}`}</p>
              </div>
              <Badge label={s.status} variant="warning" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
