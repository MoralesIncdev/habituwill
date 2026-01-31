import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/signup')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          Welcome, {profile?.name || 'User'}!
        </h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{profile?.total_challenges || 0}</div>
              <div className="text-gray-600">Challenges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{profile?.current_streak || 0}</div>
              <div className="text-gray-600">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{profile?.total_check_ins || 0}</div>
              <div className="text-gray-600">Check-ins</div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-gray-600">🎉 Authentication is working! You're logged in.</p>
          <p className="text-sm text-gray-500 mt-2">Week 1 complete. Ready for Week 2!</p>
        </div>
      </div>
    </div>
  )
}