import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash,
  Edit,
  Save,
  X,
  Link2,
  Link2Off,
} from "lucide-react";
import { toast } from "sonner";
import { Menu, ModifierGroup, ModifierOption, LinkModelType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useFetchModifierGroups,
  useCreateModifierGroup,
  useUpdateModifierGroup,
  useDeleteModifierGroup,
  useFetchModifierOptions,
  useCreateModifierOption,
  useUpdateModifierOption,
  useDeleteModifierOption,
} from "@/services/modifierService";

interface ModifierManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu: Menu | null;
  onMenuUpdated: (modifierGroupIds: string[]) => Promise<void>;
}

/**
 * Full modifier management dialog for a single menu item.
 *
 * Three concerns in one dialog:
 *   1. Link / unlink existing modifier groups to this menu
 *   2. Create new modifier groups (which auto-link to this menu)
 *   3. Edit / delete options within each group (expandable rows)
 *
 * The dialog reads all groups via useFetchModifierGroups and shows a
 * checkbox-style link toggle for each. The "linked" state is derived
 * from `menu.modifierGroups` (passed in from the parent).
 */
const ModifierManager = ({
  open,
  onOpenChange,
  menu,
  onMenuUpdated,
}: ModifierManagerProps) => {
  const { data: allGroups, isLoading } = useFetchModifierGroups();
  const { mutateAsync: createGroup } = useCreateModifierGroup();
  const { mutateAsync: deleteGroup } = useDeleteModifierGroup();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // The set of group IDs currently linked to this menu
  const linkedIds = new Set<string>(
    (menu?.modifierGroups ?? [])
      .map((g) =>
        g && typeof g === "object" && "_id" in g ? (g as ModifierGroup)._id : undefined,
      )
      .filter((id): id is string => Boolean(id)),
  );

  const handleToggleLink = async (groupId: string) => {
    if (!menu?._id) return;
    const next = new Set(linkedIds);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    try {
      await onMenuUpdated(Array.from(next));
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleDeleteGroup = async (groupId: string, name: string) => {
    if (
      !window.confirm(
        `Delete group "${name}"? This will remove it from ALL menus that use it.`,
      )
    ) {
      return;
    }
    try {
      await deleteGroup(groupId);
      toast.success(`Deleted group "${name}"`);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Modifiers — <span className="text-gray-500">{menu?.name}</span>
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Link modifier groups (sizes, toppings, spice level...) to this
            menu item. Waiters will be prompted to pick options when adding
            the item to a cart.
          </p>
        </DialogHeader>

        {/* Create new group toggle */}
        <div className="flex items-center justify-between border-t pt-4">
          <h3 className="font-medium text-sm">All Modifier Groups</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateForm((s) => !s)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Group
          </Button>
        </div>

        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <CreateGroupForm
                menuId={menu?._id}
                onCreated={async (newGroupId) => {
                  setShowCreateForm(false);
                  // Auto-link the new group to this menu
                  const next = new Set(linkedIds);
                  next.add(newGroupId);
                  try {
                    await onMenuUpdated(Array.from(next));
                  } catch (err) {
                    console.error(err);
                  }
                }}
                createGroup={createGroup}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* List of all groups */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : (allGroups ?? []).length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg">
              <p className="text-sm">No modifier groups yet.</p>
              <p className="text-xs mt-1">
                Click &quot;New Group&quot; to create your first one (e.g.
                &quot;Size&quot; or &quot;Toppings&quot;).
              </p>
            </div>
          ) : (
            (allGroups ?? []).map((group) => {
              const isLinked = linkedIds.has(group._id!);
              const isExpanded = expandedGroupId === group._id;
              return (
                <div
                  key={group._id}
                  className={cn(
                    "border rounded-lg transition-colors",
                    isLinked ? "border-secondary bg-secondary/5" : "border-gray-200",
                  )}
                >
                  <div className="flex items-center gap-3 p-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedGroupId(isExpanded ? null : group._id!)
                      }
                      className="text-gray-400 hover:text-gray-600"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{group.name}</div>
                      <div className="text-xs text-gray-500">
                        {group.multiSelect ? "Multi-select" : "Single-select"}
                        {group.required && " · Required"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleLink(group._id!)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        isLinked
                          ? "bg-secondary text-white hover:bg-secondary/90"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      )}
                    >
                      {isLinked ? (
                        <>
                          <Link2Off className="h-3.5 w-3.5" /> Unlink
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3.5 w-3.5" /> Link
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group._id!, group.name)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
                      aria-label="Delete group"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-gray-100"
                      >
                        <OptionsEditor groupId={group._id!} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/* Create Group Form (inline)                                         */
/* ------------------------------------------------------------------ */

interface CreateGroupFormProps {
  menuId?: string;
  onCreated: (newGroupId: string) => void | Promise<void>;
  createGroup: ReturnType<typeof useCreateModifierGroup>["mutateAsync"];
}

const CreateGroupForm = ({
  onCreated,
  createGroup,
}: CreateGroupFormProps) => {
  const [name, setName] = useState("");
  const [required, setRequired] = useState(false);
  const [multiSelect, setMultiSelect] = useState(false);
  const [minSelect, setMinSelect] = useState(0);
  const [maxSelect, setMaxSelect] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createGroup({
        name: name.trim(),
        required,
        multiSelect,
        minSelect: multiSelect ? minSelect : 0,
        maxSelect: multiSelect ? maxSelect : 0,
        sort: 0,
      });
      toast.success(`Created group "${name}"`);
      setName("");
      setRequired(false);
      setMultiSelect(false);
      setMinSelect(0);
      setMaxSelect(0);
      await onCreated(created._id!);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-200 rounded-lg p-4 mb-2 space-y-3 bg-gray-50"
    >
      <div className="space-y-2">
        <Label htmlFor="group-name">Group Name *</Label>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. "Size", "Toppings", "Spice Level"'
          required
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={required} onCheckedChange={setRequired} />
          Required
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={multiSelect}
            onCheckedChange={(v) => {
              setMultiSelect(v);
              if (!v) {
                setMinSelect(0);
                setMaxSelect(0);
              }
            }}
          />
          Multi-select
        </label>
      </div>
      {multiSelect && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="min-select" className="text-xs">
              Min selections
            </Label>
            <Input
              id="min-select"
              type="number"
              min={0}
              value={minSelect}
              onChange={(e) => setMinSelect(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max-select" className="text-xs">
              Max selections (0 = unlimited)
            </Label>
            <Input
              id="max-select"
              type="number"
              min={0}
              value={maxSelect}
              onChange={(e) => setMaxSelect(Number(e.target.value))}
            />
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Group"}
        </Button>
      </div>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/* Options Editor (per group)                                         */
/* ------------------------------------------------------------------ */

interface OptionsEditorProps {
  groupId: string;
}

const OptionsEditor = ({ groupId }: OptionsEditorProps) => {
  const { data: options, isLoading } = useFetchModifierOptions(groupId);
  const { mutateAsync: createOption } = useCreateModifierOption();
  const { mutateAsync: updateOption } = useUpdateModifierOption();
  const { mutateAsync: deleteOption } = useDeleteModifierOption();

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("0");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("0");

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Option name is required");
      return;
    }
    setIsAdding(true);
    try {
      await createOption({
        name: newName.trim(),
        price: parseFloat(newPrice) || 0,
        default: false,
        sort: (options?.length ?? 0) + 1,
        group: { _model: "modifiergroup", _id: groupId } as LinkModelType,
      });
      setNewName("");
      setNewPrice("0");
      toast.success("Option added");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (option: ModifierOption) => {
    setEditingId(option._id!);
    setEditName(option.name);
    setEditPrice(String(option.price));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateOption({
        _id: editingId,
        name: editName.trim(),
        price: parseFloat(editPrice) || 0,
      });
      setEditingId(null);
      toast.success("Option updated");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleDelete = async (option: ModifierOption) => {
    if (!window.confirm(`Delete option "${option.name}"?`)) return;
    try {
      await deleteOption(option._id!);
      toast.success("Option deleted");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  if (isLoading) {
    return <Skeleton className="h-20 w-full m-3" />;
  }

  return (
    <div className="p-3 space-y-2">
      {/* Existing options */}
      {(options ?? []).length === 0 ? (
        <p className="text-xs text-gray-400 italic px-2 py-3">
          No options yet. Add some below.
        </p>
      ) : (
        (options ?? []).map((option) => (
          <div
            key={option._id}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-md"
          >
            {editingId === option._id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 flex-1"
                  autoFocus
                />
                <Input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="h-8 w-20"
                />
                <button
                  type="button"
                  onClick={saveEdit}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                  aria-label="Save"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm">{option.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  +€{(option.price ?? 0).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(option)}
                  className="p-1.5 text-gray-400 hover:text-secondary rounded"
                  aria-label="Edit"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(option)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  aria-label="Delete"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ))
      )}

      {/* Add new option form */}
      <form
        onSubmit={handleAdd}
        className="flex items-center gap-2 pt-2 border-t border-gray-100"
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Option name (e.g. Extra Cheese)"
          className="h-8 flex-1"
        />
        <Input
          type="number"
          step="0.01"
          min="0"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          className="h-8 w-20"
          aria-label="Price"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={isAdding}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </form>
    </div>
  );
};

export default ModifierManager;
