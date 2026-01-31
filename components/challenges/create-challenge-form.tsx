'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreateChallengeForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [hasStakes, setHasStakes] = useState(false)
  const [stakeAmount, setStakeAmount] = useState('')
  const [requiresWorkout, setRequiresWorkout] = useState(true)
  const [requiresDiet, setRequiresDiet] = useState(true)
  const [requiresReflection, setRequiresReflection] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Ensure profile exists (create if missing)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0],
          })
        
        if (profileError) throw profileError
      }

      // Create challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          name,
          description,
          creator_id: user.id,
          start_date: startDate,
          end_date: endDate,
          has_stakes: hasStakes,
          stake_amount: hasStakes ? parseFloat(stakeAmount) : null,
          requires_workout_log: requiresWorkout,
          requires_diet_log: requiresDiet,
          requires_reflection: requiresReflection,
          status: 'draft',
        })
        .select()
        .single()

      if (challengeError) throw challengeError

      // Add creator as first participant
      const { error: participantError } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          status: 'active',
        })

      if (participantError) throw participantError

      // Redirect to challenge page
      router.push(`/challenges/${challenge.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Challenge Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Challenge Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md"
          placeholder="30-Day Consistency Challenge"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Post daily check-ins. Miss a day = out. Winner takes all."
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-2">
            Start Date *
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-2">
            End Date *
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Daily Requirements
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={requiresWorkout}
              onChange={(e) => setRequiresWorkout(e.target.checked)}
              className="mr-2"
            />
            <span>Workout log required</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={requiresDiet}
              onChange={(e) => setRequiresDiet(e.target.checked)}
              className="mr-2"
            />
            <span>Diet log required</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={requiresReflection}
              onChange={(e) => setRequiresReflection(e.target.checked)}
              className="mr-2"
            />
            <span>Reflection required</span>
          </label>
        </div>
      </div>

      {/* Stakes */}
      <div>
        <label className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={hasStakes}
            onChange={(e) => setHasStakes(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm font-medium">Add stakes (money on the line)</span>
        </label>
        
        {hasStakes && (
          <div className="ml-6">
            <label htmlFor="stakeAmount" className="block text-sm mb-2">
              Amount per person ($)
            </label>
            <input
              id="stakeAmount"
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Winner takes all. Platform doesn't hold money.
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        {loading ? 'Creating...' : 'Create Challenge'}
      </button>
    </form>
  )
}