import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import { reflectaPrompts } from '@/lib/profiles'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, profile, session_id } = req.body
  const systemMessage = profile && reflectaPrompts[profile]

  try {
    let sessionId = session_id

    // 🔹 Ha nincs session_id, új session létrehozása
    if (!sessionId) {
      const { data, error } = await supabase.from('sessions').insert([
        { profile_id: profile }
      ]).select().single()

      if (error) throw error
      sessionId = data.id
    }

    // 🔹 Mentjük a kérdező üzenetét
    const userMessageId = uuidv4()
    await supabase.from('messages').insert([
      {
        id: userMessageId,
        session_id: sessionId,
        role: 'user',
        content: message
      }
    ])

    // 🔹 Generáljuk a választ
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        ...(systemMessage ? [{ role: 'system' as const, content: systemMessage }] : []),
        { role: 'user' as const, content: message }
      ]
    })

    const reply = chat.choices[0].message.content

    // 🔹 Mentjük a választ is
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
    res.status(500).json({ reply: 'Hiba történt a válasz generálásakor.' })
  }
}