"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { Loader2, Play, Pause, Download, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

interface PodcastGeneratorProps {
  analysisId: string
  onBack: () => void
}

export default function PodcastGenerator({ analysisId, onBack }: PodcastGeneratorProps) {
  const [language, setLanguage] = useState<string>("English")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [script, setScript] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      
      // Check if script already exists
      const scriptResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/podcast/${analysisId}`,
        {
          headers: {
            'Authorization': `Bearer ${getCookie('token')}`,
          }
        }
      )
      
      if (scriptResponse.ok) {
        // Script già esistente, lo carichiamo
        const data = await scriptResponse.json()
        setScript(data.script)
        setLanguage(data.language)
        // Facciamo finta che abbiamo generato anche l'audio
        setIsAudioReady(true)
        setIsGenerating(false)
        return
      }
      
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
      
      // Recuperiamo lo script
      const scriptRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/podcast/${analysisId}`,
        {
          headers: {
            'Authorization': `Bearer ${getCookie('token')}`,
          }
        }
      )
      
      if (scriptRes.ok) {
        const data = await scriptRes.json()
        setScript(data.script)
      }
      
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
      <div className="flex items-center mb-4">
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
      
      {!isAudioReady ? (
        <div className="flex flex-col items-center justify-center space-y-6 p-6">
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleziona la lingua
            </label>
            <Select
              value={language}
              onValueChange={setLanguage}
              disabled={isGenerating}
            >
              <SelectTrigger className="w-full">
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
            className="w-full max-w-md"
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
            <div className="text-sm text-gray-500 text-center mt-4">
              <p>Questo processo può richiedere alcuni minuti.</p>
              <p>Stiamo analizzando le recensioni e creando un podcast professionale.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Audio player */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <Button
                onClick={togglePlayPause}
                variant="outline"
                size="sm"
                className="w-10 h-10 rounded-full p-0 flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <div className="w-full mx-4">
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-blue-600 h-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="w-10 h-10 rounded-full p-0 flex items-center justify-center"
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
          </div>
          
          {/* Script */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-medium mb-4">Script del Podcast</h3>
                <div className="whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-200 text-sm">
                  {script}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
} 