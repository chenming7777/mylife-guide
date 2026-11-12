# Contributing to MyLife Guide Malaysia

## Improve Malaysian guidance

Start a focused branch from `chenming7777/mylife-guide:malaysia-edition`. Edit the relevant `skills/mylife-guide/references/malaysia-*.md` file. Keep a stable MY entry ID and record:

1. What practical question the entry answers and the relevant original chapter.
2. The Malaysian action or service pathway, with eligibility and territorial scope.
3. A direct primary-source link and the date checked. Separate publication, effective and access dates.
4. Which China-specific assumption cannot be reused.
5. Conflicts or remaining uncertainty. A referral does not prove an entitlement.

Do not replace original research populations or claim that a Chinese law becomes Malaysian after renaming an agency. Do not mark an original entry as individually validated without a separate substantive review and its supporting sources. Update the audit method/schema if individual reviews are later added; the current generated inventory deliberately marks all original entries unvalidated.

Run:

```bash
node tools/malaysia/audit.mjs --check
node tools/malaysia/build.mjs
node tools/skill/build.mjs
node tools/check-refs.mjs --check
git diff --check
```

Check the generated Malaysia HTML, reference links and ZIP contents. Rebuild/reinstall an offline skill after reference changes. Original book statistics and citations must remain consistent if the source library itself is changed.

## Contribute back to HowToLiveBetter

Your genuine fork is [chenming7777/HowToLiveBetter](https://github.com/chenming7777/HowToLiveBetter); upstream is [eternity4719/HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter).

The upstream [project directory](https://github.com/eternity4719/HowToLiveBetter/blob/main/%E8%A1%8D%E7%94%9F%E9%A1%B9%E7%9B%AE.md) accepts attributed derivatives. Its authoring rules keep translations in their own repositories. For this edition, submit a concise entry under **AI 技能** describing Malaysia sources, English language, coverage limits and any advertising. Do not replace the original project's China-focused skill with a Malaysia default.

For a separate factual or tooling correction, start from current upstream rather than the personal rebranding commits:

```bash
git fetch upstream
git switch -c fix/descriptive-name upstream/main
# Make and check the focused correction, then stage only its files.
git add path/to/changed-file
git commit -m "Describe the correction"
git push -u origin fix/descriptive-name
```

These commands belong in the **HowToLiveBetter-contrib** checkout, whose `origin` is your genuine fork. Open a pull request from that branch to `eternity4719/HowToLiveBetter:main`. A prepared branch or comparison link is not an accepted or submitted pull request; the owner decides whether to merge it.
