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

  // テキストを復元
  function restoreEditorText(text) {
    const editor = getEditor();
    if (!editor) return;

    editor.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = text;
    editor.appendChild(p);
  }

  // 送信ボタンを探す（Ctrl+Enterが送れているボタンと同じ）
  function findSendButton() {
    const selectors = [
      '[data-testid="composer-send-button"]',
      '[data-testid="send-button"]',
      '#composer-submit-button'
    ];
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn) return btn;
    }
    return null;
  }

  // ========= ① addEventListener をフックして「Enter単体送信」を潰す =========
  const originalAddEventListener = EventTarget.prototype.addEventListener;

  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (type !== "keydown" || typeof listener !== "function") {
      return originalAddEventListener.call(this, type, listener, options);
    }

    const wrapped = function (event) {
      try {
        if (event.isComposing) {
          return listener.call(this, event);
        }

        const inEditor = isInEditor(event.target);
        const key = event.key;
        const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;

        // エディタ内の「Enter単体」は元リスナーに渡さない（送信させない）
        if (
          inEditor &&
          key === "Enter" &&
          !ctrlOrMeta &&
          !event.altKey &&
          !event.shiftKey
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }

        // それ以外（Ctrl/Cmd+Enter など）は素通し
        return listener.call(this, event);
      } catch (e) {
        console.warn("AIChat SmartSend wrapped listener error:", e);
        return listener.call(this, event);
      }
    };

    return originalAddEventListener.call(this, type, wrapped, options);
  };

  // ========= ② Shift+Ctrl/Cmd+Enter だけ自前で「送信＆復元」する =========
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.isComposing) return;

      const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;
      const isSmartSendKey =
        ctrlOrMeta && event.shiftKey && event.key === "Enter";

      if (!isSmartSendKey) return;
      if (!isInEditor(event.target)) return;

      const editor = getEditor();
      if (!editor) return;

      const text = editor.innerText || "";
      if (!text.trim()) return;

      // ChatGPT側に渡さない（自前で送信する）
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const btn = findSendButton();
      if (!btn) {
        console.warn("AIChat SmartSend: send button not found for SmartSend key");
        return;
      }

      // FuncA: 送信ボタンをクリック
      btn.click();
      console.log("AIChat SmartSend: SmartSend key sent");

      // 少し待ってからテキストを復元
      setTimeout(() => {
        restoreEditorText(text);
        console.log("AIChat SmartSend: text restored after SmartSend key");
      }, 300);
    },
    true // capture
  );
})();
