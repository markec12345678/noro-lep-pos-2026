import { useEffect, useCallback } from "react";

/**
 * Keyboard shortcuts hook for POS speed operations.
 *
 * Shortcuts:
 *   F1          — Focus search bar
 *   F2          — Show all items (clear category filter)
 *   F3          — Toggle cart sidebar (collapse/expand)
 *   F4          — Focus payment method selector
 *   Enter       — Checkout (when cart has items, on search field = submit)
 *   Escape      — Close any open dialog/modal
 *   Ctrl+K      — Focus search (alternative)
 *   /           — Focus search (alternative, vim-style)
 *
 * Usage:
 *   useKeyboardShortcuts({
 *     onSearchFocus: () => searchInputRef.current?.focus(),
 *     onShowAll: () => setSelectedCategory(null),
 *     onToggleCart: () => setCartCollapsed(c => !c),
 *     onCheckout: () => processCheckout(),
 *     onEscape: () => setSelectionModalMenu(null),
 *   });
 */

export interface KeyboardShortcutHandlers {
  onSearchFocus?: () => void;
  onShowAll?: () => void;
  onToggleCart?: () => void;
  onCheckout?: () => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs (except specific keys)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      // Escape always works
      if (e.key === "Escape") {
        handlers.onEscape?.();
        return;
      }

      // Enter in search field → don't interfere (let form handle it)
      // Enter outside inputs → checkout
      if (e.key === "Enter" && !isInput) {
        e.preventDefault();
        handlers.onCheckout?.();
        return;
      }

      // F-keys work everywhere
      if (e.key === "F1") {
        e.preventDefault();
        handlers.onSearchFocus?.();
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        handlers.onShowAll?.();
        return;
      }

      if (e.key === "F3") {
        e.preventDefault();
        handlers.onToggleCart?.();
        return;
      }

      // Ctrl+K or "/" (when not in input) → focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handlers.onSearchFocus?.();
        return;
      }

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        handlers.onSearchFocus?.();
        return;
      }
    },
    [handlers],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Shortcut definitions for display in the UI.
 */
export const SHORTCUT_HINTS = [
  { keys: "F1", label: "Iskanje" },
  { keys: "F2", label: "Vsi artikli" },
  { keys: "F3", label: "Košarica" },
  { keys: "Enter", label: "Zaključi" },
  { keys: "Esc", label: "Zapri" },
] as const;
