try {
  let zoomIn = document.querySelector('#zoom-in');
  if (!zoomIn) throw new Error("Zoom-in button not found");

  zoomIn.addEventListener('click', () => {
    let textareas = document.querySelectorAll('.contents');
    if (!textareas.length) throw new Error("Textareas not found");

    let body = document.body;
    let textareaStyle = 'width: 760px; height: 460px;';
    body.style = 'width: 780px; height: 480px;';

    textareas.forEach((textarea) => {
      textarea.style = textareaStyle;
    });
  });

  let zoomOut = document.querySelector('#zoom-out');
  if (!zoomOut) throw new Error("Zoom-out button not found");

  zoomOut.addEventListener('click', () => {
    let textareas = document.querySelectorAll('.contents');
    if (!textareas.length) throw new Error("Textareas not found");

    let body = document.body;
    let textareaStyle = 'width: 400px; height: 333px;';
    body.style = 'width: 440px; height: 400px;';

    textareas.forEach((textarea) => {
      textarea.style = textareaStyle;
    });
  });

  let fontSize = document.querySelector('#font-size');
  if (!fontSize) throw new Error("Font-size control not found");

  fontSize.addEventListener('change', (e) => {
    let textareas = document.querySelectorAll('.contents');
    if (!textareas.length) throw new Error("Textareas not found");

    let body = document.body;
    let font = e.target.value;
    let sizeCondition = font > 14 ? 1 : 0;

    body.style.width = sizeCondition ? '780px' : '440px';
    body.style.height = sizeCondition ? '480px' : '400px';

    textareas.forEach((textarea) => {
      textarea.style.fontSize = `${font}em`;
      if (sizeCondition) textarea.style.width = '760px';
    });
  });

  let closeBtn = document.querySelector('#close');
  if (!closeBtn) throw new Error("Close button not found");

  closeBtn.addEventListener('click', () => {
    if (/Chrome/i.test(navigator.userAgent)) {
      window.close();
    } else {
      window.open('about:blank', '_self').close();
    }
  });

} catch (error) {
  console.error(`An error occurred: ${error.message}`);
}
