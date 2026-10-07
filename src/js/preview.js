// Markdown preview: marked -> DOMPurify -> highlight.js / mermaid / image lookup.
// The libraries are bundled in lib/ (an extension page cannot load remote code).
const MemoPreview = (() => {
  const IMG_PREFIX = 'img:';
  let mermaidReady = null;
  let mermaidSeq = 0;

  marked.use({ gfm: true, breaks: true });

  // Memo text is untrusted (it syncs from other computers): drop everything but
  // plain Markdown output. Only img:<id> may be used as an image source.
  const purifyConfig = {
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style'],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|img:|#)/i,
  };

  // Append "= result" to lines that are calculations. Fenced code is left alone.
  const addCalc = (text) => {
    let fence = null;
    return text.split('\n').map((line) => {
      let m = /^\s*(`{3,}|~{3,})/.exec(line);
      if (m) {
        if (!fence) fence = m[1][0];
        else if (m[1][0] === fence) fence = null;
        return line;
      }
      if (fence) return line;
      let result = MemoCalc.line(line);
      if (result === null) return line;
      let expr = line.trim().replace(/\s*=$/, '').replace(/^=\s*/, '');
      return `${expr.replace(/[*]/g, '\\*')} <span class="calc-result">= ${result}</span>`;
    }).join('\n');
  };

  const loadMermaid = () => {
    if (!mermaidReady) {
      mermaidReady = new Promise((resolve, reject) => {
        let script = document.createElement('script');
        script.src = 'lib/mermaid.min.js';
        script.onload = () => {
          mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
          resolve();
        };
        script.onerror = () => { mermaidReady = null; reject(new Error('mermaid')); };
        document.head.appendChild(script);
      });
    }
    return mermaidReady;
  };

  const drawMermaid = async (code) => {
    let source = code.textContent;
    let box = document.createElement('div');
    box.className = 'mermaid-box';
    code.closest('pre').replaceWith(box);
    try {
      await loadMermaid();
      let { svg } = await mermaid.render(`mermaid-${Date.now()}-${mermaidSeq++}`, source);
      box.innerHTML = svg;
    } catch (e) {
      box.classList.add('mermaid-error');
      let msg = document.createElement('div');
      msg.textContent = 'Mermaid の記法を解釈できません';
      let pre = document.createElement('pre');
      pre.textContent = source;
      box.replaceChildren(msg, pre);
      // mermaid leaves its error graph in <body> on failure
      document.querySelectorAll('[id^="dmermaid-"]').forEach((el) => el.remove());
    }
  };

  const resolveImages = (root) => {
    root.querySelectorAll('img').forEach(async (img) => {
      let src = img.getAttribute('src') || '';
      if (!src.startsWith(IMG_PREFIX)) {
        // Remote images would make the preview call out to other servers.
        let note = document.createElement('span');
        note.className = 'img-missing';
        note.textContent = `[画像: ${img.alt || src}]`;
        img.replaceWith(note);
        return;
      }
      let id = src.slice(IMG_PREFIX.length);
      img.dataset.imgId = id;
      img.title = 'クリックで拡大';
      img.removeAttribute('src');
      try {
        let url = await MemoImages.url(id);
        if (url) {
          img.src = url;
          return;
        }
      } catch (e) { /* fall through to the placeholder */ }
      let note = document.createElement('span');
      note.className = 'img-missing';
      note.textContent = '[画像がありません（この PC には保存されていません）]';
      img.replaceWith(note);
    });
  };

  // Fill `el` with the rendered `text`. A newer call for the same element wins.
  const render = (el, text) => {
    let html = DOMPurify.sanitize(marked.parse(addCalc(text)), purifyConfig);
    let doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('a[href]').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    doc.querySelectorAll('pre code').forEach((code) => {
      if (code.classList.contains('language-mermaid')) return;
      let lang = [...code.classList].find((c) => c.startsWith('language-'));
      if (lang && hljs.getLanguage(lang.slice(9))) hljs.highlightElement(code);
    });
    el.replaceChildren(...doc.body.childNodes);
    resolveImages(el);
    el.querySelectorAll('pre code.language-mermaid').forEach(drawMermaid);
  };

  return { render };
})();
