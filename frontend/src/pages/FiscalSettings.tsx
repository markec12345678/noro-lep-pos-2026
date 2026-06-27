import { useState, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Save,
  Building2,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchFiscalConfig,
  useUpdateFiscalConfig,
} from "@/services/fiscalService";
import { FiscalConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfigForm {
  _id?: string;
  taxNumber: string;
  businessUnit: string;
  electronicDevice: string;
  lastInvoiceNumber: string;
  controlSeq: string;
  testMode: boolean;
  restaurantName: string;
  restaurantAddress: string;
  operatorTaxNumber: string;
}

const EMPTY_FORM: ConfigForm = {
  taxNumber: "",
  businessUnit: "",
  electronicDevice: "",
  lastInvoiceNumber: "0",
  controlSeq: "1",
  testMode: true,
  restaurantName: "",
  restaurantAddress: "",
  operatorTaxNumber: "",
};

const FiscalSettings = () => {
  const { data: configs, isLoading } = useFetchFiscalConfig();
  const { mutateAsync: updateConfig, isPending } = useUpdateFiscalConfig();
  const [form, setForm] = useState<ConfigForm>(EMPTY_FORM);
  const [serviceStatus, setServiceStatus] = useState<{
    checked: boolean;
    healthy: boolean;
    mode: string;
    hasCert: boolean;
  } | null>(null);

  useEffect(() => {
    if (configs && configs.length > 0) {
      const c = configs[0];
      setForm({
        _id: c._id,
        taxNumber: c.taxNumber ?? "",
        businessUnit: c.businessUnit ?? "",
        electronicDevice: c.electronicDevice ?? "",
        lastInvoiceNumber: String(c.lastInvoiceNumber ?? 0),
        controlSeq: String(c.controlSeq ?? 1),
        testMode: c.testMode ?? true,
        restaurantName: c.restaurantName ?? "",
        restaurantAddress: c.restaurantAddress ?? "",
        operatorTaxNumber: c.operatorTaxNumber ?? "",
      });
    }
  }, [configs]);

  const checkServiceHealth = async () => {
    try {
      const response = await fetch(
        "/api/furs/health?XTransformPort=3004",
      );
      if (!response.ok) throw new Error("Service unreachable");
      const data = await response.json();
      setServiceStatus({
        checked: true,
        healthy: true,
        mode: data.mode,
        hasCert: data.hasCert,
      });
      toast.success(
        `FURS service online (mode: ${data.mode}, cert: ${data.hasCert ? "yes" : "no"})`,
      );
    } catch (err) {
      setServiceStatus({
        checked: true,
        healthy: false,
        mode: "?",
        hasCert: false,
      });
      toast.error(
        `FURS service offline: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.taxNumber.length !== 8 || !/^\d{8}$/.test(form.taxNumber)) {
      toast.error("Tax number must be exactly 8 digits");
      return;
    }
    if (!form.businessUnit.trim() || !form.electronicDevice.trim()) {
      toast.error("Business unit and electronic device IDs are required");
      return;
    }

    const payload: Partial<FiscalConfig> = {
      taxNumber: form.taxNumber,
      businessUnit: form.businessUnit.trim().toUpperCase(),
      electronicDevice: form.electronicDevice.trim().toUpperCase(),
      lastInvoiceNumber: parseInt(form.lastInvoiceNumber, 10) || 0,
      controlSeq: parseInt(form.controlSeq, 10) || 1,
      testMode: form.testMode,
      restaurantName: form.restaurantName.trim(),
      restaurantAddress: form.restaurantAddress.trim(),
      operatorTaxNumber: form.operatorTaxNumber.trim() || undefined,
    };

    try {
      await updateConfig(form._id ? { ...payload, _id: form._id } : payload);
      toast.success("Fiscal configuration saved");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const config = configs?.[0];
  const isConfigured = Boolean(config?._id);

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-6 w-6 text-secondary" />
          FURS Davčna Blagajna
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Slovenian fiscal cash register configuration (ZOI + EOR + QR)
        </p>
      </div>

      {/* Service status card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              FURS Service Status
            </span>
            {serviceStatus?.checked && (
              <span
                className={`flex items-center gap-1.5 text-sm px-2 py-1 rounded-full ${
                  serviceStatus.healthy
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {serviceStatus.healthy ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                {serviceStatus.healthy ? "Online" : "Offline"}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase">Mode</p>
              <p className="font-medium mt-1">
                {serviceStatus?.mode ?? "Not checked"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Cert loaded</p>
              <p className="font-medium mt-1">
                {serviceStatus?.hasCert ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Endpoint</p>
              <p className="font-medium mt-1 font-mono text-xs">
                port 3004 /api/furs
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={checkServiceHealth}
            className="mt-4"
          >
            <WifiOff className="h-4 w-4 mr-1" />
            Test connection
          </Button>
        </CardContent>
      </Card>

      {/* Configuration form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">First-time setup required</p>
                <p className="text-xs mt-1">
                  Before issuing fiscal invoices, you must register your
                  business premise and electronic device with FURS via the
                  eDavki portal. See docs/FURS_SETUP.md for details.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Restaurant info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Restaurant Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Restaurant name</Label>
                  <Input
                    id="restaurantName"
                    value={form.restaurantName}
                    onChange={(e) =>
                      setForm({ ...form, restaurantName: e.target.value })
                    }
                    placeholder="e.g. Noro Lep Restaurant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantAddress">Address</Label>
                  <Input
                    id="restaurantAddress"
                    value={form.restaurantAddress}
                    onChange={(e) =>
                      setForm({ ...form, restaurantAddress: e.target.value })
                    }
                    placeholder="e.g. Slovenska cesta 1, 1000 Ljubljana"
                  />
                </div>
              </div>
            </div>

            {/* FURS identifiers */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                FURS Identifiers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">
                    Tax number (davčna številka) *
                  </Label>
                  <Input
                    id="taxNumber"
                    value={form.taxNumber}
                    onChange={(e) =>
                      setForm({ ...form, taxNumber: e.target.value })
                    }
                    placeholder="12345678"
                    maxLength={8}
                    pattern="\d{8}"
                    required
                  />
                  <p className="text-xs text-gray-500">8 digits, no spaces</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessUnit">Business premise ID *</Label>
                  <Input
                    id="businessUnit"
                    value={form.businessUnit}
                    onChange={(e) =>
                      setForm({ ...form, businessUnit: e.target.value })
                    }
                    placeholder="PRE"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    FURS-issued, e.g. "PRE"
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electronicDevice">
                    Electronic device ID *
                  </Label>
                  <Input
                    id="electronicDevice"
                    value={form.electronicDevice}
                    onChange={(e) =>
                      setForm({ ...form, electronicDevice: e.target.value })
                    }
                    placeholder="PRE1"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    FURS-issued, e.g. "PRE1"
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operatorTaxNumber">
                    Operator tax number (optional)
                  </Label>
                  <Input
                    id="operatorTaxNumber"
                    value={form.operatorTaxNumber}
                    onChange={(e) =>
                      setForm({ ...form, operatorTaxNumber: e.target.value })
                    }
                    placeholder="12345678"
                    maxLength={8}
                    pattern="\d{8}"
                  />
                </div>
              </div>
            </div>

            {/* Sequence + mode */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Invoice Sequence & Mode
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastInvoiceNumber">
                    Last invoice number
                  </Label>
                  <Input
                    id="lastInvoiceNumber"
                    type="number"
                    min="0"
                    value={form.lastInvoiceNumber}
                    onChange={(e) =>
                      setForm({ ...form, lastInvoiceNumber: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Next invoice will be this + 1
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="controlSeq">Control sequence</Label>
                  <Input
                    id="controlSeq"
                    type="number"
                    min="1"
                    value={form.controlSeq}
                    onChange={(e) =>
                      setForm({ ...form, controlSeq: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Usually 1 (standard algorithm)
                  </p>
                </div>
              </div>

              <label className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <span className="text-sm font-medium">Test mode</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    When ON, the FURS service returns mock EORs without
                    contacting FURS. Turn OFF for production use (requires
                    TLS cert configured on the service).
                  </p>
                </div>
                <Switch
                  checked={form.testMode}
                  onCheckedChange={(v) => setForm({ ...form, testMode: v })}
                />
              </label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="p-4 text-sm text-gray-700">
          <p className="font-medium flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-blue-600" />
            How FURS integration works
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li>
              At checkout, the POS calls the FURS service to compute the ZOI
              (26-char protective mark) and generate a QR code.
            </li>
            <li>
              The service submits the invoice to FURS via SOAP/XML with TLS
              client authentication and receives the EOR (36-char unique ID).
            </li>
            <li>
              The receipt is printed with ZOI, EOR, and QR code as required
              by Slovenian law (ZDavPR).
            </li>
            <li>
              If FURS is unreachable, the invoice is stored with
              status="pending" and must be resubmitted within 48 hours.
            </li>
            <li>
              All invoices are stored in the <code>fiscalinvoice</code>{" "}
              collection as an audit trail for FURS inspection.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default FiscalSettings;
