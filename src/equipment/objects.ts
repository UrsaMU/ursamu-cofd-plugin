// Equipment items as real UrsaMU game objects.
//
// Each carried item is a Thing created via u.db.create(). It lives in the
// owner's contents (location = ownerId), is visible via look, can be dropped
// into a room, and can be handed between players.
//
// When equipped the item is flagged "dark" (hidden from look) and its
// state.cofd_item.equippedBy is set to prevent casual drop/give.
// Unequipping removes the dark flag and clears equippedBy.
//
// Sheet still carries equippedWeapon/equippedArmor as IDBObj id pointers
// for O(1) lookup without querying the whole contents list.

import type { IUrsamuSDK, IDBObj } from "@ursamu/ursamu";
import {
  isArmorType,
  isWeaponType,
  lookupItem,
  type WeaponEntry,
  type ArmorEntry,
} from "./catalog.ts";

// -------------------------------------------------------------------
// Per-instance data stored on the object's state field
// -------------------------------------------------------------------

export interface CofdItemData {
  /** Catalog reference key, e.g. "pistol-light". */
  key: string;
  /** Remaining bullets (firearms only). */
  currentClip?: number;
  /** Optional flavour name override. */
  customLabel?: string;
  /** Free-text note. */
  note?: string;
  /** Set to the wielder's id when equipped; null when in inventory. */
  equippedBy?: string;
}

/** Return true when the game object is a CoFD item. */
export function isCofdItem(obj: IDBObj): boolean {
  return !!(obj.state?.cofd_item as CofdItemData | undefined)?.key;
}

export function itemData(obj: IDBObj): CofdItemData | null {
  const d = obj.state?.cofd_item as CofdItemData | undefined;
  return d?.key ? d : null;
}

export function displayName(obj: IDBObj): string {
  const d = itemData(obj);
  if (!d) return obj.name ?? "unknown";
  return d.customLabel ?? lookupItem(d.key)?.entry.name ?? d.key;
}

// -------------------------------------------------------------------
// Lifecycle
// -------------------------------------------------------------------

/**
 * Create a new item as a real game object in the owner's contents.
 * Firearms have their clip filled from the catalog.
 */
export async function createItem(
  u: IUrsamuSDK,
  ownerId: string,
  key: string,
  opts: { note?: string; customLabel?: string } = {},
): Promise<IDBObj | null> {
  const resolved = lookupItem(key);
  if (!resolved) return null;

  const entry = resolved.entry;
  const clip = (entry as { clip?: number }).clip;

  const data: CofdItemData = {
    key,
    ...(typeof clip === "number" ? { currentClip: clip } : {}),
    ...(opts.note ? { note: opts.note } : {}),
    ...(opts.customLabel ? { customLabel: opts.customLabel } : {}),
  };

  const obj = await u.db.create({
    name: opts.customLabel ?? entry.name,
    flags: new Set(["thing"]),
    location: ownerId,
    state: { cofd_item: data },
    contents: [],
  });

  return obj;
}

/**
 * Destroy the item permanently (e.g. consumed, disintegrated).
 */
export async function destroyItem(u: IUrsamuSDK, id: string): Promise<void> {
  await u.db.destroy(id);
}

// -------------------------------------------------------------------
// Inventory queries
// -------------------------------------------------------------------

/** All CoFD items the owner currently carries (inventory + equipped). */
export async function carriedItems(
  u: IUrsamuSDK,
  ownerId: string,
): Promise<IDBObj[]> {
  const contents = await u.db.search({ location: ownerId });
  return contents.filter(isCofdItem);
}

/** Items in inventory (not equipped -- equippedBy is unset). */
export async function inventoryItems(
  u: IUrsamuSDK,
  ownerId: string,
): Promise<IDBObj[]> {
  const all = await carriedItems(u, ownerId);
  return all.filter((o) => !(itemData(o)?.equippedBy));
}

/** Items dropped in a room. */
export async function roomItems(
  u: IUrsamuSDK,
  roomId: string,
): Promise<IDBObj[]> {
  const contents = await u.db.search({ location: roomId });
  return contents.filter(isCofdItem);
}

// -------------------------------------------------------------------
// Equip / unequip
// -------------------------------------------------------------------

export interface EquipResult {
  equippedId: string;
  slot: "weapon" | "armor";
  error?: undefined;
}
export interface EquipError {
  error: string;
  equippedId?: undefined;
  slot?: undefined;
}

/**
 * Equip the item at the given 1-based inventory index.
 * - Moves any previously-equipped item in the same slot back to inventory.
 * - Sets "dark" flag on the newly equipped item.
 * - Stamps equippedBy on the item state.
 * Returns the item id and slot, or an error.
 */
