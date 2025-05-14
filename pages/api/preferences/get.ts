import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

const ALLOWED_KEYS = ['reply_length', 'symbolic_style', 'guidance_preference']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { user_id } = req.query

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid user_id' })
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select(ALLOWED_KEYS.join(','))
      .eq('user_id', user_id)
      .single()

    if (error) {
      console.warn('⚠️ Nincs preferencia rekord:', error.message)
      return res.status(200).json({})
    }

    return res.status(200).json(data)
  } catch (err) {
    console.error('❌ Preferences lekérés hiba:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
