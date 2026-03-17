import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AdminFees from '../components/AdminFees';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [school, setSchool] = useState(null);
  const [activeModule, setActiveModule] = useState('users'); // users or fees
  const [activeTab, setActiveTab] = useState('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, user: null, rollNumber: '', className: '', section: '', subjects: '', teachingClasses: '', teachingSections: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, user: null, formData: {} });
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchUsers();
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-white/80 backdrop-blur-md px-8 py-5 rounded-2xl shadow-sm border border-white/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight">
              Admin Portal
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-gray-800">{user.name}</span>
              <span className="text-xs text-blue-600 font-medium uppercase tracking-wider">{user.role}</span>
            </div>
            <button 
              onClick={logout} 
              className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 px-5 py-2 rounded-xl text-sm font-semibold shadow-sm"
            >
              Sign out
            </button>
          </div>
        </header>

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
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Class Level</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 10"
                          value={approvalModal.className}
                          onChange={(e) => setApprovalModal({...approvalModal, className: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Section</label>
                        <input 
                          type="text" 
                          placeholder="e.g. A"
                          value={approvalModal.section}
                          onChange={(e) => setApprovalModal({...approvalModal, section: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800"
                        />
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
                        <input type="text" name="className" value={editModal.formData.className} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Section</label>
                        <input type="text" name="section" value={editModal.formData.section} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800" />
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
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Stream</label>
                        <select name="stream" value={editModal.formData.stream} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800">
                          <option value="None">None</option>
                          <option value="Science PCM">Science PCM</option>
                          <option value="Science PCB">Science PCB</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Arts">Arts</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Third Lang</label>
                        <input type="text" name="thirdLanguage" value={editModal.formData.thirdLanguage} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Optional Subjects (Comma separated)</label>
                        <input type="text" name="optionalSubjects" value={editModal.formData.optionalSubjects} onChange={handleEditChange} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800" />
                      </div>
                    </>
                  )}

                  {editModal.user?.role === 'teacher' && (
                    <div className="space-y-6 pt-2 col-span-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Assign Classes & Sections</label>
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
        <div className="flex gap-4 mb-6 mt-2 ml-2">
          <button 
             onClick={() => setActiveModule('users')}
             className={`px-5 py-2.5 rounded-2xl font-bold transition-all ${activeModule === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
             Users Matrix
          </button>
          <button 
             onClick={() => setActiveModule('fees')}
             className={`px-5 py-2.5 rounded-2xl font-bold transition-all ${activeModule === 'fees' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
             Fees & Commerce
          </button>
        </div>

        <main className="space-y-6">
          
          {/* School Configuration Panel for School Admins */}
          {school && (
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-900/5 border border-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    School Profile & Settings
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{school.name} ({school.config?.management})</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyInviteLink('teacher')} className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 border border-indigo-100">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copy Teacher Invite
                  </button>
                  <button onClick={() => copyInviteLink('student')} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 border border-blue-100">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copy Student Invite
                  </button>
                  {school.config?.level?.some(l => l.includes('Preschool') || l.includes('Primary')) && (
                    <button onClick={() => copyInviteLink('parent')} className="text-xs bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800 transition-colors px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 border border-pink-100">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Copy Parent Invite
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2 block">Levels Active</span>
                  <div className="flex flex-wrap gap-1.5">
                    {school.config?.level?.map(l => <span key={l} className="bg-white px-2 py-1 rounded shadow-sm text-xs font-medium text-gray-700 border border-gray-200">{l}</span>)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2 block">Curriculum Boards</span>
                  <div className="flex flex-wrap gap-1.5">
                    {school.config?.curriculum?.map(c => <span key={c} className="bg-white px-2 py-1 rounded shadow-sm text-xs font-medium text-gray-700 border border-gray-200">{c}</span>)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2 block">Contact Info</span>
                  <p className="text-sm font-medium text-gray-800">{school.email}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{school.phone}</p>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'fees' ? (
             <AdminFees />
          ) : (
            <>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-900/5 border border-white p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Review, approve, and manage accounts for your tenant.</p>
                </div>
                
                <div className="w-full md:w-72 relative">
                   <input 
                     type="text" 
                     placeholder="Search by name, email, or roll no..." 
                     className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                   <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>

              {/* Role Tabs */}
              <div className="flex space-x-2 border-b border-gray-100 mb-6 overflow-x-auto custom-scrollbar pb-2">
                {['student', 'teacher', 'parent', 'school_admin'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-bold capitalize whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${
                      activeTab === tab ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.replace('_', ' ')}s
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm">
                      {users.filter(u => u.role === tab).length}
                    </span>
                  </button>
                ))}
              </div>

              </div>

              <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm mt-4">
                <table className="w-full text-left bg-white">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      <th className="p-4 pl-6">Profile</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users
                      .filter(u => u.role === activeTab)
                      .filter(u => 
                        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.rollNumber && u.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((u) => (
                    <tr key={u._id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 pl-6 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex flex-col items-center justify-center font-bold font-mono shadow-sm border border-indigo-200">
                             <span className="text-sm leading-none">{u.name.charAt(0).toUpperCase()}</span>
                           </div>
                           <div>
                             <p className="font-bold text-gray-900 text-sm leading-tight">{u.name}</p>
                             {u.gender && <p className="text-xs text-gray-500 mt-0.5">{u.gender} • {u.dob ? new Date(u.dob).getFullYear() : 'N/A'}</p>}
                           </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-700 text-sm font-medium">{u.email}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{u.phone || 'No Phone'}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          {u.role === 'student' && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">Class {u.className || 'Pending'} {u.section ? `- ${u.section}` : ''}</span>
                              {u.rollNumber && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">Roll: {u.rollNumber}</span>}
                              {u.stream && u.stream !== 'None' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">{u.stream}</span>}
                              {u.thirdLanguage && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">Lang: {u.thirdLanguage}</span>}
                              {u.optionalSubjects?.length > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-50 text-pink-700 border border-pink-100">+{u.optionalSubjects.length} Opt</span>}
                            </div>
                          )}
                          {u.role === 'teacher' && (
                            <div className="mt-1 space-y-0.5">
                              <div className="text-xs font-semibold text-gray-600">Subjects: <span className="text-gray-900">{u.subjects?.join(', ') || 'N/A'}</span></div>
                              <div className="text-xs font-semibold text-gray-600">Classes: <span className="text-gray-900">{u.teachingClasses?.join(', ') || 'N/A'}</span></div>
                              <div className="text-xs font-semibold text-gray-600">Sections: <span className="text-gray-900">{u.teachingSections?.join(', ') || 'N/A'}</span></div>
                            </div>
                          )}
                          {u.role === 'parent' && (
                             <span className="text-xs font-semibold text-gray-600">Linked Kids: <span className="text-gray-900">{u.linkedChildren?.length || 0}</span></span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {u.isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
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
                              className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:shadow-md hover:shadow-blue-500/20 active:scale-95 transition-all"
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs italic px-2">Active</span>
                          )}
                          <button 
                            onClick={() => handleEditClick(u)} 
                            className="text-xs bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteUser(u._id)} 
                            className="text-xs bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.filter(u => u.role === activeTab).length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 border border-gray-100">
                          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
