# MyLife Guide Malaysia skill (`mylife-guide`)

Answer practical life questions in English using Malaysian primary sources. The skill covers health access, family care, work, benefits, money, education, legal help, consumer rights, digital safety and travel. It checks relevant state and eligibility differences and uses actual RM costs.

The 32 Malaysian reference entries are a starting point, not a full translation or individual validation of the original 772-entry Chinese book. The original book remains a separate evidence library. See [scope and audit](../../malaysia/README.md) and the complete [skill instructions](SKILL.md).

Adapted from [eternity4719/HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter). See [attribution](../../ATTRIBUTION.md), [CC BY 4.0 text license](../../LICENSE) and [MIT code license](../../LICENSE-CODE).

## Use this local repository

Clone the Malaysia branch, or use your existing checkout on that branch:

```bash
git clone --branch malaysia-edition https://github.com/chenming7777/mylife-guide.git
cd mylife-guide
```

Open the folder in your assistant and ask it to use `skills/mylife-guide/SKILL.md`. Codex is routed there by `AGENTS.md`; Claude Code has a wrapper in `.claude/skills/mylife-guide/`.

Example: “Use $mylife-guide. I work in Sabah and was dismissed yesterday. What should I check first?”

## Install the complete offline skill (recommended)

Run from the repository root with Node.js installed. On Windows, this backs up an existing installation before updating it:

```powershell
node tools/malaysia/audit.mjs --check
if ($LASTEXITCODE -ne 0) { throw 'Audit check failed' }
node tools/skill/build.mjs
if ($LASTEXITCODE -ne 0) { throw 'Skill build failed' }
$skillRoot = Join-Path $env:USERPROFILE '.agents/skills'
$installedSkill = Join-Path $skillRoot 'mylife-guide'
if (Test-Path -LiteralPath $installedSkill) {
    $backupPath = Join-Path (Get-Location) ('dist/mylife-guide-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
    Compress-Archive -LiteralPath $installedSkill -DestinationPath $backupPath -ErrorAction Stop
}
New-Item -ItemType Directory -Force -Path $skillRoot -ErrorAction Stop | Out-Null
Expand-Archive -LiteralPath './dist/mylife-guide.zip' -DestinationPath $skillRoot -Force -ErrorAction Stop
```

On macOS/Linux:

```bash
(
set -e
node tools/malaysia/audit.mjs --check
node tools/skill/build.mjs
mkdir -p ~/.agents/skills
if [ -d ~/.agents/skills/mylife-guide ]; then
  tar -czf "dist/mylife-guide-backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C ~/.agents/skills mylife-guide
fi
unzip -o dist/mylife-guide.zip -d ~/.agents/skills
)
```

Open a new chat and invoke `$mylife-guide`. For Claude Code, use `~/.claude/skills` instead. The ZIP contains the instructions, all four Malaysian reference files, the entry audit, both licenses, attribution, the original chapters and essays, and their search index. Rebuild and reinstall to update the saved snapshot. For a ZIP with `SKILL.md` at its root, use `node tools/skill/build.mjs --flat`.

## Install only the skill instructions from GitHub

This smaller installation needs internet to retrieve Malaysian references when a local copy is unavailable. It does not provide offline coverage by itself.

```bash
mkdir -p ~/.agents/skills/mylife-guide && curl -fsSL -o ~/.agents/skills/mylife-guide/SKILL.md "https://raw.githubusercontent.com/chenming7777/mylife-guide/malaysia-edition/skills/mylife-guide/SKILL.md"
```

Windows PowerShell:

```powershell
$skillDirectory = Join-Path $env:USERPROFILE '.agents/skills/mylife-guide'
New-Item -ItemType Directory -Force -Path $skillDirectory | Out-Null
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/chenming7777/mylife-guide/malaysia-edition/skills/mylife-guide/SKILL.md' -OutFile (Join-Path $skillDirectory 'SKILL.md')
```

## Read without an assistant

```bash
node tools/malaysia/build.mjs
```

Open `dist/mylife-guide-malaysia.html` in a browser. It contains the English Malaysian references and chapter routes. Source links need internet. `node tools/offline/build.mjs` separately builds the original Chinese source library as `dist/mylife-guide.html`.

## Optional personal context

Personal details are used in the current conversation without being written to a profile by default. Only if you explicitly want persistent personalization, create `PERSONAL.local.md` beside your installed `SKILL.md` to record facts, preferences and the date they were confirmed. The skill reads it for your own decisions, and current chat instructions take precedence. It is optional and is never fetched from GitHub.

Keep this file beside the skill, **not inside `references/`**. The repository ignores this filename, and the public ZIP excludes it. A repository checkout can also read the profile from your installed skill, so you do not need to copy personal information into the checkout. A local file may still be included in your own device or cloud backups.

## Sources and limits

Stored references show when sources were checked. Eligibility, rates, deadlines, fees and contact hours can change; verify them with current official sources before acting. When offline, the assistant must distinguish the saved reference from a current confirmation and explain unresolved conflicts. It must not fill a gap with a Chinese legal rule or benefit.

The guide supports decisions; it does not replace individual medical care, legal representation or regulated financial advice. Contribute source corrections or new topics through the [Malaysia contribution guide](../../malaysia/CONTRIBUTING.md).

Codex skill locations: [official OpenAI documentation](https://developers.openai.com/codex/skills/).
