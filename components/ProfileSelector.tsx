import { useState } from 'react'

export const profiles = [
  'Akasza',
  'Éana',
  'Zentó',
  'Sylva',
  'Luma',
  'Kairos',
  'Noe'
] as const

type Props = {
  onSelect: (key: typeof profiles[number]) => void
}

export default function ProfileSelector({ onSelect }: Props) {
  const [selected, setSelected] = useState<typeof profiles[number] | null>(null)

  return (
    <div>
      <p>Válassz egy Reflecta-profilt:</p>
      {profiles.map((name) => (
        <button
          key={name}
          onClick={() => {
            setSelected(name)
            onSelect(name)
          }}
          style={{
            margin: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: selected === name ? '#333' : '#eee',
            color: selected === name ? '#fff' : '#000',
            border: '1px solid #ccc',
            borderRadius: '5px',
          }}
        >
          {name}
        </button>
      ))}
    </div>
  )
}