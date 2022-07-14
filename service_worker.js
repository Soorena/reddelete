importScripts("browser-polyfill.min.js");

const __setActive = async (active, date, shouldScramble) => {
    await browser.storage.local.set({ active: { active, date, shouldScramble } });
};

const __setDetails = async (tabId, process) => {
    await browser.storage.local.set({ details: { tabId, process } });
};

browser.runtime.onMessage.addListener(async (msg, sender) => {
    if (msg.action === "startProcess") {
        await __setActive(true, msg.date, msg.shouldScramble);

        if (msg.posts && msg.comments) {
            const tab = await browser.tabs.create({ url: "https://old.reddit.com/user/me/overview?sort=new" });
            await __setDetails(tab.id, "both");
        } else if (msg.posts) {
            const tab = await browser.tabs.create({ url: "https://old.reddit.com/user/me/submitted?sort=new" });
            await __setDetails(tab.id, "posts");
        } else if (msg.comments) {
            const tab = await browser.tabs.create({ url: "https://old.reddit.com/user/me/comments?sort=new" });
            await __setDetails(tab.id, "comments");
        } else {
            await __setActive(false, null, null);
        }
    } else if (msg.action === "getActive") {
        const { active } = await browser.storage.local.get(["active"]);
        return active;
    } else if (msg.action === "endProcess") {
        __setActive(false, null, null);

        const { details } = await browser.storage.local.get(["details"]);

        if (details.process === "both") {
            browser.tabs.update(details.tabId, { url: "https://reddit.com/user/me" });
        } else if (details.process === "posts") {
            browser.tabs.update(details.tabId, { url: "https://reddit.com/user/me/posts" });
        } else if (details.process === "comments") {
            browser.tabs.update(details.tabId, { url: "https://reddit.com/user/me/comments" });
        }
    } else if (msg.action === "editPost") {
        const tab = await browser.tabs.create({ url: "https://old.reddit.com/" + msg.link + "#redditDeleter" });

        const waitTabRemoval = () => {
            return new Promise((resolve, reject) => {
                browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
                    if (tab.id === tabId) {
                        resolve();
                    }
                });
            });
        };

        await waitTabRemoval();
        return;
    } else if (msg.action === "closeTab") {
        browser.tabs.remove(sender.tab.id);
    }
});

// Reset variables stored in the storage
browser.runtime.onStartup.addListener(() => {
    __setActive(false, null, null);
    __setDetails(null, null);
});

browser.runtime.onInstalled.addListener(() => {
    __setActive(false, null, null);
    __setDetails(null, null);
});

// Reset variables when a tab is closed
browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    const { active } = await browser.storage.local.get(["active"]);
    const { details } = await browser.storage.local.get(["details"]);

    if (active.active === true && details.tabId === tabId) {
        await __setActive(false, null, null);
        await __setDetails(null, null);
    }
});
