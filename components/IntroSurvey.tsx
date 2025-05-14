import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'

type Question = {
  key: string
  text: string
  options?: string[]
}

type Props = {
  questions: Question[]
  userId: string  // ideiglenes teszt user is lehet
  onComplete: () => void
}

export default function IntroSurvey({ questions, userId, onComplete }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const handleChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    const payload = {
      user_id: userId,
      ...answers
    }

    const { error } = await supabase.from('user_preferences').upsert(payload)
    if (!error) {
      onComplete()
    } else {
      alert('Hiba történt a mentés során.')
      console.error(error)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Induló kérdéssor</h2>
      {questions.map((q) => (
        <div key={q.key} style={{ marginBottom: '1.5rem' }}>
          <p><strong>{q.text}</strong></p>
          {q.options ? (
            q.options.map((opt) => (
              <label key={opt} style={{ display: 'block', margin: '4px 0' }}>
                <input
                  type="radio"
                  name={q.key}
                  value={opt}
                  checked={answers[q.key] === opt}
                  onChange={() => handleChange(q.key, opt)}
                /> {opt}
              </label>
            ))
          ) : (
            <input
              type="text"
              value={answers[q.key] || ''}
              onChange={(e) => handleChange(q.key, e.target.value)}
              style={{ width: '100%', padding: '4px' }}
            />
          )}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={Object.keys(answers).length < questions.length}
      >
        Küldés
      </button>
    </div>
  )
}
