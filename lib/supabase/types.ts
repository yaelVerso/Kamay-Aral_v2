// Placeholder — replace with: npx supabase gen types typescript --local > lib/supabase/types.ts
// once your Supabase project is connected.
export type Database = {
  public: {
    Tables: {
      teachers: {
        Row: { id: string; full_name: string; first_name: string | null; last_name: string | null; id_number: string | null; is_active: boolean; created_at: string }
        Insert: { id: string; full_name: string; first_name?: string | null; last_name?: string | null; id_number?: string | null; is_active?: boolean; created_at?: string }
        Update: { id?: string; full_name?: string; first_name?: string | null; last_name?: string | null; id_number?: string | null; is_active?: boolean; created_at?: string }
        Relationships: []
      }
      sections: {
        Row: { id: string; teacher_id: string; name: string; created_at: string }
        Insert: { id?: string; teacher_id: string; name: string; created_at?: string }
        Update: { id?: string; teacher_id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      students: {
        Row: { id: string; section_id: string | null; full_name: string; email: string | null; first_name: string | null; last_name: string | null; id_number: string | null; is_active: boolean; created_at: string }
        Insert: { id: string; section_id?: string | null; full_name: string; email?: string | null; first_name?: string | null; last_name?: string | null; id_number?: string | null; is_active?: boolean; created_at?: string }
        Update: { id?: string; section_id?: string | null; full_name?: string; email?: string | null; first_name?: string | null; last_name?: string | null; id_number?: string | null; is_active?: boolean; created_at?: string }
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
        Row: { id: string; student_id: string; submodule_id: string; started_at: string; submitted_at: string | null; score: number | null; total: number | null; is_active: boolean }
        Insert: { id?: string; student_id: string; submodule_id: string; started_at?: string; submitted_at?: string | null; score?: number | null; total?: number | null; is_active?: boolean }
        Update: { id?: string; student_id?: string; submodule_id?: string; started_at?: string; submitted_at?: string | null; score?: number | null; total?: number | null; is_active?: boolean }
        Relationships: []
      }
      quiz_answers: {
        Row: { id: string; attempt_id: string; activity_type: string; item_id: string; answer_given: string | null; is_correct: boolean }
        Insert: { id?: string; attempt_id: string; activity_type: string; item_id: string; answer_given?: string | null; is_correct: boolean }
        Update: { id?: string; attempt_id?: string; activity_type?: string; item_id?: string; answer_given?: string | null; is_correct?: boolean }
        Relationships: []
      }
      custom_modules: {
        Row: { id: string; teacher_id: string; title: string; description: string | null; icon: string; color: string; order: number; created_at: string }
        Insert: { id?: string; teacher_id: string; title: string; description?: string | null; icon?: string; color?: string; order?: number; created_at?: string }
        Update: { id?: string; teacher_id?: string; title?: string; description?: string | null; icon?: string; color?: string; order?: number; created_at?: string }
        Relationships: []
      }
      custom_submodules: {
        Row: { id: string; module_id: string; title: string; short_title: string; order: number; created_at: string }
        Insert: { id?: string; module_id: string; title: string; short_title: string; order?: number; created_at?: string }
        Update: { id?: string; module_id?: string; title?: string; short_title?: string; order?: number; created_at?: string }
        Relationships: []
      }
      custom_signs: {
        Row: { id: string; submodule_id: string; label: string; label_fil: string | null; description: string | null; video_url: string; image_url: string | null; accepted_answers: string[]; order: number; created_at: string }
        Insert: { id?: string; submodule_id: string; label: string; label_fil?: string | null; description?: string | null; video_url: string; image_url?: string | null; accepted_answers?: string[]; order?: number; created_at?: string }
        Update: { id?: string; submodule_id?: string; label?: string; label_fil?: string | null; description?: string | null; video_url?: string; image_url?: string | null; accepted_answers?: string[]; order?: number; created_at?: string }
        Relationships: []
      }
      custom_module_sections: {
        Row: { module_id: string; section_id: string; assigned_at: string }
        Insert: { module_id: string; section_id: string; assigned_at?: string }
        Update: { module_id?: string; section_id?: string; assigned_at?: string }
        Relationships: []
      }
      audit_logs: {
        Row: { id: string; actor_id: string | null; actor_name: string; actor_role: string; action: string; description: string; section_id: string | null; section_name: string | null; created_at: string }
        Insert: { id?: string; actor_id?: string | null; actor_name: string; actor_role: string; action: string; description: string; section_id?: string | null; section_name?: string | null; created_at?: string }
        Update: { id?: string; actor_id?: string | null; actor_name?: string; actor_role?: string; action?: string; description?: string; section_id?: string | null; section_name?: string | null; created_at?: string }
        Relationships: []
      }
      app_settings: {
        Row: { id: boolean; system_name: string | null; logo_url: string | null; primary_color: string | null; secondary_color: string | null; updated_at: string }
        Insert: { id?: boolean; system_name?: string | null; logo_url?: string | null; primary_color?: string | null; secondary_color?: string | null; updated_at?: string }
        Update: { id?: boolean; system_name?: string | null; logo_url?: string | null; primary_color?: string | null; secondary_color?: string | null; updated_at?: string }
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
