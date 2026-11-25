/* 一周计划：日期自己算，内容按阶段 + 实际进度生成
   - 课表在 CLASS_PLAN 里改（一行一处），改完推一次就行，以后不用再动
   - 今天这一块：如果 today.js 里的日期就是今天，用它的手写版本；否则用生成版
   - 日型：周六整卷日 / 周日政治英语日 / 无课日用固定模板 / 有课日用 packer 塞短块 */
(function () {
  "use strict";

  var KEY = "kaoyan-week-v1";
  var EXAM = new Date(2026, 11, 19);          // 2026-12-19
  var START = new Date(2026, 10, 25);         // 计划第一天 11.25
  var PHASES = [
    { nm: "基础期", from: "2026-11-25", to: "2026-12-03" },   // n 1..9
    { nm: "强化期", from: "2026-12-04", to: "2026-12-13" },   // n 10..19
    { nm: "冲刺期", from: "2026-12-14", to: "2026-12-18" }    // n 20..24
  ];
  var TOTAL_MATH = 14, TOTAL_POL = 8;

  // ---- 课表（改这里）----
  // wd: 0=周日 1=周一 … 6=周六；from/until 是生效区间（含），不写 from 就从现在起
  // 11.25 周三：满课，上午 + 下午 + 晚上三节；12.02 起周三只有上午 + 下午
  var CLASS_PLAN = [
    { wd: 3, from: "2026-11-25", until: "2026-11-25", blocks: [
      ["10:10", "12:00", "课：CAD"],
      ["16:10", "18:00", "课：实验"],
      ["19:00", "21:00", "课：CAD（晚）"]
    ]},
    { wd: 3, from: "2026-11-26", until: "2026-12-02", blocks: [
      ["10:10", "12:00", "课：CAD"],
      ["16:10", "18:00", "课：实验"]
    ]},
    { wd: 4, until: "2026-11-26", blocks: [
      ["08:30", "11:30", "课：按课表（周四，这周最后一周）"]
    ]}
  ];

  // ---- 有课日的格子（packer 用）----
  var SLOTS = [
    ["06:50", "07:20"], ["07:25", "08:25"], ["08:30", "09:55"], ["10:10", "11:40"],
    ["13:10", "14:40"], ["14:50", "16:00"], ["16:10", "18:00"], ["19:00", "20:10"],
    ["20:20", "21:20"], ["21:30", "21:50"]
  ];

  var MILES = [
    { nm: "825", items: [
      { id: "p1", tx: '第 1–6 章名词过完一轮（<a href="terms.html">去自测</a>）' },
      { id: "p2", tx: '论述 26 题各手写一遍（<a href="qa.html">看题</a>）' },
      { id: "p3", tx: '九张图徒手默画 2 遍' },
      { id: "p4", tx: '第 7–9 章名词补完（冲击地压、岩层移动、研究方法）' }
    ]},
    { nm: "数学", items: [
      { id: "m1", tx: '15–22 年八套走完' },
      { id: "m2", tx: '错题本回看第 1 轮' },
      { id: "m3", tx: '错题本回看第 2 轮' },
      { id: "m4", tx: '公式手写默写一遍' }
    ]},
    { nm: "政治", items: [
      { id: "g1", tx: '肖八第 5–8 套选择做完' },
      { id: "g2", tx: '肖四选择 4 套' },
      { id: "g3", tx: '肖四大题框架 12 个背熟' },
      { id: "g4", tx: '肖八错题按四类归档' }
    ]},
    { nm: "英语", items: [
      { id: "e1", tx: '精读 12 篇（句子为主）' },
      { id: "e2", tx: '小作文 5 类模板手写' },
      { id: "e3", tx: '大作文三段骨架 + 3 篇成文' },
      { id: "e4", tx: '高频词 2147 过 3 遍' }
    ]}
  ];

  function iso(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function md(d) { return (d.getMonth() + 1) + "." + pad(d.getDate()); }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function daysFrom(a, b) { return Math.round((b - a) / 86400000); }
  function nOf(d) { return daysFrom(START, d) + 1; }          // 11.25 → 1
  function phaseOf(d) {
    var s = iso(d);
    for (var i = 0; i < PHASES.length; i++) if (s >= PHASES[i].from && s <= PHASES[i].to) return i;
    return s < PHASES[0].from ? 0 : 2;
  }
  function weekName(d) { return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()]; }
  function toMin(t) { var a = t.split(":"); return (+a[0]) * 60 + (+a[1]); }
  function hhmm(v) { return pad(Math.floor(v / 60)) + ":" + pad(v % 60); }

  // 这一天的课（相邻或重叠的课合并成一块）
  function classesOn(d) {
    var s = iso(d), out = [];
    CLASS_PLAN.forEach(function (c) {
      if (c.wd !== d.getDay()) return;
      if (c.from && s < c.from) return;
      if (c.until && s > c.until) return;
      c.blocks.forEach(function (b) { out.push({ s: b[0], e: b[1], t: b[2] }); });
    });
    out.sort(function (a, b) { return toMin(a.s) - toMin(b.s); });
    var merged = [];
    out.forEach(function (c) {
      var last = merged[merged.length - 1];
      if (last && toMin(c.s) <= toMin(last.e)) {
        if (toMin(c.e) > toMin(last.e)) last.e = c.e;
        last.t = last.t.replace(/（晚）$/, "");
      } else merged.push({ s: c.s, e: c.e, t: c.t });
    });
    return merged;
  }

  // ---- 生成某一天 ----
  function buildDay(d) {
    var n = nOf(d), ph = phaseOf(d), wd = d.getDay(), cls = classesOn(d);
    var tight = cls.length > 0;

    // 进度（跟着 mathDone / polDone 走）
    var doneYr = 2009 + st.mathDone;                      // 做完 14 年卷 → 2015
    var off = ph === 0 ? Math.floor((n - 1) / 2) : ph === 1 ? Math.min(4 + (n - 10), 7) : 7;
    var year = Math.min(2022, doneYr + off);
    var paper = ph === 0 ? 2005 + Math.floor((n - 1) / 4) : ph === 1 ? 2012 + Math.floor((n - 10) / 4) : 2019;
    var tno = ((n - 1) % 4) + 1;
    var polSet = Math.min(TOTAL_POL, st.polDone + 1 + Math.floor((n - 1) / 2));
    var polT = ph === 2 ? "政治：肖四选择 1 套 + 错题回看"
      : (n >= 10 ? "政治：肖四选择 1 套 + 肖八错题回看"
        : "政治：背考点 30′ + 肖八第 " + polSet + " 套（限时 50′）");
    var spk1 = Math.min(25, 5 + (n - 1) * 2), spk2 = Math.min(26, spk1 + 1);
    var nounNote = n <= 2 ? "第一章还剩 40 条，这两天收完再进第二章" : "按章往下，只说，别翻答案";
    var unit = Math.min(25, Math.max(1, n));

    var b = [], dropped = 0;
    function mk(s, e, k, t, note) { b.push({ s: s, e: e, k: k, t: t, note: note }); }
    var polNote = "做完当天对答案，错题按马原/毛中特/史纲/时政分";
    var wordT = "英语：单词 30′";
    var wordN = "words.html 第 " + unit + " 单元，60 个；三秒判定，说不出的划红";

    if (wd === 6) {                                  // 周六：数学 + 825 整卷
      mk("06:50", "07:20", "eng", wordT, "words.html 第 " + unit + " 单元，三秒判定");
      mk("08:30", "11:30", "math", "数学：" + year + " 年卷整卷模考", "170′，按考试时间，不出去、不查书");
      mk("13:10", "16:10", "pro", "825：整卷模考", "名词 10 条 + 论述 2 题全写，练笔速");
      mk("16:20", "17:30", "eng", "英语：精读 1 篇（" + paper + " Text " + tno + "）+ 对答案", "18′ 做 + 查词译句");
      mk("19:00", "20:30", "math", "数学：整卷批改 + 错题归类", "三类：算错 / 不会 / 看错题干");
      mk("20:40", "21:30", "pol", "政治：错题回看 + 大题框架 1 个", "框架三段：原理、结合材料、收一句");
    } else if (wd === 0) {                           // 周日：政治 + 英语整卷
      mk("06:50", "07:20", "eng", wordT, "回看这周标红的词");
      mk("08:30", "10:30", "pol", "政治：整卷模考", "选择限时 50′，大题只写要点");
      mk("10:40", "12:40", "eng", "英语：整卷模考（阅读 + 作文手写）", "不查词、不翻模板；作文 40′ 内写完");
      mk("13:10", "14:20", "eng", "英语：卷子精析，只挑 2 道深挖", "归因：词不认识 / 句子没读懂 / 选项没看清");
      mk("14:50", "16:20", "pro", "825：名词回看 + 下周清单", "错的标进错题本");
      mk("16:30", "17:40", "pro", "825：论述二轮提纲（第 " + spk1 + "、" + spk2 + " 题）", "只写三段骨架，不写全文");
      mk("19:00", "19:30", "eng", "三栏错题本 + 这周数字盘点", "英语几篇、作文几篇，写数字");
    } else if (!tight) {                             // 无课日：固定模板
      mk("06:50", "07:20", "eng", wordT, wordN);
      mk("07:25", "08:25", "pol", polT, polNote);
      if (ph === 2) {
        mk("08:30", "10:00", "math", "数学：错题本 2022 卷回看", "只看错因和你当时没写出的那一步");
        mk("13:10", "14:20", "pro", "825 手写：论述第 " + spk1 + "、" + spk2 + " 题", "二轮提纲，各 15′");
        mk("15:15", "16:15", "eng", "英语：大作文默写 1 篇（限时 25′）", "写完对着模板改三处，不重写整篇");
        mk("16:30", "17:30", "eng", "英语：模板回看 + 卷子精析 1 道", "只挑一道深挖，别摊开");
      } else {
        mk("08:30", "11:20", "math", "数学：" + year + " 年卷限时一套", "170′，手写，不查书");
        mk("13:10", "15:00", "pro", "825 手写：论述第 " + spk1 + "、" + spk2 + " 题", "各 25′，写完对图查漏项");
        mk("15:15", "16:15", "eng", "英语：精读 1 篇（" + paper + " Text " + tno + "）", "18′ 做 → 查词译句 → 明天回看错因");
        mk("16:30", "17:30", "math", "数学：上午卷错题 + 归类", "只记思路，不抄步骤");
      }
      mk("19:30", "20:30", "eng", ph === 2 ? "英语：大作文成文 1 篇（限时 25′）" : (n % 2 ? "英语：长难句 20′ + 小作文 1 篇（手写 25′）" : "英语：新题型 1 篇 + 作文框架默写"),
        ph === 2 ? "写完对模板改三处" : (n % 2 ? "写完对着范文找三处不一样" : "七选五 30′，骨架 30′"));
      mk("20:40", "21:30", "pro", "825 口述：名词 20 条", nounNote);
      mk("21:35", "21:50", "eng", "三栏错题本 15′", "英语一块、数学一块，只写错因一行");
    } else {                                         // 有课日：packer 塞短块
      var tasks = [];
      function T(k, t, note, dur) { tasks.push({ k: k, t: t, note: note, dur: dur }); }
      T("eng", wordT, wordN, 30);
      T("pol", polT, polNote, 50);
      if (ph === 2) T("math", "数学：错题本回看 1 节", "只看错因和你当时没写出的那一步", 60);
      else T("math", "数学：" + year + " 年卷半套（选择填空 + 前两大题）", "有课只能切着做，85′ 到点停", 85);
      T("pro", "825 手写：论述第 " + spk1 + " 题", "25′ 写完再对图查漏项", 30);
      T("eng", ph === 2 ? "英语：大作文默写 1 篇（限时 25′）" : "英语：精读 1 篇（" + paper + " Text " + tno + "）",
        ph === 2 ? "写完对着模板改三处" : "有课只做一篇：18′ 做 + 20′ 查词译句，别展开", 45);
      T("pro", "825 口述：名词 20 条", nounNote, 25);
      T("eng", "三栏错题本 15′", "英语一块、数学一块，只写错因一行", 15);

      var grid = SLOTS.map(function (sl) {
        var c = null;
        cls.forEach(function (k) { if (toMin(sl[0]) < toMin(k.e) && toMin(sl[1]) > toMin(k.s)) c = k; });
        return { s: sl[0], e: sl[1], cls: c, used: false };
      });
      var cursor = 0;
      tasks.forEach(function (task) {
        var i = cursor, hit = -1;
        while (i < grid.length) {
          if (grid[i].cls || grid[i].used) { i++; continue; }
          var j = i, span = 0, ok = true;
          while (j < grid.length && span < task.dur) {
            if (grid[j].cls || grid[j].used) { ok = false; break; }
            if (j > i && toMin(grid[j].s) !== toMin(grid[j - 1].e)) { ok = false; break; }
            span += toMin(grid[j].e) - toMin(grid[j].s);
            j++;
          }
          if (ok && span >= task.dur) { hit = j - 1; break; }
          i++;
        }
        if (hit < 0) { dropped++; return; }
        var ks = i;
        for (var k = i; k < hit; k++) grid[k].used = true;
        var startM = toMin(grid[ks].s), endM = Math.min(toMin(grid[hit].e), startM + task.dur);
        b.push({ s: grid[ks].s, e: hhmm(endM), k: task.k, t: task.t, note: task.note });
        // 格子没用完：把剩下的时间留成新格子，后面还能接着塞
        if (endM < toMin(grid[hit].e)) {
          grid[hit] = { s: hhmm(endM), e: grid[hit].e, cls: null, used: false };
          cursor = hit;
        } else {
          grid[hit].used = true;
          cursor = hit + 1;
        }
      });
    }

    // 课插进来
    var seen = {};
    cls.forEach(function (c) {
      var key = c.s + "-" + c.e + c.t;
      if (seen[key]) return; seen[key] = 1;
      b.push({ s: c.s, e: c.e, k: "cls", t: c.t, note: "" });
    });
    b.sort(function (x, y) { return toMin(x.s) - toMin(y.s); });

    return { d: d, n: n, ph: ph, name: weekName(d), blocks: b, dropped: dropped };
  }

  // ---- 状态 ----
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
      return { checks: s.checks || {}, mathDone: typeof s.mathDone === "number" ? s.mathDone : 6, polDone: typeof s.polDone === "number" ? s.polDone : 4, miles: s.miles || {}, ts: s.ts || 0 };
    } catch (e) { return { checks: {}, mathDone: 6, polDone: 4, miles: {}, ts: 0 }; }
  }
  function save() {
    st.ts = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }
  function toast(m) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = m; el.classList.add("on");
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("on"); }, 1600);
  }

  var st = load();
  var today = new Date();
  today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var DAYS = [];
  for (var i = 0; i < 7; i++) DAYS.push(buildDay(addDays(today, i)));

  function renderTop() {
    var diff = daysFrom(today, EXAM);
    var el = document.getElementById("days");
    if (el) el.textContent = diff >= 0 ? diff : "0";
    var hd = document.getElementById("hintDays");
    if (hd) hd.textContent = diff >= 0 ? "剩 " + diff + " 天。落下的不补。" : "考完了。落下的不补。";
    var info = document.getElementById("examInfo");
    if (info) info.innerHTML = "2026.12.19 <span class='faint'>· 周六</span>";
    var ph = PHASES[phaseOf(today)];
    var sub = document.getElementById("sub");
    if (sub) sub.textContent = ph.nm + " · " + md(today) + "–" + md(addDays(today, 6)) + " · 有课的排课，其余排活";
    var pct = Math.min(100, Math.round(st.mathDone * 100 / TOTAL_MATH));
    var mb = document.getElementById("mathBar"), mp = document.getElementById("mathProg");
    if (mb) mb.style.width = pct + "%";
    if (mp) mp.textContent = st.mathDone > 0 ? ("做到 " + (2008 + st.mathDone) + " 年（09 起共 " + TOTAL_MATH + " 套，还剩 " + (TOTAL_MATH - st.mathDone) + " 套）") : ("0 / " + TOTAL_MATH);
    var pp = Math.min(100, Math.round(st.polDone * 100 / TOTAL_POL));
    var pb = document.getElementById("polBar"), pp2 = document.getElementById("polProg");
    if (pb) pb.style.width = pp + "%";
    if (pp2) pp2.textContent = st.polDone > 0 ? ("第 " + st.polDone + " 套完 / " + TOTAL_POL) : ("0 / " + TOTAL_POL);
  }

  var KK = { pol: "政治", eng: "英语", math: "数学", pro: "825", cls: "课" };

  function renderToday() {
    var box = document.getElementById("today");
    if (!box) return;
    if (daysFrom(today, EXAM) < 0) { box.style.display = "none"; return; }
    var T = window.TODAY, items = null, dateTxt = md(today), note = "";
    if (T && T.items && T.items.length && String(T.date || "").replace(/^0/, "") === String(md(today)).replace(/^0/, "")) {
      items = T.items; note = T.note || "";
    } else {
      items = DAYS[0].blocks.map(function (b) { return { s: b.s, e: b.e, k: b.k, t: b.t, note: b.note, done: !!st.checks[iso(today) + "-" + b.s] }; });
      note = DAYS[0].dropped ? "（有 " + DAYS[0].dropped + " 项没塞进今天，明天接着做）" : "";
    }
    box.style.display = "";
    box.innerHTML =
      '<div class="today-h"><span class="td">今天</span><span class="tn num">' + dateTxt + '</span>' +
      (note ? '<div class="tnote">' + note + '</div>' : '') + '</div>' +
      items.map(function (it) {
        return '<div class="titem' + (it.done ? ' done' : '') + '">' +
          '<span class="tnum">' + (it.s || '') + (it.e && it.e !== it.s ? '–' + it.e : '') + '</span>' +
          '<span class="k ' + it.k + '">' + (KK[it.k] || '') + '</span>' +
          '<span class="tt">' + it.t + '</span>' +
          (it.note ? '<span class="tn2">' + it.note + '</span>' : '') +
          '</div>';
      }).join("");
  }

  function slotHtml(day, bi, b) {
    var key = iso(day.d) + "-" + b.s;
    var done = !!st.checks[key];
    return '<div class="slot' + (done ? ' done' : '') + '" data-k="' + key + '">' +
      '<span class="chk">✓</span>' +
      '<div class="col">' +
        '<div class="top"><span class="t num">' + b.s + '–' + b.e + '</span>' +
        '<span class="k ' + b.k + '">' + (KK[b.k] || '') + '</span></div>' +
        '<div class="task">' + b.t + '</div>' +
        (b.note ? '<div class="note">' + b.note + '</div>' : '') +
      '</div></div>';
  }

  function render() {
    var box = document.getElementById("plan");
    if (!box) return;
    if (daysFrom(today, EXAM) < 0) { box.innerHTML = '<div class="hint">考完了。这一页收在这里，不用再排了。</div>'; return; }
    box.innerHTML = DAYS.map(function (day, di) {
      var open = di === 0;
      return '<div class="day' + (open ? ' open today' : '') + '" data-d="' + di + '">' +
        '<div class="day-head">' +
          '<span class="dname">' + day.name + '</span>' +
          '<span class="ddate num">' + md(day.d) + '</span>' +
          (di === 0 ? '<span class="now">今天</span>' : '') +
          '<span class="meta">' + day.blocks.length + ' 块</span>' +
        '</div>' +
        '<div class="day-body">' + day.blocks.map(function (b, bi) { return slotHtml(day, bi, b); }).join("") + '</div>' +
      '</div>';
    }).join("");
  }

  function renderMiles() {
    var box = document.getElementById("miles");
    if (!box) return;
    box.innerHTML = MILES.map(function (g) {
      var n = 0;
      g.items.forEach(function (it) { if (st.miles[it.id]) n++; });
      return '<div class="card">' +
        '<div class="card-h"><span class="nm">' + g.nm + '</span>' +
        '<span class="pg num">' + n + ' / ' + g.items.length + '</span></div>' +
        g.items.map(function (it) {
          return '<div class="mile' + (st.miles[it.id] ? ' on' : '') + '" data-m="' + it.id + '">' +
            '<span class="bx">✓</span><span class="tx">' + it.tx + '</span></div>';
        }).join('') +
      '</div>';
    }).join("");
  }

  function bind() {
    var plan = document.getElementById("plan");
    if (plan) plan.addEventListener("click", function (e) {
      var head = e.target.closest(".day-head");
      if (head && !e.target.closest(".now")) { head.parentElement.classList.toggle("open"); return; }
      var chk = e.target.closest(".chk");
      if (chk) {
        var slot = chk.parentElement, k = slot.getAttribute("data-k");
        st.checks[k] = !st.checks[k];
        slot.classList.toggle("done", st.checks[k]);
        save();
      }
    });

    var mp = document.getElementById("mathPlus");
    if (mp) mp.addEventListener("click", function () {
      st.mathDone = Math.min(TOTAL_MATH, st.mathDone + 1);
      save(); renderTop(); toast("数学真题 " + st.mathDone + " / " + TOTAL_MATH);
    });
    var pp = document.getElementById("polPlus");
    if (pp) pp.addEventListener("click", function () {
      st.polDone = Math.min(TOTAL_POL, st.polDone + 1);
      save(); renderTop(); toast("肖八选择 " + st.polDone + " / " + TOTAL_POL);
    });
    var rs = document.getElementById("reset");
    if (rs) rs.addEventListener("click", function () {
      if (!confirm("清空这一周的勾选？")) return;
      st.checks = {}; save(); render(); renderToday(); toast("已清空勾选");
    });
    var co = document.getElementById("collapse");
    if (co) co.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".day"), function (d) { d.classList.remove("open"); });
    });
    var mi = document.getElementById("miles");
    if (mi) mi.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      var el = e.target.closest(".mile");
      if (!el) return;
      var id = el.getAttribute("data-m");
      st.miles[id] = !st.miles[id];
      save(); renderMiles();
    });
  }

  renderTop();
  renderToday();
  render();
  renderMiles();
  bind();
})();
