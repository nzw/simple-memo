setTimeout(() => {
    let textarea_value_list = document.querySelectorAll('.contents');
    let len = textarea_value_list.length;
    let save = () => {
        let save_contents = [];
        for (let i = 0; i < len; i++) {
            save_contents.push(textarea_value_list[i].value);
        }
        chrome.storage.local.set({'save_content': save_contents});
    };
    for (let i = 0; i < len; i++) {
        textarea_value_list[i].addEventListener('keyup', save, false);
        textarea_value_list[i].addEventListener('keydown', save, false);
    }
}, 100);
