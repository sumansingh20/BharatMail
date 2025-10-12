import { useState, useRef } from 'react';
import {
  Search, Upload, Download, Share2, MoreVertical,
  Folder, File, FileText, Image, Video, Music,
  Star, Users, Trash2, Copy, Move,
  Grid3X3, List, Info, Plus, X, RefreshCw,
  Settings, FolderPlus
} from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  type: 'folder' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'video' | 'audio' | 'pdf' | 'other';
  size?: number;
  modified: Date;
  owner: string;
  shared: boolean;
  starred: boolean;
  thumbnail?: string;
  permissions: 'view' | 'edit' | 'owner';
  url?: string;
  parent?: string;
}

interface BhaDriveProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect?: (file: DriveFile) => void;
  selectionMode?: boolean;
}

export default function BhaDrive({ isOpen, onClose, onFileSelect, selectionMode = false }: BhaDriveProps) {
  const [files, setFiles] = useState<DriveFile[]>([
    {
      id: '1',
      name: 'Business Proposal 2024',
      type: 'document',
      size: 2485760,
      modified: new Date('2024-03-15'),
      owner: 'john.doe@example.com',
      shared: true,
      starred: false,
      permissions: 'edit'
    },
    {
      id: '2',
      name: 'Marketing Assets',
      type: 'folder',
      modified: new Date('2024-03-14'),
      owner: 'jane.smith@example.com',
      shared: true,
      starred: true,
      permissions: 'edit'
    },
    {
      id: '3',
      name: 'Q1 Financial Report',
      type: 'spreadsheet',
      size: 1024000,
      modified: new Date('2024-03-13'),
      owner: 'finance@example.com',
      shared: false,
      starred: true,
      permissions: 'view'
    },
    {
      id: '4',
      name: 'Product Presentation',
      type: 'presentation',
      size: 5242880,
      modified: new Date('2024-03-12'),
      owner: 'product@example.com',
      shared: true,
      starred: false,
      permissions: 'edit'
    },
    {
      id: '5',
      name: 'Team Photo 2024',
      type: 'image',
      size: 3145728,
      modified: new Date('2024-03-11'),
      owner: 'hr@example.com',
      shared: false,
      starred: false,
      permissions: 'view'
    }
  ]);

  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size'>('modified');
  const [filterType, setFilterType] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState<string | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="h-5 w-5 text-blue-600" />;
      case 'document': return <FileText className="h-5 w-5 text-blue-600" />;
      case 'spreadsheet': return <FileText className="h-5 w-5 text-green-600" />;
      case 'presentation': return <FileText className="h-5 w-5 text-orange-600" />;
      case 'image': return <Image className="h-5 w-5 text-purple-600" />;
      case 'video': return <Video className="h-5 w-5 text-red-600" />;
      case 'audio': return <Music className="h-5 w-5 text-pink-600" />;
      case 'pdf': return <File className="h-5 w-5 text-red-600" />;
      default: return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredFiles = files
    .filter(file => {
      if (filterType !== 'all' && file.type !== filterType) return false;
      if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'size': return (b.size || 0) - (a.size || 0);
        case 'modified': return b.modified.getTime() - a.modified.getTime();
        default: return 0;
      }
    });

  const handleFileUpload = (files: FileList) => {
    setIsUploading(true);
    
    Array.from(files).forEach(file => {
      const newFile: DriveFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' :
              file.type === 'application/pdf' ? 'pdf' : 'other',
        size: file.size,
        modified: new Date(),
        owner: 'you@example.com',
        shared: false,
        starred: false,
        permissions: 'owner'
      };
      
      setFiles(prev => [...prev, newFile]);
    });

    setTimeout(() => setIsUploading(false), 2000);
  };

  const handleFileSelect = (file: DriveFile) => {
    if (selectionMode && onFileSelect) {
      onFileSelect(file);
      return;
    }

    if (file.type === 'folder') {
      setCurrentFolder(file.id);
    } else {
      // Open file in new tab or handle file opening
      console.log('Opening file:', file.name);
    }
  };

  const toggleFileSelection = (fileId: string, event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => {
    event.stopPropagation();
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleShare = (fileId: string) => {
    setShowShareDialog(fileId);
  };

  const toggleStar = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, starred: !file.starred } : file
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded"></div>
              BhaDrive
            </h2>
            
            {selectionMode && (
              <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">
                Select files to attach
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            {/* Create Button */}
            <div className="relative">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                New
              </button>
              
              {showCreateMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 w-48">
                  <div className="p-2 space-y-1">
                    <button className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
                      <FolderPlus className="h-4 w-4" />
                      Folder
                    </button>
                    <hr className="my-1" />
                    <button className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
                      <FileText className="h-4 w-4 text-blue-600" />
                      BhaDocs
                    </button>
                    <button className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
                      <FileText className="h-4 w-4 text-green-600" />
                      BhaSheets
                    </button>
                    <button className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
                      <FileText className="h-4 w-4 text-orange-600" />
                      BhaSlides
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                    >
                      <Upload className="h-4 w-4" />
                      File upload
                    </button>
                    <button className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
                      <Upload className="h-4 w-4" />
                      Folder upload
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search in BhaDrive"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All files</option>
              <option value="folder">Folders</option>
              <option value="document">Documents</option>
              <option value="spreadsheet">Spreadsheets</option>
              <option value="presentation">Presentations</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="modified">Last modified</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>

            {/* Info */}
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded">
              <Info className="h-4 w-4" />
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="px-4 py-2 border-b">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setCurrentFolder('')}
              className="text-blue-600 hover:underline"
            >
              My BhaDrive
            </button>
            {currentFolder && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">Current Folder</span>
              </>
            )}
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto">
          {isUploading && (
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Uploading files...
              </div>
            </div>
          )}

          {viewMode === 'list' ? (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      <input
                        type="checkbox"
                        className="rounded"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(filteredFiles.map(f => f.id));
                          } else {
                            setSelectedFiles([]);
                          }
                        }}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Owner</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Last modified</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">File size</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleFileSelect(file)}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={(e) => toggleFileSelection(file.id, e)}
                          className="rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div>
                            <div className="font-medium text-gray-900">{file.name}</div>
                            {file.shared && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Users className="h-3 w-3" />
                                Shared
                              </div>
                            )}
                          </div>
                          {file.starred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{file.owner}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(file.modified)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatFileSize(file.size)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(file.id);
                            }}
                            className="p-1 text-gray-400 hover:text-yellow-500 rounded"
                          >
                            <Star className={`h-4 w-4 ${file.starred ? 'text-yellow-500 fill-current' : ''}`} />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(file.id);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="group relative bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md cursor-pointer"
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={(e) => toggleFileSelection(file.id, e)}
                      className="absolute top-0 right-0 z-10 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2">
                        {file.thumbnail ? (
                          <img src={file.thumbnail} alt={file.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center">
                            {getFileIcon(file.type)}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm font-medium text-gray-900 truncate w-full" title={file.name}>
                        {file.name}
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(file.modified)}
                      </div>
                      
                      {file.starred && (
                        <Star className="absolute top-8 right-8 h-3 w-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selection Actions */}
        {selectedFiles.length > 0 && (
          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedFiles.length} item{selectedFiles.length !== 1 ? 's' : ''} selected
              </span>
              
              <div className="flex items-center gap-2">
                {selectionMode ? (
                  <button
                    onClick={() => {
                      const selectedFileObjects = files.filter(f => selectedFiles.includes(f.id));
                      selectedFileObjects.forEach(file => onFileSelect?.(file));
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Attach Selected
                  </button>
                ) : (
                  <>
                    <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded">
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded">
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded">
                      <Move className="h-4 w-4" />
                      Move
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-100 rounded">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Share Dialog */}
        {showShareDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Share file</h3>
                <button
                  onClick={() => setShowShareDialog(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add people and groups
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter email addresses"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Send
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Get link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value="https://bhadrive.bhamail.com/file/d/abc123"
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 p-4 border-t">
                <button
                  onClick={() => setShowShareDialog(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFileUpload(e.target.files);
            }
          }}
        />
      </div>
    </div>
  );
}