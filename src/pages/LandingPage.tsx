import { Hero } from '@/features/marketing/Hero'
import { AboutWazobia } from '@/features/marketing/AboutWazobia'
import { LanguageSection } from '@/features/marketing/LanguageSection'
import { HowItWorks } from '@/features/marketing/HowItWorks'
import { WhyItMatters } from '@/features/marketing/WhyItMatters'
import { FinalCta } from '@/features/marketing/FinalCta'

/**
 * Public landing page.
 *
 * Sections are composed from `src/features/marketing/` so each can be edited in
 * isolation, and so the page never collapses into one giant component.
 *
 * The page speaks about WAZOBIA as a product and an institution. It intentionally
 * does not list modules with build-status badges: that technical inventory lives
 * inside the application, where each destination states its own status. The
 * landing page is for people deciding whether to trust the platform with their
 * language.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <AboutWazobia />
      <LanguageSection />
      <HowItWorks />
      <WhyItMatters />
      <FinalCta />
    </>
  )
}
