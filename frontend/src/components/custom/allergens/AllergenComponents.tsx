import { useState } from "react";
import {
  ALL_ALLERGENS,
  ALLERGEN_INFO,
  Allergen,
  getAllergenInfo,
} from "@/lib/helper";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* AllergenBadge — single allergen pill                               */
/* ------------------------------------------------------------------ */

interface AllergenBadgeProps {
  allergen: Allergen;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export const AllergenBadge = ({
  allergen,
  size = "sm",
  showIcon = true,
}: AllergenBadgeProps) => {
  const info = getAllergenInfo(allergen);
  if (!info) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        info.color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
      )}
      title={info.description}
    >
      {showIcon && <span className="text-xs">{info.icon}</span>}
      {info.label}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* AllergenList — display all allergens for a menu item               */
/* ------------------------------------------------------------------ */

interface AllergenListProps {
  allergens?: string[];
  size?: "sm" | "md";
  emptyText?: string;
}

export const AllergenList = ({
  allergens,
  size = "sm",
  emptyText,
}: AllergenListProps) => {
  if (!allergens || allergens.length === 0) {
    return emptyText ? (
      <span className="text-xs text-gray-400 italic">{emptyText}</span>
    ) : null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {allergens.map((a) => (
        <AllergenBadge key={a} allergen={a as Allergen} size={size} />
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* AllergenSelector — toggle allergens for a menu item (manager)      */
/* ------------------------------------------------------------------ */

interface AllergenSelectorProps {
  selected: string[];
  onChange: (allergens: string[]) => void;
}

export const AllergenSelector = ({
  selected,
  onChange,
}: AllergenSelectorProps) => {
  const toggle = (allergen: Allergen) => {
    if (selected.includes(allergen)) {
      onChange(selected.filter((a) => a !== allergen));
    } else {
      onChange([...selected, allergen]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {ALL_ALLERGENS.map((info) => {
        const isSelected = selected.includes(info.enum);
        return (
          <button
            key={info.enum}
            type="button"
            onClick={() => toggle(info.enum)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left",
              isSelected
                ? cn(info.color, "border-current font-medium")
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
            )}
            title={info.description}
          >
            <span className="text-base">{info.icon}</span>
            <span className="flex-1 truncate">{info.label}</span>
            <span className="text-xs text-gray-400">#{info.number}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* AllergenFilter — guest-facing filter (hide unsafe items)           */
/* ------------------------------------------------------------------ */

interface AllergenFilterProps {
  selected: string[];
  onChange: (allergens: string[]) => void;
}

export const AllergenFilter = ({
  selected,
  onChange,
}: AllergenFilterProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggle = (allergen: Allergen) => {
    if (selected.includes(allergen)) {
      onChange(selected.filter((a) => a !== allergen));
    } else {
      onChange([...selected, allergen]);
    }
  };

  const visibleAllergens = expanded
    ? ALL_ALLERGENS
    : ALL_ALLERGENS.slice(0, 7);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-700">
          Alergeni (skrij jedi, ki jih vsebujejo)
        </p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-orange-600 hover:underline"
          >
            Počisti ({selected.length})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleAllergens.map((info) => {
          const isSelected = selected.includes(info.enum);
          return (
            <button
              key={info.enum}
              type="button"
              onClick={() => toggle(info.enum)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs transition-all",
                isSelected
                  ? cn(info.color, "border-current font-medium")
                  : "border-gray-200 bg-white text-gray-500",
              )}
              title={info.description}
            >
              <span>{info.icon}</span>
              {info.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:underline px-2 py-1"
        >
          {expanded ? "Manj" : "Več..."}
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* AllergenIcons — compact icons for menu cards                       */
/* ------------------------------------------------------------------ */

interface AllergenIconsProps {
  allergens?: string[];
}

export const AllergenIcons = ({ allergens }: AllergenIconsProps) => {
  if (!allergens || allergens.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-0.5 mt-1">
      {allergens.slice(0, 8).map((a) => {
        const info = ALLERGEN_INFO[a as Allergen];
        if (!info) return null;
        return (
          <span key={a} title={info.description} className="text-sm">
            {info.icon}
          </span>
        );
      })}
      {allergens.length > 8 && (
        <span className="text-xs text-gray-400">
          +{allergens.length - 8}
        </span>
      )}
    </div>
  );
};
