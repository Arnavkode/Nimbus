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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-8 rounded-3xl shadow-2xl bg-gradient-to-br from-purple-900/40 to-cyan-900/40 dark:from-blue-900/40 dark:to-cyan-900/40 p-2">
            <div className="bg-black/40 dark:bg-white/40 backdrop-blur-xl rounded-3xl p-16 border-2 border-white/20 dark:border-gray-300/20">
              {/* Close Button */}
              <button
                onClick={handleModalClose}
                className="absolute top-8 right-8 text-gray-400 dark:text-gray-900 hover:text-white dark:hover:text-gray-900 transition-colors"
              >
                <X size={48} />
              </button>

              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 dark:from-blue-600 dark:to-cyan-600 mb-8">
                  <Lock size={64} className="text-white" />
                </div>
                <h2 className="text-7xl font-bold text-white dark:text-gray-900 mb-4">Restore Backup</h2>
                <p className="text-4xl text-gray-400 dark:text-gray-900">Enter your password to decrypt and restore</p>
                {selectedBackup && (
                  <p className="text-3xl text-cyan-400 mt-4 font-mono">{selectedBackup.fname}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="mb-12">
                <label htmlFor="restore-password" className="block text-3xl text-gray-300 dark:text-gray-900 mb-4">
                  Password
                </label>
                <div className="relative">
                  <Lock size={40} className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-900" />
                  <input
                    id="restore-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRestoreConfirm()}
                    placeholder="Enter your password..."
                    autoFocus
                    className="w-full pl-24 pr-8 py-8 text-4xl bg-black/30 border-2 border-white/20 
                             rounded-2xl text-white dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-400
                             focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:border-cyan-500 
                             transition-all"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-8">
                <button
                  onClick={handleModalClose}
                  className="flex-1 px-12 py-8 text-4xl font-semibold rounded-2xl
                           bg-gray-700/50 dark:bg-gray-200/50 text-gray-300 dark:text-gray-900 border-2 border-gray-600 dark:border-gray-400
                           hover:bg-gray-600/50 dark:hover:bg-gray-300/50 hover:border-gray-500 dark:hover:border-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestoreConfirm}
                  disabled={!password}
                  className="flex-1 px-12 py-8 text-4xl font-semibold rounded-2xl
                           bg-gradient-to-r from-green-600 to-emerald-600 text-white
                           hover:from-green-500 hover:to-emerald-500 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all transform active:scale-95 flex items-center justify-center gap-4"
                >
                  <Download size={40} />
                  Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-8xl font-semibold text-white mb-6">My Vault</h2>
          <p className="text-5xl text-gray-400 dark:text-gray-900">Your backed up files and folders</p>
        </div>

      {/* Stats */}
      <div className="mb-12 flex items-center gap-6">
        <Package size={56} className="text-green-400" />
        <span className="text-4xl text-gray-300 dark:text-gray-900">
          {backups.length} backup{backups.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-12 p-8 bg-red-500/20 text-red-300 rounded-2xl border-2 border-red-500/30 text-4xl flex items-center gap-6">
          <AlertCircle size={40} />
          {error}
        </div>
      )}

      {/* Backup List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={96} className="text-cyan-400 animate-spin" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-32">
            <Package size={128} className="text-gray-600 dark:text-gray-900 mx-auto mb-12" />
            <p className="text-gray-500 dark:text-gray-900 text-6xl">No backups yet</p>
            <p className="text-gray-600 dark:text-gray-900 text-4xl mt-6">Use the file browser to create your first backup</p>
          </div>
        ) : (
          <div className="space-y-8">
            {backups.map((backup) => (
              <div
                key={backup.fid}
                    className="p-14 rounded-3xl bg-black/20 dark:bg-white/20 border-2 border-white/10 dark:border-gray-300/20 
                         hover:bg-black/30 dark:hover:bg-white/30 hover:border-white/20 dark:hover:border-gray-300/30 transition-all"
              >
                {/* Top Row: Name + Restore Button */}
                <div className="flex items-start justify-between gap-12 mb-8">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-6xl font-semibold text-white dark:text-gray-900 truncate mb-4">
                      {backup.fname || 'Unnamed Backup'}
                    </h3>
                    <div className="flex items-center gap-10 text-4xl text-gray-400 dark:text-gray-900">
                      <span className="flex items-center gap-4">
                        <Clock size={36} />
                        {formatDate(backup.fsavedtime)}
                      </span>
                      <span>•</span>
                      <span>{formatSize(backup.fsize)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestoreClick(backup)}
                    disabled={restoring === backup.fid}
                    className="flex items-center gap-6 px-12 py-6 rounded-2xl text-4xl font-medium
                             bg-gradient-to-r from-green-600/80 to-emerald-600/80
                             hover:from-green-600 hover:to-emerald-600
                             text-white transition-all transform active:scale-95
                             disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {restoring === backup.fid ? (
                      <>
                        <Loader2 size={40} className="animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <Download size={40} />
                        Restore
                      </>
                    )}
                  </button>
                </div>

                {/* Additional Info */}
                {backup.fpath && (
                  <div className="text-3xl text-gray-500 dark:text-gray-900 font-mono truncate">
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
