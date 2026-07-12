'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'

export default function CreateSectionForm() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('sections').insert({ teacher_id: user!.id, name: name.trim() })
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'section.create', description: `created section ${name.trim()}` })
      setName('')
      toast.success(`Section "${name.trim()}" created`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create section')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCreate} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Section name (e.g. Apple)"
        className="flex-1"
      />
      <Button type="submit" disabled={loading || !name.trim()} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
        <Plus className="h-4 w-4" />
        Create
      </Button>
    </form>
  )
}
