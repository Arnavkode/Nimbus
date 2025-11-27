import React, { useState, useRef, useEffect } from 'react';
import { 
  User, ChevronDown, Plus, UploadCloud, 
  File, Folder, Settings, LogOut, FileText, ImageIcon, 
  Search, HardDrive, FolderPlus, Clock, CheckCircle, AlertTriangle, ArrowRight,
  Database, Server, Loader2, LayoutDashboard, Archive, Sun, Moon, Menu, X
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import FileBrowser from './FileBrowser';
import BackupList from './BackupList';

// --- REAL API CALLS ---
const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;

const api = {
  fetchDashboardData: async () => {
    const uid = localStorage.getItem('uid');
    if (!uid) throw new Error('No user ID found');
    
    try {
      // Fetch backups and storage in parallel
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const [backupsResponse, storageResponse] = await Promise.all([
        fetch(`${API_BASE}/backups?uid=${uid}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        }),
        fetch(`${baseUrl}/api/storage/${uid}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })
      ]);
      
      const backups = await backupsResponse.json();
      const storageData = await storageResponse.json();
      
      // Get storage used from the endpoint (convert bytes to GB)
      const storageUsedGB = storageData.usedBytes ? (storageData.usedBytes / (1024 * 1024 * 1024)) : 0;
      const storageUsedPretty = storageData.usedPretty || '0 B';
      
      return {
        storageUsed: storageUsedGB,
        storageUsedPretty: storageUsedPretty,
        storageTotal: 100 / 1024, // 100 MB in GB
        backups: backups.map(backup => ({
          id: backup.fid,
          name: backup.fname,
          type: backup.ftype || 'file',
          status: 'Synced',
          lastModified: new Date(backup.fsavedtime).toLocaleString(),
          size: formatBytes(backup.fsize)
        }))
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return { storageUsed: 0, storageUsedPretty: '0 B', storageTotal: 100 / 1024, backups: [] };
    }
  },
  
  fetchUserInfo: () => {
    const username = localStorage.getItem('username');
    const uid = localStorage.getItem('uid');
    return Promise.resolve({ username: username || 'Guest', uid });
  },
  
  logout: () => {
    localStorage.removeItem('username');
    localStorage.removeItem('uid');
    window.location.href = '/';
  },
};

// Helper function to format bytes
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  // Convert to number if it's a string
  const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(numBytes) || numBytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return Math.round(numBytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
// --- End of API ---


// --- Logo Component (Scaled Up 200%) ---
const NimbusVaultLogo = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
    <path d="M14.0003 6.00003C14.0003 4.89546 13.1048 4.00003 12.0003 4.00003C10.8957 4.00003 10.0003 4.89546 10.0003 6.00003C10.0003 7.10459 10.8957 8.00003 12.0003 8.00003C13.1048 8.00003 14.0003 7.10459 14.0003 6.00003Z" fill="currentColor"/>
    <path d="M18.0003 10.0001C18.0003 8.89551 17.1048 8.00009 16.0003 8.00009C14.8957 8.00009 14.0003 8.89551 14.0003 10.0001C14.0003 11.1046 14.8957 12.0001 16.0003 12.0001C17.1048 12.0001 18.0003 11.1046 18.0003 10.0001Z" fill="currentColor"/>
    <path d="M10.0003 10.0001C10.0003 8.89551 9.10484 8.00009 8.00028 8.00009C6.89571 8.00009 6.00028 8.89551 6.00028 10.0001C6.00028 11.1046 6.89571 12.0001 8.00028 12.0001C9.10484 12.0001 10.0003 11.1046 10.0003 10.0001Z" fill="currentColor"/>
    <path d="M12.0003 14.0001C12.0003 12.8955 11.1048 12.0001 10.0003 12.0001C8.89571 12.0001 8.00028 12.8955 8.00028 14.0001C8.00028 15.1046 8.89571 16.0001 10.0003 16.0001C11.1048 16.0001 12.0003 15.1046 12.0003 14.0001Z" fill="currentColor"/>
    <path d="M16.0003 14.0001C16.0003 12.8955 15.1048 12.0001 14.0003 12.0001C12.8957 12.0001 12.0003 12.8955 12.0003 14.0001C12.0003 15.1046 12.8957 16.0001 14.0003 16.0001C15.1048 16.0001 16.0003 15.1046 16.0003 14.0001Z" fill="currentColor"/>
    <path d="M19.4648 15.1056C19.941 14.3971 19.9862 13.5186 19.5668 12.7846C19.1474 12.0506 18.338 11.6053 17.5003 11.6053C17.078 11.6053 16.6743 11.7251 16.3333 11.9429C15.9322 10.8803 15.0116 10.0938 13.8672 9.80008C12.7228 9.50637 11.5005 9.74371 10.5363 10.4376C9.57211 11.1316 9.00028 12.2039 9.00028 13.3948C9.00028 13.6335 9.02244 13.8696 9.06579 14.1001C8.12195 14.218 7.26618 14.7119 6.68006 15.4611C6.09395 16.2103 5.83633 17.1481 5.97818 18.067C6.11904 18.9859 6.64775 19.78 7.42028 20.2443C7.42028 20.2443 7.42028 20.2443 7.42054 20.2442C8.36973 20.803 9.51528 20.916 10.5401 20.536C11.5649 20.156 12.3394 19.3308 12.651 18.2813C12.8727 18.5985 13.1557 18.8687 13.4851 19.0763C14.0321 19.421 14.673 19.5968 15.3216 19.5968C16.3769 19.5968 17.382 19.167 18.1003 18.4286C19.1003 17.3978 19.6432 16.3093 19.4648 15.1056Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// --- Global Animated Background Styles ---
const AnimatedBackgroundStyles = () => (
  <style>
    {`
      @keyframes gradient-animation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      .animated-gradient-bg {
        background: linear-gradient(-45deg, #0f172a, #130724, #030a1c, #0b3038);
        background-size: 400% 400%;
        animation: gradient-animation 15s ease infinite;
      }
    `}
  </style>
);

// --- Dashboard Header Component (Scaled Up 200% + Mobile Responsive) ---
const DashboardHeader = ({ username, onMenuClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    api.logout();
  };

  return (
    <header className="flex items-center p-4 sm:p-6 md:p-12 h-auto sm:h-32 md:h-48 bg-black/20 dark:bg-white/20 backdrop-blur-lg border-b border-white/10 dark:border-gray-300/20 sticky top-0 z-30">
      {/* Left: Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden mr-3 sm:mr-4 p-2 rounded-lg hover:bg-white/5 transition-all touch-manipulation"
        aria-label="Toggle menu"
      >
        <Menu size={24} className="text-white dark:text-gray-900" />
      </button>

      {/* Middle: Search */}
      <div className="relative flex-1 max-w-6xl">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-6 md:pl-10">
          <Search size={20} className="sm:w-6 sm:h-6 md:w-12 md:h-12 text-gray-400 dark:text-gray-900" />
        </span>
        <input
          type="text"
          placeholder="Search files..."
          className="w-full pl-10 sm:pl-14 md:pl-28 pr-3 sm:pr-6 md:pr-10 py-2 sm:py-4 md:py-8 bg-gray-900/50 dark:bg-white/50 border-2 border-gray-700 dark:border-gray-300 rounded-lg sm:rounded-xl md:rounded-2xl text-sm sm:text-2xl md:text-4xl text-gray-200 dark:text-gray-900
                 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
        />
      </div>

      {/* Right: User Menu */}
      <div className="relative flex items-center gap-3 sm:gap-6 md:gap-8 ml-2 sm:ml-4 md:ml-auto">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 sm:gap-4 md:gap-6 px-2 sm:px-4 md:px-8 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-white/5 transition-all touch-manipulation"
        >
          <User size={32} className="sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-cyan-800 p-1 sm:p-2 md:p-4" />
          <span className="text-base sm:text-2xl md:text-4xl text-gray-300 dark:text-gray-900 hidden sm:block">{username}</span>
          <ChevronDown size={20} className="sm:w-8 sm:h-8 md:w-12 md:h-12 text-gray-500 dark:text-gray-900 transition-transform ${showDropdown ? 'rotate-180' : ''}" />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            {/* Backdrop to close dropdown */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Content */}
            <div className="absolute right-0 top-full mt-2 sm:mt-4 w-64 sm:w-80 md:w-96 rounded-xl sm:rounded-2xl shadow-2xl bg-black/40 dark:bg-white/40 backdrop-blur-xl border-2 border-white/20 dark:border-gray-300/20 overflow-hidden z-50">
              {/* User Info Section */}
              <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-b border-white/10">
                <div className="flex items-center gap-3 sm:gap-4 mb-2">
                  <User size={32} className="sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-cyan-800 p-1 sm:p-2 md:p-3" />
                  <div>
                    <p className="text-lg sm:text-2xl md:text-3xl font-semibold text-white dark:text-gray-900">{username}</p>
                    <p className="text-sm sm:text-xl md:text-2xl text-gray-400 dark:text-gray-900">Logged in</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2 sm:py-3 md:py-4">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // Navigate to settings if needed
                  }}
                  className="w-full flex items-center gap-3 sm:gap-4 md:gap-6 px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 text-gray-300 dark:text-gray-900 hover:bg-white/5 dark:hover:bg-gray-900/5 transition-all text-left touch-manipulation"
                >
                  <Settings size={20} className="sm:w-8 sm:h-8 md:w-10 md:h-10" />
                  <span className="text-base sm:text-2xl md:text-3xl">Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 sm:gap-4 md:gap-6 px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 text-red-400 dark:text-red-600 hover:bg-red-500/10 transition-all text-left touch-manipulation"
                >
                  <LogOut size={20} className="sm:w-8 sm:h-8 md:w-10 md:h-10" />
                  <span className="text-base sm:text-2xl md:text-3xl font-medium">Logout</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

// --- Dashboard Sidebar Component (SCALED UP 200% + Mobile Drawer) ---
const DashboardSidebar = ({ activeView, setActiveView, isOpen, onClose }) => {
  const NavItem = ({ icon, label, active = false, onClick }) => (
    <button 
      onClick={() => {
        onClick();
        // Close drawer on mobile when item is clicked
        if (window.innerWidth < 1024) {
          onClose();
        }
      }}
      className={`flex items-center w-full gap-4 sm:gap-6 md:gap-10 px-4 sm:px-8 md:px-12 py-4 sm:py-6 md:py-10 rounded-lg sm:rounded-xl md:rounded-2xl transition-colors touch-manipulation
      ${active 
        ? 'bg-gradient-to-r from-purple-700/30 to-cyan-600/20 dark:from-blue-500/30 dark:to-cyan-500/20 text-cyan-300 dark:text-cyan-700 border-2 border-purple-500/30 dark:border-blue-500/30' 
        : 'text-gray-300 dark:text-gray-900 hover:bg-white/10 dark:hover:bg-gray-900/10 hover:text-white dark:hover:text-gray-900'
      }`}
    >
      <span className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-14 lg:h-14 flex-shrink-0">
        {React.cloneElement(icon, { size: "100%", className: "w-full h-full" })}
      </span>
      <span className="text-base sm:text-2xl md:text-4xl font-medium">{label}</span>
    </button>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar/Drawer */}
      <nav className={`fixed lg:static top-0 left-0 h-full w-64 sm:w-72 md:w-80 lg:w-[48rem] p-4 sm:p-8 md:p-16 bg-black/20 dark:bg-white/20 backdrop-blur-lg border-r border-white/10 dark:border-gray-300/20 flex flex-col gap-6 sm:gap-8 md:gap-12 flex-shrink-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand with Close Button (Mobile) */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 px-2 sm:px-4">
          <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
            <NimbusVaultLogo />
            <span className="text-2xl sm:text-4xl md:text-6xl font-bold text-white dark:text-gray-900">NimbusVault</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-all touch-manipulation"
            aria-label="Close menu"
          >
            <X size={24} className="text-white dark:text-gray-900" />
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={activeView === 'overview'} 
            onClick={() => setActiveView('overview')}
          />
          <NavItem 
            icon={<HardDrive />} 
            label="Browse Files" 
            active={activeView === 'files'} 
            onClick={() => setActiveView('files')}
          />
          <NavItem 
            icon={<Archive />} 
            label="My Vault" 
            active={activeView === 'vault'} 
            onClick={() => setActiveView('vault')}
          />
          <NavItem 
            icon={<Settings />} 
            label="Settings" 
            active={activeView === 'settings'} 
            onClick={() => setActiveView('settings')}
          />
        </div>
        
        {/* Logout Button */}
        <div className="mt-auto">
          <button
            onClick={api.logout}
            className="flex items-center w-full gap-4 sm:gap-6 md:gap-10 px-4 sm:px-8 md:px-12 py-4 sm:py-6 md:py-10 rounded-lg sm:rounded-xl md:rounded-2xl text-gray-400 dark:text-gray-900 hover:bg-red-800/20 dark:hover:bg-red-600/20 hover:text-red-400 dark:hover:text-red-600 transition-colors touch-manipulation"
          >
            <span className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-14 lg:h-14 flex-shrink-0">
              <LogOut size="100%" className="w-full h-full" />
            </span>
            <span className="text-base sm:text-2xl md:text-4xl font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};

// --- Donut Chart Component (SCALED UP 200% + Mobile Responsive) ---
const DonutChart = ({ percentage }) => {
  const radius = 220;
  const strokeWidth = 48;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-[32rem] lg:h-[32rem]">
      <svg width="100%" height="100%" viewBox="0 0 536 536" className="-rotate-90">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: '#a855f7', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#06b6d4', stopOpacity: 1}} />
          </linearGradient>
        </defs>
        
        <circle
          cx="268" cy="268" r={innerRadius} fill="none"
          strokeWidth={strokeWidth}
          className="text-gray-700/50 dark:text-gray-300/50"
        />
        <circle
          cx="268" cy="268" r={innerRadius} fill="none"
          stroke="url(#chartGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-9xl font-semibold text-white dark:text-gray-900">{percentage}%</span>
      </div>
    </div>
  );
};

// --- Reusable Card Component (SCALED UP 200%) ---
const GlassCard = ({ children, className = '' }) => (
  <div className={`rounded-[3rem] shadow-2xl animated-gradient-bg p-2 ${className}`}>
    <div className="bg-black/30 dark:bg-white/30 backdrop-blur-lg rounded-[2.5rem] p-24 h-full">
      {children}
    </div>
  </div>
);


// --- SKELETON COMPONENTS (SCALED UP) ---

const QuickActionsSkeleton = () => (
  <GlassCard>
    <div className="h-18 w-1/2 bg-gray-700/50 rounded-2xl animate-pulse mb-16"></div>
    <div className="flex flex-col gap-8">
      <div className="h-32 w-full bg-gray-700/50 rounded-2xl animate-pulse"></div>
    </div>
  </GlassCard>
);

const StorageStatusSkeleton = () => (
  <GlassCard>
    <div className="h-18 w-1/2 bg-gray-700/50 rounded-2xl animate-pulse mb-16"></div>
    <div className="flex flex-col items-center gap-16">
      <div className="w-[32rem] h-[32rem] bg-gray-700/50 rounded-full animate-pulse"></div>
      <div className="w-full text-center">
        <div className="h-20 w-1/3 bg-gray-700/50 rounded-2xl animate-pulse mx-auto mb-8"></div>
        <div className="h-14 w-1/2 bg-gray-700/50 rounded-2xl animate-pulse mx-auto"></div>
      </div>
    </div>
  </GlassCard>
);

const BackupsListSkeleton = () => (
  <GlassCard>
    <div className="flex justify-between items-center mb-16">
      <div className="h-18 w-1/3 bg-gray-700/50 rounded-2xl animate-pulse"></div>
      <div className="h-14 w-1/4 bg-gray-700/50 rounded-2xl animate-pulse"></div>
    </div>
    <div className="grid grid-cols-12 gap-12 p-12 border-b-2 border-purple-500/20">
      <div className="col-span-4 h-14 bg-gray-700/50 rounded-2xl animate-pulse"></div>
      <div className="col-span-2 h-14 bg-gray-700/50 rounded-2xl animate-pulse"></div>
      <div className="col-span-2 h-14 bg-gray-700/50 rounded-2xl animate-pulse"></div>
      <div className="col-span-2 h-14 bg-gray-700/50 rounded-2xl animate-pulse"></div>
      <div className="col-span-2 h-14 bg-gray-700/50 rounded-2xl animate-pulse"></div>
    </div>
    <div className="flex flex-col gap-8 mt-8">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="grid grid-cols-12 gap-12 items-center p-12">
          <div className="col-span-4 h-16 flex items-center gap-10">
            <div className="w-14 h-14 bg-gray-700/50 rounded-2xl animate-pulse"></div>
            <div className="w-full h-14 bg-gray-700/50 rounded-2xl animate-pulse"></div>
          </div>
          <div className="col-span-2 h-16 bg-gray-700/50 rounded-2xl animate-pulse"></div>
          <div className="col-span-2 h-16 bg-gray-700/50 rounded-2xl animate-pulse"></div>
          <div className="col-span-2 h-16 bg-gray-700/50 rounded-2xl animate-pulse"></div>
          <div className="col-span-2 h-16 bg-gray-700/50 rounded-2xl animate-pulse"></div>
        </div>
      ))}
    </div>
  </GlassCard>
);


// --- Dashboard Main Content Component (SCALED UP 200%) ---
const DashboardMain = () => {
  const fileInputRef = useRef(null);
  const [currentDate, setCurrentDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    setCurrentDate(date);
    const loadData = async () => {
      setIsLoading(true);
      const data = await api.fetchDashboardData();
      setDashboardData(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    if (!e.target.files) return;
    setIsUploading(true);
    // Note: File upload would need backend endpoint implementation
    // For now, show a placeholder message
    setTimeout(() => {
      alert(`${e.target.files.length} file(s) selected. Upload functionality coming soon!`);
      setIsUploading(false);
      e.target.value = null;
    }, 1000);
  };
  
  const getFileIcon = (type) => {
    switch(type) {
      case 'folder': return <Folder size={24} className="sm:w-10 sm:h-10 md:w-14 md:h-14 text-cyan-400 flex-shrink-0" />;
      case 'doc': return <FileText size={24} className="sm:w-10 sm:h-10 md:w-14 md:h-14 text-blue-400 flex-shrink-0" />;
      case 'image': return <ImageIcon size={24} className="sm:w-10 sm:h-10 md:w-14 md:h-14 text-green-400 flex-shrink-0" />;
      case 'server': return <Server size={24} className="sm:w-10 sm:h-10 md:w-14 md:h-14 text-purple-400 dark:text-blue-500 flex-shrink-0" />;
      case 'db': return <Database size={24} className="sm:w-10 sm:h-10 md:w-14 md:h-14 text-orange-400 flex-shrink-0" />;
      default: return <File size={24} className="sm:w-10 sm:h-10 md:w-14 md:h-14 text-gray-500 dark:text-gray-400 flex-shrink-0" />;
    }
  };

  const getStoragePercentage = () => {
    if (!dashboardData) return 0;
    return Math.round((dashboardData.storageUsed / dashboardData.storageTotal) * 100);
  };

  return (
    <main className="flex-1 p-4 sm:p-8 md:p-16 lg:p-32 overflow-auto bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 dark:from-gray-50 dark:via-slate-50 dark:to-gray-100">
      <input
        type="file" multiple ref={fileInputRef}
        onChange={handleFileChange} className="hidden"
        disabled={isUploading}
      />
      
      {/* Header */}
      <div className="mb-6 sm:mb-12 md:mb-16 lg:mb-24">
        {isLoading ? (
          <>
            <div className="h-8 sm:h-16 md:h-20 lg:h-24 w-2/3 sm:w-1/2 md:w-1/3 bg-gray-700/50 rounded-xl sm:rounded-2xl animate-pulse mb-4 sm:mb-6 md:mb-8"></div>
            <div className="h-6 sm:h-10 md:h-12 lg:h-14 w-1/2 sm:w-1/3 md:w-1/4 bg-gray-700/50 rounded-xl sm:rounded-2xl animate-pulse"></div>
          </>
        ) : (
          <>
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-9xl font-bold text-white dark:text-gray-900">
              Dashboard Overview
            </h1>
            <p className="text-base sm:text-2xl md:text-3xl lg:text-5xl text-gray-400 dark:text-gray-900 mt-2 sm:mt-3 md:mt-4">{currentDate}</p>
          </>
        )}
      </div>
      
      {/* Dashboard Grid (Corrected 2-over-1 layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-24">

        {/* --- Item 1: Quick Actions --- */}
        {isLoading ? (
          <QuickActionsSkeleton />
        ) : (
          <GlassCard>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold text-white dark:text-gray-900 mb-4 sm:mb-8 md:mb-12 lg:mb-16">Quick Actions</h2>
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 lg:gap-10">
              <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-3 sm:gap-6 md:gap-8 py-4 sm:py-6 md:py-10 lg:py-12 px-6 sm:px-10 md:px-12 lg:px-14 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold text-sm sm:text-3xl md:text-4xl lg:text-5xl text-white dark:text-gray-900 touch-manipulation
                           bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-blue-600 dark:to-cyan-600
                           hover:from-purple-700 hover:to-cyan-700 dark:hover:from-blue-700 dark:hover:to-cyan-700 
                           transition-all duration-300 transform active:scale-95
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? <Loader2 size={20} className="sm:w-10 sm:h-10 md:w-12 md:h-12 animate-spin" /> : <UploadCloud size={20} className="sm:w-10 sm:h-10 md:w-12 md:h-12" />}
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          </GlassCard>
        )}

        {/* --- Item 2: Storage Status --- */}
        {isLoading ? (
          <StorageStatusSkeleton />
        ) : (
          <GlassCard>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold text-white dark:text-gray-900 mb-4 sm:mb-8 md:mb-12 lg:mb-16">Storage Status</h2>
            <div className="flex flex-col items-center gap-6 sm:gap-10 md:gap-14 lg:gap-16">
              <DonutChart percentage={getStoragePercentage()} />
              <div className="w-full text-center">
                <span className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-bold text-white dark:text-gray-900">{dashboardData?.storageUsedPretty || '0 B'}</span>
                <span className="text-base sm:text-2xl md:text-3xl lg:text-5xl text-gray-400 dark:text-gray-900"> / 100 MB Used</span>
              </div>
            </div>
          </GlassCard>
        )}

        {/* --- Item 3: My Backups (Spanning full width) --- */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <BackupsListSkeleton />
          ) : (
            <GlassCard>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 md:gap-6 lg:gap-0 mb-6 sm:mb-10 md:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold text-white dark:text-gray-900">My Backups</h2>
                <button className="flex items-center gap-2 sm:gap-3 md:gap-4 text-sm sm:text-2xl md:text-3xl lg:text-4xl text-cyan-400 hover:text-cyan-300 touch-manipulation">
                  View All <ArrowRight size={16} className="sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" />
                </button>
              </div>
              
              {/* Table Header - Hidden on mobile */}
              <div className="hidden sm:grid grid-cols-12 gap-6 sm:gap-8 md:gap-12 text-xs sm:text-2xl md:text-3xl lg:text-4xl text-gray-400 dark:text-gray-900 font-medium p-4 sm:p-6 md:p-10 lg:p-12 border-b-2 border-purple-500/20 dark:border-blue-500/20">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Last Modified</div>
                <div className="col-span-2 text-right">Size</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 mt-3 sm:mt-4 md:mt-6">
                {dashboardData?.backups.map((file, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 md:gap-8 lg:gap-12 items-center p-4 sm:p-6 md:p-10 lg:p-12 rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-gray-900/70 transition-colors">
                    {/* Name */}
                    <div className="col-span-1 sm:col-span-4 flex items-center gap-3 sm:gap-6 md:gap-10">
                      {getFileIcon(file.type)}
                      <span className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-medium text-white dark:text-gray-900 truncate">{file.name}</span>
                    </div>
                    {/* Status */}
                    <div className="col-span-1 sm:col-span-2">
                      <span className={`flex items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-2xl md:text-3xl lg:text-4xl ${file.status === 'Synced' ? 'text-green-400' : 'text-yellow-400'}`}>
                        <span className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full ${file.status === 'Synced' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {file.status}
                      </span>
                    </div>
                    {/* Last Modified */}
                    <div className="col-span-1 sm:col-span-2 text-xs sm:text-2xl md:text-3xl lg:text-4xl text-gray-400 dark:text-gray-900">
                      {file.lastModified}
                    </div>
                    {/* Size */}
                    <div className="col-span-1 sm:col-span-2 text-xs sm:text-2xl md:text-3xl lg:text-4xl text-gray-400 dark:text-gray-900 sm:text-right">
                      {file.size}
                    </div>
                    {/* Actions Column */}
                    <div className="col-span-1 sm:col-span-2 sm:text-right">
                      <button className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 md:gap-4 py-2 sm:py-4 md:py-5 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-xl md:text-2xl lg:text-3xl text-cyan-300 bg-cyan-800/30 border-2 border-cyan-500/30 hover:bg-cyan-800/60 transition-colors touch-manipulation">
                        <Clock size={16} className="sm:w-6 sm:h-6 md:w-8 md:h-8" />
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </main>
  );
};

// --- Files & Vault View Components (Mobile Responsive) ---
const FilesView = ({ username, onBackupComplete }) => (
  <main className="flex-1 p-4 sm:p-8 md:p-16 lg:p-32 overflow-auto bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 dark:from-gray-50 dark:via-slate-50 dark:to-gray-100">
    <div className="mb-6 sm:mb-12 md:mb-16 lg:mb-24">
      <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-9xl font-bold text-white dark:text-gray-900 mb-2 sm:mb-4 md:mb-6 lg:mb-8">Browse Server Files</h1>
      <p className="text-base sm:text-2xl md:text-4xl lg:text-6xl text-gray-400 dark:text-gray-900">Navigate and backup files from your server</p>
    </div>
    <GlassCard className="min-h-[calc(100vh-300px)] sm:min-h-[calc(100vh-400px)] lg:h-[calc(100vh-500px)]">
      <FileBrowser username={username} onBackupComplete={onBackupComplete} />
    </GlassCard>
  </main>
);

const VaultView = ({ username, refreshTrigger }) => (
  <main className="flex-1 p-4 sm:p-8 md:p-16 lg:p-32 overflow-auto bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 dark:from-gray-50 dark:via-slate-50 dark:to-gray-100">
    <div className="mb-6 sm:mb-12 md:mb-16 lg:mb-24">
      <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-9xl font-bold text-white dark:text-gray-900 mb-2 sm:mb-4 md:mb-6 lg:mb-8">My Vault</h1>
      <p className="text-base sm:text-2xl md:text-4xl lg:text-6xl text-gray-400 dark:text-gray-900">View and restore your encrypted backups</p>
    </div>
    <GlassCard className="min-h-[calc(100vh-300px)] sm:min-h-[calc(100vh-400px)] lg:h-[calc(100vh-500px)]">
      <BackupList username={username} refreshTrigger={refreshTrigger} />
    </GlassCard>
  </main>
);

const SettingsView = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="flex-1 p-4 sm:p-8 md:p-16 lg:p-32 overflow-auto bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 dark:from-gray-50 dark:via-slate-50 dark:to-gray-100">
      <div className="mb-6 sm:mb-12 md:mb-16 lg:mb-24">
        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-9xl font-bold text-white dark:text-gray-900 mb-2 sm:mb-4 md:mb-6 lg:mb-8">Settings</h1>
        <p className="text-base sm:text-2xl md:text-4xl lg:text-6xl text-gray-400 dark:text-gray-900">Configure your NimbusVault preferences</p>
      </div>
      
      {/* Theme Toggle Card */}
      <GlassCard className="mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {theme === 'dark' ? (
              <Moon size={80} className="text-cyan-400" />
            ) : (
              <Sun size={80} className="text-yellow-500" />
            )}
            <div>
              <h2 className="text-6xl font-semibold text-white dark:text-gray-900 mb-2">Theme</h2>
              <p className="text-4xl text-gray-400 dark:text-gray-900">
                Current theme: <span className="font-bold capitalize">{theme}</span>
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-6 px-16 py-10 rounded-2xl text-4xl font-semibold
                     bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-blue-600 dark:to-cyan-600 text-white
                     hover:from-purple-500 hover:to-cyan-500 dark:hover:from-blue-500 dark:hover:to-cyan-500 
                     transition-all transform active:scale-95"
          >
            {theme === 'light' ? 
            (
              <>
                <Sun size={48} />
                Switch to Light Mode
              </>
            ):(
              <>
                <Moon size={48} />
                Switch to Dark Mode
              </>
            )  }
          </button>
        </div>
      </GlassCard>

      {/* Other Settings Placeholder */}
      <GlassCard>
        <div className="text-center py-48">
          <Settings size={160} className="text-gray-500 dark:text-gray-900 mx-auto mb-16" />
          <p className="text-6xl text-gray-400 dark:text-gray-900">More settings coming soon...</p>
        </div>
      </GlassCard>
    </main>
  );
};

// --- Dashboard Page Component (Layout + Mobile Support) ---
const DashboardPage = ({ username }) => {
  const [activeView, setActiveView] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleBackupComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full text-gray-200 overflow-hidden">
      <DashboardSidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      <div className="flex flex-col flex-1 h-screen overflow-hidden lg:ml-0">
        <DashboardHeader username={username} onMenuClick={toggleSidebar} />
        <div className="flex-1 overflow-auto">
          {activeView === 'overview' && <DashboardMain />}
          {activeView === 'files' && <FilesView username={username} onBackupComplete={handleBackupComplete} />}
          {activeView === 'vault' && <VaultView username={username} refreshTrigger={refreshTrigger} />}
          {activeView === 'settings' && <SettingsView />}
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
export default function App() {
  const [username, setUsername] = useState('...');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoadingUser(true);
      
      // Check if user is authenticated
      const storedUsername = localStorage.getItem('username');
      const storedUid = localStorage.getItem('uid');
      
      if (!storedUsername || !storedUid) {
        // No authentication found - show error and redirect
        setAuthError(true);
        setIsLoadingUser(false);
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
        return;
      }
      
      setUsername(storedUsername);
      setIsLoadingUser(false);
    };
    loadUser();
  }, []);

  return (
    <div className="min-h-screen w-full font-['Inter',_sans-serif] animated-gradient-bg">
      <AnimatedBackgroundStyles />
      {authError && (
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={96} className="text-red-400 mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-2xl text-gray-400 mb-8">You must be logged in to access this page.</p>
            <p className="text-xl text-gray-500">Redirecting to login...</p>
          </div>
        </div>
      )}
      {!isLoadingUser && !authError && <DashboardPage username={username} />}
      {isLoadingUser && !authError && (
        <div className="min-h-screen w-full flex items-center justify-center">
          <Loader2 size={96} className="text-cyan-400 animate-spin" />
        </div>
      )}
    </div>
  );
}