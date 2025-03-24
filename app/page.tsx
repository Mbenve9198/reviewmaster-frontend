"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Reindirizza alla nuova homepage del sito senza parentesi nel percorso
    router.push('/site')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Reindirizzamento in corso...</h1>
        <p>Verrai reindirizzato automaticamente.</p>
      </div>
    </div>
  )
}

