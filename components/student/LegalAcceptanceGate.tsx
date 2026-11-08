'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LegalAcceptanceGate() {
  const [content, setContent] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: doc }, { data: student }] = await Promise.all([
        supabase.from('legal_documents').select('content, version').eq('id', true).maybeSingle(),
        supabase.from('students').select('accepted_legal_version').eq('id', user.id).maybeSingle(),
      ])
      if (cancelled) return

      // Empty content means the admin hasn't written anything yet — don't
      // block students on a blank modal.
      if (doc?.content.trim() && student && student.accepted_legal_version < doc.version) {
        setContent(doc.content)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleAccept() {
    setAccepting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('accept_legal_terms')
      if (!error) setContent(null)
    } finally {
      setAccepting(false)
    }
  }

  if (!content) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-background p-5 shadow-xl">
        <h2 className="mb-1 text-lg font-bold">Terms of Use & Privacy Policy</h2>
        <p className="mb-3 text-xs text-muted-foreground">Please review and accept to continue using the app.</p>
        <div className="mb-4 flex-1 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
          {content}
        </div>
        <Button onClick={handleAccept} disabled={accepting}>
          {accepting ? 'Saving…' : 'I Agree'}
        </Button>
      </div>
    </div>
  )
}
