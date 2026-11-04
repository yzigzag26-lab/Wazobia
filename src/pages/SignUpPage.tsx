import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { SignUpForm } from '@/features/auth/SignUpForm'
import { brand } from '@/config/brand'

export default function SignUpPage() {
  useEffect(() => {
    document.title = `Create your account — ${brand.name}`
  }, [])

  return (
    <AuthLayout
      title="Create your free account"
      subtitle="Save your progress, keep your vocabulary and help preserve the languages you speak."
      footer={
        <p>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-forest-700 underline underline-offset-4 hover:text-forest-800"
          >
            Log in
          </Link>
        </p>
      }
    >
      <SignUpForm />
    </AuthLayout>
  )
}
