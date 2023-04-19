let download = document.getElementById('download');
download.addEventListener('click', (e) => {
    let textareas    = document.querySelectorAll('.contents');
    let len          = textareas.length;
    let textfile     = '';
    for (let i = 0; i < len; i++) {
        textfile += `\n=[${i}]============\n\n${textareas[i].value}\n`;
    }
    const blob = new Blob([textfile], { type: 'text/plain' });
    e.currentTarget.href = window.URL.createObjectURL(blob);
});
