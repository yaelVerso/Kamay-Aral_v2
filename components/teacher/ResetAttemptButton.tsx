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
}

export default function ResetAttemptButton({ attemptId, studentName, submoduleTitle }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleReset() {
    if (!confirm('Reset this student\'s quiz attempt? This cannot be undone.')) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('quiz_attempts').delete().eq('id', attemptId)
      if (error) throw error
      await recordAuditLog({
        action: 'attempt.reset',
        description: `reset ${studentName}'s quiz attempt for ${submoduleTitle}`,
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
