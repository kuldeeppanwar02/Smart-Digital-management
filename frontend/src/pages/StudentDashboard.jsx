import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import StudentFees from '../components/StudentFees';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendance, setAttendance] = useState({ records: [], summary: {} });
  const [teachers, setTeachers] = useState([]);
  const [tuitionForm, setTuitionForm] = useState({ teacherId: '', subject: '', message: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'tuition') fetchTeachers();
  }, [activeTab]);

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get('/attendance/my');
      setAttendance(data);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/admin/teachers');
      setTeachers(data);
    } catch (err) {
      console.error('Failed to fetch teachers', err);
    }
  };

  const submitTuitionRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tuition', tuitionForm);
      alert('Tuition Request Sent!');
      setTuitionForm({ teacherId: '', subject: '', message: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50/50 font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
           <div className="h-10 w-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
             <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path d="M12 14l9-5-9-5-9 5 9 5z" />
               <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
             </svg>
           </div>
           <div>
             <h2 className="text-lg font-bold text-gray-900 leading-tight">Student Portal</h2>
             <p className="text-xs font-medium text-blue-600 tracking-wider">Class: {user.className}</p>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Navigation</p>
          <nav className="space-y-1">
            {['attendance', 'exams', 'marks', 'fees', 'tuition'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl capitalize font-medium transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
              >
                {tab === 'attendance' && <svg className={`w-5 h-5 ${activeTab === tab ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                {tab === 'exams' && <svg className={`w-5 h-5 ${activeTab === tab ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                {tab === 'marks' && <svg className={`w-5 h-5 ${activeTab === tab ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                {tab === 'fees' && <svg className={`w-5 h-5 ${activeTab === tab ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {tab === 'tuition' && <svg className={`w-5 h-5 ${activeTab === tab ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
                {tab === 'tuition' ? 'Request Tuition' : tab}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              {user.name?.charAt(0) || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.rollNumber}</p>
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
          <h1 className="text-3xl font-bold text-gray-900 capitalize tracking-tight">
            {activeTab === 'tuition' ? 'Request Tuition' : activeTab}
          </h1>
          <p className="text-gray-500 mt-1">
            {activeTab === 'attendance' && "Track your presence and maintain your attendance required percentage."}
            {activeTab === 'tuition' && "Request extra help from your subject teachers."}
            {activeTab === 'fees' && "View your fee summary, outstanding dues, and receipts."}
            {activeTab !== 'attendance' && activeTab !== 'tuition' && activeTab !== 'fees' && "View your academic records and information."}
          </p>
        </header>

        {activeTab === 'fees' && <StudentFees />}

        {activeTab === 'attendance' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Classes</div>
                <div className="text-3xl font-bold text-gray-900">{attendance.summary.total || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl"></div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Present</div>
                <div className="text-3xl font-bold text-emerald-600">{attendance.summary.present || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-2xl"></div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Absent</div>
                <div className="text-3xl font-bold text-red-600">{attendance.summary.absent || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl"></div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Attendance %</div>
                <div className="text-3xl font-bold text-purple-600">{attendance.summary.percentage || 0}%</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900">Attendance History</h3>
                <p className="text-sm text-gray-500">Your recent presence records across all subjects.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      <th className="p-4 pl-8">Date</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4 pr-8 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attendance.records.map(r => (
                      <tr key={r._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-4 pl-8 text-sm text-gray-600 font-medium">
                          {new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-4 text-gray-900 font-medium">{r.subject}</td>
                        <td className="p-4 pr-8 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            r.status === 'present' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : r.status === 'late'
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {attendance.records.length === 0 && (
                      <tr>
                        <td colSpan="3" className="p-12 text-center text-gray-500">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                             <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <p>No attendance records found yet.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tuition' && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Request Assistance</h3>
            <p className="text-sm text-gray-500 mb-6">Need extra help? Send a direct tuition request to your subject teachers.</p>
            <form onSubmit={submitTuitionRequest} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Teacher</label>
                <select 
                  required
                  value={tuitionForm.teacherId} 
                  onChange={e => setTuitionForm({...tuitionForm, teacherId: e.target.value})}
                  className="w-full bg-gray-50 appearance-none border border-gray-200 text-gray-700 py-3 pl-4 pr-8 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                >
                  <option value="">-- Choose a faculty member --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name} (Subjects: {t.subjects.join(', ')})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Area</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Advanced Math"
                  value={tuitionForm.subject}
                  onChange={e => setTuitionForm({...tuitionForm, subject: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Why do you need tuition?"
                  value={tuitionForm.message}
                  onChange={e => setTuitionForm({...tuitionForm, message: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                ></textarea>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Request
              </button>
            </form>
          </div>
        )}

        {['exams', 'marks'].includes(activeTab) && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 capitalize">{activeTab} Details</h3>
            <p className="text-gray-500 max-w-sm">This module is currently in development. Your data will be accessible here in the next update.</p>
          </div>
        )}
      </main>
    </div>
  );
}
