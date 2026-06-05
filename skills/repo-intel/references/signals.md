# Native Repo-Intel Signal Recipes

Run from the repository root. Every recipe recomputes from source-of-truth tools on demand. Prefer path-scoped commands when the user names a directory or file.

Common noise suppression for history-derived risk:

```text
Suppress generated/noisy paths from bug attribution and top-risk summaries:
*.d.ts, *.snap, package-lock.json, yarn.lock, pnpm-lock.yaml, Cargo.lock, go.sum,
generated/, codegen/, dist/, build/, vendor/, .next/, coverage/
```

Common 90-day window:

```bash
git --no-pager log -1 --format=%ct
```

Use the repo's last commit epoch as the reference point. `recent` means `commit_epoch >= last_commit_epoch - 90*24*60*60`. An author is stale when `lastSeen < last_commit_epoch - 90*24*60*60`.

## 1. Hotspots — recency-weighted churn

Intent: rank files by change pressure, with recent changes weighted 2x.

Exact command:

```bash
python3 - <<'PY'
import json, subprocess
from collections import defaultdict

NOISE_SUFFIXES = ('.d.ts', '.snap')
NOISE_NAMES = {'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Cargo.lock', 'go.sum'}
NOISE_PARTS = {'generated', 'codegen', 'dist', 'build', 'vendor', '.next', 'coverage'}

def keep(path):
    parts = set(path.split('/'))
    return not (path.endswith(NOISE_SUFFIXES) or path.rsplit('/', 1)[-1] in NOISE_NAMES or parts & NOISE_PARTS)

last = int(subprocess.check_output(['git', '--no-pager', 'log', '-1', '--format=%ct'], text=True).strip())
cutoff = last - 90 * 24 * 60 * 60
out = subprocess.check_output([
    'git', '--no-pager', 'log', '--no-merges', '--format=%H%x09%ct%x09%an <%ae>', '--name-only', '--'
], text=True, errors='replace')

total = defaultdict(int)
recent = defaultdict(int)
authors = defaultdict(set)
current_epoch = None
current_author = None
for line in out.splitlines():
    if not line:
        continue
    parts = line.split('\t')
    if len(parts) == 3 and len(parts[0]) >= 7:
        current_epoch = int(parts[1])
        current_author = parts[2]
        continue
    path = line.strip()
    if not path or not keep(path):
        continue
    total[path] += 1
    if current_epoch is not None and current_epoch >= cutoff:
        recent[path] += 1
    if current_author:
        authors[path].add(current_author)

rows = []
for path, changes in total.items():
    recent_changes = recent[path]
    score = (recent_changes * 2 + changes) / (changes + 1)
    rows.append({
        'path': path,
        'totalChanges': changes,
        'recentChanges': recent_changes,
        'score': round(score, 4),
        'authors': sorted(authors[path]),
    })
print(json.dumps(sorted(rows, key=lambda r: (-r['score'], -r['totalChanges'], r['path']))[:25], indent=2))
PY
```

Formula:

```text
hotspot score = (recentChanges*2 + totalChanges)/(totalChanges+1)
```

Output shape:

```json
[
  {"path":"src/auth/login.ts","totalChanges":42,"recentChanges":9,"score":1.3953,"authors":["Ada <ada@example.com>"]}
]
```

Certainty: HIGH for churn; MEDIUM for risk interpretation.

## 2. Bugspots — fix-commit history

Intent: rank files by density of commits that look like defect fixes.

Detection rule: a commit is a bug-fix commit when **any** rule matches the subject:

```text
1. conventional prefix: fix:, fix(scope):, bugfix:, hotfix:, patch:, revert:
2. whole-word keyword: fix|fixed|fixes|fixing|bug|regression|hotfix
3. issue closure: fixes #N, closes #N, resolves #N, or owner/repo#N forms after those verbs
```

Generated-file suppression applies before assigning a bug-fix touch to a file.

Exact command:

