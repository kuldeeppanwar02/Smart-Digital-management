import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

const UserRegistration = () => {
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const role = searchParams.get('role');
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', dob: '', gender: 'Boy', fatherName: '',
    role: role || 'student', schoolId: schoolId || '',
    className: '', section: '', medium: 'English', thirdLanguage: '', stream: 'None',
    optionalSubjects: [], subjects: '', teachingClasses: '', teachingSections: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!schoolId) setError('Invalid invite link. Missing school information.');
  }, [schoolId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionalSubjectToggle = (subject) => {
    setFormData(prev => {
      const current = [...prev.optionalSubjects];
      if (current.includes(subject)) return { ...prev, optionalSubjects: current.filter(s => s !== subject) };
      else return { ...prev, optionalSubjects: [...current, subject] };
    });
  };

  const classLevel = parseInt(formData.className) || 0;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    const payload = { ...formData };
    
    // Clean up irrelevant student fields based on Class Level logic
    if (role === 'student') {
      if (['LKG', 'UKG', 'Playgroup'].includes(formData.className) || classLevel < 6 || classLevel > 8) {
         payload.thirdLanguage = '';
      }
      if (classLevel < 11) {
         payload.stream = 'None';
         payload.optionalSubjects = [];
      }
    }
    
    if (role === 'teacher') {
      payload.subjects = formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [];
      payload.teachingClasses = formData.teachingClasses ? formData.teachingClasses.split(',').map(c => c.trim()) : [];
      payload.teachingSections = formData.teachingSections ? formData.teachingSections.split(',').map(s => s.trim()) : [];
    }

    try {
      await api.post('/auth/register', payload);
      setSuccess('Registration successful! Please wait for the admin to approve your account.');
      setTimeout(() => navigate('/'), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-2xl border border-white">
        
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Join School Portal</h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">As a <span className="uppercase text-indigo-700 font-bold">{role}</span></p>
        </div>
        
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6 font-semibold">{success}</div>}
        
        <form onSubmit={handleRegister} className="space-y-4 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar">
          
          {/* PROFILE BASIC INFO */}
          <h3 className="font-bold text-gray-800 border-b pb-2">Basic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="name" className="px-4 py-2 border rounded-xl w-full" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
            <input type="email" name="email" className="px-4 py-2 border rounded-xl w-full" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
            <input type="password" name="password" className="px-4 py-2 border rounded-xl w-full" placeholder="Password" value={formData.password} onChange={handleChange} required />
            <input type="tel" name="phone" className="px-4 py-2 border rounded-xl w-full" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="date" name="dob" className="px-4 py-2 border rounded-xl w-full text-gray-700" value={formData.dob} onChange={handleChange} required />
            <select name="gender" className="px-4 py-2 border rounded-xl w-full" value={formData.gender} onChange={handleChange}>
              <option value="Boy">Boy (Male)</option><option value="Girl">Girl (Female)</option><option value="Other">Other</option>
            </select>
            <input type="text" name="fatherName" className="px-4 py-2 border rounded-xl w-full" placeholder="Father's Name" value={formData.fatherName} onChange={handleChange} required />
          </div>

          {/* STUDENT NCERT LOGIC */}
          {role === 'student' && (
            <>
              <h3 className="font-bold text-gray-800 border-b pb-2 mt-6">Academic Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-1">Class</label>
                  <select name="className" className="px-4 py-2 border rounded-xl w-full" value={formData.className} onChange={handleChange} required>
                    <option value="">Select Class</option>
                    <optgroup label="Pre-Primary"><option value="Playgroup">Playgroup</option><option value="LKG">LKG</option><option value="UKG">UKG</option></optgroup>
                    <optgroup label="Primary"><option value="1">Class 1</option><option value="2">Class 2</option><option value="3">Class 3</option><option value="4">Class 4</option><option value="5">Class 5</option></optgroup>
                    <optgroup label="Middle"><option value="6">Class 6</option><option value="7">Class 7</option><option value="8">Class 8</option></optgroup>
                    <optgroup label="High School"><option value="9">Class 9</option><option value="10">Class 10</option></optgroup>
                    <optgroup label="Senior Secondary"><option value="11">Class 11</option><option value="12">Class 12</option></optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-1">Section / Group</label>
                  <select name="section" className="px-4 py-2 border rounded-xl w-full" value={formData.section} onChange={handleChange} required>
                     <option value="">Select Section</option>
                     <option value="A">Section A</option><option value="B">Section B</option><option value="C">Section C</option>
                     <option value="Group 1">Group 1</option><option value="Group 2">Group 2</option>
                  </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-blue-700 mb-1">Medium</label>
                   <select name="medium" className="px-4 py-2 border rounded-xl w-full" value={formData.medium} onChange={handleChange}>
                     <option value="English">English Medium</option><option value="Hindi">Hindi Medium</option>
                   </select>
                </div>
              </div>

              {/* Dynamic Step: Class 6 to 8 Third Language */}
              {classLevel >= 6 && classLevel <= 8 && (
                 <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-fade-in">
                    <label className="block text-xs font-bold text-emerald-800 mb-2">Select Third Language (Compulsory for Middle School)</label>
                    <select name="thirdLanguage" className="px-4 py-2 border rounded-xl w-full max-w-xs" value={formData.thirdLanguage} onChange={handleChange} required>
                       <option value="">-- Select Language --</option>
                       <option value="Sanskrit">Sanskrit</option>
                       <option value="Urdu">Urdu</option>
                       <option value="Punjabi">Punjabi</option>
                       <option value="French">French</option>
                    </select>
                 </div>
              )}

              {/* Dynamic Step: Class 11 and 12 Streams */}
              {classLevel >= 11 && (
                 <div className="p-5 bg-purple-50 rounded-xl border border-purple-100 animate-fade-in space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-purple-800 mb-2">Select Stream</label>
                      <select name="stream" className="px-4 py-2 border rounded-xl w-full max-w-xs" value={formData.stream} onChange={handleChange} required>
                         <option value="None">-- Select Stream --</option>
                         <option value="Science PCM">Science (PCM - Math)</option>
                         <option value="Science PCB">Science (PCB - Biology)</option>
                         <option value="Commerce">Commerce</option>
                         <option value="Arts">Arts / Humanities</option>
                      </select>
                    </div>

                    {/* Optional Subjects based on Stream */}
                    {formData.stream && formData.stream !== 'None' && (
                       <div>
                          <label className="block text-xs font-bold text-purple-800 mb-2">Select Optional / Additional Subject (Pick 1 or 2)</label>
                          <div className="flex flex-wrap gap-2">
                            {formData.stream.includes('Science') && ['Computer Science', 'Physical Education', 'Economics', 'Drawing'].map(sub => (
                              <label key={sub} className="flex items-center gap-2 bg-white px-3 py-1.5 border rounded-lg cursor-pointer text-sm">
                                <input type="checkbox" checked={formData.optionalSubjects.includes(sub)} onChange={() => handleOptionalSubjectToggle(sub)} />
                                {sub}
                              </label>
                            ))}
                            {formData.stream === 'Commerce' && ['Mathematics', 'Informatics Practices', 'Physical Education'].map(sub => (
                              <label key={sub} className="flex items-center gap-2 bg-white px-3 py-1.5 border rounded-lg cursor-pointer text-sm">
                                <input type="checkbox" checked={formData.optionalSubjects.includes(sub)} onChange={() => handleOptionalSubjectToggle(sub)} />
                                {sub}
                              </label>
                            ))}
                            {formData.stream === 'Arts' && ['History', 'Geography', 'Political Science', 'Sociology', 'Psychology', 'Hindi Elective'].map(sub => (
                              <label key={sub} className="flex items-center gap-2 bg-white px-3 py-1.5 border rounded-lg cursor-pointer text-sm">
                                <input type="checkbox" checked={formData.optionalSubjects.includes(sub)} onChange={() => handleOptionalSubjectToggle(sub)} />
                                {sub}
                              </label>
                            ))}
                          </div>
                       </div>
                    )}
                 </div>
              )}
            </>
          )}

          {/* TEACHER SPECIFIC */}
          {role === 'teacher' && (
             <div className="mt-6 p-4 bg-indigo-50 rounded-xl text-indigo-800 text-sm font-medium border border-indigo-100 flex items-start gap-3">
               <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <p>
                 <span className="font-bold block mb-1">Registration Note:</span> 
                 Your specific teaching subjects, classes, and sections will be securely assigned by the School Administrator when your account is approved.
               </p>
             </div>
          )}

          <button type="submit" disabled={!schoolId || success} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors mt-6">
            Submit Registration
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserRegistration;
