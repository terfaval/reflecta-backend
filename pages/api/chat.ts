import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import { reflectaPrompts } from '@/lib/profiles'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, profile } = req.body
  const systemMessage = profile && reflectaPrompts[profile]

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        ...(systemMessage ? [{ role: 'system' as const, content: systemMessage }] : []),
        { role: 'user' as const, content: message }
      ]
    })

    const reply = chat.choices[0].message.content

    // 💾 Supabase mentés naplózással
    const { error } = await supabase.from('journal_entries').insert([
      {
        message,
        reply,
        profile
      }
    ])

    if (error) {
      console.error('❌ Supabase insert error:', error)
    } else {
      console.log('✅ Supabase insert OK')
    }

    res.status(200).json({ reply })
  } catch (err) {
    console.error(err)
    res.status(500).json({ reply: 'Hiba történt a válasz generálása közben.' })
  }
}
