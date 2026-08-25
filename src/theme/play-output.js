// Rust Playground は正常実行でも cargo のビルド進行ログ(Compiling/Finished/
// Running)を stderr で返す。Code Play は (1) それを赤字表示し、(2) stderr が
// 空でない限り実行後に stderr タブへ自動切替するため、正常実行が毎回エラー
// 画面に見えてしまう。旧 RustPlay 実装と同じパターンでノイズ行を両タブから
// 間引き、間引いた結果 stderr が実質空(本物のエラーなし)なら stdio タブへ
// 戻す。本物の panic やコンパイルエラーは残り、その場合は stderr 着地のまま。
(() => {
  const NOISE = /^\s*(Compiling playground v|Finished `(dev|release)` profile|Running `target\/)/;
  const EMPTY_STDERR = '<p class="ox-code-play__empty">No stderr.</p>';

  function filterRows(widget) {
    for (const row of widget.querySelectorAll('.ox-code-play__stdio-line--stderr')) {
      if (row.dataset.noiseFiltered) continue;
      row.dataset.noiseFiltered = '1';
      const textEl = row.querySelector('.ox-code-play__stdio-text');
      if (!textEl) continue;
      const kept = textEl.textContent.split('\n').filter((line) => !NOISE.test(line));
      while (kept.length > 0 && kept[0].trim() === '') kept.shift();
      while (kept.length > 0 && kept[kept.length - 1].trim() === '') kept.pop();
      if (kept.length === 0) {
        // hidden 属性はウィジェットCSSの display:grid に負けるため inline で消す
        row.style.display = 'none';
      } else {
        textEl.textContent = kept.join('\n');
      }
    }
  }

  // フィルタで stderr タブが実質空になったら空表示に置き換え、
  // そのタブが表示中なら stdio へ戻す
  function settleStderrPanel(widget) {
    const panel = widget.querySelector('[data-panel="stderr"]');
    if (!panel || panel.querySelector('.ox-code-play__empty')) return;
    const meaningful = [...panel.querySelectorAll('.ox-code-play__stdio-line--stderr')].some(
      (row) => row.style.display !== 'none'
    );
    if (meaningful || panel.querySelector('.ox-code-play__diag')) return;
    panel.innerHTML = EMPTY_STDERR;
    if (!panel.hidden) {
      widget.querySelector('[data-ox-panel="stdio"]')?.click();
    }
  }

  function process(root) {
    if (!root.querySelectorAll) return;
    const widgets = root.matches?.('ox-code-play')
      ? [root]
      : root.querySelectorAll('ox-code-play');
    for (const widget of widgets) {
      filterRows(widget);
      settleStderrPanel(widget);
    }
  }

  const init = () => {
    process(document.body);
    // 実行のたびにパネルが再描画されるため監視し続ける。処理済みの行は
    // data-noise-filtered、空表示済みパネルは .ox-code-play__empty の存在で
    // 弾くので再入しても何もしない
    new MutationObserver(() => process(document.body)).observe(document.body, {
      childList: true,
      subtree: true,
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
