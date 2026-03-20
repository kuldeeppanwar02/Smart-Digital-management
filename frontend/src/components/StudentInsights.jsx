import React, { useState, useEffect } from 'react';
import { Brain, AlertTriangle, TrendingUp, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';

export default function StudentInsights({ studentId }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get(`/analytics/student-risk/${studentId}`);
        setInsights(res.data);
      } catch (err) {
        console.error('Failed to fetch AI insights:', err);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) {
      fetchInsights();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center justify-center min-h-[250px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!insights) return null;

  const { riskLevel, riskColor, overallPercentage, weakSubjects, recommendations } = insights;

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400">
          <Brain className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading text-white">Smart Insights</h2>
          <p className="text-xs text-purple-300 font-medium tracking-wide">AI-Generated Analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Risk Profile & Stats */}
        <div className="space-y-4">
          <div className="bg-[#121212]/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-gray-400 font-medium">Predicted Risk Level</span>
            <div className="flex items-center gap-2" style={{ color: riskColor }}>
              {riskLevel === 'High' ? <AlertTriangle className="w-5 h-5" /> : (riskLevel === 'Moderate' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />)}
              <span className="font-bold text-lg">{riskLevel}</span>
            </div>
          </div>
          
          <div className="bg-[#121212]/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-gray-400 font-medium">Trajectory & Average</span>
            <div className="flex items-center gap-2 text-[#0A84FF]">
              <TrendingUp className="w-5 h-5" />
              <span className="font-bold text-lg">{overallPercentage}%</span>
            </div>
          </div>

          {weakSubjects?.length > 0 && (
            <div className="bg-[#121212]/50 border border-white/5 rounded-xl p-4">
              <span className="text-sm text-gray-400 font-medium mb-3 block">Identified Weak Areas</span>
              <div className="flex flex-wrap gap-2">
                {weakSubjects.map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/20">
                    <BookOpen className="w-3.5 h-3.5" />
                    {sub.subject} ({sub.average}%)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Recommendations Timeline */}
        <div className="bg-[#121212]/50 border border-white/5 rounded-xl p-4 h-full">
           <span className="text-sm text-gray-400 font-medium mb-4 block">Recommended Actions</span>
           <div className="space-y-4">
             {recommendations.map((rec, idx) => {
               let dotColor = 'bg-blue-500';
               let textColor = 'text-blue-300';
               if (rec.type === 'danger') { dotColor = 'bg-red-500'; textColor = 'text-red-300'; }
               if (rec.type === 'warning') { dotColor = 'bg-yellow-500'; textColor = 'text-yellow-300'; }
               if (rec.type === 'success') { dotColor = 'bg-green-500'; textColor = 'text-green-300'; }
               if (rec.type === 'academic') { dotColor = 'bg-purple-500'; textColor = 'text-purple-300'; }
               
               return (
                 <div key={idx} className="flex gap-3 items-start relative before:absolute before:left-1 before:top-4 before:bottom-[-16px] before:w-[2px] last:before:hidden before:bg-white/5">
                   <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 z-10 box-content border-2 border-[#121212] ${dotColor}`}></div>
                   <p className={`text-sm ${textColor} leading-tight bg-white/5 px-3 py-2 rounded-lg border border-white/5 flex-1`}>
                     {rec.message}
                   </p>
                 </div>
               )
             })}
           </div>
        </div>
      </div>
    </div>
  );
}
