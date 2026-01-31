'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
