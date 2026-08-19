import type { LucideIcon } from "lucide-react";
import { Coffee, Landmark, MapPin, Mountain, Trees, Utensils } from "lucide-react";

export type CategoryArt = {
  from: string;
  to: string;
  icon: LucideIcon;
  label: string;
};

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

export function categoryArt(category: string | null | undefined): CategoryArt {
  const value = (category ?? "").toLowerCase();
  if (includesAny(value, ["cafe", "coffee", "tea"])) {
    return {
      from: "from-amber-400",
      to: "to-orange-500",
      icon: Coffee,
      label: "Cafe",
    };
  }
  if (includesAny(value, ["park", "garden", "forest"])) {
    return {
      from: "from-emerald-400",
      to: "to-teal-600",
      icon: Trees,
      label: "Park",
    };
  }
  if (includesAny(value, ["view", "viewpoint", "lookout", "peak", "hill"])) {
    return {
      from: "from-sky-400",
      to: "to-indigo-500",
      icon: Mountain,
      label: "Viewpoint",
    };
  }
  if (includesAny(value, ["restaurant", "food", "eatery"])) {
    return {
      from: "from-rose-400",
      to: "to-orange-500",
      icon: Utensils,
      label: "Food",
    };
  }
  if (includesAny(value, ["museum", "temple", "church", "heritage", "monument"])) {
    return {
      from: "from-stone-400",
      to: "to-neutral-600",
      icon: Landmark,
      label: "Place",
    };
  }
  return {
    from: "from-teal-400",
    to: "to-emerald-700",
    icon: MapPin,
    label: "Place",
  };
}

export function matchesCategoryChip(category: string, chip: string): boolean {
  if (chip === "all") {
    return true;
  }
  const value = category.toLowerCase();
  if (chip === "cafe") {
    return includesAny(value, ["cafe", "coffee", "tea"]);
  }
  if (chip === "park") {
    return includesAny(value, ["park", "garden", "forest"]);
  }
  if (chip === "viewpoint") {
    return includesAny(value, ["view", "viewpoint", "lookout", "peak", "hill"]);
  }
  if (chip === "more") {
    return (
      !matchesCategoryChip(category, "cafe") &&
      !matchesCategoryChip(category, "park") &&
      !matchesCategoryChip(category, "viewpoint")
    );
  }
  return true;
}
