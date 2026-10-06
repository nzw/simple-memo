// Image stock gallery: list, add, insert into the current memo, delete.
try {
  const gallery = document.querySelector('#gallery');
  const list = document.querySelector('#gallery-list');
  const info = document.querySelector('#gallery-info');
  const fileInput = document.querySelector('#gallery-file');
  if (!gallery || !list || !info || !fileInput) throw new Error("Gallery elements not found");

  const usedIds = () => {
    let text = [...document.querySelectorAll('.contents')].map((t) => t.value).join('\n');
    return new Set([...text.matchAll(/\]\(img:([a-z0-9]+)\)/g)].map((m) => m[1]));
  };

  const size = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

  // Download the stored image (it is kept as WebP / JPEG after shrinking).
  const download = async (id) => {
    let record = await MemoImages.get(id);
    if (!record) return;
    let ext = record.blob.type === 'image/jpeg' ? 'jpg' : 'webp';
    let base = (record.name || 'image').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '_') || 'image';
    let a = document.createElement('a');
    a.href = URL.createObjectURL(record.blob);
    a.download = `${base}-${id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  // Lightbox: click an image in the preview or the gallery to see it large.
  const box = document.querySelector('#lightbox');
  const boxImg = document.querySelector('#lightbox-img');
  let boxId = null;
  const openBox = async (id) => {
    let url = await MemoImages.url(id);
    if (!url) return;
    boxId = id;
    boxImg.src = url;
    box.hidden = false;
  };
  const closeBox = () => { box.hidden = true; boxImg.removeAttribute('src'); boxId = null; };
  document.addEventListener('click', (e) => {
    let img = e.target.closest('img[data-img-id]');
    if (img) openBox(img.dataset.imgId);
  });
  document.querySelector('#lightbox-close').addEventListener('click', closeBox);
  document.querySelector('#lightbox-dl').addEventListener('click', () => boxId && download(boxId));
  box.addEventListener('click', (e) => { if (e.target === box) closeBox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) closeBox(); });

  const show = async () => {
    let images = await MemoImages.list();
    let used = usedIds();
    info.textContent = `${images.length} 枚 / ${size(images.reduce((sum, i) => sum + i.size, 0))}`;
    list.replaceChildren();
    if (!images.length) {
      let empty = document.createElement('p');
      empty.className = 'gallery-empty';
      empty.textContent = 'まだ画像がありません。メモに貼り付けるか、ドロップすると保存されます。';
      list.append(empty);
    }
    for (let image of images) {
      let item = document.createElement('div');
      item.className = 'gallery-item';
      let img = document.createElement('img');
      img.alt = '';
      img.title = 'クリックで拡大';
      img.dataset.imgId = image.id;
      MemoImages.url(image.id).then((url) => { img.src = url; });
      let insert = document.createElement('button');
      insert.type = 'button';
      insert.textContent = '挿入';
      insert.title = 'いまのメモのカーソル位置に挿入';
      insert.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('memo-insert-image', { detail: { id: image.id } }));
        gallery.hidden = true;
      });
      let save = document.createElement('button');
      save.type = 'button';
      save.textContent = 'DL';
      save.title = 'ダウンロード';
      save.addEventListener('click', () => download(image.id));
      let meta = document.createElement('span');
      meta.textContent = `${size(image.size)}${used.has(image.id) ? '' : '・未使用'}`;
      let del = document.createElement('button');
      del.type = 'button';
      del.textContent = '削除';
      del.title = used.has(image.id) ? 'メモから参照されています。消すとプレビューに出なくなります' : '削除';
      del.addEventListener('click', async () => {
        await MemoImages.remove(image.id);
        show();
      });
      item.append(img, meta, insert, save, del);
      list.append(item);
    }
  };

  document.querySelector('#images').addEventListener('click', () => {
    gallery.hidden = false;
    show();
  });
  document.querySelector('#gallery-close').addEventListener('click', () => { gallery.hidden = true; });
  document.querySelector('#gallery-add').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    for (let file of fileInput.files) {
      try { await MemoImages.add(file); } catch (e) { console.error(e); }
    }
    fileInput.value = '';
    show();
  });
} catch (error) {
  console.error(`An error occurred: ${error.message}`);
}
