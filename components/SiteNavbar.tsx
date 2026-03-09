import React, { useEffect, useState } from 'react';

interface SiteNavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { label: 'Αρχική', id: 'home' },
  { label: 'Εκδηλώσεις', id: 'events' },
  { label: 'Ιδιωτικές Εκδηλώσεις', id: 'private-events' },
  { label: 'Ποιοι Είμαστε', id: 'about' },
];

const SiteNavbar: React.FC<SiteNavbarProps> = ({ activePage, onNavigate }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [activePage]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen]);

  const handleNavigate = (page: string) => {
    setIsDrawerOpen(false);
    onNavigate(page);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-brand-border/50 bg-brand-bg/90 px-4 py-3 backdrop-blur-xl md:px-6 md:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            onClick={() => handleNavigate('home')}
            className="group flex items-center gap-1"
          >
            <span className="logo-font text-2xl font-medium text-brand-text transition-colors duration-500 group-hover:text-brand-gold md:text-3xl">
              Weekplore
            </span>
          </button>

          <div className="hidden gap-10 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`group relative text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                  activePage === item.id
                    ? 'text-brand-text'
                    : 'text-brand-text/50 hover:text-brand-text'
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] bg-brand-gold transition-all duration-500 ${
                    activePage === item.id ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
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
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-brand-border bg-white/80 p-2 text-brand-text transition-colors hover:border-brand-gold hover:text-brand-gold md:hidden"
            aria-expanded={isDrawerOpen}
            aria-label="Open navigation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </nav>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end md:hidden" aria-modal="true" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-brand-text/45 backdrop-blur-[2px]"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close navigation"
          />

          <aside className="relative flex h-full w-[min(88vw,22rem)] flex-col border-l border-brand-border bg-brand-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-border/60 px-5 py-4">
              <span className="logo-font text-2xl font-medium text-brand-text">Weekplore</span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-brand-gold p-2 text-brand-gold transition-colors hover:bg-brand-gold hover:text-white"
                aria-label="Close navigation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav aria-label="Mobile navigation" className="flex flex-1 flex-col px-4 py-6">
              <div className="grid gap-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex min-h-12 items-center rounded-2xl px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.22em] transition-colors ${
                      activePage === item.id
                        ? 'bg-brand-text text-brand-bg'
                        : 'bg-white text-brand-text hover:bg-brand-bg/60'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {activePage !== 'admin' && (
                <button
                  onClick={() => handleNavigate(activePage === 'events' ? 'about' : 'events')}
                  className="mt-auto flex min-h-12 items-center justify-center rounded-full bg-brand-text px-5 py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-bg transition-colors hover:bg-brand-gold"
                >
                  {activePage === 'events' ? 'Ποιοι Είμαστε' : 'Κάνε Κράτηση'}
                </button>
              )}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default SiteNavbar;
