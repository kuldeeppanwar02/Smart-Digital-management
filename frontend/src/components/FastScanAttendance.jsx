import React, { useState, useRef } from 'react';
import { ScanFace, UserCheck, AlertCircle } from 'lucide-react';

export default function FastScanAttendance({ students, attendanceRecords, setAttendanceRecords }) {
  const [scanInput, setScanInput] = useState('');
  const [lastScanned, setLastScanned] = useState(null);
  const inputRef = useRef(null);

  const handleScan = (e) => {
    e.preventDefault();
    const roll = scanInput.trim().toUpperCase();
    if (!roll) return;

    const student = students.find(s => (s.rollNumber || '').toUpperCase() === roll);
    if (student) {
      setAttendanceRecords(prev => ({ ...prev, [student._id]: 'present' }));
      setLastScanned({ success: true, student });
    } else {
      setLastScanned({ success: false, roll });
    }
    setScanInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row gap-6 items-center border border-indigo-800">
      <div className="flex bg-indigo-500/20 p-4 rounded-xl items-center justify-center shrink-0 border border-indigo-400/30">
         <ScanFace className="w-12 h-12 text-indigo-400 animate-pulse" />
      </div>
      
      <div className="flex-1 w-full">
        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
          Fast-Scan System
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-indigo-500 text-white tracking-widest shadow-sm">Pro</span>
        </h3>
        <p className="text-indigo-200 text-sm mb-4">Use a Barcode/QR scanner or manually type the Roll Number to instantly mark a student Present.</p>
        
        <form onSubmit={handleScan} className="flex gap-3">
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Scan ID or Enter Roll No..." 
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            className="flex-1 bg-gray-950/50 border border-indigo-500/40 rounded-xl px-4 py-3 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all font-mono"
          />
          <button type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow">
            Mark
          </button>
        </form>
      </div>

      <div className="w-full md:w-64 bg-gray-950/50 rounded-xl shadow-inner border border-indigo-500/20 flex flex-col justify-center p-4 self-stretch min-h-[100px]">
         {lastScanned === null ? (
            <div className="text-center text-indigo-300/50 text-sm font-semibold flex flex-col items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></div>
              Waiting for scan scanner...
            </div>
         ) : lastScanned.success ? (
            <div className="flex items-center gap-3 text-emerald-400 animate-fade-in">
              <div className="p-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Present</p>
                <p className="font-bold text-white leading-tight truncate text-sm">{lastScanned.student.name}</p>
              </div>
            </div>
         ) : (
            <div className="flex items-center gap-3 text-red-400 animate-fade-in">
              <div className="p-2 bg-red-400/10 border border-red-400/20 rounded-full shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                 <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-0.5">Not Found</p>
                 <p className="font-bold text-white leading-tight truncate text-sm">Roll: {lastScanned.roll}</p>
              </div>
            </div>
         )}
      </div>
    </div>
  );
}
