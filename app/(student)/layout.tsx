import StudentChrome from '@/components/student/StudentChrome'
import LegalAcceptanceGate from '@/components/student/LegalAcceptanceGate'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LegalAcceptanceGate />
      <StudentChrome>{children}</StudentChrome>
    </>
  )
}
