import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { CheckCircle2, Layout, CalendarDays, ArrowRight, BarChart3, Users } from 'lucide-react';

const AuthLayout = ({ children }) => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="relative min-h-screen w-full bg-surface-50 font-sans overflow-x-hidden">
      {/* Visual/Brand Area (Hidden on Mobile) */}
      <div 
        className={`absolute top-0 bottom-0 z-10 transition-transform duration-700 ease-in-out hidden lg:flex flex-col justify-between overflow-hidden p-12 bg-surface-900 w-[45%] ${isLogin ? 'translate-x-[calc(100vw*0.55)]' : 'translate-x-0'}`}
      >
        {/* Logo Section */}
        <div className="relative z-10 flex items-center space-x-3">
          <img src="/dayflow-favicon.svg" alt="DayFlow Logo" className="h-10 w-10" />
          <span className="text-2xl font-bold text-white tracking-tight">DayFlow</span>
        </div>

        {/* Abstract Productivity Illustration */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-sm">
            {/* Background connecting lines */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2"></div>
            
            {isLogin ? (
              <>
                {/* Login specific visuals */}
                {/* Floating Card 1 */}
                <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-8 transform -translate-x-8 animate-fade-in hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Team Velocity</h3>
                        <p className="text-white/50 text-xs">Analytics</p>
                      </div>
                    </div>
                    <div className="text-green-400 text-xs font-medium">+14%</div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full w-[82%]"></div>
                  </div>
                </div>

                {/* Floating Card 2 */}
                <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-4 mb-8 transform translate-x-12 animate-fade-in" style={{ animationDelay: '150ms' }}>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-500">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 w-24 bg-white/20 rounded-full mb-2"></div>
                      <div className="flex -space-x-2 mt-1">
                        <div className="w-5 h-5 rounded-full bg-primary-500 border border-surface-900"></div>
                        <div className="w-5 h-5 rounded-full bg-blue-500 border border-surface-900"></div>
                        <div className="w-5 h-5 rounded-full bg-accent-500 border border-surface-900"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 3 */}
                <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 transform -translate-x-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">All tasks clear</h3>
                      <p className="text-white/50 text-xs mt-1">
                        Inbox zero reached
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Register specific visuals */}
                {/* Floating Card 1 */}
                <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-8 transform -translate-x-8 animate-fade-in hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                        <Layout className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Project Phoenix</h3>
                        <p className="text-white/50 text-xs">Design System</p>
                      </div>
                    </div>
                    <div className="text-white/40 text-xs">In Progress</div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full w-[65%]"></div>
                  </div>
                </div>

                {/* Floating Card 2 */}
                <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-4 mb-8 transform translate-x-12 animate-fade-in" style={{ animationDelay: '150ms' }}>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-500">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 w-24 bg-white/20 rounded-full mb-2"></div>
                      <div className="h-1.5 w-16 bg-white/10 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 3 */}
                <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 transform -translate-x-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Sprint Planning</h3>
                      <p className="text-white/50 text-xs flex items-center mt-1">
                        Completed <ArrowRight className="h-3 w-3 mx-1" /> Today
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Decorative abstract elements */}
            <div className="absolute top-1/4 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 left-0 w-40 h-40 bg-accent-500/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Footer text */}
        <div className="relative z-10">
          {isLogin ? (
            <>
              <h1 className="text-4xl font-semibold text-white mb-3">Welcome back.</h1>
              <p className="text-white/60 max-w-sm">
                Pick up right where you left off. Access your team's latest updates and progress.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-semibold text-white mb-3">Work clearly.<br/>Move forward.</h1>
              <p className="text-white/60 max-w-sm">
                Bring your tasks, projects, and team together in one intelligent workspace.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Form Area */}
      <div 
        className={`absolute top-0 bottom-0 w-full lg:w-[55%] z-0 transition-transform duration-700 ease-in-out flex flex-col justify-center items-center p-6 sm:p-12 ${isLogin ? 'lg:translate-x-0' : 'lg:translate-x-[calc(100vw*0.45)]'}`}
      >
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-10">
            <img src="/dayflow-favicon.svg" alt="DayFlow Logo" className="h-10 w-10" />
            <span className="text-2xl font-bold text-surface-900 tracking-tight">DayFlow</span>
          </div>
          
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
