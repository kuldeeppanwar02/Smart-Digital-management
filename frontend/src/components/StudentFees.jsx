import React, { useState, useEffect } from 'react';
import api from '../api';

const StudentFees = ({ studentId }) => {
  const [feeData, setFeeData] = useState(null);
  const [academicYear, setAcademicYear] = useState('2023-2024');
  const [loading, setLoading] = useState(true);

  // If studentId isn't passed as a prop, assume we are logged in as the student
  const activeStudentId = studentId || JSON.parse(localStorage.getItem('user'))?._id;

  useEffect(() => {
    if (activeStudentId) fetchFeeData();
  }, [academicYear, activeStudentId]);

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/fees/student/${activeStudentId}/${academicYear}`);
      setFeeData(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading fee records...</div>;

  return (
    <div className="space-y-6">
      
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
         <h3 className="font-bold text-gray-900">Fee Statement</h3>
         <select 
           value={academicYear} 
           onChange={(e) => setAcademicYear(e.target.value)}
           className="bg-gray-50 border border-gray-200 text-sm py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
         >
           <option value="2023-2024">2023-2024</option>
           <option value="2024-2025">2024-2025</option>
         </select>
      </div>

      {!feeData?.structureFound ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl flex items-center gap-3 shadow-sm">
           <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           <div>
             <h4 className="font-bold">No Fee Structure Defined</h4>
             <p className="text-sm mt-0.5">The school administration has not generated the fee structure for your assigned class this academic year.</p>
           </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10"></div>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Total Fees ({academicYear})</p>
               <h3 className="text-3xl font-bold text-gray-900">₹{feeData.totalFee.toLocaleString()}</h3>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10"></div>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Paid Amount</p>
               <h3 className="text-3xl font-bold text-emerald-600">₹{feeData.totalPaid.toLocaleString()}</h3>
            </div>
            
            <div className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden ${feeData.balance > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
               <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 ${feeData.balance > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}></div>
               <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${feeData.balance > 0 ? 'text-red-400' : 'text-emerald-500'}`}>Outstanding Dues</p>
               <h3 className={`text-3xl font-bold ${feeData.balance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                 ₹{feeData.balance.toLocaleString()}
               </h3>
               {feeData.balance === 0 && <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> fully paid</p>}
            </div>
          </div>

          {/* Payment History Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Payment & Receipt History</h3>
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded">{feeData.history.length} Records</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Receipt No.</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4 text-right pr-6">Amount Paid (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {feeData.history.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500 bg-gray-50/50">No payments have been recorded yet.</td></tr>
                ) : feeData.history.map(payment => (
                  <tr key={payment._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 pl-6 font-medium text-gray-900">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{payment.receiptNumber}</span>
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-700">
                      {payment.paymentMethod}
                      {payment.remarks && <span className="block text-xs text-gray-400 mt-0.5">{payment.remarks}</span>}
                    </td>
                    <td className="p-4 text-right pr-6 font-bold text-emerald-600">
                      +₹{payment.amountPaid.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
};

export default StudentFees;
