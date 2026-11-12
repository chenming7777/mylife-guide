// Build a self-contained English Malaysia reference guide. No packages/network.
// node tools/malaysia/build.mjs [output.html] [--check]
// --check validates the sources, renderer and generated document without writing.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Script } from 'node:vm';
import { ROOT, REPO, UPSTREAM_REPO, UPSTREAM_COMMIT, read } from '../lib/book.mjs';

const args = process.argv.slice(2);
const out = resolve(ROOT, args.find(value => !value.startsWith('--')) ?? 'dist/mylife-guide-malaysia.html');
const sourceRoot = 'skills/mylife-guide/references';
const sections = [
  ['malaysia-health', 'Health and family'],
  ['malaysia-work-money', 'Work and money'],
  ['malaysia-law-digital', 'Law, digital life and travel'],
  ['malaysia-routing', 'Original chapter routing'],
].map(([id, label]) => ({ id, label, markdown: read(`${sourceRoot}/${id}.md`) }));
const sectionIds = new Set(sections.map(section => section.id));
const audit = JSON.parse(read('malaysia/audit.json'));
assert.equal(audit.schemaVersion, 1, 'Unsupported Malaysia audit schema');
assert.equal(audit.totalEntries, audit.entries.length, 'Incomplete original-entry inventory');
assert.equal(audit.sourceCommit, UPSTREAM_COMMIT, 'The audit is for a different upstream snapshot');
assert.equal(audit.flaggedEntries, audit.entries.filter(entry => entry.flags.length).length, 'Incorrect audit flag count');
assert.equal(audit.chapters.reduce((sum, chapter) => sum + chapter.entries, 0), audit.totalEntries, 'Chapter counts do not match the audit');
for (const chapter of audit.chapters) {
  assert(sectionIds.has(chapter.reference.replace(/\.md$/, '')), `Missing routed reference: ${chapter.reference}`);
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function safeHref(target, sectionId) {
  if (/^https?:\/\//i.test(target)) {
    try {
      const url = new URL(target);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }
  if (/^tel:\+?[0-9][0-9 ()+.-]*(?:\?[a-z0-9_=&%.-]+)?$/i.test(target)) return target;
  const local = target.match(/^(malaysia-[a-z-]+)\.md(?:#([a-z0-9-]+))?$/i);
  if (local && sectionIds.has(local[1])) return `#${local[1]}${local[2] ? `--${local[2]}` : ''}`;
  if (/^#[a-z0-9-]+$/i.test(target)) return `#${sectionId}--${target.slice(1)}`;
  return null;
}

// Escape all source text. Only generated tags enter the document; raw HTML,
// images, embedded scripts and unsafe link schemes never become markup.
function inline(markdown, sectionId) {
  const token = /`([^`\n]+)`|\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let html = '', cursor = 0;
  for (const match of markdown.matchAll(token)) {
    html += escapeHtml(markdown.slice(cursor, match.index));
    if (match[1] !== undefined) html += `<code>${escapeHtml(match[1])}</code>`;
    else if (match[2] !== undefined) {
      const href = safeHref(match[3], sectionId);
      const label = escapeHtml(match[2]);
      html += href ? `<a href="${escapeHtml(href)}"${/^https?:/.test(href) ? ' rel="noopener noreferrer"' : ''}>${label}</a>` : label;
    } else if (match[4] !== undefined) html += `<strong>${escapeHtml(match[4])}</strong>`;
    else html += `<em>${escapeHtml(match[5])}</em>`;
    cursor = match.index + match[0].length;
  }
  return html + escapeHtml(markdown.slice(cursor));
}

function markdownToHtml(markdown, sectionId) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  const tableCells = line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
  const tableRule = line => /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const isBlock = (line, next) => /^\s*$|^#{1,6} |^```|^\s*[-*] |^\s*\d+\. |^> |^---+$/.test(line) || (line.includes('|') && tableRule(next ?? ''));
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const code = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) code.push(lines[i]);
      if (i < lines.length) i++;
      html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    const heading = line.match(/^(#{1,6}) (.+)$/);
    if (heading) {
      const level = Math.min(6, heading[1].length + 1);
      html.push(`<h${level} id="${sectionId}--${slug(heading[2])}">${inline(heading[2], sectionId)}</h${level}>`);
      i++; continue;
    }
    if (line.includes('|') && tableRule(lines[i + 1] ?? '')) {
      const headers = tableCells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(tableCells(lines[i++]));
      assert(rows.every(row => row.length === headers.length), 'Malformed reference table');
      html.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="Chapter routing table"><table><thead><tr>${headers.map(cell => `<th scope="col">${inline(cell, sectionId)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${inline(cell, sectionId)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    const list = line.match(/^\s*(?:([-*])|(\d+)\.) (.+)$/);
    if (list) {
      const ordered = Boolean(list[2]);
      const pattern = ordered ? /^\s*\d+\. (.+)$/ : /^\s*[-*] (.+)$/;
      const items = [];
      while (i < lines.length) {
        const item = lines[i].match(pattern);
        if (!item) break;
        items.push(`<li>${inline(item[1], sectionId)}</li>`); i++;
      }
      html.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`); continue;
    }
    if (/^---+$/.test(line)) { html.push('<hr>'); i++; continue; }
    if (line.startsWith('> ')) { html.push(`<blockquote>${inline(line.slice(2), sectionId)}</blockquote>`); i++; continue; }
    const paragraph = [line];
    while (++i < lines.length && !isBlock(lines[i], lines[i + 1])) paragraph.push(lines[i]);
    html.push(`<p>${inline(paragraph.join(' '), sectionId)}</p>`);
  }
  return html.join('\n');
}

// Security regression checks run on every build, before any source is emitted.
const hostile = '<script>alert(1)</script> <img src=x onerror=alert(1)>\n\n[x](javascript:alert(1)) [x](data:text/html,evil)\n\n```html\n</script><script>evil()</script>\n```';
const escaped = markdownToHtml(hostile, 'test');
assert(!/<(?:script|img)\b|href="(?:javascript|data):/i.test(escaped), 'Unsafe source became active HTML');
assert(escaped.includes('&lt;script&gt;') && escaped.includes('&lt;img'), 'Literal HTML must remain visible escaped text');
assert.equal(safeHref('java\nscript:alert(1)', 'test'), null);
assert.equal(safeHref('&#106;avascript:alert(1)', 'test'), null);
assert.equal(safeHref('//example.com', 'test'), null);
assert.equal(inline('[safe](https://example.com/?a=1&b=2)', 'test'), '<a href="https://example.com/?a=1&amp;b=2" rel="noopener noreferrer">safe</a>');
assert(inline('<img src="x">', 'test').includes('&quot;'));

let pathwayCount = 0;
const content = sections.map(section => {
  const title = section.markdown.match(/^# (.+)$/m)?.[1];
  assert(title, `Reference lacks a title: ${section.id}`);
  const body = section.markdown.replace(/^# .+\n+/, '');
  const chunks = body.split(/(?=^## )/m);
  const articles = chunks.map(chunk => {
    if (/^## MY-[A-Z]\d+/.test(chunk)) pathwayCount++;
    return `<article class="reference-card">${markdownToHtml(chunk, section.id)}</article>`;
  }).join('\n');
  return `<section class="topic" id="${section.id}" aria-labelledby="${section.id}-title"><h2 id="${section.id}-title">${escapeHtml(title)}</h2>${articles}</section>`;
}).join('\n');

const clientScript = `
const search = document.getElementById('search');
const cards = Array.from(document.querySelectorAll('.reference-card'));
const topics = Array.from(document.querySelectorAll('.topic'));
const status = document.getElementById('search-status');
function filter() {
  const terms = search.value.toLocaleLowerCase().trim().split(/\\s+/).filter(Boolean);
  let shown = 0;
  for (const card of cards) {
    const text = card.textContent.toLocaleLowerCase();
    card.hidden = !terms.every(term => text.includes(term));
    if (!card.hidden) shown++;
  }
  for (const topic of topics) topic.hidden = !Array.from(topic.querySelectorAll('.reference-card')).some(card => !card.hidden);
  status.textContent = terms.length ? shown + ' matching reference sections' : 'All reference sections shown';
  document.getElementById('no-results').hidden = shown !== 0;
}
search.addEventListener('input', filter);
document.getElementById('clear-search').addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link && document.getElementById(link.hash.slice(1))?.closest('.topic')) {
    search.value = ''; filter();
  }
});
filter();
`;
new Script(clientScript); // Parse the exact search code that will ship.

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="An offline Malaysian reference guide with local service pathways, official sources and original-book routing.">
<title>MyLife Guide Malaysia</title>
<style>
:root{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#21313d;background:#f5f7f8;line-height:1.65;color-scheme:light}
*{box-sizing:border-box}body{margin:0}header,main,footer{max-width:1080px;margin:auto;padding:28px 24px}header{padding-bottom:12px}
h1,h2,h3,h4{line-height:1.25;color:#143c45}h1{font-size:2.35rem;margin:8px 0}h2{font-size:1.6rem;margin-top:44px}h3{font-size:1.15rem;margin-top:0}
p{margin:.65em 0}a{color:#065c76;text-underline-offset:3px}a:hover{text-decoration-thickness:2px}a:focus-visible,input:focus-visible,button:focus-visible,[tabindex]:focus-visible{outline:3px solid #bb5a18;outline-offset:3px}
.eyebrow{font-weight:700;letter-spacing:.08em;font-size:.8rem;text-transform:uppercase;color:#576b75}.intro{max-width:75ch;color:#425762}
.notice{background:#fff5db;border-left:5px solid #b77518;padding:16px 20px;margin:20px 0}.snapshot{font-size:.92rem;color:#465b65}
nav{display:flex;flex-wrap:wrap;gap:10px 20px;padding:14px 0}nav a{font-weight:600;min-height:32px;padding:4px 0}
.search-row{display:flex;gap:10px;margin-top:8px}.search-row input{width:100%;font:inherit;padding:11px 14px;border:1px solid #8398a3;border-radius:6px;background:white}.search-row button{font:inherit;border:1px solid #8398a3;background:#fff;border-radius:6px;padding:10px 18px;cursor:pointer}
label{font-weight:650}#search-status{min-height:1.7em;font-size:.9rem;color:#526773}.reference-card{background:#fff;border:1px solid #dce3e7;border-radius:8px;padding:22px 26px;margin:16px 0;overflow-wrap:anywhere}
.reference-card>p:first-child{margin-top:0}.reference-card>p:last-child{margin-bottom:0}.topic{scroll-margin-top:16px}h3[id]{scroll-margin-top:20px}
code{font-family:ui-monospace,Consolas,monospace;font-size:.91em;background:#edf2f4;border-radius:3px;padding:.1em .3em}pre{overflow:auto;padding:16px;background:#edf2f4}pre code{padding:0}
.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:.9rem}th,td{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #d9e1e5}th{background:#edf3f4;white-space:nowrap}blockquote{border-left:3px solid #a4bbc2;margin-left:0;padding-left:16px}
footer{font-size:.9rem;color:#526773;border-top:1px solid #d9e1e5;margin-top:32px}[hidden]{display:none!important}.skip{position:absolute;left:8px;top:-80px;background:white;padding:10px}.skip:focus{top:8px}
@media(max-width:600px){header,main,footer{padding:20px 16px}.reference-card{padding:18px}h1{font-size:1.9rem}.search-row{flex-wrap:wrap}.search-row button{width:100%}}
@media print{.search-controls,.skip{display:none}body{background:white}.reference-card{break-inside:avoid;border-color:#bbb}header,main,footer{padding:12px 0}}
</style></head><body>
<a class="skip" href="#main">Skip to references</a>
<header><div class="eyebrow">Personal decisions · Malaysian sources</div><h1>MyLife Guide Malaysia</h1>
<p class="intro">Start with a practical local pathway, check the source, and keep facts separate from personal estimates. This file can be read and searched offline; opening an official source requires an internet connection.</p>
<div class="notice"><strong>The original China corpus is not fully localized.</strong> These Malaysian references are service pathways and source pointers. They do not certify or replace all ${audit.totalEntries} original entries. Chinese prices, laws, benefits, contacts and value scores must not be treated as Malaysian advice.</div>
<p class="snapshot">Reference review snapshot: <strong>${escapeHtml(audit.reviewedOn)}</strong>. Recheck current rules, fees, eligibility and contact hours for the actual case. Stored access dates do not guarantee availability today.</p>
<p class="snapshot">${pathwayCount} Malaysian pathways · ${audit.chapters.length} original chapters routed · ${audit.totalEntries} original entries awaiting individual local validation</p>
<nav aria-label="Guide topics">${sections.map(section => `<a href="#${section.id}">${escapeHtml(section.label)}</a>`).join('')}<a href="mylife-guide.html">Original China corpus</a></nav>
<div class="search-controls"><label for="search">Search the Malaysian references</label><div class="search-row"><input id="search" type="search" placeholder="Try EPF, unpaid wages, clinic or privacy" autocomplete="off"><button type="button" id="clear-search">Clear search</button></div><p id="search-status" role="status" aria-live="polite"></p></div>
<noscript><p>JavaScript is disabled. All references are still readable; use your browser's Find command to search.</p></noscript>
</header>
<main id="main"><p id="no-results" hidden>No matching references. Try a shorter word or clear the search.</p>${content}</main>
<footer><p>MyLife Guide Malaysia is an independent adaptation of <a href="${escapeHtml(UPSTREAM_REPO)}">《高性价比人生指南》 / HowToLiveBetter</a> by eternity4719 and contributors. Original snapshot: ${escapeHtml(UPSTREAM_COMMIT)}. Malaysian reference text is added separately; the original book is retained unchanged.</p>
<p>Text: <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Code and skill: MIT, with original notices retained in the repository and skill package. <a href="${escapeHtml(REPO)}/blob/malaysia-edition/ATTRIBUTION.md">Full attribution</a>. Keep this file beside <code>mylife-guide.html</code> to use the optional original-corpus link.</p></footer>
<script>${clientScript}</script></body></html>
`;

// Validate real output: source headings survive, local routes resolve and only
// the known static search code is executable (no source text enters a script).
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs break navigation');
for (const link of html.matchAll(/\bhref="#([^"]+)"/g)) assert(ids.includes(link[1]), `Unresolved local anchor: ${link[1]}`);
for (const section of sections) {
  for (const heading of section.markdown.matchAll(/^## (MY-[A-Z]\d+)\b/gm)) {
    assert(html.includes(heading[1]), `Missing Malaysian pathway: ${heading[1]}`);
  }
}
assert.equal((html.match(/<script\b/g) ?? []).length, 1, 'Unexpected executable content');
assert(!/<(?:script|link|img)\b[^>]*(?:src|href)="https?:/i.test(html), 'The guide must not load remote assets');
assert(!/\bhref="(?:javascript|data|file):/i.test(html), 'Unsafe link scheme');
assert(pathwayCount > 0, 'No Malaysian service pathways were rendered');
if (!args.includes('--check')) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}
console.log(`Malaysia guide ${args.includes('--check') ? 'validated' : 'built'}: ${pathwayCount} pathways, ${sections.length} references, ${audit.chapters.length} chapter routes; safe rendering and navigation checks passed.`);
if (!args.includes('--check')) console.log(out);
