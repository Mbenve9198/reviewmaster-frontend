"use client"

import { FC } from 'react'
import { FaWhatsapp } from 'react-icons/fa'

export interface WhatsAppSupportProps {
  phoneNumber: string
  message?: string
}

export const WhatsAppSupport: FC<WhatsAppSupportProps> = ({
  phoneNumber,
  message = "Hello, I need assistance with ReviewMaster."
}) => {
  const handleClick = () => {
    // Format phone number (remove spaces, +, etc.)
    const formattedNumber = phoneNumber.replace(/\D/g, '')
    
    // Create WhatsApp URL with encoded message
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`
    
    // Open in new tab
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 cursor-pointer transition-transform hover:scale-110"
      onClick={handleClick}
      title="Contact Support via WhatsApp"
    >
      <div className="bg-green-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
        <FaWhatsapp size={24} />
      </div>
    </div>
  )
} 