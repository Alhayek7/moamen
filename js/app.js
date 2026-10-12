(function () {
  'use strict';

  /* ---------- Constants ---------- */
  var LOGO = { mark: 'assets/logo-mark.webp', full: 'assets/logo-full.webp', lens: 'assets/logo-lens.webp' };
  var SIZE_LIMIT = 24 * 1024 * 1024;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var KIND = { video: ['فيديو', 'Video'], photo: ['صور', 'Photo'], event: ['فعالية', 'Event'] };
  var GRAD = [
    'linear-gradient(135deg,#0d1b3d 0%,#123f72 60%,#1c7fb5 130%)',
    'linear-gradient(135deg,#0a1530 0%,#18356a 55%,#2d8fd0 130%)',
    'linear-gradient(135deg,#0d1b3d 0%,#1a4e86 55%,#20c8f5 150%)',
    'linear-gradient(135deg,#0b1a38 0%,#14396b 60%,#6cbfe8 140%)',
    'linear-gradient(135deg,#0d1b3d 0%,#22406f 55%,#5aa2d8 140%)',
    'linear-gradient(135deg,#081228 0%,#123f72 60%,#20c8f5 160%)'
  ];
  var CAM = '<svg viewBox="0 0 24 24"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/></svg>';

  /* ---------- Helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function h(tag, props, kids) {
    var e = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') e.textContent = v;
      else if (k === 'class') e.className = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c === null || c === undefined) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function hash(s) { var x = 0; s = String(s); for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return Math.abs(x); }
  var uidn = 0; function uid() { uidn += 1; return 'f' + uidn; }
  function safeImg(s) {
    if (typeof s !== 'string') return '';
    if (s.indexOf('data:image/') === 0) return s;
    return /^(?![a-z][a-z0-9+.-]*:|\/\/)[\w@%.\/-]+\.(png|jpe?g|webp|gif|avif|svg)$/i.test(s) ? s : '';
  }
  function normUrl(u) {
    u = (u || '').trim(); if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(u)) return 'https://' + u;
    return '';
  }
  function social(kind, v) {
    v = (v || '').trim(); if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (kind === 'web') return normUrl(v);
    var u = v.replace(/^@/, '');
    var base = { instagram: 'https://instagram.com/', facebook: 'https://facebook.com/', youtube: 'https://youtube.com/@', tiktok: 'https://tiktok.com/@', linkedin: 'https://linkedin.com/in/' }[kind];
    return base ? base + encodeURIComponent(u) : '';
  }
  function fmtPhone(s) { var d = String(s || '').replace(/\D/g, ''); return d.length === 10 ? d.slice(0, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7) : String(s || ''); }
  function waNumber(c) { var d = String((c && c.wa) || '').replace(/\D/g, ''); return d || '970597244136'; }
  function uuid() { return 'x' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }

  var lang = 'ar';
  try { var sv = localStorage.getItem('mm-lang'); if (sv === 'en' || sv === 'ar') lang = sv; } catch (e0) {}
  function L(p) { if (!p) return ''; var v = lang === 'ar' ? p[0] : p[1]; return v || p[0] || p[1] || ''; }
  function A(ar, en) { return lang === 'ar' ? ar : en; }

  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast'); t.textContent = '';
    t.appendChild(h('div', { text: msg }));
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.textContent = ''; }, 3200);
  }

  /* ---------- State (loaded from data/content.json, falls back to the built-in sample) ---------- */

  function sample(id, type, ar, en, ra, re) {
    return { id: id, type: type, title: [ar, en], org: '', role: [ra, re], year: '', desc: ['وصف مختصر للمشروع: الفكرة، الجهة، ودور مؤمن فيه. (نص تجريبي يُستبدل لاحقاً)', 'A short description of the project: the idea, the client and Moamen\'s role. (Placeholder text, to be replaced)'], cover: '', gallery: [], link: '', sample: true };
  }
  function defaults() {
    return {
      v: 1,
      profile: {
        photo: '',
        name: ['مؤمن المدهون', 'Moamen Al-Madhoun'],
        title: ['مصوّر ومونتير فيديو', 'Photographer & Video Editor'],
        loc: ['غزة، فلسطين', 'Gaza, Palestine'],
        bio: ['مصوّر ومونتير فيديو، خريج دبلوم الوسائط المتعددة من الكلية الجامعية للعلوم التطبيقية. أملك معدات كاملة للتصوير والصوت، وصوّرت لمؤسسات إغاثية وشركات في غزة، وأسرّع المونتاج بأدوات الذكاء الاصطناعي مع الحفاظ على اللمسة البشرية.', 'Photographer and video editor with a Multimedia Diploma from the University College of Applied Sciences. I own a full kit for picture and sound, have shot for relief organisations and companies in Gaza, and speed up editing with AI tools while keeping the human touch.']
      },
      contact: { phone: '0597244136', wa: '970597244136', email: '', web: '', instagram: '', facebook: '', youtube: '', tiktok: '', linkedin: '' },
      works: [
        sample('w1', 'video', 'فيلم وثائقي', 'Documentary film', 'تصوير ومونتاج', 'Shooting and edit'),
        sample('w2', 'event', 'تغطية فعالية', 'Event coverage', 'تصوير', 'Photography'),
        sample('w3', 'video', 'فيديو دعائي', 'Promo video', 'تصوير وصوت ومونتاج', 'Camera, sound, edit'),
        sample('w4', 'photo', 'بورتريه', 'Portrait series', 'تصوير', 'Photography'),
        sample('w5', 'photo', 'تصوير ميداني', 'Field photography', 'تصوير', 'Photography'),
        sample('w6', 'event', 'حملة مؤسسية', 'Campaign shoot', 'تصوير ومونتاج', 'Shooting and edit')
      ],
      partners: [
        { id: 'p1', name: ['مؤسسة زكاة الأمريكية', 'American Zakat Foundation'], role: ['مصوّر لدى المؤسسة', 'Photographer for the foundation'], url: '', logo: '' },
        { id: 'p2', name: ['جمعية مؤاخاة التركية', 'Muaakhat Association (Turkey)'], role: ['مصوّر لدى الجمعية', 'Photographer for the association'], url: '', logo: '' },
        { id: 'p3', name: ['مؤسسة جلوكال شيفت', 'Global Shift'], role: ['مصوّر لدى المؤسسة', 'Photographer for the organisation'], url: '', logo: '' },
        { id: 'p4', name: ['شركة يبرين، غزة', 'Yebrin, Gaza'], role: ['مصوّر لدى الشركة', 'Photographer for the company'], url: '', logo: '' }
      ]
    };
  }
  var state = null;
  function ensure() {
    var d = defaults();
    if (!state || typeof state !== 'object') state = d;
    ['profile', 'contact'].forEach(function (k) { state[k] = Object.assign({}, d[k], state[k] || {}); });
    ['works', 'partners'].forEach(function (k) { if (!Array.isArray(state[k])) state[k] = d[k]; });
    ['name', 'title', 'loc', 'bio'].forEach(function (k) { if (!Array.isArray(state.profile[k])) state.profile[k] = d.profile[k]; });
    state.works.forEach(function (w) { if (!Array.isArray(w.gallery)) w.gallery = []; if (!Array.isArray(w.title)) w.title = [String(w.title || ''), '']; if (!Array.isArray(w.role)) w.role = ['', '']; if (!Array.isArray(w.desc)) w.desc = ['', '']; });
    state.partners.forEach(function (p) { if (!Array.isArray(p.name)) p.name = [String(p.name || ''), '']; if (!Array.isArray(p.role)) p.role = ['', '']; });
  }

  /* ---------- Static text and language ---------- */
  function applyStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-en]').forEach(function (el) {
      if (el.dataset.ar === undefined) el.dataset.ar = el.textContent;
      el.textContent = lang === 'ar' ? el.dataset.ar : el.dataset.en;
    });
    $$('[data-ph]').forEach(function (el) { var p = el.getAttribute('data-ph').split('|'); el.setAttribute('placeholder', lang === 'ar' ? p[0] : p[1]); });
    $('#langBtn').textContent = lang === 'ar' ? 'EN' : 'عربي';
  }

  /* ---------- Poster / cards ---------- */
  function cover(w) { return safeImg(w.cover) || safeImg(w.gallery && w.gallery[0]); }
  function posterBase(w) {
    var r = h('div', { class: 'pz' });
    r.style.setProperty('--p', GRAD[hash(w.id) % GRAD.length]);
    var c = cover(w);
    if (c) r.appendChild(h('img', { src: c, alt: L(w.title), loading: 'lazy' }));
    return r;
  }
  function overlays(w, parent, withMeta) {
    parent.appendChild(h('div', { class: 'vf' }, [h('i'), h('i'), h('i'), h('i')]));
    if (w.type === 'video') parent.appendChild(h('span', { class: 'playb' }));
    else if (!cover(w)) { var cb = h('span', { class: 'camb' }); cb.innerHTML = CAM; parent.appendChild(cb); }
    if (w.sample) parent.appendChild(h('span', { class: 'smp', text: A('نموذج', 'SAMPLE') }));
    parent.appendChild(h('span', { class: 'kind mono', text: (KIND[w.type] ? KIND[w.type][1] : '').toUpperCase() }));
    if (withMeta) parent.appendChild(h('div', { class: 'meta' }, [h('b', { text: L(w.title) }), h('small', { text: L(w.role) })]));
  }

  /* ---------- Ring ---------- */
  var ringList = [], STEP = 60, angle = 0, R = 400, interacted = false;
  var car = $('#car'), ring = $('#ring'), dots = $('#dots');
  function ringActive() { var n = ringList.length || 1; return ((Math.round(angle / STEP) % n) + n) % n; }
  function ringPlace() {
    ring.style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + (-angle) + 'deg)';
    var a = ringActive();
    $$('.item', ring).forEach(function (d, i) { d.classList.toggle('on', i === a); });
    $$('button', dots).forEach(function (b, i) { b.setAttribute('aria-current', i === a ? 'true' : 'false'); });
  }
  function ringLayout() {
    var n = ringList.length; if (n < 3) return;
    STEP = 360 / n;
    var cw = Math.min(400, Math.max(230, car.clientWidth * 0.7));
    car.style.setProperty('--cw', cw + 'px');
    R = Math.round((cw / 2) / Math.tan(Math.PI / n) * 1.12);
    $$('.item', ring).forEach(function (d, i) { d.style.transform = 'rotateY(' + (i * STEP) + 'deg) translateZ(' + R + 'px)'; });
    ringPlace();
  }
  function buildRing() {
    ringList = state.works.slice(0, 12);
    var sec = $('#works');
    sec.hidden = ringList.length < 3;
    ring.textContent = ''; dots.textContent = '';
    if (ringList.length < 3) return;
    ringList.forEach(function (w, i) {
      var d = h('div', { class: 'item', 'data-i': i });
      d.appendChild(posterBase(w)); overlays(w, d, true);
      ring.appendChild(d);
      dots.appendChild(h('button', { type: 'button', 'data-i': i, 'aria-label': L(w.title) }));
    });
    angle = Math.round(angle / (360 / ringList.length)) * (360 / ringList.length);
    ringLayout();
  }
  function ringGo(dir) { angle = (Math.round(angle / STEP) + dir) * STEP; ringPlace(); }
  function ringTo(i) {
    var n = ringList.length, cur = Math.round(angle / STEP), diff = (((i - cur) % n) + n) % n;
    if (diff > n / 2) diff -= n;
    angle = (cur + diff) * STEP; ringPlace();
  }
  $('#prev').addEventListener('click', function () { interacted = true; ringGo(-1); });
  $('#next').addEventListener('click', function () { interacted = true; ringGo(1); });
  dots.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { interacted = true; ringTo(+b.getAttribute('data-i')); } });
  car.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { interacted = true; ringGo(-1); }
    if (e.key === 'ArrowRight') { interacted = true; ringGo(1); }
    if (e.key === 'Enter' && ringList[ringActive()]) openWork(ringList[ringActive()].id);
  });
  var dragging = false, sx = 0, sa = 0, moved = 0;
  car.addEventListener('pointerdown', function (e) {
    if (ringList.length < 3) return;
    dragging = true; moved = 0; sx = e.clientX; sa = angle; interacted = true; car.classList.add('drag');
    try { car.setPointerCapture(e.pointerId); } catch (x) {}
  });
  car.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
    angle = sa - dx * 0.32; ringPlace();
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false; car.classList.remove('drag');
    angle = Math.round(angle / STEP) * STEP; ringPlace();
    if (moved < 6) {
      var t = document.elementFromPoint(e.clientX, e.clientY), it = t && t.closest ? t.closest('.item') : null;
      if (it) { var i = +it.getAttribute('data-i'); if (i === ringActive()) openWork(ringList[i].id); else ringTo(i); }
    }
  }
  car.addEventListener('pointerup', endDrag);
  car.addEventListener('pointercancel', endDrag);
  if (!reduce) setInterval(function () { if (!interacted && !document.hidden && ringList.length >= 3) ringGo(1); }, 4800);
  if (window.ResizeObserver) new ResizeObserver(ringLayout).observe(car); else window.addEventListener('resize', ringLayout);

  /* ---------- Gallery ---------- */
  var flt = 'all';
  function buildGrid() {
    var f = $('#filters'), g = $('#grid'), em = $('#gridEmpty');
    f.textContent = ''; g.textContent = '';
    var counts = { video: 0, photo: 0, event: 0 };
    state.works.forEach(function (w) { if (counts[w.type] !== undefined) counts[w.type] += 1; });
    if (flt !== 'all' && !counts[flt]) flt = 'all';
    [['all', ['الكل', 'All']], ['video', KIND.video], ['photo', KIND.photo], ['event', KIND.event]].forEach(function (c) {
      if (c[0] !== 'all' && !counts[c[0]]) return;
      f.appendChild(h('button', { type: 'button', class: 'chip', 'data-f': c[0], 'aria-pressed': flt === c[0] ? 'true' : 'false', text: L(c[1]) }));
    });
    var list = state.works.filter(function (w) { return flt === 'all' || w.type === flt; });
    em.hidden = list.length > 0;
    list.forEach(function (w) {
      var fr = h('div', { class: 'frame' }); fr.appendChild(posterBase(w)); overlays(w, fr, false);
      var parts = [L(w.role)]; if (w.year) parts.push(w.year);
      g.appendChild(h('button', { type: 'button', class: 'gcard', 'data-id': w.id }, [fr, h('h3', { text: L(w.title) }), h('p', { text: parts.filter(Boolean).join(' · ') })]));
    });
  }
  $('#filters').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    flt = b.getAttribute('data-f'); buildGrid();
  });
  $('#grid').addEventListener('click', function (e) {
    var c = e.target.closest('.gcard'); if (c) openWork(c.getAttribute('data-id'));
  });

  /* ---------- Work modal ---------- */
  var modal = $('#modal');
  function openWork(id) {
    var w = null; state.works.forEach(function (x) { if (x.id === id) w = x; });
    if (!w) return;
    var imgs = [safeImg(w.cover)].concat((w.gallery || []).map(safeImg)).filter(Boolean);
    var main = $('#mMain'), th = $('#mThumbs');
    function show(i) {
      main.textContent = '';
      if (imgs.length) main.appendChild(h('img', { src: imgs[i], alt: L(w.title) }));
      else { main.appendChild(posterBase(w)); overlays(w, main, false); }
      $$('button', th).forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    th.textContent = '';
    if (imgs.length > 1) imgs.forEach(function (s, i) { th.appendChild(h('button', { type: 'button', 'aria-label': String(i + 1), onclick: function () { show(i); } }, [h('img', { src: s, alt: '' })])); });
    show(0);
    $('#mTitle').textContent = L(w.title);
    var dl = $('#mMeta'); dl.textContent = '';
    function row(k, v) { if (!v) return; dl.appendChild(h('dt', { text: k })); dl.appendChild(h('dd', { text: v })); }
    row(A('النوع', 'Type'), L(KIND[w.type]));
    row(A('الجهة', 'Client'), w.org);
    row(A('الدور', 'Role'), L(w.role));
    row(A('السنة', 'Year'), w.year);
    $('#mDesc').textContent = L(w.desc);
    var cta = $('#mCta'); cta.textContent = '';
    var link = normUrl(w.link);
    if (link) cta.appendChild(h('a', { class: 'btn cy', href: link, target: '_blank', rel: 'noopener noreferrer', text: w.type === 'video' ? A('شاهد الفيديو ↗', 'Watch the video ↗') : A('افتح الرابط ↗', 'Open link ↗') }));
    cta.appendChild(h('a', { class: 'btn', href: '#contact', text: A('اطلب مشروعاً مشابهاً', 'Request something similar'), onclick: closeModal }));
    modal.hidden = false; $('#mClose').focus();
  }
  function closeModal() { modal.hidden = true; }
  $('#mClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  /* ---------- Profile, partners, contact ---------- */
  function buildProfile() {
    var p = state.profile;
    var name = L(p.name);
    $('#navName').textContent = name;
    $('#heroWho').textContent = name + ' · ' + L(p.title);
    $('#aboutName').textContent = name;
    $('#aboutBio').textContent = L(p.bio);
    $('#sigName').textContent = (p.name[1] || p.name[0] || '');
    $('#ftText').textContent = '© ' + name + ' · ' + L(p.title);
    var po = $('#portrait'); po.textContent = '';
    var ph = safeImg(p.photo);
    if (ph) po.appendChild(h('img', { class: 'ph', src: ph, alt: name }));
    else po.appendChild(h('div', { class: 'mk' }, [h('img', { src: LOGO.mark, alt: '' })]));
    po.appendChild(h('div', { class: 'cap', text: name + ' · ' + L(p.loc) }));
  }
  function buildPartners() {
    var t = $('#ptiles'); t.textContent = '';
    state.partners.forEach(function (p) {
      var nm = L(p.name), lg = safeImg(p.logo);
      var logo = h('div', { class: 'plogo' }, lg ? [h('img', { src: lg, alt: nm })] : [nm.trim().charAt(0).toUpperCase()]);
      var kids = [logo, h('div', {}, [h('b', { text: nm }), h('span', { class: 'r', text: L(p.role) })])];
      var u = normUrl(p.url);
      if (u) kids.push(h('a', { class: 'vis', href: u, target: '_blank', rel: 'noopener noreferrer', text: A('افتح صفحتهم ↗', 'Visit their page ↗') }));
      t.appendChild(h('div', { class: 'ptile' }, kids));
    });
    $('#partners').hidden = state.partners.length === 0;
  }
  function buildContact() {
    var c = state.contact, box = $('#crow'), soc = $('#socials');
    box.textContent = ''; soc.textContent = '';
    box.appendChild(h('div', { class: 'line' }, [h('span', { class: 'lab', text: 'PHONE' }), h('span', { class: 'val', text: fmtPhone(c.phone) }), h('button', { class: 'mini', type: 'button', text: A('انسخ', 'Copy'), onclick: function () { copyText(String(c.phone || '').replace(/\s/g, '')); } })]));
    box.appendChild(h('div', { class: 'line' }, [h('span', { class: 'lab', text: 'WHATSAPP' }), h('a', { class: 'btn cy', style: 'padding:8px 20px;font-size:14px', href: 'https://wa.me/' + waNumber(c), target: '_blank', rel: 'noopener', text: A('راسله مباشرة', 'Message directly') })]));
    if (c.email) box.appendChild(h('div', { class: 'line' }, [h('span', { class: 'lab', text: 'EMAIL' }), h('span', { class: 'val', text: c.email })]));
    if (c.web && social('web', c.web)) box.appendChild(h('div', { class: 'line' }, [h('span', { class: 'lab', text: 'WEB' }), h('a', { class: 'val', href: social('web', c.web), target: '_blank', rel: 'noopener noreferrer', text: c.web })]));
    [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['youtube', 'YouTube'], ['tiktok', 'TikTok'], ['linkedin', 'LinkedIn']].forEach(function (k) {
      var u = social(k[0], c[k[0]]); if (u) soc.appendChild(h('a', { href: u, target: '_blank', rel: 'noopener noreferrer', text: k[1] }));
    });
  }
  function copyText(s) {
    var ok = function () { toast(A('تم النسخ', 'Copied')); };
    var no = function () { toast(A('تعذّر النسخ، انسخ يدوياً', 'Could not copy, please copy by hand')); };
    try { navigator.clipboard.writeText(s).then(ok, no); } catch (e) { no(); }
  }

  /* ---------- Request form ---------- */
  function requestMessage() {
    var n = $('#rqName').value.trim(), t = $('#rqType').value, d = $('#rqDate').value.trim(), m = $('#rqMsg').value.trim();
    var nm = L(state.profile.name);
    if (lang === 'ar') return 'مرحباً ' + nm + '، أرغب بطلب مشروع.\nالاسم: ' + (n || '-') + '\nنوع المشروع: ' + t + '\nالموعد: ' + (d || '-') + '\nالتفاصيل: ' + (m || '-');
    return 'Hello ' + nm + ', I would like to request a project.\nName: ' + (n || '-') + '\nProject type: ' + t + '\nWhen: ' + (d || '-') + '\nDetails: ' + (m || '-');
  }
  $('#reqForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var a = $('#rqLink'); a.href = 'https://wa.me/' + waNumber(state.contact) + '?text=' + encodeURIComponent(requestMessage());
    a.click();
  });
  $('#rqCopy').addEventListener('click', function () { copyText(requestMessage()); });

  /* ---------- Render ---------- */
  function renderPublic() {
    applyStatic(); buildProfile(); buildRing(); buildGrid(); buildPartners(); buildContact();
    $('#navMark').src = LOGO.mark; $('#ftMark').src = LOGO.mark;
  }
  var rt = null; function scheduleRender() { clearTimeout(rt); rt = setTimeout(renderPublic, 120); }
  $('#langBtn').addEventListener('click', function () {
    lang = lang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem('mm-lang', lang); } catch (e) {}
    renderPublic(); if (admin.open) renderAdmin();
  });
  var mq = $('#mq'), seg = '';
  for (var qi = 0; qi < 8; qi++) seg += '<span>لحظات حقيقية... تحكي قصصاً أعمق</span><span><em>Real Moments.. Deeper Stories</em></span>';
  mq.innerHTML = seg;

  /* ---------- Pointer effects ---------- */
  if (!reduce) {
    var TILT = '[data-tilt],.gcard,.ptile,.portrait';
    document.addEventListener('pointermove', function (e) {
      var tg = e.target.closest ? e.target : null; if (!tg) return;
      var t = tg.closest(TILT);
      if (t) {
        var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, k = t.classList.contains('portrait') ? 6 : 9;
        t.style.setProperty('--mx', (x * 100) + '%'); t.style.setProperty('--my', (y * 100) + '%');
        t.style.transform = 'rotateY(' + ((x - 0.5) * k).toFixed(2) + 'deg) rotateX(' + ((0.5 - y) * k).toFixed(2) + 'deg) translateY(-3px)';
      }
      var b = tg.closest('.band.dark');
      if (b) { var br = b.getBoundingClientRect(); b.style.setProperty('--sx', (e.clientX - br.left) + 'px'); b.style.setProperty('--sy', (e.clientY - br.top) + 'px'); }
      var m = tg.closest('[data-magnet]');
      if (m) { var mr = m.getBoundingClientRect(); m.style.transform = 'translate(' + ((e.clientX - mr.left - mr.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - mr.top - mr.height / 2) * 0.28).toFixed(1) + 'px)'; }
    });
    document.addEventListener('pointerout', function (e) {
      var tg = e.target.closest ? e.target : null; if (!tg) return;
      var t = tg.closest(TILT); if (t) t.style.transform = '';
      var m = tg.closest('[data-magnet]'); if (m) m.style.transform = '';
    });
  }

  /* ================= Admin ================= */
  var admin = { open: false, tab: 'works', editing: null, dirty: false };
  var admEl = $('#admin');

  function sizeBytes() { try { return new Blob([JSON.stringify(state)]).size; } catch (e) { return 0; } }
  function markDirty() { admin.dirty = true; updateStatus(); scheduleRender(); }
  function updateStatus() {
    var s = $('#admStatus');
    s.textContent = admin.dirty ? A('تغييرات غير منشورة', 'Unpublished changes') : A('كل شيء منشور', 'Everything is published');
    s.className = 'st' + (admin.dirty ? ' dirty' : '');
  }
  function openAdmin() { admin.open = true; admEl.hidden = false; renderAdmin(); }
  function closeAdmin() { admin.open = false; admEl.hidden = true; }
  $('#adminBtn').addEventListener('click', openAdmin);
  $('#admClose').addEventListener('click', closeAdmin);
  $('#admSave').addEventListener('click', exportZip);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!modal.hidden) closeModal(); else if (admin.open) closeAdmin(); } });

  /* form helpers */
  function fld(label, ctl) { var l = h('label', { class: 'fld', for: ctl.id }, [h('span', { text: label }), ctl]); return l; }
  function bind(ctl, get, set) { ctl.value = get() || ''; ctl.addEventListener('input', function () { set(ctl.value); markDirty(); }); return ctl; }
  function text(obj, key, o) {
    o = o || {};
    var c = h(o.area ? 'textarea' : 'input', { id: uid(), type: o.area ? null : (o.type || 'text'), dir: o.dir || null, placeholder: o.ph || null, autocomplete: 'off' });
    return bind(c, function () { return obj[key]; }, function (v) { obj[key] = v; });
  }
  function pair(obj, key, label, o) {
    o = o || {};
    if (!Array.isArray(obj[key])) obj[key] = ['', ''];
    var a = h(o.area ? 'textarea' : 'input', { id: uid(), dir: 'rtl', autocomplete: 'off' });
    var b = h(o.area ? 'textarea' : 'input', { id: uid(), dir: 'ltr', autocomplete: 'off' });
    bind(a, function () { return obj[key][0]; }, function (v) { obj[key][0] = v; });
    bind(b, function () { return obj[key][1]; }, function (v) { obj[key][1] = v; });
    return h('div', { class: 'two' }, [fld(label + ' · عربي', a), fld(label + ' · English', b)]);
  }
  function select(obj, key, opts) {
    var s = h('select', { id: uid() });
    opts.forEach(function (o) { s.appendChild(h('option', { value: o[0], text: o[1] })); });
    s.value = obj[key] || opts[0][0];
    s.addEventListener('change', function () { obj[key] = s.value; markDirty(); renderAdminBody(); });
    return s;
  }
  function loadImg(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); res(im); };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('img')); };
      im.src = u;
    });
  }
  function compress(file, max, q, alpha) {
    return loadImg(file).then(function (im) {
      var s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * s)); c.height = Math.max(1, Math.round(im.naturalHeight * s));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      var out = c.toDataURL('image/webp', q);
      if (out.indexOf('data:image/webp') !== 0) out = c.toDataURL(alpha ? 'image/png' : 'image/jpeg', q);
      return out;
    });
  }
  function pickOne(obj, key, o) {
    var pv = h('div', { class: 'pv' });
    function paint() { pv.textContent = ''; if (safeImg(obj[key])) pv.appendChild(h('img', { src: obj[key], alt: '' })); else pv.textContent = A('لا توجد صورة', 'No image'); }
    var f = h('input', { type: 'file', accept: 'image/*', id: uid() });
    f.addEventListener('change', function () {
      if (!f.files[0]) return;
      compress(f.files[0], o.max, o.q, o.alpha).then(function (d) { obj[key] = d; paint(); markDirty(); renderAdminBody(); }, function () { toast(A('تعذّر قراءة الصورة', 'Could not read that image')); });
    });
    paint();
    return h('div', { class: 'pick' }, [pv, f, h('button', { class: 'mini', type: 'button', text: A('إزالة', 'Remove'), onclick: function () { obj[key] = ''; paint(); markDirty(); renderAdminBody(); } })]);
  }
  function pickMany(arr, o) {
    var box = h('div', { class: 'gal' });
    arr.forEach(function (s, i) {
      if (!safeImg(s)) return;
      box.appendChild(h('div', { class: 'g' }, [h('img', { src: s, alt: '' }), h('button', { type: 'button', 'aria-label': A('حذف', 'Delete'), text: '×', onclick: function () { arr.splice(i, 1); markDirty(); renderAdminBody(); } })]));
    });
    var f = h('input', { type: 'file', accept: 'image/*', multiple: true, id: uid() });
    f.addEventListener('change', function () {
      var files = Array.prototype.slice.call(f.files || []); if (!files.length) return;
      toast(A('جارٍ تجهيز الصور…', 'Preparing images…'));
      files.reduce(function (p, file) { return p.then(function () { return compress(file, o.max, o.q, false).then(function (d) { arr.push(d); }); }); }, Promise.resolve())
        .then(function () { markDirty(); renderAdminBody(); }, function () { toast(A('تعذّر قراءة إحدى الصور', 'Could not read one of the images')); });
    });
    return h('div', { class: 'adm-card', style: 'border:0;padding:0' }, [box, f]);
  }
  function delBtn(onYes) {
    var armed = false, t = null;
    var b = h('button', { class: 'mini dan', type: 'button', text: A('حذف', 'Delete') });
    b.addEventListener('click', function () {
      if (!armed) { armed = true; b.textContent = A('تأكيد؟', 'Sure?'); t = setTimeout(function () { armed = false; b.textContent = A('حذف', 'Delete'); }, 3000); return; }
      clearTimeout(t); onYes();
    });
    return b;
  }
  function move(arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var x = arr[i]; arr[i] = arr[j]; arr[j] = x; markDirty(); renderAdminBody(); }

  /* admin views */
  function renderAdmin() {
    var tabs = $('#admTabs'); tabs.textContent = '';
    [['works', A('الأعمال', 'Work')], ['partners', A('الشركاء', 'Partners')], ['profile', A('الملف الشخصي', 'Profile')], ['contact', A('التواصل', 'Contact')]].forEach(function (t) {
      tabs.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': admin.tab === t[0] ? 'true' : 'false', text: t[1], onclick: function () { admin.tab = t[0]; admin.editing = null; renderAdmin(); } }));
    });
    $$('[data-en]', admEl).forEach(function (el) { el.textContent = lang === 'ar' ? el.dataset.ar : el.dataset.en; });
    updateStatus(); renderAdminBody();
  }
  function sizeCard() {
    var b = sizeBytes(), mb = (b / 1048576).toFixed(1), lim = (SIZE_LIMIT / 1048576).toFixed(0), pct = Math.min(100, Math.round(b / SIZE_LIMIT * 100));
    var m = h('div', { class: 'meter' }, [h('i', { style: 'width:' + pct + '%' })]);
    return h('div', { class: 'adm-note' }, [h('div', { text: A('المساحة المستخدمة: ', 'Space used: ') + mb + ' MB / ' + lim + ' MB' }), m]);
  }
  function renderAdminBody() {
    var body = $('#admBody'), keep = body.scrollTop; body.textContent = '';
    body.appendChild(sizeCard());
    body.appendChild(h('div', { class: 'adm-note', text: A('بعد التعديل اضغط «تنزيل المحتوى». سيُنزَّل ملف مضغوط فيه data/content.json والصور. فكّ الضغط وانسخ المجلدين data و assets إلى مجلد الموقع ثم ارفعهما إلى مستودع GitHub، فيتحدّث الموقع خلال دقيقة.', 'When you are done, press “Download content”. You get a ZIP with data/content.json and the images. Unzip it, copy the data and assets folders into the site folder and upload them to the GitHub repository; the site updates within a minute.') }));
    var fn = { works: adminWorks, partners: adminPartners, profile: adminProfile, contact: adminContact }[admin.tab];
    fn(body); body.scrollTop = keep;
  }
  function thumbFor(w) {
    var t = h('div', { class: 'th' }); t.style.background = GRAD[hash(w.id) % GRAD.length];
    var c = cover(w); if (c) t.appendChild(h('img', { src: c, alt: '' })); return t;
  }
  function adminWorks(body) {
    if (admin.editing) { var w = null; state.works.forEach(function (x) { if (x.id === admin.editing) w = x; }); if (w) return workForm(body, w); admin.editing = null; }
    body.appendChild(h('div', { class: 'adm-note', text: A('أضف صور وفيديوهات مؤمن هنا. للفيديو ارفعه على يوتيوب أو فيميو أو جوجل درايف ثم ضع الرابط، وارفع صورة غلاف له.', 'Add Moamen\'s photos and videos here. Upload videos to YouTube, Vimeo or Google Drive and paste the link, then add a cover image.') }));
    var top = h('div', { class: 'cta' }, [
      h('button', { class: 'btn cy', type: 'button', style: 'padding:9px 20px;font-size:14px', text: A('+ إضافة عمل', '+ Add work'), onclick: function () {
        var w = { id: uuid(), type: 'video', title: ['', ''], org: '', role: ['', ''], year: '', desc: ['', ''], cover: '', gallery: [], link: '', sample: false };
        state.works.unshift(w); admin.editing = w.id; markDirty(); renderAdminBody();
      } })
    ]);
    if (state.works.some(function (w) { return w.sample; })) top.appendChild(h('button', { class: 'mini', type: 'button', text: A('حذف كل الأعمال النموذجية', 'Remove all sample work'), onclick: function () { state.works = state.works.filter(function (w) { return !w.sample; }); markDirty(); renderAdminBody(); } }));
    body.appendChild(top);
    if (!state.works.length) body.appendChild(h('div', { class: 'empty', text: A('لا توجد أعمال بعد.', 'No work yet.') }));
    state.works.forEach(function (w, i) {
      body.appendChild(h('div', { class: 'rowi' }, [thumbFor(w), h('div', { class: 'tx' }, [h('b', { text: L(w.title) || A('(بدون عنوان)', '(untitled)') }), h('small', { text: L(KIND[w.type]) + (w.sample ? ' · ' + A('نموذج', 'sample') : '') })]),
        h('div', { class: 'acts' }, [
          h('button', { class: 'mini', type: 'button', text: '↑', disabled: i === 0, onclick: function () { move(state.works, i, -1); } }),
          h('button', { class: 'mini', type: 'button', text: '↓', disabled: i === state.works.length - 1, onclick: function () { move(state.works, i, 1); } }),
          h('button', { class: 'mini', type: 'button', text: A('تعديل', 'Edit'), onclick: function () { admin.editing = w.id; renderAdminBody(); } }),
          delBtn(function () { state.works.splice(i, 1); markDirty(); renderAdminBody(); })
        ])]));
    });
  }
  function workForm(body, w) {
    body.appendChild(h('button', { class: 'mini', type: 'button', style: 'justify-self:start', text: A('← رجوع للقائمة', '← Back to list'), onclick: function () { admin.editing = null; renderAdminBody(); } }));
    var c = h('div', { class: 'adm-card' });
    c.appendChild(h('h3', { text: A('بيانات العمل', 'Work details') }));
    c.appendChild(fld(A('النوع', 'Type'), select(w, 'type', [['video', A('فيديو', 'Video')], ['photo', A('صور', 'Photos')], ['event', A('فعالية', 'Event')]])));
    c.appendChild(pair(w, 'title', A('العنوان', 'Title')));
    var org = text(w, 'org'); var dl = h('datalist', { id: 'orgs' }); state.partners.forEach(function (p) { dl.appendChild(h('option', { value: L(p.name) })); }); org.setAttribute('list', 'orgs');
    c.appendChild(h('div', { class: 'two' }, [fld(A('الجهة / العميل', 'Client'), org), fld(A('السنة', 'Year'), text(w, 'year', { dir: 'ltr', ph: '2026' }))]));
    c.appendChild(dl);
    c.appendChild(pair(w, 'role', A('دور مؤمن', 'His role')));
    c.appendChild(pair(w, 'desc', A('الوصف', 'Description'), { area: true }));
    c.appendChild(fld(A('رابط الفيديو (يوتيوب، فيميو، درايف...)', 'Video link (YouTube, Vimeo, Drive...)'), text(w, 'link', { dir: 'ltr', type: 'url', ph: 'https://' })));
    body.appendChild(c);
    var im = h('div', { class: 'adm-card' });
    im.appendChild(h('h3', { text: A('صورة الغلاف', 'Cover image') }));
    im.appendChild(pickOne(w, 'cover', { max: 1400, q: 0.8 }));
    im.appendChild(h('h3', { text: A('معرض الصور (اختياري)', 'Photo gallery (optional)') }));
    im.appendChild(pickMany(w.gallery, { max: 1400, q: 0.78 }));
    var chk = h('input', { type: 'checkbox', id: uid() }); chk.checked = !!w.sample;
    chk.addEventListener('change', function () { w.sample = chk.checked; markDirty(); });
    im.appendChild(h('label', { class: 'chk', for: chk.id }, [chk, h('span', { text: A('عمل تجريبي (يظهر عليه وسم "نموذج")', 'Sample work (shows a "sample" tag)') })]));
    body.appendChild(im);
  }
  function adminPartners(body) {
    if (admin.editing) { var p = null; state.partners.forEach(function (x) { if (x.id === admin.editing) p = x; }); if (p) return partnerForm(body, p); admin.editing = null; }
    body.appendChild(h('div', { class: 'adm-note', text: A('أضف المؤسسات والشركات التي عمل معها، مع شعارها ورابط صفحتها (فيسبوك، إنستغرام، موقع...) ليطّلع العملاء على أعمالهم عندها.', 'Add the organisations and companies he worked with, with their logo and a link to their page so clients can see the work there.') }));
    body.appendChild(h('div', { class: 'cta' }, [h('button', { class: 'btn cy', type: 'button', style: 'padding:9px 20px;font-size:14px', text: A('+ إضافة شريك', '+ Add partner'), onclick: function () {
      var p = { id: uuid(), name: ['', ''], role: ['مصوّر لديهم', 'Photographer for them'], url: '', logo: '' };
      state.partners.push(p); admin.editing = p.id; markDirty(); renderAdminBody();
    } })]));
    state.partners.forEach(function (p, i) {
      var th = h('div', { class: 'th', style: 'background:#fff;border:1px solid #d6e2f0' }); if (safeImg(p.logo)) th.appendChild(h('img', { src: p.logo, alt: '', style: 'object-fit:contain;padding:4px' }));
      body.appendChild(h('div', { class: 'rowi' }, [th, h('div', { class: 'tx' }, [h('b', { text: L(p.name) || A('(بدون اسم)', '(no name)') }), h('small', { text: p.url || A('بدون رابط', 'no link') })]),
        h('div', { class: 'acts' }, [
          h('button', { class: 'mini', type: 'button', text: '↑', disabled: i === 0, onclick: function () { move(state.partners, i, -1); } }),
          h('button', { class: 'mini', type: 'button', text: '↓', disabled: i === state.partners.length - 1, onclick: function () { move(state.partners, i, 1); } }),
          h('button', { class: 'mini', type: 'button', text: A('تعديل', 'Edit'), onclick: function () { admin.editing = p.id; renderAdminBody(); } }),
          delBtn(function () { state.partners.splice(i, 1); markDirty(); renderAdminBody(); })
        ])]));
    });
  }
  function partnerForm(body, p) {
    body.appendChild(h('button', { class: 'mini', type: 'button', style: 'justify-self:start', text: A('← رجوع للقائمة', '← Back to list'), onclick: function () { admin.editing = null; renderAdminBody(); } }));
    var c = h('div', { class: 'adm-card' });
    c.appendChild(h('h3', { text: A('بيانات الشريك', 'Partner details') }));
    c.appendChild(pair(p, 'name', A('الاسم', 'Name')));
    c.appendChild(pair(p, 'role', A('صفة مؤمن عندهم', 'His role there')));
    c.appendChild(fld(A('رابط صفحتهم (فيسبوك، إنستغرام، موقع...)', 'Their page link (Facebook, Instagram, site...)'), text(p, 'url', { dir: 'ltr', ph: 'https://' })));
    c.appendChild(h('h3', { text: A('الشعار', 'Logo') }));
    c.appendChild(pickOne(p, 'logo', { max: 420, q: 0.9, alpha: true }));
    body.appendChild(c);
  }
  function adminProfile(body) {
    var p = state.profile;
    var c = h('div', { class: 'adm-card' });
    c.appendChild(h('h3', { text: A('الصورة الشخصية', 'Profile photo') }));
    c.appendChild(pickOne(p, 'photo', { max: 1100, q: 0.82 }));
    c.appendChild(pair(p, 'name', A('الاسم', 'Name')));
    c.appendChild(pair(p, 'title', A('المسمّى', 'Title')));
    c.appendChild(pair(p, 'loc', A('المكان', 'Location')));
    c.appendChild(pair(p, 'bio', A('نبذة', 'About'), { area: true }));
    body.appendChild(c);
  }
  function adminContact(body) {
    var k = state.contact;
    body.appendChild(h('div', { class: 'adm-note', text: A('اكتب الرابط كاملاً أو المعرّف فقط (مثل @moamen). اترك الحقل فارغاً لإخفائه.', 'Paste the full link or just the handle (like @moamen). Leave a field empty to hide it.') }));
    var c = h('div', { class: 'adm-card' });
    c.appendChild(h('div', { class: 'two' }, [fld(A('رقم الجوال', 'Phone'), text(k, 'phone', { dir: 'ltr' })), fld(A('رقم واتساب مع المفتاح الدولي', 'WhatsApp number with country code'), text(k, 'wa', { dir: 'ltr', ph: '970597244136' }))]));
    c.appendChild(h('div', { class: 'two' }, [fld(A('البريد الإلكتروني', 'Email'), text(k, 'email', { dir: 'ltr', type: 'email' })), fld(A('الموقع', 'Website'), text(k, 'web', { dir: 'ltr' }))]));
    c.appendChild(h('div', { class: 'two' }, [fld('Instagram', text(k, 'instagram', { dir: 'ltr' })), fld('Facebook', text(k, 'facebook', { dir: 'ltr' }))]));
    c.appendChild(h('div', { class: 'two' }, [fld('YouTube', text(k, 'youtube', { dir: 'ltr' })), fld('TikTok', text(k, 'tiktok', { dir: 'ltr' }))]));
    c.appendChild(fld('LinkedIn', text(k, 'linkedin', { dir: 'ltr' })));
    body.appendChild(c);
  }

  /* export: content.json plus the uploaded images as real files, packed in a ZIP */
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function u16(n) { return [n & 255, (n >>> 8) & 255]; }
  function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }
  function makeZip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      var lh = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(size), u32(size), u16(name.length), u16(0));
      parts.push(new Uint8Array(lh), name, f.data);
      var ch = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(size), u32(size), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset));
      central.push(new Uint8Array(ch), name);
      offset += lh.length + name.length + size;
    });
    var csize = central.reduce(function (n, p) { return n + p.length; }, 0);
    var end = [].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(csize), u32(offset), u16(0));
    return new Blob(parts.concat(central, [new Uint8Array(end)]), { type: 'application/zip' });
  }
  function exportZip() {
    var copy = JSON.parse(JSON.stringify(state)), files = [], n = 0;
    function conv(uri, base) {
      if (typeof uri !== 'string' || uri.indexOf('data:image/') !== 0) return uri;
      var mime = uri.slice(5, uri.indexOf(';')), ext = mime === 'image/jpeg' ? 'jpg' : (mime.split('/')[1] || 'img').replace('+xml', '');
      n += 1; var path = 'assets/uploads/' + base + '-' + n + '.' + ext;
      var bin = atob(uri.slice(uri.indexOf(',') + 1)), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      files.push({ name: path, data: arr }); return path;
    }
    function safeId(x) { return String(x).replace(/[^\w-]/g, '') || 'x'; }
    copy.profile.photo = conv(copy.profile.photo, 'profile');
    copy.works.forEach(function (w) { w.cover = conv(w.cover, 'work-' + safeId(w.id) + '-cover'); w.gallery = (w.gallery || []).map(function (g) { return conv(g, 'work-' + safeId(w.id)); }); });
    copy.partners.forEach(function (p) { p.logo = conv(p.logo, 'partner-' + safeId(p.id)); });
    files.unshift({ name: 'data/content.json', data: new TextEncoder().encode(JSON.stringify(copy, null, 2)) });
    var blob = makeZip(files), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'moamen-site-content.zip'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    admin.dirty = false; updateStatus();
    toast(A('تم التنزيل. فكّ الضغط وارفع المجلدين إلى GitHub.', 'Downloaded. Unzip it and upload both folders to GitHub.'));
  }

  /* ================= 3D logo ================= */
  function init3D() {
    var canvas = $('#logo3d'), stage = $('#stage'), fb = $('#fbMark');
    function fallback() { canvas.hidden = true; fb.src = LOGO.mark; fb.hidden = false; }
    if (!window.THREE) { fallback(); return; }
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { fallback(); return; }
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    var FOV = 30, camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.set(0, 0, 15);
    var rig = new THREE.Group(); scene.add(rig);
    var loader = new THREE.TextureLoader();
    function tex(src) { var t = loader.load(src, function () { if (!running) frame(performance.now()); }, undefined, function () { fallback(); }); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }

    var MW = 6.2, MH = MW * 676 / 760;
    var markTex = tex(LOGO.mark), lensTex = tex(LOGO.lens);
    function glowTex() {
      var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d');
      var g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(32,200,245,.6)'); g.addColorStop(0.45, 'rgba(32,120,245,.2)'); g.addColorStop(1, 'rgba(32,120,245,0)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
    }
    var gt = glowTex();
    var glow = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ map: gt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
    glow.position.z = -1.4; rig.add(glow);

    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshBasicMaterial({ map: markTex, color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false }));
    shadow.position.set(0.14, -0.16, -0.5); shadow.scale.setScalar(1.03); rig.add(shadow);
    var mark = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshBasicMaterial({ map: markTex, transparent: true, depthWrite: false }));
    rig.add(mark);

    var lensR = 122 / 760 * MW, lensY = (338 - 495) / 760 * MW, lensX = (379.5 - 380) / 760 * MW;
    var lens = new THREE.Group(); lens.position.set(lensX, lensY, 0.6); rig.add(lens);
    lens.add(new THREE.Mesh(new THREE.PlaneGeometry(lensR * 2, lensR * 2), new THREE.MeshBasicMaterial({ map: lensTex, transparent: true, depthWrite: false })));
    var rim = new THREE.Mesh(new THREE.RingGeometry(lensR * 0.99, lensR * 1.05, 96), new THREE.MeshBasicMaterial({ color: 0x20c8f5, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    rim.position.z = 0.02; lens.add(rim);
    var flare = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: gt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }));
    flare.position.set(lensR * 0.32, -lensR * 0.3, 0.05); lens.add(flare);
    var iris = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.0, 96), new THREE.MeshBasicMaterial({ color: 0x8fd3f4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    iris.position.z = 0.04; lens.add(iris);

    var corners = new THREE.Group(); scene.add(corners);
    var bmat = new THREE.MeshBasicMaterial({ color: 0x8fd3f4 });
    var cg = [];
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (c) {
      var g = new THREE.Group();
      var hh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.09, 0.05), bmat); hh.position.x = -c[0] * 0.4;
      var vv = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.9, 0.05), bmat); vv.position.y = -c[1] * 0.4;
      g.add(hh); g.add(vv); g.userData = { sx: c[0], sy: c[1] }; corners.add(g); cg.push(g);
    });

    var PC = 170, pa = new Float32Array(PC * 3);
    for (var q = 0; q < PC; q++) { pa[q * 3] = (Math.random() - 0.5) * 13; pa[q * 3 + 1] = (Math.random() - 0.5) * 10; pa[q * 3 + 2] = -3 + Math.random() * 5; }
    var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pa, 3));
    var dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x8fd3f4, size: 0.05, transparent: true, opacity: 0.6, depthWrite: false })); scene.add(dust);

    function resize() {
      var w = stage.clientWidth, hgt = stage.clientHeight; if (!w || !hgt) return;
      renderer.setSize(w, hgt, false);
      var asp = w / hgt; camera.aspect = asp;
      camera.position.z = asp < 1.25 ? 15.5 : 14.5;
      camera.updateProjectionMatrix();
      var halfH = Math.tan(FOV * Math.PI / 360) * camera.position.z, halfW = halfH * asp;
      cg.forEach(function (g) { g.position.set(g.userData.sx * halfW * 0.86, g.userData.sy * halfH * 0.84, -0.3); });
      var fit = Math.min(1, (halfW * 0.78) / (MW / 2), (halfH * 0.74) / (MH / 2)); rig.scale.setScalar(fit);
      if (!running) frame(performance.now());
    }
    var mx = 0, my = 0, tx = 0, ty = 0, shot = -1, count = 0, visible = true, running = false, t0 = performance.now();
    window.addEventListener('pointermove', function (e) { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2; });
    var flashEl = $('#flash'), framesEl = $('#frames');
    stage.addEventListener('click', function () {
      shot = performance.now(); count += 1;
      framesEl.textContent = 'FRAME ' + ('000' + count).slice(-4);
      flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go');
      if (!running) frame(performance.now());
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !reduce) loop(); }).observe(stage);

    function frame(now) {
      var t = (now - t0) / 1000;
      tx += (mx * 0.5 - tx) * 0.07; ty += (my * 0.36 - ty) * 0.07;
      rig.rotation.y = tx + Math.sin(t * 0.5) * 0.08;
      rig.rotation.x = ty * 0.7 + Math.cos(t * 0.4) * 0.04;
      rig.position.y = Math.sin(t * 0.9) * 0.1;
      corners.rotation.y = tx * 0.3; corners.rotation.x = ty * 0.25;
      var pulse = 1, ir = 0, fl = 0.5 + Math.sin(t * 1.6) * 0.1;
      if (shot > 0) {
        var s = (now - shot) / 700;
        if (s < 1) { pulse = 1 + Math.sin(s * Math.PI) * 0.12; ir = s; fl = 0.5 + (1 - s) * 1.2; rig.rotation.y += Math.sin(s * Math.PI * 2) * 0.12; }
        else shot = -1;
      }
      lens.scale.setScalar(pulse);
      lens.position.z = 0.6 + (pulse - 1) * 2;
      flare.material.opacity = Math.min(1, fl);
      if (ir > 0) { iris.scale.setScalar(1 + ir * 2.8); iris.material.opacity = (1 - ir) * 0.8; } else iris.material.opacity = 0;
      rim.material.opacity = 0.3 + Math.sin(t * 2) * 0.08;
      dust.rotation.y = t * 0.02;
      renderer.render(scene, camera);
    }
    function loop() {
      if (running) return; running = true;
      (function tick(now) { if (!visible || reduce) { running = false; return; } frame(now); requestAnimationFrame(tick); })(performance.now());
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
    resize(); frame(performance.now());
    if (!reduce) loop();
  }

  /* ---------- Start ---------- */
  function start() {
    ensure(); renderPublic();
    try { init3D(); } catch (e2) { var fbm = $('#fbMark'); $('#logo3d').hidden = true; fbm.src = LOGO.mark; fbm.hidden = false; }
    if (location.hash === '#admin') setTimeout(openAdmin, 0);
  }
  fetch('data/content.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
    .then(function (d) { state = d; }, function () { state = null; })
    .then(start);
})();