export async function equipItem(
  u: IUrsamuSDK,
  ownerId: string,
  oneBasedIndex: number,
  currentEquippedWeapon: string | null,
  currentEquippedArmor: string | null,
): Promise<EquipResult | EquipError> {
  const inv = await inventoryItems(u, ownerId);
  const idx = oneBasedIndex - 1;
  if (idx < 0 || idx >= inv.length) {
    return { error: `No inventory slot ${oneBasedIndex}.` };
  }
  const item = inv[idx];
  const d = itemData(item)!;
  const resolved = lookupItem(d.key);
  if (!resolved) return { error: `Item '${d.key}' missing from catalog.` };

  if (isWeaponType(resolved.type)) {
    if (currentEquippedWeapon) await unequipById(u, currentEquippedWeapon);
    await applyEquipped(u, item.id, ownerId);
    return { equippedId: item.id, slot: "weapon" };
  }
  if (isArmorType(resolved.type)) {
    if (currentEquippedArmor) await unequipById(u, currentEquippedArmor);
    await applyEquipped(u, item.id, ownerId);
    return { equippedId: item.id, slot: "armor" };
  }
  return { error: `'${resolved.entry.name}' is not a weapon or armor.` };
}

async function applyEquipped(
  u: IUrsamuSDK,
  itemId: string,
  ownerId: string,
): Promise<void> {
  await u.setFlags(itemId, "dark");
  const item = (await u.db.search({ id: itemId } as any))[0];
  if (!item) return;
  const d: CofdItemData = { ...(itemData(item) ?? { key: "" }), equippedBy: ownerId };
  await u.db.modify(itemId, "$set", { "data.cofd_item": d });
}

async function unequipById(u: IUrsamuSDK, itemId: string): Promise<void> {
  await u.setFlags(itemId, "!dark");
  const item = (await u.db.search({ id: itemId } as any))[0];
  if (!item) return;
  const d: CofdItemData = { ...(itemData(item) ?? { key: "" }) };
  delete d.equippedBy;
  await u.db.modify(itemId, "$set", { "data.cofd_item": d });
}

/** Unequip the given slot id. Removes dark flag and equippedBy. */
export async function unequipItem(u: IUrsamuSDK, itemId: string): Promise<void> {
  await unequipById(u, itemId);
}

// -------------------------------------------------------------------
// Ammo
// -------------------------------------------------------------------

/**
 * Decrement a firearm's clip by `shots`.
 * Returns new clip count, or null if not a firearm or out of ammo.
 */
export async function fireShots(
  u: IUrsamuSDK,
  itemId: string,
  shots: number,
): Promise<number | null> {
  const items = await u.db.search({ id: itemId } as any);
  const item = items[0];
  if (!item) return null;
  const d = itemData(item);
  if (!d || typeof d.currentClip !== "number") return null;
  if (d.currentClip < shots) return null;
  const next = d.currentClip - shots;
  await u.db.modify(itemId, "$set", { "data.cofd_item": { ...d, currentClip: next } });
  return next;
}

/** Refill a firearm's clip from the catalog. */
export async function reloadItem(u: IUrsamuSDK, itemId: string): Promise<boolean> {
  const items = await u.db.search({ id: itemId } as any);
  const item = items[0];
  if (!item) return false;
  const d = itemData(item);
  if (!d) return false;
  const resolved = lookupItem(d.key);
  if (!resolved || !isWeaponType(resolved.type)) return false;
  const clip = (resolved.entry as { clip?: number }).clip;
  if (typeof clip !== "number") return false;
  await u.db.modify(itemId, "$set", { "data.cofd_item": { ...d, currentClip: clip } });
  return true;
}

// -------------------------------------------------------------------
// Helpers for commands
// -------------------------------------------------------------------

/** Resolve the catalog entry for an equipped weapon + the item object, or null. */
export async function equippedWeaponEntry(
  u: IUrsamuSDK,
  equippedWeaponId: string | null,
): Promise<{ obj: IDBObj; entry: WeaponEntry; data: CofdItemData } | null> {
  if (!equippedWeaponId) return null;
  const items = await u.db.search({ id: equippedWeaponId } as any);
  const obj = items[0];
  if (!obj) return null;
  const d = itemData(obj);
  if (!d) return null;
  const resolved = lookupItem(d.key);
  if (!resolved || !isWeaponType(resolved.type)) return null;
  return { obj, entry: resolved.entry as WeaponEntry, data: d };
}

/** Resolve the catalog entry for equipped armor + the item object, or null. */
export async function equippedArmorEntry(
  u: IUrsamuSDK,
  equippedArmorId: string | null,
): Promise<{ obj: IDBObj; entry: ArmorEntry; data: CofdItemData } | null> {
  if (!equippedArmorId) return null;
  const items = await u.db.search({ id: equippedArmorId } as any);
  const obj = items[0];
  if (!obj) return null;
  const d = itemData(obj);
  if (!d) return null;
  const resolved = lookupItem(d.key);
  if (!resolved || !isArmorType(resolved.type)) return null;
  return { obj, entry: resolved.entry as ArmorEntry, data: d };
}
