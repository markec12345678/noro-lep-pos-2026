import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  Menu,
  MenuModifierSelection,
  ModifierGroup,
  ModifierOption,
} from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/helper";
import { useFetchModifierOptions } from "@/services/modifierService";

interface MenuItemSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu: Menu | null;
  onAddToCart: (payload: {
    quantity: number;
    specialInstruction: string;
    selectedModifiers: MenuModifierSelection[];
    unitPrice: number;
  }) => void | Promise<void>;
}

/**
 * Modal shown in the POS when a waiter taps a menu item.
 *
 * - Shows the menu image, name, base price
 * - Lists each modifier group with its options (radio for single-select,
 *   checkbox for multi-select)
 * - Quantity stepper
 * - Special instructions textarea
 * - "Add to cart" button with computed total (base + modifiers) × qty
 *
 * If the menu has NO modifier groups, the modal is skipped and the item
 * is added directly (handled by the caller).
 */
const MenuItemSelectionModal = ({
  open,
  onOpenChange,
  menu,
  onAddToCart,
}: MenuItemSelectionModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [specialInstruction, setSpecialInstruction] = useState("");
  /**
   * Selection state: a map of groupId -> Set<optionId>
   * Using Set for O(1) add/remove/has.
   */
  const [selections, setSelections] = useState<
    Record<string, Set<string>>
  >({});

  // Reset state whenever a new menu is opened
  useEffect(() => {
    if (open && menu) {
      setQuantity(1);
      setSpecialInstruction("");
      setSelections({});
    }
  }, [open, menu]);

  // Modifier groups attached to this menu (already populated by fetch)
  const groups: ModifierGroup[] = useMemo(() => {
    if (!menu?.modifierGroups) return [];
    return menu.modifierGroups
      .map((g) =>
        g && typeof g === "object" && "_id" in g ? (g as ModifierGroup) : null,
      )
      .filter((g): g is ModifierGroup => Boolean(g && g._id))
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  }, [menu]);

  const hasModifiers = groups.length > 0;

  // Aggregate selected snapshots from all group sections.
  // Each ModifierGroupSection reports its selections upward.
  const [groupSelections, setGroupSelections] = useState<
    Record<string, MenuModifierSelection[]>
  >({});

  const selectedSnapshots: MenuModifierSelection[] = useMemo(
    () => Object.values(groupSelections).flat(),
    [groupSelections],
  );

  const modifierDelta = useMemo(
    () => selectedSnapshots.reduce((sum, s) => sum + (s.price ?? 0), 0),
    [selectedSnapshots],
  );

  const unitPrice = (menu?.price ?? 0) + modifierDelta;
  const lineTotal = unitPrice * quantity;

  // Validation: required groups must have at least one selection
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    for (const group of groups) {
      if (!group.required) continue;
      const selected = groupSelections[group._id!] ?? [];
      if (selected.length < 1) {
        errors.push(`"${group.name}" requires at least one selection`);
      }
      if (
        group.multiSelect &&
        group.maxSelect > 0 &&
        selected.length > group.maxSelect
      ) {
        errors.push(
          `"${group.name}" allows at most ${group.maxSelect} selections`,
        );
      }
    }
    return errors;
  }, [groupSelections, groups]);

  const handleAddToCart = async () => {
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }
    await onAddToCart({
      quantity,
      specialInstruction: specialInstruction.trim(),
      selectedModifiers: selectedSnapshots,
      unitPrice,
    });
    onOpenChange(false);
  };

  if (!menu) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{menu.name}</DialogTitle>
              {menu.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {menu.description}
                </p>
              )}
            </div>
            <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              {menu.image?.path && (
                <img
                  src={getImageUrl(menu.image)}
                  alt={menu.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Modifier groups — each rendered by its own hook-owning component */}
        {hasModifiers && (
          <div className="space-y-5 mt-2">
            {groups.map((group) => (
              <ModifierGroupSection
                key={group._id}
                group={group}
                onSelectionChange={(selected) => {
                  setGroupSelections((prev) => ({
                    ...prev,
                    [group._id!]: selected,
                  }));
                }}
              />
            ))}
          </div>
        )}

        {!hasModifiers && (
          <p className="text-sm text-gray-400 italic">
            No modifiers for this item.
          </p>
        )}

        {/* Special instructions */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Special instructions</label>
          <Textarea
            value={specialInstruction}
            onChange={(e) => setSpecialInstruction(e.target.value)}
            placeholder="e.g. no onions, extra spicy..."
            rows={2}
            maxLength={200}
          />
        </div>

        {/* Quantity + total */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Qty</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              €{unitPrice.toFixed(2)} × {quantity}
            </p>
            <p className="text-lg font-bold">€{lineTotal.toFixed(2)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={validationErrors.length > 0}
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/* ModifierGroupSection — owns its own useFetchModifierOptions hook   */
/* ------------------------------------------------------------------ */

interface ModifierGroupSectionProps {
  group: ModifierGroup;
  onSelectionChange: (selected: MenuModifierSelection[]) => void;
}

/**
 * Renders a single modifier group and its options.
 *
 * This is a separate component so that `useFetchModifierOptions` is called
 * at the top level of a React component (not inside a `.map()` callback),
 * satisfying the Rules of Hooks.
 */
const ModifierGroupSection = ({
  group,
  onSelectionChange,
}: ModifierGroupSectionProps) => {
  const { data: options, isLoading } = useFetchModifierOptions(group._id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // If the group has default options (single-select), pre-select them
  useEffect(() => {
    if (!options || options.length === 0) return;
    const defaults = options.filter((o) => o.default);
    if (defaults.length > 0 && !group.multiSelect) {
      const firstDefault = defaults[0];
      if (firstDefault._id) {
        const newSet = new Set<string>([firstDefault._id]);
        setSelectedIds(newSet);
        emitSelection(newSet, options);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const emitSelection = (set: Set<string>, opts: ModifierOption[]) => {
    const selected: MenuModifierSelection[] = [];
    for (const option of opts) {
      if (option._id && set.has(option._id)) {
        selected.push({
          groupId: group._id ?? "",
          groupName: group.name,
          optionId: option._id,
          optionName: option.name,
          price: option.price ?? 0,
        });
      }
    }
    onSelectionChange(selected);
  };

  const toggleOption = (optionId: string) => {
    const newSet = new Set(selectedIds);
    if (group.multiSelect) {
      if (newSet.has(optionId)) {
        newSet.delete(optionId);
      } else {
        newSet.add(optionId);
      }
    } else {
      newSet.clear();
      newSet.add(optionId);
    }
    setSelectedIds(newSet);
    emitSelection(newSet, options ?? []);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium text-sm">
            {group.name}
            {group.required && <span className="text-red-500 ml-1">*</span>}
          </h4>
          <p className="text-xs text-gray-500">
            {group.multiSelect
              ? `Choose ${group.minSelect > 0 ? `${group.minSelect}-` : ""}${group.maxSelect > 0 ? group.maxSelect : "∞"}`
              : "Choose one"}
          </p>
        </div>
        {group.required && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">
            Required
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(options ?? []).map((option) => {
            const isSelected = selectedIds.has(option._id!);
            return (
              <button
                key={option._id}
                type="button"
                onClick={() => toggleOption(option._id!)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all",
                  isSelected
                    ? "border-secondary bg-secondary/5"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-4 w-4 flex-shrink-0 border",
                      group.multiSelect ? "rounded-sm" : "rounded-full",
                      isSelected
                        ? "bg-secondary border-secondary"
                        : "border-gray-300",
                    )}
                  >
                    {isSelected && (
                      <svg
                        viewBox="0 0 12 12"
                        className="h-full w-full text-white p-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {group.multiSelect ? (
                          <path d="M2 6l3 3 5-6" />
                        ) : (
                          <circle cx="6" cy="6" r="2" fill="currentColor" />
                        )}
                      </svg>
                    )}
                  </span>
                  <span>{option.name}</span>
                </span>
                {option.price > 0 && (
                  <span className="text-xs font-medium text-gray-600">
                    +€{option.price.toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}
          {(!options || options.length === 0) && !isLoading && (
            <p className="text-xs text-gray-400 col-span-2 italic">
              No options defined for this group.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuItemSelectionModal;
