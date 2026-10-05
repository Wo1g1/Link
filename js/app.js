(function () {
  "use strict";

  var TABS = ["links", "calendar", "notices"];

  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var fmt = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };

  var today = new Date();
  var state = {
    events: [],
    eventsError: false,
    view: new Date(today.getFullYear(), today.getMonth(), 1),
    selected: fmt(today)
  };

  /* ---------- 데이터 로드 ---------- */
  function load(path) {
    return fetch(path, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error(path + " " + res.status);
      return res.json();
    });
  }

  function showError(el, name) {
    el.textContent = "";
    var p = document.createElement("div");
    p.className = "empty";
    p.textContent = name + " 데이터를 불러오지 못했어. data 폴더의 JSON 형식을 확인해.";
    el.appendChild(p);
  }

  /* ---------- 탭 ---------- */
  function showTab(name) {
    if (TABS.indexOf(name) === -1) name = "links";
    TABS.forEach(function (t) {
      var on = t === name;
      $("p-" + t).hidden = !on;
      $("t-" + t).setAttribute("aria-selected", on ? "true" : "false");
      $("t-" + t).tabIndex = on ? 0 : -1;
    });
    try {
      if (location.hash.slice(1) !== name) history.replaceState(null, "", "#" + name);
    } catch (e) { /* 일부 환경에서는 주소 갱신이 막혀 있음 */ }
  }

  document.querySelector(".tabs").addEventListener("click", function (e) {
    var t = e.target.closest(".tab");
    if (t) showTab(t.dataset.tab);
  });

  document.querySelector(".tabs").addEventListener("keydown", function (e) {
    var i = TABS.findIndex(function (t) { return $("t-" + t).getAttribute("aria-selected") === "true"; });
    if (i === -1) i = 0;
    if (e.key === "ArrowRight") i = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") i = (i + TABS.length - 1) % TABS.length;
    else return;
    showTab(TABS[i]);
    $("t-" + TABS[i]).focus();
  });

  window.addEventListener("hashchange", function () { showTab(location.hash.slice(1)); });

  /* ---------- 링크 ---------- */
  var SVG_NS = "http://www.w3.org/2000/svg";

  function isSafeUrl(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url);
  }

  function makeIcon(key) {
    var def = window.ICONS && window.ICONS[key];
    if (!def) return null;
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", def.d);
    path.setAttribute("fill", def.color);
    svg.appendChild(path);
    return svg;
  }

  function renderLinks(links) {
    var box = $("linkList");
    box.textContent = "";
    links.forEach(function (l) {
      if (l.type === "url" && !isSafeUrl(l.url)) return;
      if (l.type !== "url" && l.type !== "email") return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "link";

      var badge = document.createElement("span");
      badge.className = "badge";
      var icon = makeIcon(l.icon);
      if (icon) badge.appendChild(icon);
      else badge.textContent = String(l.label || "").slice(0, 2).toUpperCase();

      var label = document.createElement("span");
      label.textContent = l.label;

      var arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = l.type === "url" ? "→" : "›";

      btn.append(badge, label, arrow);
      btn.addEventListener("click", function () {
        if (l.type === "url") openConfirm(l);
        else openEmails(l);
      });
      box.appendChild(btn);
    });
    if (!box.children.length) {
      var p = document.createElement("div");
      p.className = "empty";
      p.textContent = "등록된 링크가 없어";
      box.appendChild(p);
    }
  }

  /* ---------- 모달 ---------- */
  var dlg = $("dlg");

  function openDialog(title, content, actions) {
    $("dlgTitle").textContent = title;
    $("dlgContent").textContent = "";
    $("dlgContent").appendChild(content);
    var bar = $("dlgActions");
    bar.textContent = "";
    actions.forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = a.text;
      if (a.primary) b.className = "primary";
      b.addEventListener("click", function () {
        dlg.close();
        if (a.onClick) a.onClick();
      });
      bar.appendChild(b);
    });
    dlg.showModal();
  }

  // 모달 바깥(배경)을 누르면 닫기
  dlg.addEventListener("click", function (e) {
    if (e.target === dlg) dlg.close();
  });

  function openConfirm(l) {
    var box = document.createElement("div");
    var msg = document.createElement("p");
    msg.className = "dlg-msg";
    msg.textContent = l.label + "(으)로 이동하시겠습니까?";
    var url = document.createElement("div");
    url.className = "dlg-url";
    url.textContent = l.url;
    box.append(msg, url);
    openDialog("이동", box, [
      { text: "아니요" },
      { text: "예", primary: true, onClick: function () { window.open(l.url, "_blank", "noopener,noreferrer"); } }
    ]);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      // 모달이 열려 있는 동안 바깥 요소는 포커스를 받지 못하므로 모달 안에 임시 입력칸을 만든다
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      dlg.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      dlg.removeChild(ta);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  function openEmails(l) {
    var box = document.createElement("div");
    (l.emails || []).forEach(function (m) {
      var item = typeof m === "string" ? { address: m } : m;
      var row = document.createElement("div");
      row.className = "mail";
      if (item.label) {
        var lb = document.createElement("div");
        lb.className = "ml";
        lb.textContent = item.label;
        row.appendChild(lb);
      }
      var addr = document.createElement("div");
      addr.className = "ma";
      addr.textContent = item.address;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy";
      btn.textContent = "복사";
      btn.addEventListener("click", function () {
        copyText(item.address).then(function () {
          btn.textContent = "복사됨";
        }, function () {
          btn.textContent = "복사 실패";
        }).then(function () {
          setTimeout(function () { btn.textContent = "복사"; }, 1500);
        });
      });
      var line = document.createElement("div");
      line.className = "mrow";
      line.append(addr, btn);
      row.appendChild(line);
      box.appendChild(row);
    });
    if (!box.children.length) {
      var p = document.createElement("div");
      p.className = "empty";
      p.textContent = "등록된 이메일이 없어";
      box.appendChild(p);
    }
    openDialog(l.label, box, [{ text: "닫기" }]);
  }

  /* ---------- 달력 ---------- */
  function eventsOn(key) {
    return state.events.filter(function (e) {
      return e.date <= key && key <= (e.endDate || e.date);
    });
  }

  function renderCalendar() {
    var v = state.view;
    syncYearOptions(v.getFullYear());
    $("yearSel").value = v.getFullYear();
    $("monthSel").value = v.getMonth();

    var start = new Date(v.getFullYear(), v.getMonth(), 1);
    start.setDate(1 - start.getDay());

    var frag = document.createDocumentFragment();
    for (var i = 0; i < 42; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var key = fmt(d);
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.d = key;
      b.className = "day" +
        (d.getMonth() !== v.getMonth() ? " out" : "") +
        (key === fmt(today) ? " today" : "") +
        (key === state.selected ? " sel" : "");
      b.textContent = d.getDate();
      b.setAttribute("aria-label", (d.getMonth() + 1) + "월 " + d.getDate() + "일" + (eventsOn(key).length ? ", 일정 있음" : ""));
      if (key === state.selected) b.setAttribute("aria-pressed", "true");
      if (eventsOn(key).length) {
        var dot = document.createElement("span");
        dot.className = "dot";
        b.appendChild(dot);
      }
      frag.appendChild(b);
    }
    $("days").textContent = "";
    $("days").appendChild(frag);
    renderEventList();
  }

  function renderEventList() {
    var parts = state.selected.split("-");
    $("selLabel").textContent = Number(parts[1]) + "월 " + Number(parts[2]) + "일 일정";

    var box = $("evList");
    box.textContent = "";
    var evs = eventsOn(state.selected);
    if (state.eventsError) {
      $("events").hidden = false;
      showError(box, "일정");
      return;
    }
    $("events").hidden = !evs.length;
    if (!evs.length) return;
    evs.forEach(function (e) {
      var el = document.createElement("div");
      el.className = "ev";
      var t = document.createElement("div");
      t.className = "t";
      t.textContent = e.title;
      el.appendChild(t);
      if (e.memo) {
        var m = document.createElement("div");
        m.className = "m";
        m.textContent = e.memo;
        el.appendChild(m);
      }
      if (e.place) el.appendChild(makeMap(e.place));
      box.appendChild(el);
    });
  }

  // 키 없이 장소명/주소만으로 구글맵 지도를 삽입 (길찾기 없이 주변 지도만 표시)
  function makeMap(place) {
    var f = document.createElement("iframe");
    f.className = "map";
    f.title = "지도: " + place;
    f.loading = "lazy";
    f.referrerPolicy = "no-referrer-when-downgrade";
    f.src = "https://www.google.com/maps?q=" + encodeURIComponent(place) + "&output=embed&hl=ko";
    return f;
  }

  $("days").addEventListener("click", function (e) {
    var b = e.target.closest(".day");
    if (!b) return;
    state.selected = b.dataset.d;
    var d = new Date(state.selected + "T00:00:00");
    if (d.getMonth() !== state.view.getMonth()) {
      state.view = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    renderCalendar();
  });

  $("prev").addEventListener("click", function () {
    state.view = new Date(state.view.getFullYear(), state.view.getMonth() - 1, 1);
    renderCalendar();
  });

  $("next").addEventListener("click", function () {
    state.view = new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1);
    renderCalendar();
  });

  function onPick() {
    state.view = new Date(Number($("yearSel").value), Number($("monthSel").value), 1);
    renderCalendar();
  }
  $("yearSel").addEventListener("change", onPick);
  $("monthSel").addEventListener("change", onPick);

  /* 년도 선택 범위: 현재 기준 -5 ~ +10년. 일정 데이터나 현재 보는 달이 범위 밖이면 그 년도까지 넓힘 */
  var yearMin = null, yearMax = null;
  function syncYearOptions(viewYear) {
    var lo = today.getFullYear() - 5, hi = today.getFullYear() + 10;
    state.events.forEach(function (e) {
      lo = Math.min(lo, Number(e.date.slice(0, 4)));
      hi = Math.max(hi, Number((e.endDate || e.date).slice(0, 4)));
    });
    lo = Math.min(lo, viewYear);
    hi = Math.max(hi, viewYear);
    if (lo === yearMin && hi === yearMax) return;
    yearMin = lo;
    yearMax = hi;
    var sel = $("yearSel");
    sel.textContent = "";
    for (var y = lo; y <= hi; y++) {
      var o = document.createElement("option");
      o.value = y;
      o.textContent = y + "년";
      sel.appendChild(o);
    }
  }

  /* ---------- 알림 ---------- */
  function renderNotices(notices) {
    var sorted = notices.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    var box = $("noticeList");
    box.textContent = "";

    if (!sorted.length) {
      var p = document.createElement("div");
      p.className = "empty";
      p.textContent = "등록된 알림이 없어";
      box.appendChild(p);
    }

    sorted.forEach(function (n) {
      var el = document.createElement("div");
      el.className = "notice";
      var t = document.createElement("div");
      t.className = "nt";
      t.textContent = n.title;
      var b = document.createElement("div");
      b.className = "nb";
      b.textContent = n.body;
      var d = document.createElement("div");
      d.className = "nd";
      d.textContent = n.date;
      el.append(t, b, d);
      box.appendChild(el);
    });
  }

  /* ---------- 시작 ---------- */
  for (var m = 0; m < 12; m++) {
    var mo = document.createElement("option");
    mo.value = m;
    mo.textContent = (m + 1) + "월";
    $("monthSel").appendChild(mo);
  }

  $("dows").append.apply($("dows"), ["일", "월", "화", "수", "목", "금", "토"].map(function (n) {
    var d = document.createElement("div");
    d.className = "dow";
    d.textContent = n;
    return d;
  }));

  showTab(location.hash.slice(1));
  renderCalendar();

  load("data/links.json").then(renderLinks).catch(function () { showError($("linkList"), "링크"); });
  load("data/events.json").then(function (ev) {
    state.events = ev;
    renderCalendar();
  }).catch(function () {
    state.eventsError = true;
    renderEventList();
  });
  load("data/notices.json").then(renderNotices).catch(function () { showError($("noticeList"), "알림"); });
})();
