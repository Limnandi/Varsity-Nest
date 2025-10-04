"use client"

import { useEffect, useState } from "react"
import { checkPasswordStrength, type PasswordStrength } from "@/lib/password-strength"
import { Check, X } from "lucide-react"

interface PasswordStrengthIndicatorProps {
  password: string
  show?: boolean
}

export default function PasswordStrengthIndicator({ password, show = true }: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null)

  useEffect(() => {
    if (password) {
      setStrength(checkPasswordStrength(password))
    } else {
      setStrength(null)
    }
  }, [password])

  if (!show || !strength) return null

  const getColorClasses = () => {
    switch (strength.color) {
      case 'red':
        return {
          bar: 'bg-red-500',
          border: 'border-red-500/50',
          bg: 'bg-red-500/10',
          text: 'text-red-400'
        }
      case 'orange':
        return {
          bar: 'bg-orange-500',
          border: 'border-orange-500/50',
          bg: 'bg-orange-500/10',
          text: 'text-orange-400'
        }
      case 'yellow':
        return {
          bar: 'bg-yellow-500',
          border: 'border-yellow-500/50',
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-400'
        }
      case 'blue':
        return {
          bar: 'bg-blue-500',
          border: 'border-blue-500/50',
          bg: 'bg-blue-500/10',
          text: 'text-blue-400'
        }
      case 'green':
        return {
          bar: 'bg-green-500',
          border: 'border-green-500/50',
          bg: 'bg-green-500/10',
          text: 'text-green-400'
        }
      default:
        return {
          bar: 'bg-gray-500',
          border: 'border-gray-500/50',
          bg: 'bg-gray-500/10',
          text: 'text-gray-400'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">Password Strength</span>
          <span className={`text-xs font-semibold capitalize ${colors.text}`}>
            {strength.level.replace('-', ' ')}
          </span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
          <div
            className={`h-full ${colors.bar} transition-all duration-300 ease-out rounded-full`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
      </div>

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <div className={`p-3 border ${colors.border} ${colors.bg} backdrop-blur-xl rounded-xl`}>
          <ul className="space-y-1.5">
            {strength.feedback.map((item, index) => (
              <li key={index} className="flex items-start space-x-2 text-xs">
                {strength.score >= 4 && item === 'Excellent password!' ? (
                  <Check className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                ) : (
                  <X className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                )}
                <span className={colors.text}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
