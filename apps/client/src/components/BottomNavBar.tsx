import React from "react";

interface BottomNavBarProps {
  activeTab?: "dashboard" | "cafes" | "bookings" | "settings";
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab = "cafes",
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "cafes", label: "Cafes", icon: "storefront" },
    { id: "bookings", label: "Bookings", icon: "event_note" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <div className="md:hidden">
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-[#fdf9f4]/80 dark:bg-[#1c1c19]/80 backdrop-blur-xl shadow-[0_-10px_40px_rgba(28,28,25,0.04)] rounded-t-3xl">
        {navItems.map((item) => (
          <a
            key={item.id}
            href="#"
            className={`flex flex-col items-center justify-center px-5 py-2 hover:scale-110 transition-transform duration-200 rounded-2xl ${
              activeTab === item.id
                ? "bg-[#e6e2dd] text-[#614734] dark:text-[#fdf9f4]"
                : "text-[#81756d] dark:text-[#a0958e]"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label text-[11px] uppercase tracking-widest font-medium mt-1">
              {item.label}
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
};
