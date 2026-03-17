import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

export default function StudentTimetable({ classLevel, section }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const maxPeriods = 8;

  useEffect(() => {
    fetchTimetable();
  }, [classLevel, section]);

  const fetchTimetable = async () => {
    try {
      const { data } = await api.get(`/timetable/class?className=${classLevel}&section=${section}`);
      setTimetable(data);
    } catch (err) {
      console.error('Error fetching timetable', err);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodData = (day, periodNum) => {
    const dayData = timetable.find(d => d.dayOfWeek === day);
    if (!dayData) return null;
    return dayData.periodInfo.find(p => p.periodNumber === periodNum);
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
      pdf.save(`Timetable_Class_${classLevel}_${section}.pdf`);
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
          <h2 className="text-xl font-bold text-gray-900 leading-tight">Weekly Planner</h2>
          <p className="text-sm text-gray-500">Class {classLevel} - {section}</p>
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
            <h3 className="text-xl font-bold text-gray-800">Class {classLevel} - {section} Timetable</h3>
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
            {days.map(day => {
              const rowHasData = timetable.some(t => t.dayOfWeek === day && t.periodInfo.length > 0);
              const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
              
              return (
                <tr key={day} className={`${isToday ? 'bg-indigo-50/30' : ''}`}>
                  <td className="p-4 border border-gray-100 font-bold text-gray-700 text-center">
                    {day}
                    {isToday && <span className="block text-[10px] text-indigo-600 uppercase tracking-widest mt-1">Today</span>}
                  </td>
                  {Array.from({ length: maxPeriods }).map((_, i) => {
                    const period = getPeriodData(day, i + 1);
                    return (
                      <td key={i} className="p-2 border border-gray-100 h-24 align-top w-32 relative group hover:bg-gray-50 transition-colors">
                        {period && period.subject ? (
                          <div className="flex flex-col h-full bg-white p-2 rounded outline outline-1 outline-gray-200">
                            <span className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter mb-1">
                              {period.startTime} - {period.endTime}
                            </span>
                            <span className="text-sm font-bold text-indigo-700 leading-tight mb-auto">
                              {period.subject}
                            </span>
                            {period.teacher && (
                               <span className="text-[11px] font-medium text-gray-500 mt-2 truncate" title={period.teacher.name}>
                                 {period.teacher.name.split(' ')[0]}
                               </span>
                            )}
                            {period.room && (
                              <span className="absolute bottom-1 right-1 text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold">
                                {period.room}
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
