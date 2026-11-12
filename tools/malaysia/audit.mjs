// Keyword triage is not a legal finding or certification of local applicability.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { ROOT, read, readBook, UPSTREAM_COMMIT } from '../lib/book.mjs';

const routes = [
  ['Preventable emergencies', 'health', 'Local emergency contacts, vaccination/screening access and eligibility'],
  ['Long-term health', 'health', 'Research may transfer; clinical recommendations need Malaysian verification'],
  ['Energy and attention', 'health', 'Preserve study limits; local clinical pathways for symptoms'],
  ['Time and habits', 'work-money', 'General research with actual local travel/time costs'],
  ['Money and insurance', 'work-money', 'Malaysian banking, tax, EPF and insurance; no yuan conversion'],
  ['Claims to question', 'health', 'Local product regulation and original research checked separately'],
  ['Financial hardship', 'work-money', 'JKM/PERKESO and individual scheme eligibility'],
  ['Law and property safety', 'law-digital', 'Malaysian counsel/procedure; no Chinese statutes or time limits'],
  ['Criminal-law risks', 'law-digital', 'Verify Malaysian law/facts; no imported offences or penalties'],
  ['Relationships and marriage', 'law-digital', 'Civil versus relevant state Syariah rules and registration'],
  ['Technology work and law', 'law-digital', 'Malaysian privacy, IP, cybercrime and contracts'],
  ['Business', 'work-money', 'Entity/territory-specific SSM, local licensing and LHDN routes'],
  ['Emergencies', 'health', 'Malaysia emergency pathway; clinical actions need suitable evidence'],
  ['Accounts and information', 'law-digital', 'Malaysian cyber reporting, banks and privacy routes'],
  ['Renting and buying homes', 'work-money', 'Contract, state land rules, financing and suitable dispute forum'],
  ['Chronic conditions', 'health', 'MOH/clinician pathways, product registration and local access'],
  ['Older family members', 'health', 'JKM/local care; use legal reference for succession'],
  ['Parenthood decisions', 'health', 'Local care/welfare; cross-check employment leave in work reference'],
  ['Employment and injury', 'work-money', 'Peninsular/Labuan versus Sabah/Sarawak and PERKESO/EIS'],
  ['Newborn care', 'health', 'MOH care, local vaccination and JPN registration'],
  ['Travel and overseas safety', 'law-digital', 'Wisma Putra, destination law, nationality and visa status'],
  ['Leisure and stress', 'law-digital', 'Local licensing/law; stress research needs original evidence'],
  ['Education and skills', 'work-money', 'MQA, official training and financial-aid eligibility'],
  ['Getting healthcare', 'health', 'MOH referral and service/citizenship-specific fees'],
  ['After a death', 'health', 'Regional JPN registration; estate matters need local legal route'],
  ['Websites and platforms', 'law-digital', 'Malaysian business, PDPA/MCMC/consumer rules; no ICP assumption'],
  ['Pregnancy and birth', 'health', 'Local maternity care/registration and applicable labour law'],
  ['Appearance and treatments', 'health', 'Local provider/product checks and individual clinical assessment'],
  ['Major loss and distress', 'health', 'Local support/crisis pathways; no imported hotline'],
  ['School-age children', 'health', 'Local health, education and safeguarding rules'],
  ['Adult pathways', 'work-money', 'Malaysian work/accredited education; no Chinese recruitment scheme'],
  ['International study', 'law-digital', 'Student-pass/destination rules and institution confirmation'],
  ['Disability', 'health', 'JKM registration/assessed benefits and nationality/programme limits'],
  ['Medicines at home', 'health', 'NPRA/local label/pharmacist; no copied China dosing or restrictions'],
];
const patterns = [
  ['china-agency-or-law', /中国|中华人民共和国|国务院|人民法院|最高法|民法典|劳动合同法|治安管理|刑法|公安|检察院|卫健委|药监局|医保局|教育部|人社|工信部|银保监|证监会|税务总局|市场监管/g],
  ['china-scheme-or-status', /户籍|户口|五险|社保|医保|公积金|低保|高考|学信网|留服|三支一扶|特岗|公务员|居住证|养老金|彩礼|工伤认定|备案|人民币|LPR|QDII|港股通/g],
  ['country-specific-contact', /(?<!\d)(?:110|119|120|123\d{2})(?!\d)/g],
  ['local-price-or-benefit', /(?:\d|[一二三四五六七八九十百千万两几数])\s*元|万元|人民币/g],
];
const { bookFiles } = readBook();
const entries = [];
const chapters = [];
for (const file of bookFiles) {
  const body = read(file);
  const section = Number(body.match(/^# (\d+)\./m)?.[1]);
  const route = routes[section - 1];
  if (!route) throw new Error(`Missing Malaysia route for ${file}`);
  const starts = [...body.matchAll(/^### (\d+)\. (.+)$/gm)];
  if (!starts.length) throw new Error(`No entries in ${file}`);
  for (const [i, part] of starts.entries()) {
    const entryText = body.slice(part.index, starts[i + 1]?.index ?? body.length);
    const flags = patterns.flatMap(([kind, re]) => {
      const hits = [...new Set(entryText.match(re) ?? [])];
      return hits.length ? [{ kind, matchedTerms: hits }] : [];
    });
    entries.push({ id: `CN-${section}-${part[1]}`, chapter: section, entry: Number(part[1]), title: part[2], file,
      sourceJurisdiction: 'mainland-China-context', malaysiaEntryReview: 'not-individually-validated',
      malaysiaReference: `skills/mylife-guide/references/malaysia-${route[1]}.md`, flags });
  }
  chapters.push({ chapter: section, topic: route[0], reference: `malaysia-${route[1]}.md`, focus: route[2], entries: starts.length,
    flagged: entries.filter(e => e.chapter === section && e.flags.length).length });
}
if (new Set(entries.map(e => e.id)).size !== entries.length) throw new Error('Duplicate source IDs');
const report = { schemaVersion: 1, sourceCommit: UPSTREAM_COMMIT, reviewedOn: '2026-11-12',
  method: 'Automated keyword triage plus chapter routing. Flags are not exhaustive or legal judgments. No original entry is certified Malaysian by this scan.',
  totalEntries: entries.length, flaggedEntries: entries.filter(e => e.flags.length).length, chapters, entries };
const table = chapters.map(c => `| ${c.chapter} | ${c.topic} | ${c.entries} | ${c.flagged} | [${c.reference.replace('malaysia-', '').replace('.md','')}](${c.reference}) | ${c.focus} |`).join('\n');
const routing = `# Malaysia chapter routing\n\nReview date: 2026-11-12. Original snapshot: ${UPSTREAM_COMMIT}.\n\nAll ${chapters.length} original chapters are routed below. The ${entries.length} original entries remain **not individually validated for Malaysia**. ${report.flaggedEntries} have one or more automated markers for country-specific agencies, schemes, contacts or money. An unflagged entry is not certified transferable. A Chinese study population alone does not invalidate research.\n\nRead the relevant Malaysian reference first; check related domains when a case overlaps. These are verified service/source pathways, not replacements for every original entry. Missing Malaysian rules require current official research or an explicit unresolved answer.\n\n| Chapter | Topic | Original entries | Flagged | Malaysia reference | What must be localized |\n| --- | --- | ---: | ---: | --- | --- |\n${table}\n\nThe machine-readable audit is in repository \`malaysia/audit.json\`. Rebuild it with \`node tools/malaysia/audit.mjs\`. Original prices and value-for-money tiers must not be used as Malaysian scores.\n`;
const auditMd = `# Malaysia localization audit\n\n${report.method}\n\n- Original snapshot: \`${UPSTREAM_COMMIT}\`.\n- Inventory: **${entries.length} entries in ${chapters.length} chapters**.\n- Entries with country-specific search markers: **${report.flaggedEntries}**.\n- Original entries individually certified as Malaysian guidance: **0**.\n- Malaysian references supply service pathways and sources; they do not silently replace original evidence.\n\n## Skill findings corrected\n\n1. Chinese law and a fixed six/three-month court timeline were hardcoded. The Malaysia skill now routes to Malaysian counsel/procedure.\n2. The skill allowed only facts in the Chinese book. Malaysian primary sources now take precedence for Malaysian rules and services.\n3. Yuan cost tags and value tiers could appear universal. They are now inapplicable to Malaysian ranking without local costs.\n4. Foreign crisis contacts, healthcare access, benefits, medicine rules and residence status could leak through. Location and eligibility gates now precede those answers.\n5. Statistical ratios could be over-translated. The skill now preserves study population and HR/RR/OR distinctions.\n6. Offline packaging previously had no Malaysia material. The package now includes the Malaysian references, routing table, source inventory and licenses.\n\nSee [the complete chapter routing](../skills/mylife-guide/references/malaysia-routing.md) and [every original entry with its flags](audit.json). Unresolved areas remain visible in domain references.\n`;
const outputs = [
  ['malaysia/audit.json', JSON.stringify(report, null, 2) + '\n'],
  ['malaysia/AUDIT.md', auditMd],
  ['skills/mylife-guide/references/malaysia-routing.md', routing],
];
for (const [path, content] of outputs) {
  if (process.argv.includes('--check')) {
    if (read(path) !== content) throw new Error(`Stale localization inventory: ${path}`);
  } else {
    mkdirSync(dirname(resolve(ROOT, path)), { recursive: true });
    writeFileSync(resolve(ROOT, path), content);
  }
}
console.log(`${entries.length} original entries; ${report.flaggedEntries} flagged for local review; ${chapters.length} chapter routes.`);
