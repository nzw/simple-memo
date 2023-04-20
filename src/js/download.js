let download = document.getElementById('download');
download.addEventListener('click', (e) => {
    let textareas    = document.querySelectorAll('.contents');
    let len          = textareas.length;
    let textfile     = '';
    for (let i = 0; i < len; i++) {
        let memo_no = i + 1;
        textfile += `/***** [tab: ${memo_no}] *****/\n${textareas[i].value}\n\n`;
    }
    const blob = new Blob([textfile], { type: 'text/plain' });
    e.currentTarget.href = window.URL.createObjectURL(blob);
});
