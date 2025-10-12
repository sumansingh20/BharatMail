import { useState } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Search, Settings,
  Users, Video, Bell, X, Trash2
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  description?: string;
  location?: string;
  attendees?: string[];
  meetingLink?: string;
  color: string;
  reminder?: number; // minutes before
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface BhaCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreate?: (event: Omit<CalendarEvent, 'id'>) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
}

export default function BhaCalendar({ 
  isOpen, 
  onClose, 
  onEventCreate, 
  onEventEdit, 
  onEventDelete 
}: BhaCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Team Meeting',
      start: new Date(2024, 2, 15, 10, 0),
      end: new Date(2024, 2, 15, 11, 0),
      allDay: false,
      description: 'Weekly team sync meeting',
      location: 'Conference Room A',
      attendees: ['john@example.com', 'jane@example.com'],
      meetingLink: 'https://meet.bhamail.com/abc-defg-hij',
      color: 'blue',
      reminder: 15,
      repeat: 'weekly'
    },
    {
      id: '2',
      title: 'Project Deadline',
      start: new Date(2024, 2, 20, 0, 0),
      end: new Date(2024, 2, 20, 23, 59),
      allDay: true,
      description: 'Final submission for Q1 project',
      color: 'red',
      reminder: 1440, // 1 day
      repeat: 'none'
    },
    {
      id: '3',
      title: 'Client Presentation',
      start: new Date(2024, 2, 18, 14, 0),
      end: new Date(2024, 2, 18, 15, 30),
      allDay: false,
      description: 'Quarterly business review with key client',
      location: 'Executive Conference Room',
      attendees: ['client@example.com', 'sales@example.com'],
      meetingLink: 'https://meet.bhamail.com/xyz-uvwx-rst',
      color: 'green',
      reminder: 30,
      repeat: 'none'
    }
  ]);

  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    start: new Date(),
    end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    allDay: false,
    description: '',
    location: '',
    attendees: [],
    color: 'blue',
    reminder: 15,
    repeat: 'none'
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handleDateClick = (date: Date) => {
    setNewEvent(prev => ({
      ...prev,
      start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
      end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0)
    }));
    setShowCreateEvent(true);
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) return;

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title!,
      start: newEvent.start!,
      end: newEvent.end!,
      allDay: newEvent.allDay || false,
      description: newEvent.description || '',
      location: newEvent.location || '',
      attendees: newEvent.attendees || [],
      meetingLink: newEvent.meetingLink,
      color: newEvent.color || 'blue',
      reminder: newEvent.reminder || 15,
      repeat: newEvent.repeat || 'none'
    };

    setEvents(prev => [...prev, event]);
    onEventCreate?.(event);
    setShowCreateEvent(false);
    setNewEvent({
      title: '',
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000),
      allDay: false,
      description: '',
      location: '',
      attendees: [],
      color: 'blue',
      reminder: 15,
      repeat: 'none'
    });
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEvent(event);
    setShowCreateEvent(true);
  };

  const handleUpdateEvent = () => {
    if (!editingEvent || !newEvent.title || !newEvent.start || !newEvent.end) return;

    const updatedEvent: CalendarEvent = {
      ...editingEvent,
      title: newEvent.title!,
      start: newEvent.start!,
      end: newEvent.end!,
      allDay: newEvent.allDay || false,
      description: newEvent.description || '',
      location: newEvent.location || '',
      attendees: newEvent.attendees || [],
      meetingLink: newEvent.meetingLink,
      color: newEvent.color || 'blue',
      reminder: newEvent.reminder || 15,
      repeat: newEvent.repeat || 'none'
    };

    setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e));
    onEventEdit?.(updatedEvent);
    setShowCreateEvent(false);
    setEditingEvent(null);
    setNewEvent({
      title: '',
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000),
      allDay: false,
      description: '',
      location: '',
      attendees: [],
      color: 'blue',
      reminder: 15,
      repeat: 'none'
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    onEventDelete?.(eventId);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 text-white',
      red: 'bg-red-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-black',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              BhaCalendar
            </h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <h3 className="text-lg font-medium min-w-48 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              Today
            </button>
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 text-sm ${viewMode === 'month' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 text-sm ${viewMode === 'week' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-2 text-sm ${viewMode === 'day' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                Day
              </button>
            </div>
            
            <button
              onClick={() => setShowCreateEvent(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
            
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded">
              <Search className="h-4 w-4" />
            </button>
            
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded">
              <Settings className="h-4 w-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'month' && (
            <div className="h-full flex flex-col">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b bg-gray-50">
                {dayNames.map(day => (
                  <div key={day} className="p-3 text-sm font-medium text-gray-600 text-center">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="flex-1 grid grid-cols-7 gap-0">
                {getCalendarDays().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dayEvents = getEventsForDate(date);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-32 border-r border-b border-gray-200 p-1 cursor-pointer hover:bg-gray-50 ${
                        !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                      }`}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer ${getEventColor(event.color)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            {event.allDay ? event.title : `${formatTime(event.start)} ${event.title}`}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 font-medium">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Week and Day views would be implemented similarly */}
          {(viewMode === 'week' || viewMode === 'day') && (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">
                  {viewMode === 'week' ? 'Week' : 'Day'} view coming soon
                </p>
                <p className="text-sm">Switch to Month view to see events</p>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Event Modal */}
        {showCreateEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingEvent ? 'Edit Event' : 'Create Event'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateEvent(false);
                    setEditingEvent(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={newEvent.title || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter event title"
                  />
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={newEvent.allDay || false}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, allDay: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
                    All day
                  </label>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start
                    </label>
                    <input
                      type={newEvent.allDay ? 'date' : 'datetime-local'}
                      value={newEvent.start ? (newEvent.allDay 
                        ? newEvent.start.toISOString().split('T')[0]
                        : newEvent.start.toISOString().slice(0, 16)
                      ) : ''}
                      onChange={(e) => setNewEvent(prev => ({ 
                        ...prev, 
                        start: new Date(e.target.value) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End
                    </label>
                    <input
                      type={newEvent.allDay ? 'date' : 'datetime-local'}
                      value={newEvent.end ? (newEvent.allDay 
                        ? newEvent.end.toISOString().split('T')[0]
                        : newEvent.end.toISOString().slice(0, 16)
                      ) : ''}
                      onChange={(e) => setNewEvent(prev => ({ 
                        ...prev, 
                        end: new Date(e.target.value) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add description..."
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newEvent.location || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add location"
                  />
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Video className="inline h-4 w-4 mr-1" />
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={newEvent.meetingLink || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, meetingLink: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                {/* Attendees */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    Attendees
                  </label>
                  <input
                    type="text"
                    placeholder="Enter email addresses separated by commas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
                      setNewEvent(prev => ({ ...prev, attendees: emails }));
                    }}
                  />
                </div>

                {/* Options Row */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <select
                      value={newEvent.color || 'blue'}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="blue">Blue</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                      <option value="yellow">Yellow</option>
                      <option value="purple">Purple</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>

                  {/* Reminder */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Bell className="inline h-4 w-4 mr-1" />
                      Reminder
                    </label>
                    <select
                      value={newEvent.reminder || 15}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, reminder: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>None</option>
                      <option value={5}>5 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={1440}>1 day</option>
                    </select>
                  </div>

                  {/* Repeat */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repeat
                    </label>
                    <select
                      value={newEvent.repeat || 'none'}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, repeat: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                <div>
                  {editingEvent && (
                    <button
                      onClick={() => {
                        handleDeleteEvent(editingEvent.id);
                        setShowCreateEvent(false);
                        setEditingEvent(null);
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
                      setShowCreateEvent(false);
                      setEditingEvent(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                    disabled={!newEvent.title}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editingEvent ? 'Update' : 'Create'}
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