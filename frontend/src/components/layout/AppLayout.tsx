import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import Sidebar from "./Sidebar";
import LocationSwitcher from "@/components/custom/location/LocationSwitcher";
import NotificationCenter from "@/components/custom/notifications/NotificationCenter";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, User, Settings, LogOut, Sun, Moon } from "lucide-react";
import { getImageUrl } from "@/lib/helper";
import { isRouteRestricted } from "@/middleware";
import { useActiveLocation } from "@/services/locationService";

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { activeLocation } = useActiveLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Redirect to home if the user's role is restricted from the current path
    if (isRouteRestricted(user?.role, location.pathname)) {
      navigate("/");
    }
  }, [location.pathname, user?.role, navigate]);

  const Logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {import.meta.env.VITE_DEMO_SERVER === "true" && (
        <div className="fixed bottom-0 z-50 left-0 w-full p-2 rounded text-xs text-center bg-yellow-300 text-gray-900">
          This is a demo application. All data will automatically revert to its
          original state every hour.
        </div>
      )}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="h-16 border-b border-border bg-white shadow-sm px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Noro Lep POS</h1>
            {activeLocation && (
              <span className="text-xs text-gray-400 hidden sm:inline">
                · {activeLocation.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
                title={theme === "dark" ? "Svetlo" : "Temno"}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}

            {/* Notification center — bell icon with live alerts */}
            <NotificationCenter />

            {/* Location switcher — hidden in single-location mode */}
            <LocationSwitcher />

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
                  <img
                    src={getImageUrl(user?.image)}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-left">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-xs">{user?.role}</div>
                  </div>
                  <ChevronDown size={16} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="w-48 z-50 bg-white shadow-md rounded-md p-2 border border-gray-200"
                  align="end"
                >
                  <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100">
                    <User size={16} /> Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100">
                    <Settings size={16} /> Settings
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="border-t my-1" />
                  <DropdownMenu.Item
                    onClick={Logout}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 rounded-md cursor-pointer hover:bg-red-100"
                  >
                    <LogOut size={16} /> Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        <div>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
