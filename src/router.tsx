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
 *   /app/*       the five destinations
 *
 * Learn is the only destination with a nested tree:
 *
 *   /app/learn                  the hub — four pillars, never more
 *   /app/learn/lessons          course catalogue for the primary language
 *   /app/learn/lessons/:courseId
 *   /app/learn/lessons/:courseId/:lessonId
 *   /app/learn/quizzes          quiz bank
 *   /app/learn/quizzes/:quizId
 *   /app/learn/proverbs         proverb cards, filterable by theme
 *   /app/learn/proverbs/:proverbId
 *   /app/learn/stories          story collection, filterable by category
 *   /app/learn/stories/:storyId
 *
 * Profile also nests, but only one level, for Settings:
 *
 *   /app/profile
 *   /app/profile/settings
 *   /app/profile/settings/{appearance,security,preferences,notifications,privacy}
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
const DictionaryPage = lazy(() => import('@/features/dictionary/DictionaryPage'))

/* Learn — four pillars, each its own tree. */
const LearnPage = lazy(() => import('@/features/learn/LearnPage'))
const LessonsIndexPage = lazy(() => import('@/features/learn/lessons/LessonsIndexPage'))
const CoursePage = lazy(() => import('@/features/learn/lessons/CoursePage'))
const LessonPage = lazy(() => import('@/features/learn/lessons/LessonPage'))
const QuizzesIndexPage = lazy(() => import('@/features/learn/quizzes/QuizzesIndexPage'))
const QuizPage = lazy(() => import('@/features/learn/quizzes/QuizPage'))
const ProverbsIndexPage = lazy(() => import('@/features/learn/proverbs/ProverbsIndexPage'))
const ProverbPage = lazy(() => import('@/features/learn/proverbs/ProverbPage'))
const StoriesIndexPage = lazy(() => import('@/features/learn/stories/StoriesIndexPage'))
const StoryPage = lazy(() => import('@/features/learn/stories/StoryPage'))

/* Profile and its settings panels. */
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'))
const SettingsPage = lazy(() => import('@/features/profile/SettingsPage'))
const AppearanceSettings = lazy(() => import('@/features/profile/settings/AppearanceSettings'))
const SecuritySettings = lazy(() => import('@/features/profile/settings/SecuritySettings'))
const PreferencesSettings = lazy(() => import('@/features/profile/settings/PreferencesSettings'))
const NotificationsSettings = lazy(
  () => import('@/features/profile/settings/NotificationsSettings'),
)
const PrivacySettings = lazy(() => import('@/features/profile/settings/PrivacySettings'))

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

          /* -------------------------------------------------- 1. Learn */
          {
            path: 'learn',
            children: [
              { index: true, element: page(<LearnPage />) },
              {
                path: 'lessons',
                children: [
                  { index: true, element: page(<LessonsIndexPage />) },
                  {
                    path: ':courseId',
                    children: [
                      { index: true, element: page(<CoursePage />) },
                      { path: ':lessonId', element: page(<LessonPage />) },
                    ],
                  },
                ],
              },
              {
                path: 'quizzes',
                children: [
                  { index: true, element: page(<QuizzesIndexPage />) },
                  { path: ':quizId', element: page(<QuizPage />) },
                ],
              },
              {
                path: 'proverbs',
                children: [
                  { index: true, element: page(<ProverbsIndexPage />) },
                  { path: ':proverbId', element: page(<ProverbPage />) },
                ],
              },
              {
                path: 'stories',
                children: [
                  { index: true, element: page(<StoriesIndexPage />) },
                  { path: ':storyId', element: page(<StoryPage />) },
                ],
              },
            ],
          },

          /* ---------------------------------------------- 2. Dictionary */
          { path: 'dictionary', element: page(<DictionaryPage />) },

          /* --------------------------------------------------- 3. AI */
          { path: 'ai', element: page(<AiPage />) },

          /* -------------------------------------------- 4. Translate */
          { path: 'translate', element: page(<TranslatePage />) },

          /* ---------------------------------------------- 5. Profile */
          {
            path: 'profile',
            children: [
              { index: true, element: page(<ProfilePage />) },
              {
                path: 'settings',
                element: page(<SettingsPage />),
                children: [
                  { path: 'appearance', element: page(<AppearanceSettings />) },
                  { path: 'security', element: page(<SecuritySettings />) },
                  { path: 'preferences', element: page(<PreferencesSettings />) },
                  { path: 'notifications', element: page(<NotificationsSettings />) },
                  { path: 'privacy', element: page(<PrivacySettings />) },
                ],
              },
            ],
          },

          { path: '*', element: page(<NotFoundPage />) },
        ],
      },

      /* ------------------------------------------------------ catch-all */
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
]

export const router = createBrowserRouter(routes)
