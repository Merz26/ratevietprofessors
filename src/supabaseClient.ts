import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// ─── Real Supabase client (used when env vars are present) ─────────────────
const realClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ─── localStorage mock (fallback for local dev without env vars) ────────────
const mockTable = (tableName: string) => {
  const stored = () => {
    try {
      return JSON.parse(localStorage.getItem(`mock_${tableName}`) || '[]')
    } catch {
      return []
    }
  }

  return {
    select: (_cols = '*') => ({
      then: (resolve: (v: any) => void) =>
        resolve({ data: stored(), error: null }),
    }),
    insert: (rows: any[]) => ({
      select: () =>
        Promise.resolve({
          data: rows.map((r, i) => ({
            ...r,
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + i),
            created_at: new Date().toISOString(),
          })),
          error: null,
        }),
    }),
  }
}

const mockAuth = {
  getSession: () =>
    Promise.resolve({ data: { session: null }, error: null }),
  onAuthStateChange: (_cb: any) => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
    const user = users.find((u: any) => u.email === email && u.password === password)
    if (!user) {
      return { data: null, error: { message: 'Email hoặc mật khẩu không đúng' } }
    }
    const sessionUser = { email: user.email, user_metadata: { full_name: user.name } }
    localStorage.setItem('mock_session', JSON.stringify(sessionUser))
    return { data: { user: sessionUser }, error: null }
  },
  signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
    if (users.find((u: any) => u.email === email)) {
      return { data: null, error: { message: 'Email này đã được đăng ký' } }
    }
    const newUser = { email, password, name: options?.data?.full_name || email.split('@')[0] }
    users.push(newUser)
    localStorage.setItem('mock_users', JSON.stringify(users))
    const sessionUser = { email, user_metadata: { full_name: newUser.name } }
    localStorage.setItem('mock_session', JSON.stringify(sessionUser))
    return { data: { user: sessionUser }, error: null }
  },
  signOut: async () => {
    localStorage.removeItem('mock_session')
    return { error: null }
  },
  resetPasswordForEmail: async (email: string, opts?: { redirectTo?: string }) => {
    void opts
    // Mock: just log — real Supabase sends the actual email
    console.info('[mock] password reset requested for', email)
    return { data: {}, error: null }
  },
  updateUser: async ({ password }: { password: string }) => {
    // Mock: update stored password for the current session user
    try {
      const raw = localStorage.getItem('mock_session')
      if (raw) {
        const session = JSON.parse(raw)
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
        const idx = users.findIndex((u: any) => u.email === session.email)
        if (idx !== -1) { users[idx].password = password; localStorage.setItem('mock_users', JSON.stringify(users)) }
      }
    } catch { /* ignore */ }
    return { data: {}, error: null }
  },
}

// ─── Exported client ────────────────────────────────────────────────────────
export const supabase = realClient ?? {
  from: (table: string) => mockTable(table),
  auth: mockAuth,
}

export const isRealSupabase = !!realClient
