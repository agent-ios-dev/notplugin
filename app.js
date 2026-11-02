"use strict";
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const dialog = $("#plugin-dialog");
  let products = [], returnFocus = null, toastTimer;
  const stateLabel = (state) => state === "stable" ? "Релиз" : "Бета";
  function size(bytes) { return bytes >= 1048576 ? (bytes / 1048576).toLocaleString("ru-RU", {maximumFractionDigits: 2}) + " МБ" : Math.ceil(bytes / 1024) + " КБ"; }
  function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function toast(text) { clearTimeout(toastTimer); $("#toast").textContent = text; $("#toast").hidden = false; toastTimer = setTimeout(() => { $("#toast").hidden = true; }, 2800); }
  function renderArchive() {
    const selection = $("#archive-product").value;
    const list = $("#release-list"); list.replaceChildren();
    for (const p of products.filter(p => selection === "all" || selection === p.id)) {
      for (const release of p.releases) {
        const row = el("div", "release-row");
        row.append(el("span", "release-name", p.name), el("span", "release-version", release.version), el("span", "release-state", stateLabel(release.state)));
        const download = el("a", "", `Скачать ${size(release.bytes)} ↘`);
        download.href = release.file; download.download = release.file.split("/").pop(); download.setAttribute("aria-label", `Скачать ${p.name} ${release.version}`); row.append(download);
        if (release.note) row.append(el("p", "", release.note)); list.append(row);
      }
    }
  }
  $("#archive-product").addEventListener("change", renderArchive);
  function section(title, items, ordered = false) {
    const block = el("section", "dialog-section"); block.append(el("h3", "", title));
    const list = el(ordered ? "ol" : "ul"); for (const text of items) list.append(el("li", "", text)); block.append(list); return block;
  }
  function closeDialog() {
    if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open");
    document.body.classList.remove("dialog-open"); returnFocus?.focus();
  }
  $(".close-dialog").addEventListener("click", closeDialog);
  dialog.addEventListener("close", () => { document.body.classList.remove("dialog-open"); returnFocus?.focus(); });
  dialog.addEventListener("click", event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && dialog.hasAttribute("open") && typeof dialog.showModal !== "function") closeDialog(); });
  $$("[data-details]").forEach(button => button.addEventListener("click", () => {
    const p = products.find(p => p.id === button.dataset.details); if (!p) { toast("Подробности пока не загрузились. Попробуйте ещё раз."); return; }
    returnFocus = button;
    const content = $("#dialog-content"); content.replaceChildren();
    const title = el("h2", "dialog-title", `${p.name} ${p.version}`); title.id = "dialog-title";
    content.append(title, el("p", "dialog-description", p.description));
    content.append(section("Возможности", p.features), section("Что понадобится", p.requirements), section("Как установить", p.installation, true));
    const notes = el("div", "dialog-notes"); for (const note of p.notes) notes.append(el("p", "", note)); content.append(notes);
    const footer = el("div", "dialog-download"); const download = el("a", "button primary", `Скачать ${p.format} ↓`); download.href = p.file; download.download = p.file.split("/").pop(); footer.append(download, el("span", "", `${stateLabel(p.status)} · ${size(p.bytes)}`)); content.append(footer);
    const checksum = el("div", "checksum"); const label = el("div", "checksum-label"); label.append(el("span", "", "SHA-256")); const copy = el("button", "copy-checksum", "Скопировать"); copy.type = "button";
    copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(p.sha256); copy.textContent = "Скопировано"; } catch (_) { const range = document.createRange(); range.selectNodeContents(checksum.querySelector("code")); const s = window.getSelection(); s.removeAllRanges(); s.addRange(range); copy.textContent = "Хеш выделен"; } });
    label.append(copy); checksum.append(label, el("code", "", p.sha256)); content.append(checksum);
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    document.body.classList.add("dialog-open"); dialog.scrollTop = 0; $(".close-dialog").focus();
  }));
  fetch("catalog.json", {cache:"no-cache"}).then(response => { if (!response.ok) throw Error("catalog"); return response.json(); }).then(data => {
    if (data.schemaVersion !== 1 || !Array.isArray(data.products)) throw Error("schema");
    products = data.products; renderArchive();
  }).catch(() => {
    const list = $("#release-list"); list.replaceChildren(el("p", "loading-note", "Не удалось загрузить архив. Актуальные файлы доступны в каталоге выше."));
  });
})();
