import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [students, setStudents] = useState([]);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Attendance State
  const [className, setClassName] = useState(user.teachingClasses?.[0] || '10-A');
  const [subject, setSubject] = useState(user.subjects?.[0] || 'Math');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});

  // Exams State
  const [exams, setExams] = useState([]);
  const [examForm, setExamForm] = useState({ subject: '', className: '', date: '', startTime: '', duration: '', room: '', totalMarks: 100, instructions: '' });

  // Marks State
  const [selectedExamId, setSelectedExamId] = useState('');
  const [marksRecords, setMarksRecords] = useState({});

  // Tuition State
  const [tuitionRequests, setTuitionRequests] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    if (activeTab === 'attendance') fetchStudents(className);
    else if (activeTab === 'exams') fetchExams();
    else if (activeTab === 'marks') { fetchExams(); /* students fetched when exam selected */ }
    else if (activeTab === 'tuition') fetchTuitionRequests();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'attendance') fetchStudents(className);
  }, [className]);


  // ---- ATTENDANCE LOGIC ----
  const fetchStudents = async (cName) => {
    if (!cName) return;
    try {
      const { data } = await api.get('/admin/students?className=' + cName);
      setStudents(data);
      if (data.length > 0) {
        const initial = {};
        data.forEach(s => initial[s._id] = 'present');
        setAttendanceRecords(initial);
      } else {
        setAttendanceRecords({});
      }
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  const handleStatusChange = (id, status) => {
    setAttendanceRecords(prev => ({ ...prev, [id]: status }));
  };

  const submitAttendance = async () => {
    if (students.length === 0) return alert('No students found to mark attendance.');
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId, status
      }));
      await api.post('/attendance/mark', {
        className, subject, date: attendanceDate, records
      });
      alert('Attendance Marked Successfully!');
    } catch (err) {
      alert('Error marking attendance: ' + (err.response?.data?.message || err.message));
    }
  };

  // ---- EXAMS LOGIC ----
  const fetchExams = async () => {
    try {
      const { data } = await api.get('/exams');
      setExams(data);
    } catch(err) { console.error(err); }
  };
  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exams', examForm);
      alert('Exam Created!');
      setExamForm({ subject: '', className: '', date: '', startTime: '', duration: '', room: '', totalMarks: 100, instructions: '' });
      fetchExams();
    } catch(err) { alert('Error creating exam'); }
  };

  // ---- MARKS LOGIC ----
  useEffect(() => {
    if (activeTab === 'marks' && selectedExamId) {
      const exam = exams.find(e => e._id === selectedExamId);
      if (exam) {
        fetchStudents(exam.className);
        fetchExistingMarks(exam._id);
      }
    } else if (activeTab === 'marks' && !selectedExamId) {
       setStudents([]);
    }
  }, [selectedExamId, activeTab]);

  const fetchExistingMarks = async (examId) => {
    try {
      const { data } = await api.get('/marks/exam/' + examId);
      const initial = {};
      data.forEach(m => initial[m.student._id] = { obtained: m.marksObtained, remarks: m.remarks });
      setMarksRecords(initial);
    } catch(err){ console.error(err); }
  };

  const handleMarkChange = (studentId, field, value) => {
    setMarksRecords(prev => ({ 
      ...prev, 
      [studentId]: { ...(prev[studentId] || {}), [field]: value } 
    }));
  };

  const submitMarks = async () => {
    const exam = exams.find(e => e._id === selectedExamId);
    if (!exam || students.length === 0) return alert('No valid exam or students.');
    try {
      let count = 0;
      for (const student of students) {
        const record = marksRecords[student._id];
        if (record && record.obtained !== undefined && record.obtained !== '') {
           await api.post('/marks', {
             student: student._id,
             exam: exam._id,
             subject: exam.subject,
             className: exam.className,
             marksObtained: Number(record.obtained),
             totalMarks: Number(exam.totalMarks),
             remarks: record.remarks || ''
           });
           count++;
        }
      }
      if (count === 0) return alert('Please enter marks for at least one student.');
      alert('Marks Saved Successfully!');
      fetchExistingMarks(exam._id);
    } catch(err) {
      alert('Error saving marks: ' + (err.response?.data?.message || err.message));
    }
  };

  // ---- TUITION LOGIC ----
  const fetchTuitionRequests = async () => {
    try {
      const { data } = await api.get('/tuition/teacher');
      setTuitionRequests(data);
    } catch(err) { console.error(err); }
  };
  const handleTuitionResponse = async (id, status) => {
    const reply = prompt(`Enter reply for the student (optional):`);
    try {
      await api.put(`/tuition/${id}/respond`, { status, teacherReply: reply });
      fetchTuitionRequests();
    } catch(err) { alert('Error responding to request'); }
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
                {/* Icons based on tab */}
                {tab === 'attendance' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {tab === 'exams' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                {tab === 'marks' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
                {tab === 'tuition' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
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
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 hover:text-red-600 transition-colors text-sm font-medium shadow-sm">
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 capitalize tracking-tight">{activeTab} Management</h1>
        </header>
        
        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 bg-gray-50/30 border-b border-gray-100 flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class Section</label>
                <input type="text" value={className} onChange={e => setClassName(e.target.value)} className="w-full pl-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. 10-A" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full pl-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. Mathematics" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-full pl-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-gray-700" />
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
                    <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-8 font-mono text-sm text-gray-500">{s.rollNumber}</td>
                      <td className="p-4 font-medium text-gray-900">{s.name}</td>
                      <td className="p-4 pr-8 text-right">
                        <select 
                          value={attendanceRecords[s._id] || 'present'} 
                          onChange={e => handleStatusChange(s._id, e.target.value)}
                          className={`appearance-none bg-none outline-none py-1.5 px-4 rounded-lg text-sm font-medium border cursor-pointer ${
                            attendanceRecords[s._id] === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            attendanceRecords[s._id] === 'absent' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
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
                        No students found for this class section. Instruct parents or admin to register students to this section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button disabled={students.length === 0} onClick={submitAttendance} className="bg-indigo-600 text-white px-8 py-3 rounded-xl disabled:opacity-50">Save Attendance</button>
            </div>
          </div>
        )}

        {/* EXAMS TAB */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Schedule New Exam</h3>
              <form onSubmit={handleExamSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input required type="text" placeholder="Subject (e.g. Science)" value={examForm.subject} onChange={e=>setExamForm({...examForm, subject: e.target.value})} className="border p-2 rounded-xl" />
                <input required type="text" placeholder="Class Name (e.g. 10-A)" value={examForm.className} onChange={e=>setExamForm({...examForm, className: e.target.value})} className="border p-2 rounded-xl" />
                <input required type="date" value={examForm.date} onChange={e=>setExamForm({...examForm, date: e.target.value})} className="border p-2 rounded-xl" />
                <input required type="time" value={examForm.startTime} onChange={e=>setExamForm({...examForm, startTime: e.target.value})} className="border p-2 rounded-xl" />
                <input required type="text" placeholder="Duration (e.g. 2 hours)" value={examForm.duration} onChange={e=>setExamForm({...examForm, duration: e.target.value})} className="border p-2 rounded-xl" />
                <input type="text" placeholder="Room/Hall (e.g. Lab 3)" value={examForm.room} onChange={e=>setExamForm({...examForm, room: e.target.value})} className="border p-2 rounded-xl" />
                <input required type="number" placeholder="Total Marks" value={examForm.totalMarks} onChange={e=>setExamForm({...examForm, totalMarks: e.target.value})} className="border p-2 rounded-xl" />
                <input type="text" placeholder="Instructions (optional)" value={examForm.instructions} onChange={e=>setExamForm({...examForm, instructions: e.target.value})} className="border p-2 rounded-xl md:col-span-2" />
                <button type="submit" className="bg-indigo-600 text-white rounded-xl py-2 md:col-span-3">Create Exam</button>
              </form>
            </div>

            <h3 className="text-lg font-bold mt-8">Scheduled Exams</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map(ex => (
                <div key={ex._id} className="bg-white border rounded-2xl p-4 shadow-sm">
                  <h4 className="font-bold text-indigo-700">{ex.subject}</h4>
                  <p className="text-sm text-gray-500 font-mono mb-2">Class: {ex.className}</p>
                  <div className="text-sm">
                    <p><strong>Date:</strong> {new Date(ex.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {ex.startTime} ({ex.duration})</p>
                    <p><strong>Marks:</strong> {ex.totalMarks}</p>
                  </div>
                </div>
              ))}
              {exams.length === 0 && <p className="text-gray-500">No exams scheduled yet.</p>}
            </div>
          </div>
        )}

        {/* MARKS TAB */}
        {activeTab === 'marks' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Exam</label>
                <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full md:w-1/2 p-2 border rounded-xl">
                  <option value="">-- Choose an Exam --</option>
                  {exams.map(ex => (
                    <option key={ex._id} value={ex._id}>{ex.subject} ({ex.className}) - {new Date(ex.date).toLocaleDateString()}</option>
                  ))}
                </select>
             </div>
             
             {selectedExamId && (
               <>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 pl-8">Student Name</th>
                      <th className="p-4">Marks Obtained</th>
                      <th className="p-4 pr-8">Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map(s => (
                      <tr key={s._id}>
                        <td className="p-4 pl-8 font-medium">{s.name} <span className="text-gray-400 font-mono ml-2">[{s.rollNumber}]</span></td>
                        <td className="p-4">
                          <input type="number" 
                            className="border rounded px-3 py-1 w-24" 
                            placeholder="Score"
                            value={marksRecords[s._id]?.obtained || ''}
                            onChange={(e) => handleMarkChange(s._id, 'obtained', e.target.value)}
                          /> 
                           <span className="text-sm text-gray-500 ml-2">/ {exams.find(e=>e._id===selectedExamId)?.totalMarks}</span>
                        </td>
                        <td className="p-4 pr-8">
                          <input type="text" 
                            className="border rounded px-3 py-1 w-full"
                            placeholder="Optional remarks..."
                            value={marksRecords[s._id]?.remarks || ''}
                            onChange={(e) => handleMarkChange(s._id, 'remarks', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-gray-500">No students found in this class section.</td></tr>}
                  </tbody>
                </table>
                <div className="p-6 border-t flex justify-end">
                  <button onClick={submitMarks} className="bg-indigo-600 text-white px-8 py-3 rounded-xl disabled:opacity-50" disabled={students.length===0}>Save All Marks</button>
                </div>
               </>
             )}
          </div>
        )}

        {/* TUITION TAB */}
        {activeTab === 'tuition' && (
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-xl font-bold mb-1">Tuition Requests</h3>
                <p className="text-gray-500 mb-4">Manage private tutoring requests from students and parents.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {tuitionRequests.map(req => (
                     <div key={req._id} className="border border-indigo-100 rounded-xl p-5 shadow-sm relative hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg">{req.student?.name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                            ${req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {req.status}
                          </span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1 mb-4">
                          <li><strong>Class:</strong> {req.student?.className}</li>
                          <li><strong>Subject needed:</strong> {req.subject}</li>
                          <li><strong>Preferred time:</strong> {req.preferredTime || 'Anytime'}</li>
                          {req.message && <li className="mt-2 text-gray-800 italic border-l-2 border-indigo-200 pl-2">"{req.message}"</li>}
                        </ul>
                        {req.status === 'pending' && (
                          <div className="flex gap-2 border-t pt-3 border-gray-100">
                             <button onClick={() => handleTuitionResponse(req._id, 'accepted')} className="flex-1 bg-emerald-500 text-white rounded-lg py-1.5 text-sm hover:bg-emerald-600">Accept</button>
                             <button onClick={() => handleTuitionResponse(req._id, 'rejected')} className="flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg py-1.5 text-sm hover:bg-red-100">Reject</button>
                          </div>
                        )}
                        {req.teacherReply && (
                          <div className="mt-3 text-sm bg-gray-50 p-2 rounded text-indigo-900 border border-gray-200">
                            <strong>Your Reply:</strong> {req.teacherReply}
                          </div>
                        )}
                     </div>
                   ))}
                   {tuitionRequests.length === 0 && <p className="text-gray-500">No tuition requests pending or confirmed yet.</p>}
                </div>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}
