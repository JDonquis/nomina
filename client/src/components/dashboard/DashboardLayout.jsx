import { useState } from 'react';

import { Outlet } from "react-router-dom";

import Sidebar from "./SideNav";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function handleSidebarToggle() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-color1  py-0.5">
      <div className="w-full md:flex-none md:duration-100" style={{width: window.innerWidth < 768 ? '100%' : (isSidebarOpen ? '200px' : '72px')}}>
        <Sidebar  isSidebarOpen={isSidebarOpen} handleSidebarToggle={handleSidebarToggle} />
      </div>
      <div className="flex-grow p-4 sm:p-6 md:overflow-y-auto md:p-12 md:pt-8 bg-gray-50 rounded-2xl">
        <Outlet />
      </div>
    </div>
  );
}
