import type React from "react"
import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "../globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "Replai - Gestione recensioni hotel potenziata dall'AI",
  description: "Replai è la piattaforma di gestione delle recensioni per hotel che sfrutta l'intelligenza artificiale",
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={manrope.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
} 