-- ==============================================================================
-- SUPABASE BACKEND SETUP: LIKES / DISLIKES (HELPFUL / NOT HELPFUL)
-- ==============================================================================
-- Hướng dẫn:
-- 1. Mở Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Chọn dự án của bạn (hpvhzlsnhunqkooyvjac)
-- 3. Vào mục "SQL Editor" ở thanh điều hướng bên trái
-- 4. Bấm "New query", dán toàn bộ nội dung bên dưới và bấm "Run" (Ctrl+Enter)
-- ==============================================================================

-- BƯỚC 1: ĐẢM BẢO CỘT helpful VÀ not_helpful ĐÃ TỒN TẠI VÀ CÓ GIÁ TRỊ MẶC ĐỊNH LÀ 0
ALTER TABLE IF EXISTS public.institution_reviews 
  ADD COLUMN IF NOT EXISTS helpful INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS not_helpful INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.professor_reviews 
  ADD COLUMN IF NOT EXISTS helpful INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS not_helpful INTEGER DEFAULT 0;

-- Cập nhật các dòng NULL thành 0 nếu có
UPDATE public.institution_reviews SET helpful = 0 WHERE helpful IS NULL;
UPDATE public.institution_reviews SET not_helpful = 0 WHERE not_helpful IS NULL;
UPDATE public.professor_reviews SET helpful = 0 WHERE helpful IS NULL;
UPDATE public.professor_reviews SET not_helpful = 0 WHERE not_helpful IS NULL;


-- ==============================================================================
-- CÁCH 1: CHO PHÉP CẬP NHẬT TRỰC TIẾP QUA RLS (ROW LEVEL SECURITY)
-- ==============================================================================
-- Cho phép người dùng (cả khách ẩn danh anon và authenticated) cập nhật helpful/not_helpful

-- 1. Xóa policy cũ nếu đã tồn tại để tránh trùng lặp
DROP POLICY IF EXISTS "Allow anon update votes on institution_reviews" ON public.institution_reviews;
DROP POLICY IF EXISTS "Allow anon update votes on professor_reviews" ON public.professor_reviews;
DROP POLICY IF EXISTS "Enable update for votes on institution_reviews" ON public.institution_reviews;
DROP POLICY IF EXISTS "Enable update for votes on professor_reviews" ON public.professor_reviews;

-- 2. Tạo policy UPDATE cho institution_reviews
CREATE POLICY "Enable update for votes on institution_reviews"
ON public.institution_reviews
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Tạo policy UPDATE cho professor_reviews
CREATE POLICY "Enable update for votes on professor_reviews"
ON public.professor_reviews
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ==============================================================================
-- CÁCH 2: HÀM STORED PROCEDURE / RPC (KHUYẾN NGHỊ CAO CẤP & BẢO MẬT)
-- ==============================================================================
-- Hàm RPC chạy với quyền "SECURITY DEFINER", tự động vượt qua RLS một cách an toàn,
-- chỉ cho phép cập nhật 2 cột helpful và not_helpful mà không làm lộ các dữ liệu khác.

-- 1. Hàm vote cho Đánh giá Trường đại học (institution_reviews)
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

-- 2. Hàm vote cho Đánh giá Giảng viên (professor_reviews)
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

-- 3. Cấp quyền thực thi các hàm RPC cho anon và authenticated
GRANT EXECUTE ON FUNCTION public.vote_institution_review(UUID, INTEGER, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vote_professor_review(UUID, INTEGER, INTEGER) TO anon, authenticated, service_role;

-- ==============================================================================
-- HOÀN TẤT! SAU KHI CHẠY CODE TRÊN, TÍNH NĂNG LIKE/DISLIKE SẼ LƯU VÀO DATABASE NGAY.
-- ==============================================================================
