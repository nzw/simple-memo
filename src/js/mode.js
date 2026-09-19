// The side panel opens popup.html?mode=panel (see manifest side_panel.default_path).
// Mark it before first paint so the panel layout applies without flicker.
if (new URLSearchParams(location.search).get('mode') === 'panel') {
  document.documentElement.classList.add('panel');
}
