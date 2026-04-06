import { useState, useRef, useCallback } from 'react';

import { Outlet } from "react-router-dom";

import Sidebar from "./SideNav";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsSidebarOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsSidebarOpen(false);
    }, 150); 
  }, []);

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-color1  py-0.5 relative">
      <div className={`absolute  duration-700 z-50 right-0 top-0 w-full h-full fadeOut pointer-events-none`} style={{background: "#172744"}} ></div>
      <div className="w-full md:flex-none md:duration-75" style={{width: window.innerWidth < 768 ? '100%' : (isSidebarOpen ? '200px' : '72px')}}>
        <Sidebar  isSidebarOpen={isSidebarOpen} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} />
      </div>
      <div className="flex-grow p-4 sm:p-6 md:overflow-y-auto md:p-12 md:pt-8 bg-gray-50 rounded-2xl">
        <Outlet />
      </div>
    </div>
  );
}
