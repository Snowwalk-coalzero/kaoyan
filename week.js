/* 一周计划：日期自己算，内容按阶段生成，不再需要每晚手工更新
   今天这一块：如果 today.js 里的日期就是今天，用它的手写版本；否则用生成的版本 */
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
  var TOTAL_MATH = 18, TOTAL_POL = 8;

  var MILES = [
    { nm: "825", items: [
      { id: "p1", tx: '第 1–6 章名词过完一轮（<a href="terms.html">去自测</a>）' },
      { id: "p2", tx: '论述 26 题各手写一遍（<a href="qa.html">看题</a>）' },
      { id: "p3", tx: '九张图徒手默画 2 遍' },
      { id: "p4", tx: '第 7–9 章名词补完（冲击地压、岩层移动、研究方法）' }
    ]},
    { nm: "数学", items: [
      { id: "m1", tx: '错题本回看第 1 轮' },
      { id: "m2", tx: '错题本回看第 2 轮' },
      { id: "m3", tx: '公式手写默写一遍' }
    ]},
    { nm: "政治", items: [
      { id: "g1", tx: '肖1000 马原错题刷一遍' },
      { id: "g2", tx: '肖1000 史纲错题刷一遍' },
      { id: "g3", tx: '肖八选择题 8 套做完' },
      { id: "g4", tx: '大题框架 12 个背熟' }
    ]},
    { nm: "英语", items: [
      { id: "e1", tx: '阅读补完 15 篇' },
      { id: "e2", tx: '大小作文各写 3 篇' },
      { id: "e3", tx: '高频单词过 3 遍' }
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

  // ---- 生成某一天 ----
  function buildDay(d) {
    var n = nOf(d), ph = phaseOf(d), wd = d.getDay(), b = [];
    var year = ph === 0 ? 2009 + Math.floor((n - 1) / 2) : ph === 1 ? 2017 + (n - 10) : 2022;
    var paper = ph === 0 ? 2005 + Math.floor((n - 1) / 4) : ph === 1 ? 2013 + Math.floor((n - 10) / 4) : 2021;
    var tno = ph === 2 ? 1 : ((n - 1) % 4) + 1;
    var spk1 = Math.min(26, ((n - 1) * 2) % 26 + 1), spk2 = Math.min(26, spk1 + 1);
    var unit = Math.min(25, Math.max(1, n));

    function word(t, note) { b.push({ s: "06:50", e: "07:20", k: "eng", t: t || "英语：单词 30′", note: note }); }
    function pol(t, note) { b.push({ s: "07:25", e: "08:25", k: "pol", t: t || "政治：背考点 30′ + 选择 20 道", note: note }); }
    function words(note) { word("英语：单词 30′", note || ("words.html 第 " + unit + " 单元，60 个")); }

    if (wd === 3) {                    // 周三：实验日，数学切半套
      words();
      pol("政治：背考点 30′ + 肖八错题 30′", "史纲画时间轴，比背字快");
      b.push({ s: "08:30", e: "09:55", k: "math", t: "数学：真题半套（选择填空 + 前两大题）", note: "限时 85′，" + year + " 年卷，实验日只能切着做" });
      b.push({ s: "10:10", e: "12:00", k: "cls", t: "课：按课表（CAD）" });
      b.push({ s: "13:10", e: "14:10", k: "math", t: "数学：半套剩下的大题 + 当堂记错题", note: "三类：算错 / 不会 / 看错题干" });
      b.push({ s: "14:20", e: "15:20", k: "pro", t: "825 手写：论述 1 题 + 对图", note: "第 " + spk1 + " 题，25′ 写完再对着图查漏项" });
      b.push({ s: "16:10", e: "18:00", k: "cls", t: "课：实验（按课表）" });
      b.push({ s: "19:00", e: "20:50", k: "cls", t: "课：井巷断面图设计" });
      b.push({ s: "21:00", e: "22:00", k: "eng", t: "英语：精读 1 篇（" + paper + " Text " + tno + "）", note: "18′ 做完 + 30′ 查词译文；课最多的一天，宁可短也要做一篇" });
      b.push({ s: "22:10", e: "22:40", k: "pro", t: "825 口述：名词 10 条", note: "今天只保这个" });
    } else if (wd === 6) {             // 周六：整卷
      words();
      b.push({ s: "08:30", e: "11:30", k: "math", t: "数学：整卷模考", note: ph === 2 ? "2022 卷，按考试时间，不出去、不查书" : year + " 年卷，按考试时间" });
      b.push({ s: "13:30", e: "16:30", k: "pro", t: "825：整卷模考", note: "名词 10 条 + 论述 2 题全写，练笔速" });
      b.push({ s: "17:00", e: "18:00", k: "eng", t: "英语：精读 1 篇 + 对答案" });
      b.push({ s: "19:00", e: "20:30", k: "math", t: "数学：整卷批改 + 错题归类" });
      b.push({ s: "20:40", e: "21:20", k: "pol", t: "政治：错题回看 + 大题框架 1 个", note: "框架三段：原理、结合材料、收一句" });
    } else if (wd === 0) {             // 周日：两科整卷 + 复盘
      words("回看这周标红的词");
      b.push({ s: "08:30", e: "11:30", k: "pol", t: "政治：整卷模考", note: "选择限时 50′，大题只写要点" });
      b.push({ s: "13:30", e: "15:30", k: "eng", t: "英语：整卷模考（阅读 + 作文手写）", note: "不查词，不翻模板；作文 40′ 内写完" });
      b.push({ s: "15:45", e: "16:45", k: "eng", t: "英语：卷子精析，只挑 2 道深挖", note: "归因：词不认识 / 句子没读懂 / 选项没看清" });
      b.push({ s: "19:00", e: "20:30", k: "pro", t: "825：名词回看 + 下周清单", note: "错的标进错题本" });
      b.push({ s: "20:40", e: "21:20", k: "pro", t: "825：论述二轮提纲（第 " + spk1 + "、" + spk2 + " 题）", note: "只写三段骨架，不写全文" });
      b.push({ s: "21:20", e: "21:40", k: "eng", t: "三栏错题本 + 下周计划", note: "这周英语做了几篇、作文写了几篇，写数字" });
    } else {                           // 周一、二、四、五：完整日
      words();
      pol();
      if (ph === 0) {
        b.push({ s: "08:30", e: "11:30", k: "math", t: (n % 2 ? "数学：" + year + " 卷限时一套" : "数学：上一套批改 + 错题重做"), note: n % 2 ? "170′，手写，不查书" : "三类分开，只记思路不抄步骤" });
      } else {
        b.push({ s: "08:30", e: "11:30", k: "math", t: "数学：" + (ph === 1 ? year + " 卷限时一套" : "错题本 2022 卷回看"), note: "170′，手写，不查书" });
      }
      b.push({ s: "13:30", e: "15:00", k: "pro", t: "825 手写：论述 2 题", note: ph === 2 ? "二轮只写提纲：第 " + spk1 + "、" + spk2 + " 题" : "第 " + spk1 + "、" + spk2 + " 题，各 25′" });
      b.push({ s: "15:15", e: "16:15", k: "eng", t: "英语：精读 1 篇（" + paper + " Text " + tno + "）", note: "三遍法：18′ 做 → 查词译句 → 明天回看错因" });
      b.push({ s: "16:30", e: "17:30", k: "math", t: "数学：上午卷错题 + 归类" });
      b.push({ s: "19:30", e: "20:30", k: "eng", t: n % 2 ? "英语：长难句 20′ + 小作文 1 篇（手写 25′）" : "英语：新题型 1 篇 + 作文框架默写", note: n % 2 ? "写完对着范文找三处不一样的地方" : "七选五 30′，大作文三段骨架 30′" });
      b.push({ s: "20:40", e: "21:30", k: "pro", t: "825 口述：名词 20 条", note: "只说，别翻答案" });
      b.push({ s: "21:35", e: "21:50", k: "eng", t: "三栏错题本 15′", note: "英语一块、数学一块，只写错因一行" });
    }
    return { d: d, n: n, ph: ph, name: weekName(d), blocks: b };
  }

  // ---- 状态 ----
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
      return { checks: s.checks || {}, mathDone: s.mathDone || 0, polDone: s.polDone || 0, miles: s.miles || {}, ts: s.ts || 0 };
    } catch (e) { return { checks: {}, mathDone: 0, polDone: 0, miles: {}, ts: 0 }; }
  }
  function save() {
    st.ts = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    try {
      fetch("api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ week: st }) }).catch(function () {});
    } catch (e) {}
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
    if (hd) hd.textContent = diff >= 0 ? "剩 " + diff + " 天。落下的不补。" : "考完了。落下的不补。" ;
    var info = document.getElementById("examInfo");
    if (info) info.innerHTML = "2026.12.19 <span class='faint'>· 周六</span>";
    var ph = PHASES[phaseOf(today)];
    var sub = document.getElementById("sub");
    if (sub) sub.textContent = ph.nm + " · " + md(today) + "–" + md(addDays(today, 6)) + " · 日期自己算，打开就是对的";
    var pct = Math.min(100, Math.round(st.mathDone * 100 / TOTAL_MATH));
    var mb = document.getElementById("mathBar"), mp = document.getElementById("mathProg");
    if (mb) mb.style.width = pct + "%";
    if (mp) mp.textContent = st.mathDone + " / " + TOTAL_MATH;
    var pp = Math.min(100, Math.round(st.polDone * 100 / TOTAL_POL));
    var pb = document.getElementById("polBar"), pp2 = document.getElementById("polProg");
    if (pb) pb.style.width = pp + "%";
    if (pp2) pp2.textContent = st.polDone + " / " + TOTAL_POL;
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
      note = "";
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
        }).join("") +
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
