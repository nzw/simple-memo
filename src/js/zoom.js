let zoom_in  = document.querySelector('#zoom-in');
let zoom_out = document.querySelector('#zoom-out');
zoom_in.addEventListener('click', () => {
    let textareas    = document.querySelectorAll('.contents');
    let len          = textareas.length;
    let body         = document.body;
    let textarea_css = 'width: 760px; height: 460px;';
    body.style       = 'width: 780px; height: 480px;';
    for (let i = 0; i < len; i++) {
        textareas[i].style = textarea_css;
    }
});
zoom_out.addEventListener('click', () => {
    let textareas    = document.querySelectorAll('.contents');
    let len          = textareas.length;
    let body         = document.body;
    let textarea_css = 'width: 400px; height: 333px;';
    body.style       = 'width: 440px; height: 400px;';
    for (let i = 0; i < len; i++) {
        textareas[i].style = textarea_css;
    }
});
