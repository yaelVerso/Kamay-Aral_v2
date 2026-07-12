'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { recordAuditLog } from '@/app/actions/audit'

interface Props {
  sectionId: string
  sectionName: string
  submoduleId: string
  submoduleTitle: string
  initialEnabled: boolean
}

export default function QuizToggle({ sectionId, sectionName, submoduleId, submoduleTitle, initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const next = !enabled
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('quiz_settings')
        .upsert(
          { section_id: sectionId, submodule_id: submoduleId, enabled: next, updated_at: new Date().toISOString() },
          { onConflict: 'section_id,submodule_id' },
        )
      if (error) throw error
      setEnabled(next)
      await recordAuditLog({
        action: 'quiz.toggle',
        description: `${next ? 'enabled' : 'disabled'} quiz for ${submoduleTitle} in section ${sectionName}`,
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update quiz setting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-checked={enabled}
      role="switch"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
        enabled ? 'bg-indigo-600' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
