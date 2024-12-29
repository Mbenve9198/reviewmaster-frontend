import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ClientLayout } from "@/components/client-layout"
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ReviewMaster - Hotel Review Management",
  description: "AI-powered hotel review management platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

