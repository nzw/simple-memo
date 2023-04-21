let zoom_in   = document.querySelector('#zoom-in');
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

let zoom_out  = document.querySelector('#zoom-out');
zoom_out.addEventListener('click', () => {
    let textareas    = document.querySelectorAll('.contents');
    let len          = textareas.length;
    let body         = document.body;

    body.style       = 'width: 440px; height: 400px;';
    let textarea_css = 'width: 400px; height: 333px;';
    for (let i = 0; i < len; i++) {
        textareas[i].style = textarea_css;
    }
});

let font_size = document.querySelector('#font-size');
font_size.addEventListener('change', (e) => {
    let textareas = document.querySelectorAll('.contents');
    let len       = textareas.length;
    let body      = document.body;
    let font      = e.target.value;
    let size      = font > 14 ? 1 : 0;

    body.style.width  =  size ? 'width: 780px;' : 'width: 440px;';
    body.style.height =  size ? 'height: 480px;' : 'height: 400px;';
    for (let i = 0; i < len; i++) {
        textareas[i].style.fontSize = `${font}em`;
        if (size) textareas[i].style.width = '760px';
    }
});

let close = document.querySelector('#close');
close.addEventListener('click', (e) => {
  if (/Chrome/i.test(navigator.userAgent)) {
    window.close();
  } else {
    window.open('about:blank', '_self').close();
  }
});
