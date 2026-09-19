// Memo tabs: built from storage so they can be added, deleted and reordered.
//
// Storage format (unchanged since v1.x, so existing memos load as they are):
//   save_content = [memo1, memo2, ..., memoN, selectedTabNumber (1-based string)]
const MAX_TABS = 20;
const DEFAULT_TABS = 7;

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

  let selected = 0;
  let dragFrom = null;

  const tabs = () => [...tabBar.querySelectorAll('.tab')];
  const panels = () => [...tabPanels.querySelectorAll('.cp_tabpanel')];
  const textareas = () => [...tabPanels.querySelectorAll('.contents')];

  const save = () => {
    let saveContents = textareas().map((textarea) => textarea.value);
    saveContents.push(String(selected + 1));
    chrome.storage.local.set({ 'save_content': saveContents });
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
    });

    addBtn.disabled = tabList.length >= MAX_TABS;
    addBtn.title = addBtn.disabled ? `タブは最大 ${MAX_TABS} 個までです` : `タブを追加（最大 ${MAX_TABS} 個）`;
  };

  const createTab = () => {
    let tab = document.createElement('div');
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
    panel.className = 'cp_tabpanel';
    let textarea = document.createElement('textarea');
    textarea.className = 'contents';
    // Carry over the zoom / font size already applied to the other tabs.
    let current = tabPanels.querySelector('.contents');
    if (current) textarea.style.cssText = current.style.cssText;
    let length = document.createElement('span');
    length.className = 'char-right';
    panel.append(textarea, length);
    tabPanels.appendChild(panel);

    textarea.addEventListener('input', () => {
      refresh();
      save();
    });
    return textarea;
  };

  const render = (contents, selectedIndex) => {
    let list = contents.length ? contents : new Array(DEFAULT_TABS).fill('');

    while (textareas().length < list.length) createTab();
    while (textareas().length > list.length) {
      tabs().pop().remove();
      panels().pop().remove();
    }

    textareas().forEach((textarea, index) => {
      let value = list[index] || '';
      if (textarea.value !== value) textarea.value = value;
    });

    selected = Math.min(Math.max(selectedIndex, 0), list.length - 1);
    refresh();
  };

  const select = (index) => {
    selected = index;
    refresh();
    save();
  };

  const addTab = () => {
    if (tabs().length >= MAX_TABS) return;
    let textarea = createTab();
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
  render([], 0);

  chrome.storage.local.get('save_content', (items) => {
    let saveContents = items.save_content || [];
    let lastItem = Number(saveContents[saveContents.length - 1]);
    render(saveContents.slice(0, -1), lastItem > 0 ? lastItem - 1 : 0);
  });

  // The popup and the side panel can be open at the same time. save() writes all
  // tabs at once, so a stale view would overwrite the other view's edits on its
  // next change. Refresh the view that is not being used.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.save_content) return;
    if (document.hasFocus()) return;

    render((changes.save_content.newValue || []).slice(0, -1), selected);
  });

} catch (error) {
  console.error(`An error occurred: ${error.message}`);
}
