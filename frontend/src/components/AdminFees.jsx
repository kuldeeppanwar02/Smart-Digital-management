import React, { useState, useEffect } from 'react';
import api from '../api';

const AdminFees = () => {
  const [structures, setStructures] = useState([]);
  const [summary, setSummary] = useState([]);
  const [academicYear, setAcademicYear] = useState('2023-2024');
  
  // Modals for setting class fee and logging payment
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ className: '', stream: 'None', amount: '' });
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ studentId: '', studentName: '', amountPaid: '', paymentMethod: 'Cash', remarks: '' });
  
  const [activeTab, setActiveTab] = useState('overview'); // overview, structures

  useEffect(() => {
    fetchFeeStructures();
    fetchSchoolSummary();
  }, [academicYear]);

  const fetchFeeStructures = async () => {
    try {
      const { data } = await api.get('/fees/structure');
      setStructures(data);
    } catch(err) {
      console.error(err);
    }
  };

  const fetchSchoolSummary = async () => {
    try {
      const { data } = await api.get(`/fees/school/${academicYear}`);
      setSummary(data);
    } catch(err) {
      console.error(err);
    }
  };

  const saveFeeStructure = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/structure', { ...feeForm, academicYear });
      setShowFeeModal(false);
      setFeeForm({ className: '', stream: 'None', amount: '' });
      fetchFeeStructures();
      fetchSchoolSummary();
    } catch(err) {
      alert(err.response?.data?.message || 'Failed to set fee');
    }
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/record', { 
        studentId: paymentForm.studentId, 
        amountPaid: Number(paymentForm.amountPaid),
        paymentMethod: paymentForm.paymentMethod,
        remarks: paymentForm.remarks
      });
      setShowPaymentModal(false);
      fetchSchoolSummary();
    } catch(err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const openPaymentModal = (student) => {
    setPaymentForm({
      studentId: student._id,
      studentName: student.name,
      amountPaid: student.balance > 0 ? student.balance : '',
      paymentMethod: 'Cash',
      remarks: ''
    });
    setShowPaymentModal(true);
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-900/5 border border-white p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fees & Finance</h2>
          <p className="text-sm text-gray-500 mt-1">Manage class structures, track outstanding balances, and log manual payments.</p>
        </div>
        <div className="flex items-center gap-3">
           <select 
             value={academicYear} 
             onChange={(e) => setAcademicYear(e.target.value)}
             className="bg-gray-50 border border-gray-200 text-sm py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
           >
             <option value="2023-2024">2023-2024</option>
             <option value="2024-2025">2024-2025</option>
           </select>
           <button 
             onClick={() => setShowFeeModal(true)}
             className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors px-4 py-2.5 rounded-xl font-semibold border border-emerald-100 shadow-sm"
           >
             + Define Class Fee
           </button>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-100 mb-6">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === 'overview' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Student Ledgers
        </button>
        <button 
          onClick={() => setActiveTab('structures')}
          className={`px-4 py-2.5 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === 'structures' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Fee Structures
        </button>
      </div>

      {activeTab === 'structures' && (
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-left bg-white">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                <th className="p-4 pl-6">Academic Year</th>
                <th className="p-4">Class</th>
                <th className="p-4">Stream</th>
                <th className="p-4 text-right">Total Base Fee (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {structures.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No fee structures defined yet.</td></tr>
              ) : structures.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 pl-6 font-medium text-gray-900">{s.academicYear}</td>
                  <td className="p-4 text-gray-700">{s.className}</td>
                  <td className="p-4">
                     <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">{s.stream}</span>
                  </td>
                  <td className="p-4 text-right font-bold text-gray-900">₹{s.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-left bg-white">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                <th className="p-4 pl-6">Student</th>
                <th className="p-4">Class & Stream</th>
                <th className="p-4 text-right">Total Fee</th>
                <th className="p-4 text-right text-emerald-600">Paid Amount</th>
                <th className="p-4 text-right text-red-500">Balance</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summary.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No approved students found.</td></tr>
              ) : summary.map(st => (
                <tr key={st._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 pl-6">
                    <p className="font-bold text-gray-900 text-sm">{st.name}</p>
                    <p className="text-xs text-gray-500">Roll: {st.rollNumber || 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-gray-800">{st.className}</span>
                    {st.stream && st.stream !== 'None' && <span className="ml-2 text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-semibold">{st.stream}</span>}
                  </td>
                  <td className="p-4 text-right text-sm font-semibold text-gray-800">
                     {st.totalFee > 0 ? `₹${st.totalFee.toLocaleString()}` : <span className="text-gray-400 italic">Not Assigned</span>}
                  </td>
                  <td className="p-4 text-right text-sm font-bold text-emerald-600">₹{st.paid.toLocaleString()}</td>
                  <td className="p-4 text-right">
                     {st.balance > 0 ? (
                       <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                         ₹{st.balance.toLocaleString()} Due
                       </span>
                     ) : st.totalFee > 0 ? (
                       <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                         Clear
                       </span>
                     ) : (
                       <span className="text-gray-400">-</span>
                     )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button 
                      onClick={() => openPaymentModal(st)}
                      className="text-xs bg-gray-50 text-gray-700 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-colors border border-gray-200 hover:border-emerald-600"
                    >
                      Receive Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Set Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Define Base Fee</h3>
            <p className="text-sm text-gray-500 mb-6">Set the required fee for a specific class layer.</p>
            <form onSubmit={saveFeeStructure} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Class Name</label>
                <input type="text" value={feeForm.className} onChange={e => setFeeForm({...feeForm, className: e.target.value})} required placeholder="e.g. 10-A, 11th" className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Stream (Optional)</label>
                <select value={feeForm.stream} onChange={e => setFeeForm({...feeForm, stream: e.target.value})} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium">
                  <option value="None">None</option>
                  <option value="Science">Science</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Total Amount (₹)</label>
                <input type="number" min="0" value={feeForm.amount} onChange={e => setFeeForm({...feeForm, amount: e.target.value})} required placeholder="25000" className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
              </div>
              <div className="mt-8 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFeeModal(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Record Offline Payment</h3>
            <p className="text-sm text-gray-500 mb-6">Logging manual receipt for <strong>{paymentForm.studentName}</strong>.</p>
            <form onSubmit={recordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                <input type="number" min="1" value={paymentForm.amountPaid} onChange={e => setPaymentForm({...paymentForm, amountPaid: e.target.value})} required className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Payment Method</label>
                <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium">
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Remarks (Optional)</label>
                <input type="text" value={paymentForm.remarks} onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})} placeholder="e.g. Check #1234" className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
              </div>
              <div className="mt-8 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20">Record Link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFees;
