import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Building2, Check } from "lucide-react";
import { useActiveLocation } from "@/services/locationService";

/**
 * Dropdown switcher for the active location, shown in the app header.
 *
 * - Hidden when only one (or zero) locations exist (single-location mode).
 * - Persists the selection to localStorage via LocationContext.
 * - Shows the location name + code in a compact pill.
 * - Dropdown lists all active locations with a checkmark on the active one.
 *
 * When the user switches locations, all React Query caches are
 * invalidated (handled by the context consumer pattern — queries
 * include the locationId in their query keys, so switching naturally
 * triggers refetches).
 */
const LocationSwitcher = () => {
  const {
    activeLocation,
    locations,
    setActiveLocationId,
    isMultiLocation,
    isLoading,
  } = useActiveLocation();
  const [open, setOpen] = useState(false);

  // Hide the switcher entirely in single-location mode
  if (!isMultiLocation || isLoading) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
        aria-label="Switch location"
        aria-expanded={open}
      >
        <MapPin className="h-4 w-4 text-secondary" />
        <span className="hidden sm:inline">
          {activeLocation?.name ?? "Izberi lokacijo"}
        </span>
        <span className="sm:hidden">
          {activeLocation?.code ?? "—"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <div className="p-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2">
                  Lokacije
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {locations.map((loc) => {
                  const isActive = loc._id === activeLocation?._id;
                  return (
                    <button
                      key={loc._id}
                      onClick={() => {
                        setActiveLocationId(loc._id ?? null);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-secondary/5 text-secondary"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive
                            ? "bg-secondary/10 text-secondary"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{loc.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {loc.code} · {loc.city}
                        </p>
                      </div>
                      {isActive && (
                        <Check className="h-4 w-4 text-secondary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 border-t border-gray-100">
                <a
                  href="/locations"
                  className="block w-full text-center px-3 py-1.5 text-xs text-secondary hover:underline"
                >
                  Upravljaj lokacije →
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationSwitcher;
