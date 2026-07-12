// Placeholder — replace with: npx supabase gen types typescript --local > lib/supabase/types.ts
// once your Supabase project is connected.
export type Database = {
  public: {
    Tables: {
      teachers: {
        Row: { id: string; full_name: string; first_name: string | null; last_name: string | null; created_at: string }
        Insert: { id: string; full_name: string; first_name?: string | null; last_name?: string | null; created_at?: string }
        Update: { id?: string; full_name?: string; first_name?: string | null; last_name?: string | null; created_at?: string }
        Relationships: []
      }
      sections: {
        Row: { id: string; teacher_id: string; name: string; created_at: string }
        Insert: { id?: string; teacher_id: string; name: string; created_at?: string }
        Update: { id?: string; teacher_id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      students: {
        Row: { id: string; section_id: string | null; full_name: string; email: string | null; first_name: string | null; last_name: string | null; created_at: string }
        Insert: { id: string; section_id?: string | null; full_name: string; email?: string | null; first_name?: string | null; last_name?: string | null; created_at?: string }
        Update: { id?: string; section_id?: string | null; full_name?: string; email?: string | null; first_name?: string | null; last_name?: string | null; created_at?: string }
        Relationships: []
      }
      learn_progress: {
        Row: { id: string; student_id: string; module_id: string; submodule_id: string; item_id: string; viewed_at: string }
        Insert: { id?: string; student_id: string; module_id: string; submodule_id: string; item_id: string; viewed_at?: string }
        Update: { id?: string; student_id?: string; module_id?: string; submodule_id?: string; item_id?: string; viewed_at?: string }
        Relationships: []
      }
      quiz_settings: {
        Row: { id: string; section_id: string; submodule_id: string; enabled: boolean; updated_at: string }
        Insert: { id?: string; section_id: string; submodule_id: string; enabled?: boolean; updated_at?: string }
        Update: { id?: string; section_id?: string; submodule_id?: string; enabled?: boolean; updated_at?: string }
        Relationships: []
      }
      quiz_attempts: {
        Row: { id: string; student_id: string; submodule_id: string; started_at: string; submitted_at: string | null; score: number | null; total: number | null }
        Insert: { id?: string; student_id: string; submodule_id: string; started_at?: string; submitted_at?: string | null; score?: number | null; total?: number | null }
        Update: { id?: string; student_id?: string; submodule_id?: string; started_at?: string; submitted_at?: string | null; score?: number | null; total?: number | null }
        Relationships: []
      }
      quiz_answers: {
        Row: { id: string; attempt_id: string; activity_type: string; item_id: string; answer_given: string | null; is_correct: boolean }
        Insert: { id?: string; attempt_id: string; activity_type: string; item_id: string; answer_given?: string | null; is_correct: boolean }
        Update: { id?: string; attempt_id?: string; activity_type?: string; item_id?: string; answer_given?: string | null; is_correct?: boolean }
        Relationships: []
      }
      audit_logs: {
        Row: { id: string; actor_id: string | null; actor_name: string; actor_role: string; action: string; description: string; created_at: string }
        Insert: { id?: string; actor_id?: string | null; actor_name: string; actor_role: string; action: string; description: string; created_at?: string }
        Update: { id?: string; actor_id?: string | null; actor_name?: string; actor_role?: string; action?: string; description?: string; created_at?: string }
        Relationships: []
      }
    }
    Views: {
      user_roles: {
        Row: { id: string | null; role: string | null }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
