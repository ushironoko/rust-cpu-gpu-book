// デフォルトテーマのUI文言(英語ハードコード)を日本語化する。
// ox-content の SSG テーマには UI 翻訳の仕組みがないため、
// クライアント側で既知の文言を置き換える。
// Code Play ウィジェットは実行のたびに再描画されるので、
// MutationObserver で追加ノードにも同じ置換を適用する。
(() => {
  const TEXT = new Map([
    ['On this page', '目次'],
    ['Menu', 'メニュー'],
    ['Search', '検索'],
    ['Theme', 'テーマ'],
    ['to navigate', 'で移動'],
    ['to select', 'で選択'],
    ['to close', 'で閉じる'],
    // v3 pager (ssg.pagination)
    ['Previous', '前のページ'],
    ['Next', '次のページ'],
    // Code Play ツールバー
    ['Run', '実行'],
    ['Typecheck', '型チェック'],
    ['Cancel', '中断'],
    ['No stdio yet.', '出力はまだありません'],
    ['No stderr.', 'stderr はありません'],
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
    if (root.querySelectorAll === undefined) return;
    for (const el of root.querySelectorAll('[aria-label]')) {
      const v = el.getAttribute('aria-label');
      if (ARIA.has(v)) el.setAttribute('aria-label', ARIA.get(v));
    }
    for (const el of root.querySelectorAll('input.search-input')) {
      el.placeholder = '検索';
    }
  }

  function watchDynamicUi() {
    // 検索結果の「No results」と Code Play の再描画はテーマ/ウィジェットの
    // JSが動的に行うため、追加ノードへ置換を適用し続ける
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) localize(node);
        }
      }
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
    watchDynamicUi();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
