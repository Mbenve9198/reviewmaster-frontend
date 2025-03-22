"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, MessageSquare, Zap, Loader2, AlertCircle, Clock, Edit, Download, Plus, Wallet } from 'lucide-react'
import Image from "next/image"
import { SetupAssistantModal } from "@/components/whatsapp-assistant/setup-assistant-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCookie } from "@/lib/utils"
import { toast } from "sonner"
import { EditTimeSettingsModal } from "@/components/whatsapp-assistant/edit-time-settings-modal"
import { EditReviewSettingsModal } from "@/components/whatsapp-assistant/edit-review-settings-modal"
import { EditIdentitySettingsModal } from "@/components/whatsapp-assistant/edit-identity-settings-modal"
import { EditCreditSettingsModal } from "@/components/whatsapp-assistant/edit-credit-settings-modal"
import { QRCodeSVG } from 'qrcode.react'
import { WhatsAppRuleModal } from "@/components/whatsapp-assistant/whatsapp-rule-modal"
import { Switch } from "@/components/ui/switch"
import { WhatsAppRule, WhatsAppConfig } from "@/types/whatsapp"

interface Hotel {
  _id: string;
  name: string;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+393517279170'

export default function WhatsAppAssistantPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string>('')
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTimeSettingsModalOpen, setIsTimeSettingsModalOpen] = useState(false)
  const [isReviewSettingsModalOpen, setIsReviewSettingsModalOpen] = useState(false)
  const [isIdentitySettingsModalOpen, setIsIdentitySettingsModalOpen] = useState(false)
  const [isCreditSettingsModalOpen, setIsCreditSettingsModalOpen] = useState(false)
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<WhatsAppRule | null>(null)
  const [rules, setRules] = useState<WhatsAppRule[]>([])
  const [userCreditSettings, setUserCreditSettings] = useState({
    minimumThreshold: 50,
    topUpAmount: 200,
    autoTopUp: false
  })
  
  // Funzione per verificare la validità del token
  const verifyToken = () => {
    const token = getCookie('token');
    if (!token) {
      toast.error('Sessione scaduta. Effettua nuovamente il login.');
      setTimeout(() => {
        window.location.href = '/login?expired=true';
      }, 2000);
      return false;
    }
    return true;
  }

  // Fetch hotels
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const token = getCookie('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch hotels');
        
        const data = await response.json();
        setHotels(data);
        
        const savedHotelId = localStorage.getItem('selectedHotel');
        if (savedHotelId && data.find((h: Hotel) => h._id === savedHotelId)) {
          setSelectedHotelId(savedHotelId);
        } else if (data.length > 0) {
          setSelectedHotelId(data[0]._id);
          localStorage.setItem('selectedHotel', data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setError('Failed to load hotels');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
    fetchUserCreditSettings();
  }, []);

  // Fetch WhatsApp config when hotel is selected
  useEffect(() => {
    const fetchConfig = async () => {
      if (!selectedHotelId) return;
      
      try {
        const token = getCookie('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${selectedHotelId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch WhatsApp configuration');
        
        const data = await response.json();
        setConfig(data);
        setRules(data.rules || []);
      } catch (error) {
        console.error('Error fetching WhatsApp config:', error);
        setConfig(null);
        setRules([]);
      }
    };

    fetchConfig();
  }, [selectedHotelId]);

  // Funzione per recuperare le impostazioni di credito dell'utente
  const fetchUserCreditSettings = async () => {
    try {
      const token = getCookie('token')
      if (!token) {
        console.error('Token mancante, impossibile recuperare le impostazioni di credito')
        return
      }
      
      console.log('Richiedo impostazioni credito utente');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Status risposta crediti:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore dal server (crediti):', errorText);
        throw new Error(`Errore durante il recupero delle impostazioni di credito: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json()
      console.log('Dati credito ricevuti:', data);
      
      if (data.creditSettings) {
        setUserCreditSettings({
          minimumThreshold: data.creditSettings.minimumThreshold || 50,
          topUpAmount: data.creditSettings.topUpAmount || 200,
          autoTopUp: data.creditSettings.autoTopUp || false
        })
      }
    } catch (error) {
      console.error('Errore durante il recupero delle impostazioni di credito:', error)
      toast.error(`Errore durante il recupero dei crediti: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    }
  }

  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    localStorage.setItem('selectedHotel', hotelId);
  };

  const handleSuccess = async () => {
    try {
      // Verifica token prima di procedere
      if (!verifyToken()) return;
      
      // Carica la configurazione aggiornata dell'assistente
      if (selectedHotelId) {
        const token = getCookie('token');
        console.log('Richiedo configurazione aggiornata:', selectedHotelId);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${selectedHotelId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        console.log('Status risposta:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Errore dal server:', errorText);
          throw new Error(`Errore durante il recupero della configurazione: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Configurazione ricevuta:', data);
        
        setConfig(data);
        setRules(data.rules || []);
      }
      
      // Ricarica le impostazioni credito utente da server
      await fetchUserCreditSettings();
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della configurazione:', error);
      toast.error(`Errore durante l'aggiornamento: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.download = 'whatsapp-qr.png'
      a.href = url
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleEditRule = (rule: WhatsAppRule) => {
    setSelectedRule(rule);
    setIsRulesModalOpen(true);
  };

  const handleRuleSuccess = async (ruleData: WhatsAppRule) => {
    try {
      // Verifica token prima di procedere
      if (!verifyToken()) return;
      
      // Assicuro che ci sia il campo question richiesto dal backend
      if (!ruleData.question) {
        ruleData.question = ruleData.isCustom ? ruleData.customTopic! : ruleData.topic;
      }
      
      const token = getCookie('token');
      const url = selectedRule 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${selectedHotelId}/rules/${selectedRule._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${selectedHotelId}/rules`;
      
      console.log('Invio richiesta di salvataggio regola:', {
        url,
        method: selectedRule ? 'PUT' : 'POST', 
        ruleData
      });
      
      const response = await fetch(url, {
        method: selectedRule ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ruleData)
      });

      console.log('Status risposta:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore dal server:', errorText);
        throw new Error(`Errore durante il salvataggio della regola: ${response.status} ${response.statusText}`);
      }

      const savedRule = await response.json();
      console.log('Regola salvata:', savedRule);

      if (selectedRule) {
        // Aggiorna la regola esistente
        setRules(prevRules => 
          prevRules.map(rule => 
            rule._id === selectedRule._id ? savedRule : rule
          )
        );
        toast.success('Regola aggiornata con successo');
      } else {
        // Aggiungi nuova regola
        setRules(prevRules => [...prevRules, savedRule]);
        toast.success('Regola creata con successo');
      }

      setIsRulesModalOpen(false);
      setSelectedRule(null);
    } catch (error) {
      console.error('Errore durante il salvataggio della regola:', error);
      toast.error(`Errore durante il salvataggio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  };

  const handleCloseModal = () => {
    setIsRulesModalOpen(false);
    setSelectedRule(null);
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      // Verifica token prima di procedere
      if (!verifyToken()) return;
      
      // Trova la regola corrente per ottenere i dati necessari
      const currentRule = rules.find(rule => rule._id === ruleId);
      if (!currentRule) {
        throw new Error('Regola non trovata');
      }
      
      const token = getCookie('token');
      
      console.log('Invio richiesta di toggle regola:', {
        url: `${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${selectedHotelId}/rules/${ruleId}`,
        method: 'PUT',
        isActive
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${selectedHotelId}/rules/${ruleId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            isActive,
            question: currentRule.question || (currentRule.isCustom ? currentRule.customTopic : currentRule.topic)
          })
        }
      );

      console.log('Status risposta:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore dal server:', errorText);
        throw new Error(`Errore durante l'aggiornamento della regola: ${response.status} ${response.statusText}`);
      }

      const updatedRule = await response.json();
      console.log('Regola aggiornata:', updatedRule);

      setRules(prevRules =>
        prevRules.map(rule =>
          rule._id === ruleId ? updatedRule : rule
        )
      );

      toast.success(`Regola ${isActive ? 'attivata' : 'disattivata'} con successo`);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della regola:', error);
      toast.error(`Errore durante l'aggiornamento: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500 gap-2">
        <AlertCircle className="h-5 w-5" />
        {error}
      </div>
    );
  }

  // Se non c'è configurazione, mostra la pagina iniziale
  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center px-6">
        <div className="max-w-3xl w-full pt-16 pb-16">
          <div className="mb-8 max-w-xs mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleziona hotel
            </label>
            <Select value={selectedHotelId} onValueChange={handleHotelChange}>
              <SelectTrigger className="h-12 rounded-xl bg-white/50 border-gray-200 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map(hotel => (
                  <SelectItem key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-center space-y-8 mb-12">
            <h1 className="text-4xl font-bold text-gray-800">
              Your AI WhatsApp Concierge
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Transform your guest communication with an intelligent WhatsApp assistant that handles inquiries 24/7, speaks multiple languages, and delivers personalized responses.
            </p>
            <div className="relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Progetto%20senza%20titolo%20(14)-nQVrvC4MOc1FApRbTnUONYa8vcVqPT.png"
                alt="WhatsApp Assistant"
                width={180}
                height={180}
                className="mx-auto animate-pulse-subtle"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <MessageSquare className="w-8 h-8 text-blue-500" />,
                title: "Smart Communication",
                description: "Automatically detects guest language based on country code and provides instant, contextual responses tailored to your hotel's services"
              },
              {
                icon: <Sparkles className="w-8 h-8 text-purple-500" />,
                title: "Customizable Intelligence",
                description: "Create custom rules to enhance AI responses with specific details about your property, local attractions, and special offerings"
              },
              {
                icon: <Zap className="w-8 h-8 text-yellow-500" />,
                title: "Automated Follow-ups",
                description: "Schedule review requests, manage time zones, and handle operational tasks like sharing menus or booking information"
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center space-y-4">
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-12 text-xl rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af] hover:scale-105"
            >
              Create Your AI Assistant
            </Button>
            <p className="text-sm text-gray-500">
              Set up your personalized WhatsApp concierge in minutes
            </p>
          </div>
        </div>

        <SetupAssistantModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  // Se c'è configurazione, mostra la nuova UI
  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
            <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
              WhatsApp Assistant
            </h1>
          </div>
          <p className="text-base text-gray-500">
            Manage your AI assistant configuration and settings
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Hotel Selector */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 w-full sm:w-auto max-w-xs">
                <Select value={selectedHotelId} onValueChange={handleHotelChange}>
                  <SelectTrigger className="h-12 rounded-xl bg-white/50 border-gray-200 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(hotel => (
                      <SelectItem key={hotel._id} value={hotel._id}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Configuration Sections */}
          <div className="p-6 space-y-8">
            {/* Time Settings */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Time Settings</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors gap-2"
                  onClick={() => setIsTimeSettingsModalOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Breakfast Times */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Breakfast Hours
                  </h4>
                  <p className="text-gray-600">
                    {typeof config.breakfast === 'string' ? config.breakfast : (config.breakfast?.startTime && config.breakfast?.endTime ? `${config.breakfast.startTime} - ${config.breakfast.endTime}` : 'Non specificato')}
                  </p>
                </div>

                {/* Check-in Times */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Check-in Hours
                  </h4>
                  <p className="text-gray-600">
                    {typeof config.checkIn === 'string' ? config.checkIn : (config.checkIn?.startTime && config.checkIn?.endTime ? `${config.checkIn.startTime} - ${config.checkIn.endTime}` : 'Non specificato')}
                  </p>
                </div>
              </div>
            </div>

            {/* Review Settings */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Review Settings</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors gap-2"
                  onClick={() => setIsReviewSettingsModalOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-medium text-gray-700">Review Link</h4>
                  <p className="text-gray-600 break-all">{config.reviewLink}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-medium text-gray-700">Request Delay</h4>
                  <p className="text-gray-600">
                    {config.reviewRequestDelay} {config.reviewRequestDelay === 1 ? 'day' : 'days'} after first interaction
                  </p>
                </div>
              </div>
            </div>

            {/* Assistant Identity */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Assistant Identity</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors gap-2"
                  onClick={() => setIsIdentitySettingsModalOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <h4 className="font-medium text-gray-700">Trigger Name</h4>
                <p className="text-gray-600">{config.triggerName}</p>
              </div>
            </div>

            {/* Rules Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Assistant Rules</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors gap-2"
                  onClick={() => setIsRulesModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                {rules.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mb-3">
                      <MessageSquare className="h-8 w-8 text-gray-400 mx-auto" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No rules configured</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Add rules to customize how your assistant responds to specific queries
                    </p>
                    <Button
                      onClick={() => setIsRulesModalOpen(true)}
                      variant="outline"
                      className="rounded-xl"
                    >
                      Create First Rule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div 
                        key={rule._id}
                        className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {rule.isCustom ? rule.customTopic : rule.topic}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{rule.response}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={(checked) => handleToggleRule(rule._id!, checked)}
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <span className="text-sm text-gray-500">
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Credit Settings */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Credit Settings</h2>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-800">Credit Settings</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors gap-2"
                      onClick={() => setIsCreditSettingsModalOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Minimum Threshold */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-blue-500" />
                        Minimum Threshold
                      </h4>
                      <p className="text-gray-600">
                        {userCreditSettings.minimumThreshold} credits
                      </p>
                    </div>

                    {/* Top-up Amount */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        Auto Top-up Amount
                      </h4>
                      <p className="text-gray-600">
                        {userCreditSettings.topUpAmount} credits
                      </p>
                    </div>

                    {/* Auto Top-up Status */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        Auto Top-up
                      </h4>
                      <p className="text-gray-600 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${userCreditSettings.autoTopUp ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {userCreditSettings.autoTopUp ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">QR Code</h2>
          </div>
          <div className="p-8">
            <div className="flex items-start gap-8">
              <div className="bg-white p-8 rounded-xl border-2 border-gray-100">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="absolute -inset-4">
                      <div className="w-full h-full max-w-sm mx-auto lg:mx-0 animate-pulse-subtle">
                        <div className="h-full w-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-3xl blur-2xl" />
                      </div>
                    </div>
                    {config && (
                      <QRCodeSVG
                        value={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(config.triggerName)}`}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    )}
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500">
                      Scan this QR code or click below to download
                    </p>
                    <Button
                      onClick={handleDownloadQR}
                      variant="outline"
                      className="rounded-xl border-gray-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Strategic Placement</h3>
                  <p className="text-gray-600">
                    Place QR codes in high-visibility areas: reception desk, elevator lobbies, 
                    room key cards, and inside guest rooms. Consider adding them to restaurant 
                    tables and common areas.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Review Generation</h3>
                  <p className="text-gray-600">
                    Every guest who scans and uses the QR code will receive a review request, 
                    significantly increasing your review collection compared to traditional 
                    booking-only requests.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Promotion Tips</h3>
                  <p className="text-gray-600">
                    Train staff to mention the assistant during check-in. Add a small incentive 
                    like a welcome drink when guests first message the assistant. Include QR code 
                    in pre-arrival emails and welcome materials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditTimeSettingsModal
        isOpen={isTimeSettingsModalOpen}
        onClose={() => setIsTimeSettingsModalOpen(false)}
        currentConfig={config}
        onSuccess={(updatedConfig) => {
          setConfig(updatedConfig)
          setIsTimeSettingsModalOpen(false)
        }}
      />

      <EditReviewSettingsModal
        isOpen={isReviewSettingsModalOpen}
        onClose={() => setIsReviewSettingsModalOpen(false)}
        currentConfig={config}
        onSuccess={(updatedConfig) => {
          setConfig(updatedConfig)
          setIsReviewSettingsModalOpen(false)
        }}
      />

      <EditIdentitySettingsModal
        isOpen={isIdentitySettingsModalOpen}
        onClose={() => setIsIdentitySettingsModalOpen(false)}
        currentConfig={config}
        onSuccess={(updatedConfig) => {
          setConfig(updatedConfig)
          setIsIdentitySettingsModalOpen(false)
        }}
      />

      <EditCreditSettingsModal
        isOpen={isCreditSettingsModalOpen}
        onClose={() => setIsCreditSettingsModalOpen(false)}
        currentConfig={{
          hotelId: config.hotelId,
          creditSettings: userCreditSettings
        }}
        onSuccess={handleSuccess}
      />

      <WhatsAppRuleModal
        isOpen={isRulesModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleRuleSuccess}
        currentRule={selectedRule}
      />
    </div>
  );
}

// Aggiungi questi stili globali nel tuo CSS
const styles = `
  @keyframes pulse-subtle {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .animate-pulse-subtle {
    animation: pulse-subtle 2s ease-in-out infinite;
  }
`;

// Aggiungi lo style al documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
} 