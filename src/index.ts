import { timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'renewlet_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

const securityHeaders = {
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

function redirect(location: string, clearSession = false) {
  const headers = new Headers({ location, 'cache-control': 'no-store' });
  if (clearSession) {
    headers.set('set-cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
  }
  return new Response(null, { status: 303, headers });
}

function getCookie(request: Request, name: string) {
  const prefix = `${name}=`;
  return request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function base64Url(bytes: ArrayBuffer) {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function secureEqual(provided: string, expected: string) {
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  return timingSafeEqual(new Uint8Array(providedHash), new Uint8Array(expectedHash));
}

async function sessionSignature(username: string, expires: number, password: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(`${username}.${expires}`)));
}

async function createSessionCookie(env: Env) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const signature = await sessionSignature(env.AUTH_USERNAME, expires, env.AUTH_PASSWORD);
  return `${SESSION_COOKIE}=${expires}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

async function isAuthenticated(request: Request, env: Env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return false;
  const separator = token.indexOf('.');
  if (separator < 1) return false;
  const expires = Number(token.slice(0, separator));
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000)) return false;
  const expected = await sessionSignature(env.AUTH_USERNAME, expires, env.AUTH_PASSWORD);
  return secureEqual(token.slice(separator + 1), expected);
}

function isSameOrigin(request: Request) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'same-origin' || fetchSite === 'none') return true;
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

type Category = 'communication' | 'insurance' | 'warranty' | 'software_service';

const categoryMeta: Record<Category, { label: string; icon: string }> = {
  communication: { label: '通讯', icon: '📱' },
  insurance: { label: '保险', icon: '🛡️' },
  warranty: { label: '保修', icon: '🔧' },
  software_service: { label: '软件/服务', icon: '💳' },
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...securityHeaders, 'content-type': 'application/json; charset=utf-8' }
});

const html = (body: string, status = 200) => new Response(body, {
  status,
  headers: { ...securityHeaders, 'content-type': 'text/html; charset=utf-8' }
});

function loginHtml(invalid = false) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>登录 · MyRenewlet</title>
<style>
:root{font-family:Inter,-apple-system,BlinkMacSystemFont,"SF Pro Display","PingFang SC","Segoe UI",sans-serif;color:#0b1930;background:#dce8f5;--blue:#0878ff}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:36px;overflow:hidden;background:#dce8f5}.scene,.scene::before,.scene::after{position:fixed;pointer-events:none}.scene{inset:0;background:#dfe9f6}.scene::before{content:"";width:47vw;height:72vh;left:-10vw;bottom:-18vh;border-radius:44% 56% 38% 62%;background:#0878ff;filter:blur(55px);opacity:.82;transform:rotate(-12deg)}.scene::after{content:"";width:43vw;height:58vh;right:-11vw;top:-12vh;border-radius:55% 45% 62% 38%;background:#8971f2;filter:blur(65px);opacity:.62}.preview{position:fixed;inset:5vh 4vw;border:1px solid rgba(255,255,255,.45);border-radius:36px;background:rgba(240,247,255,.27);box-shadow:inset 0 1px 0 rgba(255,255,255,.62);filter:blur(8px);opacity:.52;overflow:hidden}.preview::before{content:"";position:absolute;inset:0 auto 0 0;width:19%;background:rgba(6,32,74,.72)}.preview::after{content:"";position:absolute;left:24%;right:5%;top:14%;height:22%;border-radius:24px;background:rgba(255,255,255,.42);box-shadow:0 190px 0 rgba(30,180,220,.28),430px 190px 0 rgba(255,106,124,.26)}.card{position:relative;width:min(540px,100%);padding:42px 48px 34px;border:1px solid rgba(255,255,255,.86);border-radius:38px;background:rgba(244,249,255,.62);box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px rgba(108,150,201,.12),0 34px 90px rgba(18,47,91,.28),0 4px 18px rgba(25,66,125,.14);-webkit-backdrop-filter:blur(36px) saturate(145%);backdrop-filter:blur(36px) saturate(145%);isolation:isolate}.card::before{content:"";position:absolute;inset:1px 22px auto;height:1px;background:rgba(255,255,255,.96);box-shadow:0 2px 18px 4px rgba(255,255,255,.72)}.brand{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:32px;font-size:19px;font-weight:800;letter-spacing:-.02em}.mark{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;color:white;font-weight:900;background:var(--blue);border:1px solid rgba(255,255,255,.82);box-shadow:inset 0 1px 1px rgba(255,255,255,.8),0 12px 28px rgba(0,108,255,.28)}h1{font-size:32px;letter-spacing:-.045em;margin:0 0 10px;text-align:center}p{margin:0 0 27px;color:#536681;line-height:1.65;text-align:center}.field{display:flex;flex-direction:column;gap:8px;margin-top:17px}label{font-size:13px;font-weight:750;color:#334b69}input{width:100%;height:50px;border:1px solid rgba(92,134,184,.38);border-radius:15px;padding:0 15px;background:rgba(255,255,255,.54);box-shadow:inset 0 1px 2px rgba(41,76,119,.08),0 1px 0 rgba(255,255,255,.8);color:#0a1730;font:inherit;outline:none;transition:border-color .18s,box-shadow .18s,background .18s}input:hover{background:rgba(255,255,255,.68)}input:focus{border-color:rgba(8,120,255,.72);background:rgba(255,255,255,.8);box-shadow:0 0 0 4px rgba(8,120,255,.13),inset 0 1px 1px rgba(41,76,119,.08)}.btn{width:100%;height:50px;border:1px solid rgba(255,255,255,.58);border-radius:15px;margin-top:25px;background:var(--blue);color:white;box-shadow:inset 0 1px 0 rgba(255,255,255,.48),0 12px 26px rgba(0,94,224,.27);font:inherit;font-weight:800;cursor:pointer;transition:transform .16s,filter .16s}.btn:hover{filter:brightness(1.06);transform:translateY(-1px)}.btn:active{transform:none}.error{padding:11px 13px;border:1px solid rgba(211,49,70,.22);border-radius:13px;background:rgba(255,233,237,.72);color:#a71931;font-size:13px;margin-bottom:3px}.hint{font-size:12px;color:#71839a;text-align:center;margin:21px 0 0}@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.card{background:#edf4fc}}@media(max-width:620px){body{padding:18px}.preview{inset:18px;border-radius:28px}.card{padding:34px 25px 28px;border-radius:30px}.brand{margin-bottom:27px}h1{font-size:28px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important}}
</style></head><body><div class="scene" aria-hidden="true"></div><div class="preview" aria-hidden="true"></div><main class="card"><div class="brand"><div class="mark">M</div><span>MyRenewlet</span></div><h1>登录 MyRenewlet</h1><p>登录后查看和管理家庭续费、保险与保修信息。</p>${invalid ? '<div class="error" role="alert">账号或密码不正确，请重试。</div>' : ''}<form method="post" action="/login"><div class="field"><label for="username">账号</label><input id="username" name="username" autocomplete="username" required autofocus></div><div class="field"><label for="password">密码</label><input id="password" name="password" type="password" autocomplete="current-password" required></div><button class="btn" type="submit">登录</button></form><p class="hint">登录状态将在 7 天后自动失效</p></main></body></html>`;
}

function dashboardHtml() {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MyRenewlet</title>
<style>
:root{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#111827;background:#f5f7fb}*{box-sizing:border-box}body{margin:0}.wrap{max-width:1180px;margin:auto;padding:24px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}.top-actions{display:flex;gap:8px;align-items:center}.top-actions form{margin:0}.brand h1{margin:0;font-size:28px}.brand p{margin:6px 0 0;color:#6b7280}.btn{border:0;border-radius:12px;padding:11px 16px;background:#111827;color:white;cursor:pointer;font-weight:700}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.stat,.panel{background:white;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 8px 26px rgba(15,23,42,.05)}.stat{padding:18px}.stat small{color:#6b7280}.stat b{display:block;font-size:25px;margin-top:7px}.filters{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.chip{border:1px solid #d1d5db;background:white;border-radius:999px;padding:8px 12px;cursor:pointer}.chip.active{background:#111827;color:white}.panel{overflow:hidden}.item{display:grid;grid-template-columns:1.5fr .8fr .8fr .9fr auto;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid #eef0f3}.item:last-child{border-bottom:0}.name{font-weight:800}.muted{font-size:13px;color:#6b7280}.warn{color:#b45309;font-weight:700}.danger{color:#dc2626;font-weight:700}.ok{color:#047857;font-weight:700}.money{font-weight:800}.empty{padding:35px;text-align:center;color:#6b7280}dialog{border:0;border-radius:18px;width:min(720px,94vw);padding:0;box-shadow:0 24px 80px #0003}dialog::backdrop{background:#11182788}.form{padding:22px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{display:flex;flex-direction:column;gap:6px}.field.full{grid-column:1/-1}label{font-size:13px;color:#4b5563}input,select,textarea{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:10px;background:white;font:inherit}textarea{min-height:82px}.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.secondary{background:#e5e7eb;color:#111827}.iconbtn{background:transparent;border:0;cursor:pointer;font-size:16px}.section-title{font-size:14px;font-weight:800;color:#374151;margin:18px 0 8px}
@media(max-width:800px){.stats{grid-template-columns:1fr 1fr}.item{grid-template-columns:1fr auto}.hide-sm{display:none}.wrap{padding:16px}.grid{grid-template-columns:1fr}.field.full{grid-column:auto}}
:root{color:#f7fbff;background:#0b315f;--blue:#0878ff;--glass:rgba(223,238,255,.19);--muted:rgba(229,241,255,.7)}body{min-height:100vh;background:#0b315f;color:#f7fbff;overflow-x:hidden}.ambient{position:fixed;inset:0;z-index:-2;background:#153f71;overflow:hidden}.shape{position:absolute;filter:blur(58px);opacity:.84}.shape.one{width:52vw;height:80vh;left:-13vw;top:-20vh;border-radius:38% 62% 58% 42%;background:#006eff;transform:rotate(-17deg)}.shape.two{width:40vw;height:58vh;right:-10vw;top:-13vh;border-radius:57% 43% 37% 63%;background:#8874ff}.shape.three{width:31vw;height:46vh;left:-10vw;bottom:-15vh;border-radius:50%;background:#ff6d75;opacity:.76}.ambient::after{content:"";position:absolute;inset:0;background:rgba(5,31,66,.22)}.wrap{max-width:1320px;margin:auto;padding:26px 28px 56px}.top{position:sticky;top:18px;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:13px 16px 13px 20px;margin-bottom:48px;border:1px solid rgba(255,255,255,.48);border-radius:23px;background:rgba(217,233,252,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.74),inset 0 0 0 1px rgba(71,128,184,.13),0 19px 48px rgba(1,18,47,.28),0 3px 12px rgba(5,24,54,.2);-webkit-backdrop-filter:blur(28px) saturate(150%);backdrop-filter:blur(28px) saturate(150%)}.top::before,.stats::before,.surface::before{content:"";position:absolute;inset:1px 20px auto;height:1px;background:rgba(255,255,255,.86);box-shadow:0 2px 14px 3px rgba(255,255,255,.28);pointer-events:none}.brand{display:flex;align-items:center;gap:12px}.brand-mark{width:40px;height:40px;border:1px solid rgba(255,255,255,.66);border-radius:13px;display:grid;place-items:center;background:rgba(0,112,255,.65);box-shadow:inset 0 1px 1px rgba(255,255,255,.62),0 9px 22px rgba(0,54,140,.24);font-weight:900}.brand h1{font-size:20px;color:#fff}.brand p{margin-top:3px;color:var(--muted);font-size:12px}.top-actions{display:flex;gap:9px}.btn{min-height:40px;border:1px solid rgba(255,255,255,.45);border-radius:13px;padding:9px 15px;background:var(--blue);color:white;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 10px 22px rgba(0,63,154,.26);font:inherit;font-weight:750;transition:transform .16s,filter .16s}.btn:hover{transform:translateY(-1px);filter:brightness(1.08)}.secondary{background:rgba(236,246,255,.16);color:#f5f9ff;box-shadow:inset 0 1px 0 rgba(255,255,255,.36)}.hero{margin:0 8px 23px}.hero h2{font-size:38px;line-height:1.05;letter-spacing:-.055em;margin:0}.hero p{margin:9px 0 0;color:var(--muted);font-size:15px}.stats{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-bottom:20px;border:1px solid rgba(255,255,255,.52);border-radius:23px;background:var(--glass);box-shadow:inset 0 1px 0 rgba(255,255,255,.58),0 22px 52px rgba(0,22,58,.24);-webkit-backdrop-filter:blur(25px) saturate(145%);backdrop-filter:blur(25px) saturate(145%);overflow:hidden}.stat{position:relative;padding:22px 25px;border:0;border-radius:0;background:transparent;box-shadow:none}.stat:not(:last-child)::after{content:"";position:absolute;right:0;top:20%;height:60%;width:1px;background:rgba(255,255,255,.27)}.stat small{color:var(--muted);font-size:13px}.stat b{font-size:29px;color:#fff;letter-spacing:-.03em}.surface{position:relative;border:1px solid rgba(255,255,255,.46);border-radius:24px;background:var(--glass);box-shadow:inset 0 1px 0 rgba(255,255,255,.54),0 25px 62px rgba(0,20,52,.25);-webkit-backdrop-filter:blur(27px) saturate(145%);backdrop-filter:blur(27px) saturate(145%);overflow:hidden}.filters{display:flex;gap:6px;align-items:center;padding:11px 16px;margin:0;border-bottom:1px solid rgba(255,255,255,.22);overflow-x:auto}.chip{border:1px solid transparent;background:transparent;color:rgba(244,249,255,.78);border-radius:12px;padding:8px 13px;white-space:nowrap;font:inherit;font-size:13px}.chip:hover{background:rgba(255,255,255,.1);color:white}.chip.active{border-color:rgba(255,255,255,.5);background:rgba(8,120,255,.72);color:white;box-shadow:inset 0 1px 0 rgba(255,255,255,.47),0 8px 18px rgba(0,49,123,.18)}.list-head,.item{display:grid;grid-template-columns:1.5fr .75fr .82fr .88fr auto;align-items:center;gap:13px;padding-left:22px;padding-right:22px}.list-head{min-height:43px;border-bottom:1px solid rgba(255,255,255,.22);color:rgba(226,239,255,.62);font-size:11px;letter-spacing:.035em}.item{min-height:70px;padding-top:12px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.16);transition:background .16s}.item:hover{background:rgba(255,255,255,.065)}.name{display:flex;align-items:center;gap:11px;color:#fff}.category-icon{width:34px;height:34px;flex:none;display:grid;place-items:center;border:1px solid rgba(255,255,255,.4);border-radius:11px;background:rgba(7,112,244,.48);box-shadow:inset 0 1px 0 rgba(255,255,255,.38),0 7px 15px rgba(0,32,79,.16);font-size:15px}.muted{color:rgba(225,239,255,.65)}.warn{color:#ffd27b}.danger{color:#ff9aa8}.ok{color:#adf1cf}.row-actions{display:flex;gap:4px;justify-content:flex-end}.iconbtn{border:1px solid transparent;border-radius:10px;padding:7px 9px;background:transparent;color:#cfe2ff;font:inherit;font-size:12px}.iconbtn:hover{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.09)}.iconbtn.delete{color:#ffb2bd}.empty{color:rgba(225,239,255,.68)}dialog{border:1px solid rgba(255,255,255,.62);border-radius:26px;color:#10223c;background:rgba(237,246,255,.78);box-shadow:inset 0 1px 0 #fff,0 36px 100px rgba(0,15,42,.48);-webkit-backdrop-filter:blur(34px) saturate(145%);backdrop-filter:blur(34px) saturate(145%)}dialog::backdrop{background:rgba(2,19,45,.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}.form{padding:27px}.form h2{margin:0 0 21px}.form label{color:#425a78;font-weight:700}.form input,.form select,.form textarea{border-color:rgba(78,119,167,.3);border-radius:12px;background:rgba(255,255,255,.66);color:#10223c;outline:none}.form input:focus,.form select:focus,.form textarea:focus{border-color:rgba(8,120,255,.72);box-shadow:0 0 0 3px rgba(8,120,255,.12)}.form .secondary{background:rgba(49,75,107,.12);color:#17304f;border-color:rgba(56,86,120,.14);box-shadow:none}@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.top,.stats,.surface{background:#214c7b}dialog{background:#eef5fc}}@media(max-width:800px){.wrap{padding:14px 13px 38px}.top{top:9px;margin-bottom:33px;padding:11px 12px;border-radius:19px}.brand p{display:none}.brand-mark{width:36px;height:36px}.top-actions{gap:6px}.btn{padding:8px 11px}.hero{margin-left:4px}.hero h2{font-size:31px}.stats{grid-template-columns:1fr 1fr;border-radius:20px}.stat{padding:18px}.stat:nth-child(2)::after{display:none}.stat:nth-child(-n+2){border-bottom:1px solid rgba(255,255,255,.2)}.stat b{font-size:24px}.surface{border-radius:20px}.list-head{display:none}.item{grid-template-columns:1fr auto;padding:14px 15px}.row-actions{grid-column:2;grid-row:1}.money{grid-column:1}.form{padding:22px 18px}}@media(max-width:470px){.top .brand h1{font-size:16px}.hero h2{font-size:28px}.stat{padding:15px}.stat b{font-size:21px}.chip{padding:7px 10px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important}}
.top .btn{white-space:nowrap}
.ambient{z-index:0;background:#4c6f96}.wrap{position:relative;z-index:1}.ambient::after{background:rgba(5,31,66,.08)}.shape.one{left:-8vw;top:-15vh;opacity:.88}.shape.two{width:52vw;height:72vh;right:-7vw;top:-4vh;opacity:.78}.shape.three{left:-6vw;bottom:-8vh;opacity:.78}
</style></head><body><div class="ambient" aria-hidden="true"><div class="shape one"></div><div class="shape two"></div><div class="shape three"></div></div><div class="wrap">
<div class="top"><div class="brand"><div class="brand-mark">M</div><div><h1>MyRenewlet</h1><p>家庭固定支出 · 保险 · 保修 · 服务生命周期</p></div></div><div class="top-actions"><form method="post" action="/logout"><button class="btn secondary" type="submit">退出</button></form><button class="btn" onclick="openForm()">＋ 新增项目</button></div></div>
<div class="hero"><h2>MyRenewlet</h2><p>家庭固定支出 · 保险 · 保修 · 服务生命周期</p></div>
<div class="stats"><div class="stat"><small>本月固定费用</small><b id="monthly">¥0</b></div><div class="stat"><small>年度折算费用</small><b id="yearly">¥0</b></div><div class="stat"><small>30 天内到期</small><b id="due30">0</b></div><div class="stat"><small>保修即将到期</small><b id="warrantySoon">0</b></div></div>
<div class="surface"><div class="filters" id="filters"></div><div class="list-head"><span>项目名称</span><span>费用</span><span>到期提醒</span><span>到期日期</span><span>操作</span></div><div id="list"><div class="empty">载入中...</div></div></div></div>
<dialog id="dlg"><form class="form" id="form"><h2 id="formTitle">新增项目</h2><input type="hidden" id="id"><div class="grid">
<div class="field"><label>名称 *</label><input id="name" required placeholder="例如：我的手机"></div>
<div class="field"><label>类型 *</label><select id="category"><option value="communication">📱 通讯</option><option value="insurance">🛡️ 保险</option><option value="warranty">🔧 保修</option><option value="software_service">💳 软件/服务</option></select></div>
<div class="field"><label>家庭成员</label><input id="owner" placeholder="我 / 媳妇 / 家庭"></div>
<div class="field"><label>服务商 / 品牌</label><input id="provider"></div>
<div class="field"><label>金额</label><input id="amount" type="number" step="0.01"></div>
<div class="field"><label>计费周期</label><select id="billing_cycle"><option value="none">无周期费用</option><option value="monthly">每月</option><option value="yearly">每年</option><option value="one_time">一次性</option></select></div>
<div class="field"><label>开始日期</label><input id="start_date" type="date"></div><div class="field"><label>结束 / 到期日期</label><input id="end_date" type="date"></div>
<div class="field"><label>下次续费日期</label><input id="next_renewal_date" type="date"></div><div class="field"><label>提前提醒（天）</label><input id="reminder_days" type="number" value="30"></div>
<div class="field"><label>合同 / 保单号</label><input id="contract_number"></div><div class="field"><label>序列号</label><input id="serial_number"></div>
<div class="field full"><label>网站</label><input id="website" type="url"></div><div class="field full"><label>备注</label><textarea id="notes"></textarea></div>
<div class="field"><label>状态</label><select id="status"><option value="active">启用</option><option value="paused">暂停</option><option value="ended">已结束</option></select></div>
<div class="field"><label><input id="auto_renew" type="checkbox" style="width:auto"> 自动续费</label></div>
</div><div class="actions"><button type="button" class="btn secondary" onclick="dlg.close()">取消</button><button class="btn">保存</button></div></form></dialog>
<script>
const cats={all:['全部','📋'],communication:['通讯','📱'],insurance:['保险','🛡️'],warranty:['保修','🔧'],software_service:['软件/服务','💳']};let items=[],current='all';
const yen=n=>'¥'+Math.round(n||0).toLocaleString('ja-JP');const days=d=>{if(!d)return null;return Math.ceil((new Date(d+'T00:00:00')-new Date())/86400000)};
async function load(){items=await fetch('/api/items').then(r=>r.json());render()}
function render(){const active=items.filter(x=>x.status==='active');const monthly=active.reduce((s,x)=>s+(x.billing_cycle==='monthly'?+x.amount||0:x.billing_cycle==='yearly'?(+x.amount||0)/12:0),0);const yearly=monthly*12;const due=active.filter(x=>{const d=days(x.end_date||x.next_renewal_date);return d!==null&&d>=0&&d<=30}).length;const ws=active.filter(x=>x.category==='warranty'&&(()=>{const d=days(x.end_date);return d!==null&&d>=0&&d<=x.reminder_days})()).length;monthlyEl.textContent=yen(monthly);yearlyEl.textContent=yen(yearly);due30El.textContent=due;warrantySoonEl.textContent=ws;
filters.innerHTML=Object.entries(cats).map(([k,v])=>'<button class="chip '+(current===k?'active':'')+'" data-category="'+k+'">'+v[1]+' '+v[0]+'</button>').join('');filters.querySelectorAll('.chip').forEach(button=>button.addEventListener('click',()=>{current=button.dataset.category;render()}));let rows=items.filter(x=>current==='all'||x.category===current);list.innerHTML=rows.length?rows.map(row).join(''):'<div class="empty">暂无项目</div>'}
function row(x){const c=cats[x.category],d=days(x.end_date||x.next_renewal_date);let status='';if(d!==null){status=d<0?'<span class="danger">已过期 '+(-d)+' 天</span>':d<=x.reminder_days?'<span class="warn">剩余 '+d+' 天</span>':'<span class="ok">剩余 '+d+' 天</span>'}else status='<span class="muted">未设置到期日</span>';let cost=x.amount?(x.billing_cycle==='monthly'?yen(x.amount)+'/月':x.billing_cycle==='yearly'?yen(x.amount)+'/年':yen(x.amount)):'—';return '<div class="item"><div><div class="name"><span class="category-icon">'+c[1]+'</span><span>'+esc(x.name)+'</span></div><div class="muted">'+esc([x.owner,x.provider].filter(Boolean).join(' · '))+'</div></div><div class="money">'+cost+'</div><div class="hide-sm">'+status+'</div><div class="muted hide-sm">'+(x.end_date||x.next_renewal_date||'—')+'</div><div class="row-actions"><button class="iconbtn" aria-label="编辑 '+esc(x.name)+'" onclick="edit('+x.id+')">编辑</button><button class="iconbtn delete" aria-label="删除 '+esc(x.name)+'" onclick="del('+x.id+')">删除</button></div></div>'}
function esc(s=''){return String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
const fields=['name','category','owner','provider','amount','billing_cycle','start_date','end_date','next_renewal_date','reminder_days','contract_number','serial_number','website','notes','status'];function openForm(){form.reset();id.value='';reminder_days.value=30;status.value='active';formTitle.textContent='新增项目';dlg.showModal()}function edit(i){const x=items.find(v=>v.id===i);openForm();id.value=x.id;formTitle.textContent='编辑项目';fields.forEach(k=>document.getElementById(k).value=x[k]??'');auto_renew.checked=!!x.auto_renew}async function del(i){if(!confirm('确定删除这个项目？'))return;await fetch('/api/items/'+i,{method:'DELETE'});load()}
form.addEventListener('submit',async e=>{e.preventDefault();const body={};fields.forEach(k=>body[k]=document.getElementById(k).value||null);body.amount=body.amount?Number(body.amount):null;body.reminder_days=Number(body.reminder_days||30);body.auto_renew=auto_renew.checked?1:0;const i=id.value;await fetch(i?'/api/items/'+i:'/api/items',{method:i?'PUT':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});dlg.close();load()});
const monthlyEl=document.getElementById('monthly'),yearlyEl=document.getElementById('yearly'),due30El=document.getElementById('due30'),warrantySoonEl=document.getElementById('warrantySoon');load();
</script></body></html>`;
}

const writable = ['name','category','owner','provider','amount','currency','billing_cycle','start_date','end_date','next_renewal_date','reminder_days','auto_renew','account_note','contract_number','serial_number','website','tags','notes','status'];

async function api(request: Request, env: Env, path: string) {
  if (path === '/api/items' && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM household_items ORDER BY status ASC, COALESCE(end_date,next_renewal_date,\'9999-12-31\') ASC, id DESC').all();
    return json(result.results);
  }
  if (path === '/api/items' && request.method === 'POST') {
    const body = await request.json<Record<string, unknown>>();
    const keys = writable.filter(k => body[k] !== undefined);
    const vals = keys.map(k => body[k]);
    if (!body.name || !body.category) return json({ error: 'name/category required' }, 400);
    const marks = keys.map(() => '?').join(',');
    const result = await env.DB.prepare(`INSERT INTO household_items (${keys.join(',')}) VALUES (${marks})`).bind(...vals).run();
    return json({ id: result.meta.last_row_id }, 201);
  }
  const match = path.match(/^\/api\/items\/(\d+)$/);
  if (match && request.method === 'PUT') {
    const id = Number(match[1]);
    const body = await request.json<Record<string, unknown>>();
    const keys = writable.filter(k => body[k] !== undefined);
    if (!keys.length) return json({ error: 'nothing to update' }, 400);
    await env.DB.prepare(`UPDATE household_items SET ${keys.map(k => `${k}=?`).join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(...keys.map(k => body[k]), id).run();
    return json({ ok: true });
  }
  if (match && request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM household_items WHERE id=?').bind(Number(match[1])).run();
    return json({ ok: true });
  }
  return json({ error: 'not found' }, 404);
}

async function login(request: Request, env: Env) {
  if (request.method === 'GET') {
    if (await isAuthenticated(request, env)) return redirect('/');
    return html(loginHtml());
  }
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: securityHeaders });
  if (!isSameOrigin(request)) return new Response('Forbidden', { status: 403, headers: securityHeaders });

  const form = await request.formData();
  const username = form.get('username');
  const password = form.get('password');
  const valid = typeof username === 'string' && typeof password === 'string' && (await Promise.all([
    secureEqual(username, env.AUTH_USERNAME),
    secureEqual(password, env.AUTH_PASSWORD),
  ])).every(Boolean);

  if (!valid) return html(loginHtml(true), 401);
  const headers = new Headers({ location: '/', 'cache-control': 'no-store' });
  headers.set('set-cookie', await createSessionCookie(env));
  return new Response(null, { status: 303, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/login') return login(request, env);
    if (url.pathname === '/logout' && request.method === 'POST') {
      if (!isSameOrigin(request)) return new Response('Forbidden', { status: 403, headers: securityHeaders });
      return redirect('/login', true);
    }

    if (!(await isAuthenticated(request, env))) {
      if (url.pathname.startsWith('/api/')) return json({ error: 'authentication required' }, 401);
      return redirect('/login');
    }
    if (request.method !== 'GET' && !isSameOrigin(request)) return json({ error: 'forbidden' }, 403);
    if (url.pathname.startsWith('/api/')) return api(request, env, url.pathname);
    if (url.pathname === '/' || url.pathname === '/index.html') return html(dashboardHtml());
    return new Response('Not Found', { status: 404, headers: securityHeaders });
  },
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    // Daily lifecycle scan hook. Notification providers will be added in the next phase.
    await env.DB.prepare("SELECT COUNT(*) AS total FROM household_items WHERE status='active' AND end_date IS NOT NULL AND date(end_date) <= date('now','+30 day')").first();
  }
} satisfies ExportedHandler<Env>;
