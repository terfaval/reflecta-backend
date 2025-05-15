
import { useEffect, useRef, useState } from 'react'
import ReflectaPreferencesBar from './ReflectaPreferencesBar'

type Props = {
  preselectedProfile?: string
}

type ChatMessage = {
  role: 'user' | 'ai'
  content: string
}

type IntroState = {
  key: string
  text: string
  options?: string[]
}

export default function ReflectaInterface({ preselectedProfile }: Props) {
  const [input, setInput] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)

  const [userId] = useState<string>('6ac6e5d0-7f73-42ff-a8fd-a23af43e790b')
  const [introMode, setIntroMode] = useState<boolean>(false)
  const [currentQuestion, setCurrentQuestion] = useState<IntroState | null>(null)
  const [userPreferences, setUserPreferences] = useState<Record<string, string>>({})

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const endOfChatRef = useRef<HTMLDivElement | null>(null)

  const fetchPreferences = async () => {
    const res = await fetch(`/api/preferences/get?user_id=${userId}`)
    const data = await res.json()
    if (data) setUserPreferences(data)
  }

  const updatePreference = async (key: string, value: string) => {
  setUserPreferences((prev) => ({ ...prev, [key]: value }))
  // ne frissítsük vissza az adatbázisból azonnal
  // await fetchPreferences()
}


  const sendIntroAnswer = async (answer: string) => {
    if (!currentQuestion) return

    await fetch('/api/preferences/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, key: currentQuestion.key, value: answer })
    })

    setChatHistory((prev) => [...prev, { role: 'user', content: answer }])
    setInput('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        profile,
        session_id: null,
        user_id: userId
      })
    })

    const data = await res.json()

    if (data.chat_state === 'intro_step' && data.current_question) {
      setCurrentQuestion(data.current_question)
      setChatHistory((prev) => [...prev, { role: 'ai', content: data.current_question.text }])
    } else if (data.session_id && data.reply) {
      setCurrentQuestion(null)
      setSessionId(data.session_id)
      setChatHistory((prev) => [...prev, { role: 'ai', content: data.reply }])
      setIntroMode(false)
      setInput('')
      await fetchPreferences()
    }
  }

  const sendMessage = async (message: string) => {
    setChatHistory((prev) => [...prev, { role: 'user', content: message }])
    setInput('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        profile,
        session_id: sessionId,
        user_id: userId,
        preferences: userPreferences
      })
    })

    const data = await res.json()

    setSessionId(data.session_id || sessionId)
    setChatHistory((prev) => [...prev, { role: 'ai', content: data.reply }])
    await fetchPreferences()
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    if (introMode && currentQuestion) {
      await sendIntroAnswer(trimmed)
    } else {
      await sendMessage(trimmed)
    }
  }

  useEffect(() => {
    if (!profile) return

    const init = async () => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '',
          profile,
          session_id: null,
          user_id: userId
        })
      })

      const data = await res.json()

      if (data.chat_state === 'intro_step' && data.current_question) {
        setIntroMode(true)
        setCurrentQuestion(data.current_question)
        setChatHistory([{ role: 'ai', content: data.current_question.text }])
      }

      await fetchPreferences()
    }

    init()
  }, [profile])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  return (
    <div className="reflecta-chat-container">
      {!profile && <p>Nem választottál profilt.</p>}

      {profile && (
        <>
          <ReflectaPreferencesBar
  preferences={userPreferences}
  onUpdate={updatePreference}
/>


          <div className="reflecta-chat-history">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`reflecta-chat-message ${msg.role}`}>
                <p>{msg.content}</p>
              </div>
            ))}
            <div ref={endOfChatRef} />
          </div>

          <div className="reflecta-chat-input">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder="Írd be a válaszod..."
              className="reflecta-textarea"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="reflecta-send-button"
            >
              Küldés
            </button>
          </div>
        </>
      )}
    </div>
  )
}
