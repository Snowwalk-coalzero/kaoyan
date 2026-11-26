/* 一周计划：日期自己算，内容按阶段 + 实际进度生成
   - 课表按“周”写在 CLASS_WEEKS 里（第 12–15 周，来源：教务处课表截图，2026-11-25）
   - 今天这一块：如果 today.js 里的日期就是今天，用它的手写版本；否则用生成版
   - 日型：周六整卷日 / 周日政治英语日 / 无课日用固定模板 / 有课日按空格子塞短块 */
(function () {
  "use strict";

  var KEY = "kaoyan-week-v1";
  var EXAM = new Date(2026, 11, 19);          // 2026-12-19
  var START = new Date(2026, 10, 25);         // 计划第一天 11.25
  var MATH_START = new Date(2026, 10, 26);    // 数学真题第一套从 11.26 起（11.25 已过，不再回溯）
  var PHASES = [
    { nm: "基础期", from: "2026-11-25", to: "2026-12-03" },   // n 1..9
    { nm: "强化期", from: "2026-12-04", to: "2026-12-13" },   // n 10..19
    { nm: "冲刺期", from: "2026-12-14", to: "2026-12-18" }    // n 20..24
  ];
  var TOTAL_MATH = 18, TOTAL_POL = 8;
  var TOTAL_ESSAY = 26, ESSAY_START = new Date(2026, 10, 26), ESSAY_NO = 5;  // 11.26 起从第 5 题（1–4 已手写完）

  // ---- 课表（按周写，改这里）----
  // wd: 0=周日 1=周一 … 6=周六。灰字「非本周」的课没排进来。
  var CLASS_WEEKS = [
    { from: "2026-11-23", to: "2026-11-29", blocks: [
      [1, "14:00", "15:50", "课：绿色开采技术"],
      [2, "10:10", "12:00", "课：智能采掘系统"],
      [3, "10:10", "12:00", "课：矿山开采设计 CAD"],
      [3, "16:10", "18:00", "课：矿井开拓方式（平面图）"],
      [3, "19:00", "20:50", "课：矿井开拓方式（剖面图）"],
      [4, "08:00", "09:50", "课：矿井通风与安全 C"]
    ]},
    { from: "2026-11-30", to: "2026-12-06", blocks: [
      [1, "14:00", "15:50", "课：绿色开采技术"],
      [2, "10:10", "12:00", "课：智能采掘系统"],
      [3, "10:10", "12:00", "课：矿山开采设计 CAD"],
      [3, "16:10", "18:00", "课：矿井通风系统及通风网络"]
    ]},
    { from: "2026-12-07", to: "2026-12-13", blocks: [
      [1, "14:00", "15:50", "课：绿色开采技术"],
      [2, "10:10", "12:00", "课：智能采掘系统"]
    ]},
    { from: "2026-12-14", to: "2026-12-20", blocks: [
      [1, "14:00", "15:50", "课：绿色开采技术"],
      [2, "10:10", "12:00", "课：智能采掘系统"]
    ]}
  ];

  // ---- 一天的骨架格子（有课日按课切开，剩下的碎片 ≥20′ 才用）----
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
      { id: "m1", tx: '15–26 年十二套走完' },
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

  // 这一天的课
  function classesOn(d) {
    var s = iso(d), wd = d.getDay(), out = [];
    CLASS_WEEKS.forEach(function (w) {
      if (s < w.from || s > w.to) return;
      w.blocks.forEach(function (b) {
        if (b[0] === wd) out.push({ s: b[1], e: b[2], t: b[3] });
      });
    });
    out.sort(function (a, b) { return toMin(a.s) - toMin(b.s); });
    return out;
  }

  // 数学真题第几套：从 MATH_START（11.26，当天才开始排）起，每个非周日排一套
  function mathSeqOf(d) {
    var n = daysFrom(MATH_START, d), k = -1;
    for (var i = 0; i <= n; i++) {
      if (addDays(MATH_START, i).getDay() !== 0) k++;
    }
    return Math.max(0, k);
  }

  // 论述题号：11.26 从第 5 题起，按每天实际排的题数往后推（周六整卷 2 题、周日提纲 2 题、无课日 2 题、有课日 1 题）
  function essayPerDay(d) {
    var wd = d.getDay();
    if (wd === 6 || wd === 0) return 2;
    return classesOn(d).length ? 1 : 2;
  }
  function essaySeqOf(d) {
    var n = daysFrom(ESSAY_START, d), k = 0;
    for (var i = 0; i < n; i++) k += essayPerDay(addDays(ESSAY_START, i));
    return ESSAY_NO + Math.max(0, k);
  }

  // ---- 生成某一天 ----
  function buildDay(d) {
    var n = nOf(d), ph = phaseOf(d), wd = d.getDay(), cls = classesOn(d);
    var tight = cls.length > 0;

    // 数学真题按「第几次出场」排，不按阶段天数推——否则同一周会排到同一年，甚至跳年。
    var mathIdx = mathSeqOf(d);                            // 0 起：每个非周日一套
    var mathYear = Math.min(2026, 2009 + st.mathDone + mathIdx);
    var mathNew = (2009 + st.mathDone + mathIdx) <= 2026;  // 15–26 十二套排完后转错题
    var paper = ph === 0 ? 2005 + Math.floor((n - 1) / 4) : ph === 1 ? 2012 + Math.floor((n - 10) / 4) : 2019;
    var tno = ((n - 1) % 4) + 1;
    var polSet = Math.min(TOTAL_POL, st.polDone + 1 + Math.floor((n - 1) / 2));
    var polT = ph === 2 ? "政治：肖四选择 1 套 + 错题回看"
      : (n >= 10 ? "政治：肖四选择 1 套 + 肖八错题回看"
        : "政治：背考点 30′ + 肖八第 " + polSet + " 套（限时 50′）");
    var spk1 = essaySeqOf(d), spk2 = spk1 + 1, essayNew = spk1 <= TOTAL_ESSAY;
    var nounNote = n <= 2 ? "第一章还剩 40 条，这两天收完再进第二章" : "按章往下，只说，别翻答案";
    var unit = Math.min(25, Math.max(1, n));

    var b = [], dropped = 0;
    function mk(s, e, k, t, note) { b.push({ s: s, e: e, k: k, t: t, note: note }); }
    var polNote = "做完当天对答案，错题按马原/毛中特/史纲/时政分";
    var wordT = "英语：单词 30′";
    var wordN = "words.html 第 " + unit + " 单元，60 个；三秒判定，说不出的划红";

    if (wd === 6) {                                  // 周六：数学 + 825 整卷
      mk("06:50", "07:20", "eng", wordT, "words.html 第 " + unit + " 单元，三秒判定");
      mk("08:30", "11:30", "math", mathNew ? ("数学：" + mathYear + " 年卷整卷模考") : "数学：错题重做成卷（170′）", mathNew ? "170′，按考试时间，不出去、不查书" : "真题已收口；从错题本挑同类题成组重做，掐时间");
      mk("13:10", "16:10", "pro", essayNew ? ("825：整卷模考（名词 10 条 + 论述第 " + spk1 + "、" + spk2 + " 题）") : "825：整卷模考", essayNew ? "论述 2 题全写，练笔速" : "名词 10 条 + 论述抽背 2 题，练笔速");
      mk("16:20", "17:30", "eng", "英语：精读 1 篇（" + paper + " Text " + tno + "）+ 对答案", "18′ 做 + 查词译句");
      mk("19:00", "20:30", "math", mathNew ? "数学：整卷批改 + 错题归类" : "数学：错题归档 + 公式默写", mathNew ? "三类：算错 / 不会 / 看错题干" : "只记错因和你当时没写出的那一步");
      mk("20:40", "21:30", "pol", "政治：错题回看 + 大题框架 1 个", "框架三段：原理、结合材料、收一句");
    } else if (wd === 0) {                           // 周日：政治 + 英语整卷
      mk("06:50", "07:20", "eng", wordT, "回看这周标红的词");
      mk("08:30", "10:30", "pol", "政治：整卷模考", "选择限时 50′，大题只写要点");
      mk("10:40", "12:40", "eng", "英语：整卷模考（阅读 + 作文手写）", "不查词、不翻模板；作文 40′ 内写完");
      mk("13:10", "14:20", "eng", "英语：卷子精析，只挑 2 道深挖", "归因：词不认识 / 句子没读懂 / 选项没看清");
      mk("14:50", "16:20", "pro", "825：名词回看 + 下周清单", "错的标进错题本");
      mk("16:30", "17:40", "pro", essayNew ? ("825：论述二轮提纲（第 " + spk1 + "、" + spk2 + " 题）") : "825：论述提纲抽背", "只写三段骨架，不写全文");
      mk("19:00", "19:30", "eng", "三栏错题本 + 这周数字盘点", "英语几篇、作文几篇，写数字");
    } else if (!tight) {                             // 无课日：固定模板
      mk("06:50", "07:20", "eng", wordT, wordN);
      mk("07:25", "08:25", "pol", polT, polNote);
      if (ph === 2) {
        mk("08:30", "10:00", "math", mathNew ? ("数学：" + mathYear + " 年卷（90′ 压缩：选择填空 + 前两大题）") : "数学：错题本回看 + 公式默写", mathNew ? "只保手感，到点停，不追整卷" : "只看错因和你当时没写出的那一步");
        mk("13:10", "14:20", "pro", essayNew ? ("825 手写：论述第 " + spk1 + "、" + spk2 + " 题") : "825 二轮：提纲抽背", "二轮提纲，各 15′");
        mk("15:15", "16:15", "eng", "英语：大作文默写 1 篇（限时 25′）", "写完对着模板改三处，不重写整篇");
        mk("16:30", "17:30", "eng", "英语：模板回看 + 卷子精析 1 道", "只挑一道深挖，别摊开");
      } else {
        mk("08:30", "11:20", "math", mathNew ? ("数学：" + mathYear + " 年卷限时一套") : "数学：错题本回看 + 公式默写", mathNew ? "170′，手写，不查书" : "真题已收口；错题按题型过，公式手写，不碰新套");
        mk("13:10", "15:00", "pro", essayNew ? ("825 手写：论述第 " + spk1 + "、" + spk2 + " 题") : "825 二轮：提纲抽背", "各 25′，写完对图查漏项");
        mk("15:15", "16:15", "eng", "英语：精读 1 篇（" + paper + " Text " + tno + "）", "18′ 做 → 查词译句 → 明天回看错因");
        mk("16:30", "17:30", "math", mathNew ? "数学：上午卷错题 + 归类" : "数学：错题二轮 + 公式默写", mathNew ? "只记思路，不抄步骤" : "只看错因和你当时没写出的那一步");
      }
      mk("19:30", "20:30", "eng", ph === 2 ? "英语：大作文成文 1 篇（限时 25′）" : (n % 2 ? "英语：长难句 20′ + 小作文 1 篇（手写 25′）" : "英语：新题型 1 篇 + 作文框架默写"),
        ph === 2 ? "写完对模板改三处" : (n % 2 ? "写完对着范文找三处不一样" : "七选五 30′，骨架 30′"));
      mk("20:40", "21:30", "pro", "825 口述：名词 20 条", nounNote);
      mk("21:35", "21:50", "eng", "三栏错题本 15′", "英语一块、数学一块，只写错因一行");
    } else {                                         // 有课日：按课切开格子，塞短块
      var tasks = [];
      function T(k, t, note, dur) { tasks.push({ k: k, t: t, note: note, dur: dur }); }
      T("eng", wordT, wordN, 30);
      T("pol", polT, polNote, 50);
      if (mathNew) T("math", "数学：" + mathYear + " 年卷半套（选择填空 + 前两大题）", "有课只能切着做，85′ 到点停", 85);
      else T("math", "数学：错题本回看 1 节", "真题已排完；只看错因和你当时没写出的那一步", 60);
      T("pro", essayNew ? ("825 手写：论述第 " + spk1 + " 题") : "825 二轮：提纲抽背", "25′ 写完再对图查漏项", 30);
      T("eng", ph === 2 ? "英语：大作文默写 1 篇（限时 25′）" : "英语：精读 1 篇（" + paper + " Text " + tno + "）",
        ph === 2 ? "写完对着模板改三处" : "有课只做一篇：18′ 做 + 20′ 查词译句，别展开", 45);
      T("pro", "825 口述：名词 20 条", nounNote, 25);
      T("eng", "三栏错题本 15′", "英语一块、数学一块，只写错因一行", 15);

      // 骨架格子减掉课，切出来的碎片 ≥20′ 才用
      var segs = [];
      SLOTS.forEach(function (sl) { segs.push([toMin(sl[0]), toMin(sl[1])]); });
      cls.forEach(function (c) {
        var cs = toMin(c.s), ce = toMin(c.e), next = [];
        segs.forEach(function (g) {
          if (ce <= g[0] || cs >= g[1]) { next.push(g); return; }
          if (cs > g[0]) next.push([g[0], cs]);
          if (ce < g[1]) next.push([ce, g[1]]);
        });
        segs = next;
      });
      var grid = [];
      segs.forEach(function (g) {
        if (g[1] - g[0] >= 20) grid.push({ s: hhmm(g[0]), e: hhmm(g[1]), used: false });
      });
      grid.sort(function (a, b) { return toMin(a.s) - toMin(b.s); });

      var cursor = 0;
      tasks.forEach(function (task) {
        var i = cursor, hit = -1;
        while (i < grid.length) {
          if (grid[i].used) { i++; continue; }
          var j = i, span = 0, ok = true;
          while (j < grid.length && span < task.dur) {
            if (grid[j].used) { ok = false; break; }
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
        if (endM < toMin(grid[hit].e)) {
          grid[hit] = { s: hhmm(endM), e: grid[hit].e, used: false };
          cursor = hit;
        } else {
          grid[hit].used = true;
          cursor = hit + 1;
        }
      });
    }

    // 课插进来
    cls.forEach(function (c) {
      b.push({ s: c.s, e: c.e, k: "cls", t: c.t, note: "" });
    });
    b.sort(function (x, y) { return toMin(x.s) - toMin(y.s); });

    return { d: d, n: n, ph: ph, name: weekName(d), blocks: b, dropped: dropped };
  }

  // ---- 状态 ----
  function load() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { s = {}; }
    var out = {
      checks: s.checks || {},
      mathDone: typeof s.mathDone === "number" ? s.mathDone : 6,
      polDone: typeof s.polDone === "number" ? s.polDone : 4,
      miles: s.miles || {},
      ts: s.ts || 0,
      v: s.v || 0
    };
    // 2026-11-26 08:11 博士更正：做完的是 2014 年卷，2014 年以前的全做完；15–22 还没动。
    // 上一版误把 mathDone 升到 14，这里降回 6（09–14 六套）。
    if (out.v < 3) {
      out.mathDone = Math.min(out.mathDone, 6);
      out.v = 3;
      out.ts = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(out)); } catch (e) {}
    }
    return out;
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
    if (sub) sub.textContent = ph.nm + " · " + md(today) + "–" + md(addDays(today, 6)) + " · 课按教务处课表，空档排活";
    var pct = Math.min(100, Math.round(st.mathDone * 100 / TOTAL_MATH));
    var mb = document.getElementById("mathBar"), mp = document.getElementById("mathProg");
    if (mb) mb.style.width = pct + "%";
    if (mp) mp.textContent = st.mathDone >= TOTAL_MATH
      ? (TOTAL_MATH + " / " + TOTAL_MATH + " 套（已全做完，转错题）")
      : (st.mathDone > 0 ? ("做到 " + (2008 + st.mathDone) + " 年卷（共 " + TOTAL_MATH + " 套，还剩 " + (TOTAL_MATH - st.mathDone) + " 套）") : ("0 / " + TOTAL_MATH));
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
      note = DAYS[0].dropped ? "（今天有 " + DAYS[0].dropped + " 项没排进去，明早接着做）" : "";
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
