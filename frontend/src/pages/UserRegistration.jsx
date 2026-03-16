import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

const UserRegistration = () => {
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const role = searchParams.get('role');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    gender: 'Boy',
    fatherName: '',
    medium: 'English',
    stream: 'None',
    subjects: '',
    teachingClasses: '',
    schoolId: schoolId || '',
    role: role || 'student'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!schoolId) {
      setError('Invalid invite link. Missing school information.');
    }
  }, [schoolId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // format subjects/classes into arrays if Teacher
    const payload = { ...formData };
    if (role === 'teacher') {
      payload.subjects = formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [];
      payload.teachingClasses = formData.teachingClasses ? formData.teachingClasses.split(',').map(c => c.trim()) : [];
    }

    try {
      await api.post('/auth/register', payload);
      setSuccess('Registration successful! Please wait for the school admin to approve your account.');
      setTimeout(() => navigate('/'), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 font-sans p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl shadow-indigo-900/10 w-full max-w-md border border-white relative z-10">
        
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight">
            Join School Portal
          </h2>
          <p className="text-gray-500 text-sm mt-2 font-medium capitalize flex items-center gap-1.5 focus:outline-none">
            Register as a <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ring-indigo-700/10">{role || 'User'}</span>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border-emerald-200 border text-emerald-700 p-4 rounded-xl mb-6 text-sm flex gap-3 items-start">
            <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="font-semibold">{success}</p>
              <p className="text-emerald-600 text-xs mt-1">Redirecting to login...</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
              <input type="text" name="name" className="px-4 block w-full rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white shadow-sm py-2.5 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm text-gray-800 outline-none" placeholder="John Doe" value={formData.name} onChange={handleChange} required disabled={!schoolId || success} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
              <input type="email" name="email" className="px-4 block w-full rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white shadow-sm py-2.5 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm text-gray-800 outline-none" placeholder="you@example.com" value={formData.email} onChange={handleChange} required disabled={!schoolId || success} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <input type="password" name="password" className="px-4 block w-full rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white shadow-sm py-2.5 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm text-gray-800 outline-none" placeholder="••••••••" value={formData.password} onChange={handleChange} required disabled={!schoolId || success} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
              <input type="tel" name="phone" className="px-4 block w-full rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white shadow-sm py-2.5 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm text-gray-800 outline-none" placeholder="+91 9876543210" value={formData.phone} onChange={handleChange} required disabled={!schoolId || success} />
            </div>
          </div>
          {/* Shared Real-world Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Date of Birth</label>
              <input type="date" name="dob" className="px-4 block w-full rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white shadow-sm py-2.5 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm text-gray-800 outline-none" value={formData.dob} onChange={handleChange} required disabled={!schoolId || success} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Gender</label>
              <select name="gender" className="px-4 block w-full rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white shadow-sm py-2.5 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm text-gray-800 outline-none" value={formData.gender} onChange={handleChange} disabled={!schoolId || success}>
                <option value="Boy">Boy (Male)</option>
                <option value="Girl">Girl (Female)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Father's Name</label>
             <input type="text" name="fatherName" className="px-4 block w-full rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white shadow-sm py-2.5 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm text-gray-800 outline-none" placeholder="Mr. Sharma" value={formData.fatherName} onChange={handleChange} required disabled={!schoolId || success} />
          </div>

          {/* Student Specific Fields */}
          {role === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-1.5 ml-1">Medium</label>
                <select name="medium" className="px-4 block w-full rounded-xl border-gray-200 bg-white shadow-sm py-2.5 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-800 outline-none" value={formData.medium} onChange={handleChange} disabled={!schoolId || success}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-1.5 ml-1">Stream (11/12th Only)</label>
                <select name="stream" className="px-4 block w-full rounded-xl border-gray-200 bg-white shadow-sm py-2.5 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-800 outline-none" value={formData.stream} onChange={handleChange} disabled={!schoolId || success}>
                  <option value="None">Not Applicable</option>
                  <option value="Science">Science (PCB/PCM)</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts">Arts / Humanities</option>
                </select>
              </div>
            </div>
          )}

          {/* Teacher Specific Fields */}
          {role === 'teacher' && (
            <div className="space-y-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div>
                <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1.5 ml-1">Teaching Subjects</label>
                <input type="text" name="subjects" className="px-4 block w-full rounded-xl border-gray-200 bg-white shadow-sm py-2.5 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm text-gray-800 outline-none" placeholder="e.g. Mathematics, Physics" value={formData.subjects} onChange={handleChange} disabled={!schoolId || success} />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Comma separated</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1.5 ml-1">Preferred Classes</label>
                <input type="text" name="teachingClasses" className="px-4 block w-full rounded-xl border-gray-200 bg-white shadow-sm py-2.5 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm text-gray-800 outline-none" placeholder="e.g. 10, 11, 12" value={formData.teachingClasses} onChange={handleChange} disabled={!schoolId || success} />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Comma separated</p>
              </div>
            </div>
          )}

          <hr className="border-gray-100 my-4" />
          
          <button
            type="submit"
            disabled={!schoolId || success}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all duration-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserRegistration;