```bash
python3 - <<'PY'
import json, re, subprocess
from collections import defaultdict

NOISE_SUFFIXES = ('.d.ts', '.snap')
NOISE_NAMES = {'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Cargo.lock', 'go.sum'}
NOISE_PARTS = {'generated', 'codegen', 'dist', 'build', 'vendor', '.next', 'coverage'}
PREFIX = re.compile(r'^(fix|bugfix|hotfix|patch|revert)(\([^)]+\))?:', re.I)
KEYWORD = re.compile(r'\b(fix|fixed|fixes|fixing|bug|regression|hotfix)\b', re.I)
CLOSURE = re.compile(r'\b(fixes|closes|resolves)\s+([\w.-]+/[\w.-]+)?#\d+\b', re.I)

def keep(path):
    parts = set(path.split('/'))
    return not (path.endswith(NOISE_SUFFIXES) or path.rsplit('/', 1)[-1] in NOISE_NAMES or parts & NOISE_PARTS)

def is_fix(subject):
    return bool(PREFIX.search(subject) or KEYWORD.search(subject) or CLOSURE.search(subject))

out = subprocess.check_output([
    'git', '--no-pager', 'log', '--no-merges', '--format=%H%x09%ct%x09%s', '--name-only', '--'
], text=True, errors='replace')

total = defaultdict(int)
fixes = defaultdict(int)
last_fix = {}
current_fix = False
current_epoch = None
for line in out.splitlines():
    if not line:
        continue
    parts = line.split('\t', 2)
    if len(parts) == 3 and len(parts[0]) >= 7:
        current_epoch = int(parts[1])
        current_fix = is_fix(parts[2])
        continue
    path = line.strip()
    if not path or not keep(path):
        continue
    total[path] += 1
    if current_fix:
        fixes[path] += 1
        last_fix[path] = current_epoch

rows = []
for path, changes in total.items():
    bug_fixes = fixes[path]
    if bug_fixes == 0:
        continue
    rows.append({
        'path': path,
        'bugFixRate': round(bug_fixes / changes, 4),
        'totalChanges': changes,
        'bugFixes': bug_fixes,
        'lastBugFixEpoch': last_fix.get(path),
    })
print(json.dumps(sorted(rows, key=lambda r: (-r['bugFixRate'], -r['bugFixes'], -r['totalChanges'], r['path']))[:25], indent=2))
PY
```

Output shape:

```json
[
  {"path":"src/cache.ts","bugFixRate":0.375,"totalChanges":8,"bugFixes":3,"lastBugFixEpoch":1770000000}
]
```

Certainty: HIGH for subject/path matching; MEDIUM for true defect causality.

## 3. Coupling — files co-changing in the same commits

Intent: discover files that move with a target file.

Exact command:

```bash
TARGET='src/auth/login.ts' python3 - <<'PY'
import json, os, subprocess
from collections import Counter

target = os.environ['TARGET']
out = subprocess.check_output([
    'git', '--no-pager', 'log', '--no-merges', '--format=%H', '--name-only', '--'
], text=True, errors='replace')

commits = []
current = None
for line in out.splitlines():
    if not line:
        continue
    if len(line.split()) == 1 and all(c in '0123456789abcdefABCDEF' for c in line.strip()) and len(line.strip()) >= 7:
        if current is not None:
            commits.append(current)
        current = set()
    elif current is not None:
        current.add(line.strip())
if current is not None:
    commits.append(current)

target_commits = [files for files in commits if target in files]
target_count = len(target_commits)
other_totals = Counter(path for files in commits for path in files if path != target)
common = Counter(path for files in target_commits for path in files if path != target)
rows = []
for path, common_commits in common.items():
    union = target_count + other_totals[path] - common_commits
    rows.append({
        'file': path,
        'commonCommits': common_commits,
        'targetCommits': target_count,
        'otherCommits': other_totals[path],
        'targetRatio': round(common_commits / target_count, 4) if target_count else 0,
        'jaccard': round(common_commits / union, 4) if union else 0,
    })
print(json.dumps(sorted(rows, key=lambda r: (-r['targetRatio'], -r['jaccard'], -r['commonCommits'], r['file']))[:25], indent=2))
PY
```

Output shape:

