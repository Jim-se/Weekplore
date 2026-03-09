
import React, { useEffect, useState } from 'react';

interface NavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Αρχική', id: 'home' },
    { label: 'Εκδηλώσεις', id: 'events' },
    { label: 'Ιδιωτικές Εκδηλώσεις', id: 'private-events' },
    { label: 'Ποιοι Είμαστε', id: 'about' },
  ];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activePage]);

  const handleNavigate = (page: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(page);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-brand-border/50 bg-brand-bg/90 px-4 py-3 backdrop-blur-xl md:px-6 md:py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <button
          onClick={() => handleNavigate('home')}
          className="group flex items-center gap-1"
        >
          <div className="relative">
            <span className="logo-font text-2xl font-medium text-brand-text transition-colors duration-500 group-hover:text-brand-gold md:text-3xl">
              Weekplore
            </span>
          </div>
        </button>

        <div className="hidden gap-10 md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 relative group ${activePage === item.id
                ? 'text-brand-text'
                : 'text-brand-text/50 hover:text-brand-text'
                }`}
            >
              {item.label}
              <span className={`absolute -bottom-1 left-0 h-[2px] bg-brand-gold transition-all duration-500 ${activePage === item.id ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
            </button>
          ))}
        </div>

        {activePage !== 'admin' && (
          <button
            onClick={() => handleNavigate(activePage === 'events' ? 'about' : 'events')}
            className="hidden min-h-11 items-center justify-center rounded-full bg-brand-text px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-bg transition-colors hover:bg-brand-gold md:inline-flex"
          >
            {activePage === 'events' ? 'Ποιοι Είμαστε' : 'Κάνε Κράτηση'}
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-brand-border bg-white/80 p-2 text-brand-text transition-colors hover:border-brand-gold hover:text-brand-gold md:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="mx-auto mt-3 max-w-7xl rounded-[28px] border border-brand-border bg-white/95 p-3 shadow-xl md:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex min-h-11 items-center justify-between rounded-2xl px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.22em] transition-colors ${activePage === item.id
                  ? 'bg-brand-text text-brand-bg'
                  : 'bg-brand-bg/60 text-brand-text hover:bg-brand-bg'
                  }`}
              >
                <span>{item.label}</span>
                <span className="text-brand-gold">/</span>
              </button>
            ))}

            {activePage !== 'admin' && (
              <button
                onClick={() => handleNavigate(activePage === 'events' ? 'about' : 'events')}
                className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-brand-text px-5 py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-bg transition-colors hover:bg-brand-gold"
              >
                {activePage === 'events' ? 'Î Î¿Î¹Î¿Î¹ Î•Î¯Î¼Î±ÏƒÏ„Îµ' : 'ÎšÎ¬Î½Îµ ÎšÏÎ¬Ï„Î·ÏƒÎ·'}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
