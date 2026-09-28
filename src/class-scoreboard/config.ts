export const supabaseUrl =
  (
    import.meta.env.PUBLIC_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL
  )?.trim() ?? ''
export const supabaseKey =
  (
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  )?.trim() ?? ''

export const isClassScoreboardConfigured = Boolean(supabaseUrl && supabaseKey)
