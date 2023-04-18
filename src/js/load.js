chrome.storage.local.get('save_content', (items) => {
    let save_contents = items.save_content || '';
    let textarea_value_list = document.querySelectorAll('.contents');
    let len = save_contents.length;
    for (let i = 0; i < len - 1; i++) {
        textarea_value_list[i].value = save_contents[i];
    }
    if (save_contents[len-1] > 0) document.querySelectorAll('[name="cp_tab"]')[save_contents[len-1]-1].checked = true;
});
