"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCookie } from "@/lib/utils"
import { Loader2, Play, Pause, Download, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

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
  
  // Controllo se esiste già un podcast per questa analisi all'avvio
  useEffect(() => {
    const checkExistingPodcast = async () => {
      try {
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
          
          // Scarichiamo l'audio
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
        }
      } catch (error) {
        console.error('Error checking existing podcast:', error)
      } finally {
        setIsCheckingExisting(false)
      }
    }
    
    checkExistingPodcast()
  }, [analysisId])
  
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
      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      setIsAudioReady(true)
      
    } catch (error) {
      console.error('Error generating podcast:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  const togglePlayPause = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    
    setIsPlaying(!isPlaying)
  }
  
  const handleDownload = () => {
    if (!audioUrl) return
    
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `hotel-analysis-podcast-${Date.now()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  useEffect(() => {
    // Cleanup function per rilasciare l'URL del blob quando il componente viene smontato
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])
  
  // Gestione dell'aggiornamento del progresso
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    const updateProgress = () => {
      const progress = (audio.currentTime / audio.duration) * 100
      setProgress(progress)
    }
    
    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('ended', () => setIsPlaying(false))
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('ended', () => setIsPlaying(false))
    }
  }, [isAudioReady])
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Indietro
        </Button>
        <h2 className="font-semibold text-lg">Hotel Analysis Podcast</h2>
      </div>
      
      {isCheckingExisting ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !isAudioReady ? (
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-full max-w-md">
                <label className="block text-sm font-medium mb-2">
                  Seleziona la lingua
                </label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Seleziona lingua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Italiano">Italiano</SelectItem>
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
                    Generazione in corso...
                  </>
                ) : (
                  "Genera Podcast"
                )}
              </Button>
              
              {isGenerating && (
                <div className="text-sm text-muted-foreground text-center mt-4">
                  <p>Questo processo può richiedere alcuni minuti.</p>
                  <p>Stiamo analizzando le recensioni e creando un podcast professionale.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col">
              {/* Audio player */}
              <div className="rounded-xl bg-accent/20 p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    onClick={togglePlayPause}
                    variant="secondary"
                    size="icon"
                    className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-1" />
                    )}
                  </Button>
                  
                  <div className="w-full mx-6">
                    <div className="w-full bg-background h-3 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-primary h-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 rounded-full"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  className="hidden"
                  onEnded={() => setIsPlaying(false)}
                />
                
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Ascolta l'analisi del tuo hotel in formato podcast
                </p>
              </div>
              
              {/* Nota informativa */}
              <div className="text-center text-sm text-muted-foreground mt-2">
                <p>Il podcast è generato in base alla tua analisi e include consigli pratici basati su esperti del settore.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 