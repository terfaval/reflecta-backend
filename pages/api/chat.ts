import type { NextApiRequest, NextApiResponse } from 'next'
import { buildPrompt } from '@/utils/promptBuilder'
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, profile, session_id } = req.body

  try {
    // 🔎 Teljes profil betöltése
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', profile)
      .single()

    if (profileError || !profileData) {
      console.error('❌ Profil nem található:', profileError)
      return res.status(400).json({ reply: 'A kiválasztott profil nem elérhető.' })
    }

    const systemMessage = buildPrompt(profileData)


    // 🔹 Új vagy meglévő session
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

    // 🔹 User üzenet mentése
    await supabase.from('messages').insert([
      {
        id: uuidv4(),
        session_id: sessionId,
        role: 'user',
        content: message
      }
    ])

    // 🔹 Válasz generálása
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: message }
      ]
    })

    const reply = chat.choices[0].message.content

    // 🔹 Assistant válasz mentése
    await supabase.from('messages').insert([
      {
        id: uuidv4(),
        session_id: sessionId,
        role: 'assistant',
        content: reply
      }
    ])

    // 📤 Teljes profil objektumot is visszaadjuk, ha később kell frontendnek
    res.status(200).json({ reply, session_id: sessionId, profile_meta: profileData })

  } catch (err) {
    console.error('❌ Hiba a chat.ts-ben:', err)
    res.status(500).json({ reply: 'Hiba történt a válasz generálása közben.' })
  }
}
