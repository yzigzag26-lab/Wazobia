import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { LoginForm } from '@/features/auth/LoginForm'
import { brand } from '@/config/brand'

export default function LoginPage() {
  useEffect(() => {
    document.title = `Log in — ${brand.name}`
  }, [])

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue your learning, saved words and conversations."
      footer={
        <p>
          New to WAZOBIA?{' '}
          <Link
            to="/signup"
            className="font-medium text-forest-700 underline underline-offset-4 hover:text-forest-800"
          >
            Create a free account
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
