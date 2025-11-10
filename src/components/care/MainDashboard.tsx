import { useState } from 'react';
import { useCarePlannerAuth } from '../../contexts/CarePlannerAuth';
import ServiceUsersModule from './ServiceUsersModule';
import StaffModule from './StaffModule';
import RotaModule from './RotaModule';
import DailyNotesModule from './DailyNotesModule';
import MARModule from './MARModule';

type ViewType =
  | 'dashboard'
  | 'service-users'
  | 'staff'
  | 'rota'
  | 'mar'
  | 'daily-notes'
  | 'incidents'
  | 'compliance'
  | 'documents';

function MainDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { user, signOut } = useCarePlannerAuth();

  const menuItems: { view: ViewType; label: string; icon: string }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: '📊' },
    { view: 'service-users', label: 'Service Users', icon: '👥' },
    { view: 'staff', label: 'Staff', icon: '👨‍⚕️' },
    { view: 'rota', label: 'Rota', icon: '📅' },
    { view: 'mar', label: 'MAR', icon: '💊' },
    { view: 'daily-notes', label: 'Daily Notes', icon: '📝' },
    { view: 'incidents', label: 'Incidents', icon: '⚠️' },
    { view: 'compliance', label: 'Compliance', icon: '✅' },
    { view: 'documents', label: 'Documents', icon: '📄' },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Service Users</h3>
                <p className="text-3xl font-bold text-teal-600">--</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Staff on Duty</h3>
                <p className="text-3xl font-bold text-teal-600">--</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Tasks</h3>
                <p className="text-3xl font-bold text-teal-600">--</p>
              </div>
            </div>
          </div>
        );
      case 'service-users':
        return <ServiceUsersModule />;
      case 'staff':
        return <StaffModule />;
      case 'rota':
        return <RotaModule />;
      case 'mar':
        return <MARModule />;
      case 'daily-notes':
        return <DailyNotesModule />;
      case 'incidents':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Incident Reports</h2>
            <p className="text-gray-600">Incident reporting module coming soon...</p>
          </div>
        );
      case 'compliance':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Compliance</h2>
            <p className="text-gray-600">Compliance tracking module coming soon...</p>
          </div>
        );
      case 'documents':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Documents</h2>
            <p className="text-gray-600">Document management module coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-teal-600">CarePlanner+</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`w-full text-left px-4 py-3 rounded-lg transition duration-200 flex items-center space-x-3 ${
                currentView === item.view
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm font-medium text-gray-700 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition duration-200"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {menuItems.find(item => item.view === currentView)?.label || 'Dashboard'}
            </h2>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default MainDashboard;
