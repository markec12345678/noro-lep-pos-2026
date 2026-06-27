import { useState, FormEvent, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Lock,
  Unlock,
  History,
  TrendingUp,
  TrendingDown,
  Check,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFetchCashDrawerSessions,
  useFetchOpenCashDrawerSession,
  useOpenCashDrawerSession,
  useCloseCashDrawerSession,
  computeExpectedCash,
} from "@/services/cashDrawerService";
import { useFetchOrders } from "@/services/orderService";
import { CashDrawerSession } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatDateTime = (epoch?: number) => {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CashDrawer = () => {
  const { data: sessions, isLoading } = useFetchCashDrawerSessions();
  const { data: openSessions } = useFetchOpenCashDrawerSession();
  const { data: orders } = useFetchOrders();
  const { mutateAsync: openSession, isPending: isOpening } =
    useOpenCashDrawerSession();
  const { mutateAsync: closeSession, isPending: isClosing } =
    useCloseCashDrawerSession();

  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("200.00");
  const [closingCount, setClosingCount] = useState("0");
  const [closeNotes, setCloseNotes] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const openSessionData = openSessions?.[0] ?? null;

  const expectedCash = useMemo(
    () =>
      computeExpectedCash(
        orders,
        openSessionData,
        openSessionData?.openingFloat ?? 0,
      ),
    [orders, openSessionData],
  );

  const handleOpenSession = async (e: FormEvent) => {
    e.preventDefault();
    const float = parseFloat(openingFloat);
    if (Number.isNaN(float) || float < 0) {
      toast.error("Opening float must be a non-negative number");
      return;
    }
    if (openSessionData) {
      toast.error(
        `A session is already open (started ${formatDateTime(openSessionData.openedAt)}). Close it first.`,
      );
      return;
    }
    try {
      await openSession({
        user: currentUser?.name ?? currentUser?.username ?? "Unknown",
        openingFloat: float,
      });
      toast.success("Cash drawer opened");
      setOpenDialogOpen(false);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleCloseSession = async (e: FormEvent) => {
    e.preventDefault();
    if (!openSessionData) {
      toast.error("No open session to close");
      return;
    }
    const count = parseFloat(closingCount);
    if (Number.isNaN(count) || count < 0) {
      toast.error("Closing count must be a non-negative number");
      return;
    }
    try {
      const result = await closeSession({
        session: openSessionData,
        closingCount: count,
        expectedCash,
        notes: closeNotes.trim() || undefined,
        user: currentUser?.name ?? currentUser?.username ?? "Unknown",
      });
      if (result.isBalanced) {
        toast.success("Drawer closed — perfectly balanced ✓");
      } else if (result.isOver) {
        toast.warning(
          `Drawer closed — OVER by ${formatCurrency(result.difference)}`,
        );
      } else {
        toast.error(
          `Drawer closed — SHORT by ${formatCurrency(Math.abs(result.difference))}`,
        );
      }
      setCloseDialogOpen(false);
      setClosingCount("0");
      setCloseNotes("");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const quickFillExpected = () => {
    setClosingCount(String(expectedCash.toFixed(2)));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cash Drawer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Open / close shift sessions with cash reconciliation
          </p>
        </div>
        <div className="flex gap-2">
          {openSessionData ? (
            <Button
              onClick={() => {
                setClosingCount(String(expectedCash.toFixed(2)));
                setCloseDialogOpen(true);
              }}
              variant="destructive"
              className="gap-2"
            >
              <Lock className="h-4 w-4" />
              Close Session
            </Button>
          ) : (
            <Button onClick={() => setOpenDialogOpen(true)} className="gap-2">
              <Unlock className="h-4 w-4" />
              Open Session
            </Button>
          )}
        </div>
      </div>

      {/* Current session status card */}
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : openSessionData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-green-200 bg-green-50/30 rounded-xl p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Unlock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Session Open</h2>
                <p className="text-sm text-gray-500">
                  Opened {formatDateTime(openSessionData.openedAt)} by{" "}
                  {openSessionData.user}
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Active
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox
              label="Opening float"
              value={formatCurrency(openSessionData.openingFloat)}
            />
            <StatBox
              label="Cash sales (this session)"
              value={formatCurrency(
                expectedCash - (openSessionData.openingFloat ?? 0),
              )}
            />
            <StatBox
              label="Expected in drawer"
              value={formatCurrency(expectedCash)}
              highlight
            />
            <StatBox
              label="Session duration"
              value={formatDuration(openSessionData.openedAt)}
            />
          </div>
        </motion.div>
      ) : (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">No active session</p>
          <p className="text-sm text-gray-400 mt-1">
            Open a new cash drawer session to start tracking sales.
          </p>
        </div>
      )}

      {/* History table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <h2 className="font-medium">Session History</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opened</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Counted</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sessions ?? []).map((s) => {
                  const diff = s.difference ?? 0;
                  const isOpen = s.isOpen;
                  return (
                    <TableRow key={s._id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {formatDateTime(s.openedAt)}
                      </TableCell>
                      <TableCell className="font-medium">{s.user}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDateTime(s.closedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(s.openingFloat)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(s.expectedCash)}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.closingCount != null
                          ? formatCurrency(s.closingCount)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.closingCount != null ? (
                          <span
                            className={
                              Math.abs(diff) < 0.005
                                ? "text-gray-500"
                                : diff > 0
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                            }
                          >
                            {diff > 0 ? "+" : ""}
                            {formatCurrency(diff)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {isOpen ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Open
                          </Badge>
                        ) : Math.abs(diff) < 0.005 ? (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-600 hover:bg-gray-100"
                          >
                            <Check className="h-3 w-3 mr-1" /> Balanced
                          </Badge>
                        ) : diff > 0 ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 hover:bg-green-100"
                          >
                            <TrendingUp className="h-3 w-3 mr-1" /> Over
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-amber-100 text-amber-700 hover:bg-amber-100"
                          >
                            <TrendingDown className="h-3 w-3 mr-1" /> Short
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!sessions || sessions.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No cash drawer sessions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Open session dialog */}
      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-600" />
              Open Cash Drawer Session
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOpenSession} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Cashier:</span>
                <span className="font-medium">
                  {currentUser?.name ?? currentUser?.username ?? "Unknown"}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Opening time:</span>
                <span className="font-medium">
                  {new Date().toLocaleString("en-GB")}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening-float">Opening float (counted cash)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="opening-float"
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="pl-9"
                  autoFocus
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Count the cash currently in the drawer and enter the total.
                This will be the baseline for reconciliation at close.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isOpening}>
                {isOpening ? "Opening..." : "Open Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close session dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" />
              Close Cash Drawer Session
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCloseSession} className="space-y-4">
            {openSessionData && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Opening float:</span>
                  <span className="font-medium">
                    {formatCurrency(openSessionData.openingFloat)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cash sales:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      expectedCash - (openSessionData.openingFloat ?? 0),
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t mt-1">
                  <span className="text-gray-700 font-medium">
                    Expected in drawer:
                  </span>
                  <span className="font-bold text-lg">
                    {formatCurrency(expectedCash)}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="closing-count">
                Counted cash in drawer *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="closing-count"
                  type="number"
                  step="0.01"
                  min="0"
                  value={closingCount}
                  onChange={(e) => setClosingCount(e.target.value)}
                  className="pl-9"
                  autoFocus
                  required
                />
              </div>
              <button
                type="button"
                onClick={quickFillExpected}
                className="text-xs text-secondary hover:underline"
              >
                Quick-fill with expected ({formatCurrency(expectedCash)})
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="close-notes">Notes (optional)</Label>
              <Textarea
                id="close-notes"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Explanation if drawer is over/short..."
                rows={2}
                maxLength={500}
              />
            </div>
            {(() => {
              const count = parseFloat(closingCount) || 0;
              const diff = count - expectedCash;
              if (Number.isNaN(parseFloat(closingCount))) return null;
              if (Math.abs(diff) < 0.005) {
                return (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Drawer balances perfectly.
                  </div>
                );
              }
              if (diff > 0) {
                return (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Drawer is OVER by{" "}
                    {formatCurrency(diff)}.
                  </div>
                );
              }
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Drawer is SHORT by{" "}
                  {formatCurrency(Math.abs(diff))}.
                </div>
              );
            })()}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCloseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isClosing}>
                {isClosing ? "Closing..." : "Confirm Close"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const StatBox = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-lg p-3 ${highlight ? "bg-green-100" : "bg-gray-50"}`}
  >
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p
      className={`text-lg font-bold mt-1 ${highlight ? "text-green-700" : ""}`}
    >
      {value}
    </p>
  </div>
);

const formatDuration = (openedAt?: number) => {
  if (!openedAt) return "—";
  const seconds = Math.floor(Date.now() / 1000) - openedAt;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default CashDrawer;
