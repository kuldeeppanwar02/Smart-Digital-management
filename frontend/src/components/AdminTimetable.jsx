import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AdminTimetable() {
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const initialDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(currentDay) ? currentDay : 'Monday';
  const [selectedDay, setSelectedDay] = useState(initialDay);
  
  // Array of 8 periods
  const [periods, setPeriods] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      periodNumber: i + 1,
      startTime: '',
      endTime: '',
      subject: '',
      teacher: '',
      room: ''
    }))
  );

  const standardClasses = ['Playgroup', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const standardSections = ['A', 'B', 'C', 'Group 1', 'Group 2'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass, selectedSection, selectedDay]);

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setTeachers(data.filter(u => u.role === 'teacher'));
    } catch (err) { console.error('Error fetching teachers', err); }
  };

  const fetchTimetable = async () => {
    try {
      const { data } = await api.get(`/timetable/class?className=${selectedClass}&section=${selectedSection}`);
      const dayData = data.find(d => d.dayOfWeek === selectedDay);
      
      if (dayData && dayData.periodInfo && dayData.periodInfo.length > 0) {
        // Merge fetched data onto standard 8 period grid
        const newPeriods = Array.from({ length: 8 }, (_, i) => {
          const existing = dayData.periodInfo.find(p => p.periodNumber === i + 1);
          return existing ? {
            periodNumber: existing.periodNumber,
            startTime: existing.startTime,
            endTime: existing.endTime,
            subject: existing.subject,
            teacher: existing.teacher?._id || '',
            room: existing.room || ''
          } : {
            periodNumber: i + 1,
            startTime: '',
            endTime: '',
            subject: '',
            teacher: '',
            room: ''
          };
        });
        setPeriods(newPeriods);
      } else {
        // Reset to empty
        setPeriods(Array.from({ length: 8 }, (_, i) => ({
          periodNumber: i + 1, startTime: '', endTime: '', subject: '', teacher: '', room: ''
        })));
      }
    } catch (err) {
      console.error('Error fetching timetable', err);
    }
  };

  const handlePeriodChange = (index, field, value) => {
    const newPeriods = [...periods];
    newPeriods[index][field] = value;
    setPeriods(newPeriods);
  };

  const copyPreviousDay = async () => {
    const prevIndex = days.indexOf(selectedDay) - 1;
    if (prevIndex < 0) return alert('No previous day to copy from.');
    const prevDay = days[prevIndex];
    try {
      const { data } = await api.get(`/timetable/class?className=${selectedClass}&section=${selectedSection}`);
      const dayData = data.find(d => d.dayOfWeek === prevDay);
      if (dayData && dayData.periodInfo) {
         const newPeriods = Array.from({ length: 8 }, (_, i) => {
          const existing = dayData.periodInfo.find(p => p.periodNumber === i + 1);
          return existing ? {
            periodNumber: existing.periodNumber,
            startTime: existing.startTime,
            endTime: existing.endTime,
            subject: existing.subject,
            teacher: existing.teacher?._id || '',
            room: existing.room || ''
          } : {
            periodNumber: i + 1, startTime: '', endTime: '', subject: '', teacher: '', room: ''
          };
        });
        setPeriods(newPeriods);
      } else {
        alert("Previous day is empty.");
      }
    } catch (err) {}
  };

  const saveTimetable = async () => {
    // Only save periods that have at least a subject or teacher defined
    const activePeriods = periods.filter(p => p.subject || p.teacher);
    try {
      await api.post('/timetable', {
        className: selectedClass,
        section: selectedSection,
        dayOfWeek: selectedDay,
        periodInfo: activePeriods
      });
      alert(`Timetable for ${selectedDay} saved successfully!`);
      // Re-fetch to normalize
      fetchTimetable();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save timetable');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Class Timetable Planner</h2>
          <p className="text-sm text-gray-500 font-medium">Assign subjects and teachers to daily periods</p>
        </div>
        <button onClick={saveTimetable} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
          Save Daily Schedule
        </button>
      </div>

      {/* Target Selectors */}
      <div className="flex flex-wrap gap-4 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Class</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full bg-white border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-gray-800">
            {standardClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Section</label>
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full bg-white border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-gray-800">
            {standardSections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Day of Week</label>
          <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="w-full bg-white border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-indigo-700">
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-end">
         <h3 className="text-lg font-bold text-gray-800 border-l-4 border-indigo-500 pl-3">Periods for {selectedDay}</h3>
         {days.indexOf(selectedDay) > 0 && (
           <button onClick={copyPreviousDay} className="text-sm text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
             Copy from {days[days.indexOf(selectedDay) - 1]}
           </button>
         )}
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left bg-white">
          <thead className="bg-gray-50">
            <tr className="text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
              <th className="p-4 text-center w-16">P.#</th>
              <th className="p-4 w-32">Time (e.g 9:00)</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Teacher</th>
              <th className="p-4 w-32">Room</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {periods.map((period, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                <td className="p-4 text-center font-bold text-gray-400">{period.periodNumber}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <input type="text" placeholder="09:00" value={period.startTime} onChange={(e) => handlePeriodChange(idx, 'startTime', e.target.value)} className="w-16 bg-gray-50 border border-gray-200 py-1.5 px-2 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
                    <span className="text-gray-400">-</span>
                    <input type="text" placeholder="09:45" value={period.endTime} onChange={(e) => handlePeriodChange(idx, 'endTime', e.target.value)} className="w-16 bg-gray-50 border border-gray-200 py-1.5 px-2 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
                  </div>
                </td>
                <td className="p-4">
                  <input type="text" placeholder="e.g. Mathematics" value={period.subject} onChange={(e) => handlePeriodChange(idx, 'subject', e.target.value)} className="w-full bg-gray-50 border border-gray-200 py-2 px-3 rounded-lg text-sm font-medium focus:ring-1 focus:ring-blue-500" />
                </td>
                <td className="p-4">
                  <select value={period.teacher} onChange={(e) => handlePeriodChange(idx, 'teacher', e.target.value)} className="w-full bg-gray-50 border border-gray-200 py-2 px-3 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 text-gray-700">
                    <option value="">-- No Teacher --</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.subjects?.join(', ') || 'N/A'})</option>)}
                  </select>
                </td>
                <td className="p-4">
                  <input type="text" placeholder="101" value={period.room} onChange={(e) => handlePeriodChange(idx, 'room', e.target.value)} className="w-full bg-gray-50 border border-gray-200 py-2 px-3 rounded-lg text-sm focus:ring-1 focus:ring-blue-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
