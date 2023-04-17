chrome.storage.local.get('save_content', (items) => {
    let save_contents = items.save_content || '';
    let textarea_value_list = document.querySelectorAll('.contents');
    let len = save_contents.length;
    for (let i = 0; i < len; i++) {
        textarea_value_list[i].value = save_contents[i];
    }
});
