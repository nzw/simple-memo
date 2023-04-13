chrome.storage.local.get('save_content', (items) => {
    document.getElementById('contents').value = items.save_content || '';
});
