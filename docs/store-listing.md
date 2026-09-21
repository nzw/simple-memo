# SimpleMemoPad ストア掲載文

Chrome ウェブストアの掲載情報に貼る文面。ここが唯一の原本で、ストアを直すときは
このファイルを直してから貼る。旧い文面は「これまでの文面」に残す。

- 最終更新: 2026-09-21
- 対象バージョン: v1.7.0（リポジトリに反映済み / ストアは v1.5.1 のまま、提出待ち）

---

## 説明（英語・ストアの Description）

```text
It is the best app for leaving a little memo when operating the browser.
You can leave notes on multiple tabs and leave them in a file.
You can also change the font size.

WHAT'S NEW IN 1.7.0
- Sync: your notes follow you to every computer where Chrome is signed in to the
  same Google account with sync turned on. No sign-in inside the extension.
- Side panel: pin your memo to the side panel and keep it open while you browse
  the page. The toolbar icon and the shortcut still open the popup, as before.
- Tabs: add up to 20 tabs, drag a tab to reorder them, and delete a tab once its
  memo is empty. Your existing notes are kept as they are.

FEATURES
- Autosave. Every keystroke is saved, so there is no save button to forget.
- Synced by Chrome itself. No account, no sign-in, no server of ours. If Chrome
  sync is off, your notes simply stay on this computer.
- Sync limits set by Chrome: about 8 KB per tab (around 2,700 Japanese characters)
  and about 100 KB in total. A tab over the limit stays on this computer and is
  marked in the memo pad.
- Up to 20 tabs, each with its own note and character count.
- Popup or side panel, whichever suits what you are doing.
- Shortcut key: Ctrl+Shift+Z (Control+Shift+Z on Mac).
- Font size, zoom, and saving every tab to a text file.

PERMISSIONS
- storage: to keep your notes in this browser and sync them through Chrome sync.
- sidePanel: to open the memo in the browser's side panel.
The extension does not read the pages you visit and sends nothing to the developer.
```

## 短い説明（英語・132 文字以内）

```text
A simple memo pad for your browser. Autosaved notes in up to 20 tabs, synced across your computers by Chrome.
```

（109 文字）

## manifest.json の description

```text
A simple memo pad. Keep autosaved notes in tabs, in a popup or the side panel.
```

## 日本語（nzw.jp のカードなどで使う）

```text
Chrome拡張でブラウザ操作中に少しメモを残すのに最適なシンプルメモ帳アプリです。最大20タブでのメモ保持やファイル保存が可能で、サイドパネルに固定すればページを見ながら書き続けられます。Chrome の同期で別のPCにも同じメモが届きます。
```

## プライバシーへの取り組み（Privacy practices タブ）

権限ごとに理由の記入が要る。書いていない権限があると提出できない。
v1.6.0 で `sidePanel` が増えた。v1.7.0 で同期（`chrome.storage.sync`）を使い始めたので、
storage の理由も書き直した。権限そのものは増えていない。

### 単一用途（Single purpose）

```text
SimpleMemoPad is a memo pad. It lets the user write short notes in tabs, in a popup or in the side panel, and keeps them in the browser, synced across the user's computers by Chrome sync.
```

### storage の理由

```text
Notes typed by the user are saved with chrome.storage.local, so they are still there the next time the memo pad is opened, and copied to chrome.storage.sync, so Chrome's own sync brings the same notes to the user's other computers signed in to the same Google account. The notes are never sent to the developer or to any server other than Chrome sync.
```

### sidePanel の理由

```text
The memo pad can be opened in the browser's side panel so the user can keep a note visible while reading or working on a page. The popup closes as soon as the user clicks the page, so the side panel is the only way to keep the note open beside it. The permission is used only to open this extension's own page in the side panel; it gives no access to the content of the pages the user visits.
```

### データ使用（Data usage）

開発者が受け取るデータは無いので、どの項目にもチェックを入れない。同期は Chrome
自身の同期（ユーザーの Google アカウント）で行われ、開発者のサーバーは通らない。
下の 3 つの証明にはすべて同意する（売らない・用途外に使わない・信用力の判断に使わない）。

## プライバシーポリシー URL

ストアの掲載情報の「プライバシーポリシーのURL」欄に入れる。

```text
https://nzw.jp/privacy-policy.html
```

日英併記で、nzw が出しているアプリ・拡張機能すべてが対象と書いてあるため、
SimpleMemoPad 用に書き足す必要はない。Quick Query Question も同じ URL を使っている。

---

## これまでの文面

### v1.5.1 まで（2023-09-04 〜 2026-09-20）

```text
It is the best app for leaving a little memo when operating the browser.
You can leave notes on multiple tabs and leave them in a file.
You can also change the font size.
```

manifest.json の description は `This app is a simple memo pad.` だった。

### プライバシーポリシー URL（〜2026-09-20）

```text
https://sites.google.com/view/privacy-policy-nzwdev
```

Google サイトで公開していたもの。2026-09-20 時点でまだ開けるが、更新しているのは
nzw.jp 側なので、ストアの登録はそちらへ差し替える。
