let textarea = document.getElementById('contents');
let save = () => {
    let contents = textarea.value;
    chrome.storage.local.set({'save_content': contents});
};
textarea.addEventListener('keyup', save, false);
textarea.addEventListener('keydown', save, false);
