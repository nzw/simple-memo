// 3-way merge of memo tabs between this browser (local) and chrome.storage.sync (remote).
//
// Each state is { order: [tabId, ...], texts: { tabId: text } }.
// `base` is what the sync area held after the last merge, so a side "changed" a tab
// when its text differs from base. Without base, a tab added on another computer
// would look like a tab deleted here, and the next merge would delete it.
const mergeMemos = (base, local, remote) => {
  const has = (state, id) => Object.prototype.hasOwnProperty.call(state.texts, id);
  const firstSync = base.order.length === 0 && Object.keys(base.texts).length === 0;

  const ids = [...new Set([...local.order, ...remote.order,
    ...Object.keys(local.texts), ...Object.keys(remote.texts)])]
    .filter((id) => has(local, id) || has(remote, id));

  const texts = {};
  ids.forEach((id) => {
    const inLocal = has(local, id);
    const inRemote = has(remote, id);
    const inBase = has(base, id);
    const localText = local.texts[id];
    const remoteText = remote.texts[id];
    const baseText = base.texts[id];

    if (inLocal && inRemote) {
      // Edited on both sides: the edit made on this computer wins.
      texts[id] = localText !== baseText ? localText : remoteText;
    } else if (inLocal) {
      // Gone from sync: deleted on another computer, unless it is new here
      // or was edited here after that (an edit beats a delete).
      if (!(inBase && localText === baseText)) texts[id] = localText;
    } else if (inRemote) {
      // Gone from this browser: deleted here, unless it is new from another
      // computer or was edited there after that.
      if (!(inBase && remoteText === baseText)) texts[id] = remoteText;
    }
  });

  // The first time this browser syncs, keep another computer's memos and add this
  // browser's own ones, but drop its empty default tabs and exact duplicates.
  if (firstSync && Object.keys(remote.texts).length > 0) {
    const remoteValues = new Set(Object.values(remote.texts));
    Object.keys(texts).forEach((id) => {
      if (has(remote, id)) return;
      if (texts[id] === '' || remoteValues.has(texts[id])) delete texts[id];
    });
  }

  // Tabs were moved here only if the tabs both still have are in a new order;
  // adding or deleting a tab is not a move.
  const sameOrder = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);
  const common = (a, b) => a.filter((id) => b.includes(id));
  const localMoved = !sameOrder(common(local.order, base.order), common(base.order, local.order));
  const primary = localMoved ? local.order : remote.order;
  const secondary = localMoved ? remote.order : local.order;

  const order = [];
  [...primary, ...secondary, ...Object.keys(texts)].forEach((id) => {
    if (has({ texts }, id) && !order.includes(id)) order.push(id);
  });

  return { order, texts };
};

if (typeof module !== 'undefined') module.exports = { mergeMemos };
