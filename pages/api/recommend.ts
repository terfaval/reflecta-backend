import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { profile, trigger, type, can_lead } = req.body

  if (!profile) {
    return res.status(400).json({ error: 'A profile mező kötelező.' })
  }

  let query = supabase.from('recommendations').select('*').eq('profile', profile)

  if (trigger) query = query.eq('trigger', trigger)
  if (type) query = query.eq('type', type)
  if (can_lead !== undefined) query = query.eq('can_lead', can_lead)

  const { data, error } = await query

  if (error) {
    console.error('❌ Ajánlás lekérdezési hiba:', error)
    return res.status(500).json({ error: 'Nem sikerült ajánlásokat lekérni.' })
  }

  res.status(200).json({ recommendations: data })
}
