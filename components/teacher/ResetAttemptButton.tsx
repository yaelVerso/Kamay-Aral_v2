'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { recordAuditLog } from '@/app/actions/audit'

interface Props {
  attemptId: string
  studentName: string
  submoduleTitle: string
  sectionId?: string | null
  sectionName?: string | null
}

export default function ResetAttemptButton({ attemptId, studentName, submoduleTitle, sectionId, sectionName }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleReset() {
    if (!confirm('Reset this student\'s quiz attempt? This cannot be undone.')) return
    setLoading(true)
    try {
      const supabase = createClient()
      // Explicit delete instead of relying solely on the DB's ON DELETE
      // CASCADE — guarantees no stale answers linger even if that
      // constraint isn't actually applied on the live database.
      const { error: answersError } = await supabase.from('quiz_answers').delete().eq('attempt_id', attemptId)
      if (answersError) throw answersError
      const { error } = await supabase.from('quiz_attempts').delete().eq('id', attemptId)
      if (error) throw error
      await recordAuditLog({
        action: 'attempt.reset',
        description: `reset ${studentName}'s quiz attempt for ${submoduleTitle}`,
        sectionId,
        sectionName,
      })
      toast.success('Attempt reset')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReset}
      disabled={loading}
      className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
    >
      <RotateCcw className="h-3 w-3" />
      Reset
    </Button>
  )
}
