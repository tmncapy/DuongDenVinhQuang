-- ============================================================================
-- SUPABASE DATABASE SETUP & RLS POLICIES FOR PROJECT: ĐƯỜNG ĐẾN VINH QUANG
-- URL: https://wmskoyiljrcamrawffoe.supabase.co
-- Hướng dẫn: Copy toàn bộ nội dung file này và dán vào SQL Editor trên Supabase Dashboard -> Bấm RUN.
-- ============================================================================

-- 1. TẠO BẢNG QUẢN LÝ PHÒNG THI (game_rooms)
CREATE TABLE IF NOT EXISTS public.game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT UNIQUE NOT NULL,
    auth_code TEXT NOT NULL DEFAULT '123456',
    active_round TEXT DEFAULT 'XUAT_PHAT',
    contestants JSONB DEFAULT '[
        {"id": 1, "name": "Thí sinh 1", "score": 0},
        {"id": 2, "name": "Thí sinh 2", "score": 0},
        {"id": 3, "name": "Thí sinh 3", "score": 0},
        {"id": 4, "name": "Thí sinh 4", "score": 0}
    ]'::jsonb,
    game_state JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TẠO BẢNG ĐỒNG BỘ SỰ KIỆN THỜI GIAN THỰC (game_actions)
CREATE TABLE IF NOT EXISTS public.game_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT NOT NULL,
    action_type TEXT NOT NULL,
    contestant_id INT,
    contestant_name TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TẠO BẢNG LƯU ĐÁP ÁN VÀ THỜI GIAN LÀM BÀI CỦA THÍ SINH (player_answers)
CREATE TABLE IF NOT EXISTS public.player_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT NOT NULL,
    contestant_id INT NOT NULL,
    contestant_name TEXT,
    round TEXT NOT NULL,
    question_index INT DEFAULT 1,
    answer TEXT,
    time_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TẠO BẢNG NGÂN HÀNG CÂU HỎI (questions)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT NOT NULL DEFAULT 'DDVQ2026',
    round TEXT NOT NULL,
    question_pack TEXT,
    question_index INT DEFAULT 1,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    extra_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CHỈ MỤC TRUY VẤN TỐC ĐỘ CAO (INDEXES)
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON public.game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_game_actions_room ON public.game_actions(room_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_answers_room ON public.player_answers(room_code, round);

-- 5. BẬT ROW LEVEL SECURITY (RLS) VÀ TẠO POLICIES
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Xóa bớt Policy cũ nếu có
DROP POLICY IF EXISTS "Public full access on game_rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Public full access on game_actions" ON public.game_actions;
DROP POLICY IF EXISTS "Public full access on player_answers" ON public.player_answers;
DROP POLICY IF EXISTS "Public full access on questions" ON public.questions;

-- Cấp quyền SELECT, INSERT, UPDATE, DELETE công khai cho Anon Key
CREATE POLICY "Public full access on game_rooms" ON public.game_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on game_actions" ON public.game_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on player_answers" ON public.player_answers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);

-- 6. BẬT SUPABASE REALTIME REPLICATION (Truyền tín hiệu thời gian thực cho Controller, Player, Host, Projector)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'game_actions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms, public.game_actions, public.player_answers, public.questions;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
