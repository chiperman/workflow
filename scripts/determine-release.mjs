import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const RELEASE_PRIORITY = {
  '': 0,
  patch: 1,
  minor: 2,
  major: 3,
};

function run(command) {
  return execSync(command, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function tryRun(command) {
  try {
    return run(command);
  } catch {
    return '';
  }
}

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

function pickHigherRelease(current, candidate) {
  return RELEASE_PRIORITY[candidate] > RELEASE_PRIORITY[current] ? candidate : current;
}

function collectCommits() {
  const lastTag = process.env.LAST_TAG || tryRun(`git describe --tags --abbrev=0 --match "v*"`);
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
  const raw = run(`git log ${range} --format=%s%n%b%n==END==`);
  const commits = raw
    .split('\n==END==\n')
    .map(entry => entry.trim())
    .filter(Boolean);

  return { commits, lastTag };
}

function classifyRelease(commits) {
  let releaseAs = '';

  for (const commit of commits) {
    if (/^.+(?:\([^)]+\))?!:/m.test(commit) || /BREAKING CHANGE:/m.test(commit)) {
      releaseAs = 'major';
      break;
    }

    if (/^feat(?:\([^)]+\))?:/m.test(commit)) {
      releaseAs = pickHigherRelease(releaseAs, 'minor');
      continue;
    }

    if (/^(fix|perf|revert)(?:\([^)]+\))?:/m.test(commit)) {
      releaseAs = pickHigherRelease(releaseAs, 'patch');
    }
  }

  return releaseAs;
}

const { commits, lastTag } = collectCommits();
const releaseAs = classifyRelease(commits);
const shouldRelease = releaseAs !== '';

console.log(`lastTag=${lastTag || 'none'}`);
console.log(`commitsSinceTag=${commits.length}`);
console.log(`shouldRelease=${shouldRelease}`);
console.log(`releaseAs=${releaseAs || 'none'}`);

setOutput('last_tag', lastTag);
setOutput('should_release', String(shouldRelease));
setOutput('release_as', releaseAs);
