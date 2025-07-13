import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItemClass = (path) =>
    `relative text-base font-medium px-4 py-2 transition-all duration-300
     ${location.pathname === path ? 'text-indigo-700' : 'text-gray-900 hover:text-indigo-600'}
     after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 
     after:w-0 after:h-[2px] after:bg-indigo-600 after:transition-all after:duration-300 
     hover:after:w-full`;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/40 backdrop-blur-md shadow-md">
      <div className="relative max-w-7xl mx-auto px-6 py-3 flex items-center justify-center">
        
        {/* Mobile menu button */}
        <div className="absolute ml-4 left-0 md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-900 hover:text-indigo-600 transition">
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Left link (Individual Data) */}
        <div className="hidden md:block absolute left-0">
          <Link to="/individual" className={navItemClass('/individual')}>Individual Data</Link>
        </div>

        {/* Right link (Contingent Data) */}
        <div className="hidden md:block absolute right-0">
          <Link to="/contingent" className={navItemClass('/contingent')}>Contingent Data</Link>
        </div>

        {/* Center - Logo and Title */}
        <div className="flex items-center space-x-2">
          <img src="/unosq-logo.png" alt="UNOSQ Logo" className="h-10 w-10 object-contain" />
          <Link
            to="/"
            className="text-2xl sm:text-3xl font-extrabold tracking-widest text-gray-900 hover:text-indigo-700 transition-all duration-300"
          >
            UNOSQ'25
          </Link>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col space-y-2 bg-white/80 backdrop-blur-md shadow-md">
          <Link
            to="/individual"
            className={navItemClass('/individual')}
            onClick={() => setMenuOpen(false)}
          >
            Individual Data
          </Link>
          <Link
            to="/contingent"
            className={navItemClass('/contingent')}
            onClick={() => setMenuOpen(false)}
          >
            Contingent Data
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
