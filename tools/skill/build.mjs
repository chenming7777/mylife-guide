// 把 mylife-guide 这个 skill 连同全书正文打成一个能离线用的 zip。
// 用法：node tools/skill/build.mjs [输出路径] [--flat]   默认输出 dist/mylife-guide.zip
//
// 仓库里的 skill 只有一份 SKILL.md，正文靠本地仓库或现取 GitHub。拿去别处上传、分发时，
// 对方多半连不上 GitHub，所以把正文一起带上。包里的东西：
//   mylife-guide/SKILL.md              原样，来自 skills/mylife-guide/
//   mylife-guide/README.md             这个包是什么、怎么装、哪天打的
//   mylife-guide/references/README.md  书的 README（SKILL.md 第 2 步要读里面的问题表）
//   mylife-guide/references/book/      各节正文
//   mylife-guide/references/docs/      README 里链接过的长文（核实记录、引用对照不带）
//   mylife-guide/references/index.tsv  一行一条：标题、成本标签、性价比档、证据等级
//   mylife-guide/references/VERSION.txt    打包时间和提交号
//
// zip 里默认套一层 mylife-guide/ 目录，解压到 ~/.claude/skills/ 这类目录下正好就位。
// 上传的地方要求 SKILL.md 在压缩包根上的，加 --flat。
import { writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { zip } from '../lib/zip.mjs';
import { ROOT, REPO, TITLE, UPSTREAM_REPO, UPSTREAM_COMMIT, read, readBook, COST_W, ratioOf, gitCommit, buildStamp } from '../lib/book.mjs';

const args = process.argv.slice(2);
const flat = args.includes('--flat');
const OUT = resolve(ROOT, args.find(a => !a.startsWith('--')) ?? 'dist/mylife-guide.zip');
const NAME = 'mylife-guide';
const BRANCH = 'malaysia-edition';

// ---------- 读条目，只取索引要的那几样 ----------
function parseSection(file) {
  const md = read(file);
  const head = md.match(/^# (\d+)\. (.+)$/m);
  if (!head) throw new Error(`${file} 里找不到「# N. 节名」`);
  const entries = [];
  let e = null;
  for (const line of md.split('\n')) {
    const h = line.match(/^### (\d+)\. (.+)$/);
    if (h) { e = { n: h[1], title: h[2].trim() }; entries.push(e); continue; }
    if (!e) continue;
    const tag = line.match(/^<!--\s*成本标签:\s*(.*?)\s*-->/);
    if (tag) {
      for (const kv of tag[1].split(/\s+/)) { const [k, v] = kv.split('='); e[k] = v; }
      continue;
    }
    const grade = line.match(/^- 证据等级：\s*([ABC])/);
    if (grade) e.grade = grade[1];
    if (/^- 备注：争议/.test(line)) e.dispute = true;
  }
  return { file, sec: head[1], name: head[2].trim(), entries };
}

const { bookFiles, docFiles } = readBook();
const sections = bookFiles.map(parseSection);

const COLS = ['节', '条', '标题', '性价比', '收益', '口径', '钱', '时间', '毅力', '证据', '争议', '人群', '文件'];
const rows = [];
const tally = { 极高: 0, 高: 0, 一般: 0 };
for (const s of sections) {
  for (const e of s.entries) {
    const tagged = e.钱 in COST_W.money && e.时间 in COST_W.time && e.毅力 in COST_W.will && e.收益;
    if (!tagged) throw new Error(`第 ${s.sec} 节第 ${e.n} 条的成本标签不全，索引算不出性价比档`);
    const ratio = ratioOf(COST_W.money[e.钱] + COST_W.time[e.时间] + COST_W.will[e.毅力], e.收益);
    tally[ratio]++;
    rows.push([s.sec, e.n, e.title.replace(/\t/g, ' '), ratio, e.收益, e.口径 ?? '', e.钱, e.时间, e.毅力,
      e.grade ?? '', e.dispute ? '争议' : '', e.人群 ?? '', s.file]);
  }
}
const index = [COLS, ...rows].map(r => r.join('\t')).join('\n') + '\n';

// ---------- Package notes and Malaysian references ----------
const commit = gitCommit();
const stamp = buildStamp();
const referenceRoot = `skills/${NAME}/references`;
function markdownFiles(directory) {
  return readdirSync(resolve(ROOT, directory), { withFileTypes: true })
    // Exclude the optional private profile even if it was misplaced here.
    .filter(entry => entry.name !== 'PERSONAL.local.md')
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => entry.isDirectory()
      ? markdownFiles(`${directory}/${entry.name}`)
      : entry.isFile() && entry.name.endsWith('.md') ? [`${directory}/${entry.name}`] : []);
}
const malaysiaFiles = markdownFiles(referenceRoot);
const auditText = read('malaysia/audit.json');
const audit = JSON.parse(auditText);
assert.equal(audit.totalEntries, rows.length, 'Malaysia audit must cover the current original book');
assert.equal(audit.entries.length, rows.length, 'Malaysia audit entry inventory is incomplete');
assert.equal(audit.chapters.length, sections.length, 'Malaysia chapter routing is incomplete');
const localReferences = new Set(malaysiaFiles.map(file => file.slice(referenceRoot.length + 1)));
for (const chapter of audit.chapters) {
  assert(localReferences.has(chapter.reference), `Missing Malaysian reference: ${chapter.reference}`);
}
for (const entry of audit.entries) {
  assert.equal(entry.malaysiaEntryReview, 'not-individually-validated', 'The source scan must not certify Malaysian applicability');
  assert(bookFiles.includes(entry.file), `Missing source chapter for audit entry ${entry.id}`);
}
const version = `MyLife Guide Malaysia (${NAME})
Built: ${stamp} (UTC+08:00)
Working-tree base commit: ${commit || 'unknown'}
Reference review snapshot: ${audit.reviewedOn}; a stored access date is not current verification.
Original book: ${TITLE}, by eternity4719
Original snapshot: ${UPSTREAM_COMMIT}
Original repository: ${UPSTREAM_REPO}
Original corpus: ${sections.length} chapters, ${rows.length} entries, ${docFiles.length} essays.
Original entries individually validated for Malaysia: 0.
Derivative branch: ${REPO}/tree/${BRANCH}
`;

const readme = `# MyLife Guide Malaysia

An English, Malaysia-first decision guide with Malaysian service pathways and official sources. Start with [SKILL.md](SKILL.md) and [Malaysia chapter routing](references/malaysia-routing.md).

**The original China corpus is not fully localized.** Its ${rows.length} entries remain in Chinese as source material, and none is individually certified as Malaysian guidance. Original prices, benefits, laws, emergency contacts and value-for-money tiers are not Malaysian advice. See [ATTRIBUTION.md](ATTRIBUTION.md) for the changes and original author credit.

## What is included

- \`SKILL.md\` and \`agents/openai.yaml\`: the Malaysia-first skill and its display metadata.
- \`references/malaysia-*.md\`: Malaysian health, work/money, law/digital references and routing for all ${sections.length} source chapters.
- \`references/malaysia-audit.json\`: the original-entry inventory and automated country-specific flags. Its file paths are repository-relative; source chapters are under \`references/book/\` in this package.
- \`references/book/\` and \`references/docs/\`: the unchanged original corpus (${sections.length} chapters and ${docFiles.length} essays).
- \`references/index.tsv\`: the **original** book index. Its scores and cost labels are not Malaysian scores.
- \`references/README.md\`: the source chapter table and repository overview.
- \`references/VERSION.txt\`, both license texts and attribution.

## Install and use

Extract the complete \`${NAME}\` directory into the assistant's skill directory, preserving its subfolders, then start a new chat.

- Codex: \`~/.agents/skills/\`
- Claude Code: \`~/.claude/skills/\`
- Other compatible assistants: their documented skill directory.

For example: “Use $mylife-guide to help me compare my options in Malaysia.” Include the state or territory and relevant circumstances when they affect the answer. A flat archive has the same contents without the outer \`${NAME}/\` directory; create that directory before extracting it.

## Snapshot and limits

Reference review snapshot: **${audit.reviewedOn}**. Package built: **${stamp} (UTC+08:00)**. These are stored snapshots, not a promise that rules, fees, eligibility or contact hours are current. Recheck the linked official source for the actual case. When offline, identify what remains unverified; do not substitute the Chinese book's rules for missing Malaysian evidence.

These references support decisions and service navigation; they do not replace individual medical care, legal representation or regulated financial advice.

## Attribution and licenses

Original book: 《${TITLE}》 by **eternity4719** and contributors.

- Original repository: ${UPSTREAM_REPO}
- Original snapshot: ${UPSTREAM_COMMIT}
- Derivative branch: ${REPO}/tree/${BRANCH}
- Text: [CC BY 4.0](LICENSE), https://creativecommons.org/licenses/by/4.0/
- Code and skill: [MIT](LICENSE-CODE), with the original copyright retained.
- Adaptation details and Malaysian-reference licensing: [ATTRIBUTION.md](ATTRIBUTION.md).
`;

// ---------- 打包 ----------
const prefix = flat ? '' : `${NAME}/`;
const text = s => Buffer.from(s, 'utf8');
// Keep the book/chapter links local; links to resources outside this offline
// bundle remain explicit online links instead of pointing to missing files.
const bundledRefs = new Set([...bookFiles, ...docFiles, 'README.md', 'LICENSE', 'LICENSE-CODE', 'ATTRIBUTION.md']);
const referenceReadme = read('README.md').replace(/\]\(([^)]+)\)/g, (all, target) => {
  if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(target)) return all;
  const path = target.split('#')[0];
  const suffix = target.slice(path.length);
  if (path === `skills/${NAME}/SKILL.md`) return `](../SKILL.md${suffix})`;
  if (path === `skills/${NAME}/README.md`) return `](../README.md${suffix})`;
  if (path === 'malaysia/audit.json') return `](malaysia-audit.json${suffix})`;
  if (path.startsWith(`${referenceRoot}/`) && localReferences.has(path.slice(referenceRoot.length + 1))) {
    return `](${path.slice(referenceRoot.length + 1)}${suffix})`;
  }
  if (bundledRefs.has(path)) return all;
  const online = path.endsWith('/') ? `${REPO}/tree/${BRANCH}/` : `${REPO}/blob/${BRANCH}/`;
  return `](${online}${target})`;
});
const files = [
  { name: `${prefix}SKILL.md`, data: text(read(`skills/${NAME}/SKILL.md`)) },
  { name: `${prefix}README.md`, data: text(readme) },
  { name: `${prefix}agents/openai.yaml`, data: text(read(`skills/${NAME}/agents/openai.yaml`)) },
  ...malaysiaFiles.map(file => ({ name: `${prefix}references/${file.slice(referenceRoot.length + 1)}`, data: text(read(file)) })),
  { name: `${prefix}references/malaysia-audit.json`, data: text(auditText) },
  { name: `${prefix}references/README.md`, data: text(referenceReadme) },
  ...['LICENSE', 'LICENSE-CODE', 'ATTRIBUTION.md'].flatMap(file => [
    { name: `${prefix}${file}`, data: text(read(file)) },
    { name: `${prefix}references/${file}`, data: text(read(file)) },
  ]),
  { name: `${prefix}references/index.tsv`, data: text(index) },
  { name: `${prefix}references/VERSION.txt`, data: text(version) },
  ...[...bookFiles, ...docFiles].map(f => ({ name: `${prefix}references/${f}`, data: text(read(f)) })),
];

