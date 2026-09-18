import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/editor', label: 'Formulation Editor' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 bg-cyber-panel border-b border-cyber-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyber-lime rounded-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-cyber-dark" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-bold text-lg leading-none">CYBER-AGRI</div>
                <div className="text-cyber-lime text-xs font-mono leading-none mt-0.5">FORMULATION SYSTEM</div>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-cyber-lime border-b-2 border-cyber-lime'
                      : 'text-cyber-light hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Utility Actions */}
          <div className="flex items-center space-x-4">
            <div className="text-xs font-mono text-cyber-light">
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
            <div className="w-2 h-2 bg-cyber-emerald rounded-full animate-pulse" title="System Online"></div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
