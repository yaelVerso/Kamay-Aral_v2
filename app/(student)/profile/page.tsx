import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/shared/LogoutButton'
import FontSizeControl from '@/components/shared/FontSizeControl'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: student } = await supabase
    .from('students')
    .select('full_name, created_at, section_id')
    .eq('id', user!.id)
    .single()

  let sectionName: string | null = null
  let teacherName: string | null = null
  if (student?.section_id) {
    const { data: section } = await supabase
      .from('sections')
      .select('name, teacher_id')
      .eq('id', student.section_id)
      .single()
    sectionName = section?.name ?? null
    if (section?.teacher_id) {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('full_name')
        .eq('id', section.teacher_id)
        .single()
      teacherName = teacher?.full_name ?? null
    }
  }

  return (
    <div className="px-4 pt-8 pb-4 space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
          {student?.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 className="text-2xl text-[#694B26] font-black">{student?.full_name}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Class
        </h2>
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-1">
          {sectionName ? (
            <>
              <p className="text-sm"><span className="text-muted-foreground">Section:</span> <span className="font-medium">{sectionName}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Teacher:</span> <span className="font-medium">{teacherName ?? 'Unassigned'}</span></p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Not yet assigned to a section.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Settings
        </h2>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <FontSizeControl />
        </div>
      </div>

      <div className="flex justify-center">
        <LogoutButton />
      </div>
    </div>
  )
}
