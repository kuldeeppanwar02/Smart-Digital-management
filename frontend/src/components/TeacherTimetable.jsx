import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

export default function TeacherTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const maxPeriods = 8;

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const { data } = await api.get(`/timetable/teacher`);
      setTimetable(data);
    } catch (err) {
      console.error('Error fetching teacher timetable', err);
    } finally {
      setLoading(false);
    }
  };

  const getDatesForCurrentWeek = () => {
    const today = new Date();
    // Get Monday of current week
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);

    return days.map((dayName, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        name: dayName,
        dateString: date.toISOString().split('T')[0],
        isToday: date.toDateString() === today.toDateString()
      };
    });
  };

  const weekDays = getDatesForCurrentWeek();

  const getDailyScheduleConfigs = (dayName, dateString) => {
     // A teacher might have multiple overlapping classes. We must group them by their class/section first.
     // Then resolve overrides *per class section* because one class might have a holiday while another doesn't.
     const relevantConfigs = [];
     
     // 1. Get all unique class+section combos for this teacher on this day
     const classComboSet = new Set(timetable.map(t => `${t.className}-${t.section}`));
     
     classComboSet.forEach(combo => {
        const [cls, sec] = combo.split('-');
        
        // Find base template for this specific class group
        const baseTmp = timetable.find(t => t.className === cls && t.section === sec && t.dayOfWeek === dayName && t.isBaseTemplate);
        
        // Find override for this specific class group on this exact date
        const overrideTmp = timetable.find(t => t.className === cls && t.section === sec && t.dateOverride === dateString);
        
        const activeDoc = overrideTmp || baseTmp;
        if (activeDoc) relevantConfigs.push(activeDoc);
     });
     
     return relevantConfigs;
  };

  const getPeriodData = (dailyConfigs, periodNum) => {
     // Search across the active resolved configs for this day to find the target period assigned to this teacher
     for (const record of dailyConfigs) {
       if (record.isHoliday) continue;
       const period = record.periodInfo.find(p => p.periodNumber === periodNum && p.teacher && p.teacher._id === JSON.parse(localStorage.getItem('user'))._id);
       if (period) {
         return { ...period, className: record.className, section: record.section, isCancelled: period.subject === 'Cancelled' };
       }
     }
     
     // Check if the teacher has any periods assigned that day... if the entire record set says holiday, return a holiday flag
     if (dailyConfigs.length > 0 && dailyConfigs.every(c => c.isHoliday)) {
         return { isHoliday: true };
     }

     return null;
  };

  const downloadPDF = async () => {
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).jsPDF;

    const element = printRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`My_Weekly_Schedule.pdf`);
    } catch (err) {
      alert('Failed to generate PDF');
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your schedule...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">My Weekly Schedule</h2>
          <p className="text-sm text-gray-500">Your assigned classes across all sections.</p>
        </div>
        <button 
          onClick={downloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition-colors shadow-sm border border-indigo-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download PDF
        </button>
      </div>

      <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 overflow-x-auto">
        <div className="text-center mb-6 block md:hidden">
            <h3 className="text-xl font-bold text-gray-800">My Timetable</h3>
        </div>
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="p-4 bg-gray-50 border border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wider text-center w-24">Day</th>
              {Array.from({ length: maxPeriods }).map((_, i) => (
                <th key={i} className="p-3 bg-gray-50 border border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                  Period {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDays.map(dayObj => {
              const dailyConfigs = getDailyScheduleConfigs(dayObj.name, dayObj.dateString);
              // Quick check if the whole day across all their classes is marked as holiday
              const overallHoliday = dailyConfigs.length > 0 && dailyConfigs.every(c => c.isHoliday);

              if (overallHoliday) {
                return (
                  <tr key={dayObj.name} className={`${dayObj.isToday ? 'bg-rose-50/30' : 'bg-gray-50/10'}`}>
                    <td className="p-4 border border-rose-100 font-bold text-rose-800 text-center relative z-10 w-24">
                      {dayObj.name}
                      <span className="block text-[10px] font-bold text-rose-500 mt-1">{dayObj.dateString}</span>
                      {dayObj.isToday && <span className="block text-[10px] text-rose-600 uppercase tracking-widest mt-1">Today</span>}
                    </td>
                    <td colSpan={maxPeriods} className="bg-rose-50/50 p-6 text-center border border-rose-100">
                      <span className="text-xl mr-2">🏖️</span>
                      <span className="font-bold text-rose-700 tracking-wider uppercase text-sm">Classes Cancelled / Holiday Declared</span>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={dayObj.name} className={`${dayObj.isToday ? 'bg-indigo-50/30' : ''}`}>
                  <td className="p-4 border border-gray-100 font-bold text-gray-700 text-center relative w-24">
                    {dayObj.name}
                    <span className="block text-[10px] font-bold text-indigo-400 mt-1">{dayObj.dateString}</span>
                    {dayObj.isToday && <span className="block text-[10px] text-indigo-600 uppercase tracking-widest mt-1">Today</span>}
                  </td>
                  {Array.from({ length: maxPeriods }).map((_, i) => {
                    const period = getPeriodData(dailyConfigs, i + 1);
                    return (
                      <td key={i} className="p-2 border border-gray-100 h-24 align-top w-32 relative group hover:bg-gray-50 transition-colors">
                        {period && period.subject && !period.isHoliday ? (
                          <div className={`flex flex-col h-full text-white p-2 rounded outline outline-1 shadow-sm ${period.isCancelled ? 'bg-rose-500 outline-rose-600' : 'bg-indigo-500 outline-indigo-600'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-bold font-mono tracking-tighter ${period.isCancelled ? 'text-rose-100' : 'text-indigo-100'}`}>
                                {period.startTime || 'Time N/A'}
                              </span>
                              <span className={`text-[10px] font-bold bg-white px-1 py-0.5 rounded leading-none ${period.isCancelled ? 'text-rose-600' : 'text-indigo-600'}`}>
                                {period.className}-{period.section}
                              </span>
                            </div>
                            <span className={`text-sm font-bold leading-tight mb-auto ${period.isCancelled ? 'line-through opacity-80' : ''}`}>
                              {period.subject}
                            </span>
                            {period.isCancelled && <span className="text-[9px] uppercase tracking-wider font-bold text-rose-100 mt-1 mb-1">Cancelled</span>}
                            {period.room && !period.isCancelled && (
                              <span className="absolute bottom-1 right-1 text-[9px] bg-white/20 text-indigo-50 px-1.5 py-0.5 rounded font-bold">
                                Rm {period.room}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-300 text-xs font-medium">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
