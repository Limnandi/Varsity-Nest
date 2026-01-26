"use client"

import { useState } from "react"
import { Share2, MessageCircle, Facebook, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface ShareSectionProps {
  accommodationId: string
  accommodationName: string
}

export default function ShareSection({ accommodationId, accommodationName }: ShareSectionProps) {
  const [copied, setCopied] = useState(false)

  const getListingUrl = () => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/listing/${accommodationId}`
  }

  const handleWhatsAppShare = () => {
    const url = getListingUrl()
    const urlWithParams = `${url}?utm_source=whatsapp&utm_medium=referral&utm_campaign=socialmedia`
    const message = `Check out this accommodation I found on VarsityNest! ${accommodationName} - ${urlWithParams}`
    
    // Use wa.me which automatically detects device and opens appropriate WhatsApp (Web or App)
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleFacebookShare = () => {
    const url = getListingUrl()
    const urlWithParams = `${url}?utm_source=facebook&utm_medium=referral&utm_campaign=socialmedia`
    // Facebook sharer URL - opens Facebook share dialog with the listing URL
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlWithParams)}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
  }

  const handleCopyLink = async () => {
    try {
      const url = getListingUrl()
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  return (
    <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 text-white shadow-2xl shadow-purple-500/10 overflow-hidden">
      <h3 className="text-lg sm:text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
        <Share2 className="w-5 h-5 text-purple-400" />
        Share
      </h3>
      
      <div className="flex flex-col gap-3">
        {/* WhatsApp Share */}
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center gap-3 px-4 py-3 border border-green-500/50 bg-green-500/10 text-green-400 rounded-xl font-medium hover:bg-green-500/20 transition-all duration-300"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Share on WhatsApp</span>
        </button>

        {/* Facebook Share */}
        <button
          onClick={handleFacebookShare}
          className="flex items-center gap-3 px-4 py-3 border border-blue-500/50 bg-blue-500/10 text-blue-400 rounded-xl font-medium hover:bg-blue-500/20 transition-all duration-300"
        >
          <Facebook className="w-5 h-5" />
          <span>Share on Facebook</span>
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-3 px-4 py-3 border border-white/20 bg-black/20 text-white rounded-xl font-medium hover:bg-white/5 transition-all duration-300"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-400">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