```json
[
  {"file":"src/auth/session.ts","commonCommits":6,"targetCommits":9,"otherCommits":8,"targetRatio":0.6667,"jaccard":0.5455}
]
```

Interpretation: `targetRatio >= 0.5` means the other file changes in at least half of target-file commits. `jaccard >= 0.35` indicates a strong symmetric co-change relation.

Certainty: HIGH for co-change; LOW for architectural coupling unless supported by imports/calls.

## 4. Ownership — path-level author concentration

Intent: identify observed maintainers and stale ownership for a file or directory.

Repo-level contributor count:

```bash
git shortlog -sne --all --no-merges
```

Path-level ownership command:

```bash
PATHSPEC='src/auth' python3 - <<'PY'
import json, os, subprocess
from collections import defaultdict

pathspec = os.environ['PATHSPEC']
last = int(subprocess.check_output(['git', '--no-pager', 'log', '-1', '--format=%ct'], text=True).strip())
cutoff = last - 90 * 24 * 60 * 60
out = subprocess.check_output([
    'git', '--no-pager', 'log', '--no-merges', '--format=%H%x09%ct%x09%an <%ae>', '--name-only', '--', pathspec
], text=True, errors='replace')

commits = defaultdict(int)
last_seen = {}
current_author = None
current_epoch = None
seen_in_commit = False
for line in out.splitlines():
    if not line:
        continue
    parts = line.split('\t')
    if len(parts) == 3 and len(parts[0]) >= 7:
        if current_author and seen_in_commit:
            commits[current_author] += 1
            last_seen[current_author] = max(last_seen.get(current_author, 0), current_epoch)
        current_epoch = int(parts[1])
        current_author = parts[2]
        seen_in_commit = False
    else:
        seen_in_commit = True
if current_author and seen_in_commit:
    commits[current_author] += 1
    last_seen[current_author] = max(last_seen.get(current_author, 0), current_epoch)

total = sum(commits.values())
owners = []
for author, count in commits.items():
    owners.append({
        'author': author,
        'commits': count,
        'pct': round(count / total, 4) if total else 0,
        'lastSeenEpoch': last_seen[author],
        'stale': last_seen[author] < cutoff,
    })
owners.sort(key=lambda r: (-r['commits'], r['author']))
print(json.dumps({
    'path': pathspec,
    'totalCommits': total,
    'primary': owners[0]['author'] if owners else None,
    'primaryPct': owners[0]['pct'] if owners else 0,
    'busFactorRisk': bool(owners and (owners[0]['pct'] >= 0.8 or len([o for o in owners if not o['stale']]) <= 1)),
    'owners': owners,
}, indent=2))
PY
```

Output shape:

```json
{
  "path":"src/auth",
  "totalCommits":31,
  "primary":"Ada <ada@example.com>",
  "primaryPct":0.742,
  "busFactorRisk":false,
  "owners":[{"author":"Ada <ada@example.com>","commits":23,"pct":0.742,"lastSeenEpoch":1770000000,"stale":false}]
}
```

Certainty: HIGH for observed commits; MEDIUM for true responsibility.

## 5. Bus factor — people required to cover 80% of commits

Intent: estimate knowledge concentration at repo or path scope.

Exact command:

```bash
PATHSPEC='.' python3 - <<'PY'
import json, os, re, subprocess
from collections import defaultdict

pathspec = os.environ.get('PATHSPEC', '.')
BOT = re.compile(r'(\[bot\]|dependabot|renovate|github-actions|copilot|bot@)', re.I)
last = int(subprocess.check_output(['git', '--no-pager', 'log', '-1', '--format=%ct'], text=True).strip())
cutoff = last - 90 * 24 * 60 * 60
out = subprocess.check_output([
    'git', '--no-pager', 'log', '--no-merges', '--format=%H%x09%ct%x09%an <%ae>', '--', pathspec
], text=True, errors='replace')

counts = defaultdict(int)
last_seen = {}
for line in out.splitlines():
    parts = line.split('\t')
    if len(parts) != 3:
        continue
    epoch = int(parts[1])
    author = parts[2]
    if BOT.search(author):
        continue
    counts[author] += 1
    last_seen[author] = max(last_seen.get(author, 0), epoch)

total = sum(counts.values())
running = 0
critical = []
for author, count in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
    if total and running / total >= 0.8:
        break
    running += count
    critical.append({
        'author': author,
        'commits': count,
        'pct': round(count / total, 4) if total else 0,
        'lastSeenEpoch': last_seen[author],
        'stale': last_seen[author] < cutoff,
    })
print(json.dumps({
    'path': pathspec,
    'humanCommits': total,
    'busFactor': len(critical),
    'coveragePct': round(running / total, 4) if total else 0,
    'criticalOwners': critical,
    'risk': 'high' if len(critical) <= 1 else 'medium' if len(critical) <= 2 else 'low',
}, indent=2))
PY
```

