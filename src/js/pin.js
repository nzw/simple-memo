try {
  let pinBtn = document.querySelector('#pin');
  if (!pinBtn) throw new Error("Pin button not found");

  let windowId = null;
  chrome.windows.getCurrent((win) => {
    windowId = win.id;
  });

  pinBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (windowId === null) return;

    // sidePanel.open() is only allowed right after a user gesture,
    // so call it synchronously here (no await before it).
    chrome.sidePanel.open({ windowId })
      .then(() => window.close())
      .catch((error) => console.error(`An error occurred: ${error.message}`));
  });

} catch (error) {
  console.error(`An error occurred: ${error.message}`);
}
