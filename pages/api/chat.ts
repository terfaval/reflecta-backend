import type { NextApiRequest, NextApiResponse } from 'next'
import { buildSystemPrompt } from '@/lib/profileEngine'
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, profile, session_id, user_id } = req.body

  try {
    // 🔍 Ellenőrzés: van-e user_preferences rekord
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (!preferences) {
      return res.status(200).json({
        chat_state: 'intro_required',
        intro_questions: [
          {
            key: 'reply_length',
            question: 'Milyen típusú válaszok esnek jól neked?',
            options: ['rövid', 'hosszabb']
          },
          {
            key: 'symbolic_style',
            question: 'Mennyire legyen képes, képi a beszélgetésünk?',
            options: ['egyszerű', 'réteges', 'szimbolikus']
          },
          {
            key: 'guidance_preference',
            question: 'Szeretnéd, ha időnként új kérdésekbe is hívnálak?'
          },
          {
            key: 'sensitivity_boundary',
            question: 'Van most benned valami, amit nem szeretnél, hogy közel kerüljön?'
          },
          {
            key: 'inner_motivation',
            question: 'Mi az, amit most leginkább keresel?',
            options: ['megértés', 'irány', 'csend', 'visszhang']
          }
        ]
      })
    }

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

    const systemMessage = buildSystemPrompt(profileData)
    console.log('🧠 System message being sent:\n', systemMessage)

    // 🔹 Új vagy meglévő session
    let sessionId = session_id
    if (!sessionId) {
      const { data: sessionRow, error: sessionError } = await supabase
        .from('sessions')
        .insert([{ profile_id: profile.toLowerCase(), user_id }])
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

    res.status(200).json({ reply, session_id: sessionId, profile_meta: profileData })

  } catch (err) {
    console.error('❌ Hiba a chat.ts-ben:', err)
    res.status(500).json({ reply: 'Hiba történt a válasz generálása közben.' })
  }
}
