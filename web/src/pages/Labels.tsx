import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Settings, Tag, EyeOff, Search, ChevronDown, ChevronRight } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
  type: 'system' | 'user';
  messageCount: number;
  isVisible: boolean;
  showInMessageList?: boolean;
  showInLabelList?: boolean;
  description?: string;
  parentId?: string;
  createdAt?: string;
}

const labelColors = [
  '#1a73e8', '#d93025', '#ea4335', '#fbbc04', '#34a853', '#9aa0a6',
  '#f9ab00', '#ff6d01', '#c5221f', '#33b679', '#673ab7', '#03dac6',
  '#8e24aa', '#e91e63', '#ff9800', '#795548'
];

export default function LabelsPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(new Set());
  const [newLabel, setNewLabel] = useState({
    name: '',
    color: '#1a73e8',
    description: '',
    parentId: '',
    showInMessageList: true,
    showInLabelList: true
  });

  const systemLabels = [
    { name: 'Inbox', icon: '📥', messageCount: 12, color: '#1a73e8', description: 'Messages in your inbox' },
    { name: 'Starred', icon: '⭐', messageCount: 3, color: '#fbbc04', description: 'Starred messages' },
    { name: 'Snoozed', icon: '💤', messageCount: 1, color: '#9aa0a6', description: 'Snoozed messages' },
    { name: 'Important', icon: '🔔', messageCount: 5, color: '#ea4335', description: 'Important messages' },
    { name: 'Sent', icon: '📤', messageCount: 45, color: '#34a853', description: 'Sent messages' },
    { name: 'Drafts', icon: '📝', messageCount: 2, color: '#9aa0a6', description: 'Draft messages' },
    { name: 'All Mail', icon: '📨', messageCount: 156, color: '#1a73e8', description: 'All messages' },
    { name: 'Spam', icon: '🚫', messageCount: 8, color: '#ea4335', description: 'Spam messages' },
    { name: 'Trash', icon: '🗑️', messageCount: 23, color: '#9aa0a6', description: 'Deleted messages' },
  ];
  
  useEffect(() => {
    loadLabels();
  }, []);

  const loadLabels = async () => {
    setIsLoading(true);
    try {
      const mockLabels: Label[] = [
        { 
          id: '1', 
          name: 'Work', 
          color: '#1a73e8', 
          type: 'user', 
          messageCount: 25, 
          isVisible: true, 
          showInMessageList: true, 
          showInLabelList: true,
          description: 'Work-related emails',
          createdAt: new Date().toISOString()
        },
        { 
          id: '2', 
          name: 'Personal', 
          color: '#34a853', 
          type: 'user', 
          messageCount: 18, 
          isVisible: true, 
          showInMessageList: true, 
          showInLabelList: true,
          description: 'Personal emails',
          createdAt: new Date().toISOString()
        },
        { 
          id: '3', 
          name: 'Finance', 
          color: '#ea4335', 
          type: 'user', 
          messageCount: 8, 
          isVisible: true, 
          showInMessageList: true, 
          showInLabelList: true,
          description: 'Financial documents and statements',
          parentId: '2',
          createdAt: new Date().toISOString()
        },
        { 
          id: '4', 
          name: 'Travel', 
          color: '#fbbc04', 
          type: 'user', 
          messageCount: 12, 
          isVisible: false, 
          showInMessageList: false, 
          showInLabelList: true,
          description: 'Travel bookings and itineraries',
          createdAt: new Date().toISOString()
        },
      ];
      setLabels(mockLabels);
    } catch (err) {
      setError('Failed to load labels');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabel.name.trim()) return;

    try {
      const label: Label = {
        id: Date.now().toString(),
        name: newLabel.name,
        color: newLabel.color,
        type: 'user',
        messageCount: 0,
        isVisible: true,
        showInMessageList: newLabel.showInMessageList,
        showInLabelList: newLabel.showInLabelList,
        description: newLabel.description,
        parentId: newLabel.parentId || undefined,
        createdAt: new Date().toISOString(),
      };

      setLabels([...labels, label]);
      setShowCreateModal(false);
      setNewLabel({
        name: '',
        color: '#1a73e8',
        description: '',
        parentId: '',
        showInMessageList: true,
        showInLabelList: true
      });
    } catch (err) {
      setError('Failed to create label');
    }
  };

  const handleUpdateLabel = async (labelId: string, updates: Partial<Label>) => {
    try {
      setLabels(labels.map(label => 
        label.id === labelId ? { ...label, ...updates } : label
      ));
    } catch (err) {
      setError('Failed to update label');
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm('Are you sure you want to delete this label? This action cannot be undone.')) {
      return;
    }

    try {
      setLabels(labels.filter(label => label.id !== labelId));
    } catch (err) {
      setError('Failed to delete label');
    }
  };

  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getNestedLabels = () => {
    const topLevel = filteredLabels.filter(label => !label.parentId);
    const nested = new Map<string, Label[]>();
    
    filteredLabels.forEach(label => {
      if (label.parentId) {
        if (!nested.has(label.parentId)) {
          nested.set(label.parentId, []);
        }
        nested.get(label.parentId)!.push(label);
      }
    });

    return { topLevel, nested };
  };

  const { topLevel, nested } = getNestedLabels();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Tag className="h-6 w-6 text-blue-600" />
              Labels
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Organize your emails with labels. Create custom labels and manage their appearance.
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Label
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search labels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {selectedLabels.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedLabels.size} selected</span>
              <button
                onClick={() => setSelectedLabels(new Set())}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{labels.length}</div>
            <div className="text-xs text-gray-600">Custom Labels</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{labels.filter(l => l.isVisible).length}</div>
            <div className="text-xs text-gray-600">Visible</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-500">{labels.filter(l => !l.isVisible).length}</div>
            <div className="text-xs text-gray-600">Hidden</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">{labels.reduce((sum, l) => sum + l.messageCount, 0)}</div>
            <div className="text-xs text-gray-600">Total Messages</div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-6 mt-4 rounded">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* System Labels */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            System Labels
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-4">
              These labels are automatically created by BhaMail and cannot be deleted.
            </p>
            
            <div className="space-y-2">
              {systemLabels.map((label) => (
                <div
                  key={label.name}
                  className="flex items-center justify-between p-3 bg-white rounded border hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{label.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{label.name}</div>
                      <div className="text-xs text-gray-500">{label.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {label.messageCount} {label.messageCount === 1 ? 'message' : 'messages'}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Labels */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-gray-600" />
              Custom Labels
            </h2>
            <span className="text-sm text-gray-500">
              {labels.length} labels
            </span>
          </div>

          {topLevel.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No custom labels</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first label to organize your emails. Labels help you categorize and find your messages quickly.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Create First Label
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {topLevel.map((label) => (
                <LabelItem
                  key={label.id}
                  label={label}
                  nested={nested.get(label.id) || []}
                  selectedLabels={selectedLabels}
                  setSelectedLabels={setSelectedLabels}
                  expandedLabels={expandedLabels}
                  setExpandedLabels={setExpandedLabels}
                  onEdit={(label) => {
                    setEditingLabel(label);
                    setNewLabel({
                      name: label.name,
                      color: label.color,
                      description: label.description || '',
                      parentId: label.parentId || '',
                      showInMessageList: label.showInMessageList || true,
                      showInLabelList: label.showInLabelList || true
                    });
                    setShowEditModal(true);
                  }}
                  onDelete={handleDeleteLabel}
                  onUpdate={handleUpdateLabel}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Label Modal */}
      {showCreateModal && (
        <CreateLabelModal
          newLabel={newLabel}
          setNewLabel={setNewLabel}
          onSave={handleCreateLabel}
          onCancel={() => {
            setShowCreateModal(false);
            setNewLabel({
              name: '',
              color: '#1a73e8',
              description: '',
              parentId: '',
              showInMessageList: true,
              showInLabelList: true
            });
          }}
          labels={labels}
          colors={labelColors}
        />
      )}

      {/* Edit Label Modal */}
      {showEditModal && editingLabel && (
        <CreateLabelModal
          newLabel={newLabel}
          setNewLabel={setNewLabel}
          onSave={async () => {
            await handleUpdateLabel(editingLabel.id, {
              name: newLabel.name,
              color: newLabel.color,
              description: newLabel.description,
              parentId: newLabel.parentId || undefined,
              showInMessageList: newLabel.showInMessageList,
              showInLabelList: newLabel.showInLabelList
            });
            setShowEditModal(false);
            setEditingLabel(null);
          }}
          onCancel={() => {
            setShowEditModal(false);
            setEditingLabel(null);
          }}
          labels={labels.filter(l => l.id !== editingLabel.id)}
          colors={labelColors}
          isEditing={true}
        />
      )}
    </div>
  );
}

// Label Item Component for handling individual label display and nested labels
interface LabelItemProps {
  label: Label;
  nested: Label[];
  selectedLabels: Set<string>;
  setSelectedLabels: React.Dispatch<React.SetStateAction<Set<string>>>;
  expandedLabels: Set<string>;
  setExpandedLabels: React.Dispatch<React.SetStateAction<Set<string>>>;
  onEdit: (label: Label) => void;
  onDelete: (labelId: string) => void;
  onUpdate: (labelId: string, updates: Partial<Label>) => void;
}

function LabelItem({ 
  label, 
  nested, 
  selectedLabels, 
  setSelectedLabels,
  expandedLabels,
  setExpandedLabels,
  onEdit, 
  onDelete, 
  onUpdate 
}: LabelItemProps) {
  const isExpanded = expandedLabels.has(label.id);
  const hasNested = nested.length > 0;

  const toggleExpanded = () => {
    const newExpanded = new Set(expandedLabels);
    if (isExpanded) {
      newExpanded.delete(label.id);
    } else {
      newExpanded.add(label.id);
    }
    setExpandedLabels(newExpanded);
  };

  const toggleSelected = () => {
    const newSelected = new Set(selectedLabels);
    if (selectedLabels.has(label.id)) {
      newSelected.delete(label.id);
    } else {
      newSelected.add(label.id);
    }
    setSelectedLabels(newSelected);
  };

  return (
    <div>
      <div className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
        <div className="flex items-center space-x-3 flex-1">
          <input
            type="checkbox"
            checked={selectedLabels.has(label.id)}
            onChange={toggleSelected}
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          
          {hasNested && (
            <button onClick={toggleExpanded} className="text-gray-400 hover:text-gray-600">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: label.color }}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">{label.name}</span>
              {!label.isVisible && (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
            </div>
            {label.description && (
              <p className="text-sm text-gray-600 mt-1">{label.description}</p>
            )}
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-gray-500">
                {label.messageCount} {label.messageCount === 1 ? 'message' : 'messages'}
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {label.showInMessageList && <span>Message list</span>}
                {label.showInLabelList && <span>Label list</span>}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdate(label.id, { isVisible: !label.isVisible })}
            className={`text-xs px-2 py-1 rounded ${
              label.isVisible
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label.isVisible ? 'Visible' : 'Hidden'}
          </button>
          
          <button
            onClick={() => onEdit(label)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Edit label"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(label.id)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete label"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Nested labels */}
      {hasNested && isExpanded && (
        <div className="ml-8 mt-2 space-y-2">
          {nested.map((nestedLabel) => (
            <LabelItem
              key={nestedLabel.id}
              label={nestedLabel}
              nested={[]}
              selectedLabels={selectedLabels}
              setSelectedLabels={setSelectedLabels}
              expandedLabels={expandedLabels}
              setExpandedLabels={setExpandedLabels}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Modal Component for Creating/Editing Labels
interface CreateLabelModalProps {
  newLabel: any;
  setNewLabel: (label: any) => void;
  onSave: () => void;
  onCancel: () => void;
  labels: Label[];
  colors: string[];
  isEditing?: boolean;
}

function CreateLabelModal({ 
  newLabel, 
  setNewLabel, 
  onSave, 
  onCancel, 
  labels, 
  colors,
  isEditing = false
}: CreateLabelModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {isEditing ? 'Edit Label' : 'Create New Label'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label Name *
            </label>
            <input
              type="text"
              value={newLabel.name}
              onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter label name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewLabel({ ...newLabel, color })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newLabel.color === color ? 'border-gray-900 ring-2 ring-blue-500' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={newLabel.description}
              onChange={(e) => setNewLabel({ ...newLabel, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Label (optional)
            </label>
            <select
              value={newLabel.parentId}
              onChange={(e) => setNewLabel({ ...newLabel, parentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No parent (top-level)</option>
              {labels.filter(l => !l.parentId).map((parentLabel) => (
                <option key={parentLabel.id} value={parentLabel.id}>
                  {parentLabel.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Visibility Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newLabel.showInMessageList}
                  onChange={(e) => setNewLabel({ ...newLabel, showInMessageList: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Show in message list</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newLabel.showInLabelList}
                  onChange={(e) => setNewLabel({ ...newLabel, showInLabelList: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Show in label list</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!newLabel.name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Save' : 'Create'} Label
          </button>
        </div>
      </div>
    </div>
  );
}
