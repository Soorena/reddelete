const __randomString = (length) => {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const __waitMs = (ms) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
};

// Function to check if the edit is complete
const __waitForValueChange = (selector, value) => {
    return new Promise((resolve, reject) => {
        let target = document.querySelector(selector);

        if (target.textContent.trim() === value) {
            resolve();
        } else {
            const intervalId = setInterval(() => {
                target = document.querySelector(selector);
                if (target.textContent.trim() === value) {
                    clearInterval(intervalId);
                    resolve();
                }
            }, 300);
        }
    });
};

const startDeletion = async (date, shouldScramble) => {
    const cards = document.querySelectorAll(".thing");

    let shouldReload = true;
    let lastEdited = false;

    for (let el of cards) {
        if (lastEdited) {
            await __waitMs(4000);
            lastEdited = false;
        }

        const cardDate = new Date(new Date(el.querySelector("time").getAttribute("datetime")).toDateString());
        const limitDate = new Date(date);

        if (cardDate.getTime() >= limitDate.getTime()) {
            if (shouldScramble) {
                if (el.classList.contains("comment")) {
                    const editArea = el.querySelector(".usertext-edit textarea");
                    const saveBtn = el.querySelector(".usertext-buttons .save");

                    const randomStr = __randomString(10);
                    const elId = el.id;

                    editArea.value = randomStr;
                    saveBtn.click();

                    lastEdited = true;

                    await __waitForValueChange("#" + elId + " .usertext-body", randomStr);
                } else if (el.classList.contains("link") && el.querySelector(".expando-button")) {
                    await browser.runtime.sendMessage({ action: "editPost", link: el.dataset.permalink });
                    lastEdited = true;
                }
            }

            const deleteArea = el.querySelector(".del-button");
            const deleteBtn = deleteArea.querySelector(".togglebutton");
            const deleteYesBtn = deleteArea.querySelector(".yes");

            deleteBtn.click();
            deleteYesBtn.removeAttribute("href");
            deleteYesBtn.click();

            await __waitMs(500);
        } else {
            shouldReload = false;
        }
    }

    const nextBtn = document.querySelector(".next-button a");

    if (nextBtn && shouldReload) {
        window.location.reload();
    } else {
        browser.runtime.sendMessage({ action: "endProcess" });
    }
};

const editPost = async () => {
    const el = document.querySelector("#siteTable .thing");

    const editArea = el.querySelector(".usertext-edit textarea");
    const saveBtn = el.querySelector(".usertext-buttons .save");

    const randomStr = __randomString(10);

    editArea.value = randomStr;
    saveBtn.click();

    await __waitForValueChange("#siteTable .thing .usertext-body", randomStr);
};

document.addEventListener("readystatechange", async () => {
    if (document.readyState === "complete") {
        if (window.location.hash === "#redditDeleter") {
            await editPost();
            browser.runtime.sendMessage({ action: "closeTab" });
        } else {
            const active = await browser.runtime.sendMessage({ action: "getActive" });

            if (active.active) {
                startDeletion(active.date, active.shouldScramble);
            }
        }
    }
});
