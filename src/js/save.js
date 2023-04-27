setTimeout(() => {
    const tab_set   = 'color:skyblue;font-weight: bold;';
    const tab_reset = 'color:black;font-weight: normal;';
    let label_list  = document.querySelectorAll('.cp_tab > label');
    let textarea_value_list = document.querySelectorAll('.contents');
    let len = textarea_value_list.length;
    let save = () => {
        let save_contents = [];
        let select_id = document.querySelector('[name="cp_tab"]:checked')['id'];
        for (let i = 0; i < len; i++) {
            let val = textarea_value_list[i].value;
            label_list[i].style = val ? tab_set : tab_reset;
            save_contents.push(val);
        }
        save_contents.push(select_id.replace('tab1_', ''));
        chrome.storage.local.set({'save_content': save_contents});
    };
    for (let i = 0; i < len; i++) {
        textarea_value_list[i].addEventListener('keyup', save, false);
        textarea_value_list[i].addEventListener('keydown', save, false);
    }
}, 100);
