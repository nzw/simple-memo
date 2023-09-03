setTimeout(() => {
  try {
    const TAB_SET_STYLE = 'color:skyblue;font-weight: bold;';
    const TAB_RESET_STYLE = 'color:black;font-weight: normal;';

    let labelList = document.querySelectorAll('.cp_tab > label');
    if (!labelList.length) throw new Error("Labels not found");

    let textareaList = document.querySelectorAll('.contents');
    if (!textareaList.length) throw new Error("Textareas not found");

    const save = () => {
      let saveContents = [];
      let selectedTab = document.querySelector('[name="cp_tab"]:checked');
      if (!selectedTab) return;

      let selectedTabId = selectedTab.id;
      textareaList.forEach((textarea, index) => {
        let value = textarea.value;
        labelList[index].style = value ? TAB_SET_STYLE : TAB_RESET_STYLE;
        saveContents.push(value);

        let lengthElement = document.getElementById(`inputlength${index + 1}`);
        lengthElement.innerHTML = `length: ${value.length}`;
      });

      saveContents.push(selectedTabId.replace('tab1_', ''));
      chrome.storage.local.set({ 'save_content': saveContents });
    };

    textareaList.forEach((textarea) => {
      textarea.addEventListener('keyup', save, false);
      textarea.addEventListener('keydown', save, false);
    });
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
}, 100);
