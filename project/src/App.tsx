import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase, checkConnection } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import Navbar from './components/Navbar';
import ConnectionStatus from './components/ConnectionStatus';
import { Auth, Dashboard, DocumentEditor, Documents, Templates, Settings, NotFound } from './pages';

function App() {
  const { setUser, setSession } = useAuthStore();

  useEffect(() => {
    // Check connection status periodically
    const checkConnectionStatus = async () => {
      await checkConnection();
    };

    checkConnectionStatus();
    const connectionInterval = setInterval(checkConnectionStatus, 30000); // Check every 30 seconds

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(connectionInterval);
    };
  }, [setUser, setSession]);

  return (
    <Router>
      <div 
        className="min-h-screen relative bg-gradient-to-br from-gray-50/95 to-gray-100/95 dark:from-gray-900/95 dark:to-gray-800/95"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 to-gray-100/95 dark:from-gray-900/95 dark:to-gray-800/95" />
        <div className="relative z-10">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/editor/:id?" element={<DocumentEditor />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <ConnectionStatus />
        </div>
      </div>
    </Router>
  );
}

export default App;