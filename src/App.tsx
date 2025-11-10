import { useCarePlannerAuth } from './contexts/CarePlannerAuth';
import LoginPage from './components/care/LoginPage';
import MainDashboard from './components/care/MainDashboard';

function App() {
  const { user, loading } = useCarePlannerAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return user ? <MainDashboard /> : <LoginPage />;
}

export default App;
