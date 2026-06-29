import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Store,
  Percent,
  Clock,
  Download,
  Shield,
  Gift,
  Tag,
  MapPin,
  DollarSign,
  Bell,
  Database,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFetchOrders } from "@/services/orderService";
import { useFetchInventoryItems } from "@/services/inventoryService";
import { useFetchCustomers } from "@/services/customerService";
import { useFetchShifts } from "@/services/shiftService";
import {
  exportOrders,
  exportInventory,
  exportCustomers,
  exportShifts,
} from "@/lib/csvExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const OPENING_HOURS = [
  { day: "Ponedeljek", open: "11:00", close: "23:00" },
  { day: "Torek", open: "11:00", close: "23:00" },
  { day: "Sreda", open: "11:00", close: "23:00" },
  { day: "Četrtek", open: "11:00", close: "23:00" },
  { day: "Petek", open: "11:00", close: "00:00" },
  { day: "Sobota", open: "12:00", close: "00:00" },
  { day: "Nedelja", open: "12:00", close: "22:00" },
];

const Settings = () => {
  const navigate = useNavigate();
  const { data: orders } = useFetchOrders();
  const { data: inventory } = useFetchInventoryItems();
  const { data: customers } = useFetchCustomers();
  const { data: shifts } = useFetchShifts();

  const [demoMode, setDemoMode] = useState(
    import.meta.env.VITE_DEMO_SERVER === "true",
  );

  const configSections = [
    {
      icon: Shield,
      title: "FURS davčna blagajna",
      description: "ZOI, EOR, QR kode, poslovni prostor",
      link: "/fiscal",
      color: "text-cyan-600 bg-cyan-100",
    },
    {
      icon: Gift,
      title: "Lojalnost program",
      description: "Točke, nagrade, konfiguracija",
      link: "/loyalty-rewards",
      color: "text-purple-600 bg-purple-100",
    },
    {
      icon: Tag,
      title: "Akcije in promocije",
      description: "Happy hour, časovne akcije",
      link: "/promotions",
      color: "text-pink-600 bg-pink-100",
    },
    {
      icon: MapPin,
      title: "Lokacije",
      description: "Multi-location management",
      link: "/locations",
      color: "text-blue-600 bg-blue-100",
    },
  ];

  const exportSections = [
    {
      label: "Naročila",
      count: orders?.length ?? 0,
      onExport: () => {
        if (!orders?.length) return toast.error("Ni naročil za izvoz");
        exportOrders(orders);
        toast.success(`Izvoženih ${orders.length} naročil`);
      },
    },
    {
      label: "Zaloga",
      count: inventory?.length ?? 0,
      onExport: () => {
        if (!inventory?.length) return toast.error("Ni artiklov za izvoz");
        exportInventory(inventory);
        toast.success(`Izvoženih ${inventory.length} artiklov`);
      },
    },
    {
      label: "Stranke",
      count: customers?.length ?? 0,
      onExport: () => {
        if (!customers?.length) return toast.error("Ni strank za izvoz");
        exportCustomers(customers);
        toast.success(`Izvoženih ${customers.length} strank`);
      },
    },
    {
      label: "Izmene",
      count: shifts?.length ?? 0,
      onExport: () => {
        if (!shifts?.length) return toast.error("Ni izmen za izvoz");
        exportShifts(shifts);
        toast.success(`Izvoženih ${shifts.length} izmen`);
      },
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-secondary" />
          Nastavitve
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Centralizirana konfiguracija sistema
        </p>
      </div>

      {/* Demo mode toggle */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <Label className="cursor-pointer font-medium">Demo način</Label>
              <p className="text-xs text-gray-500">
                Prikaže demo banner in demo račune na prijavni strani
              </p>
            </div>
          </div>
          <Switch
            checked={demoMode}
            onCheckedChange={(v) => {
              setDemoMode(v);
              toast.info(
                v
                  ? "Demo način vklopljen (ponovno zaženi aplikacijo)"
                  : "Demo način izklopljen",
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Opening hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Delovni čas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {OPENING_HOURS.map((entry) => (
              <div
                key={entry.day}
                className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm font-medium text-gray-700">
                  {entry.day}
                </span>
                <span className="text-sm text-gray-500">
                  {entry.open} – {entry.close}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 italic">
            Delovni čas se uporablja za prikaz na javnem meniju in za preverjanje
            razpoložljivosti rezervacij.
          </p>
        </CardContent>
      </Card>

      {/* Tax & currency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Percent className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 font-medium">
                Privzeti DDV
              </p>
              <p className="text-lg font-bold">22%</p>
              <p className="text-xs text-gray-400">
                Stopnje: 22%, 9.5%, 0%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 font-medium">
                Valuta
              </p>
              <p className="text-lg font-bold">EUR (€)</p>
              <p className="text-xs text-gray-400">Slovenija</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration sections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-gray-500" />
            Moduli konfiguracije
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {configSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.title}
                  onClick={() => navigate(section.link)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${section.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{section.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {section.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CSV Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-gray-500" />
            Izvoz podatkov (CSV)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-3">
            Izvozite podatke v CSV format za računovodstvo, analizo ali backup.
            Datoteke so UTF-8 kodirane (združljive z Excel).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {exportSections.map((section) => (
              <button
                key={section.label}
                onClick={section.onExport}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-100 hover:border-secondary hover:bg-secondary/5 transition-all"
              >
                <Download className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">{section.label}</span>
                <span className="text-xs text-gray-400">
                  {section.count} zapisov
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-gray-500" />
            Sistemske informacije
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Verzija:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Backend:</span>
              <span className="font-medium">Cockpit CMS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Frontend:</span>
              <span className="font-medium">Vite + React 18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Realtime:</span>
              <span className="font-medium">socket.io :3003</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">FURS:</span>
              <span className="font-medium">port :3004 (test)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Public API:</span>
              <span className="font-medium">port :3005</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
