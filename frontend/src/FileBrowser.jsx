import React, { useState, useEffect } from 'react';
import { Folder, File, HardDrive, Loader2, ArrowUp, UploadCloud } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const FileBrowser = ({ username, onBackupComplete }) => {
  const [currentPath, setCurrentPath] = useState('.');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(null); // Track which file is being backed up
  const [error, setError] = useState('');

  // Fetch files from the server
  const fetchFiles = async (path) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/files?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to load files');
        setFiles([]);
      } else {
        // Backend returns array directly, not wrapped in { files: [] }
        setFiles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load files when path changes
  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  // Handle folder navigation
  const handleItemClick = (item) => {
    if (item.type === 'directory') {
      // Navigate into folder by appending the folder name to current path
      if (currentPath === '.') {
        setCurrentPath(item.name);
      } else {
        setCurrentPath(`${currentPath}/${item.name}`);
      }
    }
    // If it's a file, do nothing (or show details in the future)
  };

  // Handle backup action
  const handleBackup = async (item) => {
    setBackingUp(item.path);
    setError('');
    
    try {
      // Use the full absolute path from the backend for backup
      const response = await fetch(`${API_BASE}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: item.path,  // Backend gave us the full path
          username: username
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Backup failed');
      } else {
        // Show success message briefly
        setError(''); // Clear any previous errors
        // Call parent callback to refresh backup list
        if (onBackupComplete) {
          onBackupComplete();
        }
        // Show success toast (you can make this more sophisticated)
        alert(`✓ Successfully backed up: ${item.name}`);
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setBackingUp(null);
    }
  };

  // Handle "Go Up" button
  const handleGoUp = () => {
    if (currentPath === '.') return;
    
    // Remove the last segment
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.length === 0 ? '.' : parts.join('/');
    setCurrentPath(newPath);
  };

  // Check if we're at root
  const isAtRoot = currentPath === '.';

  // Get icon for file/folder
  const getIcon = (item) => {
    if (item.type === 'directory') {
      return <Folder size={64} className="text-cyan-400" />;
    }
    return <File size={64} className="text-gray-400 dark:text-gray-900" />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-16">
        <h2 className="text-8xl font-semibold text-white dark:text-gray-900 mb-6">Local Files</h2>
        <p className="text-5xl text-gray-400 dark:text-gray-900">Browse and backup server files</p>
      </div>

      {/* Current Path Display */}
      <div className="mb-12 flex items-center gap-6">
        <HardDrive size={56} className="text-purple-400 dark:text-blue-500" />
        <span className="text-4xl text-gray-300 dark:text-gray-900 font-mono">
          {currentPath === '.' ? '~/' : `~/${currentPath}`}
        </span>
      </div>

      {/* Go Up Button */}
      <div className="mb-12">
        <button
          onClick={handleGoUp}
          disabled={isAtRoot || isLoading}
          className="flex items-center gap-6 px-12 py-8 rounded-2xl text-4xl font-medium
                   bg-gray-800/50 dark:bg-gray-200/50 text-gray-300 dark:text-gray-900 border-2 border-gray-700 dark:border-gray-400
                   hover:bg-gray-700/50 dark:hover:bg-gray-300/50 hover:border-gray-600 dark:hover:border-gray-500 transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowUp size={48} />
          Go Up
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-12 p-8 bg-red-500/20 dark:bg-red-100/50 text-red-300 dark:text-red-900 rounded-2xl border-2 border-red-500/30 dark:border-red-400/30 text-4xl">
          {error}
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={96} className="text-cyan-400 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-32 text-gray-500 dark:text-gray-900 text-5xl">
            No files or folders found
          </div>
        ) : (
          <div className="space-y-8">
            {files.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-12 rounded-3xl 
                         bg-black/20 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/40 border-2 border-white/10 dark:border-gray-300/20 
                         transition-all group"
              >
                {/* Left: Icon + Name */}
                <button
                  onClick={() => handleItemClick(item)}
                  className="flex items-center gap-10 flex-1 text-left min-w-0"
                  disabled={item.type !== 'directory'}
                >
                  {getIcon(item)}
                  <div className="flex-1 min-w-0">
                    <div className="text-white dark:text-gray-900 font-medium truncate text-5xl">
                      {item.name}
                    </div>
                    <div className="text-3xl text-gray-500 dark:text-gray-700 mt-2">
                      {item.type === 'directory' ? 'Folder' : 'File'}
                      {item.size && ` • ${formatSize(item.size)}`}
                    </div>
                  </div>
                </button>

                {/* Right: Backup Button */}
                <button
                  onClick={() => handleBackup(item)}
                  disabled={backingUp === item.path}
                  className="ml-12 flex items-center gap-6 px-12 py-6 rounded-2xl text-4xl font-medium
                           bg-gradient-to-r from-purple-600/80 to-cyan-600/80 dark:from-blue-600/80 dark:to-cyan-600/80
                           hover:from-purple-600 hover:to-cyan-600 dark:hover:from-blue-600 dark:hover:to-cyan-600
                           text-white transition-all transform active:scale-95
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {backingUp === item.path ? (
                    <>
                      <Loader2 size={40} className="animate-spin" />
                      Backing up...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={40} />
                      Backup
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format file size
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

export default FileBrowser;
