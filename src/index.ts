interface Env { DB: D1Database }

type Category = 'communication' | 'insurance' | 'warranty' | 'software_service';

const categoryMeta: Record<Category, { label: string; icon: string }> = {
  communication: { label: '通讯', icon: '📱' },
  insurance: { label: '保险', icon: '🛡️' },
  warranty: { label: '保修', icon: '🔧' },
  software_service: { label: '软件/服务', icon: '💳' },
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' }
});

const html = (body: string) => new Response(body, {
  headers: { 'content-type': 'text/html; charset=utf-8' }
});

function dashboardHtml() {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MyRenewlet</title>
<style>
:root{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#111827;background:#f5f7fb}*{box-sizing:border-box}body{margin:0}.wrap{max-width:1180px;margin:auto;padding:24px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}.brand h1{margin:0;font-size:28px}.brand p{margin:6px 0 0;color:#6b7280}.btn{border:0;border-radius:12px;padding:11px 16px;background:#111827;color:white;cursor:pointer;font-weight:700}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.stat,.panel{background:white;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 8px 26px rgba(15,23,42,.05)}.stat{padding:18px}.stat small{color:#6b7280}.stat b{display:block;font-size:25px;margin-top:7px}.filters{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.chip{border:1px solid #d1d5db;background:white;border-radius:999px;padding:8px 12px;cursor:pointer}.chip.active{background:#111827;color:white}.panel{overflow:hidden}.item{display:grid;grid-template-columns:1.5fr .8fr .8fr .9fr auto;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid #eef0f3}.item:last-child{border-bottom:0}.name{font-weight:800}.muted{font-size:13px;color:#6b7280}.warn{color:#b45309;font-weight:700}.danger{color:#dc2626;font-weight:700}.ok{color:#047857;font-weight:700}.money{font-weight:800}.empty{padding:35px;text-align:center;color:#6b7280}dialog{border:0;border-radius:18px;width:min(720px,94vw);padding:0;box-shadow:0 24px 80px #0003}dialog::backdrop{background:#11182788}.form{padding:22px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{display:flex;flex-direction:column;gap:6px}.field.full{grid-column:1/-1}label{font-size:13px;color:#4b5563}input,select,textarea{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:10px;background:white;font:inherit}textarea{min-height:82px}.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.secondary{background:#e5e7eb;color:#111827}.iconbtn{background:transparent;border:0;cursor:pointer;font-size:16px}.section-title{font-size:14px;font-weight:800;color:#374151;margin:18px 0 8px}
@media(max-width:800px){.stats{grid-template-columns:1fr 1fr}.item{grid-template-columns:1fr auto}.hide-sm{display:none}.wrap{padding:16px}.grid{grid-template-columns:1fr}.field.full{grid-column:auto}}
</style></head><body><div class="wrap">
<div class="top"><div class="brand"><h1>MyRenewlet</h1><p>家庭固定支出 · 保险 · 保修 · 服务生命周期</p></div><button class="btn" onclick="openForm()">＋ 新增项目</button></div>
<div class="stats"><div class="stat"><small>本月固定费用</small><b id="monthly">¥0</b></div><div class="stat"><small>年度折算费用</small><b id="yearly">¥0</b></div><div class="stat"><small>30 天内到期</small><b id="due30">0</b></div><div class="stat"><small>保修即将到期</small><b id="warrantySoon">0</b></div></div>
<div class="filters" id="filters"></div><div class="panel" id="list"><div class="empty">载入中...</div></div></div>
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
function render(){const active=items.filter(x=>x.status==='active');const monthly=active.reduce((s,x)=>s+(x.billing_cycle==='monthly'?+x.amount||0:x.billing_cycle==='yearly'?(+x.amount||0)/12:0),0);const yearly=monthly*12;const due=active.filter(x=>{const d=days(x.end_date||x.next_renewal_date);return d!==null&&d>=0&&d<=30}).length;const ws=active.filter(x=>x.category==='warranty'&&(()=>{const d=days(x.end_date);return d!==null&&d>=0&&d<=x.reminder_days})()).length;monthlyEl.textContent=yen(monthly);yearlyEl.textContent=yen(yearly);due30.textContent=due;warrantySoon.textContent=ws;
filters.innerHTML=Object.entries(cats).map(([k,v])=>'<button class="chip '+(current===k?'active':'')+'" onclick="current=\''+k+'\';render()">'+v[1]+' '+v[0]+'</button>').join('');let rows=items.filter(x=>current==='all'||x.category===current);list.innerHTML=rows.length?rows.map(row).join(''):'<div class="empty">暂无项目</div>'}
function row(x){const c=cats[x.category],d=days(x.end_date||x.next_renewal_date);let status='';if(d!==null){status=d<0?'<span class="danger">已过期 '+(-d)+' 天</span>':d<=x.reminder_days?'<span class="warn">剩余 '+d+' 天 ⚠️</span>':'<span class="ok">剩余 '+d+' 天</span>'}else status='<span class="muted">未设置到期日</span>';let cost=x.amount?(x.billing_cycle==='monthly'?yen(x.amount)+'/月':x.billing_cycle==='yearly'?yen(x.amount)+'/年':yen(x.amount)):'—';return '<div class="item"><div><div class="name">'+c[1]+' '+esc(x.name)+'</div><div class="muted">'+esc([x.owner,x.provider].filter(Boolean).join(' · '))+'</div></div><div class="money">'+cost+'</div><div class="hide-sm">'+status+'</div><div class="muted hide-sm">'+(x.end_date||x.next_renewal_date||'—')+'</div><div><button class="iconbtn" onclick="edit('+x.id+')">✏️</button><button class="iconbtn" onclick="del('+x.id+')">🗑️</button></div></div>'}
function esc(s=''){return String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
const fields=['name','category','owner','provider','amount','billing_cycle','start_date','end_date','next_renewal_date','reminder_days','contract_number','serial_number','website','notes','status'];function openForm(){form.reset();id.value='';reminder_days.value=30;status.value='active';formTitle.textContent='新增项目';dlg.showModal()}function edit(i){const x=items.find(v=>v.id===i);openForm();id.value=x.id;formTitle.textContent='编辑项目';fields.forEach(k=>document.getElementById(k).value=x[k]??'');auto_renew.checked=!!x.auto_renew}async function del(i){if(!confirm('确定删除这个项目？'))return;await fetch('/api/items/'+i,{method:'DELETE'});load()}
form.addEventListener('submit',async e=>{e.preventDefault();const body={};fields.forEach(k=>body[k]=document.getElementById(k).value||null);body.amount=body.amount?Number(body.amount):null;body.reminder_days=Number(body.reminder_days||30);body.auto_renew=auto_renew.checked?1:0;const i=id.value;await fetch(i?'/api/items/'+i:'/api/items',{method:i?'PUT':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});dlg.close();load()});
const monthlyEl=document.getElementById('monthly');load();
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return api(request, env, url.pathname);
    if (url.pathname === '/' || url.pathname === '/index.html') return html(dashboardHtml());
    return new Response('Not Found', { status: 404 });
  },
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    // Daily lifecycle scan hook. Notification providers will be added in the next phase.
    await env.DB.prepare("SELECT COUNT(*) AS total FROM household_items WHERE status='active' AND end_date IS NOT NULL AND date(end_date) <= date('now','+30 day')").first();
  }
};
