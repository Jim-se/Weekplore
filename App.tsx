
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Events from './pages/Events';
import About from './pages/About';
import PrivateEvents from './pages/PrivateEvents';
import EventDetail from './pages/EventDetail';
import Admin from './pages/Admin';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');

  // Simple hash-based navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setCurrentPage(hash);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (page: string) => {
    window.location.hash = page;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    if (currentPage === 'admin') {
      return <Admin onNavigate={navigate} />;
    }

    if (currentPage.startsWith('event/')) {
      const slug = currentPage.split('/')[1];
      return <EventDetail slug={slug} onNavigate={navigate} />;
    }

    switch (currentPage) {
      case 'events': return <Events />;
      case 'about': return <About />;
      case 'private-events': return <PrivateEvents />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen selection:bg-gray-200 selection:text-brand-text">
      <Navbar activePage={currentPage} onNavigate={navigate} />
      
      <main className="transition-opacity duration-500 animate-in fade-in">
        {renderPage()}
      </main>

      <footer className="border-t border-brand-border py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold serif-font mb-2">WEEKPLORE</h2>
            <p className="text-sm opacity-60">Creating experiences, one weekend at a time.</p>
          </div>
          <div className="flex gap-8 text-xs uppercase tracking-widest font-bold">
            <button onClick={() => navigate('home')} className="hover:text-brand-accent">Home</button>
            <button onClick={() => navigate('events')} className="hover:text-brand-accent">Events</button>
            <button onClick={() => navigate('private-events')} className="hover:text-brand-accent">Private Events</button>
            <button onClick={() => navigate('about')} className="hover:text-brand-accent">About</button>
            <button onClick={() => navigate('admin')} className="text-brand-gold/40 hover:text-brand-gold">Admin</button>
          </div>
          <div className="text-xs opacity-40">
            © 2024 Weekplore Recreational Events. Kalamata, Greece.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
