import { execFile } from 'child_process';
import { promisify } from 'util';
import { TIMEOUT, FILE_SIZE } from '../constants.js';

const execFileAsync = promisify(execFile);

/**
 * Result from executing a CLI command
 * @public
 */
export interface CommandExecutionResult {
  /** Standard output from the command */
  stdout: string;
  /** Standard error output from the command */
  stderr: string;
  /** Process exit code (0 = success, non-zero = error) */
  exitCode: number;
  /** Execution duration in milliseconds */
  duration: number;
}

/**
 * Configuration for the CLI executor
 * @public
 */
export interface CliExecutorConfig {
  /** List of allowed command prefixes (e.g., ['git', 'npm', 'pnpm']) */
  allowedCommands: string[];
  /** Command execution timeout in milliseconds (default: TIMEOUT.VERY_LONG) */
  timeout?: number;
  /** Maximum output length in bytes before truncation (default: FILE_SIZE.MAX_CLI_OUTPUT) */
  maxOutputLength?: number;
  /** Working directory for command execution (default: process.cwd()) */
  workingDirectory?: string;
}

/**
 * Secure CLI command executor with allowlist validation
 *
 * Provides safe command execution with:
 * - Allowlist-based command validation
 * - Shell metacharacter blocking to prevent injection attacks
 * - Configurable timeouts and output limits
 * - Forced color output for supported commands
 *
 * @example
 * ```typescript
 * const executor = new CliExecutor({
 *   allowedCommands: ['git', 'npm', 'pnpm'],
 *   timeout: 30000,
 *   workingDirectory: '/path/to/project'
 * });
 *
 * const result = await executor.execute('git status');
 * console.log(result.stdout);
 * ```
 *
 * @public
 */
export class CliExecutor {
  readonly #config: Required<CliExecutorConfig>;

  /** Pattern to detect shell metacharacters that could enable command injection */
  static readonly #DANGEROUS_CHARS = /[;&|`$(){}[\]<>\\]/;

  constructor(config: CliExecutorConfig) {
    this.#config = {
      timeout: TIMEOUT.VERY_LONG,
      maxOutputLength: FILE_SIZE.MAX_CLI_OUTPUT,
      workingDirectory: process.cwd(),
      ...config,
    };
  }

  #parseCommand(command: string): { executable: string; args: string[] } {
    const tokens: string[] = [];
    let current = '';
    let inQuote: string | null = null;

    for (let i = 0; i < command.length; i++) {
      const char = command[i];

      if (inQuote) {
        if (char === inQuote) {
          inQuote = null;
        } else {
          current += char;
        }
      } else {
        if (char === '"' || char === "'") {
          inQuote = char;
        } else if (char === ' ' || char === '\t') {
          if (current) {
            tokens.push(current);
            current = '';
          }
        } else {
          current += char;
        }
      }
    }

    if (current) {
      tokens.push(current);
    }

    return {
      executable: tokens[0] || '',
      args: tokens.slice(1),
    };
  }

  #validateCommand(command: string): boolean {
    const baseCommand = command.trim().split(' ')[0];

    const isAllowed = this.#config.allowedCommands.some(
      (allowed) => baseCommand === allowed || baseCommand.startsWith(allowed + '/')
    );

    if (!isAllowed) {
      return false;
    }

    if (CliExecutor.#DANGEROUS_CHARS.test(command)) {
      return false;
    }

    return true;
  }

  /**
   * Execute CLI command safely with timeout and output limits
   *
   * Uses execFile() instead of exec() for improved security:
   * - Does not spawn a shell, preventing shell injection attacks
   * - Arguments are passed directly to the executable
   * - Quoted strings are handled internally for argument grouping
   *
   * @param command - Command to execute (must be in allowlist)
   * @returns Execution result with stdout, stderr, exit code, and duration
   * @throws Error if command is not allowed
   */
  async execute(command: string): Promise<CommandExecutionResult> {
    if (!this.#validateCommand(command)) {
      throw new Error(`Command not allowed: ${command.split(' ')[0]}`);
    }

    const { executable, args } = this.#parseCommand(command);
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execFileAsync(executable, args, {
        timeout: this.#config.timeout,
        maxBuffer: this.#config.maxOutputLength,
        cwd: this.#config.workingDirectory,
        env: {
          ...process.env,
          FORCE_COLOR: '1',
          CLICOLOR_FORCE: '1',
        },
      });

      return {
        stdout: stdout.slice(0, this.#config.maxOutputLength),
        stderr: stderr.slice(0, this.#config.maxOutputLength),
        exitCode: 0,
        duration: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const exitCode = typeof err.code === 'number' ? err.code : 1;
      return {
        stdout: (err.stdout as string) || '',
        stderr: (err.stderr as string) || (err.message as string) || '',
        exitCode,
        duration: Date.now() - startTime,
      };
    }
  }
}
