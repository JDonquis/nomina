import labFalconLogo from "../../assets/logoBlue.webp";
import secretariaLogo from "../../assets/secretaria_logo.png";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { useState } from "react";

import { NavLink, Link } from "react-router-dom";
import { Icon } from "@iconify/react";

const links = [
  {
    permission: true,
    name: "Inicio",
    href: "/dashboard",
    icon: "hugeicons:home-09",
  },
  {
    permission: true,
    name: "Nómina",
    href: "/dashboard/nomina",
    icon: "mdi:worker",
  },
  {
    permission: "admin",
    name: "Usuarios",
    href: "/dashboard/usuarios",
    icon: "solar:user-linear",
  },
  {
    permission: true,
    name: "Censados",
    href: "/dashboard/censados",
    icon: "ci:wavy-check",
  },
];

export default function SideNav(props) {
  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
    } catch (error) {
      console.error("Failed to logout", error);
      logout();

    }
  }

  const { user } = useAuth();

  console.log(user)

  return (
    <nav
      className="flex w-full bg-color1 h-full flex-col px-3 pr-1 py-1 md:py-4 md:px-4"
      onMouseEnter={() => props.handleSidebarToggle()}
      onMouseLeave={() => props.handleSidebarToggle()}
    >

      <Link
        className={`duration-150 hidden  mb-4 font-exo2 md:flex h-20 items-end justify-end rounded-md bg-white bg-opacity-5   md:h-28 ${props.isSidebarOpen ? 'p-4' : 'p-1'}`}
        href="/"
      >
        <div className="w-32 font-exo2 relative duration-150 text-white md:w-40 flex flex-row justify-between items-end">
          <img
            src={secretariaLogo}
            className={`${props.isSidebarOpen ? 'w-12 h-12' : 'w-10 h-8'} logo w-12 duration-150 `}
            alt="logo del sistema"
          />
          
            <p className={ props.isSidebarOpen ? "block duration-300  absolute -bottom-1 right-3 font-semibold self-end opacity-100 font-exo2" : "opacity-0 absolute font-exo2"}>
              Nómina
            </p>
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        {links.map((eachLink) => {
          if (eachLink.permission === true || user?.is_admin) {
            return (
              <NavLink
                to={eachLink.href}
                end
                key={eachLink.href}
                className={({ isActive }) =>
                  `flex h-[48px] duration-150 hover:text-color3 grow items-center relative justify-between gap-2  text-sm font-medium hover:bg-sky-100 md:flex-none md:justify-between pl-2 ${
                    isActive
                      ? "bg-gray-50 activeLink text-color1 rounded-2xl md:rounded-none  md:rounded-l-2xl"
                      : "text-gray-50 hover:bg-white/10 hover:text-color4 rounded-full"
                  }`
                }
              >
                <div className="grid grid-cols-12  items-center">
                    <Icon className={` col-span-3 z-10`} icon={eachLink.icon} width={24} height={24} />
                    <span className={props.isSidebarOpen ? "hidden md:block opacity-100" : "hidden md:block  opacity-0" + " duration-200 z-0"}>
                      {eachLink.name}
                    </span>

                </div>
              </NavLink>
            );
          }
        })}
        <div className="hidden h-auto w-full grow rounded-md md:block"></div>
        <div className="flex gap-2 justify-start items-center">
        
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className=" flex text-white text-opacity-50 h-[48px] grow items-center justify-center gap-2 rounded-md  text-sm font-medium hover:bg-sky-100 hover:text-white md:flex-none md:justify-start md:p-2 md:px-1"
          >
            <Icon icon="tabler:logout" width="24" height="24" />
            {props.isSidebarOpen ? (
              <span className="sr-only">Cerrar sesión</span>
            ) : null}
          </button>
          <p className="text-xs text-left text-opacity-55  text-white ">
            {props.isSidebarOpen ? user?.first_name : null}
          </p>
        </div>
      </div>
    </nav>
  );
}
