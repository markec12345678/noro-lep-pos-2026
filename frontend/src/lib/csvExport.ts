/**
 * CSV Export Utility
 *
 * Converts arrays of objects to CSV format and triggers browser download.
 * Used for exporting orders, inventory, customers, shifts, etc. for
 * accounting and reporting purposes.
 */

/**
 * Convert an array of objects to a CSV string.
 *
 * @param data Array of objects to export
 * @param columns Array of { key, label } pairs defining which fields to export
 * @returns CSV string with headers
 */
export const toCSV = <T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; label: string }>,
): string => {
  // Header row
  const header = columns.map((c) => escapeCSV(c.label)).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return escapeCSV(JSON.stringify(value));
        return escapeCSV(String(value));
      })
      .join(","),
  );
  return [header, ...rows].join("\n");
};

/**
 * Escape a value for CSV (handle commas, quotes, newlines).
 */
const escapeCSV = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * Trigger a browser download of a CSV file.
 *
 * @param csv The CSV string content
 * @param filename The filename (without .csv extension)
 */
export const downloadCSV = (csv: string, filename: string): void => {
  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to CSV and trigger download — convenience wrapper.
 */
export const exportToCSV = <T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; label: string }>,
  filename: string,
): void => {
  const csv = toCSV(data, columns);
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `${filename}_${date}`);
};

/* ------------------------------------------------------------------ */
/* Predefined export configurations                                    */
/* ------------------------------------------------------------------ */

import { Order, InventoryItem, Customer, Shift, ReservationStatus } from "@/types";

export const exportOrders = (orders: Order[]) => {
  exportToCSV(orders, [
    { key: "_id", label: "ID" },
    { key: "status", label: "Status" },
    { key: "total_amount", label: "Znesek (€)" },
    { key: "tip_amount", label: "Napitnina (€)" },
    { key: "payment_method", label: "Plačilo" },
    { key: "source", label: "Vir" },
    { key: "served_by", label: "Postregel" },
    { key: "refund_amount", label: "Povračilo (€)" },
    { key: "tax_amount", label: "DDV (€)" },
    { key: "_created", label: "Ustvarjeno" },
  ], "narocila");
};

export const exportInventory = (items: InventoryItem[]) => {
  exportToCSV(items, [
    { key: "name", label: "Naziv" },
    { key: "sku", label: "SKU" },
    { key: "unit", label: "Enota" },
    { key: "quantity", label: "Količina" },
    { key: "threshold", label: "Prag" },
    { key: "cost", label: "Cena (€)" },
    { key: "supplier", label: "Dobavitelj" },
  ], "zaloga");
};

export const exportCustomers = (customers: Customer[]) => {
  exportToCSV(customers, [
    { key: "name", label: "Ime" },
    { key: "phone", label: "Telefon" },
    { key: "email", label: "Email" },
    { key: "points", label: "Točke" },
    { key: "lifetimePoints", label: "Skupne točke" },
    { key: "totalSpent", label: "Skupna poraba (€)" },
    { key: "visits", label: "Obiski" },
  ], "stranke");
};

export const exportShifts = (shifts: Shift[]) => {
  exportToCSV(shifts, [
    { key: "staffName", label: "Zaposleni" },
    { key: "role", label: "Vloga" },
    { key: "date", label: "Datum" },
    { key: "scheduledStart", label: "Začetek" },
    { key: "scheduledEnd", label: "Konec" },
    { key: "clockIn", label: "Prijava" },
    { key: "clockOut", label: "Odjava" },
    { key: "hourlyWage", label: "€/uro" },
    { key: "isCompleted", label: "Zaključena" },
  ], "izmene");
};
