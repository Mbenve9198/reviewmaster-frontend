"use client"
import { useEffect } from "react"
import Script from "next/script"

declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}

// Funzioni di tracciamento esportate per essere utilizzate in altri componenti
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', eventName, params);
      console.log(`[Facebook Pixel] Tracked event: ${eventName}`, params);
    } catch (error) {
      console.error(`[Facebook Pixel] Error tracking event: ${eventName}`, error);
    }
  }
};

export const trackCustomEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('trackCustom', eventName, params);
      console.log(`[Facebook Pixel] Tracked custom event: ${eventName}`, params);
    } catch (error) {
      console.error(`[Facebook Pixel] Error tracking custom event: ${eventName}`, error);
    }
  }
};

export default function FacebookPixel() {
  const PIXEL_ID = "1332101527823280"

  useEffect(() => {
    // Controllo per evitare inizializzazione doppia
    if (window.fbq && window.fbq.loaded) {
      console.log("[Facebook Pixel] Already initialized, skipping");
      return;
    }

    // Verifica se l'utente ha accettato i cookie di marketing
    const cookieConsent = localStorage.getItem("cookie-consent")
    let marketingAccepted = true // Default a true se non c'è ancora una scelta
    if (cookieConsent) {
      try {
        const preferences = JSON.parse(cookieConsent)
        marketingAccepted = preferences.marketing !== false
      } catch (e) {
        console.error("Error parsing cookie preferences", e)
      }
    }
    
    // Inizializza Facebook Pixel solo se i cookie di marketing sono accettati
    if (marketingAccepted) {
      // Inizializza il pixel
      if (!window.fbq) {
        window.fbq = function() {
          // @ts-ignore
          window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments)
        }
      }
      if (!window._fbq) window._fbq = window.fbq
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []
      
      // Traccia la visualizzazione della pagina
      window.fbq("init", PIXEL_ID)
      window.fbq("track", "PageView")
      
      // Aggiungi supporto per cross-domain tracking
      setupCrossDomainTracking();
    }
    
    // Funzione per il cross-domain tracking
    function setupCrossDomainTracking() {
      // Determina su quale dominio siamo
      const isLandingPage = window.location.hostname.includes('vercel.app');
      const mainDomain = 'replai.app';
      const landingDomain = 'replai-app.vercel.app';
      
      // Ottieni fbclid o altri parametri di tracciamento dall'URL
      const urlParams = new URLSearchParams(window.location.search);
      const fbclid = urlParams.get('fbclid');
      
      // Se siamo sulla landing page e abbiamo fbclid, aggiungiamolo ai link verso il sito principale
      if (isLandingPage && fbclid) {
        // Traccia evento personalizzato
        trackCustomEvent('LandingPageVisit', { fbclid });
        
        // Aggiungi fbclid a tutti i link verso il sito principale
        setTimeout(() => {
          const links = document.querySelectorAll(`a[href*="${mainDomain}"]`);
          links.forEach(link => {
            try {
              const url = new URL(link.href);
              url.searchParams.set('fbclid', fbclid);
              link.href = url.toString();
              
              // Aggiungi anche un event listener per tracciare i clic
              link.addEventListener('click', () => {
                trackCustomEvent('ClickToMainSite', { fbclid });
              });
            } catch (e) {
              console.error('Error updating link with fbclid', e);
            }
          });
        }, 1000); // Piccolo ritardo per assicurarsi che tutti i link siano caricati
      }
      
      // Se siamo sul sito principale e abbiamo fbclid, tracciamo la provenienza
      if (!isLandingPage && fbclid) {
        trackCustomEvent('ArrivedFromLanding', { 
          fbclid,
          referrer: document.referrer
        });
      }
    }

    // Funzione per gestire il cambio di preferenze dei cookie
    const handleCookiePreferencesChange = () => {
      const updatedConsent = localStorage.getItem("cookie-consent")
      if (updatedConsent) {
        try {
          const preferences = JSON.parse(updatedConsent)
          if (preferences.marketing && !window.fbq.loaded) {
            // Se l'utente ha appena accettato i cookie di marketing, carica il pixel
            const script = document.createElement("script")
            script.src = "https://connect.facebook.net/en_US/fbevents.js"
            script.async = true
            document.head.appendChild(script)
            script.onload = () => {
              window.fbq("init", PIXEL_ID)
              window.fbq("track", "PageView")
              setupCrossDomainTracking();
            }
          }
        } catch (e) {
          console.error("Error parsing updated cookie preferences", e)
        }
      }
    }
    
    // Ascolta i cambiamenti nelle preferenze dei cookie
    window.addEventListener("cookiePreferencesChanged", handleCookiePreferencesChange)
    return () => {
      window.removeEventListener("cookiePreferencesChanged", handleCookiePreferencesChange)
    }
  }, [])

  return (
    <>
      {/* Script del Facebook Pixel - modificato per evitare duplicazioni */}
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Verifica se fbq è già inizializzato
            if (!window.fbq || !window.fbq.loaded) {
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
            }
            // L'inizializzazione effettiva avviene nel useEffect in base al consenso
          `,
        }}
      />
      {/* Fallback per browser con JavaScript disabilitato */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}