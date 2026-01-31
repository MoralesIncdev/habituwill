import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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
          } catch {}
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Get challenge (simplified query)
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single()

  if (challengeError || !challenge) {
    console.error('Challenge error:', challengeError)
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Challenge Not Found</h1>
          <p className="text-gray-600 mb-4">ID: {id}</p>
          <p className="text-sm text-red-600 mb-4">{challengeError?.message}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Get creator profile
  const { data: creator } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', challenge.creator_id)
    .single()

  // Get participants
  const { data: participants } = await supabase
    .from('challenge_participants')
    .select('id, status, stake_verified, user_id')
    .eq('challenge_id', id)

  // Get user profiles for participants
  const participantProfiles = await Promise.all(
    (participants || []).map(async (p) => {
      const { data: user } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', p.user_id)
        .single()
      return { ...p, user }
    })
  )

  const isCreator = challenge.creator_id === session.user.id

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
          {isCreator && challenge.status === 'draft' && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              Draft
            </span>
          )}
        </div>

        {/* Challenge Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{challenge.name}</h1>
          {challenge.description && (
            <p className="text-gray-600 mb-4">{challenge.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-sm text-gray-500">Start Date</div>
              <div className="font-medium">{challenge.start_date}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">End Date</div>
              <div className="font-medium">{challenge.end_date}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Duration</div>
              <div className="font-medium">{challenge.duration_days || 'N/A'} days</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Stakes</div>
              <div className="font-medium">
                {challenge.has_stakes ? `$${challenge.stake_amount} per person` : 'No stakes'}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-500 mb-2">Daily Requirements:</div>
            <div className="flex gap-4">
              {challenge.requires_workout_log && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  💪 Workout
                </span>
              )}
              {challenge.requires_diet_log && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  🥗 Diet
                </span>
              )}
              {challenge.requires_reflection && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  💭 Reflection
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">Created by</div>
            <div className="font-medium">{creator?.name || 'Unknown'}</div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Participants ({participantProfiles.length})
          </h2>
          
          {participantProfiles.length > 0 ? (
            <div className="space-y-2">
              {participantProfiles.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {participant.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium">{participant.user?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{participant.status}</div>
                    </div>
                  </div>
                  
                  {challenge.has_stakes && (
                    <div className="text-right">
                      {participant.stake_verified ? (
                        <span className="text-green-600 text-sm">✓ Paid</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Pending</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No participants yet</p>
          )}

          {isCreator && challenge.status === 'draft' && (
            <div className="mt-6 pt-6 border-t">
              <button className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-medium">
                Invite Participants
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}