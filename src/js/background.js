// Syncs memos between this browser and chrome.storage.sync, so every computer where
// Chrome is signed in to the same Google account (with sync on) sees the same tabs.
//
// Pages only write chrome.storage.local (save_content / save_ids). This worker merges
// that with the sync area, so edits still reach sync after the popup is closed.
//
// Sync area layout: memo_order = [tabId, ...], memo_<tabId> = text (one item per tab,
// because a single item may hold only 8 KB).
importScripts('merge.js');

const ORDER_KEY = 'memo_order';
const TAB_PREFIX = 'memo_';
const ITEM_LIMIT = chrome.storage.sync.QUOTA_BYTES_PER_ITEM || 8192;

// Typing fires a local change on every keystroke, but sync allows only 120 writes a
// minute and 1800 an hour, so wait for a pause before pushing.
const LOCAL_DELAY = 3000;
const REMOTE_DELAY = 500;

const itemBytes = (key, value) => new TextEncoder().encode(key + JSON.stringify(value)).length;
const sameOrder = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);

const readLocal = async () => {
  const items = await chrome.storage.local.get(['save_content', 'save_ids', 'sync_base', 'sync_status']);
  const content = items.save_content || [];
  const ids = items.save_ids || [];
  const texts = {};
  const order = [];
  // Memos without ids have not been migrated by the page yet; it will, and we run
  // again. No memos at all (a new computer) is fine: it takes what sync holds.
  const migrated = content.length === 0 || ids.length === content.length - 1;
  if (migrated) {
    ids.forEach((id, i) => {
      order.push(id);
      texts[id] = content[i] || '';
    });
  }
  return {
    migrated,
    state: { order, texts },
    selected: Number(content[content.length - 1]) || 1,
    base: items.sync_base || { order: [], texts: {} },
    status: items.sync_status || { tooLong: [], error: null },
  };
};

const readRemote = async () => {
  const items = await chrome.storage.sync.get(null);
  const texts = {};
  Object.keys(items).forEach((key) => {
    if (key !== ORDER_KEY && key.startsWith(TAB_PREFIX)) texts[key.slice(TAB_PREFIX.length)] = items[key];
  });
  return { order: (items[ORDER_KEY] || []).filter((id) => id in texts), texts };
};

const merge = async () => {
  const local = await readLocal();
  if (!local.migrated) return;
  const remote = await readRemote();
  const merged = mergeMemos(local.base, local.state, remote);
  if (!merged.order.length) return;

  // Push to sync. A tab over the per-item limit stays on this computer only.
  const toSet = {};
  const tooLong = [];
  merged.order.forEach((id) => {
    const key = TAB_PREFIX + id;
    const text = merged.texts[id];
    if (remote.texts[id] === text) return;
    if (itemBytes(key, text) > ITEM_LIMIT) {
      tooLong.push(id);
    } else {
      toSet[key] = text;
    }
  });
  if (!sameOrder(remote.order, merged.order)) toSet[ORDER_KEY] = merged.order;
  const toRemove = Object.keys(remote.texts).filter((id) => !(id in merged.texts)).map((id) => TAB_PREFIX + id);

  let error = null;
  try {
    if (toRemove.length) await chrome.storage.sync.remove(toRemove);
    if (Object.keys(toSet).length) await chrome.storage.sync.set(toSet);
  } catch (e) {
    error = e.message;
  }

  // Base is what sync really holds now. For a tab that could not be pushed it keeps
  // the old value, so the next merge still treats this computer's text as the edit
  // and never replaces it with the old one.
  const base = await readRemote();

  const updates = { sync_base: base };
  const status = { tooLong: tooLong.filter((id) => id in merged.texts), error };
  if (JSON.stringify(status) !== JSON.stringify(local.status)) updates.sync_status = status;

  const localChanged = !sameOrder(merged.order, local.state.order)
    || merged.order.some((id) => merged.texts[id] !== local.state.texts[id]);
  if (localChanged) {
    // Keep the same memo selected even if tabs moved.
    const selectedId = local.state.order[local.selected - 1];
    const selected = Math.max(merged.order.indexOf(selectedId), 0) + 1;
    updates.save_content = [...merged.order.map((id) => merged.texts[id]), String(selected)];
    updates.save_ids = merged.order;
  }
  await chrome.storage.local.set(updates);
};

// Run merges one at a time; a merge reads, then writes, both areas.
let running = Promise.resolve();
let timer = null;
const schedule = (delay) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    running = running.then(merge).catch((e) => console.error(`Sync failed: ${e.message}`));
  }, delay);
};

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && (changes.save_content || changes.save_ids)) schedule(LOCAL_DELAY);
  if (areaName === 'sync') schedule(REMOTE_DELAY);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'sync') schedule(0);
});

chrome.runtime.onStartup.addListener(() => schedule(0));
chrome.runtime.onInstalled.addListener(() => schedule(0));
