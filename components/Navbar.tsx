
import React from 'react';

interface NavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
  const navItems = [
    { label: 'Home', id: 'home' },
    { label: 'Events', id: 'events' },
    { label: 'Private Events', id: 'private-events' },
    { label: 'About', id: 'about' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-xl border-b border-brand-border/50 px-4 md:px-6 py-3 md:py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 group"
        >
          <div className="relative">
            <span className="text-2xl md:text-3xl font-medium logo-font text-brand-text group-hover:text-brand-gold transition-colors duration-500">
              Weekplore
            </span>
          </div>
        </button>
        
        <div className="hidden md:flex gap-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 relative group ${
                activePage === item.id 
                  ? 'text-brand-text' 
                  : 'text-brand-text/50 hover:text-brand-text'
              }`}
            >
              {item.label}
              <span className={`absolute -bottom-1 left-0 h-[2px] bg-brand-gold transition-all duration-500 ${
                activePage === item.id ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </button>
          ))}
        </div>

        {activePage !== 'admin' && (
          <button 
            onClick={() => onNavigate(activePage === 'events' ? 'about' : 'events')}
            className="bg-brand-text text-brand-bg px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-brand-gold transition-colors"
          >
            {activePage === 'events' ? 'About' : 'Book Now'}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
