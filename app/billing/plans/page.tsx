"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from 'lucide-react'
import { motion } from "framer-motion"
import { useUser } from "@/hooks/use-user" // Assicurati di avere questo hook

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const { user, loading } = useUser()

  const plans = [
    {
      name: "Host",
      price: "9.99",
      features: [
        "Gestisci una struttura",
        "20 risposte automatiche al mese",
        "Tono personalizzabile",
        "Risposte professionali ed efficienti"
      ],
      popular: false,
      baseStripeUrl: "https://buy.stripe.com/6oEeYw9g4cbffqE003"
    },
    {
      name: "Manager",
      price: "24.99",
      features: [
        "Gestisci fino a 5 strutture",
        "80 risposte automatiche al mese",
        "Risposte fino a 4000 token",
        "Supporto prioritario",
        "Opzioni di risposta automatica"
      ],
      popular: true,
      baseStripeUrl: "https://buy.stripe.com/8wMbMkeAo1wBbaoeUY"
    },
    {
      name: "Director",
      price: "49.99",
      features: [
        "Gestisci fino a 15 strutture",
        "500 risposte mensili",
        "Tutte le funzionalità del piano Manager"
      ],
      popular: false,
      baseStripeUrl: "https://buy.stripe.com/bIY8A8fEsb7b2DSeUZ"
    }
  ]

  const getFloatingAnimation = (index: number) => {
    // Piano popolare (Manager) ha movimento più accentuato
    if (index === 1) {
      return {
        y: [0, -16, 0],
        transition: {
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut"
        }
      }
    }
    
    // Altri piani hanno movimenti più leggeri e tempi diversi
    return {
      y: [0, -8, 0],
      transition: {
        repeat: Infinity,
        // Durata diversa per ogni card
        duration: index === 0 ? 5 : 4.5,
        ease: "easeInOut"
      }
    }
  }

  const handleSelectPlan = (baseUrl: string) => {
    if (loading) {
      console.log('Caricamento utente in corso...');
      return;
    }

    if (!user?.email) {
      console.error('Utente non autenticato');
      // Opzionale: reindirizza alla pagina di login
      window.location.href = '/login';
      return;
    }

    const url = new URL(baseUrl);
    url.searchParams.append('prefilled_email', user.email);
    url.searchParams.append('client_reference_id', user.id);
    url.searchParams.append('customer_email', user.email);
    
    const metadata = {
      user_id: user.id,
      user_name: user.name,
      current_plan: user.subscription?.plan
    };
    url.searchParams.append('metadata', JSON.stringify(metadata));

    window.location.href = url.toString();
  }

  // Opzionale: mostra un loader mentre l'utente viene caricato
  if (loading) {
    return <div>Caricamento...</div>
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Scegli il tuo piano</h1>
          <p className="text-xl text-gray-600 mb-12">Seleziona il piano più adatto alle tue esigenze</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.03,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              className="h-full"
              style={{
                perspective: 1000
              }}
            >
              <motion.div
                animate={getFloatingAnimation(index)}
              >
                <Card className={`flex flex-col h-full relative ${plan.popular ? 'border-primary' : 'border-gray-200'} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-primary">{plan.price}€</span>
                      <span className="text-gray-600"> / mese</span>
                    </CardDescription>
                    {plan.popular && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                          Più popolare
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="w-5 h-5 text-primary mr-2" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleSelectPlan(plan.baseStripeUrl)}
                      className={`w-full text-lg py-6 rounded-xl ${
                        plan.popular
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      } transition-all shadow-[0_4px_0_0_#2563eb] active:shadow-[0_0_0_0_#2563eb] active:translate-y-1`}
                    >
                      Seleziona Piano
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
