chrome.storage.local.get('save_content', (items) => {
    const tab_set   = 'color:skyblue;font-weight: bold;';
    const tab_reset = 'color:black;font-weight: normal;';
    let label_list  = document.querySelectorAll('.cp_tab > label');
    let save_contents = items.save_content || '';
    let textarea_value_list = document.querySelectorAll('.contents');
    let len = save_contents.length;
    for (let i = 0; i < len - 1; i++) {
        let val = save_contents[i];
        label_list[i].style = val ? tab_set : tab_reset;
        textarea_value_list[i].value = val;
        document.getElementById('inputlength'+(i+1)).innerHTML = "word count: " + val.length;
    }
    if (save_contents[len-1] > 0) document.querySelectorAll('[name="cp_tab"]')[save_contents[len-1]-1].checked = true;
});
