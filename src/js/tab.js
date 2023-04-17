const tabList = document.querySelectorAll('.tab-list-item');
const tabContent = document.querySelectorAll('.tab-contents-item');

document.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < tabList.length; i++) {
        tabList[i].addEventListener('click', tabSwitch);
    }
    function tabSwitch() {
        console.log(document.querySelectorAll('.active')[0]);
        document.querySelectorAll('.active')[0].classList.remove('active');
        this.classList.add('active');
        document.querySelectorAll('.show')[0].classList.remove('show');
        const aryTabs = Array.prototype.slice.call(tabList);
        const index = aryTabs.indexOf(this);
        tabContent[index].classList.add('show');
    };
});
