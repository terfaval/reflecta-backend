/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import { reflectaPrompts } from '@/lib/profiles'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, profile } = req.body
  const systemMessage = profile && reflectaPrompts[profile]

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
        { role: 'user', content: message },
      ],
    })

    res.status(200).json({ reply: chat.choices[0].message.content })
  } catch (err) {
    console.error(err)
    res.status(500).json({ reply: 'Hiba történt a válasz generálása közben.' })
  }
}