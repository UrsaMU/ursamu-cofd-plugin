// Pure functions over CofdSheet.equipment. No I/O, no SDK.
//
// Items carry a stable uuid (item.id) so /equip and /remove survive reordering.
// Removing an equipped item nulls its slot in the same operation.

import type { CofdSheet, EquipmentState, InventoryItem } from "../stats/sheet.ts";
import {
  type ArmorEntry,
  isArmorType,
  isWeaponType,
  lookupItem,
  type WeaponEntry,
} from "./catalog.ts";

function emptyState(): EquipmentState {
  return { items: [], equippedWeapon: null, equippedArmor: null };
}

function getState(sheet: CofdSheet): EquipmentState {
  return sheet.equipment ?? emptyState();
}

/** Add a catalog-known item to the inventory. Returns a new sheet. */
export function addItem(sheet: CofdSheet, key: string, note?: string): {
  sheet: CofdSheet;
  item?: InventoryItem;
  error?: string;
} {
  const k = key.toLowerCase().trim();
  if (!lookupItem(k)) return { sheet, error: `Unknown item '${key}'.` };

  const state = getState(sheet);
  const item: InventoryItem = {
    id: crypto.randomUUID(),
    key: k,
    ...(note ? { note } : {}),
  };
  const next: EquipmentState = { ...state, items: [...state.items, item] };
  return { sheet: { ...sheet, equipment: next }, item };
}

/**
 * Remove inventory item at 1-based index. Nulls the matching equipped slot if
 * present. Returns the updated sheet and the removed item (or an error).
 */
export function removeItemAt(sheet: CofdSheet, oneBasedIndex: number): {
  sheet: CofdSheet;
  removed?: InventoryItem;
  error?: string;
} {
  const state = getState(sheet);
  const idx = oneBasedIndex - 1;
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.items.length) {
    return { sheet, error: `No inventory slot ${oneBasedIndex}.` };
  }
  const removed = state.items[idx];
  const items = state.items.filter((_, i) => i !== idx);
  const equippedWeapon = state.equippedWeapon === removed.id ? null : state.equippedWeapon;
  const equippedArmor = state.equippedArmor === removed.id ? null : state.equippedArmor;
  const next: EquipmentState = { items, equippedWeapon, equippedArmor };
  return { sheet: { ...sheet, equipment: next }, removed };
}

/** Equip the item at the given 1-based index into its natural slot. */
export function equipAt(sheet: CofdSheet, oneBasedIndex: number): {
  sheet: CofdSheet;
  item?: InventoryItem;
  slot?: "weapon" | "armor";
  error?: string;
} {
  const state = getState(sheet);
  const idx = oneBasedIndex - 1;
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.items.length) {
    return { sheet, error: `No inventory slot ${oneBasedIndex}.` };
  }
  const item = state.items[idx];
  const resolved = lookupItem(item.key);
  if (!resolved) {
    return { sheet, error: `Item '${item.key}' is no longer in the catalog.` };
  }
  if (isWeaponType(resolved.type)) {
    const next: EquipmentState = { ...state, equippedWeapon: item.id };
    return { sheet: { ...sheet, equipment: next }, item, slot: "weapon" };
  }
  if (isArmorType(resolved.type)) {
    const next: EquipmentState = { ...state, equippedArmor: item.id };
    return { sheet: { ...sheet, equipment: next }, item, slot: "armor" };
  }
  return { sheet, error: `'${resolved.entry.name}' is not a weapon or armor.` };
}

/** Unequip a slot. */
export function unequipSlot(sheet: CofdSheet, slot: "weapon" | "armor"): CofdSheet {
  const state = getState(sheet);
  if (slot === "weapon") {
    return { ...sheet, equipment: { ...state, equippedWeapon: null } };
  }
  return { ...sheet, equipment: { ...state, equippedArmor: null } };
}

/** Resolve the equipped weapon entry for the sheet, or null if none. */
export function equippedWeapon(sheet: CofdSheet): WeaponEntry | null {
  const state = sheet.equipment;
  if (!state?.equippedWeapon) return null;
  const item = state.items.find((i) => i.id === state.equippedWeapon);
  if (!item) return null;
  const resolved = lookupItem(item.key);
  if (!resolved || !isWeaponType(resolved.type)) return null;
  return resolved.entry as WeaponEntry;
}

/** Resolve the equipped armor entry for the sheet, or null if none. */
export function equippedArmor(sheet: CofdSheet): ArmorEntry | null {
  const state = sheet.equipment;
  if (!state?.equippedArmor) return null;
  const item = state.items.find((i) => i.id === state.equippedArmor);
  if (!item) return null;
  const resolved = lookupItem(item.key);
  if (!resolved || !isArmorType(resolved.type)) return null;
  return resolved.entry as ArmorEntry;
}
