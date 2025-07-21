export function isValidStudentEmail(email: string): boolean {
  const studentEmailPatterns = [
    /@ufs\.ac\.za$/,
    /@student\.ufs\.ac\.za$/,
    /@kovsies\.ac\.za$/,
    /@student\.kovsies\.ac\.za$/,
  ]

  return studentEmailPatterns.some((pattern) => pattern.test(email.toLowerCase()))
}