Output shape:

```json
{
  "path":".",
  "humanCommits":240,
  "busFactor":2,
  "coveragePct":0.8333,
  "criticalOwners":[{"author":"Ada <ada@example.com>","commits":130,"pct":0.5417,"lastSeenEpoch":1770000000,"stale":false}],
  "risk":"medium"
}
```

Certainty: HIGH for concentration; MEDIUM for risk because commit authorship is an imperfect proxy for knowledge.

## 6. Recency and staleness — 90-day snapshot window

Intent: identify cold files and stale authors relative to the repo's last commit.

Exact command:

```bash
python3 - <<'PY'
import json, subprocess
from collections import defaultdict

last = int(subprocess.check_output(['git', '--no-pager', 'log', '-1', '--format=%ct'], text=True).strip())
cutoff = last - 90 * 24 * 60 * 60
out = subprocess.check_output([
    'git', '--no-pager', 'log', '--no-merges', '--format=%H%x09%ct%x09%an <%ae>', '--name-only', '--'
], text=True, errors='replace')

file_last = {}
author_last = defaultdict(int)
current_epoch = None
current_author = None
for line in out.splitlines():
    if not line:
        continue
    parts = line.split('\t')
    if len(parts) == 3 and len(parts[0]) >= 7:
        current_epoch = int(parts[1])
        current_author = parts[2]
        author_last[current_author] = max(author_last[current_author], current_epoch)
        continue
    path = line.strip()
    if path and current_epoch is not None:
        file_last[path] = max(file_last.get(path, 0), current_epoch)

print(json.dumps({
    'lastCommitEpoch': last,
    'cutoffEpoch': cutoff,
    'coldFiles': sorted([
        {'path': p, 'lastChangedEpoch': e} for p, e in file_last.items() if e < cutoff
    ], key=lambda r: (r['lastChangedEpoch'], r['path']))[:50],
    'staleAuthors': sorted([
        {'author': a, 'lastSeenEpoch': e} for a, e in author_last.items() if e < cutoff
    ], key=lambda r: (r['lastSeenEpoch'], r['author']))[:50],
}, indent=2))
PY
```

Output shape:

```json
{
  "lastCommitEpoch":1770000000,
  "cutoffEpoch":1762224000,
  "coldFiles":[{"path":"src/legacy.ts","lastChangedEpoch":1750000000}],
  "staleAuthors":[{"author":"Grace <grace@example.com>","lastSeenEpoch":1750000000}]
}
```

Certainty: HIGH.

## 7. Entry points — where execution starts

Intent: list scripts, command starts, service starts, and AST `main` functions.

Codegraph primary recipe when indexed:

```text
codegraph_explore query: "entry points package.json Cargo.toml pyproject.toml go main function npm scripts cli commands server starts"
codegraph_search query: "main"
```

Fallback command:

