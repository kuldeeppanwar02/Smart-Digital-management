import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import AdminFees from '../components/AdminFees';
import AdminTimetable from '../components/AdminTimetable';
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  CheckCircle,
  TrendingUp,
  Calendar as CalendarIcon,
  Map
} from 'lucide-react';
import AdminAnalyticsCharts from '../components/AdminAnalyticsCharts';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [school, setSchool] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeTab, setActiveTab] = useState('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, user: null, rollNumber: '', className: '', section: '', subjects: '', teachingClasses: '', teachingSections: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, user: null, formData: {} });
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Predefined standard classes and sections to prevent typing errors and ensure assignments can happen before students register
  const standardClasses = ['Playgroup', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const standardSections = ['A', 'B', 'C', 'Group 1', 'Group 2'];

  const getRelevantSubjectCategories = (selectedClasses) => {
    if (!selectedClasses || selectedClasses.length === 0) return null;
    
    const hasHigherSec = selectedClasses.some(c => ['11', '12'].includes(c.toString()));
    const hasLowerSec = selectedClasses.some(c => !['11', '12'].includes(c.toString()));
    
    const categories = {};
    if (hasLowerSec) {
      categories["Core & Sciences (Primary/Secondary)"] = ["Mathematics", "Science", "Computer Science", "EVS", "Social Science"];
      categories["Languages"] = ["English", "Hindi", "Sanskrit", "French", "Urdu", "Punjabi"];
      categories["Others"] = ["Physical Education", "Fine Arts", "GK"];
    }
    if (hasHigherSec) {
      categories["Science Stream (11th & 12th)"] = ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science"];
      categories["Commerce & Arts (11th & 12th)"] = ["Accounts", "Economics", "Business Studies", "History", "Geography", "Political Science"];
      categories["Languages & Others (11th & 12th)"] = ["English", "Hindi", "Physical Education", "Fine Arts"];
    }
    return categories;
  };

  const fetchRevenue = async () => {
    try {
      const { data } = await api.get('/fees/school/2023-2024');
      const revenue = data.reduce((acc, curr) => acc + (curr.paid || 0), 0);
      setTotalRevenue(revenue);
    } catch(err) {
      console.error('Error fetching revenue', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRevenue();
    if (user.role === 'school_admin' || user.role === 'principal') {
      fetchSchoolConfig();
    }
  }, []);

  const fetchSchoolConfig = async () => {
    try {
      const { data } = await api.get('/schools/config');
      setSchool(data);
    } catch (err) {
      console.error('Error fetching school config', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveClick = (u) => {
    if (u.role === 'student') {
      setApprovalModal({ isOpen: true, user: u, rollNumber: '', className: '', section: '', subjects: [], teachingClasses: [], teachingSections: [] });
    } else if (u.role === 'teacher') {
      setApprovalModal({ isOpen: true, user: u, rollNumber: '', className: '', section: '', subjects: [], teachingClasses: [], teachingSections: [] });
    } else {
      approveUser(u._id, {});
    }
  };

  const approveUser = async (id, payload = {}) => {
    try {
      await api.patch(`/admin/users/${id}/approve`, payload);
      setApprovalModal({ isOpen: false, user: null, rollNumber: '', className: '', section: '', subjects: [], teachingClasses: [], teachingSections: [] });
      fetchUsers();
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch(err) {
      alert('Failed to delete user');
    }
  };

  const handleEditClick = (u) => {
    setEditModal({
      isOpen: true,
      user: u,
      formData: {
        name: u.name || '',
        phone: u.phone || '',
        dob: u.dob ? u.dob.split('T')[0] : '', 
        gender: u.gender || '',
        fatherName: u.fatherName || '',
        className: u.className || '',
        section: u.section || '',
        rollNumber: u.rollNumber || '',
        medium: u.medium || '',
        thirdLanguage: u.thirdLanguage || '',
        stream: u.stream || '',
        optionalSubjects: u.optionalSubjects ? (Array.isArray(u.optionalSubjects) ? u.optionalSubjects.join(', ') : u.optionalSubjects) : '',
        subjects: Array.isArray(u.subjects) ? u.subjects : (u.subjects ? String(u.subjects).split(',').map(s=>s.trim()).filter(Boolean) : []), 
        teachingClasses: Array.isArray(u.teachingClasses) ? u.teachingClasses : (u.teachingClasses ? String(u.teachingClasses).split(',').map(s=>s.trim()).filter(Boolean) : []),
        teachingSections: (Array.isArray(u.teachingSections) ? u.teachingSections : (u.teachingSections ? String(u.teachingSections).split(',').map(s=>s.trim()).filter(Boolean) : [])).map(sec => {
          const classes = Array.isArray(u.teachingClasses) ? u.teachingClasses : (u.teachingClasses ? String(u.teachingClasses).split(',').map(s=>s.trim()).filter(Boolean) : []);
          if (!sec.includes('-') && classes.length > 0) return `${classes[0]}-${sec}`;
          return sec;
        })
      }
    });
  };

  const handleEditChange = (e) => {
    setEditModal({
      ...editModal,
      formData: { ...editModal.formData, [e.target.name]: e.target.value }
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      let payload = { ...editModal.formData };
      if (editModal.user.role === 'teacher') {
        // Checkboxes give us arrays directly now instead of strings
        payload.subjects = payload.subjects || [];
        payload.teachingClasses = payload.teachingClasses || [];
        payload.teachingSections = payload.teachingSections || [];
      } else if (editModal.user.role === 'student' && typeof payload.optionalSubjects === 'string') {
        payload.optionalSubjects = payload.optionalSubjects.split(',').map(s => s.trim()).filter(Boolean);
      }
      await api.patch(`/admin/users/${editModal.user._id}`, payload);
      setEditModal({ isOpen: false, user: null, formData: {} });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const copyInviteLink = (role) => {
    // Determine current origin. In dev this is localhost:5173
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/register-user?schoolId=${user.schoolId}&role=${role}`;
    navigator.clipboard.writeText(link);
    alert(`Invite link for ${role} copied to clipboard!`);
  };



  return (
    <div className="w-full">
      <div className="text-[#e5e5e5] space-y-8 animate-fade-in w-full pb-10">
        
        {(currentPath.endsWith('/admin') || currentPath.endsWith('/admin/')) && (
          <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4 group cursor-pointer">
            <div className="p-4 bg-[#0A84FF]/20 rounded-xl text-[#0A84FF] group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium tracking-wide">Total Students</p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold font-heading">{users.filter(u => u.role === 'student').length}</h3>
                <span className="text-xs font-semibold text-gray-500 flex items-center bg-gray-500/10 px-2 py-0.5 rounded-full">Real-time</span>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4 group cursor-pointer">
            <div className="p-4 bg-purple-500/20 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium tracking-wide">Total Teachers</p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold font-heading">{users.filter(u => u.role === 'teacher').length}</h3>
                <span className="text-xs font-semibold text-gray-500 flex items-center bg-gray-500/10 px-2 py-0.5 rounded-full">Real-time</span>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4 group cursor-pointer">
            <div className="p-4 bg-amber-500/20 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium tracking-wide">Total Revenue</p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold font-heading">₹{totalRevenue.toLocaleString()}</h3>
                <span className="text-xs font-semibold text-gray-500 flex items-center bg-gray-500/10 px-2 py-0.5 rounded-full">Real-time</span>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4 group cursor-pointer">
            <div className="p-4 bg-[#34C759]/20 rounded-xl text-[#34C759] group-hover:scale-110 transition-transform">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium tracking-wide">Avg. Attendance</p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold font-heading">94%</h3>
              </div>
            </div>
          </div>
        </div>

        <AdminAnalyticsCharts />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="glass-card rounded-2xl p-6">
               <h2 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#0A84FF]" /> Upcoming Events
               </h2>
               <div className="space-y-4">
                  <div className="flex gap-4 items-start p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer">
                    <div className="text-center bg-[#121212] rounded-lg p-2 min-w-[3.5rem] border border-white/5">
                      <span className="block text-xs text-[#0A84FF] font-bold uppercase">Oct</span>
                      <span className="block text-xl font-bold text-white">12</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Mid-term Exams</h4>
                      <p className="text-xs text-gray-400 mt-1">All classes • 9:00 AM</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer">
                    <div className="text-center bg-[#121212] rounded-lg p-2 min-w-[3.5rem] border border-white/5">
                      <span className="block text-xs text-purple-400 font-bold uppercase">Oct</span>
                      <span className="block text-xl font-bold text-white">15</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Staff Meeting</h4>
                      <p className="text-xs text-gray-400 mt-1">Conf. Room A • 2:00 PM</p>
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden h-[180px]">
               <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.714%2c-74.005&zoom=14&size=400x300&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x8ec3b9&style=feature:all|element:labels.text.stroke|color:0x1a3646&style=feature:road|element:geometry|color:0x304a7d')] bg-cover bg-center opacity-30 mix-blend-screen"></div>
               <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold font-heading mb-1 text-white">Live Bus Tracking</h2>
                    <p className="text-xs text-gray-400">3 Active Routes</p>
                  </div>
                  <div className="bg-[#121212]/80 backdrop-blur-md rounded-xl p-3 border border-white/5 flex items-center gap-3">
                     <div className="w-3 h-3 bg-[#0A84FF] rounded-full animate-ping"></div>
                     <div className="flex-1">
                       <p className="text-sm font-semibold text-white">Bus 42 - Route B</p>
                       <p className="text-xs text-[#34C759]">Arriving in 5 mins</p>
                     </div>
                  </div>
               </div>
            </div>
        </div>
          </>
        )}


        {/* Approval Modal */}
        {approvalModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 mt-12 md:mt-0">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Assign {approvalModal.user?.role === 'teacher' ? 'Teacher' : 'Student'} Details</h3>
                <p className="text-sm text-gray-500 mb-4">Enter allocation details to finalize {approvalModal.user?.name}'s approval.</p>
              </div>
              
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-4">
                {approvalModal.user?.role === 'student' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Class</label>
                        <select 
                          value={approvalModal.className}
                          onChange={(e) => setApprovalModal({...approvalModal, className: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800"
                        >
                          <option value="">Select Class</option>
                          {standardClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Section</label>
                        <select 
                          value={approvalModal.section}
                          onChange={(e) => setApprovalModal({...approvalModal, section: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800"
                        >
                          <option value="">Select Section</option>
                          {standardSections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Roll Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 104"
                        value={approvalModal.rollNumber}
                        onChange={(e) => setApprovalModal({...approvalModal, rollNumber: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Optional / Additional Subjects</label>
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-wrap gap-2">
                        {["Physical Education", "Fine Arts", "Computer Science", "Information Practices", "Economics", "Psychology", "Music"].map(sub => (
                           <label key={sub} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-50 hover:border-indigo-200 transition-all">
                             <input 
                               type="checkbox" 
                               checked={(approvalModal.optionalSubjects || []).includes(sub)}
                               onChange={(e) => {
                                 const currentStr = approvalModal.optionalSubjects;
                                 let current = Array.isArray(currentStr) ? [...currentStr] : (currentStr ? currentStr.split(',').map(s=>s.trim()) : []);
                                 if (e.target.checked && !current.includes(sub)) current.push(sub);
                                 else if (!e.target.checked) current = current.filter(s => s !== sub);
                                 setApprovalModal({...approvalModal, optionalSubjects: current});
                               }}
                               className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                             />
                             {sub}
                           </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {approvalModal.user?.role === 'teacher' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Assign Classes & Sections</label>
                      <div className="space-y-3">
                        {standardClasses.map(cls => (
                          <div key={cls} className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-50">
                            <label className="flex items-center gap-2 font-bold text-indigo-800 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={approvalModal.teachingClasses.includes(cls)}
                                onChange={(e) => {
                                  const current = [...approvalModal.teachingClasses];
                                  if (e.target.checked) current.push(cls);
                                  else current.splice(current.indexOf(cls), 1);
                                  setApprovalModal({...approvalModal, teachingClasses: current});
                                }}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-indigo-200"
                              />
                              Class {cls}
                            </label>
                            
                            {approvalModal.teachingClasses.includes(cls) && (
                              <div className="mt-2 ml-6 flex flex-wrap gap-2">
                                {standardSections.map(sec => (
                                  <label key={sec} className="flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-md cursor-pointer text-xs font-semibold text-gray-600 hover:bg-indigo-50 transition-colors">
                                    <input 
                                      type="checkbox" 
                                      checked={approvalModal.teachingSections.includes(`${cls}-${sec}`)}
                                      onChange={(e) => {
                                        const current = [...approvalModal.teachingSections];
                                        const val = `${cls}-${sec}`;
                                        if (e.target.checked && !current.includes(val)) current.push(val);
                                        else if (!e.target.checked) current.splice(current.indexOf(val), 1);
                                        setApprovalModal({...approvalModal, teachingSections: current});
                                      }}
                                      className="w-3.5 h-3.5 text-emerald-500 rounded focus:ring-emerald-400 border-gray-200"
                                    />
                                    Section {sec}
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {getRelevantSubjectCategories(approvalModal.teachingClasses) ? (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Assign Subjects (Filtered by Class)</label>
                        <div className="space-y-4">
                          {Object.entries(getRelevantSubjectCategories(approvalModal.teachingClasses)).map(([category, subs]) => (
                            <div key={category} className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{category}</p>
                               <div className="flex flex-wrap gap-2">
                                 {subs.map(sub => (
                                   <label key={sub} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-50 hover:border-indigo-200 transition-all">
                                     <input 
                                       type="checkbox" 
                                       checked={approvalModal.subjects.includes(sub)}
                                       onChange={(e) => {
                                         const current = [...approvalModal.subjects];
                                         if (e.target.checked) current.push(sub);
                                         else current.splice(current.indexOf(sub), 1);
                                         setApprovalModal({...approvalModal, subjects: current});
                                       }}
                                       className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                     />
                                     {sub}
                                   </label>
                                 ))}
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 font-medium">
                        Please select at least one Class above to assign relevant subjects.
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 pt-4 mt-auto border-t border-gray-100">
                <button 
                  onClick={() => setApprovalModal({ isOpen: false, user: null, rollNumber: '', className: '', section: '', subjects: [], teachingClasses: [], teachingSections: [] })}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    let payload = {};
                    if (approvalModal.user.role === 'student') {
                      payload = { rollNumber: approvalModal.rollNumber, className: approvalModal.className, section: approvalModal.section };
                    } else if (approvalModal.user.role === 'teacher') {
                      payload = {
                        subjects: approvalModal.subjects,
                        teachingClasses: approvalModal.teachingClasses,
                        teachingSections: approvalModal.teachingSections
                      };
                    }
                    approveUser(approvalModal.user._id, payload);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal (Omitted for brevity, assuming same code blocks apply) */}
        {/* Edit User Modal */}
        {editModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 mt-12 md:mt-0">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Edit Profile & Settings</h3>
                <p className="text-sm text-gray-500 mb-4">Update details for {editModal.user?.name}</p>
              </div>

              <form onSubmit={submitEdit} className="flex flex-col flex-1 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar mb-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                    <input type="text" name="name" value={editModal.formData.name} onChange={handleEditChange} required className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Phone</label>
                    <input type="text" name="phone" value={editModal.formData.phone} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Date of Birth</label>
                    <input type="date" name="dob" value={editModal.formData.dob} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Gender</label>
                    <select name="gender" value={editModal.formData.gender} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Father's Name</label>
                    <input type="text" name="fatherName" value={editModal.formData.fatherName} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800" />
                  </div>

                  {editModal.user?.role === 'student' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Class</label>
                        <select name="className" value={editModal.formData.className} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800">
                          <option value="">Select Class</option>
                          {standardClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Section</label>
                        <select name="section" value={editModal.formData.section} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800">
                          <option value="">Select Section</option>
                          {standardSections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Roll Number</label>
                        <input type="text" name="rollNumber" value={editModal.formData.rollNumber} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Medium</label>
                        <select name="medium" value={editModal.formData.medium} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800">
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Stream (For 11th & 12th)</label>
                        <select name="stream" value={editModal.formData.stream} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800">
                          <option value="None">None (Primary/Secondary)</option>
                          <option value="Science PCM">Science PCM</option>
                          <option value="Science PCB">Science PCB</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Arts">Arts</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Third Language</label>
                        <select name="thirdLanguage" value={editModal.formData.thirdLanguage} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800">
                          <option value="None">None</option>
                          <option value="Sanskrit">Sanskrit</option>
                          <option value="Urdu">Urdu</option>
                          <option value="French">French</option>
                          <option value="Punjabi">Punjabi</option>
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Optional / Additional Subjects</label>
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-wrap gap-2">
                          {["Physical Education", "Fine Arts", "Computer Science", "Information Practices", "Economics", "Psychology", "Music"].map(sub => (
                             <label key={sub} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-50 hover:border-indigo-200 transition-all">
                               <input 
                                 type="checkbox" 
                                 checked={(editModal.formData.optionalSubjects || []).includes(sub)}
                                 onChange={(e) => {
                                   const currentStr = editModal.formData.optionalSubjects;
                                   let current = Array.isArray(currentStr) ? [...currentStr] : (currentStr ? currentStr.split(',').map(s=>s.trim()) : []);
                                   if (e.target.checked && !current.includes(sub)) current.push(sub);
                                   else if (!e.target.checked) current = current.filter(s => s !== sub);
                                   setEditModal({...editModal, formData: {...editModal.formData, optionalSubjects: current}});
                                 }}
                                 className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                               />
                               {sub}
                             </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {editModal.user?.role === 'teacher' && (
                    <div className="space-y-6 pt-2 col-span-2">
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <label className="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Class Teacher Designation (Optional)</label>
                      <p className="text-xs text-indigo-600 mb-3">Assigning a teacher as a Class Teacher gives them exclusive permission to build and manage their class's weekly timetable.</p>
                      <select 
                        name="classTeacherOf" 
                        value={editModal.formData.classTeacherOf || ""} 
                        onChange={handleEditChange} 
                        className="w-full bg-white border border-indigo-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-indigo-900"
                      >
                        <option value="">None</option>
                        {standardClasses.map(cls => (
                           standardSections.map(sec => (
                             <option key={`${cls}-${sec}`} value={`${cls}-${sec}`}>Class {cls} - Section {sec}</option>
                           ))
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Assign Subject Classes & Sections</label>
                      <div className="space-y-3">
                        {standardClasses.map(cls => (
                          <div key={cls} className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-50">
                            <label className="flex items-center gap-2 font-bold text-indigo-800 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={(editModal.formData.teachingClasses || []).includes(cls)}
                                onChange={(e) => {
                                  const current = [...(editModal.formData.teachingClasses || [])];
                                  if (e.target.checked) current.push(cls);
                                  else current.splice(current.indexOf(cls), 1);
                                  setEditModal({...editModal, formData: {...editModal.formData, teachingClasses: current}});
                                }}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-indigo-200"
                              />
                              Class {cls}
                            </label>
                            
                            {(editModal.formData.teachingClasses || []).includes(cls) && (
                              <div className="mt-2 ml-6 flex flex-wrap gap-2">
                                {standardSections.map(sec => (
                                  <label key={sec} className="flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-md cursor-pointer text-xs font-semibold text-gray-600 hover:bg-indigo-50 transition-colors">
                                    <input 
                                      type="checkbox" 
                                      checked={(editModal.formData.teachingSections || []).includes(`${cls}-${sec}`)}
                                      onChange={(e) => {
                                        const current = [...(editModal.formData.teachingSections || [])];
                                        const val = `${cls}-${sec}`;
                                        if (e.target.checked && !current.includes(val)) current.push(val);
                                        else if (!e.target.checked) current.splice(current.indexOf(val), 1);
                                        setEditModal({...editModal, formData: {...editModal.formData, teachingSections: current}});
                                      }}
                                      className="w-3.5 h-3.5 text-emerald-500 rounded focus:ring-emerald-400 border-gray-200"
                                    />
                                    Section {sec}
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {getRelevantSubjectCategories(editModal.formData.teachingClasses) ? (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Assign Subjects (Filtered by Class)</label>
                        <div className="space-y-4">
                          {Object.entries(getRelevantSubjectCategories(editModal.formData.teachingClasses)).map(([category, subs]) => (
                            <div key={category} className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{category}</p>
                               <div className="flex flex-wrap gap-2">
                                 {subs.map(sub => (
                                   <label key={sub} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-50 hover:border-indigo-200 transition-all">
                                     <input 
                                       type="checkbox" 
                                       checked={(editModal.formData.subjects || []).includes(sub)}
                                       onChange={(e) => {
                                         const current = [...(editModal.formData.subjects || [])];
                                         if (e.target.checked) current.push(sub);
                                         else current.splice(current.indexOf(sub), 1);
                                         setEditModal({...editModal, formData: {...editModal.formData, subjects: current}});
                                       }}
                                       className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                     />
                                     {sub}
                                   </label>
                                 ))}
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 font-medium">
                        Please select at least one Class above to assign relevant subjects.
                      </p>
                    )}
                  </div>
                  )}
                </div>
                
                <div className="flex gap-4 pt-4 mt-auto border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setEditModal({ isOpen: false, user: null, formData: {} })}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Master Active Module Navigation */}
        <main className="space-y-6 flex-1 h-full">
          
          {/* School Configuration Panel for School Admins */}
          {currentPath.endsWith('/settings') && school && (
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0A84FF]/10 rounded-bl-full -z-10 blur-xl"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#0A84FF]" />
                    School Profile & Settings
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">{school.name} ({school.config?.management})</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyInviteLink('teacher')} className="text-xs bg-[#0A84FF]/10 text-[#0A84FF] hover:bg-[#0A84FF]/20 transition-colors px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 border border-[#0A84FF]/20">
                    Copy Teacher Invite
                  </button>
                  <button onClick={() => copyInviteLink('student')} className="text-xs bg-[#34C759]/10 text-[#34C759] hover:bg-[#34C759]/20 transition-colors px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 border border-[#34C759]/20">
                    Copy Student Invite
                  </button>
                  {school.config?.level?.some(l => l.includes('Preschool') || l.includes('Primary')) && (
                    <button onClick={() => copyInviteLink('parent')} className="text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 border border-purple-500/20">
                      Copy Parent Invite
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <span className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-2 block">Levels Active</span>
                  <div className="flex flex-wrap gap-1.5">
                    {school.config?.level?.map(l => <span key={l} className="bg-[#121212] px-2 py-1 rounded text-xs font-medium text-gray-300 border border-white/10">{l}</span>)}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <span className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-2 block">Curriculum Boards</span>
                  <div className="flex flex-wrap gap-1.5">
                    {school.config?.curriculum?.map(c => <span key={c} className="bg-[#121212] px-2 py-1 rounded text-xs font-medium text-gray-300 border border-white/10">{c}</span>)}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <span className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-2 block">Contact Info</span>
                  <p className="text-sm font-medium text-white">{school.email}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{school.phone}</p>
                </div>
              </div>
            </div>
          )}

          {currentPath.includes('/fees') ? (
             <AdminFees />
          ) : currentPath.includes('/timetable') ? (
             <AdminTimetable />
          ) : currentPath.includes('/users') ? (
            <>
            <div className="glass-card rounded-2xl p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white">User Management</h2>
                  <p className="text-sm text-gray-400 mt-1">Review, approve, and manage accounts for your tenant.</p>
                </div>
                
                <div className="w-full md:w-72 relative">
                   <input 
                     type="text" 
                     placeholder="Search by name, email, or roll no..." 
                     className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#0A84FF]/50 transition-all font-medium placeholder-gray-500"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                   <svg className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>

              {/* Role Tabs */}
              <div className="flex space-x-2 border-b border-white/10 mb-6 overflow-x-auto custom-scrollbar pb-2">
                {['student', 'teacher', 'parent', 'school_admin'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-bold capitalize whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${
                      activeTab === tab ? 'border-[#0A84FF] text-[#0A84FF] bg-[#0A84FF]/10' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.replace('_', ' ')}s
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-[#121212] border border-white/10 text-gray-300 shadow-sm">
                      {users.filter(u => u.role === tab).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 shadow-sm mt-4">
                <table className="w-full text-left bg-transparent">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                      <th className="p-4 pl-6">Profile</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users
                      .filter(u => u.role === activeTab)
                      .filter(u => 
                        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.rollNumber && u.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((u) => (
                    <tr key={u._id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 pl-6 font-medium">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] flex flex-col items-center justify-center font-bold font-mono border border-[#0A84FF]/20">
                             <span className="text-sm leading-none">{u.name.charAt(0).toUpperCase()}</span>
                           </div>
                           <div>
                             <p className="font-bold text-white text-sm leading-tight">{u.name}</p>
                             {u.gender && <p className="text-xs text-gray-400 mt-0.5">{u.gender} • {u.dob ? new Date(u.dob).getFullYear() : 'N/A'}</p>}
                           </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-300 text-sm font-medium">{u.email}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{u.phone || 'No Phone'}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          {u.role === 'student' && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20">Class {u.className || 'Pending'} {u.section ? `- ${u.section}` : ''}</span>
                              {u.rollNumber && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white/10 text-gray-300 border border-white/20">Roll: {u.rollNumber}</span>}
                              {u.stream && u.stream !== 'None' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">{u.stream}</span>}
                              {u.thirdLanguage && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">Lang: {u.thirdLanguage}</span>}
                              {u.optionalSubjects?.length > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20">+{u.optionalSubjects.length} Opt</span>}
                            </div>
                          )}
                          {u.role === 'teacher' && (
                            <div className="mt-1 space-y-0.5">
                              <div className="text-xs font-semibold text-gray-400">Subjects: <span className="text-gray-200">{u.subjects?.join(', ') || 'N/A'}</span></div>
                              <div className="text-xs font-semibold text-gray-400">Classes: <span className="text-gray-200">{u.teachingClasses?.join(', ') || 'N/A'}</span></div>
                              <div className="text-xs font-semibold text-gray-400">Sections: <span className="text-gray-200">{u.teachingSections?.join(', ') || 'N/A'}</span></div>
                            </div>
                          )}
                          {u.role === 'parent' && (
                             <span className="text-xs font-semibold text-gray-400">Linked Kids: <span className="text-gray-200">{u.linkedChildren?.length || 0}</span></span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {u.isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                             <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!u.isApproved ? (
                            <button 
                              onClick={() => handleApproveClick(u)} 
                              className="text-xs bg-gradient-to-r from-[#0A84FF] to-[#0A84FF] text-white px-3 py-1.5 rounded-lg font-semibold hover:shadow-md hover:shadow-[#0A84FF]/20 active:scale-95 transition-all w-[70px]"
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="text-gray-500 text-xs italic px-2 w-[70px] text-center">Active</span>
                          )}
                          <button 
                            onClick={() => handleEditClick(u)} 
                            className="text-xs bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteUser(u._id)} 
                            className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.filter(u => u.role === activeTab).length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 border border-white/10">
                          <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No users found in this category.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
            </>
          ) : currentPath.includes('/tracking') ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-3">
                    <Map className="w-6 h-6 text-[#0A84FF]" />
                    Live Bus Tracking
                  </h2>
                  <p className="text-gray-400 mt-1">Real-time GPS tracking for active school routes.</p>
                </div>
                <button className="bg-[#0A84FF] hover:bg-blue-600 shadow-[0_0_15px_rgba(10,132,255,0.3)] text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm w-full sm:w-auto">
                  + Add New Route
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Map View */}
                <div className="xl:col-span-2 glass-card rounded-2xl relative overflow-hidden h-[400px] md:h-[500px] border border-white/10 group">
                  <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.714%2c-74.005&zoom=13&size=800x600&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x8ec3b9&style=feature:all|element:labels.text.stroke|color:0x1a3646&style=feature:road|element:geometry|color:0x304a7d')] bg-cover bg-center opacity-40 mix-blend-screen group-hover:scale-105 transition-transform duration-1000"></div>
                  
                  {/* Fake Bus Marker 1 */}
                  <div className="absolute top-[35%] left-[45%] animate-pulse cursor-pointer hover:scale-125 transition-transform z-10">
                    <div className="relative">
                      <div className="w-12 h-12 bg-[#121212]/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.4)]">
                        <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 flex items-center justify-center">
                          <Map className="w-4 h-4 text-[#0A84FF]" />
                        </div>
                      </div>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#1E1E1E] border border-[#0A84FF]/30 text-xs font-bold px-2 py-1 rounded text-white whitespace-nowrap shadow-xl">
                        Bus 42
                      </div>
                    </div>
                  </div>

                  {/* Fake Bus Marker 2 */}
                  <div className="absolute top-[60%] right-[30%] animate-pulse cursor-pointer hover:scale-125 transition-transform z-10" style={{ animationDelay: '1s' }}>
                    <div className="relative">
                      <div className="w-12 h-12 bg-[#121212]/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Map className="w-4 h-4 text-amber-500" />
                        </div>
                      </div>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#1E1E1E] border border-amber-500/30 text-xs font-bold px-2 py-1 rounded text-white whitespace-nowrap shadow-xl">
                        Bus 12
                      </div>
                    </div>
                  </div>

                  {/* Map Overlay Stats */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between gap-4 pointer-events-none z-20">
                    <div className="bg-[#121212]/90 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-xl pointer-events-auto shadow-2xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Fleet Status</p>
                      <p className="text-sm text-[#34C759] font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] animate-ping relative"><span className="absolute inset-0 rounded-full bg-[#34C759]"></span></span>
                        2 Active Routes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route List */}
                <div className="space-y-4">
                  {[ 
                    { id: 42, route: 'Route B - Downtown Area', status: 'On Route', time: 'Arriving in 5 mins', color: 'text-[#0A84FF]', bg: 'bg-[#0A84FF]/10', border: 'border-[#0A84FF]/20', dot: 'bg-[#0A84FF]' },
                    { id: 12, route: 'Route C - North Side Suburbs', status: 'Delayed Traffic', time: 'Arriving in 15 mins', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
                    { id: 8, route: 'Route A - City Center', status: 'Completed', time: 'Arrived at 8:15 AM', color: 'text-[#34C759]', bg: 'bg-[#34C759]/10', border: 'border-[#34C759]/20', dot: 'bg-[#34C759]' }
                  ].map(bus => (
                    <div key={bus.id} className="glass-card rounded-2xl p-5 hover:bg-white/5 transition-colors cursor-pointer group border-transparent hover:border-white/10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${bus.bg} ${bus.color} flex items-center justify-center border ${bus.border} group-hover:scale-110 transition-transform`}>
                            <Map className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">Bus {bus.id}</h3>
                            <p className="text-sm text-gray-400 mt-0.5">{bus.route}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-xs font-bold px-2.5 py-1 flex items-center gap-1.5 rounded-md ${bus.bg} ${bus.color} border ${bus.border}`}>
                          {bus.status !== 'Completed' && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${bus.dot}`}></span>}
                          {bus.status}
                        </span>
                      </div>
                      <div className="bg-[#121212] rounded-xl p-3 border border-white/5 flex justify-between items-center group-hover:bg-black/40 transition-colors">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ETA</span>
                        <span className="text-sm font-bold text-white">{bus.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
