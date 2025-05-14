import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ReflectaInterface from '../components/ReflectaInterface'

export default function ChatPage() {
  const router = useRouter()
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)

  useEffect(() => {
    const { profile } = router.query
    if (typeof profile === 'string') {
      setSelectedProfile(profile.toLowerCase())
    }
  }, [router.query])

  return (
    <div>
      {selectedProfile ? (
        <ReflectaInterface preselectedProfile={selectedProfile} />
      ) : (
        <p>Betöltés...</p>
      )}
    </div>
  )
}
