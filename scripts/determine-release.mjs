import { execSync } from 'node:child_process';

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
    execSync(
      `printf '%s=%s\n' ${shellEscape(name)} ${shellEscape(value)} >> ${shellEscape(process.env.GITHUB_OUTPUT)}`,
      {
        shell: '/bin/bash',
        stdio: 'ignore',
      }
    );
  }
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
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

    if (!releaseAs && /^feat(?:\([^)]+\))?:/m.test(commit)) {
      releaseAs = 'minor';
      continue;
    }

    if (!releaseAs && /^(fix|perf|revert)(?:\([^)]+\))?:/m.test(commit)) {
      releaseAs = 'patch';
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
