(function () {
  console.log("AIChat SmartSend loaded");

  document.addEventListener("keydown", (e) => {
    // Mac 判定（platform で OK）
    const isMac = navigator.platform.toUpperCase().includes("MAC");

    // 送信修飾キー（Mac=Cmd / Win=Ctrl）
    const sendKey = isMac ? e.metaKey : e.ctrlKey;

    // Enter + (Ctrl or Cmd)
    if (sendKey && e.key === "Enter") {
      const textarea = document.querySelector("textarea");
      if (!textarea) return;

      const form = textarea.closest("form");
      const sendBtn = form?.querySelector('button[type="submit"]');
      if (!sendBtn) return;

      e.preventDefault();  // ChatGPT 標準の Enter 処理をキャンセル

      // ----- 送信実行 -----
      sendBtn.click();

      // ----- Shift＋Ctrl/Cmd のときはテキストを残す -----
      if (e.shiftKey) {
        // 何もしない（テキストを残す）
        return;
      }

      // ----- 通常送信：テキスト削除 -----
      // 少し遅らせないと ChatGPT の UI が上書きする
      setTimeout(() => {
        textarea.value = "";
        textarea.dispatchEvent(new Event("input", { bubbles: true })); // UI更新
      }, 40);
    }
  });
})();
