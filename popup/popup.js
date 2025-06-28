/*
Add a click event listener to each button in the popup.
 */
const listenForClicks = async () => {
    document.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
            const command = button.id;
            browser.tabs
                .query({active: true, currentWindow: true})
                .then((tabs) => browser.tabs.sendMessage(tabs[0].id, {command}))
                .then(() => (document.querySelector("#error").style.display = "none"))
                .catch(
                    () => (document.querySelector("#error").style.display = "block"),
                );
        });
    });
};


/*
Show or hide the appropriate content div based on the active tab URL.
 */
document.addEventListener('DOMContentLoaded', function () {
    const setContent = (divId) => {
        document.querySelector("#default-div").style.display = "none";
        document.querySelector("#item-div").style.display = "none";
        document.querySelector("#inbox-div").style.display = "none";
        document.querySelector(`#${divId}`).style.display = "block";
    }

    browser.tabs.query({active: true, currentWindow: true})
        .then(tabs => {
            const activeTab = tabs[0];
            const activeTabUrl = activeTab.url;
            if (activeTabUrl.includes("/items/")) {
                setContent("item-div");
            } else if (activeTabUrl.includes("/inbox/")) {
                setContent("inbox-div");
            } else {
                setContent("default-div");
            }
        })
        .catch(() => {
            setContent("default-div");
        });
});


browser.tabs.executeScript({ file: "/content_scripts/utils.js" }).then(() => {
    return browser.tabs.executeScript({ file: "/content_scripts/download.js" });
}).then(listenForClicks);