const names = new Set(files.map(file => file.name));
assert.equal(names.size, files.length, 'Duplicate package paths would overwrite content');
for (const row of rows) assert(names.has(`${prefix}references/${row.at(-1)}`), 'An indexed chapter is missing');
for (const ref of read(`skills/${NAME}/SKILL.md`).matchAll(/`(references\/[A-Za-z0-9_./-]+\.md)`/g)) {
  assert(names.has(`${prefix}${ref[1]}`), `The skill requires an unbundled reference: ${ref[1]}`);
}
for (const required of ['SKILL.md', 'agents/openai.yaml', 'LICENSE', 'LICENSE-CODE', 'ATTRIBUTION.md', 'references/malaysia-audit.json']) {
  assert(names.has(`${prefix}${required}`), `Required package content missing: ${required}`);
}
const buf = zip(files, new Date(), { unix: true });
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, buf);

const raw = files.reduce((n, f) => n + f.data.length, 0);
console.log(`${sections.length} 节 ${rows.length} 条 ｜ 极高 ${tally.极高} 高 ${tally.高} 一般 ${tally.一般} ｜ 长文 ${docFiles.length} 篇`);
console.log(`${files.length} 个文件，解压后 ${(raw / 1024 / 1024).toFixed(2)} MB，zip ${(buf.length / 1024).toFixed(0)} KB${flat ? '（SKILL.md 在压缩包根上）' : ''}`);
console.log(OUT);
