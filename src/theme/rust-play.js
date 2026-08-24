// RustPlay: インタラクティブ実行ブロック (全ページ共通・イベント委譲)。
// マークアップは scripts/preprocess-docs.mjs が生成する。
// 旧 src/components/RustPlay.astro のクライアントスクリプトの移植。
(() => {
  const API = 'https://play.rust-lang.org/execute';

  const q = (root, sel) => root.querySelector(sel);

  // 表示中のハイライト済みコードブロックから元のコードを取り出す
  function initialCode(root) {
    const pre = q(root, '.rust-play__code pre');
    return pre ? pre.textContent.replace(/\n?$/, '\n') : '';
  }

  function ensureEditor(root) {
    let editor = q(root, '.rust-play__editor');
    if (!editor) {
      editor = document.createElement('textarea');
      editor.className = 'rust-play__editor';
      editor.spellcheck = false;
      editor.value = initialCode(root);
      editor.dataset.initial = editor.value;
      q(root, '.rust-play__code').insertAdjacentElement('afterend', editor);
    }
    return editor;
  }

  function currentCode(root) {
    const editor = q(root, '.rust-play__editor');
    return root.classList.contains('is-editing') && editor
      ? editor.value
      : initialCode(root);
  }

  function setOutput(root, nodes) {
    const out = q(root, '.rust-play__output');
    out.replaceChildren(
      ...nodes.map((n) => {
        if (!n.cls) return document.createTextNode(n.text);
        const el = document.createElement('span');
        el.className = n.cls;
        el.textContent = n.text;
        return el;
      })
    );
    out.hidden = false;
    out.classList.add('is-visible');
  }

  async function run(root) {
    const btn = q(root, '.rust-play__btn--run');
    const editor = q(root, '.rust-play__editor');
    const editBtn = q(root, '.rust-play__btn--edit');
    const resetBtn = q(root, '.rust-play__btn--reset');
    // 実行中の編集を防ぐ(古いコードの結果が新しいコードの出力に見えるのを避ける)
    btn.disabled = true;
    if (editor) editor.readOnly = true;
    editBtn.disabled = true;
    resetBtn.disabled = true;
    setOutput(root, [{ text: 'コンパイルと実行中…（play.rust-lang.org を利用）' }]);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: root.dataset.channel,
          mode: root.dataset.mode,
          edition: root.dataset.edition,
          crateType: 'bin',
          tests: false,
          backtrace: false,
          code: currentCode(root),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const nodes = [];
      // コンパイラの警告・エラーは stderr に入る。Cargo自身の進行表示
      // (Compiling/Finished/Running)だけを取り除いて表示する
      const stderr = data.stderr
        .split('\n')
        .filter(
          (l) =>
            !/^\s*(Compiling playground v|Finished `(dev|release)` profile|Running `target\/)/.test(
              l
            )
        )
        .join('\n')
        .trim();
      if (stderr) nodes.push({ cls: data.success ? 'stderr' : 'error', text: stderr });
      if (stderr && data.stdout) nodes.push({ text: '\n\n' });
      if (data.stdout) nodes.push({ text: data.stdout });
      if (!data.success && data.exitDetail) {
        if (nodes.length > 0) nodes.push({ text: '\n\n' });
        nodes.push({ cls: 'error', text: data.exitDetail });
      }
      if (nodes.length === 0) nodes.push({ text: '（出力はありません）' });
      setOutput(root, nodes);
    } catch (err) {
      setOutput(root, [
        {
          cls: 'error',
          text: `実行環境に接続できませんでした: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      btn.disabled = false;
      if (editor) editor.readOnly = false;
      editBtn.disabled = false;
      resetBtn.disabled = false;
    }
  }

  function enterEdit(root) {
    const editor = ensureEditor(root);
    root.classList.add('is-editing');
    q(root, '.rust-play__btn--edit').hidden = true;
    q(root, '.rust-play__btn--reset').hidden = false;
    editor.style.minHeight = `${Math.min(editor.scrollHeight + 8, 480)}px`;
    editor.focus();
  }

  function resetEdit(root) {
    const editor = q(root, '.rust-play__editor');
    if (editor) editor.value = editor.dataset.initial;
    root.classList.remove('is-editing');
    q(root, '.rust-play__btn--edit').hidden = false;
    q(root, '.rust-play__btn--reset').hidden = true;
  }

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const root = target.closest('.rust-play');
    if (!root) return;
    if (target.closest('.rust-play__btn--run')) void run(root);
    else if (target.closest('.rust-play__btn--edit')) enterEdit(root);
    else if (target.closest('.rust-play__btn--reset')) resetEdit(root);
  });

  // 編集後は「Playgroundで開く」リンクも現在のコードを反映する
  // (click のキャプチャ段階なら、キーボード操作でも遷移前に書き換えられる)
  document.addEventListener(
    'click',
    (e) => {
      if (!(e.target instanceof Element)) return;
      const link = e.target.closest('.rust-play__link');
      if (!link) return;
      const root = link.closest('.rust-play');
      if (!root) return;
      const params = new URLSearchParams({
        version: root.dataset.channel ?? 'stable',
        mode: root.dataset.mode ?? 'debug',
        edition: root.dataset.edition ?? '2024',
        code: currentCode(root),
      });
      link.href = `https://play.rust-lang.org/?${params}`;
    },
    true
  );
})();
