(function () {
  var SECTIONS = [
    {
      id: 'general',
      label: 'General',
      tools: [{ id: 'overview', label: 'Overview', description: 'What needs you right now' }]
    },
    {
      id: 'inbox',
      label: 'Inbox',
      tools: [{ id: 'inquiries', label: 'Inquiries', description: 'Contact, roster, and journal' }]
    },
    {
      id: 'commerce',
      label: 'Commerce',
      tools: [
        { id: 'purchases', label: 'Purchases', description: 'Service package invoices' },
        { id: 'subscriptions', label: 'Subscriptions', description: 'Retainers and white-label plans' }
      ]
    }
  ];

  var ICONS = {
    general: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16v12H5.17L4 17.17V4z"></path><path d="M8 8h8M8 12h5"></path></svg>',
    commerce: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"></path></svg>'
  };

  var CACHE_KEY = 'cf-admin-board';
  var state = {
    board: null,
    loading: true,
    tool: 'overview',
    theme: 'dark',
    openSection: null,
    filters: { inquiries: 'all', purchases: 'attention', subscriptions: 'attention' },
    recordQuery: { inquiries: '', purchases: '', subscriptions: '' },
    expanded: null,
    busyId: null,
    toast: '',
    email: 'info@cochranfilms.com'
  };

  var root = document.getElementById('admin-root');
  var loginView = document.getElementById('login-view');
  var appView = document.getElementById('app-view');
  var panel = document.getElementById('admin-panel');
  var confirmEl = document.getElementById('confirm');
  var confirmResolve = null;

  function toolById(id) {
    for (var i = 0; i < SECTIONS.length; i += 1) {
      for (var j = 0; j < SECTIONS[i].tools.length; j += 1) {
        if (SECTIONS[i].tools[j].id === id) return { section: SECTIONS[i], tool: SECTIONS[i].tools[j] };
      }
    }
    return { section: SECTIONS[0], tool: SECTIONS[0].tools[0] };
  }

  function applyTheme(theme) {
    state.theme = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = state.theme;
    document.documentElement.dataset.adminTheme = state.theme;
    try { localStorage.setItem('cf-admin-theme', state.theme); } catch (e) {}
    var label = state.theme === 'dark' ? 'Light mode' : 'Dark mode';
    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.innerHTML = (state.theme === 'dark' ? ICONS.sun : ICONS.moon) + '<span class="admin-rail__tip">' + label + '</span>';
      toggle.setAttribute('aria-label', 'Switch to ' + label.toLowerCase());
    }
  }

  function money(cents) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(cents) || 0) / 100);
  }

  function when(iso) {
    if (!iso) return '';
    var date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function pill(status) {
    var node = el('span', 'admin-pill admin-pill--' + status, labelFor(status));
    return node;
  }

  function labelFor(status) {
    var map = {
      new: 'New',
      reviewed: 'Reviewed',
      closed: 'Closed',
      spam: 'Spam',
      paid: 'Paid',
      open: 'Open',
      overdue: 'Overdue',
      void: 'Void',
      uncollectible: 'Uncollectible',
      draft: 'Draft',
      active: 'Active',
      paused: 'Paused',
      past_due: 'Past due',
      ended: 'Ended',
      incomplete: 'Incomplete',
      contact: 'Contact',
      roster: 'Roster',
      journal: 'Journal'
    };
    return map[status] || status;
  }

  function showLogin() {
    loginView.hidden = false;
    appView.hidden = true;
  }

  function showApp() {
    loginView.hidden = true;
    appView.hidden = false;
    document.getElementById('account-email').textContent = state.email;
    paintChrome();
    render();
  }

  function paintChrome() {
    var nav = document.getElementById('rail-nav');
    nav.innerHTML = '';
    var active = toolById(state.tool);
    SECTIONS.forEach(function (section) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-rail__item' + (section.id === active.section.id || section.id === state.openSection ? ' is-active' : '');
      button.setAttribute('aria-label', section.label);
      button.innerHTML = (ICONS[section.id] || ICONS.general) + '<span class="admin-rail__tip">' + section.label + '</span>';
      var count = sectionCount(section.id);
      if (count) {
        var badge = el('span', 'admin-rail__count', String(count));
        button.appendChild(badge);
      }
      button.addEventListener('click', function () {
        state.openSection = state.openSection === section.id ? null : section.id;
        paintChrome();
        paintFlyout();
      });
      nav.appendChild(button);
    });
    paintMobile();
    paintFlyout();
    var found = toolById(state.tool);
    document.getElementById('header-section').textContent = found.section.label;
    document.getElementById('header-title').textContent = found.tool.label;
    document.getElementById('header-desc').textContent = found.tool.description;
  }

  function sectionCount(id) {
    if (!state.board) return 0;
    if (id === 'general') return state.board.attention.length;
    if (id === 'inbox') return state.board.metrics.newInquiries;
    if (id === 'commerce') return state.board.metrics.unpaidInvoices;
    return 0;
  }

  function paintFlyout() {
    var existing = document.getElementById('admin-flyout-wrap');
    if (existing) existing.remove();
    if (!state.openSection) return;
    var section = SECTIONS.filter(function (item) { return item.id === state.openSection; })[0];
    if (!section) return;
    var wrap = document.createElement('div');
    wrap.id = 'admin-flyout-wrap';
    var backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'admin-flyout-backdrop';
    backdrop.setAttribute('aria-label', 'Close section menu');
    backdrop.addEventListener('click', function () {
      state.openSection = null;
      paintChrome();
    });
    var fly = document.createElement('div');
    fly.className = 'admin-flyout';
    fly.setAttribute('role', 'dialog');
    var head = document.createElement('div');
    head.className = 'admin-flyout__head';
    head.appendChild(el('h2', '', section.label));
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'admin-flyout__close';
    close.textContent = '×';
    close.addEventListener('click', function () {
      state.openSection = null;
      paintChrome();
    });
    head.appendChild(close);
    var list = document.createElement('div');
    list.className = 'admin-flyout__list';
    section.tools.forEach(function (tool) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'admin-flyout__item' + (tool.id === state.tool ? ' is-active' : '');
      item.appendChild(el('span', 'admin-flyout__item-label', tool.label));
      item.appendChild(el('span', 'admin-flyout__item-desc', tool.description));
      item.addEventListener('click', function () { selectTool(tool.id); });
      list.appendChild(item);
    });
    fly.appendChild(head);
    fly.appendChild(list);
    wrap.appendChild(backdrop);
    wrap.appendChild(fly);
    appView.appendChild(wrap);
  }

  function paintMobile() {
    var bar = document.getElementById('mobile-nav');
    bar.innerHTML = '';
    var chips = document.createElement('div');
    chips.className = 'admin-mobile-nav__chips';
    var active = toolById(state.tool);
    SECTIONS.forEach(function (section) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-mobile-nav__chip' + (section.id === active.section.id ? ' is-active' : '');
      button.innerHTML = (ICONS[section.id] || ICONS.general) + '<span>' + section.label + '</span>';
      button.addEventListener('click', function () {
        state.openSection = state.openSection === section.id ? null : section.id;
        paintChrome();
      });
      chips.appendChild(button);
    });
    var themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.className = 'admin-mobile-nav__theme';
    themeBtn.setAttribute('aria-label', state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    themeBtn.innerHTML = state.theme === 'dark' ? ICONS.sun : ICONS.moon;
    themeBtn.addEventListener('click', function () {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      paintChrome();
    });
    bar.appendChild(chips);
    bar.appendChild(themeBtn);
  }

  function selectTool(id, expandId) {
    state.tool = id;
    state.openSection = null;
    state.expanded = expandId || null;
    var url = new URL(window.location.href);
    url.searchParams.set('tool', id);
    history.replaceState({}, '', url.pathname + '?' + url.searchParams.toString());
    paintChrome();
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    panel.innerHTML = '';
    if (state.toast) {
      var toast = el('div', 'admin-toast', state.toast);
      panel.appendChild(toast);
    }
    if (state.loading && !state.board) {
      panel.appendChild(el('div', 'admin-skeleton'));
      panel.appendChild(el('div', 'admin-skeleton'));
      panel.appendChild(el('div', 'admin-skeleton'));
      return;
    }
    if (!state.board) {
      panel.appendChild(el('div', 'admin-empty', 'The dashboard could not load.'));
      return;
    }
    if (state.tool === 'overview') renderOverview();
    else if (state.tool === 'inquiries') renderInquiries();
    else if (state.tool === 'purchases') renderPurchases();
    else renderSubscriptions();
  }

  function renderOverview() {
    var metrics = state.board.metrics;
    var grid = document.createElement('div');
    grid.className = 'admin-metrics';
    [
      [String(metrics.newInquiries), 'New inquiries', 'inquiries'],
      [String(metrics.unpaidInvoices), 'Unpaid invoices', 'purchases'],
      [metrics.paidThisMonthLabel, 'Paid this month', 'purchases'],
      [String(metrics.activeSubscriptions), 'Active subscriptions', 'subscriptions']
    ].forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-metric';
      button.appendChild(el('span', 'admin-metric__value', item[0]));
      button.appendChild(el('span', 'admin-metric__label', item[1]));
      button.addEventListener('click', function () { selectTool(item[2]); });
      grid.appendChild(button);
    });
    panel.appendChild(grid);
    panel.appendChild(el('p', 'admin-section-label', 'Needs attention'));
    if (!state.board.attention.length) {
      panel.appendChild(el('div', 'admin-empty', 'Nothing is waiting. New inquiries and unpaid packages will show up here.'));
      return;
    }
    var list = document.createElement('div');
    list.className = 'admin-list';
    state.board.attention.slice(0, 12).forEach(function (row) {
      var article = document.createElement('article');
      article.className = 'admin-row';
      var main = document.createElement('button');
      main.type = 'button';
      main.className = 'admin-row__main';
      var copy = document.createElement('div');
      copy.appendChild(el('div', 'admin-row__title', row.title));
      copy.appendChild(el('div', 'admin-row__meta', row.detail + (row.at ? ' · ' + when(row.at) : '')));
      main.appendChild(copy);
      main.addEventListener('click', function () {
        selectTool(row.tool, row.id);
      });
      article.appendChild(main);
      list.appendChild(article);
    });
    panel.appendChild(list);
  }

  function toolbar(tool, chips) {
    var bar = document.createElement('div');
    bar.className = 'admin-toolbar';
    chips.forEach(function (chip) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-chip' + (state.filters[tool] === chip.id ? ' is-active' : '');
      button.textContent = chip.label + ' ';
      button.appendChild(el('span', '', String(chip.count)));
      button.addEventListener('click', function () {
        state.filters[tool] = chip.id;
        render();
      });
      bar.appendChild(button);
    });
    var input = document.createElement('input');
    input.className = 'admin-search';
    input.type = 'search';
    input.placeholder = 'Search records';
    input.value = state.recordQuery[tool] || '';
    input.setAttribute('aria-label', 'Search records');
    input.addEventListener('input', function () {
      state.recordQuery[tool] = input.value;
      render();
      var next = panel.querySelector('.admin-search');
      if (next) {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    });
    bar.appendChild(input);
    return bar;
  }

  function matchesQuery(parts) {
    var q = (state.recordQuery[state.tool] || '').trim().toLowerCase();
    if (!q) return true;
    return parts.join(' ').toLowerCase().indexOf(q) !== -1;
  }

  function renderInquiries() {
    if (!state.board.storageConfigured) {
      panel.appendChild(el('p', 'admin-banner admin-banner--warn', 'Inquiry storage is not connected. New form emails still send. Add BLOB_READ_WRITE_TOKEN to keep them on this board.'));
    }
    var rows = state.board.inquiries || [];
    var chips = [
      { id: 'all', label: 'All', count: rows.length },
      { id: 'contact', label: 'Contact', count: rows.filter(function (row) { return row.source === 'contact'; }).length },
      { id: 'roster', label: 'Roster', count: rows.filter(function (row) { return row.source === 'roster'; }).length },
      { id: 'journal', label: 'Journal', count: rows.filter(function (row) { return row.source === 'journal'; }).length },
      { id: 'new', label: 'New', count: rows.filter(function (row) { return row.status === 'new'; }).length }
    ];
    panel.appendChild(toolbar('inquiries', chips));
    var filtered = rows.filter(function (row) {
      var chip = state.filters.inquiries;
      if (chip === 'new' && row.status !== 'new') return false;
      if (chip !== 'all' && chip !== 'new' && row.source !== chip) return false;
      return matchesQuery([row.name, row.email, row.service, row.message, row.city, row.role]);
    });
    renderRows(filtered, inquiryRow, 'No inquiries in this view yet.');
  }

  function inquiryRow(row) {
    var article = document.createElement('article');
    article.className = 'admin-row';
    var main = document.createElement('button');
    main.type = 'button';
    main.className = 'admin-row__main';
    var copy = document.createElement('div');
    copy.appendChild(el('div', 'admin-row__title', row.name || 'Inquiry'));
    copy.appendChild(el('div', 'admin-row__meta', [row.email, row.service, when(row.submittedAt)].filter(Boolean).join(' · ')));
    var side = document.createElement('div');
    side.className = 'admin-row__side';
    side.appendChild(pill(row.source || 'contact'));
    side.appendChild(pill(row.status || 'new'));
    main.appendChild(copy);
    main.appendChild(side);
    main.addEventListener('click', function () {
      state.expanded = state.expanded === row.id ? null : row.id;
      render();
    });
    article.appendChild(main);
    if (state.expanded === row.id) article.appendChild(inquiryDetail(row));
    return article;
  }

  function inquiryDetail(row) {
    var detail = document.createElement('div');
    detail.className = 'admin-row__detail';
    var grid = document.createElement('div');
    grid.className = 'admin-detail-grid';
    var message = document.createElement('div');
    message.appendChild(el('div', 'admin-detail-label', 'Message'));
    message.appendChild(el('p', 'admin-detail-copy', row.message || '—'));
    var facts = document.createElement('div');
    facts.appendChild(el('div', 'admin-detail-label', 'Details'));
    var list = document.createElement('div');
    list.className = 'admin-facts';
    [
      ['Email', row.email],
      ['Service', row.service],
      ['City', row.city],
      ['Role', row.role],
      ['Portfolio', row.portfolio],
      ['Availability', row.availability]
    ].forEach(function (pair) {
      if (!pair[1]) return;
      var line = document.createElement('div');
      line.appendChild(el('strong', '', pair[0] + ': '));
      line.appendChild(document.createTextNode(pair[1]));
      list.appendChild(line);
    });
    facts.appendChild(list);
    grid.appendChild(message);
    grid.appendChild(facts);
    detail.appendChild(grid);
    var actions = document.createElement('div');
    actions.className = 'admin-actions';
    if (row.email) {
      var mail = document.createElement('a');
      mail.className = 'admin-btn admin-btn--primary';
      mail.href = 'mailto:' + row.email;
      mail.textContent = 'Email';
      actions.appendChild(mail);
    }
    ['reviewed', 'closed', 'spam', 'new'].forEach(function (status) {
      if (row.status === status) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-btn' + (status === 'spam' ? ' admin-btn--danger' : '');
      button.textContent = labelFor(status);
      button.disabled = state.busyId === row.id;
      button.addEventListener('click', function () { updateInquiry(row.id, status); });
      actions.appendChild(button);
    });
    detail.appendChild(actions);
    return detail;
  }

  function renderPurchases() {
    if (state.board.stripeConfigured === false) {
      panel.appendChild(el('p', 'admin-banner admin-banner--warn', 'Stripe is not configured, so purchases cannot load.'));
    }
    var rows = state.board.invoices || [];
    var chips = [
      { id: 'attention', label: 'Needs attention', count: rows.filter(needsInvoice).length },
      { id: 'open', label: 'Open', count: rows.filter(function (row) { return row.status === 'open' || row.status === 'overdue'; }).length },
      { id: 'paid', label: 'Paid', count: rows.filter(function (row) { return row.status === 'paid'; }).length },
      { id: 'void', label: 'Void', count: rows.filter(function (row) { return row.status === 'void'; }).length },
      { id: 'all', label: 'All', count: rows.length }
    ];
    panel.appendChild(toolbar('purchases', chips));
    var filtered = rows.filter(function (row) {
      var chip = state.filters.purchases;
      if (chip === 'attention' && !needsInvoice(row)) return false;
      if (chip === 'open' && row.status !== 'open' && row.status !== 'overdue') return false;
      if (chip === 'paid' && row.status !== 'paid') return false;
      if (chip === 'void' && row.status !== 'void') return false;
      return matchesQuery([row.customerName, row.customerEmail, row.packageName, row.ref, row.number, row.servicesList]);
    });
    renderRows(filtered, invoiceRow, 'No purchases in this view yet.');
  }

  function needsInvoice(row) {
    return ['open', 'overdue', 'uncollectible'].indexOf(row.status) !== -1;
  }

  function invoiceRow(row) {
    return recordRow(row, row.customerName, [row.packageName, row.ref, when(row.createdAt)].filter(Boolean).join(' · '), row.amountLabel, row.status, function () {
      return invoiceDetail(row);
    });
  }

  function invoiceDetail(row) {
    var detail = document.createElement('div');
    detail.className = 'admin-row__detail';
    detail.appendChild(factsBlock('Invoice', [
      ['Client', row.customerName],
      ['Email', row.customerEmail],
      ['Phone', row.customerPhone],
      ['Package', row.servicesList || row.packageName],
      ['Due', when(row.dueAt)],
      ['Paid', when(row.paidAt)]
    ]));
    var actions = document.createElement('div');
    actions.className = 'admin-actions';
    if (row.hostedUrl) actions.appendChild(linkButton('Open invoice', row.hostedUrl, true));
    if (row.hostedUrl) actions.appendChild(actionButton('Copy link', row.id, function () { copyText(row.hostedUrl); }));
    if (row.hostedUrl && row.status !== 'void') actions.appendChild(actionButton('Resend invoice', row.id, function () { invoiceAction(row, 'resend'); }));
    if (['open', 'overdue', 'uncollectible'].indexOf(row.status) !== -1) {
      actions.appendChild(actionButton('Mark paid', row.id, function () { invoiceAction(row, 'mark_paid'); }));
    }
    if (row.customerEmail) actions.appendChild(mailButton(row.customerEmail));
    actions.appendChild(linkButton('Open in Stripe', row.dashboardUrl, false));
    if (['open', 'overdue', 'uncollectible'].indexOf(row.status) !== -1) {
      actions.appendChild(dangerButton('Void', row.id, function () {
        confirmAction('Void invoice', 'Void the invoice for ' + row.customerName + ' (' + row.amountLabel + ')? They will not be able to pay this link.').then(function (ok) {
          if (ok) invoiceAction(row, 'void');
        });
      }));
    }
    if (row.status === 'paid') {
      actions.appendChild(dangerButton('Refund', row.id, function () {
        confirmAction('Refund payment', 'Refund ' + row.amountLabel + ' to ' + row.customerName + '? Stripe will return the card payment.').then(function (ok) {
          if (ok) invoiceAction(row, 'refund');
        });
      }));
    }
    detail.appendChild(actions);
    return detail;
  }

  function renderSubscriptions() {
    if (state.board.stripeConfigured === false) {
      panel.appendChild(el('p', 'admin-banner admin-banner--warn', 'Stripe is not configured, so subscriptions cannot load.'));
    }
    var rows = state.board.subscriptions || [];
    var chips = [
      { id: 'attention', label: 'Needs attention', count: rows.filter(function (row) { return row.status === 'past_due' || row.stripeStatus === 'incomplete'; }).length },
      { id: 'active', label: 'Active', count: rows.filter(function (row) { return row.status === 'active'; }).length },
      { id: 'past_due', label: 'Past due', count: rows.filter(function (row) { return row.status === 'past_due'; }).length },
      { id: 'paused', label: 'Paused', count: rows.filter(function (row) { return row.status === 'paused'; }).length },
      { id: 'ended', label: 'Ended', count: rows.filter(function (row) { return row.status === 'ended'; }).length },
      { id: 'all', label: 'All', count: rows.length }
    ];
    panel.appendChild(toolbar('subscriptions', chips));
    var filtered = rows.filter(function (row) {
      var chip = state.filters.subscriptions;
      if (chip === 'attention' && row.status !== 'past_due' && row.stripeStatus !== 'incomplete') return false;
      if (chip !== 'all' && chip !== 'attention' && row.status !== chip) return false;
      return matchesQuery([row.customerName, row.customerEmail, row.packageName, row.modelLabel, row.servicesList]);
    });
    renderRows(filtered, subscriptionRow, 'No subscriptions in this view yet.');
  }

  function subscriptionRow(row) {
    var meta = [row.modelLabel, row.amountLabel + '/mo', when(row.nextBillAt) ? 'Next ' + when(row.nextBillAt) : ''].filter(Boolean).join(' · ');
    return recordRow(row, row.customerName, meta, row.packageName, row.status, function () {
      return subscriptionDetail(row);
    });
  }

  function subscriptionDetail(row) {
    var detail = document.createElement('div');
    detail.className = 'admin-row__detail';
    var endLabel = row.model === 'setup_then_monthly'
      ? 'Ongoing'
      : (row.commitmentEnd ? when(row.commitmentEnd) : '—');
    detail.appendChild(factsBlock('Subscription', [
      ['Client', row.customerName],
      ['Email', row.customerEmail],
      ['Phone', row.customerPhone],
      ['Plan', row.packageName],
      ['Model', row.modelLabel],
      ['Monthly', row.amountLabel],
      ['Commitment ends', endLabel],
      ['Next invoice', when(row.nextBillAt)],
      ['Latest invoice', row.latestInvoice ? row.latestInvoice.status + ' · ' + row.latestInvoice.amountLabel : '']
    ]));
    var actions = document.createElement('div');
    actions.className = 'admin-actions';
    var latest = row.latestInvoice;
    if (latest && latest.hostedUrl) actions.appendChild(linkButton('Open current invoice', latest.hostedUrl, true));
    if (latest && latest.hostedUrl && latest.status !== 'void') {
      actions.appendChild(actionButton('Resend invoice', row.id, function () { subscriptionAction(row, 'resend'); }));
    }
    if (latest && ['open', 'overdue', 'uncollectible'].indexOf(latest.status) !== -1) {
      actions.appendChild(actionButton('Mark current invoice paid', row.id, function () { subscriptionAction(row, 'mark_paid'); }));
    }
    if (row.status !== 'ended' && row.status !== 'paused') {
      actions.appendChild(actionButton('Pause billing', row.id, function () { subscriptionAction(row, 'pause'); }));
    }
    if (row.status === 'paused') {
      actions.appendChild(actionButton('Resume billing', row.id, function () { subscriptionAction(row, 'resume'); }, true));
    }
    if (row.customerEmail) actions.appendChild(mailButton(row.customerEmail));
    actions.appendChild(linkButton('Open in Stripe', row.dashboardUrl, false));
    if (row.status !== 'ended') {
      actions.appendChild(dangerButton('Cancel now', row.id, function () {
        var extra = row.commitmentEnd
          ? ' This retainer was set to run through ' + when(row.commitmentEnd) + '.'
          : ' This white-label plan is ongoing. Canceling stops future invoices.';
        confirmAction('Cancel subscription', 'Cancel ' + row.customerName + '’s ' + row.packageName + ' now?' + extra).then(function (ok) {
          if (ok) subscriptionAction(row, 'cancel_now');
        });
      }));
    }
    detail.appendChild(actions);
    return detail;
  }

  function recordRow(row, title, meta, sideText, status, detailFactory) {
    var article = document.createElement('article');
    article.className = 'admin-row';
    var main = document.createElement('button');
    main.type = 'button';
    main.className = 'admin-row__main';
    var copy = document.createElement('div');
    copy.appendChild(el('div', 'admin-row__title', title || 'Client'));
    copy.appendChild(el('div', 'admin-row__meta', meta));
    var side = document.createElement('div');
    side.className = 'admin-row__side';
    if (sideText && state.tool === 'purchases') side.appendChild(el('span', 'admin-row__amount', sideText));
    side.appendChild(pill(status));
    main.appendChild(copy);
    main.appendChild(side);
    main.addEventListener('click', function () {
      state.expanded = state.expanded === row.id ? null : row.id;
      render();
    });
    article.appendChild(main);
    if (state.expanded === row.id) article.appendChild(detailFactory());
    return article;
  }

  function factsBlock(title, pairs) {
    var wrap = document.createElement('div');
    wrap.appendChild(el('div', 'admin-detail-label', title));
    var list = document.createElement('div');
    list.className = 'admin-facts';
    pairs.forEach(function (pair) {
      if (!pair[1]) return;
      var line = document.createElement('div');
      line.appendChild(el('strong', '', pair[0] + ': '));
      line.appendChild(document.createTextNode(pair[1]));
      list.appendChild(line);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderRows(rows, factory, empty) {
    if (!rows.length) {
      panel.appendChild(el('div', 'admin-empty', empty));
      return;
    }
    var list = document.createElement('div');
    list.className = 'admin-list';
    rows.forEach(function (row) { list.appendChild(factory(row)); });
    panel.appendChild(list);
  }

  function linkButton(label, href, primary) {
    var anchor = document.createElement('a');
    anchor.className = 'admin-btn' + (primary ? ' admin-btn--primary' : '');
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.textContent = label;
    return anchor;
  }

  function mailButton(email) {
    var anchor = document.createElement('a');
    anchor.className = 'admin-btn';
    anchor.href = 'mailto:' + email;
    anchor.textContent = 'Email client';
    return anchor;
  }

  function actionButton(label, id, onClick, primary) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'admin-btn' + (primary ? ' admin-btn--primary' : '');
    button.textContent = label;
    button.disabled = state.busyId === id;
    button.addEventListener('click', onClick);
    return button;
  }

  function dangerButton(label, id, onClick) {
    var button = actionButton(label, id, onClick, false);
    button.className = 'admin-btn admin-btn--danger';
    return button;
  }

  function confirmAction(title, copy) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-copy').textContent = copy;
    confirmEl.hidden = false;
    return new Promise(function (resolve) { confirmResolve = resolve; });
  }

  function closeConfirm(ok) {
    confirmEl.hidden = true;
    if (confirmResolve) confirmResolve(ok);
    confirmResolve = null;
  }

  function saveBoard() {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(state.board)); } catch (e) {}
    recompute();
  }

  function recompute() {
    var board = state.board;
    if (!board) return;
    var now = new Date();
    var paid = (board.invoices || []).filter(function (row) {
      if (row.status !== 'paid' || !row.paidAt) return false;
      var date = new Date(row.paidAt);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
    var cents = paid.reduce(function (sum, row) { return sum + (row.amountCents || 0); }, 0);
    board.metrics = {
      newInquiries: (board.inquiries || []).filter(function (row) { return row.status === 'new'; }).length,
      unpaidInvoices: (board.invoices || []).filter(needsInvoice).length,
      paidThisMonthCents: cents,
      paidThisMonthLabel: money(cents),
      activeSubscriptions: (board.subscriptions || []).filter(function (row) { return row.status === 'active' || row.status === 'paused'; }).length
    };
    board.attention = [];
    (board.inquiries || []).filter(function (row) { return row.status === 'new'; }).forEach(function (row) {
      board.attention.push({ kind: 'inquiry', id: row.id, tool: 'inquiries', title: row.name || 'New inquiry', detail: labelFor(row.source || 'contact'), at: row.submittedAt });
    });
    (board.invoices || []).filter(needsInvoice).forEach(function (row) {
      board.attention.push({ kind: 'invoice', id: row.id, tool: 'purchases', title: row.customerName, detail: row.amountLabel + ' · ' + row.status, at: row.dueAt || row.createdAt });
    });
    (board.subscriptions || []).filter(function (row) { return row.status === 'past_due' || row.stripeStatus === 'incomplete'; }).forEach(function (row) {
      board.attention.push({ kind: 'subscription', id: row.id, tool: 'subscriptions', title: row.customerName, detail: row.packageName, at: row.nextBillAt || row.createdAt });
    });
  }

  function updateInquiry(id, status) {
    state.busyId = id;
    render();
    fetch('/api/admin/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, status: status })
    }).then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    }).then(function (result) {
      if (!result.ok) throw new Error(result.data.error || 'Could not update the inquiry.');
      state.board.inquiries = state.board.inquiries.map(function (row) {
        return row.id === id ? result.data.item : row;
      });
      state.toast = 'Inquiry marked ' + labelFor(status).toLowerCase() + '.';
      saveBoard();
    }).catch(function (err) {
      state.toast = err.message;
    }).then(function () {
      state.busyId = null;
      paintChrome();
      render();
    });
  }

  function invoiceAction(row, action) {
    state.busyId = row.id;
    render();
    fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, action: action })
    }).then(readJson).then(function (result) {
      if (!result.ok) throw new Error(result.data.error || 'Could not update the invoice.');
      state.board.invoices = state.board.invoices.map(function (item) {
        return item.id === row.id ? result.data.invoice : item;
      });
      state.toast = action === 'resend' ? 'Invoice email sent.' : 'Invoice updated.';
      saveBoard();
    }).catch(function (err) {
      state.toast = err.message;
    }).then(finishAction);
  }

  function subscriptionAction(row, action) {
    state.busyId = row.id;
    render();
    fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, action: action })
    }).then(readJson).then(function (result) {
      if (!result.ok) throw new Error(result.data.error || 'Could not update the subscription.');
      state.board.subscriptions = state.board.subscriptions.map(function (item) {
        return item.id === row.id ? result.data.subscription : item;
      });
      if (result.data.subscription.latestInvoice) {
        var latest = result.data.subscription.latestInvoice;
        state.board.invoices = state.board.invoices.map(function (item) {
          return item.id === latest.id ? latest : item;
        });
      }
      state.toast = action === 'resend' ? 'Invoice email sent.' : 'Subscription updated.';
      saveBoard();
    }).catch(function (err) {
      state.toast = err.message;
    }).then(finishAction);
  }

  function finishAction() {
    state.busyId = null;
    paintChrome();
    render();
  }

  function readJson(res) {
    return res.json().then(function (data) { return { ok: res.ok, data: data }; });
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        state.toast = 'Payment link copied.';
        render();
      });
      return;
    }
    state.toast = value;
    render();
  }

  function boot() {
    var saved = 'dark';
    try { saved = localStorage.getItem('cf-admin-theme') || 'dark'; } catch (e) {}
    applyTheme(saved);
    var params = new URLSearchParams(window.location.search);
    if (toolById(params.get('tool')).tool.id === params.get('tool')) state.tool = params.get('tool');

    document.getElementById('login-reveal').addEventListener('click', function () {
      var input = document.getElementById('login-password');
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      this.textContent = show ? 'Hide' : 'Show';
    });
    document.getElementById('login-form').addEventListener('submit', onLogin);
    document.getElementById('theme-toggle').addEventListener('click', function () {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('sign-out').addEventListener('click', signOut);
    document.getElementById('account-button').addEventListener('click', function (event) {
      event.stopPropagation();
      var menu = document.getElementById('account-menu');
      var rect = event.currentTarget.getBoundingClientRect();
      menu.hidden = !menu.hidden;
      menu.style.top = Math.min(rect.top, window.innerHeight - 160) + 'px';
      menu.style.left = (rect.right + 10) + 'px';
      event.currentTarget.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
    });
    document.addEventListener('click', function () {
      document.getElementById('account-menu').hidden = true;
    });
    document.getElementById('confirm-cancel').addEventListener('click', function () { closeConfirm(false); });
    document.getElementById('confirm-go').addEventListener('click', function () { closeConfirm(true); });
    document.getElementById('tool-search').addEventListener('input', onToolSearch);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        state.openSection = null;
        closeConfirm(false);
        paintChrome();
      }
    });

    var sessionReq = fetch('/api/admin/session', { headers: { Accept: 'application/json' } });
    var boardReq = fetch('/api/admin/board', { headers: { Accept: 'application/json' } });
    sessionReq.then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (session) {
        if (!session.ok) {
          showLogin();
          return null;
        }
        state.email = session.data.email || state.email;
        var cached = null;
        try { cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null'); } catch (e) {}
        if (cached && cached.invoices) {
          state.board = cached;
          state.loading = false;
        }
        showApp();
        return boardReq;
      })
      .then(function (boardRes) {
        if (!boardRes) return null;
        return boardRes.json().then(function (data) { return { ok: boardRes.ok, status: boardRes.status, data: data }; });
      })
      .then(function (result) {
        if (!result) return;
        if (result.status === 401) {
          showLogin();
          return;
        }
        if (!result.ok) throw new Error(result.data.error || 'Could not load the dashboard.');
        state.board = result.data;
        state.loading = false;
        saveBoard();
        paintChrome();
        render();
      })
      .catch(function (err) {
        state.loading = false;
        state.toast = err.message || 'Could not load the dashboard.';
        if (!appView.hidden) render();
      });
  }

  function onLogin(event) {
    event.preventDefault();
    var error = document.getElementById('login-error');
    var button = event.target.querySelector('button[type="submit"]');
    error.hidden = true;
    button.disabled = true;
    button.textContent = 'Signing in...';
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      })
    }).then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    }).then(function (result) {
      if (!result.ok) throw new Error(result.data.error || 'Email or password is incorrect.');
      state.email = result.data.email;
      state.loading = true;
      state.board = null;
      showApp();
      return fetch('/api/admin/board', { headers: { Accept: 'application/json' } });
    }).then(function (res) {
      if (!res) return null;
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    }).then(function (result) {
      if (!result) return;
      if (!result.ok) throw new Error(result.data.error || 'Could not load the dashboard.');
      state.board = result.data;
      state.loading = false;
      saveBoard();
      paintChrome();
      render();
    }).catch(function (err) {
      error.textContent = err.message;
      error.hidden = false;
    }).then(function () {
      button.disabled = false;
      button.textContent = 'Sign in';
    });
  }

  function onToolSearch() {
    var input = document.getElementById('tool-search');
    var box = document.getElementById('tool-results');
    var q = input.value.trim().toLowerCase();
    box.innerHTML = '';
    if (!q) {
      box.hidden = true;
      return;
    }
    var matches = [];
    SECTIONS.forEach(function (section) {
      section.tools.forEach(function (tool) {
        var hay = (tool.label + ' ' + tool.description + ' ' + section.label).toLowerCase();
        if (hay.indexOf(q) !== -1) matches.push({ section: section, tool: tool });
      });
    });
    box.hidden = false;
    if (!matches.length) {
      box.appendChild(el('div', 'admin-header__result-empty', 'No admin tools found.'));
      return;
    }
    matches.forEach(function (match) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-header__result';
      button.appendChild(el('div', 'admin-header__result-label', match.tool.label));
      button.appendChild(el('div', 'admin-header__result-meta', match.section.label + ' · ' + match.tool.description));
      button.addEventListener('click', function () {
        input.value = '';
        box.hidden = true;
        selectTool(match.tool.id);
      });
      box.appendChild(button);
    });
  }

  function signOut() {
    fetch('/api/admin/logout', { method: 'POST' }).finally(function () {
      try { sessionStorage.removeItem(CACHE_KEY); } catch (e) {}
      state.board = null;
      document.getElementById('login-password').value = '';
      showLogin();
    });
  }

  boot();
})();
