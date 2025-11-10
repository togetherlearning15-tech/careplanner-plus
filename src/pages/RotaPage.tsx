import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-care';

interface Shift {
  id?: string;
  resident_id: string;
  assigned_staff_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  location: string;
  status: string;
  tasks_description: string;
  resident_name?: string;
  staff_name?: string;
}

function RotaPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [serviceUsers, setServiceUsers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [formData, setFormData] = useState<Shift>({
    resident_id: '',
    assigned_staff_id: '',
    shift_date: '',
    start_time: '',
    end_time: '',
    shift_type: '',
    location: '',
    status: 'scheduled',
    tasks_description: '',
  });

  useEffect(() => {
    fetchData();
  }, [currentWeek]);

  const fetchData = async () => {
    try {
      const weekStart = getWeekStart(currentWeek);
      const weekEnd = getWeekEnd(currentWeek);

      const [shiftsResult, usersResult, staffResult] = await Promise.all([
        supabase
          .from('shifts')
          .select('*')
          .gte('shift_date', weekStart)
          .lte('shift_date', weekEnd)
          .order('shift_date')
          .order('start_time'),
        supabase.from('service_users').select('id, full_name').eq('is_active', true),
        supabase.from('staff').select('id, full_name').eq('is_active', true),
      ]);

      if (shiftsResult.error) throw shiftsResult.error;
      if (usersResult.error) throw usersResult.error;
      if (staffResult.error) throw staffResult.error;

      const enrichedShifts = (shiftsResult.data || []).map((shift: any) => ({
        ...shift,
        resident_name: usersResult.data?.find((u: any) => u.id === shift.resident_id)?.full_name || 'Unknown',
        staff_name: staffResult.data?.find((s: any) => s.id === shift.assigned_staff_id)?.full_name || 'Unassigned',
      }));

      setShifts(enrichedShifts);
      setServiceUsers(usersResult.data || []);
      setStaff(staffResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const getWeekEnd = (date: Date) => {
    const start = new Date(getWeekStart(date));
    start.setDate(start.getDate() + 6);
    return start.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('shifts')
        .insert([formData]);

      if (error) throw error;

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating shift:', error);
      alert('Failed to create shift');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting shift:', error);
      alert('Failed to delete shift');
    }
  };

  const resetForm = () => {
    setFormData({
      resident_id: '',
      assigned_staff_id: '',
      shift_date: '',
      start_time: '',
      end_time: '',
      shift_type: '',
      location: '',
      status: 'scheduled',
      tasks_description: '',
    });
    setShowForm(false);
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(getWeekStart(currentWeek));
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const weekDates = getWeekDates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800">Rota / Shifts</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeWeek('prev')}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              ←
            </button>
            <span className="text-sm text-gray-600">
              Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
            </span>
            <button
              onClick={() => changeWeek('next')}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              →
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition duration-200"
        >
          New Shift
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">Create New Shift</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service User
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Staff
                  </label>
                  <select
                    required
                    value={formData.assigned_staff_id}
                    onChange={(e) => setFormData({ ...formData, assigned_staff_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select...</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.shift_date}
                    onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift Type
                  </label>
                  <input
                    type="text"
                    value={formData.shift_type}
                    onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                    placeholder="Morning, Afternoon, Night"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasks Description
                </label>
                <textarea
                  value={formData.tasks_description}
                  onChange={(e) => setFormData({ ...formData, tasks_description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  Create Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shifts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No shifts scheduled for this week. Click "New Shift" to create one.
                </td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(shift.shift_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shift.start_time} - {shift.end_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shift.resident_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shift.staff_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shift.shift_type || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        shift.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : shift.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {shift.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(shift.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RotaPage;
