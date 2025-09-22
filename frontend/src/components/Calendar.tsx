import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { analyticsAPI } from '../api/api';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'verification' | 'user';
  status?: string;
  color: string;
}

interface CalendarData {
  events: CalendarEvent[];
  summary: {
    totalEvents: number;
    verifications: number;
    newUsers: number;
  };
}

interface CalendarComponentProps {
  className?: string;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({ className = '' }) => {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const response = await analyticsAPI.getCalendarEvents(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (response.success) {
        setCalendarData(response.data);
      } else {
        setError('Failed to load calendar data');
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (arg: any) => {
    setSelectedDate(new Date(arg.dateStr));
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    alert(`Event: ${event.title}\nDate: ${event.startStr}\nType: ${event.extendedProps.type}`);
  };

  if (loading) {
    return (
      <div className={`bg-white/15 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-[0_0_60px_rgba(168,85,247,0.4)] p-8 ${className}`}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <span className="text-white text-lg">Loading Calendar...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/15 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-[0_0_60px_rgba(168,85,247,0.4)] p-8 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-white mb-2">Failed to Load Calendar</h3>
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={loadCalendarData}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-medium rounded-xl hover:scale-105 transition duration-300 shadow-[0_0_20px_rgba(168,85,247,0.6)]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/15 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-[0_0_60px_rgba(168,85,247,0.4)] p-8 ${className}`}>
      {/* Calendar Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent mb-2">
          Calendar & Events
        </h2>
        <p className="text-white/80">Track verifications, user registrations, and system activities</p>
        
        {/* Statistics */}
        {calendarData?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total Events</p>
                  <p className="text-2xl font-bold text-white">{calendarData.summary.totalEvents}</p>
                </div>
                <div className="text-2xl opacity-80">📅</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Verifications</p>
                  <p className="text-2xl font-bold text-white">{calendarData.summary.verifications}</p>
                </div>
                <div className="text-2xl opacity-80">🛡️</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">New Users</p>
                  <p className="text-2xl font-bold text-white">{calendarData.summary.newUsers}</p>
                </div>
                <div className="text-2xl opacity-80">👥</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Component */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <style>{`
          .fc {
            color: white;
          }
          .fc-theme-standard .fc-scrollgrid {
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .fc-theme-standard td, .fc-theme-standard th {
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .fc-col-header-cell {
            background: rgba(255, 255, 255, 0.1);
            font-weight: 600;
          }
          .fc-daygrid-day {
            background: rgba(255, 255, 255, 0.05);
          }
          .fc-daygrid-day:hover {
            background: rgba(255, 255, 255, 0.1);
          }
          .fc-day-today {
            background: rgba(34, 211, 238, 0.1) !important;
          }
          .fc-button-primary {
            background: linear-gradient(45deg, #22d3ee, #a855f7);
            border: none;
            border-radius: 8px;
            font-weight: 500;
          }
          .fc-button-primary:hover {
            transform: scale(1.05);
          }
          .fc-button-primary:disabled {
            opacity: 0.6;
            transform: none;
          }
          .fc-event {
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            margin: 1px;
            padding: 2px 6px;
          }
          .fc-event:hover {
            transform: scale(1.05);
            z-index: 10;
          }
          .fc-toolbar-title {
            color: white;
            font-weight: 700;
            font-size: 1.5em;
          }
        `}</style>
        
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          events={calendarData?.events || []}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          aspectRatio={1.8}
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventClassNames={(arg) => {
            return `fc-event-${arg.event.extendedProps.type}`;
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <h4 className="text-lg font-semibold text-white mb-3">Event Types</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-white/80 text-sm">Approved Verifications</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span className="text-white/80 text-sm">Pending Verifications</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-white/80 text-sm">Rejected Verifications</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-white/80 text-sm">New User Registrations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarComponent;