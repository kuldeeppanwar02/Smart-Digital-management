import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function SchoolRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    schoolName: '',
    phone: '',
    address: '',
    config: {
      level: [],
      management: '',
      curriculum: [],
      specialType: []
    }
  });

  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [field]: value }
    }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => {
      const array = prev.config[field];
      const newArray = array.includes(value) 
        ? array.filter(v => v !== value) 
        : [...array, value];
      
      return {
        ...prev,
        config: { ...prev.config, [field]: newArray }
      };
    });
  };

  const nextStep = () => {
    if (step === 1 && (!formData.adminName || !formData.adminEmail || !formData.adminPassword)) {
      return setError('Please fill all admin details.');
    }
    if (step === 2 && (!formData.schoolName || !formData.phone)) {
      return setError('Please fill school name and phone.');
    }
    if (step === 3 && (formData.config.level.length === 0 || !formData.config.management || formData.config.curriculum.length === 0)) {
      return setError('Please select at least one level, management type, and curriculum.');
    }
    setError(null);
    setStep(s => s + 1);
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/schools/register', formData);
      alert('School Registered Successfully! Please login.');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Focus specific alert for Preschool/Primary based on user request
  const showsParentModuleAlert = formData.config.level.includes('Preschool/Play School') || formData.config.level.includes('Primary School');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transform rotate-3">
             <svg className="w-8 h-8 text-white -rotate-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path d="M12 14l9-5-9-5-9 5 9 5z" />
               <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
             </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Onboard Your Institute</h2>
          <p className="mt-2 text-sm text-gray-500">Configure your smart school SaaS platform in minutes.</p>
        </div>

        <div className="mt-8 bg-white/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-white">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500 ease-in-out`} style={{width: `${((step - 1) / 3) * 100}%`}}></div>
              
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 ${
                  step >= i ? 'bg-blue-600 border-blue-100 text-white' : 'bg-gray-100 border-white text-gray-400'
                } font-bold transition-colors duration-300`}>
                  {step > i ? '✓' : i}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-semibold text-gray-500 mt-3 uppercase tracking-wider px-1">
              <span>Admin Details</span>
              <span>School Info</span>
              <span>Configuration</span>
              <span>Review</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Step 1: Admin Owner Account</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Full Name</label>
                <input type="text" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} className="w-full border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Email Address</label>
                <input type="email" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} className="w-full border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="admin@myschool.edu" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Secure Password</label>
                <input type="password" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} className="w-full border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="••••••••" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Step 2: School Identity</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Institute Name</label>
                <input type="text" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} className="w-full border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="St. Xavier's High School" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Address</label>
                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows="3" className="w-full border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none" placeholder="123 Education Lane, City..."></textarea>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Step 3: SaaS Configuration</h3>
              
              {/* Level Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">1. Education Levels Offered (Select all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['Preschool/Play School', 'Primary School (1-5)', 'Middle School (6-8)', 'Secondary (9-10)', 'Higher Secondary (11-12)'].map(lvl => (
                    <label key={lvl} className={`flex items-start p-3 border rounded-xl cursor-pointer transition-colors ${formData.config.level.includes(lvl) ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <input type="checkbox" className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300" checked={formData.config.level.includes(lvl)} onChange={() => handleArrayToggle('level', lvl)} />
                      <span className="ml-3 text-sm font-medium text-gray-700">{lvl}</span>
                    </label>
                  ))}
                </div>
                {showsParentModuleAlert && (
                  <div className="mt-3 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    Parent Involvement Module will be automatically activated for Preschool/Primary classes.
                  </div>
                )}
              </div>

              {/* Management Type */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">2. Management / Ownership</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['Private (Unaided)', 'Government', 'Government-Aided'].map(mgt => (
                    <label key={mgt} className={`flex items-center justify-center p-3 border rounded-xl text-sm font-medium cursor-pointer transition-colors ${formData.config.management === mgt ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" className="sr-only" name="management" checked={formData.config.management === mgt} onChange={() => handleConfigChange('management', mgt)} />
                      {mgt}
                    </label>
                  ))}
                </div>
              </div>

              {/* Curriculum */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">3. Curriculum (Boards)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['CBSE', 'CISCE (ICSE/ISC)', 'Rajasthan State Board', 'Other State Board', 'International (IB/Cambridge)'].map(board => (
                    <label key={board} className={`flex items-start p-3 border rounded-xl cursor-pointer transition-colors ${formData.config.curriculum.includes(board) ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <input type="checkbox" className="mt-1 h-4 w-4 text-emerald-600 rounded border-gray-300" checked={formData.config.curriculum.includes(board)} onChange={() => handleArrayToggle('curriculum', board)} />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {board}
                        {board === 'Rajasthan State Board' && <span className="block text-xs text-emerald-600 mt-1">Recommended for local alignment</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Types */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">4. Special Features (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {['General', 'Boarding School', 'Alternative Philosophy', 'Special Education', 'NIOS Center'].map(type => (
                    <button key={type} type="button" onClick={() => handleArrayToggle('specialType', type)} className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${formData.config.specialType.includes(type) ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      {formData.config.specialType.includes(type) && '✓ '}{type}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Ready to Launch</h3>
                <p className="text-sm text-gray-500 mt-1">Review your school data before we provision your SaaS tenant.</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-sm">
                <div className="grid grid-cols-2 gap-y-4">
                  <div><span className="text-gray-500 block mb-1 text-xs uppercase font-bold tracking-wider">School Name</span><span className="font-semibold text-gray-900">{formData.schoolName}</span></div>
                  <div><span className="text-gray-500 block mb-1 text-xs uppercase font-bold tracking-wider">Admin Login</span><span className="font-semibold text-gray-900">{formData.adminEmail}</span></div>
                  <div className="col-span-2"><span className="text-gray-500 block mb-1 text-xs uppercase font-bold tracking-wider">Education Levels</span><div className="flex flex-wrap gap-1 mt-1">{formData.config.level.map(l => <span key={l} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{l}</span>)}</div></div>
                  <div className="col-span-2"><span className="text-gray-500 block mb-1 text-xs uppercase font-bold tracking-wider">Curriculum Boards</span><div className="flex flex-wrap gap-1 mt-1">{formData.config.curriculum.map(c => <span key={c} className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-medium">{c}</span>)}</div></div>
                  <div className="col-span-2"><span className="text-gray-500 block mb-1 text-xs uppercase font-bold tracking-wider">Management Type</span><span className="font-semibold text-gray-900">{formData.config.management}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 flex items-center justify-between pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="px-6 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">Back</button>
            ) : (
              <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900">Cancel</Link>
            )}
            
            {step < 4 ? (
              <button onClick={nextStep} className="px-8 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all text-sm ml-auto">Continue</button>
            ) : (
              <button 
                onClick={submitRegistration} 
                disabled={loading}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all text-sm ml-auto flex items-center gap-2 disabled:opacity-70"
              >
                {loading ? 'Provisioning Tenant...' : 'Provision School Workspace'}
                {!loading && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              </button>
            )}
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-8">Smart School SaaS Engine v2.0 • Multi-Tenant Architecture</p>
      </div>
    </div>
  );
}
