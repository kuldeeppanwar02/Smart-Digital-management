import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Map, 
  Settings, 
  LogOut, 
  Menu,
  School,
  Wallet,
  Bell,
  Search
} from 'lucide-react';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: `/${user.role === 'superadmin' ? 'admin' : user.role}` },
    { id: 'timetable', label: 'Timetables', icon: CalendarDays, path: '/timetable' }, // Assume path for Timetable
    { id: 'users', label: 'Students & Staff', icon: Users, path: '/users' },
    { id: 'fees', label: 'Fees & Finance', icon: Wallet, path: '/fees' },
    { id: 'tracking', label: 'Bus Tracking', icon: Map, path: '/tracking' },
  ];

  return (
    <div className="flex h-screen bg-[#121212] text-[#e5e5e5] overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#1E1E1E]/80 backdrop-blur-xl border-r border-white/5 transition-all duration-300 flex flex-col z-20`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b border-white/5">
          <School className="w-8 h-8 text-[#0A84FF]" />
          {isSidebarOpen && <span className="ml-3 font-heading font-semibold text-xl tracking-tight text-white">Smart Edu</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20 shadow-[0_0_15px_rgba(10,132,255,0.15)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'} group-hover:scale-110 transition-transform`} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/5 space-y-2">
           <button className="w-full flex items-center px-3 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
            <Settings className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
            {isSidebarOpen && <span>Settings</span>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center px-3 py-3 rounded-xl text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-all">
            <LogOut className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
            {isSidebarOpen && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-20 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0A84FF] transition-colors" />
              <input 
                type="text" 
                placeholder="Search students, staff..." 
                className="bg-[#1E1E1E] text-sm text-white placeholder-gray-500 rounded-full pl-10 pr-4 py-2 border border-white/5 focus:border-[#0A84FF]/50 focus:outline-none focus:ring-1 focus:ring-[#0A84FF]/50 transition-all w-64 lg:w-96"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-gray-400 hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute 1 top-0 right-0 w-2.5 h-2.5 bg-[#FF3B30] rounded-full border-2 border-[#121212]"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-white/10 pl-6 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A84FF] to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-semibold text-white">{user.name || 'Admin User'}</p>
                <p className="text-gray-400 text-xs capitalize">{user.role || 'Administrator'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#121212] p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in relative z-0">
            {/* Background ambient glow effect */}
            <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-[#0A84FF] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#34C759] rounded-full blur-[150px] opacity-5 pointer-events-none"></div>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
