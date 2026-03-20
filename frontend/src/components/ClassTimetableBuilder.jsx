import React, { useState, useEffect } from 'react';
import api from '../api';
import { Calendar as CalendarIcon, Clock, Edit2, AlertCircle, Trash2, ShieldAlert } from 'lucide-react';

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

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading your class schedule...</div>;

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="glass-card rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-[#0A84FF]/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <div className="flex justify-between items-center z-10 relative">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 font-heading flex items-center gap-3">
              <CalendarIcon className="text-[#0A84FF] w-8 h-8" />
              Class {className}-{section} Timetable
            </h2>
            <p className="text-gray-400 max-w-xl text-sm md:text-base">
              As the designated Class Teacher, you can configure the Master Weekly Timetable below. Entering a subject automatically assigns the authorized teacher.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 bg-[#121212]/50 p-1.5 rounded-xl border border-white/5">
           <button 
             onClick={() => setEditMode('base')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${editMode === 'base' ? 'bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20 shadow-[0_0_15px_rgba(10,132,255,0.15)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
           >
             <Clock className="w-4 h-4" />
             Master Weekly Template
           </button>
           <button 
             onClick={() => setEditMode('exception')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${editMode === 'exception' ? 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 shadow-[0_0_15px_rgba(255,59,48,0.15)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
           >
             <AlertCircle className="w-4 h-4" />
             Specific Date Override
           </button>
        </div>

        {editMode === 'exception' && (
          <div className="flex items-center gap-4">
             <div className="relative">
               <input 
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="bg-[#121212] border border-white/10 px-4 py-2 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#FF3B30]/50 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
               />
             </div>
             {activeDaysList.length > 0 && (
               <button onClick={() => markDayAsHoliday(activeDaysList[0])} className="bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#FF3B30]/20 transition-colors flex items-center gap-1">
                 <ShieldAlert className="w-4 h-4" />
                 Mark as Holiday
               </button>
             )}
          </div>
        )}
      </div>

      {timetable[0]?.isHoliday ? (
        <div className="bg-[#FF3B30]/5 border border-[#FF3B30]/20 rounded-2xl p-12 text-center backdrop-blur-md">
           <div className="w-16 h-16 bg-[#121212] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FF3B30]/20 shadow-[0_0_20px_rgba(255,59,48,0.2)]">
             <span className="text-2xl">🏖️</span>
           </div>
           <h3 className="text-xl font-bold text-[#FF3B30] mb-2 font-heading">School Holiday Declared</h3>
           <p className="text-[#FF3B30]/70">You marked {selectedDate} as a complete holiday. All standard classes are suppressed for your section on this date.</p>
           <button onClick={() => deletePeriod(activeDaysList[0], 0)} className="mt-4 text-xs font-bold text-gray-500 hover:text-[#FF3B30] underline transition-colors">Remove Holiday Marker</button>
        </div>
      ) : activeDaysList.length === 0 ? (
        <div className="bg-[#FF9500]/5 border border-[#FF9500]/20 rounded-2xl p-12 text-center text-[#FF9500] font-bold backdrop-blur-md">
           Sundays are not available for scheduling.
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-x-auto border border-white/5">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 font-bold text-gray-400 w-32 border-r border-white/5 text-center">Day</th>
                {periods.map(p => (
                  <th key={p} className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider text-center border-r border-white/5 min-w-[140px]">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeDaysList.map(day => (
                <tr key={day} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white border-r border-white/5 bg-[#121212]/50 text-center relative">
                    {day}
                    {editMode === 'exception' && <span className="block mt-1 text-[10px] text-[#FF3B30] font-bold bg-[#FF3B30]/10 py-0.5 rounded px-1 w-max mx-auto">{selectedDate}</span>}
                  </td>
                  {periods.map(p => {
                    // Look up the specific element inside periodInfo directly from DB array schema format
                    const dayDoc = timetable.find(t => t.dayOfWeek === day);
                    const entry = dayDoc?.periodInfo?.find(info => info.periodNumber === p) || {};
                    
                    return (
                      <td key={`${day}-${p}`} className="p-2 border-r border-white/5 relative group h-28">
                        {entry.subject && entry.subject !== 'Free Period' ? (
                          <div className={`${entry.subject === 'Cancelled' ? 'bg-[#FF3B30]/10 border-[#FF3B30]/20 shadow-[0_0_10px_rgba(255,59,48,0.1)]' : 'bg-[#0A84FF]/10 border-[#0A84FF]/20 shadow-[0_0_10px_rgba(10,132,255,0.05)]'} border rounded-xl p-3 h-full flex flex-col justify-center relative hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
                            <button 
                              onClick={() => deletePeriod(day, p)}
                              className="absolute -top-2 -right-2 bg-[#121212] text-[#FF3B30] border border-[#FF3B30]/30 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FF3B30] hover:text-white z-10"
                              title="Clear Period"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <span className={`font-bold text-sm block truncate ${entry.subject === 'Cancelled' ? 'text-[#FF3B30] line-through' : 'text-[#0A84FF]'}`} title={entry.subject}>{entry.subject}</span>
                            <span className={`text-xs font-medium block truncate mt-1 flex items-center gap-1 ${entry.subject === 'Cancelled' ? 'text-[#FF3B30]/70' : 'text-gray-300'}`} title={entry.teacher?.name || 'Self'}>
                              {entry.subject === 'Cancelled' ? 'Class Dismissed' : entry.teacher?.name || 'Self'}
                            </span>
                            {entry.room && <span className="text-[10px] text-gray-500 mt-1 block px-2 py-0.5 bg-[#121212] rounded w-max border border-white/5">Room {entry.room}</span>}
                          </div>
                        ) : (
                          <div className="h-full min-h-[90px] flex flex-col items-center justify-center p-2 opacity-30 hover:opacity-100 transition-opacity bg-transparent rounded-xl border border-dashed border-white/10 group-hover:bg-white/5">
                              {editMode === 'exception' ? (
                                 <button
                                   onClick={() => handlePeriodUpdate(day, p, 'Cancelled', '')}
                                   className="text-[10px] font-bold text-[#FF3B30] bg-[#FF3B30]/10 border border-[#FF3B30]/20 px-2 py-1 rounded w-full mb-2 hover:bg-[#FF3B30]/20 transition-colors"
                                 >
                                   Mark Cancelled
                                 </button>
                              ) : null}
                              <div className="relative w-full">
                                <Edit2 className="w-3 h-3 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
                                <input 
                                  type="text" 
                                  placeholder="Add Subject" 
                                  className="w-full text-xs text-center border-b border-white/10 bg-[#121212]/50 rounded px-6 py-1.5 focus:outline-none focus:border-[#0A84FF]/50 focus:bg-[#121212] text-white placeholder-gray-600 transition-all font-medium"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handlePeriodUpdate(day, p, e.target.value, '');
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </div>
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
      <p className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4 text-gray-400" />
        {editMode === 'base' ? 
          `Tip: The system automatically searches for a teacher assigned to Class ${className}-${section} who teaches the subject you enter and locks them in.` : 
          `Override Mode: Any changes made here ONLY affect ${selectedDate}. It overrides the master template for student planners.`
        }
      </p>
    </div>
  );
}
