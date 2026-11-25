/* 跨设备同步：把 kaoyan-* 的 localStorage 记录统一存到仓库根目录 state.json
   读：公开 raw，任何设备不需要 token 就能拿到别人的进度
   写：需要细粒度 token（只勾这个仓库的 Contents 读写），存本机浏览器
   合并：按每个 key 的时间戳取新，整份文档 last-write-wins */
(function () {
  "use strict";

  var OWNER = "Snowwalk-coalzero", REPO = "kaoyan", BRANCH = "main", PATH = "state.json";
  var TOKEN_KEY = "dshy-gh-token";          // 故意不带 kaoyan- 前缀，永远不会被推送出去
  var META_KEY = "kaoyan-sync-ts";          // 每个 key 的最后修改时间
  var RELOAD_KEY = "kaoyan-sync-reloaded";
  var PREFIX = "kaoyan-";
  var SKIP = { "kaoyan-sync-ts": 1, "kaoyan-sync-reloaded": 1, "kaoyan-sync-shadow": 1 };

  var dirty = {}, timer = null, busy = false, ui = null;

  function token() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } }
  function meta() {
    try { return JSON.parse(localStorage.getItem(META_KEY) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function setMeta(m) { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {} }

  function localDoc() {
    var keys = {}, m = meta();
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf(PREFIX) !== 0 || SKIP[k]) continue;
      keys[k] = { t: m[k] || 0, v: localStorage.getItem(k) };
    }
    return { v: 1, keys: keys };
  }

  function markDirty(k) {
    if (k.indexOf(PREFIX) !== 0 || SKIP[k]) return;
    var m = meta(); m[k] = Date.now(); setMeta(m);
    dirty[k] = 1;
    if (timer) clearTimeout(timer);
    timer = setTimeout(push, 2500);
  }

  function applyDoc(doc) {
    if (!doc || !doc.keys) return false;
    var changed = false, m = meta();
    for (var k in doc.keys) {
      if (!Object.prototype.hasOwnProperty.call(doc.keys, k)) continue;
      if (k.indexOf(PREFIX) !== 0 || SKIP[k]) continue;
      var r = doc.keys[k] || {}, rt = r.t || 0, cur = localStorage.getItem(k), lm = m[k] || 0;
      if (cur === r.v) { if (rt > lm) { m[k] = rt; changed = true; } continue; }
      if (rt > lm) { localStorage.setItem(k, r.v); m[k] = rt; changed = true; }
    }
    setMeta(m);
    return changed;
  }

  function mergeDocs(a, b) {
    var out = { v: 1, keys: {} }, k;
    for (k in a.keys) out.keys[k] = a.keys[k];
    for (k in b.keys) {
      var x = out.keys[k];
      if (!x || (b.keys[k].t || 0) > (x.t || 0)) out.keys[k] = b.keys[k];
    }
    return out;
  }

  function b64(str) {
    var bin = unescape(encodeURIComponent(str)), out = "";
    for (var i = 0; i < bin.length; i++) out += String.fromCharCode(bin.charCodeAt(i));
    return btoa(out);
  }

  function status(txt, ok) {
    if (!ui) return;
    ui.title = txt;
    ui.textContent = ok === 0 ? "☁ 本地" : ok === 1 ? "☁ 已同步" : "☁ " + txt.slice(0, 12);
  }

  function push() {
    var tk = token();
    if (!tk) { status("未设置 token：改动只在本机", 0); return; }
    if (busy) return;
    busy = true;
    var url = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + PATH + "?ref=" + BRANCH;
    var H = { Authorization: "Bearer " + tk, Accept: "application/vnd.github+json" };
    fetch(url, { headers: H, cache: "no-store" }).then(function (r) {
      return r.ok ? r.json() : { sha: null };
    }, function () { return { sha: null }; }).then(function (meta0) {
      var remote = { v: 1, keys: {} };
      try { if (meta0.content) remote = JSON.parse(decodeURIComponent(escape(atob(meta0.content.replace(/\s/g, ""))))); } catch (e) {}
      var merged = mergeDocs(remote, localDoc());
      applyDoc(merged);
      var body = {
        message: "state: sync " + new Date().toISOString().slice(0, 16).replace("T", " "),
        content: b64(JSON.stringify(merged, null, 1)),
        branch: BRANCH
      };
      if (meta0.sha) body.sha = meta0.sha;
      return fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + PATH, {
        method: "PUT",
        headers: Object.assign({ "Content-Type": "application/json" }, H),
        body: JSON.stringify(body)
      });
    }).then(function (r) {
      dirty = {};
      status(r && r.ok ? "已同步 " + new Date().toTimeString().slice(0, 5) : "推送失败 " + (r && r.status), r && r.ok ? 1 : 2);
    }, function () {
      status("推送失败：网络", 2);
    }).then(function () { busy = false; });
  }

  function pull(reloadIfNewer) {
    fetch(PATH + "?cb=" + Date.now(), { cache: "no-store" }).then(function (r) {
      if (r.status === 404) { status("云端还没有记录", 0); return null; }
      if (!r.ok) throw 0;
      return r.json();
    }).then(function (doc) {
      if (!doc) return;
      var changed = applyDoc(doc);
      if (changed && reloadIfNewer && !sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, "1");
        location.reload();
        return;
      }
      if (changed) {
        // 已经渲染过，提示刷新
        if (ui) { ui.textContent = "☁ 有新记录"; ui.title = "别的设备更新了记录，点一下刷新"; }
        ui && ui.addEventListener("click", function () { location.reload(); }, { once: true });
        return;
      }
      status("已同步 " + new Date().toTimeString().slice(0, 5), 1);
    }, function () { status("离线，用本机记录", 0); });
  }

  // 拦 setItem，记下哪个 key 变了
  try {
    var orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      orig.call(this, k, v);
      if (this === window.localStorage) { try { markDirty(k); } catch (e) {} }
    };
  } catch (e) {}

  function mount() {
    if (!document.body) return;
    ui = document.createElement("button");
    ui.id = "syncBtn";
    ui.textContent = "☁";
    ui.setAttribute("style", "position:fixed;right:14px;bottom:14px;z-index:60;font:600 12px/1 -apple-system,system-ui,sans-serif;color:#c9d1d9;background:#171a21;border:1px solid #2a2f3a;border-radius:99px;padding:9px 12px;opacity:.85;cursor:pointer");
    ui.title = "同步";
    ui.addEventListener("click", function () {
      var tk = token();
      if (!tk) {
        var t = prompt("粘贴 GitHub token（细粒度，只勾这个仓库的 Contents 读写）：");
        if (!t) return;
        try { localStorage.setItem(TOKEN_KEY, t.trim()); } catch (e) {}
        status("正在推送…", 2);
        push();
        return;
      }
      status("正在推送…", 2);
      push();
    });
    document.body.appendChild(ui);
    status("载入中", 2);
    pull(true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
