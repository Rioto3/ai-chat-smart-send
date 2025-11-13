(() => {
  console.log("AIChat SmartSend (hook) loaded");

  const isMac = navigator.platform.toUpperCase().includes("MAC");

  function getEditor() {
    return document.querySelector("div.ProseMirror#prompt-textarea");
  }

  function isInEditor(target) {
    const editor = getEditor();
    return !!editor && !!target && editor.contains(target);
  }

  // テキストを戻す（Shift+Ctrl/Cmd 用）
  function restoreEditorText(text) {
    const editor = getEditor();
    if (!editor) return;

    editor.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = text;
    editor.appendChild(p);
  }

  // ========= ① addEventListener をフック =========
  const originalAddEventListener = EventTarget.prototype.addEventListener;

  EventTarget.prototype.addEventListener = function (type, listener, options) {
    // keydown 以外はそのまま
    if (type !== "keydown" || typeof listener !== "function") {
      return originalAddEventListener.call(this, type, listener, options);
    }

    // keydown 用にラップ
    const wrapped = function (event) {
      try {
        // 日本語入力中は邪魔しない
        if (event.isComposing) {
          return listener.call(this, event);
        }

        const inEditor = isInEditor(event.target);
        const key = event.key;
        const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;

        // ----- ケース1: エディタ内の「Enter単体」 → ChatGPTに渡さない -----
        if (
          inEditor &&
          key === "Enter" &&
          !ctrlOrMeta && // Ctrl/Cmd なし
          !event.altKey &&
          !event.shiftKey
        ) {
          // ここで送信を「根本的に」無効化
          event.preventDefault();
          event.stopImmediatePropagation();
          return; // 元 listener を呼ばない
        }

        // ----- ケース2: Ctrl/Cmd + Enter → 通常送信させる -----
        // → ここでは何もせず、そのまま元 listener に渡す

        return listener.call(this, event);
      } catch (e) {
        console.warn("AIChat SmartSend wrapped listener error:", e);
        return listener.call(this, event);
      }
    };

    return originalAddEventListener.call(this, type, wrapped, options);
  };

  // ========= ② Shift+Ctrl/Cmd+Enter でテキストを残す =========
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.isComposing) return;

      const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;
      const isSmartSendKey = ctrlOrMeta && event.key === "Enter" && event.shiftKey;

      if (!isSmartSendKey) return;
      if (!isInEditor(event.target)) return;

      const editor = getEditor();
      if (!editor) return;

      const text = editor.innerText || "";
      if (!text.trim()) return;

      // ここでは ChatGPT に普通に送信させる
      // （上のラッパーで Ctrl/Cmd+Enter は通している）

      // 送信後、少し待ってからテキストを復元
      setTimeout(() => {
        restoreEditorText(text);
        console.log("AIChat SmartSend: text restored after SmartSend key");
      }, 400);
    },
    true
  );
})();
