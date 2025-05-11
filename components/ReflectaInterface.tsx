import { useState } from 'react'
import ProfileSelector, { profiles } from './ProfileSelector'

export default function ReflectaInterface() {
  const [input, setInput] = useState('')
  const [reply, setReply] = useState('')
  const [profile, setProfile] = useState<(typeof profiles)[number] | null>(null)

  const handleSubmit = async () => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, profile }),
    })
    const data = await res.json()
    setReply(data.reply)
  }

  return (
    <div style={{ padding: 20 }}>
      <ProfileSelector onSelect={setProfile} />
      <br />
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        cols={50}
        placeholder="Írd ide a gondolataid..."
      />
      <br />
      <button onClick={handleSubmit} disabled={!profile}>
        Küldés
      </button>
      <p><strong>Reflecta válasza:</strong></p>
      <div>{reply}</div>
    </div>
  )
}