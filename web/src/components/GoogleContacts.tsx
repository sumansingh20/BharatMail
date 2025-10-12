import { useState } from 'react';
import {
  Search, Plus, User, Users, Phone, Mail, Trash2,
  MoreVertical, Star, Tag, Filter, Grid, List, X,
  Download, Import, Settings
} from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  birthday?: string;
  notes?: string;
  labels: string[];
  starred: boolean;
  avatar?: string;
  lastContacted?: Date;
  groups: string[];
}

interface ContactGroup {
  id: string;
  name: string;
  contactCount: number;
  color: string;
}

interface BhaContactsProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSelect?: (contact: Contact) => void;
  selectionMode?: boolean;
}

export default function BhaContacts({ 
  isOpen, 
  onClose, 
  onContactSelect, 
  selectionMode = false 
}: BhaContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      company: 'Tech Corp',
      jobTitle: 'Software Engineer',
      address: '123 Main St, New York, NY 10001',
      birthday: '1990-05-15',
      notes: 'Met at tech conference 2024',
      labels: ['work', 'tech'],
      starred: true,
      groups: ['colleagues'],
      lastContacted: new Date('2024-03-10')
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 987-6543',
      company: 'Design Studio',
      jobTitle: 'UX Designer',
      labels: ['work', 'design'],
      starred: false,
      groups: ['colleagues', 'friends'],
      lastContacted: new Date('2024-03-08')
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
      phone: '+1 (555) 456-7890',
      company: 'Marketing Inc',
      jobTitle: 'Marketing Manager',
      labels: ['work'],
      starred: true,
      groups: ['colleagues'],
      lastContacted: new Date('2024-03-05')
    },
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@example.com',
      phone: '+1 (555) 234-5678',
      labels: ['personal', 'family'],
      starred: false,
      groups: ['family'],
      lastContacted: new Date('2024-03-12')
    }
  ]);

  const [groups] = useState<ContactGroup[]>([
    { id: '1', name: 'Colleagues', contactCount: 3, color: 'blue' },
    { id: '2', name: 'Friends', contactCount: 1, color: 'green' },
    { id: '3', name: 'Family', contactCount: 1, color: 'purple' },
    { id: '4', name: 'Clients', contactCount: 0, color: 'orange' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  // const [showGroupManager, setShowGroupManager] = useState(false);

  const [newContact, setNewContact] = useState<Partial<Contact>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    address: '',
    birthday: '',
    notes: '',
    labels: [],
    starred: false,
    groups: []
  });

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchQuery === '' || 
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup = selectedGroup === 'all' || 
      selectedGroup === 'starred' && contact.starred ||
      contact.groups.includes(selectedGroup);

    return matchesSearch && matchesGroup;
  });

  const handleContactSelect = (contact: Contact) => {
    if (selectionMode && onContactSelect) {
      onContactSelect(contact);
      return;
    }
    
    setEditingContact(contact);
    setNewContact(contact);
    setShowCreateContact(true);
  };

  const handleCreateContact = () => {
    if (!newContact.firstName || !newContact.email) return;

    const contact: Contact = {
      id: Date.now().toString(),
      firstName: newContact.firstName!,
      lastName: newContact.lastName || '',
      email: newContact.email!,
      phone: newContact.phone || '',
      company: newContact.company || '',
      jobTitle: newContact.jobTitle || '',
      address: newContact.address || '',
      birthday: newContact.birthday || '',
      notes: newContact.notes || '',
      labels: newContact.labels || [],
      starred: newContact.starred || false,
      groups: newContact.groups || []
    };

    setContacts(prev => [...prev, contact]);
    setShowCreateContact(false);
    resetNewContact();
  };

  const handleUpdateContact = () => {
    if (!editingContact || !newContact.firstName || !newContact.email) return;

    const updatedContact: Contact = {
      ...editingContact,
      firstName: newContact.firstName!,
      lastName: newContact.lastName || '',
      email: newContact.email!,
      phone: newContact.phone || '',
      company: newContact.company || '',
      jobTitle: newContact.jobTitle || '',
      address: newContact.address || '',
      birthday: newContact.birthday || '',
      notes: newContact.notes || '',
      labels: newContact.labels || [],
      starred: newContact.starred || false,
      groups: newContact.groups || []
    };

    setContacts(prev => prev.map(c => c.id === editingContact.id ? updatedContact : c));
    setShowCreateContact(false);
    setEditingContact(null);
    resetNewContact();
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    if (editingContact?.id === contactId) {
      setShowCreateContact(false);
      setEditingContact(null);
    }
  };

  const toggleContactStar = (contactId: string) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId ? { ...contact, starred: !contact.starred } : contact
    ));
  };

  const resetNewContact = () => {
    setNewContact({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      address: '',
      birthday: '',
      notes: '',
      labels: [],
      starred: false,
      groups: []
    });
  };

  const getContactInitials = (contact: Contact) => {
    return `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
  };

  const getGroupColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                BhaContacts
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={() => setShowCreateContact(true)}
              className="w-full flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-4"
            >
              <Plus className="h-4 w-4" />
              Create contact
            </button>

            <nav className="space-y-1">
              <button
                onClick={() => setSelectedGroup('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  selectedGroup === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>All contacts</span>
                  <span className="text-gray-500">{contacts.length}</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedGroup('starred')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  selectedGroup === 'starred' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Starred
                  </span>
                  <span className="text-gray-500">{contacts.filter(c => c.starred).length}</span>
                </div>
              </button>

              <hr className="my-2" />

              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Groups</span>
                <button
                  onClick={() => {/* setShowGroupManager(true) */}}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Settings className="h-3 w-3" />
                </button>
              </div>

              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedGroup === group.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getGroupColor(group.color)}`}></div>
                      {group.name}
                    </span>
                    <span className="text-gray-500">{group.contactCount}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-80"
                  />
                </div>

                {selectionMode && (
                  <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                    Select contacts to add
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded">
                  <Filter className="h-4 w-4" />
                </button>

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
                    <Grid className="h-4 w-4" />
                  </button>
                </div>

                <button className="p-2 text-gray-500 hover:text-gray-700 rounded">
                  <Import className="h-4 w-4" />
                </button>

                <button className="p-2 text-gray-500 hover:text-gray-700 rounded">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-auto">
            {viewMode === 'list' ? (
              <div className="divide-y divide-gray-200">
                {filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleContactSelect(contact)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedContacts(prev => 
                          e.target.checked 
                            ? [...prev, contact.id]
                            : prev.filter(id => id !== contact.id)
                        );
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />

                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                      {contact.avatar ? (
                        <img src={contact.avatar} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        getContactInitials(contact)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        {contact.starred && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{contact.email}</p>
                      {contact.company && (
                        <p className="text-xs text-gray-500 truncate">{contact.company}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      {contact.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${contact.phone}`;
                          }}
                          className="p-1 hover:text-green-600"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${contact.email}`;
                        }}
                        className="p-1 hover:text-blue-600"
                      >
                        <Mail className="h-4 w-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleContactStar(contact.id);
                        }}
                        className="p-1 hover:text-yellow-500"
                      >
                        <Star className={`h-4 w-4 ${contact.starred ? 'text-yellow-500 fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:text-gray-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                {filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer text-center"
                    onClick={() => handleContactSelect(contact)}
                  >
                    <div className="relative mb-3">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedContacts(prev => 
                            e.target.checked 
                              ? [...prev, contact.id]
                              : prev.filter(id => id !== contact.id)
                          );
                        }}
                        className="absolute top-0 right-0 h-4 w-4 text-blue-600 rounded"
                      />
                      
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-lg font-medium text-gray-600 mx-auto">
                        {contact.avatar ? (
                          <img src={contact.avatar} alt="" className="w-16 h-16 rounded-full" />
                        ) : (
                          getContactInitials(contact)
                        )}
                      </div>
                      
                      {contact.starred && (
                        <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">{contact.email}</p>
                    {contact.company && (
                      <p className="text-xs text-gray-500 truncate mt-1">{contact.company}</p>
                    )}

                    <div className="flex justify-center gap-2 mt-3">
                      {contact.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${contact.phone}`;
                          }}
                          className="p-1 text-gray-400 hover:text-green-600"
                        >
                          <Phone className="h-3 w-3" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${contact.email}`;
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Mail className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredContacts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <User className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">No contacts found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Selection Actions */}
          {selectedContacts.length > 0 && (
            <div className="border-t bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                </span>
                
                <div className="flex items-center gap-2">
                  {selectionMode ? (
                    <button
                      onClick={() => {
                        const selectedContactObjects = contacts.filter(c => selectedContacts.includes(c.id));
                        selectedContactObjects.forEach(contact => onContactSelect?.(contact));
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Add Selected
                    </button>
                  ) : (
                    <>
                      <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded">
                        <Mail className="h-4 w-4" />
                        Email
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded">
                        <Tag className="h-4 w-4" />
                        Label
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded">
                        <Users className="h-4 w-4" />
                        Group
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
        </div>

        {/* Create/Edit Contact Modal */}
        {showCreateContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingContact ? 'Edit Contact' : 'Create Contact'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateContact(false);
                    setEditingContact(null);
                    resetNewContact();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newContact.firstName || ''}
                      onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newContact.lastName || ''}
                      onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newContact.email || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newContact.phone || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={newContact.company || ''}
                      onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={newContact.jobTitle || ''}
                      onChange={(e) => setNewContact(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={newContact.address || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birthday
                  </label>
                  <input
                    type="date"
                    value={newContact.birthday || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, birthday: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newContact.notes || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="starred"
                    checked={newContact.starred || false}
                    onChange={(e) => setNewContact(prev => ({ ...prev, starred: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="starred" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    Star this contact
                  </label>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                <div>
                  {editingContact && (
                    <button
                      onClick={() => {
                        handleDeleteContact(editingContact.id);
                        setShowCreateContact(false);
                        setEditingContact(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCreateContact(false);
                      setEditingContact(null);
                      resetNewContact();
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingContact ? handleUpdateContact : handleCreateContact}
                    disabled={!newContact.firstName || !newContact.email}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editingContact ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}