```bash
python3 - <<'PY'
import json, tomllib
from pathlib import Path

rows = []
for p in Path('.').rglob('*'):
    if any(part in {'.git', 'node_modules', 'dist', 'build', 'vendor', '.next'} for part in p.parts):
        continue
    name = p.name
    try:
        if name == 'package.json':
            import json as _json
            data = _json.loads(p.read_text(errors='replace'))
            for k, v in (data.get('scripts') or {}).items():
                rows.append({'type': 'npm-script', 'file': str(p), 'name': k, 'command': v})
            if data.get('bin'):
                rows.append({'type': 'package-command', 'file': str(p), 'name': 'bin', 'value': data['bin']})
        elif name == 'Cargo.toml':
            data = tomllib.loads(p.read_text(errors='replace'))
            for item in data.get('bin', []) or []:
                rows.append({'type': 'cargo-command', 'file': str(p), 'name': item.get('name'), 'path': item.get('path')})
        elif name == 'pyproject.toml':
            data = tomllib.loads(p.read_text(errors='replace'))
            scripts = ((data.get('project') or {}).get('scripts') or {})
            for k, v in scripts.items():
                rows.append({'type': 'python-script', 'file': str(p), 'name': k, 'target': v})
        elif p.suffix in {'.py', '.js', '.ts', '.go', '.rs'}:
            text = p.read_text(errors='replace')
            if 'if __name__ == "__main__"' in text or "if __name__ == '__main__'" in text:
                rows.append({'type': 'python-main', 'file': str(p)})
            if 'func main(' in text:
                rows.append({'type': 'go-main', 'file': str(p)})
            if 'fn main(' in text:
                rows.append({'type': 'rust-main', 'file': str(p)})
    except Exception:
        pass
print(json.dumps(rows, indent=2))
PY
```

Output shape:

```json
[
  {"type":"npm-script","file":"package.json","name":"dev","command":"vite --host 0.0.0.0"},
  {"type":"rust-main","file":"crates/cli/src/main.rs"}
]
```

Certainty: HIGH with codegraph; MEDIUM with fallback.

## 8. Symbols — definitions, exports, imports

Intent: find what a file exposes or where a symbol is defined.

Codegraph primary recipes when indexed:

```text
codegraph_search query: "CreateUser"
codegraph_explore query: "symbols in src/auth/login.ts exports imports definitions"
codegraph_files path: "src/auth"
```

Fallback commands:

```bash
SYMBOL='CreateUser' git grep -n --word-regexp "$SYMBOL" -- ':!*.d.ts' ':!**/generated/**' ':!**/dist/**' ':!**/build/**'
```

TypeScript/JavaScript structural examples:

```bash
ast-grep --lang ts -p 'export function $NAME($$$ARGS) { $$$BODY }' src
ast-grep --lang ts -p 'export const $NAME = $VALUE' src
ast-grep --lang ts -p 'import { $$$IMPORTS } from "$MOD"' src
```

Python structural examples:

```bash
ast-grep --lang py -p 'def $NAME($$$ARGS): $$$BODY' .
ast-grep --lang py -p 'class $NAME: $$$BODY' .
```

Rust structural examples:

```bash
ast-grep --lang rust -p 'pub fn $NAME($$$ARGS) { $$$BODY }' .
ast-grep --lang rust -p 'pub struct $NAME { $$$FIELDS }' .
```

Output shape:

```json
{
  "query":"CreateUser",
  "matches":[{"file":"src/auth/types.ts","line":12,"kind":"definition","symbol":"CreateUser"}]
}
```

Certainty: HIGH with codegraph; MEDIUM with AST fallback; LOW if only text fallback matches.

## 9. Dependents / callers / callees / impact

Intent: identify what would break or need review if a symbol/file changes.

Codegraph primary recipes when indexed:

```text
codegraph_callers symbol: "createUser"
codegraph_callees symbol: "createUser"
codegraph_impact symbol_or_file: "createUser"
codegraph_explore query: "flow createUser validateUser insertUser issueToken"
```

Fallback command for references:

```bash
SYMBOL='createUser' git grep -n --word-regexp "$SYMBOL" -- ':!*.d.ts' ':!**/generated/**' ':!**/dist/**' ':!**/build/**'
```

Fallback import/dependent scan for TypeScript/JavaScript:

```bash
MODULE='src/auth/user' git grep -n "from ['\"]$MODULE['\"]\|require(['\"]$MODULE['\"]" -- '*.ts' '*.tsx' '*.js' '*.jsx'
```

Output shape:

