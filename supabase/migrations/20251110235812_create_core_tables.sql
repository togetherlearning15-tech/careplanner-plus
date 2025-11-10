/*
  # Create Core CarePlanner+ Tables

  ## New Tables Created

  ### 1. service_users
  Stores information about care home residents/service users.
  - `id` (uuid, primary key)
  - `full_name` (text, required) - Full legal name
  - `preferred_name` (text) - Preferred name or nickname
  - `date_of_birth` (date) - Date of birth
  - `nhs_number` (text) - NHS number
  - `address` (text) - Home address
  - `phone` (text) - Contact phone number
  - `email` (text) - Email address
  - `gp_details` (text) - GP contact information
  - `funding_type` (text) - Type of funding (NHS, private, etc.)
  - `service_type` (text) - Type of service (residential, nursing, etc.)
  - `is_active` (boolean, required) - Whether the user is currently active
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. staff
  Stores staff member information and credentials.
  - `id` (uuid, primary key)
  - `full_name` (text, required) - Full name of staff member
  - `email` (text, required, unique) - Email address
  - `role` (text, required) - Role: admin, manager, care_worker, or carer
  - `phone` (text) - Contact phone number
  - `employment_type` (text) - Full-time, part-time, etc.
  - `start_date` (date) - Employment start date
  - `dbs_number` (text) - DBS check number
  - `dbs_expiry` (date) - DBS expiry date
  - `ni_number` (text) - National Insurance number
  - `address` (text) - Home address
  - `is_active` (boolean, required) - Whether staff member is active
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. shifts
  Stores shift/rota information for staff assignments.
  - `id` (uuid, primary key)
  - `resident_id` (uuid, foreign key to service_users) - Service user for the shift
  - `assigned_staff_id` (uuid, foreign key to staff) - Assigned staff member
  - `shift_date` (date, required) - Date of the shift
  - `start_time` (time, required) - Shift start time
  - `end_time` (time, required) - Shift end time
  - `shift_type` (text) - Type of shift (morning, afternoon, night)
  - `location` (text) - Location of the shift
  - `status` (text, default 'scheduled') - scheduled, completed, or cancelled
  - `tasks_description` (text) - Description of tasks for the shift
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. daily_notes
  Stores daily notes and observations about service users.
  - `id` (uuid, primary key)
  - `resident_id` (uuid, foreign key to service_users, required) - Service user
  - `note_date` (date, required) - Date of the note
  - `note_time` (time, required) - Time of the note
  - `note_type` (text, required) - Type: daily_note, medication, incident, handover, or community
  - `content` (text, required) - Note content
  - `recorded_by` (text, required) - Email of person who recorded the note
  - `created_at` (timestamptz) - Record creation timestamp

  ### 5. medications
  Stores master list of medications.
  - `id` (uuid, primary key)
  - `name` (text, required) - Medication name
  - `description` (text) - Description of the medication
  - `created_at` (timestamptz) - Record creation timestamp

  ### 6. resident_medications
  Links service users to their prescribed medications.
  - `id` (uuid, primary key)
  - `resident_id` (uuid, foreign key to service_users, required) - Service user
  - `medication_id` (uuid, foreign key to medications, required) - Medication
  - `dosage` (text, required) - Prescribed dosage
  - `frequency` (text, required) - Frequency of administration
  - `start_date` (date) - Medication start date
  - `end_date` (date) - Medication end date
  - `is_active` (boolean, default true) - Whether medication is currently active
  - `created_at` (timestamptz) - Record creation timestamp

  ### 7. mar_records
  Medication Administration Records tracking when medications are given.
  - `id` (uuid, primary key)
  - `resident_medication_id` (uuid, foreign key to resident_medications, required)
  - `resident_id` (uuid, foreign key to service_users, required) - Service user
  - `administered_at` (date, required) - Date of administration
  - `administered_time` (time, required) - Time of administration
  - `status` (text, required) - given, refused, missed, or not_required
  - `dosage_given` (text) - Actual dosage given
  - `notes` (text) - Any notes about the administration
  - `administered_by` (text, required) - Email of person who administered
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security

  All tables have Row Level Security (RLS) enabled with policies requiring authentication.
  
  - SELECT policies: Allow authenticated users to view all records
  - INSERT policies: Allow authenticated users to create new records
  - UPDATE policies: Allow authenticated users to update records
  - DELETE policies: Allow authenticated users to delete records
  
  Note: In production, these policies should be refined based on specific role requirements.
*/

-- Create service_users table
CREATE TABLE IF NOT EXISTS service_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  preferred_name text DEFAULT '',
  date_of_birth date,
  nhs_number text DEFAULT '',
  address text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  gp_details text DEFAULT '',
  funding_type text DEFAULT '',
  service_type text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view service users"
  ON service_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create service users"
  ON service_users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service users"
  ON service_users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service users"
  ON service_users FOR DELETE
  TO authenticated
  USING (true);

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'carer',
  phone text DEFAULT '',
  employment_type text DEFAULT '',
  start_date date,
  dbs_number text DEFAULT '',
  dbs_expiry date,
  ni_number text DEFAULT '',
  address text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view staff"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create staff"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update staff"
  ON staff FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete staff"
  ON staff FOR DELETE
  TO authenticated
  USING (true);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid REFERENCES service_users(id) ON DELETE CASCADE,
  assigned_staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  shift_type text DEFAULT '',
  location text DEFAULT '',
  status text DEFAULT 'scheduled',
  tasks_description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shifts"
  ON shifts FOR DELETE
  TO authenticated
  USING (true);

-- Create daily_notes table
CREATE TABLE IF NOT EXISTS daily_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid REFERENCES service_users(id) ON DELETE CASCADE NOT NULL,
  note_date date NOT NULL,
  note_time time NOT NULL,
  note_type text NOT NULL,
  content text NOT NULL,
  recorded_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view daily notes"
  ON daily_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create daily notes"
  ON daily_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily notes"
  ON daily_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete daily notes"
  ON daily_notes FOR DELETE
  TO authenticated
  USING (true);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view medications"
  ON medications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update medications"
  ON medications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete medications"
  ON medications FOR DELETE
  TO authenticated
  USING (true);

-- Create resident_medications table
CREATE TABLE IF NOT EXISTS resident_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid REFERENCES service_users(id) ON DELETE CASCADE NOT NULL,
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resident_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view resident medications"
  ON resident_medications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create resident medications"
  ON resident_medications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update resident medications"
  ON resident_medications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete resident medications"
  ON resident_medications FOR DELETE
  TO authenticated
  USING (true);

-- Create mar_records table
CREATE TABLE IF NOT EXISTS mar_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_medication_id uuid REFERENCES resident_medications(id) ON DELETE CASCADE NOT NULL,
  resident_id uuid REFERENCES service_users(id) ON DELETE CASCADE NOT NULL,
  administered_at date NOT NULL,
  administered_time time NOT NULL,
  status text NOT NULL,
  dosage_given text DEFAULT '',
  notes text DEFAULT '',
  administered_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mar_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mar records"
  ON mar_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create mar records"
  ON mar_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update mar records"
  ON mar_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete mar records"
  ON mar_records FOR DELETE
  TO authenticated
  USING (true);

-- Insert some sample medications
INSERT INTO medications (name, description) VALUES
  ('Paracetamol', 'Pain relief and fever reduction'),
  ('Ibuprofen', 'Anti-inflammatory pain relief'),
  ('Aspirin', 'Blood thinner and pain relief'),
  ('Metformin', 'Type 2 diabetes medication'),
  ('Atorvastatin', 'Cholesterol lowering medication')
ON CONFLICT DO NOTHING;
