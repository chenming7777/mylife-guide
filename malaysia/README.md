# MyLife Guide Malaysia

An English guide and assistant skill for practical decisions in Malaysia. It adapts the decision framework of [HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter) by **eternity4719**, while checking local services, eligibility and rules against Malaysian sources.

**Start with the Malaysian references below.** The original Chinese book is preserved for attribution and research context. It is not a Malaysian law, benefits or medical handbook.

## Find the relevant Malaysian guidance

| Situation | Start here | Examples of local sources |
| --- | --- | --- |
| Emergency, healthcare, medicine, pregnancy, children, disability or caring for family | [Health and family](../skills/mylife-guide/references/malaysia-health.md) | MOH, MENTARI, NPRA, JPN and JKM |
| Work, dismissal, EPF, social protection, money, debt, benefits, housing, business or education | [Work and money](../skills/mylife-guide/references/malaysia-work-money.md) | JTK/JPPM, PERKESO, KWSP, HASiL, PIDM, BNM, SSM and MQA |
| Legal help, marriage, consumers, privacy, online incidents, travel or student passes | [Law, digital life and travel](../skills/mylife-guide/references/malaysia-law-digital.md) | JBG, courts, JPN/JAKIM, KPDN/TTPM, JPDP, Cyber999, Immigration and Wisma Putra |
| A topic from one of the original 34 chapters | [Chapter-by-chapter routing](../skills/mylife-guide/references/malaysia-routing.md) | Shows the Malaysian reference and what needs local checking |

Each Malaysian entry has its own identifier, supporting links, scope and verification date. A reference is a practical starting point; the responsible agency must confirm current eligibility, amounts, time limits or a disputed rule before action.

## What was reviewed and changed

The previous skill relied on the Chinese book for every answer, hardcoded Chinese court timelines, and reused prices and cost tiers from the source. The Malaysia skill now:

- Defaults to Malaysia and English, with state/territory and eligibility questions only where they matter.
- Uses Malaysian primary sources for local rules and services.
- Separates Peninsular/Labuan, Sabah and Sarawak where the topic requires it.
- Distinguishes civil and state Syariah family-law routes without assuming the user's religion.
- Uses actual RM costs; it does not convert a Chinese allowance or cost tier into a Malaysian entitlement.
- Retains international research as research, preserving study populations and statistical limitations.
- Records conflicting official sources instead of inventing a uniform answer.

The [audit](AUDIT.md) inventories **772 original entries across 34 chapters**. Automated searches flagged **623 entries** with country-specific terms or monetary/contact references. These are review candidates, not a count of “wrong” advice. Every original entry remains marked **not individually validated for Malaysia** in [audit.json](audit.json); unflagged entries are not automatically approved.

The **32 Malaysian reference entries** provide local service pathways and source checks. This is a usable Malaysia-first skill and reference edition, not a completed 772-entry English translation or a full rewrite of every clinical and legal claim. Each domain file lists remaining research areas. When a question falls into a gap, the skill must consult the appropriate current Malaysian source or say what remains unknown.

## Use the skill

Open this repository in your assistant, or follow the [installation instructions](../skills/mylife-guide/README.md). Example requests:

> Use $mylife-guide. I work in Sabah and was dismissed yesterday. What should I check and who should I contact?

> Use $mylife-guide. Compare my commuting options using RM18 per workday and two hours per day. Keep money and time separate.

> Use $mylife-guide. I am an international student in Malaysia. What must I verify before accepting part-time work?

The offline package includes the Malaysian references and the original evidence library. It can show the saved source snapshot; it cannot verify later policy changes without internet access.

## Build locally

Run in the repository root with Node.js:

```bash
node tools/malaysia/audit.mjs
node tools/malaysia/build.mjs
node tools/skill/build.mjs
```

Open `dist/mylife-guide-malaysia.html` for the English reference guide. Install `dist/mylife-guide.zip` for the assistant skill. The older `dist/mylife-guide.html` is the original Chinese research library and is labeled accordingly.

## Contribute

See [contribution instructions](CONTRIBUTING.md). Malaysia-specific guidance is maintained here. The original author asks derivatives and translations to be maintained separately and listed in their project directory, so an upstream listing is the appropriate first contribution. Individual source corrections can be proposed separately with evidence.

## Attribution and licensing

Original source snapshot: **2026-11-12**, commit `36c78569a8d21f26c7c650d2993c7103832ca4b5`. Malaysian sources were checked **2026-11-12**; source publication dates and retrieval limits are recorded individually.

Original and Malaysian guide prose is [CC BY 4.0](../LICENSE). Skill instructions and tooling are [MIT](../LICENSE-CODE), retaining original notices. See [ATTRIBUTION.md](../ATTRIBUTION.md) for the scope of modifications. This is an independent adaptation and is not endorsed by the original author or Malaysian agencies.
