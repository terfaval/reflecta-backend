
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { generateSessionLabel } from '@/lib/session/sessionLabelGenerator'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { session_id, user_id, closed_by } = req.body
  if (!session_id || !user_id || !['user', 'profile'].includes(closed_by)) {
    return res.status(400).json({ error: 'Missing or invalid parameters.' })
  }

  try {
    const label = await generateSessionLabel(session_id)

    const { data, error } = await supabase
      .from('sessions')
      .update({
        ended_at: new Date().toISOString(),
        closed_by,
        label: label || null
      })
      .eq('id', session_id)
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) {
      console.error('❌ Session lezárási hiba:', error)
      return res.status(500).json({ error: 'Hiba a session lezárásakor.' })
    }

    res.status(200).json({ session: data })
  } catch (err) {
    console.error('❌ GPT címke generálási hiba:', err)
    res.status(500).json({ error: 'Hiba történt a címke generálása közben.' })
  }
}
