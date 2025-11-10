import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-care';
import { useCarePlannerAuth } from '../contexts/CarePlannerAuth';

interface Medication {
  id?: string;
  name: string;
  description: string;
}

interface ResidentMedication {
  id?: string;
  resident_id: string;
  medication_id: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  medication_name?: string;
  resident_name?: string;
}

interface MARRecord {
  id?: string;
  resident_medication_id: string;
  resident_id: string;
  administered_at: string;
  administered_time: string;
  status: 'given' | 'refused' | 'missed' | 'not_required';
  dosage_given: string;
  notes: string;
  administered_by: string;
}

function MARPage() {
  const { user } = useCarePlannerAuth();
  const [residentMedications, setResidentMedications] = useState<ResidentMedication[]>([]);
  const [marRecords, setMarRecords] = useState<MARRecord[]>([]);
  const [serviceUsers, setServiceUsers] = useState<any[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [showMARForm, setShowMARForm] = useState(false);
  const [selectedResident, setSelectedResident] = useState('');
  const [medicationFormData, setMedicationFormData] = useState<ResidentMedication>({
    resident_id: '',
    medication_id: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });
  const [marFormData, setMarFormData] = useState<MARRecord>({
    resident_medication_id: '',
    resident_id: '',
    administered_at: new Date().toISOString().split('T')[0],
    administered_time: new Date().toTimeString().slice(0, 5),
    status: 'given',
    dosage_given: '',
    notes: '',
    administered_by: user?.email || '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedResident]);

  const fetchData = async () => {
    try {
      const [usersResult, medsResult, residentMedsResult, marResult] = await Promise.all([
        supabase.from('service_users').select('id, full_name').eq('is_active', true),
        supabase.from('medications').select('*'),
        selectedResident
          ? supabase.from('resident_medications').select('*').eq('resident_id', selectedResident).eq('is_active', true)
          : supabase.from('resident_medications').select('*').eq('is_active', true),
        selectedResident
          ? supabase.from('mar_records').select('*').eq('resident_id', selectedResident).order('administered_at', { ascending: false }).limit(20)
          : supabase.from('mar_records').select('*').order('administered_at', { ascending: false }).limit(20),
      ]);

      if (usersResult.error) throw usersResult.error;
      if (medsResult.error) throw medsResult.error;
      if (residentMedsResult.error) throw residentMedsResult.error;
      if (marResult.error) throw marResult.error;

      setServiceUsers(usersResult.data || []);
      setMedications(medsResult.data || []);

      const enrichedResidentMeds = (residentMedsResult.data || []).map((rm: any) => ({
        ...rm,
        medication_name: medsResult.data?.find((m: any) => m.id === rm.medication_id)?.name || 'Unknown',
        resident_name: usersResult.data?.find((u: any) => u.id === rm.resident_id)?.full_name || 'Unknown',
      }));

      setResidentMedications(enrichedResidentMeds);
      setMarRecords(marResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('resident_medications')
        .insert([medicationFormData]);

      if (error) throw error;

      resetMedicationForm();
      fetchData();
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Failed to add medication');
    }
  };

  const handleMARSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('mar_records')
        .insert([{ ...marFormData, administered_by: user?.email || marFormData.administered_by }]);

      if (error) throw error;

      resetMARForm();
      fetchData();
    } catch (error) {
      console.error('Error adding MAR record:', error);
      alert('Failed to add MAR record');
    }
  };

  const resetMedicationForm = () => {
    setMedicationFormData({
      resident_id: '',
      medication_id: '',
      dosage: '',
      frequency: '',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setShowMedicationForm(false);
  };

  const resetMARForm = () => {
    setMarFormData({
      resident_medication_id: '',
      resident_id: '',
      administered_at: new Date().toISOString().split('T')[0],
      administered_time: new Date().toTimeString().slice(0, 5),
      status: 'given',
      dosage_given: '',
      notes: '',
      administered_by: user?.email || '',
    });
    setShowMARForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Medication Administration Record (MAR)</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowMedicationForm(true)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-200"
          >
            Add Medication
          </button>
          <button
            onClick={() => setShowMARForm(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition duration-200"
          >
            Record Administration
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Service User
        </label>
        <select
          value={selectedResident}
          onChange={(e) => setSelectedResident(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Service Users</option>
          {serviceUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </select>
      </div>

      {showMedicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">Add Resident Medication</h3>
            </div>

            <form onSubmit={handleMedicationSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service User *
                </label>
                <select
                  required
                  value={medicationFormData.resident_id}
                  onChange={(e) => setMedicationFormData({ ...medicationFormData, resident_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select...</option>
                  {serviceUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication *
                </label>
                <select
                  required
                  value={medicationFormData.medication_id}
                  onChange={(e) => setMedicationFormData({ ...medicationFormData, medication_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select...</option>
                  {medications.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    value={medicationFormData.dosage}
                    onChange={(e) => setMedicationFormData({ ...medicationFormData, dosage: e.target.value })}
                    placeholder="e.g., 500mg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency *
                  </label>
                  <input
                    type="text"
                    required
                    value={medicationFormData.frequency}
                    onChange={(e) => setMedicationFormData({ ...medicationFormData, frequency: e.target.value })}
                    placeholder="e.g., Twice daily"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={medicationFormData.start_date}
                    onChange={(e) => setMedicationFormData({ ...medicationFormData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={medicationFormData.end_date}
                    onChange={(e) => setMedicationFormData({ ...medicationFormData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetMedicationForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition duration-200"
                >
                  Add Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMARForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">Record Medication Administration</h3>
            </div>

            <form onSubmit={handleMARSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resident Medication *
                </label>
                <select
                  required
                  value={marFormData.resident_medication_id}
                  onChange={(e) => {
                    const selectedRM = residentMedications.find(rm => rm.id === e.target.value);
                    setMarFormData({
                      ...marFormData,
                      resident_medication_id: e.target.value,
                      resident_id: selectedRM?.resident_id || '',
                      dosage_given: selectedRM?.dosage || '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select...</option>
                  {residentMedications.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.resident_name} - {rm.medication_name} ({rm.dosage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={marFormData.administered_at}
                    onChange={(e) => setMarFormData({ ...marFormData, administered_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={marFormData.administered_time}
                    onChange={(e) => setMarFormData({ ...marFormData, administered_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={marFormData.status}
                    onChange={(e) => setMarFormData({ ...marFormData, status: e.target.value as MARRecord['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="given">Given</option>
                    <option value="refused">Refused</option>
                    <option value="missed">Missed</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage Given
                  </label>
                  <input
                    type="text"
                    value={marFormData.dosage_given}
                    onChange={(e) => setMarFormData({ ...marFormData, dosage_given: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={marFormData.notes}
                  onChange={(e) => setMarFormData({ ...marFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetMARForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition duration-200"
                >
                  Record Administration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Active Medications</h3>
          </div>
          <div className="p-6">
            {residentMedications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active medications</p>
            ) : (
              <div className="space-y-3">
                {residentMedications.map((rm) => (
                  <div key={rm.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">{rm.medication_name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {rm.resident_name} - {rm.dosage} ({rm.frequency})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Recent MAR Records</h3>
          </div>
          <div className="p-6">
            {marRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No MAR records</p>
            ) : (
              <div className="space-y-3">
                {marRecords.map((record) => (
                  <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {record.administered_at} at {record.administered_time}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === 'given'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'refused'
                            ? 'bg-red-100 text-red-800'
                            : record.status === 'missed'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                    {record.notes && (
                      <div className="text-sm text-gray-600 mt-1">{record.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MARPage;
