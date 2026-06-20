import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-transparent overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-72 overflow-hidden transition-all duration-300 relative">
        {/* Glow Effects behind layout */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px] -z-10 pointer-events-none hidden dark:block mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] -z-10 pointer-events-none hidden dark:block mix-blend-screen"></div>
        
        <Header />
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth z-0 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
