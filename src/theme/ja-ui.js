// デフォルトテーマのUI文言(英語ハードコード)を日本語化する。
// ox-content の SSG テーマには UI 翻訳の仕組みがないため、
// クライアント側で既知の文言を置き換える。
(() => {
  const TEXT = new Map([
    ['On this page', '目次'],
    ['Menu', 'メニュー'],
    ['Search', '検索'],
    ['Theme', 'テーマ'],
    ['to navigate', 'で移動'],
    ['to select', 'で選択'],
    ['to close', 'で閉じる'],
  ]);
  const ARIA = new Map([
    ['Toggle menu', 'メニューを開閉'],
    ['Toggle theme', 'テーマを切り替え'],
    ['Search', '検索'],
    ['Search documentation', 'ドキュメントを検索'],
    ['On this page', '目次'],
    ['Menu', 'メニュー'],
    ['Theme', 'テーマ'],
  ]);

  function localize(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent.trim();
      if (TEXT.has(t)) n.textContent = n.textContent.replace(t, TEXT.get(t));
    }
    for (const el of root.querySelectorAll('[aria-label]')) {
      const v = el.getAttribute('aria-label');
      if (ARIA.has(v)) el.setAttribute('aria-label', ARIA.get(v));
    }
    for (const el of root.querySelectorAll('input.search-input')) {
      el.placeholder = '検索';
    }
  }

  function watchSearchResults() {
    // 検索結果の「No results」はテーマJSが動的に描画するため監視して置換する
    const observer = new MutationObserver(() => {
      for (const el of document.querySelectorAll('.search-empty')) {
        if (el.textContent.trim() === 'No results')
          el.textContent = '見つかりませんでした';
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  const init = () => {
    localize(document.body);
    watchSearchResults();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
