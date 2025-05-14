
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

/**
 * Tematikus címke generálása egy adott session alapján
 * @param session_id az érintett session UUID-je
 */
export async function generateSessionLabel(session_id: string): Promise<string | null> {
  const { data: messages } = await supabase
    .from('messages')
    .select('content')
    .eq('session_id', session_id)
    .eq('role', 'user')
    .order('timestamp', { ascending: true })
    .limit(10)

  if (!messages || messages.length === 0) return null

  const combined = messages.map(m => m.content).join('\n')

  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'Adj egy rövid, kifejező címet ennek a beszélgetésrészletnek. A cím legyen személyes hangvételű, és tükrözze a fő témát. Max. 4 szó.'
      },
      {
        role: 'user',
        content: `Üzenetek:
${combined}

Mi legyen a cím?`
      }
    ]
  })

  const label = chat.choices[0].message.content?.trim()
  return label || null
}
