import React, { useState, useEffect } from 'react';
import { Clock, Download, Loader2, Package, AlertCircle, X, Lock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const BackupList = ({ username, refreshTrigger }) => {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoring, setRestoring] = useState(null); // Track which backup is being restored
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [password, setPassword] = useState('');

  // Fetch backups from the server
  const fetchBackups = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        setError('No user ID found');
        setBackups([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/backups?uid=${uid}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to load backups');
        setBackups([]);
      } else {
        // The API returns an array directly, not wrapped in { backups: [] }
        setBackups(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setBackups([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load backups on mount and when refreshTrigger changes
  useEffect(() => {
    fetchBackups();
  }, [username, refreshTrigger]);

  // Handle restore button click - open modal
  const handleRestoreClick = (backup) => {
    setSelectedBackup(backup);
    setPassword('');
    setShowPasswordModal(true);
  };

  // Handle actual restore after password entered
  const handleRestoreConfirm = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setRestoring(selectedBackup.fid);
    setShowPasswordModal(false);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/restore`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          username: username,
          password: password,
          fid: selectedBackup.fid,
          outDirectory: undefined // Let backend use default
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Restore failed');
        alert(`❌ Restore failed: ${data.message || 'Unknown error'}`);
      } else {
        setError('');
        const details = data.details || {};
        alert(`✓ Successfully restored: ${selectedBackup.fname}\n${JSON.stringify(details, null, 2)}`);
      }
    } catch (err) {
      setError('Failed to connect to server');
      alert('❌ Failed to connect to server');
    } finally {
      setRestoring(null);
      setPassword('');
      setSelectedBackup(null);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowPasswordModal(false);
    setPassword('');
    setSelectedBackup(null);
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return 'N/A';
    
    // Convert to number if it's a string
    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(numBytes)) return 'N/A';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = numBytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <>
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl mx-2 sm:mx-4 md:mx-8 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl bg-gradient-to-br from-purple-900/40 to-cyan-900/40 dark:from-blue-900/40 dark:to-cyan-900/40 p-1 sm:p-2">
            <div className="bg-black/40 dark:bg-white/40 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-8 md:p-16 border-2 border-white/20 dark:border-gray-300/20">
              {/* Close Button */}
              <button
                onClick={handleModalClose}
                className="absolute top-3 sm:top-6 md:top-8 right-3 sm:right-6 md:right-8 text-gray-400 dark:text-gray-900 hover:text-white dark:hover:text-gray-900 transition-colors touch-manipulation"
              >
                <X size={24} className="sm:w-10 sm:h-10 md:w-12 md:h-12" />
              </button>

              {/* Header */}
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 dark:from-blue-600 dark:to-cyan-600 mb-4 sm:mb-6 md:mb-8">
                  <Lock size={24} className="sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white dark:text-gray-900 mb-2 sm:mb-3 md:mb-4">Restore Backup</h2>
                <p className="text-sm sm:text-2xl md:text-3xl lg:text-4xl text-gray-400 dark:text-gray-900">Enter your password to decrypt and restore</p>
                {selectedBackup && (
                  <p className="text-xs sm:text-xl md:text-2xl lg:text-3xl text-cyan-400 mt-2 sm:mt-3 md:mt-4 font-mono break-all">{selectedBackup.fname}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="mb-6 sm:mb-8 md:mb-12">
                <label htmlFor="restore-password" className="block text-sm sm:text-2xl md:text-3xl text-gray-300 dark:text-gray-900 mb-2 sm:mb-3 md:mb-4">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="sm:w-8 sm:h-8 md:w-10 md:h-10 absolute left-3 sm:left-6 md:left-8 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-900" />
                  <input
                    id="restore-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRestoreConfirm()}
                    placeholder="Enter your password..."
                    autoFocus
                    className="w-full pl-10 sm:pl-16 md:pl-24 pr-3 sm:pr-6 md:pr-8 py-3 sm:py-5 md:py-8 text-sm sm:text-2xl md:text-3xl lg:text-4xl bg-black/30 border-2 border-white/20 
                             rounded-lg sm:rounded-xl md:rounded-2xl text-white dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-400
                             focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-cyan-500 focus:border-cyan-500 
                             transition-all"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-8">
                <button
                  onClick={handleModalClose}
                  className="flex-1 px-6 sm:px-8 md:px-12 py-3 sm:py-5 md:py-8 text-sm sm:text-2xl md:text-3xl lg:text-4xl font-semibold rounded-lg sm:rounded-xl md:rounded-2xl touch-manipulation
                           bg-gray-700/50 dark:bg-gray-200/50 text-gray-300 dark:text-gray-900 border-2 border-gray-600 dark:border-gray-400
                           hover:bg-gray-600/50 dark:hover:bg-gray-300/50 hover:border-gray-500 dark:hover:border-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestoreConfirm}
                  disabled={!password}
                  className="flex-1 px-6 sm:px-8 md:px-12 py-3 sm:py-5 md:py-8 text-sm sm:text-2xl md:text-3xl lg:text-4xl font-semibold rounded-lg sm:rounded-xl md:rounded-2xl touch-manipulation
                           bg-gradient-to-r from-green-600 to-emerald-600 text-white
                           hover:from-green-500 hover:to-emerald-500 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all transform active:scale-95 flex items-center justify-center gap-2 sm:gap-3 md:gap-4"
                >
                  <Download size={16} className="sm:w-8 sm:h-8 md:w-10 md:h-10" />
                  Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-4 sm:mb-8 md:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-semibold text-white mb-2 sm:mb-4 md:mb-6">My Vault</h2>
          <p className="text-sm sm:text-2xl md:text-3xl lg:text-5xl text-gray-400 dark:text-gray-900">Your backed up files and folders</p>
        </div>

      {/* Stats */}
      <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12 flex items-center gap-3 sm:gap-4 md:gap-6">
        <Package size={24} className="sm:w-10 sm:h-10 md:w-14 md:h-14 text-green-400" />
        <span className="text-sm sm:text-2xl md:text-3xl lg:text-4xl text-gray-300 dark:text-gray-900">
          {backups.length} backup{backups.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12 p-3 sm:p-6 md:p-8 bg-red-500/20 text-red-300 rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-red-500/30 text-xs sm:text-2xl md:text-3xl lg:text-4xl flex items-center gap-2 sm:gap-4 md:gap-6">
          <AlertCircle size={16} className="sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Backup List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 sm:py-24 md:py-32">
            <Loader2 size={48} className="sm:w-16 sm:h-16 md:w-24 md:h-24 text-cyan-400 animate-spin" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-16 sm:py-24 md:py-32">
            <Package size={64} className="sm:w-32 sm:h-32 md:w-96 md:h-96 text-gray-600 dark:text-gray-900 mx-auto mb-6 sm:mb-8 md:mb-12" />
            <p className="text-lg sm:text-4xl md:text-5xl lg:text-6xl text-gray-500 dark:text-gray-900">No backups yet</p>
            <p className="text-sm sm:text-2xl md:text-3xl lg:text-4xl text-gray-600 dark:text-gray-900 mt-3 sm:mt-4 md:mt-6">Use the file browser to create your first backup</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
            {backups.map((backup) => (
              <div
                key={backup.fid}
                    className="p-4 sm:p-8 md:p-12 lg:p-14 rounded-xl sm:rounded-2xl md:rounded-3xl bg-black/20 dark:bg-white/20 border-2 border-white/10 dark:border-gray-300/20 
                         hover:bg-black/30 dark:hover:bg-white/30 hover:border-white/20 dark:hover:border-gray-300/30 transition-all"
              >
                {/* Top Row: Name + Restore Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-4 sm:mb-6 md:mb-8">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white dark:text-gray-900 truncate mb-2 sm:mb-3 md:mb-4">
                      {backup.fname || 'Unnamed Backup'}
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 md:gap-6 lg:gap-10 text-xs sm:text-2xl md:text-3xl lg:text-4xl text-gray-400 dark:text-gray-900">
                      <span className="flex items-center gap-2 sm:gap-3 md:gap-4">
                        <Clock size={16} className="sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" />
                        {formatDate(backup.fsavedtime)}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>{formatSize(backup.fsize)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestoreClick(backup)}
                    disabled={restoring === backup.fid}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-4 md:gap-6 px-4 sm:px-8 md:px-12 py-2 sm:py-4 md:py-6 rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-2xl md:text-3xl lg:text-4xl font-medium touch-manipulation
                             bg-gradient-to-r from-green-600/80 to-emerald-600/80
                             hover:from-green-600 hover:to-emerald-600
                             text-white transition-all transform active:scale-95
                             disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {restoring === backup.fid ? (
                      <>
                        <Loader2 size={16} className="sm:w-8 sm:h-8 md:w-10 md:h-10 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="sm:w-8 sm:h-8 md:w-10 md:h-10" />
                        Restore
                      </>
                    )}
                  </button>
                </div>

                {/* Additional Info */}
                {backup.fpath && (
                  <div className="text-xs sm:text-xl md:text-2xl lg:text-3xl text-gray-500 dark:text-gray-900 font-mono truncate">
                    Path: {backup.fpath}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default BackupList;
