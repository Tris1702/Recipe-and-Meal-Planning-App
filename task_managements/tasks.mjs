#!/usr/bin/env node
// Quản lý ticket từ planning/05-implementation-plan.md.
//   node task_managements/tasks.mjs split   # tách task trong plan thành tickets/<ID>.md; ticket đã có thì cập nhật nội
//                                           # dung theo plan, giữ status, assignee, mục Ghi chú
//   node task_managements/tasks.mjs build   # sinh board.html + process_task.md, đồng bộ ô [x] trong plan
//   node task_managements/tasks.mjs serve   # board ở http://localhost:4173, kéo thẻ để đổi status
//   node task_managements/tasks.mjs         # split rồi build
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const PLAN = join(ROOT, 'planning', '05-implementation-plan.md');
const TICKETS = join(HERE, 'tickets');

const STATUSES = ['todo', 'in-progress', 'review', 'done', 'blocked'];
const STATUS_LABEL = {
  'todo': 'Chưa làm',
  'in-progress': 'Đang làm',
  'review': 'Đang review',
  'done': 'Xong',
  'blocked': 'Bị chặn',
};
const TRACKS = ['BE', 'WEB', 'APP', 'OPS'];
const ID_RE = /\b(?:BE|WEB|APP|OPS)-[0-9A-Z]+(?:\.[0-9]+)?\b/g;

const today = () => new Date().toISOString().slice(0, 10);

// ---------- split ----------

