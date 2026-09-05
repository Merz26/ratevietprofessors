import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Database, ShieldCheck, Zap } from 'lucide-react';
import { LiquidModal } from './ui/UIComponents';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopied?: () => void;
}

export const SUPABASE_SQL_CODE = `-- ========================================================
-- CẤU HÌNH SUPABASE CHO LIKE / DISLIKE (HELPFUL/NOT HELPFUL)
-- ========================================================

-- 1. Đảm bảo 2 cột helpful & not_helpful tồn tại
ALTER TABLE IF EXISTS public.institution_reviews 
  ADD COLUMN IF NOT EXISTS helpful INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS not_helpful INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.professor_reviews 
  ADD COLUMN IF NOT EXISTS helpful INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS not_helpful INTEGER DEFAULT 0;

-- 2. Cấp quyền UPDATE qua RLS Policy cho người dùng
DROP POLICY IF EXISTS "Enable update for votes on institution_reviews" ON public.institution_reviews;
CREATE POLICY "Enable update for votes on institution_reviews"
ON public.institution_reviews
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for votes on professor_reviews" ON public.professor_reviews;
CREATE POLICY "Enable update for votes on professor_reviews"
ON public.professor_reviews
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Tạo hàm RPC (Stored Procedure) nguyên tử với quyền SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.vote_institution_review(
  p_id UUID,
  p_helpful INTEGER,
  p_not_helpful INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_row RECORD;
BEGIN
  UPDATE public.institution_reviews
  SET 
    helpful = GREATEST(0, p_helpful),
    not_helpful = GREATEST(0, p_not_helpful)
  WHERE id = p_id
  RETURNING id, helpful, not_helpful INTO v_updated_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Review not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_updated_row.id,
    'helpful', v_updated_row.helpful,
    'not_helpful', v_updated_row.not_helpful
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.vote_professor_review(
  p_id UUID,
  p_helpful INTEGER,
  p_not_helpful INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_row RECORD;
BEGIN
  UPDATE public.professor_reviews
  SET 
    helpful = GREATEST(0, p_helpful),
    not_helpful = GREATEST(0, p_not_helpful)
  WHERE id = p_id
  RETURNING id, helpful, not_helpful INTO v_updated_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Review not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_updated_row.id,
    'helpful', v_updated_row.helpful,
    'not_helpful', v_updated_row.not_helpful
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.vote_institution_review(UUID, INTEGER, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vote_professor_review(UUID, INTEGER, INTEGER) TO anon, authenticated, service_role;
`;

export function SupabaseSetupModal({ isOpen, onClose, onCopied }: SupabaseSetupModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_CODE);
      setCopied(true);
      if (onCopied) onCopied();
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy SQL', err);
    }
  };

  return (
    <LiquidModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu hình Supabase Backend cho Like / Dislike"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4 text-text-primary">
        <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-start gap-3">
          <Database className="text-brand-primary shrink-0 mt-0.5" size={20} />
          <div className="text-xs sm:text-sm leading-relaxed text-text-secondary">
            <p className="font-semibold text-text-primary mb-1">Tại sao cần bước này?</p>
            Mặc định Supabase kích hoạt bảo mật <strong>Row Level Security (RLS)</strong> cho bảng đánh giá. Để lưu số lượt like / dislike (helpful / not helpful) vào cơ sở dữ liệu, backend cần một <strong>Policy UPDATE</strong> hoặc <strong>hàm RPC</strong>.
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" />
              Mã SQL cài đặt 1-Click
            </span>
            <div className="flex items-center gap-2">
              <a
                href="https://supabase.com/dashboard/project/hpvhzlsnhunqkooyvjac/sql/new"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline font-medium"
              >
                Mở Supabase SQL Editor <ExternalLink size={12} />
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-brand-primary text-white hover:bg-brand-primary/90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Đã sao chép!' : 'Sao chép SQL'}
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl bg-black/85 dark:bg-black/95 text-gray-100 p-4 font-mono text-xs overflow-x-auto max-h-64 border border-white/10 dropdown-scrollbar">
            <pre className="whitespace-pre">{SUPABASE_SQL_CODE}</pre>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 text-xs text-text-secondary flex items-start gap-2.5">
          <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={18} />
          <div>
            <strong>3 bước thực hiện:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1 text-text-tertiary">
              <li>Sao chép đoạn mã SQL bên trên</li>
              <li>Mở mục <strong>SQL Editor</strong> trên Supabase Dashboard</li>
              <li>Dán vào và bấm nút <strong>Run</strong></li>
            </ol>
          </div>
        </div>
      </div>
    </LiquidModal>
  );
}
