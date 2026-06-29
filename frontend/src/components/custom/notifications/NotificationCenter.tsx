import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications, NotificationPriority } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<NotificationPriority, { dot: string; border: string }> = {
  critical: { dot: "bg-red-500", border: "border-l-red-500" },
  warning: { dot: "bg-amber-500", border: "border-l-amber-500" },
  info: { dot: "bg-blue-500", border: "border-l-blue-500" },
};

const NotificationCenter = () => {
  const { notifications, unreadCount, hasCritical, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = (notifId: string, link: string) => {
    markAsRead(notifId);
    setOpen(false);
    navigate(link);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Obvestila"
      >
        <Bell className={cn("h-5 w-5", hasCritical && "text-red-500")} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white",
              hasCritical ? "bg-red-500 animate-pulse" : "bg-secondary",
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-gray-400" />
                  Obvestila
                  {unreadCount > 0 && (
                    <span className="text-xs text-gray-400">({unreadCount} neprebranih)</span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead(notifications.map((n) => n.id))}
                    className="text-xs text-secondary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Preberi vse
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                    <BellOff className="h-10 w-10 mb-2" />
                    <p className="text-sm">Vse prebrano!</p>
                    <p className="text-xs text-gray-400 mt-0.5">Ni novih obvestil</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const styles = PRIORITY_STYLES[notif.priority];
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleClick(notif.id, notif.link)}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 border-l-2 text-left transition-colors hover:bg-gray-50",
                          styles.border,
                          !notif.read && "bg-blue-50/30",
                        )}
                      >
                        <span className="text-xl flex-shrink-0 mt-0.5">{notif.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm leading-tight", !notif.read ? "font-semibold" : "font-medium")}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        </div>
                        {!notif.read && (
                          <span className={cn("h-2 w-2 rounded-full flex-shrink-0 mt-1.5", styles.dot)} />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400">Samodejno osveževanje vsakih 30s</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
