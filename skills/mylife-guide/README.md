# MyLife Guide skill (`mylife-guide`)

Search the included Chinese reference book before answering practical life decisions. Give the chapter and entry number, costs, benefits and evidence grade. The skill can answer in the user's language; the source book itself has not been translated.

Adapted from [eternity4719/HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter). See [attribution](../../ATTRIBUTION.md), [CC BY 4.0 text license](../../LICENSE) and [MIT code license](../../LICENSE-CODE).

## Use this local repository

Open the repository folder in your assistant and ask it to use `skills/mylife-guide/SKILL.md`. Codex is routed there by `AGENTS.md`; Claude Code has a wrapper in `.claude/skills/mylife-guide/`.

Example: “Use MyLife Guide to help me decide whether a two-hour daily commute is worth it. Cite the relevant entries.”

## Install the complete offline skill (recommended)

Run from the repository root with Node.js installed:

```powershell
node tools/skill/build.mjs
$skillDirectory = Join-Path $env:USERPROFILE '.agents/skills'
New-Item -ItemType Directory -Force -Path $skillDirectory | Out-Null
Expand-Archive -LiteralPath './dist/mylife-guide.zip' -DestinationPath $skillDirectory
```

If `mylife-guide` is already installed, back it up before replacing it. On macOS/Linux:

```bash
node tools/skill/build.mjs
mkdir -p ~/.agents/skills
unzip -n dist/mylife-guide.zip -d ~/.agents/skills
```

Restart your assistant or open a new chat and invoke `$mylife-guide`. For Claude Code, use `~/.claude/skills` instead. The ZIP contains `SKILL.md`, both licenses, attribution, all book chapters, reference essays, and a generated search index. Rebuild and reinstall it to update the snapshot. To put `SKILL.md` at the ZIP root for another platform, use `node tools/skill/build.mjs --flat`.

## Install only the skill instructions from GitHub

This small installation fetches the book when needed unless you are already inside the local repository. It requires the public repository to have been published.

```bash
mkdir -p ~/.agents/skills/mylife-guide && curl -fsSL -o ~/.agents/skills/mylife-guide/SKILL.md "https://raw.githubusercontent.com/chenming7777/mylife-guide/main/skills/mylife-guide/SKILL.md"
```

Windows PowerShell:

```powershell
$skillDirectory = Join-Path $env:USERPROFILE '.agents/skills/mylife-guide'
New-Item -ItemType Directory -Force -Path $skillDirectory | Out-Null
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/chenming7777/mylife-guide/main/skills/mylife-guide/SKILL.md' -OutFile (Join-Path $skillDirectory 'SKILL.md')
```

## Sources and limits

The source text is written for mainland China. Confirm the user's jurisdiction for laws, benefits and help channels. Distinguish the book's dated claims from current official information. The skill's complete workflow is in [SKILL.md](SKILL.md).

When no bundled or local book is present:

```bash
git clone --depth 1 https://github.com/chenming7777/mylife-guide.git "${TMPDIR:-/tmp}/mylife-guide"
```

If the text cannot be retrieved, say so rather than inventing claims. The book does not replace professional medical, legal or accounting advice.

Codex skill locations: [official OpenAI documentation](https://developers.openai.com/codex/skills/).
