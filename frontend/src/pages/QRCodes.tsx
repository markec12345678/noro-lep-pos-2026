import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer,
  RefreshCw,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchTables,
  useUpdateTable,
} from "@/services/tableService";
import { Table } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Manager page for generating and printing QR codes for each table.
 *
 * Each table can have a "public token" (UUID) that enables guest
 * ordering via QR code. When the QR code is scanned, it opens
 * /public/menu/:publicToken in the browser, where the guest can
 * browse the menu and place an order.
 *
 * Features:
 *   - Generate / regenerate public token for any table
 *   - Print QR codes (one per page, optimized for table tents)
 *   - Copy public URL to clipboard
 *   - Open the public menu in a new tab for testing
 *   - Bulk: generate tokens for all tables at once
 */

const PUBLIC_BASE_URL =
  (typeof window !== "undefined" ? window.location.origin : "") +
  "/public/menu/";

const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const QRCodes = () => {
  const { data: tables, isLoading } = useFetchTables();
  const { mutateAsync: updateTable, isPending } = useUpdateTable();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleGenerateToken = async (table: Table) => {
    const token = generateUUID();
    try {
      await updateTable({
        _id: table._id,
        publicToken: token,
      });
      toast.success(
        `QR koda generirana za mizo ${table.table_number ?? "?"}`,
      );
    } catch (err) {
      toast.error(
        `Napaka: ${err instanceof Error ? err.message : "Neznana"}`,
      );
    }
  };

  const handleBulkGenerate = async () => {
    if (!tables) return;
    setBulkLoading(true);
    let count = 0;
    for (const table of tables) {
      if (!table.publicToken) {
        try {
          await updateTable({
            _id: table._id,
            publicToken: generateUUID(),
          });
          count++;
        } catch (err) {
          console.error(`Failed for table ${table._id}:`, err);
        }
      }
    }
    setBulkLoading(false);
    toast.success(
      count > 0
        ? `Generiranih ${count} novih QR kod`
        : "Vse mize že imajo QR kodo",
    );
  };

  const handleCopyUrl = async (table: Table) => {
    if (!table.publicToken) return;
    const url = `${PUBLIC_BASE_URL}${table.publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(table._id!);
      toast.success("URL kopiran");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Kopiranje ni uspelo");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenPublic = (table: Table) => {
    if (!table.publicToken) return;
    window.open(
      `${PUBLIC_BASE_URL}${table.publicToken}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const tablesWithToken = (tables ?? []).filter((t) => t.publicToken);
  const tablesWithoutToken = (tables ?? []).filter((t) => !t.publicToken);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <QrCode className="h-6 w-6 text-secondary" />
            QR kode za mize
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gostje skenirajo QR kodo in naročijo preko telefona
          </p>
        </div>
        <div className="flex gap-2">
          {tablesWithoutToken.length > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkGenerate}
              disabled={bulkLoading}
              className="gap-2"
            >
              {bulkLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Generiraj vse ({tablesWithoutToken.length})
            </Button>
          )}
          {tablesWithToken.length > 0 && (
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Natisni vse ({tablesWithToken.length})
            </Button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 no-print">
        <p className="font-medium mb-1">Kako deluje?</p>
        <ol className="list-decimal pl-5 space-y-0.5 text-xs">
          <li>Generiraj QR kodo za vsako mizo (gumb "Generiraj")</li>
          <li>Natisni QR kode in jih postavi na mize</li>
          <li>Gost skenira QR kodo z telefonom in odpre meni</li>
          <li>Gost izbere jedi in odda naročilo</li>
          <li>Naročilo se samodejno prikaže v kuhinji (Kitchen Display)</li>
          <li>Gost vidi status naročila v realnem času</li>
        </ol>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 no-print">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {tablesWithToken.length}
            </p>
            <p className="text-xs text-gray-500">z aktivno QR kodo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {tablesWithoutToken.length}
            </p>
            <p className="text-xs text-gray-500">brez QR kode</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {tables?.length ?? 0}
            </p>
            <p className="text-xs text-gray-500">skupno miz</p>
          </CardContent>
        </Card>
      </div>

      {/* QR code cards */}
      <div
        ref={printRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-2"
      >
        {(tables ?? []).map((table) => (
          <QRCodeCard
            key={table._id}
            table={table}
            onGenerate={() => handleGenerateToken(table)}
            onCopy={() => handleCopyUrl(table)}
            onOpen={() => handleOpenPublic(table)}
            copied={copiedId === table._id}
            isPending={isPending}
          />
        ))}
        {(!tables || tables.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Ni najdenih miz.</p>
            <p className="text-sm">
              Najprej ustvarite mize na strani Tables.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* QR code card                                                        */
/* ------------------------------------------------------------------ */

interface QRCodeCardProps {
  table: Table;
  onGenerate: () => void;
  onCopy: () => void;
  onOpen: () => void;
  copied: boolean;
  isPending: boolean;
}

const QRCodeCard = ({
  table,
  onGenerate,
  onCopy,
  onOpen,
  copied,
  isPending,
}: QRCodeCardProps) => {
  const publicUrl = table.publicToken
    ? `${PUBLIC_BASE_URL}${table.publicToken}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden print:break-inside-avoid print:border-2 print:shadow-none"
    >
      {/* Print header — only visible when printing */}
      <div className="hidden print:block text-center pt-4 pb-2">
        <h2 className="text-xl font-bold">Noro Lep POS</h2>
        <p className="text-sm text-gray-600">Skeniraj za naročilo</p>
      </div>

      {/* QR code area */}
      <div className="flex flex-col items-center p-6 print:p-4">
        {table.publicToken ? (
          <div className="bg-white p-3 border border-gray-100 rounded-lg">
            <QRCodeSVG
              value={publicUrl!}
              size={180}
              level="M"
              includeMargin={false}
            />
          </div>
        ) : (
          <div className="w-[204px] h-[204px] flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center text-gray-400">
              <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Brez QR kode</p>
            </div>
          </div>
        )}

        {/* Table info */}
        <div className="mt-3 text-center">
          <p className="font-bold text-lg print:text-xl">
            Miza {table.table_number ?? "?"}
          </p>
          {table.location && (
            <p className="text-xs text-gray-500">{table.location}</p>
          )}
        </div>
      </div>

      {/* Actions — hidden when printing */}
      <div className="border-t border-gray-100 p-3 flex items-center gap-2 no-print">
        {!table.publicToken ? (
          <Button
            size="sm"
            onClick={onGenerate}
            disabled={isPending}
            className="flex-1 gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Generiraj
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onCopy}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Kopiraj
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpen}
              className="gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Odpri
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onGenerate}
              disabled={isPending}
              className="gap-1.5"
              title="Ponovno generiraj"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default QRCodes;
