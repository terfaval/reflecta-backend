import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

const ALLOWED_KEYS = ['reply_length', 'symbolic_style', 'guidance_preference']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user_id, key, value } = req.body

  if (!user_id || !key || typeof value !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid parameters' })
  }

  if (!ALLOWED_KEYS.includes(key)) {
    return res.status(403).json({ error: 'This preference is not editable' })
  }

  try {
    const { error } = await supabase
      .from('user_preferences')
      .update({ [key]: value })
      .eq('user_id', user_id)

    if (error) throw error

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('❌ Preferences update error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
