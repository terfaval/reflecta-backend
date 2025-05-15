
import React from 'react'

type Props = {
  preferences: Record<string, string>
  onUpdate: (key: string, value: string) => void
}

const preferenceOptions = {
  reply_length: [
    { value: 'rövid', label: '✏️', title: 'Rövid válaszok' },
    { value: 'közepes', label: '📄', title: 'Közepes válaszok' },
    { value: 'hosszabb', label: '📝', title: 'Hosszabb válaszok' }
  ],
  symbolic_style: [
    { value: 'egyszerű', label: '🌱', title: 'Egyszerű nyelvezet' },
    { value: 'réteges', label: '🌿', title: 'Réteges gondolatok' },
    { value: 'szimbolikus', label: '🌌', title: 'Szimbolikus stílus' }
  ],
  guidance_preference: [
    { value: 'szabadon', label: '🌊', title: 'Szabad haladás' },
    { value: 'irányítva', label: '🧭', title: 'Irányított kérdések' }
  ]
}

const ReflectaPreferencesBar = ({ userId, preferences, onUpdate }: Props) => {
  return (
    <div className="reflecta-preference-icons">
      {Object.entries(preferenceOptions).map(([key, options]) => (
        <div key={key} className="icon-group">
          {options.map((opt) => {
            const active = preferences[key] === opt.value
            return (
              <button
                key={opt.value}
                className={`pref-icon ${active ? 'active' : ''}`}
                onClick={() => onUpdate(key, opt.value)}
                title={opt.title}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      ))}
      <style jsx>{`
        .reflecta-preference-icons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 1rem;
          padding: 0.5rem 0;
        }
        .icon-group {
          display: flex;
          gap: 0.4rem;
        }
        .pref-icon {
          font-size: 1.5rem;
          padding: 0.5rem;
          border: none;
          border-radius: 999px;
          background-color: #f0f0f0;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pref-icon:hover {
          background-color: #e0e0e0;
        }
        .pref-icon.active {
          background-color: #d0d0ff;
          font-weight: bold;
          box-shadow: 0 0 0 2px #8884ff;
        }
      `}</style>
    </div>
  )
}

export default ReflectaPreferencesBar
