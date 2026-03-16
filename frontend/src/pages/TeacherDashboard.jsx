import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [students, setStudents] = useState([]);
  const [className, setClassName] = useState('10-A');
  const [subject, setSubject] = useState('Math');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    if (activeTab === 'attendance') fetchStudents();
  }, [activeTab, className]);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/admin/students?className=' + className);
      setStudents(data);
      const initial = {};
      data.forEach(s => initial[s._id] = 'present');
      setAttendanceRecords(initial);
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  const handleStatusChange = (id, status) => {
    setAttendanceRecords(prev => ({ ...prev, [id]: status }));
  };

  const submitAttendance = async () => {
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId, status
      }));
      await api.post('/attendance/mark', {
        className, subject, date: attendanceDate, records
      });
      alert('Attendance Marked Successfully');
    } catch (err) {
      alert('Error marking attendance');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50/50 font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Teacher Portal</h2>
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Workspace</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Modules</p>
          <nav className="space-y-1">
            {['attendance', 'exams', 'marks', 'tuition'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl capitalize font-medium transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
              >
                {tab === 'attendance' && <svg className={`w-5 h-5 ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {tab === 'exams' && <svg className={`w-5 h-5 ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                {tab === 'marks' && <svg className={`w-5 h-5 ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
                {tab === 'tuition' && <svg className={`w-5 h-5 ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
              {user.name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors duration-200 text-sm font-medium shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 capitalize tracking-tight">{activeTab} Management</h1>
          <p className="text-gray-500 mt-1">Manage class records, student performance and schedules.</p>
        </header>
        
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 bg-gray-50/30 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class Section</label>
                  <div className="relative">
                    <input type="text" value={className} onChange={e => setClassName(e.target.value)} className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" placeholder="e.g. 10-A" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <div className="relative">
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" placeholder="e.g. Mathematics" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <div className="relative">
                    <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-gray-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    <th className="p-4 pl-8">Roll No</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4 pr-8 text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 pl-8 font-mono text-sm text-gray-500">{s.rollNumber}</td>
                      <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                           {s.name.charAt(0).toUpperCase()}
                         </div>
                         {s.name}
                      </td>
                      <td className="p-4 pr-8 text-right">
                        <select 
                          value={attendanceRecords[s._id] || 'present'} 
                          onChange={e => handleStatusChange(s._id, e.target.value)}
                          className={`appearance-none bg-none outline-none py-1.5 pl-4 pr-8 rounded-lg text-sm font-medium border cursor-pointer inline-flex transition-colors bg-[url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")] bg-[length:0.6em_auto] bg-no-repeat bg-[position:right_0.7rem_top_55%] ${
                            attendanceRecords[s._id] === 'present' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : attendanceRecords[s._id] === 'absent' 
                                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="3" className="p-12 text-center text-gray-500">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <p>No students found for this class section.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={submitAttendance}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium shadow-md shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Submit Records
              </button>
            </div>
          </div>
        )}

        {activeTab !== 'attendance' && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 capitalize">{activeTab} Module</h3>
            <p className="text-gray-500 max-w-sm">This module is currently in development. Full functionality will be available in the next release.</p>
          </div>
        )}
      </main>
    </div>
  );
}
