import React, { useState, useEffect } from 'react';
import api from '../api';

export default function ClassTimetableBuilder({ classTeacherOf }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Phase 14 extensions: Toggle between editing the weekly base template or a specific date exception
  const [editMode, setEditMode] = useState('base'); // 'base' or 'exception'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // The classTeacherOf prop is in format "10-A"
  const [className, section] = classTeacherOf.split('-');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchTimetable();
  }, [classTeacherOf, editMode, selectedDate]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/timetable/class?className=${className}&section=${section}`);
      
      if (editMode === 'base') {
         // Show only the master weekly templates
         setTimetable(data.filter(t => t.isBaseTemplate));
      } else {
         // Exception Mode: Create a blended view for the exact date
         // 1. Get the day of the week for the selected date
         const dateObj = new Date(selectedDate);
         const targetDay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
         
         // 2. Extract Base Template for that day
         const baseTemplate = data.find(t => t.isBaseTemplate && t.dayOfWeek === targetDay);
         
         // 3. Extract Override for that exact date (if any)
         const overrideRec = data.find(t => t.dateOverride === selectedDate);
         
         if (overrideRec) {
            // Priority given to override document
            setTimetable([overrideRec]); 
         } else if (baseTemplate) {
            // Map Base Template into a temporary override view for editing
            setTimetable([{
               ...baseTemplate,
               _id: null, // Wipe ID so edits save as new overrides rather than overwriting base
               isBaseTemplate: false,
               dateOverride: selectedDate
            }]);
         } else {
            setTimetable([]);
         }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDayForActiveView = () => {
     if (editMode === 'base') return days;
     const d = new Date(selectedDate);
     if (d.getDay() === 0) return []; // Sunday
     return [d.toLocaleDateString('en-US', { weekday: 'long' })];
  };

  const activeDaysList = getDayForActiveView();

  const getPeriod = (day, periodIndex) => {
    return timetable.find(t => t.dayOfWeek === day && t.period === periodIndex) || {};
  };

  const handlePeriodUpdate = async (day, periodIndex, subject, room) => {
    if (!subject) return;
    
    // Auto-fill Teacher Logic
    try {
      // Find the specific teacher mapped to this class, section, and subject
      const { data: teachers } = await api.get(`/admin/teachers`);
      const assignedTeacher = teachers.find(t => 
        (t.teachingClasses || []).includes(className) && 
        (t.teachingSections || []).includes(`${className}-${section}`) &&
        (t.subjects || []).includes(subject)
      );

      const payload = {
        className,
        section,
        dayOfWeek: day,
        period: periodIndex,
        subject,
        room: room || 'TBD',
        isBaseTemplate: editMode === 'base',
        dateOverride: editMode === 'exception' ? selectedDate : null
      };

      if (assignedTeacher) {
        payload.teacherId = assignedTeacher._id;
      }

      await api.post('/timetable', payload);
      fetchTimetable(); // Refresh table
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating period');
    }
  };

  const deletePeriod = async (day, periodIndex) => {
    if(!window.confirm('Clear this period?')) return;
    try {
      await api.post('/timetable', {
        className, section, dayOfWeek: day, period: periodIndex,
        subject: 'Free Period', room: '', isBaseTemplate: editMode === 'base', dateOverride: editMode === 'exception' ? selectedDate : null, teacherId: null
      });
      fetchTimetable();
    } catch (err) { alert('Error clearing period'); }
  };

  const markDayAsHoliday = async (day) => {
    if(!window.confirm(`Mark ${selectedDate} as a full Holiday? This will clear all periods.`)) return;
    try {
       await api.post('/timetable', {
        className, section, dayOfWeek: day, periodInfo: [],
        isBaseTemplate: false, dateOverride: selectedDate, isHoliday: true
      });
      fetchTimetable();
    } catch (err) { alert('Error setting holiday'); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your class schedule...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Class {className}-{section} Timetable</h2>
            <p className="text-indigo-100 max-w-xl text-sm md:text-base">
              As the designated Class Teacher, you can configure the Master Weekly Timetable below. Entering a subject automatically assigns the authorized teacher.
            </p>
          </div>
          <div className="hidden md:flex h-16 w-16 bg-white/20 rounded-2xl items-center justify-center backdrop-blur-sm border border-white/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 bg-gray-100/50 p-1.5 rounded-xl">
           <button 
             onClick={() => setEditMode('base')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${editMode === 'base' ? 'bg-white text-indigo-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-gray-200/50'}`}
           >
             Master Weekly Template
           </button>
           <button 
             onClick={() => setEditMode('exception')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${editMode === 'exception' ? 'bg-white text-rose-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-gray-200/50'}`}
           >
             Specific Date Override
           </button>
        </div>

        {editMode === 'exception' && (
          <div className="flex items-center gap-4">
             <input 
               type="date" 
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
             />
             {activeDaysList.length > 0 && (
               <button onClick={() => markDayAsHoliday(activeDaysList[0])} className="bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors">
                 Mark as Holiday
               </button>
             )}
          </div>
        )}
      </div>

      {timetable[0]?.isHoliday ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-12 text-center">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-rose-100">
             <span className="text-2xl">🏖️</span>
           </div>
           <h3 className="text-xl font-bold text-rose-800 mb-2">School Holiday Declared</h3>
           <p className="text-rose-600/80">You marked {selectedDate} as a complete holiday. All standard classes are suppressed for your section on this date.</p>
           <button onClick={() => deletePeriod(activeDaysList[0], 0)} className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 underline">Remove Holiday Marker</button>
        </div>
      ) : activeDaysList.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-12 text-center text-amber-800 font-bold">
           Sundays are not available for scheduling.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="p-4 font-bold text-gray-700 w-32 border-r border-gray-50 text-center">Day</th>
                {periods.map(p => (
                  <th key={p} className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider text-center border-r border-gray-50 min-w-[140px]">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeDaysList.map(day => (
                <tr key={day} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-4 font-bold text-gray-800 border-r border-gray-50 bg-gray-50/10 text-center relative">
                    {day}
                    {editMode === 'exception' && <span className="block mt-1 text-[10px] text-rose-500 font-bold">{selectedDate}</span>}
                  </td>
                  {periods.map(p => {
                    // Look up the specific element inside periodInfo directly from DB array schema format
                    const dayDoc = timetable.find(t => t.dayOfWeek === day);
                    const entry = dayDoc?.periodInfo?.find(info => info.periodNumber === p) || {};
                    
                    return (
                      <td key={`${day}-${p}`} className="p-2 border-r border-gray-50 relative group h-24">
                        {entry.subject && entry.subject !== 'Free Period' ? (
                          <div className={`${entry.subject === 'Cancelled' ? 'bg-rose-50 border-rose-200' : 'bg-indigo-50 border-indigo-100'} border rounded-xl p-3 h-full flex flex-col justify-center relative hover:shadow-sm transition-all`}>
                            <button 
                              onClick={() => deletePeriod(day, p)}
                              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10"
                              title="Clear Period"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <span className={`font-bold text-sm block truncate ${entry.subject === 'Cancelled' ? 'text-rose-700 line-through' : 'text-indigo-900'}`} title={entry.subject}>{entry.subject}</span>
                            <span className={`text-xs font-medium block truncate mt-0.5 ${entry.subject === 'Cancelled' ? 'text-rose-500/70' : 'text-indigo-600'}`} title={entry.teacher?.name || 'Self'}>
                              {entry.subject === 'Cancelled' ? 'Class Dismissed' : entry.teacher?.name || 'Self'}
                            </span>
                            {entry.room && <span className="text-[10px] text-gray-400 mt-1 block">Room {entry.room}</span>}
                          </div>
                        ) : (
                          <div className="h-full min-h-[80px] flex flex-col items-center justify-center p-2 opacity-50 hover:opacity-100 transition-opacity bg-white">
                              {editMode === 'exception' ? (
                                 <button
                                   onClick={() => handlePeriodUpdate(day, p, 'Cancelled', '')}
                                   className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded w-full mb-2 hover:bg-rose-100"
                                 >
                                   Mark Cancelled
                                 </button>
                              ) : null}
                              <input 
                                type="text" 
                                placeholder="+ Subject" 
                                className="w-full text-xs text-center border-b border-gray-200 bg-transparent focus:outline-none focus:border-indigo-500 pb-1 mb-1 placeholder-gray-400"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handlePeriodUpdate(day, p, e.target.value, '');
                                    e.target.value = '';
                                  }
                                }}
                              />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-center text-gray-400 mt-4">
        {editMode === 'base' ? 
          `Tip: The system automatically searches for a teacher assigned to ${className}-${section} who teaches the subject you enter and locks them in.` : 
          `Override Mode: Any changes made here ONLY affect ${selectedDate}. It overrides the master template for student planners.`
        }
      </p>
    </div>
  );
}
