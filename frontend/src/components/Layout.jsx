import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api';
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
  Search,
  Plus
} from 'lucide-react';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full font-medium">
      <CalendarDays className="w-4 h-4 text-[#0A84FF]" />
      {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      <span className="text-white ml-1 font-bold">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
};

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user._id) return;
      try {
        const { data } = await api.get('/notifications/my');
        setNotifications(data);
      } catch (err) { console.error('Failed to fetch notifications', err); }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [user._id]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getBasePath = () => {
    if (user.role === 'superadmin' || user.role === 'school_admin' || user.role === 'principal') return '/admin';
    return `/${user.role}`;
  };
  const basePath = getBasePath();
  
  const showGlobalSidebar = (user.role === 'superadmin' || user.role === 'school_admin' || user.role === 'principal');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: basePath },
    { id: 'timetable', label: 'Timetables', icon: CalendarDays, path: `${basePath}/timetable` },
    { id: 'users', label: 'Students & Staff', icon: Users, path: `${basePath}/users` },
    { id: 'fees', label: 'Fees & Finance', icon: Wallet, path: `${basePath}/fees` },
    { id: 'tracking', label: 'Bus Tracking', icon: Map, path: `${basePath}/tracking` },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (user.role === 'superadmin' || user.role === 'principal') return true;
    
    // For non-admin roles, all their tools are in horizontal tabs, so they only need 'Dashboard' in the global nav
    if (user.role === 'teacher' || user.role === 'student' || user.role === 'parent') {
      return item.id === 'dashboard';
    }

    // If a school_admin has no specific sub-permissions set, they assume full admin access.
    if (!user.permissions || user.permissions.length === 0) return true;

    const requiredPermMap = {
      dashboard: null,
      timetable: 'manage_timetable',
      users: 'manage_users',
      fees: 'manage_fees',
      tracking: 'manage_transport'
    };
    
    const reqPerm = requiredPermMap[item.id];
    if (!reqPerm) return true;
    return user.permissions.includes(reqPerm);
  });

  return (
    <div className="flex h-screen bg-[#121212] text-[#e5e5e5] overflow-hidden font-sans">
      
      {/* Mobile Overlay */}
      {showGlobalSidebar && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {showGlobalSidebar && (
      <aside 
        className={`fixed md:relative z-30 h-full bg-[#1E1E1E]/80 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 md:transition-all flex flex-col ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0 md:w-20'}`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b border-white/5">
          <School className="w-8 h-8 text-[#0A84FF]" />
          {isSidebarOpen && <span className="ml-3 font-heading font-semibold text-xl tracking-tight text-white">Smart Edu</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={handleNavClick}
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
           <NavLink 
            to={`${basePath}/settings`}
            onClick={handleNavClick}
            className={({ isActive }) => `
              w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-white/10 text-white border border-white/20' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'}
            `}
          >
            <Settings className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
            {isSidebarOpen && <span>Settings</span>}
          </NavLink>
          <button onClick={handleLogout} className="w-full flex items-center px-3 py-3 rounded-xl text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-all">
            <LogOut className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
            {isSidebarOpen && <span>Log Out</span>}
          </button>
        </div>
      </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-20 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            {showGlobalSidebar && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
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
            <LiveClock />
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-400 hover:text-white transition-colors"
               >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF3B30] border-2 border-[#121212] text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-4 w-80 bg-[#1e1e1e]/95 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden z-50 animate-fade-in origin-top-right">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                    <h3 className="font-bold text-white">Notifications</h3>
                    <button onClick={markAllAsRead} className="text-xs text-[#0A84FF] hover:text-blue-400 font-semibold px-2 py-1 rounded-md hover:bg-[#0A84FF]/10 transition-colors">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto w-full custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                           <Bell className="w-5 h-5 text-gray-500" />
                        </div>
                        <p className="text-sm font-semibold text-gray-400">No new notifications</p>
                        <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                         <div key={n._id} onClick={() => markAsRead(n._id)} className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${n.isRead ? 'opacity-50' : 'bg-[#0A84FF]/5'}`}>
                            <div className="flex gap-3">
                               <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-[#0A84FF] shadow-[0_0_8px_rgba(10,132,255,0.8)]'}`}></div>
                               <div>
                                 <p className={`text-sm ${n.isRead ? 'font-medium text-gray-300' : 'font-bold text-white'} mb-0.5`}>{n.title}</p>
                                 <p className="text-xs text-gray-400 leading-snug">{n.message}</p>
                                 <p className="text-[10px] text-gray-500 mt-2 font-medium">{new Date(n.createdAt).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                               </div>
                            </div>
                         </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 border-l border-white/10 pl-6 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A84FF] to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-semibold text-white">{user.name || 'Admin User'}</p>
                <p className="text-gray-400 text-xs capitalize">{user.role || 'Administrator'}</p>
              </div>
            </div>
            {!showGlobalSidebar && (
              <button onClick={handleLogout} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-colors ml-2" title="Log Out">
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#121212] p-6 lg:p-8 pb-32 md:pb-8">
          <div className="max-w-7xl mx-auto animate-fade-in relative z-0">
            {/* Background ambient glow effect */}
            <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-[#0A84FF] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#34C759] rounded-full blur-[150px] opacity-5 pointer-events-none"></div>
            
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {showGlobalSidebar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1E1E1E]/95 backdrop-blur-xl border-t border-white/10 z-50 px-6 py-3 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center relative gap-2 overflow-x-auto no-scrollbar">
            {filteredMenuItems.map((item) => (
               <NavLink 
                 key={item.id}
                 to={item.path} 
                 end={item.id === 'dashboard'} 
                 onClick={handleNavClick} 
                 className={({isActive}) => `flex flex-col items-center gap-1 transition-colors min-w-[3.5rem] ${isActive ? 'text-[#0A84FF]' : 'text-gray-400 hover:text-white'}`}
               >
                 <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                 <span className="text-[9px] sm:text-[10px] font-semibold tracking-wide whitespace-nowrap">{item.label.split(' ')[0]}</span>
               </NavLink>
            ))}
            <NavLink to={`${basePath}/settings`} onClick={handleNavClick} className={({isActive}) => `flex flex-col items-center gap-1 transition-colors min-w-[3.5rem] ${isActive ? 'text-[#0A84FF]' : 'text-gray-400 hover:text-white'}`}>
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wide whitespace-nowrap">Settings</span>
            </NavLink>
          </div>
        </div>
        )}

      </div>
    </div>
  );
};

export default Layout;
