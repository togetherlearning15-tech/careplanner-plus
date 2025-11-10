import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-care';
import { useCarePlannerAuth } from '../contexts/CarePlannerAuth';

interface DailyNote {
  id?: string;
  resident_id: string;
  note_date: string;
  note_time: string;
  note_type: 'daily_note' | 'medication' | 'incident' | 'handover' | 'community';
  content: string;
  recorded_by: string;
  resident_name?: string;
  created_at?: string;
}

function DailyNotesPage() {
  const { user } = useCarePlannerAuth();
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [serviceUsers, setServiceUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterResident, setFilterResident] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<DailyNote>({
    resident_id: '',
    note_date: new Date().toISOString().split('T')[0],
    note_time: new Date().toTimeString().slice(0, 5),
    note_type: 'daily_note',
    content: '',
    recorded_by: user?.email || '',
  });

  useEffect(() => {
    fetchServiceUsers();
    fetchNotes();
  }, [filterResident, filterDate]);

  const fetchServiceUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('service_users')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setServiceUsers(data || []);
    } catch (error) {
      console.error('Error fetching service users:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      let query = supabase
        .from('daily_notes')
        .select('*')
        .order('note_date', { ascending: false })
        .order('note_time', { ascending: false });

      if (filterResident) {
        query = query.eq('resident_id', filterResident);
      }

      if (filterDate) {
        query = query.eq('note_date', filterDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const enrichedNotes = (data || []).map((note: any) => ({
        ...note,
        resident_name: serviceUsers.find((u) => u.id === note.resident_id)?.full_name || 'Unknown',
      }));

      setNotes(enrichedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('daily_notes')
        .insert([{ ...formData, recorded_by: user?.email || formData.recorded_by }]);

      if (error) throw error;

      resetForm();
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('daily_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const resetForm = () => {
    setFormData({
      resident_id: '',
      note_date: new Date().toISOString().split('T')[0],
      note_time: new Date().toTimeString().slice(0, 5),
      note_type: 'daily_note',
      content: '',
      recorded_by: user?.email || '',
    });
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Daily Notes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition duration-200"
        >
          Add Note
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Service User
            </label>
            <select
              value={filterResident}
              onChange={(e) => setFilterResident(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Service Users</option>
              {serviceUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">Add Daily Note</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service User *
                </label>
                <select
                  required
                  value={formData.resident_id}
                  onChange={(e) => setFormData({ ...formData, resident_id: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.note_date}
                    onChange={(e) => setFormData({ ...formData, note_date: e.target.value })}
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
                    value={formData.note_time}
                    onChange={(e) => setFormData({ ...formData, note_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Type *
                </label>
                <select
                  required
                  value={formData.note_type}
                  onChange={(e) => setFormData({ ...formData, note_type: e.target.value as DailyNote['note_type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="daily_note">Daily Note</option>
                  <option value="medication">Medication</option>
                  <option value="incident">Incident</option>
                  <option value="handover">Handover</option>
                  <option value="community">Community</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter note details..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition duration-200"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center text-gray-500">
            No notes found for the selected filters.
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-white rounded-2xl shadow border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {serviceUsers.find((u) => u.id === note.resident_id)?.full_name || 'Unknown'}
                  </h3>
                  <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                    <span>{note.note_date}</span>
                    <span>•</span>
                    <span>{note.note_time}</span>
                    <span>•</span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">
                      {note.note_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(note.id!)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Delete
                </button>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-500">
                Recorded by: {note.recorded_by}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DailyNotesPage;
