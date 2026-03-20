import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import StudentFees from '../components/StudentFees';
import StudentTimetable from '../components/StudentTimetable';
import ReportCardPDF from '../components/ReportCardPDF';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendance, setAttendance] = useState({ records: [], summary: {} });
  const [attendanceFilter, setAttendanceFilter] = useState('Total');
  const [queryForm, setQueryForm] = useState({ subject: '', message: '' });
  const [myQueries, setMyQueries] = useState([]);
  const [reportCard, setReportCard] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'query') fetchQueries();
    if (activeTab === 'marks' || activeTab === 'exams') fetchReportCard();
  }, [activeTab]);

  const fetchReportCard = async () => {
    try {
      const { data } = await api.get(`/marks/report-card/${user._id}`);
      setReportCard(data);
    } catch (err) {
      console.error('Failed to fetch report card', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get('/attendance/my');
      setAttendance(data);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    }
  };

  const fetchQueries = async () => {
    try {
      const { data } = await api.get('/queries/student');
      setMyQueries(data);
    } catch (err) {
      console.error('Failed to fetch queries', err);
    }
  };

  const submitQuery = async (e) => {
    e.preventDefault();
    try {
      await api.post('/queries', queryForm);
      alert('Help Query Sent!');
      setQueryForm({ subject: '', message: '' });
      fetchQueries();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send query');
    }
  };

  const getFilteredAttendance = () => {
    const now = new Date();
    let records = attendance.records || [];
    
    if (attendanceFilter === 'Current Month') {
      records = records.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (attendanceFilter === 'Previous Month') {
      records = records.filter(r => {
        const d = new Date(r.date);
        let prevMonth = now.getMonth() - 1;
        let year = now.getFullYear();
        if (prevMonth < 0) { prevMonth = 11; year--; }
        return d.getMonth() === prevMonth && d.getFullYear() === year;
      });
    }

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    return { records, summary: { total, present, absent, late, percentage } };
  };

  const filteredAttendance = getFilteredAttendance();

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800 w-full animate-fade-in">
      <main className="p-4 lg:p-8 w-full mx-auto max-w-7xl">
        <div className="flex overflow-x-auto no-scrollbar bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 gap-2 items-center">
            {['attendance', 'timetable', 'exams', 'marks', 'fees', 'query'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl capitalize font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab === 'query' ? 'Help / Query' : tab}
              </button>
            ))}
        </div>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 capitalize tracking-tight">
            {activeTab === 'query' ? 'Help / Query' : activeTab}
          </h1>
          <p className="text-gray-500 mt-1">
            {activeTab === 'attendance' && "Track your presence and maintain your attendance required percentage."}
            {activeTab === 'query' && "Ask your class teacher for assistance, guidance, or raise a concern."}
            {activeTab === 'fees' && "View your fee summary, outstanding dues, and receipts."}
            {activeTab !== 'attendance' && activeTab !== 'query' && activeTab !== 'fees' && "View your academic records and information."}
          </p>
        </header>

        {activeTab === 'fees' && <StudentFees />}
        {activeTab === 'timetable' && <StudentTimetable classLevel={user.className} section={user.section} />}

        {activeTab === 'attendance' && (
          <div className="space-y-8">
            {filteredAttendance.summary.total > 5 && filteredAttendance.summary.percentage < 75 && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-4 shadow-sm animate-fade-in">
                <div className="p-2 bg-red-100 rounded-lg shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-1">Low Attendance Warning</h4>
                  <p className="text-sm font-medium">Your current attendance is <strong>{filteredAttendance.summary.percentage}%</strong>, which is below the mandatory 75% threshold. Please ensure regular attendance to qualify for final exams.</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm w-fit">
              {['Current Month', 'Previous Month', 'Total'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setAttendanceFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    attendanceFilter === filter 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Classes</div>
                <div className="text-3xl font-bold text-gray-900">{filteredAttendance.summary.total || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl"></div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Present</div>
                <div className="text-3xl font-bold text-emerald-600">{filteredAttendance.summary.present || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-2xl"></div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Absent</div>
                <div className="text-3xl font-bold text-red-600">{filteredAttendance.summary.absent || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl"></div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Attendance %</div>
                <div className="text-3xl font-bold text-purple-600">{filteredAttendance.summary.percentage || 0}%</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900">Attendance History ({attendanceFilter})</h3>
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
                    {filteredAttendance.records.map(r => (
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

        {activeTab === 'query' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Request Assistance</h3>
              <p className="text-sm text-gray-500 mb-6">Send a direct query to your assigned Class Teacher.</p>
              <form onSubmit={submitQuery} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Area</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Leave Application, Academic Help"
                    value={queryForm.subject}
                    onChange={e => setQueryForm({...queryForm, subject: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea 
                    required
                    rows="4"
                    placeholder="Describe your query..."
                    value={queryForm.message}
                    onChange={e => setQueryForm({...queryForm, message: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  ></textarea>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Query
                </button>
              </form>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pl-1">My Recent Queries</h3>
              {myQueries.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
                  <p>No queries submitted yet.</p>
                </div>
              ) : (
                myQueries.map(q => (
                  <div key={q._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-gray-900">{q.subject}</h4>
                       <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${
                          q.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                       }`}>
                         {q.status}
                       </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{q.message}</p>
                    
                    {q.teacherReply && (
                      <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1">
                          Reply from {q.teacher?.name || 'Teacher'}
                        </span>
                        <p className="text-sm text-gray-700">{q.teacherReply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {['exams', 'marks'].includes(activeTab) && (
          reportCard ? (
            <ReportCardPDF data={reportCard} />
          ) : (
            <div className="p-8 text-center text-gray-500">Loading academic records...</div>
          )
        )}
      </main>
    </div>
  );
}