function parsePlan() {
  const lines = readFileSync(PLAN, 'utf8').split('\n');
  const tasks = [];
  let slice = null;
  let cur = null;

  const close = () => {
    if (!cur) return;
    while (cur.body.length && cur.body.at(-1).trim() === '') cur.body.pop();
    tasks.push(cur);
    cur = null;
  };

  lines.forEach((line, i) => {
    const h1 = line.match(/^# (?!Recipe)(.+)$/);
    const task = line.match(/^### \[( |x)\] (\S+) · (.+)$/);
    if (h1) { close(); slice = h1[1].trim(); return; }
    if (task) {
      close();
      cur = {
        id: task[2],
        title: task[3].trim(),
        slice,
        track: task[2].split('-')[0],
        checked: task[1] === 'x',
        line: i + 1,
        body: [],
      };
      return;
    }
    if (/^(##? |---$)/.test(line)) { close(); return; }
    if (cur) cur.body.push(line);
  });
  close();

  const allIds = tasks.map(t => t.id);
  for (const t of tasks) {
    const input = t.body.find(l => l.startsWith('**Input:**')) ?? '';
    let deps = [...new Set(input.match(ID_RE) ?? [])].filter(d => d !== t.id);
    if (/tất cả task BE và WEB/.test(input)) {
      deps = allIds.filter(d => d !== t.id && (d.startsWith('BE-') || d.startsWith('WEB-')));
    }
    t.depends_on = deps;
  }
  return tasks;
}

const NOTES_HEADING = '## Ghi chú';
const NOTES_DEFAULT = `${NOTES_HEADING}\n\n<!-- Tiến độ, quyết định, link commit/MR -->\n`;

function renderTicket(t, { status, assignee, updated, notes }) {
  return [
    '---',
    `id: ${t.id}`,
    `title: ${t.title}`,
    `slice: ${t.slice}`,
    `track: ${t.track}`,
    `status: ${status}`,
    `depends_on: [${t.depends_on.join(', ')}]`,
    `assignee:${assignee ? ` ${assignee}` : ''}`,
    `updated: ${updated}`,
    `source: planning/05-implementation-plan.md#L${t.line}`,
    '---',
    '',
    `# ${t.id} · ${t.title}`,
    '',
    ...t.body.filter((l, i) => i > 0 || l.trim() !== ''),
    '',
    notes,
  ].join('\n');
}

// Tạo ticket mới cho task chưa có; ticket đã có thì làm mới nội dung theo plan nhưng giữ status, assignee và mục Ghi chú.
function split() {
  if (!existsSync(TICKETS)) mkdirSync(TICKETS);
  const tasks = parsePlan();
  let created = 0;
  let synced = 0;
  for (const t of tasks) {
    const file = join(TICKETS, `${t.id}.md`);
    if (!existsSync(file)) {
      const fresh = { status: t.checked ? 'done' : 'todo', assignee: '', updated: today(), notes: NOTES_DEFAULT };
      writeFileSync(file, renderTicket(t, fresh));
      created++;
      continue;
    }
    const old = readFileSync(file, 'utf8');
    const prev = parseTicket(file);
    const notesAt = old.indexOf(`\n${NOTES_HEADING}\n`);
    const notes = notesAt === -1 ? NOTES_DEFAULT : old.slice(notesAt + 1);
    const keep = { status: prev.status, assignee: prev.assignee ?? '', updated: prev.updated, notes };
    const strip = text => text.replace(/^updated:.*$/m, '');
    let next = renderTicket(t, keep);
    if (strip(next) !== strip(old)) {
      next = renderTicket(t, { ...keep, updated: today() });
      writeFileSync(file, next);
      synced++;
    }
  }
  console.log(`split: ${tasks.length} task trong plan, tạo mới ${created}, cập nhật ${synced} ticket.`);
}

// ---------- build ----------

function parseTicket(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: thiếu frontmatter`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    }
    meta[kv[1]] = v;
  }
  if (!STATUSES.includes(meta.status)) {
    throw new Error(`${relative(ROOT, file)}: status "${meta.status}" không hợp lệ (${STATUSES.join(' | ')})`);
  }
  meta.depends_on ??= [];
  meta.body = m[2].replace(/^# .*\n+/, '');
  meta.file = relative(HERE, file);
  return meta;
}

function loadTickets() {
  const order = parsePlan().map(t => t.id);
  const tickets = readdirSync(TICKETS)
    .filter(f => f.endsWith('.md'))
    .map(f => parseTicket(join(TICKETS, f)));
  const rank = id => (order.indexOf(id) === -1 ? 1e9 : order.indexOf(id));
  tickets.sort((a, b) => rank(a.id) - rank(b.id));

  const byId = Object.fromEntries(tickets.map(t => [t.id, t]));
  for (const t of tickets) {
    const missing = t.depends_on.filter(d => !byId[d]);
    if (missing.length) console.warn(`cảnh báo: ${t.id} phụ thuộc ticket không tồn tại: ${missing.join(', ')}`);
    t.waiting_on = t.depends_on.filter(d => byId[d] && byId[d].status !== 'done');
    t.ready = t.status === 'todo' && t.waiting_on.length === 0;
  }
  return tickets;
}

function syncPlanCheckboxes(tickets) {
  const status = Object.fromEntries(tickets.map(t => [t.id, t.status]));
  const before = readFileSync(PLAN, 'utf8');
  const after = before.replace(/^### \[( |x)\] (\S+) · /gm, (all, _box, id) =>
    id in status ? `### [${status[id] === 'done' ? 'x' : ' '}] ${id} · ` : all);
  if (after !== before) {
    writeFileSync(PLAN, after);
    console.log('build: đã đồng bộ ô [x] trong plan.');
  }
}

function count(list) {
  const c = Object.fromEntries(STATUSES.map(s => [s, 0]));
  for (const t of list) c[t.status]++;
  return c;
}

const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0);
const bar = p => '█'.repeat(Math.round(p / 10)) + '░'.repeat(10 - Math.round(p / 10));

function renderMarkdown(tickets) {
  const total = tickets.length;
  const c = count(tickets);
  const slices = [...new Set(tickets.map(t => t.slice))];
  const icon = { 'todo': '⬜', 'in-progress': '🟦', 'review': '🟨', 'done': '✅', 'blocked': '🟥' };
  const link = t => `${icon[t.status]} [${t.id}](${t.file})`;

  const out = [
    '# Tổng quan task',
    '',
    `> Sinh tự động bởi \`node task_managements/tasks.mjs build\` lúc ${new Date().toLocaleString('vi-VN')}.`,
    '> Đừng sửa tay file này — sửa `status` trong `tickets/<ID>.md` rồi build lại. Bản trực quan: [board.html](board.html).',
    '',
    `**Tiến độ:** ${c.done}/${total} xong · \`${bar(pct(c.done, total))}\` ${pct(c.done, total)}%`,
    '',
    '| Trạng thái | Số ticket |',
    '|---|---|',
    ...STATUSES.map(s => `| ${icon[s]} ${STATUS_LABEL[s]} | ${c[s]} |`),
    '',
    '## Theo nhóm',
    '',
    '| Nhóm | Xong | Tiến độ |',
    '|---|---|---|',
    ...TRACKS.map(tr => {
      const l = tickets.filter(t => t.track === tr);
      if (!l.length) return null;
      const d = count(l).done;
      return `| ${tr} | ${d}/${l.length} | \`${bar(pct(d, l.length))}\` ${pct(d, l.length)}% |`;
    }).filter(Boolean),
    '',
    '## Bảng theo lát',
    '',
    '| Lát | BE | Web | App | Ops |',
    '|---|---|---|---|---|',
    ...slices.map(s => {
      const cells = TRACKS.map(tr => tickets.filter(t => t.slice === s && t.track === tr).map(link).join('<br>'));
      return `| ${s} | ${cells.join(' | ')} |`;
    }),
    '',
    '## Có thể bắt đầu ngay',
    '',
    ...(tickets.filter(t => t.ready).map(t => `- ${link(t)} ${t.title}`)),
    ...(tickets.some(t => t.ready) ? [] : ['_Không có._']),
    '',
    '## Đang làm / review / bị chặn',
    '',
    ...(tickets.filter(t => ['in-progress', 'review', 'blocked'].includes(t.status))
      .map(t => `- ${link(t)} ${t.title}${t.assignee ? ` — @${t.assignee}` : ''}`)),
    ...(tickets.some(t => ['in-progress', 'review', 'blocked'].includes(t.status)) ? [] : ['_Không có._']),
    '',
  ];
  return out.join('\n');
}

function boardData(tickets) {
  return {
    generatedAt: new Date().toLocaleString('vi-VN'),
    statuses: STATUSES,
    statusLabel: STATUS_LABEL,
    tracks: TRACKS,
    tickets: tickets.map(({ id, title, slice, track, status, depends_on, waiting_on, ready, assignee, updated, file, body }) =>
      ({ id, title, slice, track, status, depends_on, waiting_on, ready, assignee, updated, file, body })),
  };
}

function renderHtml(tickets) {
  const data = JSON.stringify(boardData(tickets)).replace(/</g, '\\u003c');
  return readFileSync(join(HERE, 'board.template.html'), 'utf8').replace('/*__DATA__*/null', data);
}

function build({ quiet = false } = {}) {
  const tickets = loadTickets();
  syncPlanCheckboxes(tickets);
  writeFileSync(join(HERE, 'process_task.md'), renderMarkdown(tickets));
  writeFileSync(join(HERE, 'board.html'), renderHtml(tickets));
  if (!quiet) {
    const c = count(tickets);
    console.log(`build: ${tickets.length} ticket — ${STATUSES.map(s => `${s} ${c[s]}`).join(', ')}.`);
    console.log(`mở: ${join(HERE, 'board.html')}`);
  }
  return tickets;
}

// ---------- serve ----------

function setStatus(id, status) {
  if (!/^[A-Z]+-[0-9A-Z.]+$/.test(id)) throw new HttpError(400, `mã ticket không hợp lệ: ${id}`);
  if (!STATUSES.includes(status)) throw new HttpError(400, `status không hợp lệ: ${status}`);
  const file = join(TICKETS, `${id}.md`);
  if (!existsSync(file)) throw new HttpError(404, `không có ticket ${id}`);
  const text = readFileSync(file, 'utf8');
  const end = text.indexOf('\n---', 3);
  const head = text.slice(0, end)
    .replace(/^status:.*$/m, `status: ${status}`)
    .replace(/^updated:.*$/m, `updated: ${today()}`);
  writeFileSync(file, head + text.slice(end));
}

class HttpError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

async function serve() {
  const { createServer } = await import('node:http');
  const port = Number(process.env.PORT ?? 4173);
  build({ quiet: true });

  const send = (res, code, body, type = 'application/json; charset=utf-8') => {
    res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };

  createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/board.html')) {
        return send(res, 200, renderHtml(loadTickets()), 'text/html; charset=utf-8');
      }
      if (req.method === 'GET' && url.pathname === '/api/data') {
        return send(res, 200, boardData(loadTickets()));
      }
      const m = url.pathname.match(/^\/api\/tickets\/([^/]+)$/);
      if (req.method === 'PATCH' && m) {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const { status } = JSON.parse(raw || '{}');
        const id = decodeURIComponent(m[1]);
        setStatus(id, status);
        console.log(`${id} → ${status}`);
        return send(res, 200, boardData(build({ quiet: true })));
      }
      send(res, 404, { detail: 'not found' });
    } catch (e) {
      send(res, e.code ?? 500, { detail: e.message });
    }
  }).listen(port, '127.0.0.1', () => {
    console.log(`board: http://localhost:${port}  (Ctrl+C để dừng)`);
  });
}

const cmd = process.argv[2];
if (cmd === 'split') split();
else if (cmd === 'build') build();
else if (cmd === 'serve') serve();
else if (!cmd) { split(); build(); }
else { console.error(`lệnh không hợp lệ: ${cmd} (split | build | serve)`); process.exit(1); }
