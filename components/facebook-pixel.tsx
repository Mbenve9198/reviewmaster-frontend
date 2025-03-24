"use client"

import { useEffect } from "react"
import Script from "next/script"

declare global {
  interface Window {
    fbq: any
    _fbq: any
    _fbPixelInitialized: boolean
  }
}

export default function FacebookPixel() {
  const PIXEL_ID = "1332101527823280"

  useEffect(() => {
    if (window._fbPixelInitialized) {
      return
    }

    const cookieConsent = localStorage.getItem("cookie-consent")
    let marketingAccepted = true

    if (cookieConsent) {
      try {
        const preferences = JSON.parse(cookieConsent)
        marketingAccepted = preferences.marketing !== false
      } catch (e) {
        console.error("Error parsing cookie preferences", e)
      }
    }

    if (marketingAccepted) {
      if (!window.fbq) {
        window.fbq = () => {
          // @ts-ignore
          window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments)
        }
      }

      if (!window._fbq) window._fbq = window.fbq
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []

      window.fbq("init", PIXEL_ID)
      window.fbq("track", "PageView")
      
      window._fbPixelInitialized = true
    }

    const handleCookiePreferencesChange = () => {
      const updatedConsent = localStorage.getItem("cookie-consent")
      if (updatedConsent) {
        try {
          const preferences = JSON.parse(updatedConsent)
          if (preferences.marketing && !window.fbq.loaded) {
            const script = document.createElement("script")
            script.src = "https://connect.facebook.net/en_US/fbevents.js"
            script.async = true
            document.head.appendChild(script)

            script.onload = () => {
              window.fbq("init", PIXEL_ID)
              window.fbq("track", "PageView")
              
              window._fbPixelInitialized = true
            }
          }
        } catch (e) {
          console.error("Error parsing updated cookie preferences", e)
        }
      }
    }

    window.addEventListener("cookiePreferencesChanged", handleCookiePreferencesChange)

    return () => {
      window.removeEventListener("cookiePreferencesChanged", handleCookiePreferencesChange)
    }
  }, [])

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            // L'inizializzazione effettiva avviene nel useEffect in base al consenso
          `,
        }}
      />

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