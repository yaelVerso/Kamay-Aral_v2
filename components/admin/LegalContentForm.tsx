'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateLegalDocumentAction } from '@/app/actions/legal'

interface Props {
  content: string
  version: number
}

export default function LegalContentForm({ content, version }: Props) {
  const router = useRouter()
  const [text, setText] = useState(content)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateLegalDocumentAction(text)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Terms & Privacy updated — students will be asked to re-accept it.')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Shown to students the first time they use the app, and again any time you save a change here. Currently version {version}.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write the Terms of Use and Privacy Policy students will be asked to accept…"
        rows={14}
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
      />
      <Button onClick={handleSave} disabled={saving || text.trim() === content.trim()}>
        {saving ? 'Saving…' : 'Save & Republish'}
      </Button>
    </div>
  )
}
