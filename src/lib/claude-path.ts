import { spawnSync } from 'child_process';
import { realpathSync } from 'fs';
import createDebug from 'debug';

const debug = createDebug('claude:cli');

/**
 * Find the Claude Code CLI path
 * @param env - Environment variables (defaults to process.env)
 * @returns Path to Claude CLI or undefined if not found
 */
export function findClaudePath(env: NodeJS.ProcessEnv = process.env): string | undefined {
  // Find the 'claude' command in PATH
  const whichResult = spawnSync('which', ['claude'], {
    encoding: 'utf-8',
    shell: false,
    env,
  });

  if (whichResult.status !== 0 || !whichResult.stdout) {
    debug('Claude CLI not found in PATH');
    return undefined;
  }

  const claudeSymlink = whichResult.stdout.trim();

  // Resolve symlinks to absolute path
  try {
    const realPath = realpathSync(claudeSymlink);
    debug('Found Claude at: %s (resolved to %s)', claudeSymlink, realPath);
    return realPath;
  } catch {
    // Can't resolve, use as is
    debug('Found Claude at: %s', claudeSymlink);
    return claudeSymlink;
  }
}
