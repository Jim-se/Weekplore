
import React, { useState, useEffect } from 'react';
import SiteNavbar from './components/SiteNavbar';
import Home from './pages/Home';
import Events from './pages/Events';
import About from './pages/About';
import PrivateEvents from './pages/PrivateEventsView';
import EventDetail from './pages/EventDetail';
import Admin from './pages/Admin';
import { LanguageProvider } from './lib/LanguageContext';

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
    <LanguageProvider>
      <div className="min-h-screen selection:bg-gray-200 selection:text-brand-text">
        <SiteNavbar activePage={currentPage} onNavigate={navigate} />

        <main className="transition-opacity duration-500 animate-in fade-in">
          {renderPage()}
        </main>

        <footer className="border-t border-brand-border bg-white px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row md:items-start">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold serif-font mb-2">WEEKPLORE</h2>
              <p className="text-sm opacity-60">Δημιουργούμε εμπειρίες, ένα Σαββατοκύριακο τη φορά.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-center text-[10px] font-bold uppercase tracking-[0.22em] sm:gap-x-8">
              <button onClick={() => navigate('home')} className="hover:text-brand-accent">Αρχική</button>
              <button onClick={() => navigate('events')} className="hover:text-brand-accent">Εκδηλώσεις</button>
              <button onClick={() => navigate('private-events')} className="hover:text-brand-accent">Ιδιωτικές Εκδηλώσεις</button>
              <button onClick={() => navigate('about')} className="hover:text-brand-accent">Ποιοι Είμαστε</button>
              <button onClick={() => navigate('admin')} className="text-brand-gold/40 hover:text-brand-gold">Διαχείριση</button>
            </div>
            <div className="text-center text-xs opacity-40 md:text-right">
              © 2024 Weekplore Recreational Events.
            </div>
          </div>
        </footer>
      </div>
    </LanguageProvider>
  );
};

export default App;
