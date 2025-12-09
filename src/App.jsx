import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import AppRouter from './router/index';
import { AuthProvider } from './context/AuthContext';
import { useUserActivity } from './hooks/useUserActivity';

function AppContent() {
  // Track user activity for online status
  useUserActivity();

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#0f172a', // slate-900
            color: '#fff',
            border: '1px solid #1e293b',
          },
        }}
      />
      <AppRouter />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;