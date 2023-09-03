try {
  let downloadBtn = document.getElementById('download');
  if (!downloadBtn) throw new Error("Download button not found");

  downloadBtn.addEventListener('click', (e) => {
    let textareas = document.querySelectorAll('.contents');
    if (!textareas.length) throw new Error("Textareas not found");

    let textFileContent = '';

    textareas.forEach((textarea, index) => {
      let memoNumber = index + 1;
      textFileContent += `/***** [tab: ${memoNumber}] *****/\n${textarea.value}\n\n`;
    });

    const textBlob = new Blob([textFileContent], { type: 'text/plain' });
    e.currentTarget.href = window.URL.createObjectURL(textBlob);
  });

} catch (error) {
  console.error(`An error occurred: ${error.message}`);
}
