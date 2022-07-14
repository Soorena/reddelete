document.getElementById("submit").addEventListener("click", () => {
    const posts = document.getElementById("checkbox-post").checked;
    const comments = document.getElementById("checkbox-comment").checked;

    const date = document.getElementById("input-date").value;
    const shouldScramble = !document.getElementById("checkbox-scramble").checked;

    browser.runtime.sendMessage({ action: "startProcess", posts, comments, date, shouldScramble });
});
