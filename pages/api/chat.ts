import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, profile, session_id } = req.body

  try {
    // 🔎 Lekérjük a profil promptját
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('prompt_core')
      .ilike('name', profile)
      .single()

    if (profileError || !profileData?.prompt_core) {
      console.error('❌ Profil nem található vagy prompt_core hiányzik', profileError)
      return res.status(400).json({ reply: 'Hiba: a kiválasztott profil nem elérhető.' })
    }

    const systemMessage = profileData.prompt_core

    // 🔹 Session ID létrehozás vagy használat
    let sessionId = session_id

    if (!sessionId) {
      const { data: sessionRow, error: sessionError } = await supabase
        .from('sessions')
        .insert([{ profile_id: profile.toLowerCase() }])
        .select()
        .single()

      if (sessionError) throw sessionError
      sessionId = sessionRow.id
    }

    // 🔹 Felhasználói üzenet mentése
    const userMessageId = uuidv4()
    await supabase.from('messages').insert([
      {
        id: userMessageId,
        session_id: sessionId,
        role: 'user',
        content: message
      }
    ])

    // 🔹 GPT válasz generálása
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: message }
      ]
    })

    const reply = chat.choices[0].message.content

    // 🔹 Asszisztens válasz mentése
    const assistantMessageId = uuidv4()
    await supabase.from('messages').insert([
      {
        id: assistantMessageId,
        session_id: sessionId,
        role: 'assistant',
        content: reply
      }
    ])

    res.status(200).json({ reply, session_id: sessionId })
  } catch (err) {
    console.error('❌ Hiba a chat.ts-ben:', err)
    res.status(500).json({ reply: 'Hiba történt a válasz generálása közben.' })
  }
}
