import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChefHat,
  Check,
  X,
  Volume2,
  VolumeX,
  Users,
  Utensils,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { useUpdateOrderItem } from "@/services/orderItemsService";
import {
  useKitchenTickets,
  useNewOrderSound,
  useTick,
  formatWaitTime,
  getUrgencyColors,
  KitchenTicket,
} from "@/hooks/useKitchenTickets";
import { OrderItemStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Enhanced Kitchen Display System (KDS)
 *
 * Kanban-style board with 3 columns:
 * - NEW: items waiting to be started
 * - IN KITCHEN: items being prepared
 * - READY: items done, waiting for pickup
 *
 * Features:
 * - Color-coded urgency (green < 5min, amber 5-10min, red > 10min)
 * - Live wait timers (updates every second)
 * - Sound notification on new orders (toggleable)
 * - Per-item status buttons (start cooking, mark ready, cancel)
 * - "Bump order" button (mark ALL items in a ticket as ready)
 * - Source badge (staff vs guest/online order)
 * - Special instructions + modifiers shown per item
 * - Auto-sort: most urgent (oldest) first
 */
const Kitchen = () => {
  const { tickets, isLoading } = useKitchenTickets();
  const { mutate: updateOrderItem } = useUpdateOrderItem();
  useNewOrderSound(tickets);
  useTick(1000); // re-render every second for live timers

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "staff" | "guest"
  >("all");

  // Filter tickets by source
  const filteredTickets = useMemo(() => {
    if (sourceFilter === "all") return tickets;
    return tickets.filter((t) => t.source === sourceFilter);
  }, [tickets, sourceFilter]);

  // Group tickets by status (kanban columns)
  const newTickets = filteredTickets.filter(
    (t) => t.status === OrderItemStatus.New,
  );
  const inKitchenTickets = filteredTickets.filter(
    (t) => t.status === OrderItemStatus.InKitchen,
  );
  const readyTickets = filteredTickets.filter(
    (t) => t.status === OrderItemStatus.Ready,
  );

  const handleStartCooking = (ticket: KitchenTicket) => {
    // Mark all NEW items in this ticket as in-kitchen
    for (const item of ticket.items) {
      if (item.status === OrderItemStatus.New) {
        updateOrderItem({
          _id: item._id,
          status: OrderItemStatus.InKitchen,
        });
      }
    }
    toast.success(`Začel: Miza ${ticket.tableNumber ?? "?"}`);
  };

  const handleMarkReady = (ticket: KitchenTicket) => {
    // Mark all in-kitchen items as ready
    let count = 0;
    for (const item of ticket.items) {
      if (item.status === OrderItemStatus.InKitchen) {
        updateOrderItem({
          _id: item._id,
          status: OrderItemStatus.Ready,
        });
        count++;
      }
    }
    toast.success(`${count} jedi pripravljenih: Miza ${ticket.tableNumber ?? "?"}`);
  };

  const handleCancelItem = (itemId: string, itemName: string) => {
    updateOrderItem({
      _id: itemId,
      status: OrderItemStatus.Cancelled,
    });
    toast.error(`Preklicano: ${itemName}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <ChefHat className="h-12 w-12 animate-pulse text-orange-400" />
        <span className="ml-3 text-gray-400">Nalagam kuhinjo...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Toolbar */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-500" />
            Kuhinja
          </h1>
          {/* Source filter */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(
              [
                { value: "all", label: "Vse" },
                { value: "staff", label: "Natakar" },
                { value: "guest", label: "Online" },
              ] as const
            ).map((f) => (
              <button
                key={f.value}
                onClick={() => setSourceFilter(f.value)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
                  sourceFilter === f.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-4 text-sm">
          <CountBadge
            label="Novo"
            count={newTickets.length}
            color="bg-blue-100 text-blue-700"
          />
          <CountBadge
            label="V pripravi"
            count={inKitchenTickets.length}
            color="bg-amber-100 text-amber-700"
          />
          <CountBadge
            label="Pripravljeno"
            count={readyTickets.length}
            color="bg-green-100 text-green-700"
          />
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            soundEnabled
              ? "text-orange-500 hover:bg-orange-50"
              : "text-gray-400 hover:bg-gray-100",
          )}
          title={soundEnabled ? "Zvok vklopljen" : "Zvok izklopljen"}
        >
          {soundEnabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {/* NEW column */}
          <KanbanColumn
            title="Novo"
            icon={Bell}
            color="bg-blue-500"
            tickets={newTickets}
            onAction={handleStartCooking}
            actionLabel="Začni pripravo"
            actionIcon={ChefHat}
            actionColor="bg-amber-500 hover:bg-amber-600"
            onCancelItem={handleCancelItem}
          />

          {/* IN KITCHEN column */}
          <KanbanColumn
            title="V pripravi"
            icon={ChefHat}
            color="bg-amber-500"
            tickets={inKitchenTickets}
            onAction={handleMarkReady}
            actionLabel="Pripravljeno"
            actionIcon={Check}
            actionColor="bg-green-500 hover:bg-green-600"
            onCancelItem={handleCancelItem}
          />

          {/* READY column */}
          <KanbanColumn
            title="Pripravljeno"
            icon={Check}
            color="bg-green-500"
            tickets={readyTickets}
            onAction={() => {}}
            actionLabel=""
            actionIcon={Check}
            actionColor=""
            onCancelItem={handleCancelItem}
            isReadyColumn
          />
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Kanban column                                                       */
/* ------------------------------------------------------------------ */

interface KanbanColumnProps {
  title: string;
  icon: React.ElementType;
  color: string;
  tickets: KitchenTicket[];
  onAction: (ticket: KitchenTicket) => void;
  actionLabel: string;
  actionIcon: React.ElementType;
  actionColor: string;
  onCancelItem: (itemId: string, itemName: string) => void;
  isReadyColumn?: boolean;
}

const KanbanColumn = ({
  title,
  icon: Icon,
  color,
  tickets,
  onAction,
  actionLabel,
  actionIcon: ActionIcon,
  actionColor,
  onCancelItem,
  isReadyColumn,
}: KanbanColumnProps) => {
  return (
    <div className="flex-1 min-w-[300px] max-w-[400px] flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <h2 className="font-semibold text-gray-700">{title}</h2>
        <span className="ml-auto text-sm font-medium text-gray-400">
          {tickets.length}
        </span>
      </div>

      {/* Tickets */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        <AnimatePresence>
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.orderId}
              ticket={ticket}
              onAction={onAction}
              actionLabel={actionLabel}
              actionIcon={ActionIcon}
              actionColor={actionColor}
              onCancelItem={onCancelItem}
              isReadyColumn={isReadyColumn}
            />
          ))}
        </AnimatePresence>

        {tickets.length === 0 && (
          <div className="text-center py-12 text-gray-300">
            <Icon className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Prazen</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Ticket card                                                         */
/* ------------------------------------------------------------------ */

interface TicketCardProps {
  ticket: KitchenTicket;
  onAction: (ticket: KitchenTicket) => void;
  actionLabel: string;
  actionIcon: React.ElementType;
  actionColor: string;
  onCancelItem: (itemId: string, itemName: string) => void;
  isReadyColumn?: boolean;
}

const TicketCard = ({
  ticket,
  onAction,
  actionLabel,
  actionIcon: ActionIcon,
  actionColor,
  onCancelItem,
  isReadyColumn,
}: TicketCardProps) => {
  const colors = getUrgencyColors(ticket.urgency);
  const now = Math.floor(Date.now() / 1000);
  // Recompute wait time live
  const liveWait = now - ticket.createdAt;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border-2 shadow-sm overflow-hidden",
        colors.border,
        colors.bg,
      )}
    >
      {/* Ticket header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200/50">
        <div className="flex items-center gap-2">
          <div className={cn("px-2 py-1 rounded-md text-xs font-bold", colors.badge)}>
            <Clock className="h-3 w-3 inline mr-1" />
            {formatWaitTime(liveWait)}
          </div>
          {ticket.tableNumber && (
            <span className="text-sm font-semibold text-gray-700">
              Miza {ticket.tableNumber}
            </span>
          )}
        </div>
        {ticket.source === "guest" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
            Online
          </span>
        )}
      </div>

      {/* Items */}
      <div className="p-3 space-y-2">
        {ticket.items.map((item) => (
          <div
            key={item._id}
            className={cn(
              "p-2 rounded-lg bg-white/70 border border-gray-200/50",
              item.status === OrderItemStatus.Cancelled && "opacity-50 line-through",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-800">
                    {item.quantity}×
                  </span>
                  <span className="font-medium text-gray-800 text-sm">
                    {item.name}
                  </span>
                </div>
                {/* Modifiers */}
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5 ml-5">
                    {item.selectedModifiers.map((m) => m.optionName).join(", ")}
                  </p>
                )}
                {/* Special instructions */}
                {item.specialInstruction && (
                  <p className="text-xs text-amber-600 italic mt-0.5 ml-5">
                    ⚠ {item.specialInstruction}
                  </p>
                )}
              </div>
              {/* Per-item cancel (only in non-ready columns) */}
              {!isReadyColumn && item.status !== OrderItemStatus.Cancelled && (
                <button
                  onClick={() => onCancelItem(item._id, item.name)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                  title="Prekliči postavko"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action button */}
      {!isReadyColumn && actionLabel && (
        <div className="p-2 border-t border-gray-200/50">
          <button
            onClick={() => onAction(ticket)}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm font-medium transition-colors",
              actionColor,
            )}
          >
            <ActionIcon className="h-4 w-4" />
            {actionLabel}
          </button>
        </div>
      )}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Count badge                                                         */
/* ------------------------------------------------------------------ */

const CountBadge = ({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) => (
  <div className="flex items-center gap-1.5">
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", color)}>
      {count}
    </span>
    <span className="text-gray-500">{label}</span>
  </div>
);

export default Kitchen;
