import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

const ALLOWED_KEYS = [
  'reply_length',
  'symbolic_style',
  'guidance_preference',
  'sensitivity_boundary',
  'inner_motivation'
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user_id, key, value } = req.body

  if (!user_id || !key || typeof value !== 'string') {
    return res.status(400).json({ error: 'Hiányzik vagy hibás paraméter' })
  }

  if (!ALLOWED_KEYS.includes(key)) {
    return res.status(403).json({ error: 'Nem engedélyezett mező' })
  }

  try {
    // 1. Megnézzük, van-e már record
    const { data: existing } = await supabase
      .from('user_preferences_progress')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (existing) {
      // 2. Ha van, frissítjük az adott mezőt
      const { error } = await supabase
        .from('user_preferences_progress')
        .update({ [key]: value })
        .eq('user_id', user_id)

      if (error) throw error
    } else {
      // 3. Ha nincs, létrehozzuk
      const { error } = await supabase
        .from('user_preferences_progress')
        .insert({ user_id, [key]: value })

      if (error) throw error
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('❌ Hiba a preferences/progress.ts-ben:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
