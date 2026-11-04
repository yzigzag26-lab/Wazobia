// oxlint-disable react/only-export-components
/*
 * This module exports route *descriptions* (`routes`) and the router instance.
 * The only components it can export are lazy import wrappers, and Fast Refresh
 * does not track those — so the rule protects nothing here while failing on
 * every entry. Exempted per file rather than by weakening the rule globally,
 * because the rule is load-bearing everywhere else (see HANDOVER.md §6).
 * The directive above is a line comment on purpose: oxlint only honours
 * disable directives written that way.
 */

import { lazy, Suspense } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { MarketingLayout } from '@/layouts/MarketingLayout'
import { RouteFallback } from '@/components/layout/RouteFallback'
import RouteErrorPage from '@/pages/RouteErrorPage'

/**
 * Route table.
 *
 *   /            public marketing landing page
 *   /signup      registration (frontend-only, no backend call)
 *   /login       login (frontend-only, no backend call)
 *   /onboarding  ten-question questionnaire, one per page (skippable, local only)
 *   /app         application entry — works immediately for guests
 *   /app/*       the eight destinations
 *
 * Every data-bearing route sits under /app so public marketing pages never have
 * to know about the application shell, and future auth-guarded groups can wrap
 * the same children without reshaping the URLs.
 */

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const SignUpPage = lazy(() => import('@/pages/SignUpPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const AppEntryPage = lazy(() => import('@/pages/AppEntryPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const AiPage = lazy(() => import('@/features/ai/AiPage'))
const TranslatePage = lazy(() => import('@/features/translate/TranslatePage'))
const LearnPage = lazy(() => import('@/features/learn/LearnPage'))
const SpeakPage = lazy(() => import('@/features/speak/SpeakPage'))
const DictionaryPage = lazy(() => import('@/features/dictionary/DictionaryPage'))
const CommunityPage = lazy(() => import('@/features/community/CommunityPage'))
const PreservePage = lazy(() => import('@/features/preserve/PreservePage'))
const ResearchPage = lazy(() => import('@/features/research/ResearchPage'))

function page(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      /* ------------------------------------------------- public marketing */
      {
        element: <MarketingLayout />,
        children: [{ index: true, path: '/', element: page(<LandingPage />) }],
      },

      /* ------------------------------------------------------ auth screens */
      { path: '/signup', element: page(<SignUpPage />) },
      { path: '/login', element: page(<LoginPage />) },
      /* Onboarding is deliberately outside the app shell: no navigation, no
         distractions, and it is reachable both with and without a session. */
      { path: '/onboarding', element: page(<OnboardingPage />) },

      /* ------------------------------------------------------- application */
      {
        path: '/app',
        element: <AppShell />,
        children: [
          { index: true, element: page(<AppEntryPage />) },
          { path: 'ai', element: page(<AiPage />) },
          { path: 'translate', element: page(<TranslatePage />) },
          { path: 'learn', element: page(<LearnPage />) },
          { path: 'speak', element: page(<SpeakPage />) },
          { path: 'dictionary', element: page(<DictionaryPage />) },
          { path: 'community', element: page(<CommunityPage />) },
          { path: 'preserve', element: page(<PreservePage />) },
          { path: 'research', element: page(<ResearchPage />) },
          { path: '*', element: page(<NotFoundPage />) },
        ],
      },

      /* ------------------------------------------------------ catch-all */
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
]

export const router = createBrowserRouter(routes)
