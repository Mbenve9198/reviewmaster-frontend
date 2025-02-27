"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCookie } from "@/lib/utils"
import { Loader2, Download, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { AIVoiceInput } from "@/components/ui/ai-voice-input"

interface PodcastGeneratorProps {
  analysisId: string
  onBack: () => void
}

export default function PodcastGenerator({ analysisId, onBack }: PodcastGeneratorProps) {
  const [language, setLanguage] = useState<string>("English")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isCheckingExisting, setIsCheckingExisting] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // Controllo se esiste già un podcast per questa analisi all'avvio
  useEffect(() => {
    const checkExistingPodcast = async () => {
      try {
        setIsCheckingExisting(true)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/podcast/${analysisId}`,
          {
            headers: {
              'Authorization': `Bearer ${getCookie('token')}`,
            }
          }
        )
        
        if (response.ok) {
          // Podcast già esistente
          const data = await response.json()
          setLanguage(data.language)
          
          // Se abbiamo trovato un podcast esistente con audio
          if (data.hasAudio) {
            try {
              const audioResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/podcast/${analysisId}/audio`,
                {
                  headers: {
                    'Authorization': `Bearer ${getCookie('token')}`,
                  }
                }
              )
              
              if (audioResponse.ok) {
                const audioBlob = await audioResponse.blob()
                const url = URL.createObjectURL(audioBlob)
                setAudioUrl(url)
                setIsAudioReady(true)
              }
            } catch (audioError) {
              console.error('Error getting podcast audio:', audioError)
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing podcast:', error)
      } finally {
        setIsCheckingExisting(false)
      }
    }
    
    checkExistingPodcast()
  }, [analysisId])
  
  // Gestisce gli eventi dell'audio
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current

      const updateProgress = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100)
          setCurrentTime(Math.floor(audio.currentTime))
        }
      }
      
      const handleLoadedMetadata = () => {
        setDuration(Math.floor(audio.duration))
      }

      audio.addEventListener('timeupdate', updateProgress)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      
      return () => {
        audio.removeEventListener('timeupdate', updateProgress)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [isAudioReady, audioUrl])
  
  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      
      // Generiamo da zero
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/podcast/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getCookie('token')}`,
          },
          body: JSON.stringify({
            analysisId,
            language
          })
        }
      )
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      // Creiamo un URL blob dall'audio ricevuto
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      setAudioUrl(url)
      setIsAudioReady(true)
      
    } catch (error) {
      console.error('Error generating podcast:', error)
      alert('Failed to generate podcast. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }
  
  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `hotel-analysis-podcast-${Date.now()}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onBack} 
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </button>
        
        {isAudioReady && (
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        )}
      </div>
      
      {isCheckingExisting ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : !isAudioReady ? (
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-6 items-center">
              <h2 className="text-xl font-medium">Genera un Podcast</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Crea un podcast professionale basato sull'analisi dell'hotel. 
                Perfetto per condividere i risultati con il tuo team o ascoltare in movimento.
              </p>
              
              <div className="grid w-full max-w-md gap-2 mb-2">
                <label className="text-sm font-medium">
                  Seleziona la lingua
                </label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Italiano">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full max-w-md rounded-xl"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Podcast"
                )}
              </Button>
              
              {isGenerating && (
                <div className="text-sm text-muted-foreground text-center mt-4">
                  <p>This process may take a few minutes.</p>
                  <p>We're analyzing the reviews and creating a professional podcast.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col">
              {/* Audio player con AIVoiceInput */}
              <div className="rounded-xl bg-accent/20 p-6 mb-4">
                <AIVoiceInput 
                  demoMode={isPlaying}
                  onStart={() => {
                    if (audioRef.current) {
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  onStop={() => {
                    if (audioRef.current) {
                      audioRef.current.pause();
                      setIsPlaying(false);
                    }
                  }}
                />
                
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  className="hidden"
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Ascolta l'analisi del tuo hotel in formato podcast
                </p>
              </div>
              
              {/* Nota informativa */}
              <div className="text-center text-sm text-muted-foreground mt-2">
                <p>Il podcast è generato in base alla tua analisi e include consigli pratici da esperti del settore.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 