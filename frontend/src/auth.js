/* Autenticação local para demonstração. Não substitui autorização de servidor. */
(function () {
  'use strict';

  const KEYS = {
    users: 'sgq_senac_usuarios',
    session: 'sgq_senac_sessao',
    permissions: 'sgq_senac_permissoes'
  };
  const MODULES = [
    { id: 'dashboard', name: 'Painel PDCA' },
    { id: 'fluxo', name: 'Fluxograma, POP e Checklist' },
    { id: 'gut', name: 'Matriz GUT' },
    { id: 'pareto', name: 'Pareto' },
    { id: 'ishikawa', name: 'Ishikawa' },
    { id: 'porques', name: '5 Porquês' },
    { id: 'w2h', name: 'Plano 5W2H' },
    { id: 'reports', name: 'Relatórios' }
  ];
  const ADMIN_EMAIL = 'admin@sgqsenac.com';
  let currentUser = null;
  let permissionObserver = null;

  function uid() {
    return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function getUsers() {
    const users = read(KEYS.users, []);
    return Array.isArray(users) ? users : [];
  }
  function roleKey(role) {
    return role === 'Admin' ? 'admin' : 'usuario';
  }
  function defaultPermissions() {
    const matrix = {};
    MODULES.forEach(function (module) {
      matrix[module.id] = {
        admin: { view: true, edit: true, delete: true },
        usuario: { view: true, edit: true, delete: false }
      };
    });
    return matrix;
  }
  function ensureData() {
    let users = getUsers();
    const firstRun = !localStorage.getItem(KEYS.users);
    if (firstRun) {
      users = [{
        id: uid(),
        name: 'Administrador',
        email: ADMIN_EMAIL,
        role: 'Admin',
        active: true,
        passwordHash: ''
      }];
      write(KEYS.users, users);
    }
    if (!localStorage.getItem(KEYS.permissions)) {
      write(KEYS.permissions, defaultPermissions());
    }
    return { users: users, firstRun: firstRun };
  }
  async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('SHA-256 indisponível. Abra o sistema pelo servidor local do Vite.');
    }
    const bytes = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }
  function sessionUser() {
    const session = read(KEYS.session, null);
    if (!session || !session.userId) return null;
    return getUsers().find(function (user) {
      return user.id === session.userId && user.active;
    }) || null;
  }
  function goLogin() {
    window.location.replace('./login.html');
  }
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function allowed(moduleId, action) {
    if (currentUser && currentUser.role === 'Admin') return true;
    const matrix = read(KEYS.permissions, defaultPermissions());
    const role = currentUser ? roleKey(currentUser.role) : 'usuario';
    return !!(matrix[moduleId] && matrix[moduleId][role] && matrix[moduleId][role][action]);
  }
  function moduleForElement(element) {
    const view = element.closest('section.view');
    if (view) return view.id.replace(/^view-/, '');
    if (element.closest('.overlay,.panel')) return 'fluxo';
    return null;
  }
  function setDenied(element, denied) {
    element.classList.toggle('auth-denied', denied);
    if ('disabled' in element && element.matches('button,input,select,textarea')) {
      element.disabled = denied;
    }
    if (denied) {
      element.setAttribute('aria-disabled', 'true');
      element.setAttribute('tabindex', '-1');
    } else {
      element.removeAttribute('aria-disabled');
      if (element.getAttribute('tabindex') === '-1') element.removeAttribute('tabindex');
    }
  }
  function classifyButton(button) {
    const label = ((button.innerText || '') + ' ' + (button.getAttribute('aria-label') || '')).toLowerCase();
    const destructive = button.classList.contains('danger') ||
      /excluir|remover|apagar|🗑|delete/.test(label);
    return destructive ? 'delete' : 'edit';
  }
  function applyPermissions() {
    if (!currentUser || currentUser.role === 'Admin') return;
    MODULES.forEach(function (module) {
      const navButton = document.querySelector('#tabNav button[data-view="' + module.id + '"]');
      const view = document.getElementById('view-' + module.id);
      const canView = allowed(module.id, 'view');
      if (navButton) navButton.hidden = !canView;
      const mobileButton = document.querySelector('.mobile-bottom-nav [data-mobile-view="' + module.id + '"], .mobile-module-links [data-mobile-view="' + module.id + '"]');
      if (mobileButton) mobileButton.hidden = !canView;
      if (view && !canView && view.classList.contains('active')) {
        const dashboard = document.querySelector('#tabNav button[data-view="dashboard"]');
        if (dashboard && allowed('dashboard', 'view')) dashboard.click();
      }
      if (!view) return;
      const controls = Array.from(view.querySelectorAll('button,input,select,textarea'));
      if (module.id === 'fluxo') {
        document.querySelectorAll('.overlay button,.overlay input,.overlay select,.overlay textarea,.panel button,.panel input,.panel select,.panel textarea').forEach(function (control) {
          controls.push(control);
        });
      }
      controls.forEach(function (control) {
        if (control.closest('#tabNav') || control.matches('[data-auth-keep]')) return;
        const action = control.matches('button') ? classifyButton(control) : 'edit';
        setDenied(control, !canView || !allowed(module.id, action));
      });
    });
  }
  function installPermissionGuards() {
    document.addEventListener('click', function (event) {
      const control = event.target.closest('button,input,select,textarea');
      if (!control || control.classList.contains('auth-denied')) return;
      if (control.matches('button[data-view]') && currentUser.role !== 'Admin' && !allowed(control.dataset.view, 'view')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const dashboard = document.querySelector('#tabNav button[data-view="dashboard"]');
        if (dashboard && allowed('dashboard', 'view')) dashboard.click();
        return;
      }
      const moduleId = moduleForElement(control);
      if (!moduleId || currentUser.role === 'Admin') return;
      const action = control.matches('button') ? classifyButton(control) : 'edit';
      if (!allowed(moduleId, 'view') || !allowed(moduleId, action)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    ['beforeinput', 'input', 'change', 'keydown'].forEach(function (type) {
      document.addEventListener(type, function (event) {
        const control = event.target.closest && event.target.closest('input,select,textarea');
        if (!control) return;
        const moduleId = moduleForElement(control);
        if (moduleId && currentUser.role !== 'Admin' &&
            (!allowed(moduleId, 'view') || !allowed(moduleId, 'edit'))) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
    });
    if (window.MutationObserver) {
      permissionObserver = new MutationObserver(function (records) {
        if (records.some(function (record) { return record.type === 'childList'; })) applyPermissions();
      });
      permissionObserver.observe(document.querySelector('main.content'), { childList: true, subtree: true });
    }
  }

  function addAccountHeader() {
    const header = document.querySelector('header.app-header');
    if (!header) return;
    const account = document.createElement('div');
    account.className = 'auth-account';
    account.innerHTML =
      '<span class="auth-avatar" aria-hidden="true">' + escapeHTML((currentUser.name || '?').trim().charAt(0).toUpperCase()) + '</span>' +
      '<span class="auth-account-name">' + escapeHTML(currentUser.name) + '<small>' + escapeHTML(currentUser.role) + '</small></span>' +
      '<button type="button" class="auth-logout" aria-label="Sair da conta">Sair</button>';
    header.appendChild(account);
    account.querySelector('.auth-logout').addEventListener('click', function () {
      localStorage.removeItem(KEYS.session);
      goLogin();
    });
  }
  function addUsersNavigation() {
    const nav = document.getElementById('tabNav');
    if (!nav || currentUser.role !== 'Admin') return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.view = 'users';
    button.innerHTML = '<span class="num">ADM</span> Usuários';
    nav.appendChild(button);

    const view = document.createElement('section');
    view.className = 'view';
    view.id = 'view-users';
    view.innerHTML = usersViewMarkup();
    document.querySelector('main.content').appendChild(view);
    bindUsersView(view);
  }
  function usersViewMarkup() {
    return '<h2 class="view-title">Gestão de usuários <span class="tag">Admin</span></h2>' +
      '<p class="view-desc">Cadastre contas e configure o acesso de cada perfil.</p>' +
      '<div class="auth-admin-tabs" role="tablist" aria-label="Administração">' +
      '<button type="button" class="btn auth-admin-tab active" data-admin-tab="users" role="tab" aria-selected="true">Usuários</button>' +
      '<button type="button" class="btn ghost auth-admin-tab" data-admin-tab="permissions" role="tab" aria-selected="false">Permissões</button></div>' +
      '<div id="authUsersPanel" role="tabpanel"><div class="auth-toolbar">' +
      '<label class="auth-search-label" for="userSearch">Buscar usuário</label>' +
      '<input id="userSearch" type="search" placeholder="Nome ou e-mail" aria-label="Buscar por nome ou e-mail">' +
      '<button type="button" class="btn orange" id="newUserButton">Novo usuário</button></div>' +
      '<div id="userFormHost"></div><div class="auth-table-wrap"><table class="auth-users-table">' +
      '<thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead>' +
      '<tbody id="usersTableBody"></tbody></table></div><p id="usersEmpty" class="empty" hidden>Nenhum usuário encontrado.</p></div>' +
      '<div id="authPermissionsPanel" role="tabpanel" hidden><p class="view-desc">O perfil Admin mantém acesso total. As alterações do perfil Usuário são aplicadas imediatamente.</p>' +
      '<div id="permissionsTableHost"></div></div>';
  }
  function bindUsersView(view) {
    view.querySelectorAll('[data-admin-tab]').forEach(function (button) {
      button.addEventListener('click', function () {
        const showUsers = button.dataset.adminTab === 'users';
        view.querySelectorAll('[data-admin-tab]').forEach(function (tab) {
          const active = tab === button;
          tab.classList.toggle('active', active);
          tab.classList.toggle('ghost', !active);
          tab.setAttribute('aria-selected', String(active));
        });
        view.querySelector('#authUsersPanel').hidden = !showUsers;
        view.querySelector('#authPermissionsPanel').hidden = showUsers;
      });
    });
    view.querySelector('#userSearch').addEventListener('input', renderUsers);
    view.querySelector('#newUserButton').addEventListener('click', function () { showUserForm(null); });
    renderUsers();
    renderPermissions();
  }
  function showUserForm(user) {
    const host = document.getElementById('userFormHost');
    const editing = !!user;
    host.innerHTML = '<form id="managedUserForm" class="auth-user-form" aria-label="' +
      (editing ? 'Editar usuário' : 'Novo usuário') + '">' +
      '<h3>' + (editing ? 'Editar usuário' : 'Novo usuário') + '</h3>' +
      '<div class="auth-form-grid"><div><label for="managedName">Nome</label><input id="managedName" name="name" required maxlength="100" value="' + escapeHTML(editing ? user.name : '') + '"></div>' +
      '<div><label for="managedEmail">E-mail</label><input id="managedEmail" name="email" type="email" required value="' + escapeHTML(editing ? user.email : '') + '"></div>' +
      '<div><label for="managedRole">Perfil</label><select id="managedRole" name="role"><option' + (editing && user.role === 'Admin' ? ' selected' : '') + '>Admin</option><option' + (!editing || user.role === 'Usuário' ? ' selected' : '') + '>Usuário</option></select></div>' +
      (editing ? '' : '<div><label for="managedPassword">Senha inicial</label><input id="managedPassword" name="password" type="password" required minlength="6" autocomplete="new-password"></div>') +
      '</div><p class="auth-inline-error" role="alert"></p><div class="row-actions">' +
      '<button class="btn orange" type="submit">Salvar usuário</button><button class="btn ghost" type="button" data-cancel-form>Cancelar</button></div></form>';
    const form = host.querySelector('form');
    form.querySelector('[data-cancel-form]').addEventListener('click', function () { host.innerHTML = ''; });
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim().toLowerCase();
      const role = String(data.get('role'));
      const error = form.querySelector('.auth-inline-error');
      if (getUsers().some(function (entry) { return entry.email.toLowerCase() === email && (!editing || entry.id !== user.id); })) {
        error.textContent = 'Já existe uma conta com esse e-mail.';
        return;
      }
      try {
        const users = getUsers();
        if (editing) {
          const target = users.find(function (entry) { return entry.id === user.id; });
          if (!target) return;
          target.name = name;
          target.email = email;
          target.role = role;
        } else {
          users.push({ id: uid(), name: name, email: email, role: role, active: true, passwordHash: await hashPassword(String(data.get('password'))) });
        }
        write(KEYS.users, users);
        host.innerHTML = '';
        renderUsers();
        applyPermissions();
      } catch (failure) {
        error.textContent = failure.message;
      }
    });
    form.querySelector('input').focus();
  }
  function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    const query = document.getElementById('userSearch').value.trim().toLowerCase();
    const users = getUsers().filter(function (user) {
      return (user.name + ' ' + user.email).toLowerCase().includes(query);
    });
    document.getElementById('usersEmpty').hidden = users.length > 0;
    tbody.innerHTML = users.map(function (user) {
      const status = user.active ? 'Ativo' : 'Desativado';
      const self = user.id === currentUser.id;
      return '<tr><td>' + escapeHTML(user.name) + '</td><td>' + escapeHTML(user.email) + '</td><td>' + escapeHTML(user.role) + '</td>' +
        '<td><span class="stamp ' + (user.active ? 'lo' : 'hi') + '">' + status + '</span></td><td><div class="row-actions">' +
        '<button type="button" class="btn ghost small" data-action="edit">Editar</button>' +
        '<button type="button" class="btn ghost small" data-action="toggle" ' + (self ? 'disabled title="Não é possível desativar a própria conta"' : '') + '>' + (user.active ? 'Desativar' : 'Ativar') + '</button>' +
        '<button type="button" class="btn ghost small" data-action="reset">Resetar senha</button>' +
        '<button type="button" class="btn danger small" data-action="delete" ' + (self ? 'disabled title="Não é possível excluir a própria conta"' : '') + '>Excluir</button>' +
        '</div></td></tr>';
    }).join('');
    tbody.querySelectorAll('tr').forEach(function (row, index) {
      const user = users[index];
      row.querySelectorAll('[data-action]').forEach(function (button) {
        button.addEventListener('click', async function () {
          if (button.dataset.action === 'edit') showUserForm(user);
          if (button.dataset.action === 'toggle') {
            const list = getUsers();
            const target = list.find(function (entry) { return entry.id === user.id; });
            target.active = !target.active;
            write(KEYS.users, list);
            renderUsers();
          }
          if (button.dataset.action === 'delete' && window.confirm('Excluir ' + user.name + '?')) {
            write(KEYS.users, getUsers().filter(function (entry) { return entry.id !== user.id; }));
            renderUsers();
          }
          if (button.dataset.action === 'reset') {
            const password = window.prompt('Informe a nova senha inicial (mínimo de 6 caracteres):');
            if (!password) return;
            if (password.length < 6) { window.alert('A senha deve ter pelo menos 6 caracteres.'); return; }
            const list = getUsers();
            const target = list.find(function (entry) { return entry.id === user.id; });
            target.passwordHash = await hashPassword(password);
            write(KEYS.users, list);
            window.alert('Senha redefinida. Informe a nova senha ao usuário com segurança.');
          }
        });
      });
    });
  }
  function renderPermissions() {
    const host = document.getElementById('permissionsTableHost');
    if (!host) return;
    const matrix = read(KEYS.permissions, defaultPermissions());
    const actions = [
      { id: 'view', label: 'Ver' },
      { id: 'edit', label: 'Editar' },
      { id: 'delete', label: 'Excluir' }
    ];
    let html = '<div class="auth-table-wrap"><table class="auth-permissions-table"><thead><tr><th rowspan="2">Módulo</th><th colspan="3">Admin</th><th colspan="3">Usuário</th></tr><tr>';
    actions.concat(actions).forEach(function (action) { html += '<th>' + action.label + '</th>'; });
    html += '</tr></thead><tbody>';
    MODULES.forEach(function (module) {
      html += '<tr><th scope="row">' + escapeHTML(module.name) + '</th>';
      ['admin', 'usuario'].forEach(function (role) {
        actions.forEach(function (action) {
          const checked = !!(matrix[module.id] && matrix[module.id][role] && matrix[module.id][role][action.id]);
          const fixed = role === 'admin';
          html += '<td><input type="checkbox" aria-label="' + escapeHTML(action.label + ' ' + module.name + ' para ' + (fixed ? 'Admin' : 'Usuário')) + '" data-module="' + module.id + '" data-role="' + role + '" data-action="' + action.id + '" ' +
            (checked ? 'checked ' : '') + (fixed ? 'disabled title="Admin possui acesso total"' : '') + '></td>';
        });
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    host.innerHTML = html;
    host.querySelectorAll('input[data-module]').forEach(function (checkbox) {
      checkbox.addEventListener('change', function () {
        const latest = read(KEYS.permissions, defaultPermissions());
        latest[checkbox.dataset.module] = latest[checkbox.dataset.module] || {};
        latest[checkbox.dataset.module].usuario = latest[checkbox.dataset.module].usuario || {};
        latest[checkbox.dataset.module].usuario[checkbox.dataset.action] = checkbox.checked;
        write(KEYS.permissions, latest);
        applyPermissions();
      });
    });
  }

  async function login() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    const logo = document.querySelector('.login-logo');
    if (logo) {
      logo.addEventListener('error', function () {
        logo.hidden = true;
        const fallback = document.querySelector('.login-logo-fallback');
        if (fallback) fallback.hidden = false;
      }, { once: true });
    }
    const setup = ensureData();
    const admin = setup.users.find(function (user) { return user.email === ADMIN_EMAIL; });
    if (admin && !admin.passwordHash) {
      admin.passwordHash = await hashPassword('admin123');
      write(KEYS.users, setup.users);
      document.getElementById('defaultAdminNotice').hidden = false;
    } else if (setup.firstRun) {
      document.getElementById('defaultAdminNotice').hidden = false;
    }
    const button = document.getElementById('loginSubmit');
    const message = document.getElementById('loginMessage');
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      message.textContent = '';
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;
      if (!email || !document.getElementById('loginEmail').checkValidity()) {
        message.textContent = 'Informe um endereço de e-mail válido.';
        document.getElementById('loginEmail').focus();
        return;
      }
      if (!password) {
        message.textContent = 'Informe sua senha.';
        document.getElementById('loginPassword').focus();
        return;
      }
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = 'Entrando…';
      try {
        await new Promise(function (resolve) { window.setTimeout(resolve, 180); });
        const user = getUsers().find(function (entry) { return entry.email.toLowerCase() === email; });
        if (!user) message.textContent = 'E-mail não encontrado.';
        else if (!user.active) message.textContent = 'Este usuário está desativado. Entre em contato com o Admin.';
        else if (user.passwordHash !== await hashPassword(password)) message.textContent = 'Senha incorreta.';
        else {
          write(KEYS.session, { userId: user.id, createdAt: Date.now() });
          window.location.replace('./index.html');
          return;
        }
      } catch (error) {
        message.textContent = error.message;
      }
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = 'Entrar';
    });
    document.getElementById('forgotPassword').addEventListener('click', function () {
      message.textContent = 'Recuperação simulada: entre em contato com o administrador do sistema.';
    });
  }

  function loadAuthStyles() {
    if (document.querySelector('link[data-sgq-auth-style]')) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = './src/auth.css';
    stylesheet.dataset.sgqAuthStyle = 'true';
    document.head.appendChild(stylesheet);
  }

  function mobileNavMarkup() {
    const direct = [
      { id: 'dashboard', label: 'Painel', icon: '⌂' },
      { id: 'fluxo', label: 'Fluxograma', icon: '⇢' },
      { id: 'w2h', label: '5W2H', icon: '✓' }
    ];
    const entries = direct.map(function (entry) {
      return '<button type="button" data-mobile-view="' + entry.id + '" aria-label="' + entry.label + '">' +
        '<span class="mobile-nav-icon" aria-hidden="true">' + entry.icon + '</span><span>' + entry.label + '</span></button>';
    }).join('');
    return '<nav class="mobile-bottom-nav" aria-label="Navegação móvel">' + entries +
      '<button type="button" data-mobile-modules aria-expanded="false" aria-controls="mobileModuleDrawer">' +
      '<span class="mobile-nav-icon" aria-hidden="true">☷</span><span>Módulos</span></button></nav>' +
      '<div class="mobile-module-overlay" id="mobileModuleDrawer" hidden>' +
      '<section class="mobile-module-drawer" role="dialog" aria-modal="true" aria-labelledby="mobileDrawerTitle" tabindex="-1">' +
      '<div class="mobile-module-drawer-head"><h2 id="mobileDrawerTitle">Módulos</h2>' +
      '<button type="button" class="mobile-module-close" aria-label="Fechar menu de módulos">×</button></div>' +
      '<div class="mobile-module-links" id="mobileModuleLinks"></div></section></div>';
  }

  function addMobileNavigation() {
    if (document.querySelector('.mobile-bottom-nav')) return;
    document.body.insertAdjacentHTML('beforeend', mobileNavMarkup());
    const bar = document.querySelector('.mobile-bottom-nav');
    const overlay = document.querySelector('.mobile-module-overlay');
    const drawer = document.querySelector('.mobile-module-drawer');
    const openButton = bar.querySelector('[data-mobile-modules]');
    const moduleLinks = document.getElementById('mobileModuleLinks');
    let drawerCloseTimer = null;
    const moduleNames = {
      gut: { label: 'GUT', icon: '▥' },
      pareto: { label: 'Pareto', icon: '▤' },
      ishikawa: { label: 'Ishikawa', icon: '⑂' },
      porques: { label: '5 Porquês', icon: '↳' },
      users: { label: 'Usuários', icon: '♙' }
    };
    ['gut', 'pareto', 'ishikawa', 'porques'].forEach(function (id) {
      const original = document.querySelector('#tabNav button[data-view="' + id + '"]');
      if (!original) return;
      const item = moduleNames[id];
      moduleLinks.insertAdjacentHTML('beforeend',
        '<button type="button" class="mobile-module-link" data-mobile-view="' + id + '">' +
        '<span class="mobile-nav-icon" aria-hidden="true">' + item.icon + '</span><span>' + item.label + '</span></button>');
    });
    if (currentUser.role === 'Admin' && document.querySelector('#tabNav button[data-view="users"]')) {
      moduleLinks.insertAdjacentHTML('beforeend',
        '<button type="button" class="mobile-module-link" data-mobile-view="users">' +
        '<span class="mobile-nav-icon" aria-hidden="true">' + moduleNames.users.icon + '</span><span>' + moduleNames.users.label + '</span></button>');
    }

    function closeDrawer(restoreFocus) {
      window.clearTimeout(drawerCloseTimer);
      overlay.classList.remove('is-open');
      drawerCloseTimer = window.setTimeout(function () { overlay.hidden = true; }, 230);
      openButton.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-drawer-open');
      if (restoreFocus) openButton.focus();
    }
    function openDrawer() {
      window.clearTimeout(drawerCloseTimer);
      overlay.hidden = false;
      window.requestAnimationFrame(function () { overlay.classList.add('is-open'); });
      openButton.setAttribute('aria-expanded', 'true');
      document.body.classList.add('mobile-drawer-open');
      const firstLink = moduleLinks.querySelector('button:not([hidden])');
      (firstLink || drawer.querySelector('.mobile-module-close')).focus();
    }
    function syncMobileNavigation() {
      const active = document.querySelector('#tabNav button.active[data-view]');
      const activeView = active ? active.dataset.view : 'dashboard';
      const isDirectView = ['dashboard', 'fluxo', 'w2h'].includes(activeView);
      openButton.setAttribute('aria-current', isDirectView ? 'false' : 'page');
      bar.querySelectorAll('[data-mobile-view]').forEach(function (button) {
        const isActive = button.dataset.mobileView === activeView;
        if (button.closest('.mobile-module-links')) {
          button.setAttribute('aria-current', isActive ? 'page' : 'false');
        } else if (button.dataset.mobileView) {
          button.setAttribute('aria-current', isActive ? 'page' : 'false');
        }
      });
    }
    bar.addEventListener('click', function (event) {
      const button = event.target.closest('[data-mobile-view]');
      if (!button) return;
      const original = document.querySelector('#tabNav button[data-view="' + button.dataset.mobileView + '"]');
      if (original && !original.hidden) original.click();
      closeDrawer(false);
      syncMobileNavigation();
    });
    openButton.addEventListener('click', function () {
      if (overlay.hidden) openDrawer();
      else closeDrawer(false);
    });
    drawer.querySelector('.mobile-module-close').addEventListener('click', function () { closeDrawer(true); });
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeDrawer(true);
    });
    document.addEventListener('keydown', function (event) {
      if (overlay.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer(true);
      } else if (event.key === 'Tab') {
        const focusable = Array.from(drawer.querySelectorAll('button:not([hidden]):not(:disabled)'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    document.getElementById('tabNav').addEventListener('click', function () {
      syncMobileNavigation();
      closeDrawer(false);
    });
    syncMobileNavigation();
  }
  function bootApp() {
    loadAuthStyles();
    ensureData();
    currentUser = sessionUser();
    if (!currentUser) {
      goLogin();
      return;
    }
    addAccountHeader();
    addUsersNavigation();
    addMobileNavigation();
    installPermissionGuards();
    applyPermissions();
  }

  if (document.body.dataset.page === 'login') {
    login();
  } else {
    bootApp();
  }
})();
