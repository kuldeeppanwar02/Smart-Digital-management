import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import api from '../api';

export default function AdminAnalyticsCharts() {
  const [data, setData] = useState({
    feeStats: [],
    classDistribution: [],
    attendanceTrend: [],
    performanceTrend: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/admin-overview');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A84FF]"></div>
      </div>
    );
  }

  const { feeStats, classDistribution, attendanceTrend, performanceTrend } = data;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e1e1e]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="font-bold text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e1e1e]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="font-bold text-white mb-1">{label}</p>
          <p className="text-purple-400 text-sm font-semibold">
            Students: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e1e1e]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="font-bold text-white mb-1">{payload[0].name}</p>
          <p className="text-sm font-semibold" style={{ color: payload[0].payload.color }}>
            ₹{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Row: Attendance & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Area Chart */}
        <div className="glass-card rounded-2xl p-6 h-[350px] flex flex-col">
          <h2 className="text-lg font-bold font-heading mb-4 text-[#e5e5e5] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0A84FF]"></span>
            5-Day Attendance Trend
          </h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0A84FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#a3a3a3', fontSize: 12 }} border="none" axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="percentage" name="Attendance" stroke="#0A84FF" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Line Chart */}
        <div className="glass-card rounded-2xl p-6 h-[350px] flex flex-col">
          <h2 className="text-lg font-bold font-heading mb-4 text-[#e5e5e5] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34C759]"></span>
            School Performance Avg
          </h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="examName" stroke="#666" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" name="Avg Score" stroke="#34C759" strokeWidth={4} dot={{ r: 6, fill: '#121212', stroke: '#34C759', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Row: Demographics & Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Class Distribution Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 h-[350px] flex flex-col">
          <h2 className="text-lg font-bold font-heading mb-4 text-[#e5e5e5] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Class-wise Student Distribution
          </h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="students" fill="#A855F7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Collection Doughnut Chart */}
        <div className="glass-card rounded-2xl p-6 h-[350px] flex flex-col relative">
          <h2 className="text-lg font-bold font-heading mb-2 text-[#e5e5e5] items-center gap-2 flex">
            <span className="w-2 h-2 rounded-full bg-[#FFCC00]"></span>
            Fee Collection Stats
          </h2>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {feeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a3a3a3' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
               <span className="text-xs text-gray-400 font-semibold tracking-widest uppercase">Total</span>
               <span className="text-xl font-bold text-white tracking-tight">
                 ₹{(feeStats.reduce((acc, curr) => acc + curr.value, 0)).toLocaleString()}
               </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
