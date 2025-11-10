import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Staff {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export interface ServiceUser {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  room_number?: string;
  care_level: string;
  created_at: string;
}

export interface Shift {
  id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  created_at: string;
}

export interface DailyNote {
  id: string;
  service_user_id: string;
  staff_id: string;
  note_date: string;
  note_content: string;
  created_at: string;
}

export interface ResidentMedication {
  id: string;
  service_user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  created_at: string;
}

export interface MARRecord {
  id: string;
  medication_id: string;
  service_user_id: string;
  staff_id: string;
  administered_at: string;
  status: string;
  notes?: string;
  created_at: string;
}
