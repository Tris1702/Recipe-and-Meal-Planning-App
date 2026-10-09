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

// Ngày theo giờ máy (sv-SE cho dạng YYYY-MM-DD), không theo UTC.
const today = () => new Date().toLocaleDateString('sv-SE');
const readText = file => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const TASK_RE = /^### \[([ xX])\] (\S+) · (.+)$/;

// ---------- split ----------

function parsePlan() {
  const lines = readText(PLAN).split('\n');
  const tasks = [];
  let slice = null;
  let cur = null;
  let seenTitle = false;
  let inFence = false;

  const close = () => {
    if (!cur) return;
    while (cur.body.length && cur.body.at(-1).trim() === '') cur.body.pop();
    tasks.push(cur);
    cur = null;
  };

  lines.forEach(line => {
    // Trong khối code (```), dòng "# ..." hay "---" là nội dung, không phải tiêu đề/ranh giới.
    if (line.startsWith('```')) inFence = !inFence;
    if (inFence || line.startsWith('```')) {
      if (cur) cur.body.push(line);
      return;
    }
    const h1 = line.match(/^# (.+)$/);
    const task = line.match(TASK_RE);
    if (h1) {
      close();
      // H1 đầu tiên là tên tài liệu; các H1 sau là lát cắt.
      if (seenTitle) slice = h1[1].trim();
      seenTitle = true;
      return;
    }
    if (task) {
      close();
      cur = {
        id: task[2],
        title: task[3].trim(),
        slice,
        track: task[2].split('-')[0],
        checked: task[1] !== ' ',
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
    'source: planning/05-implementation-plan.md',
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
    const old = readText(file);
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

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
const TICKET_ID_RE = /^[A-Z]+-[0-9A-Z.]+$/;

function parseTicket(file) {
  const m = readText(file).match(FRONTMATTER_RE);
  if (!m) throw new Error(`${relative(ROOT, file)}: thiếu frontmatter`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  const where = relative(ROOT, file);
  if (!TICKET_ID_RE.test(meta.id ?? '')) throw new Error(`${where}: id "${meta.id}" không hợp lệ`);
  if (!STATUSES.includes(meta.status)) {
    throw new Error(`${where}: status "${meta.status}" không hợp lệ (${STATUSES.join(' | ')})`);
  }
  // Chỉ depends_on là danh sách; các trường khác (vd. title có "[...]") giữ nguyên chuỗi.
  meta.depends_on = (meta.depends_on ?? '').replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean);
  const badDep = meta.depends_on.find(d => !TICKET_ID_RE.test(d));
  if (badDep) throw new Error(`${where}: depends_on có mã không hợp lệ "${badDep}"`);
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
  const orphans = tickets.filter(t => !order.includes(t.id)).map(t => t.id);
  if (orphans.length) console.warn(`cảnh báo: ticket không còn trong plan: ${orphans.join(', ')}`);

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
  let inFence = false;
  // Bỏ qua dòng trong khối code, giống parsePlan.
  const after = before.split('\n').map(line => {
    if (line.startsWith('```')) inFence = !inFence;
    const m = !inFence && line.match(TASK_RE);
    if (!m || !(m[2] in status)) return line;
    return `### [${status[m[2]] === 'done' ? 'x' : ' '}] ${m[2]} · ${m[3]}`;
  }).join('\n');
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
    '> Sinh tự động bởi `node task_managements/tasks.mjs build`. Đừng sửa tay file này — sửa `status` trong',
    '> `tickets/<ID>.md` rồi build lại. Bản kanban: chạy `node task_managements/tasks.mjs serve` (kéo thả để đổi',
    '> trạng thái), hoặc mở `board.html` sinh ra sau khi build (file này không commit).',
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
  // Thay bằng hàm: chuỗi thay thế thường sẽ diễn giải "$&", "$'"… có trong nội dung ticket.
  return readFileSync(join(HERE, 'board.template.html'), 'utf8').replace('/*__DATA__*/null', () => data);
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

class HttpError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

function ticketFile(id) {
  if (!TICKET_ID_RE.test(id)) throw new HttpError(400, `mã ticket không hợp lệ: ${id}`);
  const file = join(TICKETS, `${id}.md`);
  if (!existsSync(file)) throw new HttpError(404, `không có ticket ${id}`);
  return file;
}

function setStatus(id, status) {
  if (!STATUSES.includes(status)) throw new HttpError(400, `status không hợp lệ: ${status}`);
  const file = ticketFile(id);
  const m = readText(file).match(FRONTMATTER_RE);
  if (!m || !/^status:/m.test(m[1]) || !/^updated:/m.test(m[1])) {
    throw new HttpError(422, `${id}.md thiếu frontmatter hoặc dòng status/updated`);
  }
  const head = m[1]
    .replace(/^status:.*$/m, `status: ${status}`)
    .replace(/^updated:.*$/m, `updated: ${today()}`);
  writeFileSync(file, `---\n${head}\n---\n${m[2]}`);
}

const MAX_BODY = 16 * 1024;

function decodePath(part) {
  try {
    return decodeURIComponent(part);
  } catch {
    throw new HttpError(400, 'đường dẫn không hợp lệ');
  }
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new HttpError(413, 'body quá lớn');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    throw new HttpError(400, 'body không phải JSON hợp lệ');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'body phải là object JSON');
  }
  return body;
}

async function serve() {
  const { createServer } = await import('node:http');
  const port = Number(process.env.PORT ?? 4173);
  // Chặn DNS rebinding: chỉ nhận request gửi tới đúng localhost:<port>.
  const allowedHosts = new Set([`localhost:${port}`, `127.0.0.1:${port}`]);
  build({ quiet: true });

  const send = (res, code, body, type = 'application/json; charset=utf-8') => {
    res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };

  createServer(async (req, res) => {
    try {
      if (!allowedHosts.has(req.headers.host ?? '')) throw new HttpError(403, 'host không được phép');
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/board.html')) {
        return send(res, 200, renderHtml(loadTickets()), 'text/html; charset=utf-8');
      }
      if (req.method === 'GET' && url.pathname === '/api/data') {
        return send(res, 200, boardData(loadTickets()));
      }
      const md = url.pathname.match(/^\/tickets\/([^/]+)\.md$/);
      if (req.method === 'GET' && md) {
        return send(res, 200, readText(ticketFile(decodePath(md[1]))), 'text/plain; charset=utf-8');
      }
      const m = url.pathname.match(/^\/api\/tickets\/([^/]+)$/);
      if (req.method === 'PATCH' && m) {
        const origin = req.headers.origin;
        if (origin && !allowedHosts.has(origin.replace(/^https?:\/\//, ''))) {
          throw new HttpError(403, 'origin không được phép');
        }
        const { status } = await readJson(req);
        const id = decodePath(m[1]);
        setStatus(id, status);
        console.log(`${id} → ${status}`);
        return send(res, 200, boardData(build({ quiet: true })));
      }
      send(res, 404, { detail: 'not found' });
    } catch (e) {
      // Chỉ HttpError mang mã HTTP; lỗi khác (vd. fs trả code 'EACCES') là 500.
      if (!(e instanceof HttpError)) console.error(e);
      send(res, e instanceof HttpError ? e.code : 500, { detail: e.message });
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
