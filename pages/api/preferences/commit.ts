// /pages/api/preferences/commit.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user_id, profile_id } = req.body

  if (!user_id || !profile_id) {
    return res.status(400).json({ error: 'Missing user_id or profile_id' })
  }

  // lekérjük a progress adatokat
  const { data: progress, error: progressError } = await supabase
    .from('user_preferences_progress')
    .select('*')
    .eq('user_id', user_id)
    .single()

  if (progressError || !progress) {
    return res.status(400).json({ error: 'Progress not found or error loading progress' })
  }

  // mezők validálása
  const requiredFields = ['reply_length', 'symbolic_style', 'guidance_preference']
  const isComplete = requiredFields.every(field => {
    const value = progress[field as keyof typeof progress]
    return value && value.trim() !== ''
  })

  if (!isComplete) {
    return res.status(400).json({ error: 'Progress incomplete – cannot commit preferences' })
  }

  // insert/update user_preferences
  await supabase
    .from('user_preferences')
    .upsert({
      user_id,
      reply_length: progress.reply_length,
      symbolic_style: progress.symbolic_style,
      guidance_preference: progress.guidance_preference,
      created_at: new Date().toISOString()
    })

  // kezdjük el a beszélgetést az intro után
  const { data: chat, error } = await supabase.functions.invoke('start_chat', {
    body: {
      user_id,
      profile_id
    }
  })

  if (error) {
    return res.status(500).json({ error: 'Failed to start chat' })
  }

  res.status(200).json(chat)
}
