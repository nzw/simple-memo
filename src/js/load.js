chrome.storage.local.get('save_content', (items) => {
  try {
    const TAB_SET_STYLE = 'color:skyblue;font-weight: bold;';
    const TAB_RESET_STYLE = 'color:black;font-weight: normal;';

    let labelList = document.querySelectorAll('.cp_tab > label');
    if (!labelList.length) throw new Error("Labels not found");

    let textareaList = document.querySelectorAll('.contents');
    if (!textareaList.length) throw new Error("Textareas not found");

    let saveContents = items.save_content || [];
    if (!saveContents.length) throw new Error("No saved content found");

    labelList.forEach((label, index) => {
      let value = saveContents[index];
      label.style = value ? TAB_SET_STYLE : TAB_RESET_STYLE;
      textareaList[index].value = value;

      let lengthElement = document.getElementById(`inputlength${index + 1}`);
      lengthElement.innerHTML = `length: ${value.length}`;
    });

    let lastItem = saveContents[saveContents.length - 1];
    if (lastItem > 0) {
      document.querySelectorAll('[name="cp_tab"]')[lastItem - 1].checked = true;
    }
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
});
