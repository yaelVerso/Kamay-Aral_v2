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
  /** Below the minimum sign count — toggling on is blocked, but an already-enabled quiz stays visible as-is. */
  disabled?: boolean
}

export default function QuizToggle({ sectionId, sectionName, submoduleId, submoduleTitle, initialEnabled, disabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (disabled && !enabled) return
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
        sectionId,
        sectionName,
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
      disabled={loading || (disabled && !enabled)}
      aria-checked={enabled}
      role="switch"
      title={disabled && !enabled ? 'Requires at least 3 signs to enable' : undefined}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] focus-visible:ring-offset-2 disabled:opacity-50 ${
        enabled ? 'bg-[var(--brand-secondary)]' : 'bg-muted'
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
