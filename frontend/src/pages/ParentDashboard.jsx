import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import StudentFees from '../components/StudentFees';

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState('attendance');
  const [addModal, setAddModal] = useState({ isOpen: false, rollNumber: '', error: '' });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    fetchMyChildren();
  }, []);

  const fetchMyChildren = async () => {
    try {
      const { data } = await api.get('/parent/children');
      setChildren(data);
      if (data.length > 0 && !selectedChild) {
        handleChildSelect(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch children', err);
    }
  };

  const handleLinkChild = async (e) => {
    e.preventDefault();
    setAddModal({ ...addModal, error: '' });
    try {
      const res = await api.post('/parent/link-child', { rollNumber: addModal.rollNumber });
      setAddModal({ isOpen: false, rollNumber: '', error: '' });
      fetchMyChildren();
      handleChildSelect(res.data.student);
      alert('Child linked successfully!');
    } catch (err) {
      setAddModal({ ...addModal, error: err.response?.data?.message || 'Failed to link child. Check the roll number.' });
    }
  };

  const fetchAttendance = async (studentId) => {
    try {
      const { data } = await api.get(`/attendance/student/${studentId}`);
      setAttendance(data.records || []);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    }
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    fetchAttendance(child._id);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-indigo-50/30 font-sans text-gray-800">
      
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md shadow-pink-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Parent Portal</h2>
            <p className="text-xs font-medium text-pink-600 uppercase tracking-wider">Family View</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">My Children</p>
          <nav className="space-y-2">
            {children.map((child) => (
              <button
                key={child._id}
                onClick={() => handleChildSelect(child)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  selectedChild?._id === child._id 
                    ? 'bg-pink-50 text-pink-700 shadow-sm border border-pink-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  selectedChild?._id === child._id ? 'bg-pink-200 text-pink-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {child.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{child.name}</p>
                  <p className="text-xs opacity-80 truncate">Class: {child.className || 'N/A'}</p>
                </div>
              </button>
            ))}
          </nav>

          <button 
            onClick={() => setAddModal({ isOpen: true, rollNumber: '', error: '' })}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-pink-50 text-pink-700 border border-pink-100 py-2.5 rounded-xl hover:bg-pink-100 transition-colors duration-200 text-sm font-semibold shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Link a Child
          </button>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold border border-pink-200">
              {user.name?.charAt(0) || 'P'}
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
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto relative">
        
        {/* Add Child Modal */}
        {addModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Link Your Child</h3>
              <p className="text-sm text-gray-500 mb-6">Enter the exact Roll Number provided by the school administration to link their academic records.</p>
              
              {addModal.error && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 font-semibold border border-red-100">
                  {addModal.error}
                </div>
              )}
              
              <form onSubmit={handleLinkChild}>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Student Roll Number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 104 or 10-A-12"
                    value={addModal.rollNumber}
                    onChange={(e) => setAddModal({...addModal, rollNumber: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium text-gray-800"
                  />
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setAddModal({ isOpen: false, rollNumber: '', error: '' })}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg hover:shadow-pink-500/25 active:scale-[0.98] transition-all"
                  >
                    Link Child
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {selectedChild ? (
          <>
            <header className="mb-6 flex items-end justify-between border-b border-gray-200 pb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{selectedChild.name}'s Profile</h1>
                <p className="text-gray-500 mt-1">Review academic progress and financial statements.</p>
              </div>
              <div className="hidden sm:block text-right">
                <span className="inline-block px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-600">
                  Roll No: <span className="text-gray-900 font-mono">{selectedChild.rollNumber || 'PENDING'}</span>
                </span>
              </div>
            </header>

            <div className="flex space-x-2 border-b border-gray-100 mb-6">
              <button 
                onClick={() => setActiveTab('attendance')}
                className={`px-6 py-2.5 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === 'attendance' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Attendance Record
              </button>
              <button 
                onClick={() => setActiveTab('fees')}
                className={`px-6 py-2.5 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === 'fees' ? 'border-pink-600 text-pink-700 bg-pink-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Fee Statement
              </button>
            </div>
            
            {activeTab === 'attendance' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Recent Attendance Record
                  </h3>
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
                      {attendance.map(record => (
                        <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 pl-8 font-medium text-gray-800">
                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="p-4 text-gray-600">{record.subject || 'General'}</td>
                          <td className="p-4 pr-8 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                              record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              record.status === 'absent' ? 'bg-red-50 text-red-700 border-red-200' : 
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {record.status === 'present' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                              {record.status === 'absent' && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                              {record.status === 'late' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                              <span className="capitalize">{record.status || 'Unknown'}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                      {attendance.length === 0 && (
                        <tr>
                          <td colSpan="3" className="p-12 text-center text-gray-500">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3 border border-gray-100">
                              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </div>
                            <p>No recent attendance records found.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
               <StudentFees studentId={selectedChild._id} />
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-sm animate-pulse">
              <svg className="w-12 h-12 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Parent Portal</h2>
            <p className="text-gray-500 max-w-sm">Please select a child from the sidebar to view their academic profile and attendance.</p>
          </div>
        )}
      </main>
    </div>
  );
}
