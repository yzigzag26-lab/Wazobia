import { useEffect } from 'react'
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard'
import { brand } from '@/config/brand'

export default function OnboardingPage() {
  useEffect(() => {
    document.title = `Welcome to WAZOBIA — ${brand.name}`
  }, [])

  return (
    <div className="min-h-dvh bg-paper-50">
      <OnboardingWizard />
    </div>
  )
}
