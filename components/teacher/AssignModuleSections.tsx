'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { recordAuditLog } from '@/app/actions/audit'

interface Section {
  id: string
  name: string
}

interface Props {
  moduleId: string
  sections: Section[]
  assignedSectionIds: string[]
}

export default function AssignModuleSections({ moduleId, sections, assignedSectionIds }: Props) {
  const [assigned, setAssigned] = useState(new Set(assignedSectionIds))
  const [pending, setPending] = useState<string | null>(null)
  const router = useRouter()

  async function toggle(section: Section, checked: boolean) {
    setPending(section.id)
    const supabase = createClient()
    try {
      if (checked) {
        const { error } = await supabase.from('custom_module_sections').insert({ module_id: moduleId, section_id: section.id })
        if (error) throw new Error(error.message)
        await recordAuditLog({
          action: 'custom_module.assign_section',
          description: `assigned a custom module to ${section.name}`,
          sectionId: section.id,
          sectionName: section.name,
        })
      } else {
        const { error } = await supabase.from('custom_module_sections').delete().eq('module_id', moduleId).eq('section_id', section.id)
        if (error) throw new Error(error.message)
        await recordAuditLog({
          action: 'custom_module.unassign_section',
          description: `unassigned a custom module from ${section.name}`,
          sectionId: section.id,
          sectionName: section.name,
        })
      }
      setAssigned((prev) => {
        const next = new Set(prev)
        if (checked) next.add(section.id)
        else next.delete(section.id)
        return next
      })
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update assignment')
    } finally {
      setPending(null)
    }
  }

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="font-semibold mb-1">Assign to Sections</h2>
        <p className="text-sm text-muted-foreground">You don&apos;t have any sections yet — create one in Class Management first.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div>
        <h2 className="font-semibold">Assign to Sections</h2>
        <p className="text-sm text-muted-foreground">Only students in the sections you turn on here will see this module.</p>
      </div>
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="text-sm font-medium">{section.name}</span>
            <Switch
              checked={assigned.has(section.id)}
              onCheckedChange={(checked) => toggle(section, checked)}
              disabled={pending === section.id}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