```json
{
  "target":"createUser",
  "usedBy":[{"file":"src/routes/users.ts","line":44,"evidence":"call"}],
  "certainty":"HIGH|MEDIUM|LOW"
}
```

Certainty: HIGH with codegraph callers/impact; MEDIUM for structural imports; LOW for plain text references.

## 10. Project metadata — manifests, stack, scripts, CI

Intent: summarize repo shape without reading every file.

Exact command:

```bash
python3 - <<'PY'
import json, tomllib
from pathlib import Path

manifest_names = {
    'package.json', 'Cargo.toml', 'pyproject.toml', 'go.mod', 'pom.xml', 'build.gradle',
    'deno.json', 'bunfig.toml', 'requirements.txt', 'Gemfile', 'composer.json'
}
ci_names = {'.github/workflows', '.gitlab-ci.yml', 'Jenkinsfile', 'azure-pipelines.yml'}
rows = {'manifests': [], 'ci': [], 'scripts': []}
for p in Path('.').rglob('*'):
    if any(part in {'.git', 'node_modules', 'dist', 'build', 'vendor', '.next'} for part in p.parts):
        continue
    if p.name in manifest_names:
        item = {'path': str(p), 'name': p.name}
        try:
            if p.name == 'package.json':
                data = json.loads(p.read_text(errors='replace'))
                item.update({'package': data.get('name'), 'managerScripts': sorted((data.get('scripts') or {}).keys())})
            elif p.name in {'Cargo.toml', 'pyproject.toml'}:
                data = tomllib.loads(p.read_text(errors='replace'))
                item.update({'project': (data.get('package') or data.get('project') or {}).get('name')})
        except Exception as exc:
            item['readError'] = type(exc).__name__
        rows['manifests'].append(item)
    if str(p) == '.github/workflows' or p.name in ci_names:
        rows['ci'].append(str(p))
print(json.dumps(rows, indent=2))
PY
```

Output shape:

```json
{
  "manifests":[{"path":"package.json","name":"package.json","package":"app","managerScripts":["build","test"]}],
  "ci":[".github/workflows"]
}
```

Certainty: HIGH for detected manifests; LOW for absent tooling because it may live outside standard files.

## 11. Whole-repo digest — compressed context packet

Intent: produce a compact repo packet for broad synthesis after targeted signals are collected.

Exact command:

```bash
npx -y repomix --compress -o /tmp/repo-intel-pack.xml
```

Path-scoped variant:

```bash
npx -y repomix src tests --compress -o /tmp/repo-intel-pack.xml
```

Output shape:

```json
{"artifact":"/tmp/repo-intel-pack.xml","use":"read selected ranges or search within the packed output"}
```

Certainty: HIGH for included text; MEDIUM for omitted generated/ignored files depending on repomix configuration.

## 12. Repo health — composite report

Intent: synthesize health from multiple native signals. Do not compute this from one recipe.

Minimum evidence set:

```text
1. recency: last commit epoch + stale/cold counts
2. hotspot: top 5 files + score formula
3. bugspot: top 5 files + generated suppression applied
4. bus-factor: repo-level and path-level if user named a path
5. metadata: manifest/tooling facts
6. symbols/dependents: only when health question concerns architecture or refactor risk
```

Recommended output shape:

```json
{
  "activity":"active|quiet|stale",
  "risk":"low|medium|high",
  "topHotspots":[{"path":"src/app.ts","score":1.2}],
  "topBugspots":[{"path":"src/cache.ts","bugFixRate":0.375}],
  "busFactor":{"path":".","busFactor":2,"risk":"medium"},
  "staleOwners":["Grace <grace@example.com>"],
  "metadata":{"manifests":["package.json"],"ci":true},
  "notes":["Hotspot overlaps bugspot", "Primary owner stale"]
}
```

Risk grading:

```text
HIGH: hotspot overlaps bugspot AND busFactor <= 1 or primary owner stale
MEDIUM: hotspot overlaps bugspot OR busFactor <= 2 OR many cold files in active repo
LOW: active repo, busFactor >= 3, no hotspot/bugspot overlap in top 10
```

Certainty: LOW-to-MEDIUM because health is a synthesis; cite every contributing signal.
