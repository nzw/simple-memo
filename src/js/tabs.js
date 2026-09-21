// Memo tabs: built from storage so they can be added, deleted and reordered.
//
// Storage format (chrome.storage.local):
//   save_content = [memo1, memo2, ..., memoN, selectedTabNumber (1-based string)]
//                  (unchanged since v1.x, so existing memos load as they are)
//   save_ids     = [tabId1, ..., tabIdN]  stable ids so background.js can sync tabs
//                  with other computers even after they are added, deleted or moved
//   sync_status  = { tooLong: [tabId, ...], error }  written by background.js
const MAX_TABS = 20;
const DEFAULT_TABS = 7;

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

try {
  const tabBar = document.querySelector('#tab-bar');
  if (!tabBar) throw new Error("Tab bar not found");

  const tabPanels = document.querySelector('#tab-panels');
  if (!tabPanels) throw new Error("Tab panels not found");

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'tab-add';
  addBtn.textContent = '+';
  tabBar.appendChild(addBtn);

  const syncMsg = document.createElement('p');
  syncMsg.className = 'sync-msg';
  syncMsg.hidden = true;
  tabPanels.after(syncMsg);

  let selected = 0;
  let dragFrom = null;
  let syncStatus = { tooLong: [], error: null };
  let lastInput = 0;

  const tabs = () => [...tabBar.querySelectorAll('.tab')];
  const panels = () => [...tabPanels.querySelectorAll('.cp_tabpanel')];
  const textareas = () => [...tabPanels.querySelectorAll('.contents')];
  const currentId = () => panels()[selected] && panels()[selected].dataset.id;

  const save = () => {
    let saveContents = textareas().map((textarea) => textarea.value);
    saveContents.push(String(selected + 1));
    chrome.storage.local.set({
      'save_content': saveContents,
      'save_ids': panels().map((panel) => panel.dataset.id),
    });
  };

  const syncErrorText = (error) => {
    if (!error) return '';
    // Chrome reports these as "MAX_WRITE_OPERATIONS_PER_MINUTE" or, in newer versions,
    // "Resource::kMaxWriteOperationsPerMinute" / "Resource::kQuotaBytes quota exceeded".
    if (/max_?write_?operations/i.test(error)) return '同期の回数が上限に達しました。しばらくすると再開します。';
    if (/quota/i.test(error)) {
      return '同期できる容量（全タブで約 100KB）を超えています。この PC のメモは残っていますが、ほかの端末には反映されません。';
    }
    return `同期に失敗しました（${error}）`;
  };

  // Sync every tab's number, state and counter with the current DOM order.
  const refresh = () => {
    let tabList = tabs();
    let panelList = panels();
    let values = textareas().map((textarea) => textarea.value);

    tabList.forEach((tab, index) => {
      let active = index === selected;
      let empty = values[index] === '';

      tab.querySelector('.tab-num').textContent = index + 1;
      tab.classList.toggle('active', active);
      tab.classList.toggle('filled', !empty);
      tab.setAttribute('aria-selected', active);

      // A tab can be deleted only after its memo has been cleared.
      let del = tab.querySelector('.tab-del');
      del.hidden = !active || tabList.length <= 1;
      del.classList.toggle('disabled', !empty);
      del.title = empty ? 'タブを削除' : '中身を消すと削除できます';

      panelList[index].classList.toggle('show', active);
      panelList[index].querySelector('.char-right').textContent = `length: ${values[index].length}`;
      panelList[index].querySelector('.sync-warn').hidden = !syncStatus.tooLong.includes(panelList[index].dataset.id);
    });

    syncMsg.textContent = syncErrorText(syncStatus.error);
    syncMsg.hidden = !syncStatus.error;

    addBtn.disabled = tabList.length >= MAX_TABS;
    addBtn.title = addBtn.disabled ? `タブは最大 ${MAX_TABS} 個までです` : `タブを追加（最大 ${MAX_TABS} 個）`;
  };

  const createTab = (id) => {
    let tab = document.createElement('div');
    tab.dataset.id = id;
    tab.className = 'tab';
    tab.setAttribute('role', 'tab');
    tab.tabIndex = 0;
    tab.draggable = true;

    let num = document.createElement('span');
    num.className = 'tab-num';
    let del = document.createElement('span');
    del.className = 'tab-del';
    del.textContent = '×';
    tab.append(num, del);
    tabBar.insertBefore(tab, addBtn);

    let panel = document.createElement('div');
    panel.dataset.id = id;
    panel.className = 'cp_tabpanel';
    let textarea = document.createElement('textarea');
    textarea.className = 'contents';
    // Carry over the zoom / font size already applied to the other tabs.
    let current = tabPanels.querySelector('.contents');
    if (current) textarea.style.cssText = current.style.cssText;
    let length = document.createElement('span');
    length.className = 'char-right';
    let warn = document.createElement('span');
    warn.className = 'sync-warn';
    warn.textContent = 'このタブは長すぎるため、ほかの端末と同期されません（1 タブ約 8KB、日本語で約 2,700 字まで）';
    warn.hidden = true;
    panel.append(textarea, length, warn);
    tabPanels.appendChild(panel);

    textarea.addEventListener('input', () => {
      lastInput = Date.now();
      refresh();
      save();
    });
    return textarea;
  };

  // Show `list` (memo texts) in the order of `ids`, reusing the tabs that already
  // exist so a textarea is never moved (moving it would drop its focus).
  // `keepId` is the tab being typed in: its text is left alone, and it stays even
  // when the incoming data no longer has it (the next save writes it back).
  const render = (list, ids, selectedId, keepId = null) => {
    let texts = new Map(ids.map((id, i) => [id, list[i] || '']));
    let order = [...ids];
    let existing = new Map(panels().map((panel, i) => [panel.dataset.id, { panel, tab: tabs()[i] }]));
    if (keepId && existing.has(keepId) && !texts.has(keepId)) {
      order.splice(Math.min(panels().findIndex((p) => p.dataset.id === keepId), order.length), 0, keepId);
    }

    let focused = document.activeElement;
    order.forEach((id, index) => {
      if (!existing.has(id)) {
        createTab(id);
        existing.set(id, { panel: panels().at(-1), tab: tabs().at(-1) });
      }
      let { panel, tab } = existing.get(id);
      if (tabs()[index] !== tab) tabBar.insertBefore(tab, tabs()[index] || addBtn);
      if (panels()[index] !== panel) tabPanels.insertBefore(panel, panels()[index] || null);

      let textarea = panel.querySelector('.contents');
      if (id !== keepId && texts.has(id) && textarea.value !== texts.get(id)) textarea.value = texts.get(id);
    });
    existing.forEach(({ panel, tab }, id) => {
      if (order.includes(id)) return;
      tab.remove();
      panel.remove();
    });
    if (focused && focused !== document.activeElement && focused.isConnected) focused.focus();

    let index = order.indexOf(selectedId);
    selected = index >= 0 ? index : Math.min(selected, order.length - 1);
    refresh();
  };

  const select = (index) => {
    selected = index;
    refresh();
    save();
  };

  const addTab = () => {
    if (tabs().length >= MAX_TABS) return;
    let textarea = createTab(newId());
    selected = tabs().length - 1;
    refresh();
    save();
    textarea.focus();
  };

  const deleteTab = (index) => {
    let tabList = tabs();
    if (tabList.length <= 1 || textareas()[index].value !== '') return;

    tabList[index].remove();
    panels()[index].remove();
    if (index < selected || selected >= tabList.length - 1) selected -= 1;
    selected = Math.max(selected, 0);
    refresh();
    save();
  };

  // Move the tab at `from` so it lands before the tab currently at `to`
  // (`to` === tab count means "to the end").
  const moveTab = (from, to) => {
    if (to > from) to -= 1;
    if (to === from) return;

    let tabList = tabs();
    let panelList = panels();
    let selectedPanel = panelList[selected];

    let [tab] = tabList.splice(from, 1);
    let [panel] = panelList.splice(from, 1);
    tabList.splice(to, 0, tab);
    panelList.splice(to, 0, panel);
    tabBar.insertBefore(tab, tabList[to + 1] || addBtn);
    tabPanels.insertBefore(panel, panelList[to + 1] || null);

    selected = panelList.indexOf(selectedPanel);
    refresh();
    save();
  };

  addBtn.addEventListener('click', addTab);

  tabBar.addEventListener('click', (e) => {
    let tab = e.target.closest('.tab');
    if (!tab) return;

    let index = tabs().indexOf(tab);
    if (e.target.closest('.tab-del')) {
      deleteTab(index);
    } else if (index !== selected) {
      select(index);
    }
  });

  tabBar.addEventListener('keydown', (e) => {
    let tab = e.target.closest('.tab');
    if (!tab || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    select(tabs().indexOf(tab));
  });

  // Drag a tab onto another tab to move it before / after that tab.
  const clearDropMarks = () => {
    tabs().forEach((tab) => tab.classList.remove('drop-before', 'drop-after'));
  };

  tabBar.addEventListener('dragstart', (e) => {
    let tab = e.target.closest('.tab');
    if (!tab) return;
    dragFrom = tabs().indexOf(tab);
    e.dataTransfer.effectAllowed = 'move';
    tab.classList.add('dragging');
  });

  tabBar.addEventListener('dragover', (e) => {
    let tab = e.target.closest('.tab');
    if (dragFrom === null || !tab) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    let rect = tab.getBoundingClientRect();
    let after = e.clientX > rect.left + rect.width / 2;
    clearDropMarks();
    tab.classList.add(after ? 'drop-after' : 'drop-before');
  });

  tabBar.addEventListener('dragleave', (e) => {
    if (!tabBar.contains(e.relatedTarget)) clearDropMarks();
  });

  tabBar.addEventListener('drop', (e) => {
    let tab = e.target.closest('.tab');
    if (dragFrom === null || !tab) return;
    e.preventDefault();

    let to = tabs().indexOf(tab) + (tab.classList.contains('drop-after') ? 1 : 0);
    moveTab(dragFrom, to);
  });

  tabBar.addEventListener('dragend', () => {
    dragFrom = null;
    clearDropMarks();
    tabs().forEach((tab) => tab.classList.remove('dragging'));
  });

  // Show the default tabs right away, then fill them from storage.
  let defaultIds = Array.from({ length: DEFAULT_TABS }, newId);
  render(defaultIds.map(() => ''), defaultIds, defaultIds[0]);

  chrome.storage.local.get(['save_content', 'save_ids', 'sync_status'], (items) => {
    let saveContents = items.save_content || [];
    let list = saveContents.slice(0, -1);
    let ids = items.save_ids || [];
    let lastItem = Number(saveContents[saveContents.length - 1]);
    if (items.sync_status) syncStatus = items.sync_status;

    if (!list.length) {
      // First run: keep the default tabs and save them, which gives them ids.
      save();
    } else {
      // Memos saved before v1.7.0 have no ids yet.
      let migrate = ids.length !== list.length;
      if (migrate) ids = list.map(() => newId());
      render(list, ids, ids[lastItem > 0 ? lastItem - 1 : 0]);
      if (migrate) save();
    }

    // Ask background.js to pull what other computers wrote since last time.
    chrome.runtime.sendMessage({ type: 'sync' }).catch(() => {});
  });

  // Tabs can change from outside this view: the popup and the side panel may be
  // open at the same time, and background.js brings in other computers' edits.
  // save() writes all tabs at once, so a view that missed those changes would
  // overwrite them on its next keystroke. Apply them all, except in the tab
  // this view is typing in right now (its next save wins anyway).
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    if (changes.sync_status) {
      syncStatus = changes.sync_status.newValue || { tooLong: [], error: null };
      refresh();
    }
    if (!changes.save_content && !changes.save_ids) return;

    chrome.storage.local.get(['save_content', 'save_ids'], (items) => {
      let list = (items.save_content || []).slice(0, -1);
      let ids = items.save_ids || [];
      if (!list.length || ids.length !== list.length) return;

      let typing = document.hasFocus() && Date.now() - lastInput < 5000;
      render(list, ids, currentId(), typing ? currentId() : null);
    });
  });

} catch (error) {
  console.error(`An error occurred: ${error.message}`);
}
