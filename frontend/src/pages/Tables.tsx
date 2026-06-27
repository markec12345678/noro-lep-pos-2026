import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Trash, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useFetchTables,
  useCreateTable,
  useDeleteTable,
} from "@/services/tableService";
import { TableStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Tables = () => {
  const { data: tables, isLoading } = useFetchTables();
  const { mutateAsync: createTable } = useCreateTable();
  const { mutateAsync: deleteTable } = useDeleteTable();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    table_number: "",
    seats: "4",
    location: "Main Hall",
    status: TableStatus.Available,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "occupied":
        return "bg-red-500";
      case "reserved":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.table_number.trim()) {
      toast.error("Table number is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await createTable({
        table_number: form.table_number,
        seats: form.seats,
        location: form.location,
        status: form.status,
        order: null,
      });
      toast.success(`Table ${form.table_number} created`);
      setIsCreateOpen(false);
      setForm({
        table_number: "",
        seats: "4",
        location: "Main Hall",
        status: TableStatus.Available,
      });
    } catch (err) {
      toast.error(
        `Failed to create table: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tableId: string, tableNumber?: string) => {
    try {
      await deleteTable(tableId);
      toast.success(`Table ${tableNumber ?? ""} deleted`);
    } catch (err) {
      toast.error(
        `Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-40 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Tables</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tables?.length ?? 0} tables registered
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg btn-hover"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Add New Table
            </motion.button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="table_number">Table Number *</Label>
                <Input
                  id="table_number"
                  value={form.table_number}
                  onChange={(e) =>
                    setForm({ ...form, table_number: e.target.value })
                  }
                  placeholder="e.g. T1, T2..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seats">Seats</Label>
                  <Input
                    id="seats"
                    type="number"
                    min="1"
                    value={form.seats}
                    onChange={(e) =>
                      setForm({ ...form, seats: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="Main Hall / Terrace / Bar"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Initial Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as TableStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TableStatus.Available}>
                      Available
                    </SelectItem>
                    <SelectItem value={TableStatus.Reserved}>
                      Reserved
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Table"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables &&
          tables.map((table) => (
            <motion.div
              key={table._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <Link to={`/tables/${table._id}`}>
                <div className="border-b border-gray-100 p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-lg">
                      {table.table_number}
                    </h3>
                    <div
                      className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(table.status)}`}
                    >
                      {getStatusText(table.status)}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Seats</span>
                    <span className="font-medium text-gray-900">
                      {table.seats}
                    </span>
                  </div>
                  {table.location && (
                    <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                      <span>Location</span>
                      <span className="font-medium text-gray-900">
                        {table.location}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm">
                      View Details
                    </button>
                    <button
                      className={`p-2 rounded-lg text-white text-sm ${
                        table.status === "available"
                          ? "bg-secondary hover:bg-secondary/90"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      disabled={table.status !== "available"}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </Link>

              {/* Delete action — outside the Link to avoid navigation */}
              <div className="px-4 pb-3 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="text-red-500 hover:text-red-600 text-xs flex items-center gap-1"
                      aria-label="Delete table"
                    >
                      <Trash className="h-3.5 w-3.5" /> Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete table?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete table{" "}
                        <strong>{table.table_number}</strong>. This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          handleDelete(table._id!, table.table_number)
                        }
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}

        {tables && tables.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400">
            <PlusCircle className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg">No tables yet</p>
            <p className="text-sm">Click "Add New Table" to create your first one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tables;
