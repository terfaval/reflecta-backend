
import type { NextApiRequest, NextApiResponse } from 'next'
import { buildSystemPrompt } from '@/lib/profileEngine'
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

const introSteps = [
  {
    key: 'reply_length',
    text: 'Mielőtt elkezdenénk a folyamatot, szeretném jobban megérteni, hogy milyen stílusra van igényed. Milyen típusú válaszok esnek jól neked? Inkább hosszabb kifejtéseket vagy tömörebb fogalmazást szeretnél?'
  },
  {
    key: 'symbolic_style',
    text: 'Mennyire legyen képes, képi a beszélgetésünk? Jobban szereted az egyszerű megfogalmazást, vagy jöhetnek mélyebb rétegek, szimbólumok is?'
  },
  {
    key: 'guidance_preference',
    text: 'Szeretnéd, hogy időnként én vezessem tovább a beszélgetést, vagy inkább csak akkor haladjunk, ha te jelzed?'
  },
  {
    key: 'sensitivity_boundary',
    text: 'Van most benned valami, amit nem szeretnél, hogy közel kerüljön? Lehet ez például munka, család vagy más érzékenyebb téma.'
  },
  {
    key: 'inner_motivation',
    text: 'Mi az, amit most leginkább keresel ebben a beszélgetésben?'
  }
]

const introWelcomeMessage = 'Köszönöm, hogy megosztottad, ami számodra fontos. Most már igazán figyelni tudok rád. Hol kezdjük?'
const SESSION_TIMEOUT_MINUTES = 60

async function shouldStartNewSession(user_id: string, profile_id: string, message: string) {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, started_at')
    .eq('user_id', user_id)
    .eq('profile_id', profile_id)
    .order('started_at', { ascending: false })
    .limit(1)

  if (!sessions || sessions.length === 0) return true

  const lastSession = sessions[0]
  const { data: lastMessage } = await supabase
    .from('messages')
    .select('content, timestamp')
    .eq('session_id', lastSession.id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (!lastMessage) return true

  const lastTime = new Date(lastMessage.timestamp).getTime()
  const now = Date.now()
  const minutesElapsed = (now - lastTime) / 60000
  if (minutesElapsed > SESSION_TIMEOUT_MINUTES) return true

  const topicCheck = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Detect if the user is starting a new topic compared to the previous message. Reply yes or no.' },
      { role: 'user', content: `Previous: "${lastMessage.content}"
Now: "${message}"
Is this a new topic?` }
    ]
  })

  const verdict = topicCheck.choices[0].message.content?.toLowerCase().trim()
  return verdict === 'yes'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, profile, session_id, user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'user_id missing' })

  try {
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (!preferences) {
      const { data: existingAnswers } = await supabase
        .from('user_preferences_progress')
        .select('*')
        .eq('user_id', user_id)
        .single()

      const progress = {
        user_id,
        step: existingAnswers?.step ?? 0,
        ...existingAnswers
      }

      if (message?.trim() && progress.step > 0) {
        const prevQuestion = introSteps[progress.step - 1]
        progress[prevQuestion.key] = message.trim()
      }

      if (progress.step < introSteps.length) {
        const current = introSteps[progress.step]
        await supabase
          .from('user_preferences_progress')
          .upsert({ ...progress, step: progress.step + 1 })

        return res.status(200).json({
          chat_state: 'intro_step',
          current_question: {
            key: current.key,
            text: current.text
          }
        })
      }

      const finalPrefs = introSteps.reduce((acc, q) => {
        acc[q.key] = progress[q.key] || ''
        return acc
      }, {} as Record<string, string>)

      await supabase
        .from('user_preferences')
        .upsert({ user_id, ...finalPrefs })

      await supabase
        .from('user_preferences_progress')
        .delete()
        .eq('user_id', user_id)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', profile)
        .single()

      const { data: sessionRow } = await supabase
        .from('sessions')
        .insert([{ profile_id: profileData.name.toLowerCase(), user_id }])
        .select()
        .single()

      await supabase.from('messages').insert([
        {
          id: uuidv4(),
          session_id: sessionRow.id,
          role: 'assistant',
          content: introWelcomeMessage
        }
      ])

      return res.status(200).json({
        reply: introWelcomeMessage,
        session_id: sessionRow.id,
        profile_meta: profileData
      })
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', profile)
      .single()

    const profile_id = profileData.name.toLowerCase()

    let sessionId = session_id
    if (!sessionId) {
      const isNew = await shouldStartNewSession(user_id, profile_id, message)
      if (isNew) {
        const { data: sessionRow } = await supabase
          .from('sessions')
          .insert([{ profile_id, user_id }])
          .select()
          .single()
        sessionId = sessionRow.id
      } else {
        const { data: lastSession } = await supabase
          .from('sessions')
          .select('id')
          .eq('user_id', user_id)
          .eq('profile_id', profile_id)
          .order('started_at', { ascending: false })
          .limit(1)
          .single()
        sessionId = lastSession.id
      }
    }

    if (message?.trim()) {
      await supabase.from('messages').insert([
        {
          id: uuidv4(),
          session_id: sessionId,
          role: 'user',
          content: message
        }
      ])
    }

    const systemMessage = buildSystemPrompt(profileData, preferences || basePrefs)

    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: message }
      ]
    })

    const reply = chat.choices[0].message.content

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
