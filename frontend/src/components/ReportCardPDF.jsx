import React, { useRef } from 'react';
import { Download, Award, FileText } from 'lucide-react';

export default function ReportCardPDF({ data }) {
  const printRef = useRef(null);

  if (!data || !data.student) return null;

  const downloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;
      
      const element = printRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ReportCard_${data.student.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      alert('Failed to generate PDF');
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">Academic Report Card</h2>
          <p className="text-sm text-gray-500">Auto-generated performance analysis</p>
        </div>
        <button 
          onClick={downloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      <div className="bg-gray-100 p-8 rounded-2xl overflow-x-auto shadow-inner border border-gray-200">
        <div ref={printRef} className="bg-white p-12 max-w-4xl mx-auto shadow-sm border border-gray-200 aspect-[1/1.4] relative rounded">
          {/* Header */}
          <div className="text-center border-b-4 border-indigo-900 pb-8 mb-8">
            <h1 className="text-4xl font-black text-indigo-900 uppercase tracking-widest mb-2">Smart Edu Academy</h1>
            <p className="text-gray-600 font-semibold tracking-wide">Official Academic Report Card</p>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Student Name</p>
              <p className="text-xl font-bold text-gray-900">{data.student.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Roll Number</p>
              <p className="text-xl font-bold text-gray-900">{data.student.rollNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Class & Section</p>
              <p className="text-xl font-bold text-gray-900">{data.student.className} - {data.student.section}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Academic Year</p>
              <p className="text-xl font-bold text-gray-900">2023-2024</p>
            </div>
          </div>

          {/* Subjects Table */}
          <table className="w-full text-left border-collapse mb-12">
            <thead>
              <tr className="bg-indigo-50 border-b-2 border-indigo-200 text-sm uppercase tracking-wider text-indigo-900 font-black">
                <th className="p-4 rounded-tl-lg">Subject</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-center">Marks Obtained</th>
                <th className="p-4 text-center">Total Marks</th>
                <th className="p-4 text-center rounded-tr-lg">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{sub.subject}</td>
                  <td className="p-4 text-sm font-semibold text-gray-500">{sub.examType}</td>
                  <td className="p-4 text-center font-bold text-gray-900">{sub.marksObtained}</td>
                  <td className="p-4 text-center text-gray-500 font-semibold">{sub.totalMarks}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block w-8 h-8 leading-8 rounded-full font-bold text-sm text-white ${
                      ['A+', 'A'].includes(sub.grade) ? 'bg-emerald-500' :
                      ['B+', 'B'].includes(sub.grade) ? 'bg-blue-500' :
                      ['C'].includes(sub.grade) ? 'bg-amber-500' : 'bg-red-500'
                    }`}>
                      {sub.grade}
                    </span>
                  </td>
                </tr>
              ))}
              {data.subjects.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-medium">No external or internal marks recorded yet.</td></tr>
              )}
            </tbody>
          </table>

          {/* Performance Summary Grid */}
          <div className="bg-gray-50 rounded-2xl p-6 grid grid-cols-3 gap-6 border border-gray-100">
            <div className="text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Score</p>
              <p className="text-3xl font-black text-gray-900">{data.summary.totalObtained} <span className="text-sm font-semibold text-gray-400">/ {data.summary.totalExpected}</span></p>
            </div>
            <div className="text-center border-l border-r border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Overall Percentage</p>
              <p className="text-3xl font-black text-emerald-600">{data.summary.percentage}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold flex items-center justify-center gap-1 text-gray-500 uppercase tracking-widest mb-2">
                 <Award className="w-4 h-4 text-amber-500" /> Class Rank
              </p>
              <p className="text-3xl font-black text-amber-500">#{data.summary.rank} <span className="text-sm font-semibold text-gray-400">/ {data.summary.totalStudentsInClass}</span></p>
            </div>
          </div>
          
          {/* Footer Signatures */}
          <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t-2 border-gray-100 pt-8 mt-12">
             <div className="text-center">
               <div className="w-32 h-px bg-gray-400 mb-2 mx-auto"></div>
               <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Class Teacher</p>
             </div>
             <div className="text-center flex flex-col items-center">
               <div className="w-16 h-16 bg-red-50 text-red-600 border border-red-200 rounded-full flex items-center justify-center mb-4 transform -rotate-12 opacity-80 backdrop-blur-sm shadow-sm relative after:absolute after:inset-1 after:border after:border-dashed after:border-red-400 after:rounded-full">
                 <span className="font-black text-xs uppercase tracking-widest leading-tight text-center relative z-10 opacity-90 drop-shadow-sm" style={{ letterSpacing: '0.15em' }}>VERIFIED<br/>SEAL</span>
               </div>
             </div>
             <div className="text-center">
               <div className="w-32 h-px bg-gray-400 mb-2 mx-auto"></div>
               <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Principal</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
