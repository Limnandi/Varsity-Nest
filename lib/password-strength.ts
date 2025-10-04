/**
 * Password strength checker utility
 * Returns strength level and detailed feedback
 */

export interface PasswordStrength {
  score: number // 0-4 (0: very weak, 4: very strong)
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
  feedback: string[]
  color: string
  percentage: number
}

export function checkPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      level: 'very-weak',
      feedback: ['Enter a password'],
      color: 'red',
      percentage: 0
    }
  }

  let score = 0
  const feedback: string[] = []

  // Length check
  if (password.length >= 8) {
    score++
  } else {
    feedback.push('At least 8 characters')
  }

  if (password.length >= 12) {
    score++
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('Add uppercase letters')
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++
  } else {
    feedback.push('Add lowercase letters')
  }

  // Number check
  if (/\d/.test(password)) {
    score++
  } else {
    feedback.push('Add numbers')
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++
  } else {
    feedback.push('Add special characters')
  }

  // Calculate final score (max 4)
  const finalScore = Math.min(Math.floor(score / 1.5), 4)

  // Determine level, color, and percentage
  let level: PasswordStrength['level']
  let color: string
  let percentage: number

  if (finalScore === 0) {
    level = 'very-weak'
    color = 'red'
    percentage = 20
  } else if (finalScore === 1) {
    level = 'weak'
    color = 'orange'
    percentage = 40
  } else if (finalScore === 2) {
    level = 'fair'
    color = 'yellow'
    percentage = 60
  } else if (finalScore === 3) {
    level = 'good'
    color = 'blue'
    percentage = 80
  } else {
    level = 'strong'
    color = 'green'
    percentage = 100
    feedback.push('Excellent password!')
  }

  return {
    score: finalScore,
    level,
    feedback: feedback.length > 0 ? feedback : ['Great password!'],
    color,
    percentage
  }
}
