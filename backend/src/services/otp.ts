const otpStore = new Map<string, { code: string; expires: number }>()
const verifiedStore = new Map<string, boolean>()

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTP(phone: string): Promise<void> {
  const code = generateCode()
  otpStore.set(phone, { code, expires: Date.now() + 30 * 60 * 1000 })
  verifiedStore.delete(phone)

  console.log('\n' + '═'.repeat(44))
  console.log(`  📱 OTP for ${phone}`)
  console.log(`  Code: ${code}`)
  console.log('═'.repeat(44) + '\n')
}

export async function verifyOTP(
  phone: string,
  code: string
): Promise<boolean> {
  const stored = otpStore.get(phone)

  if (!stored) {
    console.log(`❌ No OTP found for ${phone}`)
    return false
  }

  if (Date.now() > stored.expires) {
    console.log(`❌ OTP expired for ${phone}`)
    otpStore.delete(phone)
    return false
  }

  if (stored.code !== code) {
    console.log(`❌ Wrong code. Expected: ${stored.code}, Got: ${code}`)
    return false
  }

  otpStore.delete(phone)
  console.log(`✅ OTP verified for ${phone}`)
  return true
}

export function isVerified(phone: string): boolean {
  return verifiedStore.get(phone) === true
}

export function markVerified(phone: string, value = true): void {
  if (value) {
    verifiedStore.set(phone, true)
  } else {
    verifiedStore.delete(phone)
  }
}