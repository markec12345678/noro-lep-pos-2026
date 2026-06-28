import { useState, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Search, Edit, Trash, ToggleLeft, ToggleRight, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  useFetchMenus,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
} from "@/services/menuService";
import { useFetchCategories } from "@/services/categoryService";
import { Menu, LinkModelType } from "@/types";
import { getImageUrl } from "@/lib/helper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ModifierManager from "@/components/custom/menu-modifiers/ModifierManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AllergenSelector, AllergenIcons } from "@/components/custom/allergens/AllergenComponents";

interface MenuForm {
  _id?: string;
  name: string;
  description: string;
  price: string;
  categoryId: string;
  available: boolean;
  tax_rate: string;
  allergens: string[];
}

const EMPTY_FORM: MenuForm = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  available: true,
  tax_rate: "22",
  allergens: [],
};

const FoodMenus = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: menus, isLoading } = useFetchMenus();
  const { data: categories } = useFetchCategories();
  const { mutateAsync: createMenu } = useCreateMenu();
  const { mutateAsync: updateMenu } = useUpdateMenu();
  const { mutateAsync: deleteMenu } = useDeleteMenu();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [modifierMenuTarget, setModifierMenuTarget] = useState<Menu | null>(
    null,
  );

  /**
   * Update the set of modifier groups linked to a menu item.
   * Called by the ModifierManager dialog when the user toggles a link
   * or creates a new group (which auto-links).
   */
  const handleUpdateMenuModifiers = async (
    menuId: string,
    modifierGroupIds: string[],
  ) => {
    const links: LinkModelType[] = modifierGroupIds.map((gid) => ({
      _model: "modifiergroup",
      _id: gid,
    }));
    try {
      await updateMenu({
        _id: menuId,
        modifierGroups: links,
      });
      // Refresh local target so the dialog reflects the new state
      setModifierMenuTarget((prev) =>
        prev
          ? {
              ...prev,
              modifierGroups: links,
            }
          : prev,
      );
    } catch (err) {
      toast.error(
        `Failed to update modifiers: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      throw err;
    }
  };

  useEffect(() => {
    if (!dialogOpen) {
      setForm(EMPTY_FORM);
    }
  }, [dialogOpen]);

  const filteredItems = (menus ?? []).filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (menu: Menu) => {
    setForm({
      _id: menu._id,
      name: menu.name,
      description: menu.description ?? "",
      price: String(menu.price ?? ""),
      categoryId: Array.isArray(menu.category) ? menu.category[0]?._id ?? "" : "",
      available: menu.available ?? true,
      tax_rate: String(menu.tax_rate ?? 22),
      allergens: Array.isArray(menu.allergens) ? menu.allergens : [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const price = parseFloat(form.price);
    if (Number.isNaN(price) || price < 0) {
      toast.error("Price must be a positive number");
      return;
    }

    const payload: Partial<Menu> = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      available: form.available,
      tax_rate: parseFloat(form.tax_rate) || 22,
      allergens: form.allergens,
      category: form.categoryId
        ? [{ _model: "category", _id: form.categoryId }]
        : [],
    };

    setIsSubmitting(true);
    try {
      if (form._id) {
        await updateMenu({ ...payload, _id: form._id });
        toast.success(`Updated ${form.name}`);
      } else {
        await createMenu(payload);
        toast.success(`Created ${form.name}`);
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteMenu(deleteTarget._id);
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Food Menus</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredItems.length} items
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg btn-hover"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Item
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-medium">All Menu Items</h2>

          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DDV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <motion.tr
                  key={item?._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {item?.image?.path && (
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        {Array.isArray(item.category) &&
                          item.category[0]?.name && (
                            <div className="text-xs text-gray-500">
                              {item.category[0].name}
                            </div>
                          )}
                        {Array.isArray(item.modifierGroups) &&
                          item.modifierGroups.length > 0 && (
                            <div className="text-xs text-purple-500 flex items-center gap-1 mt-0.5">
                              <SlidersHorizontal className="h-3 w-3" />
                              {item.modifierGroups.length} modifier
                              {item.modifierGroups.length > 1 ? "s" : ""}
                            </div>
                          )}
                        {Array.isArray(item.allergens) &&
                          item.allergens.length > 0 && (
                            <div className="mt-1">
                              <AllergenIcons allergens={item.allergens} />
                            </div>
                          )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {item.description || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      €{(item.price ?? 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {item.tax_rate ?? 22}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.available ? (
                      <span className="inline-flex items-center text-xs text-green-600">
                        <ToggleRight className="h-4 w-4 mr-1" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-gray-400">
                        <ToggleLeft className="h-4 w-4 mr-1" /> No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-secondary hover:text-secondary/80 mr-3"
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setModifierMenuTarget(item)}
                      className="text-purple-500 hover:text-purple-600 mr-3"
                      aria-label="Manage modifiers"
                      title="Manage modifiers"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="text-red-500 hover:text-red-600"
                      aria-label="Delete"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td
                    className="px-6 py-8 text-center text-gray-500"
                    colSpan={6}
                  >
                    {searchQuery
                      ? "No items match your search."
                      : 'No menu items yet. Click "Add New Item" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form._id ? "Edit Menu Item" : "Add New Menu Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Margherita Pizza"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Short description of the dish..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (DDV %)</Label>
                <Select
                  value={form.tax_rate}
                  onValueChange={(v) => setForm({ ...form, tax_rate: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="22">22% (standard)</SelectItem>
                    <SelectItem value="9.5">9.5% (reduced)</SelectItem>
                    <SelectItem value="0">0% (exempt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c._id} value={c._id!}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Allergens */}
            <div className="space-y-2">
              <Label>Alergeni (EU FIC 1169/2011)</Label>
              <AllergenSelector
                selected={form.allergens}
                onChange={(allergens) => setForm({ ...form, allergens })}
              />
              <p className="text-xs text-gray-500">
                Označite vse alergene, ki jih jed vsebuje. Obvezno po
                EU regulaciji (FIC 1169/2011).
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="available" className="cursor-pointer">
                  Available for ordering
                </Label>
                <p className="text-xs text-gray-500">
                  When off, item won&apos;t appear in the POS
                </p>
              </div>
              <Switch
                id="available"
                checked={form.available}
                onCheckedChange={(v) => setForm({ ...form, available: v })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : form._id
                    ? "Update Item"
                    : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete menu item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modifier manager dialog */}
      {modifierMenuTarget && (
        <ModifierManager
          open={modifierMenuTarget !== null}
          onOpenChange={(open) => {
            if (!open) setModifierMenuTarget(null);
          }}
          menu={modifierMenuTarget}
          onMenuUpdated={async (modifierGroupIds) => {
            if (modifierMenuTarget?._id) {
              await handleUpdateMenuModifiers(
                modifierMenuTarget._id,
                modifierGroupIds,
              );
            }
          }}
        />
      )}
    </div>
  );
};

export default FoodMenus;
