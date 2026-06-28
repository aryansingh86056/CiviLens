import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, Plus, Home, User, Search, X } from 'lucide-react';
import EmailPreviewModal from './EmailPreviewModal';

export default function NavigationLayout() {
  const { isLoggedIn, searchQuery, setSearchQuery, theme, viewingDetailId } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Redirect if not logged in
  if (!isLoggedIn) {
    setTimeout(() => {
      navigate('/');
    }, 0);
    return null;
  }

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/report', label: 'Add report', icon: Plus, isHighlighted: true },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col font-sans pb-28 relative overflow-x-hidden transition-colors duration-250 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-black text-slate-200'}`}>
      {/* Dynamic Background Glows */}
      <div className={`absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-35 pointer-events-none ${isLight ? 'invert opacity-15' : 'opacity-40'}`}></div>
      
      {/* Top Header Navbar */}
      {!viewingDetailId && (
        <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b transition-colors duration-250 ${isLight ? 'bg-white/85 border-slate-200' : 'bg-black/85 border-slate-800/80'}`}>
          <nav className="max-w-4xl w-full mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                <Eye className="h-4.5 w-4.5 text-white stroke-[2.5]" />
              </div>
              <span className={`text-xl font-bold tracking-tight transition-colors duration-250 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                CiviLens
              </span>
            </Link>

            {/* Search Toggle Icon */}
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center border ${
                isSearchExpanded 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              {isSearchExpanded ? <X className="h-4.5 w-4.5" /> : <Search className="h-4.5 w-4.5" />}
            </button>
          </nav>

          {/* Full-width Search Bar Expansion under the Logo and Search toggle */}
          {isSearchExpanded && (
            <div className={`overflow-hidden border-t ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
              <div className="px-4 md:px-6 py-3.5 max-w-4xl w-full mx-auto">
                <div className={`relative flex items-center w-full border rounded-full px-4 py-2.5 shadow-inner transition-colors duration-250 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'}`}>
                  <Search className="h-4.5 w-4.5 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports by title, location, or descriptions..."
                    className={`bg-transparent text-sm focus:outline-none w-full ${isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'}`}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`p-1 rounded-full transition-colors cursor-pointer ${isLight ? 'hover:bg-slate-200 text-slate-400 hover:text-slate-600' : 'hover:bg-slate-850 text-slate-500 hover:text-slate-300'}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Outlet for Render Pages */}
      <main className={`flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 pb-6 z-10 relative ${!viewingDetailId ? 'pt-20' : 'pt-6'}`}>
        <div className="h-full">
          <Outlet />
        </div>
      </main>

      {/* Bottom Floating Navigation (Universal 3-option Dock with Highlighted Add Report) */}
      {!viewingDetailId && (
        <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 border p-2.5 rounded-full shadow-2xl backdrop-blur-xl w-[calc(100%-2rem)] max-w-xs transition-colors duration-250 ${
          isLight ? 'bg-white/95 border-slate-200/80 shadow-slate-200/50' : 'bg-[#121214]/90 border-zinc-900/80'
        }`}>
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              
              if (item.isHighlighted) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex flex-col items-center relative -top-4"
                  >
                    <div
                      className={`h-11 w-11 rounded-full flex items-center justify-center shadow-lg transition-all ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-blue-500/40' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
                      }`}
                    >
                      <IconComponent className="h-5.5 w-5.5 stroke-[3]" />
                    </div>
                    <span
                      className={`text-[9px] font-bold mt-1 transition-colors duration-200 ${
                        isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-0.5 relative px-3 py-1"
                >
                  <div
                    className={`p-1.5 rounded-full transition-colors duration-200 ${
                      isActive 
                        ? isLight ? 'text-blue-600 bg-blue-50' : 'text-blue-500 bg-blue-950/40'
                        : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconComponent className="h-4.5 w-4.5 stroke-[2]" />
                  </div>
                  <span
                    className={`text-[9px] font-bold transition-colors duration-200 ${
                      isActive 
                        ? isLight ? 'text-slate-900 font-extrabold' : 'text-slate-200 font-extrabold' 
                        : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -top-3.5 h-[2px] w-6 bg-blue-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      <EmailPreviewModal />
    </div>
  );
}
