import { exec } from 'child_process';
import { promisify } from 'util';
import { TIMEOUT, FILE_SIZE } from '../constants.js';

const execAsync = promisify(exec);

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
  private config: Required<CliExecutorConfig>;

  constructor(config: CliExecutorConfig) {
    this.config = {
      timeout: TIMEOUT.VERY_LONG,
      maxOutputLength: FILE_SIZE.MAX_CLI_OUTPUT,
      workingDirectory: process.cwd(),
      ...config,
    };
  }

  /**
   * Pattern to detect shell metacharacters that could enable command injection
   */
  private static readonly DANGEROUS_CHARS = /[;&|`$(){}[\]<>\\]/;

  /**
   * Validate command against allowlist and check for injection attempts
   * Only allows commands that start with an allowed prefix and contain no shell metacharacters
   */
  private validateCommand(command: string): boolean {
    const baseCommand = command.trim().split(' ')[0];

    // Check allowlist first
    const isAllowed = this.config.allowedCommands.some(
      (allowed) => baseCommand === allowed || baseCommand.startsWith(allowed + '/')
    );

    if (!isAllowed) {
      return false;
    }

    // Block shell metacharacters to prevent command injection
    if (CliExecutor.DANGEROUS_CHARS.test(command)) {
      return false;
    }

    return true;
  }

  /**
   * Execute CLI command safely with timeout and output limits
   * @param command - Command to execute (must be in allowlist)
   * @returns Execution result with stdout, stderr, exit code, and duration
   * @throws Error if command is not allowed
   */
  async execute(command: string): Promise<CommandExecutionResult> {
    if (!this.validateCommand(command)) {
      throw new Error(`Command not allowed: ${command.split(' ')[0]}`);
    }

    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeout,
        maxBuffer: this.config.maxOutputLength,
        cwd: this.config.workingDirectory,
        env: {
          ...process.env,
          // Force color output for commands that support it
          FORCE_COLOR: '1',
          CLICOLOR_FORCE: '1',
        },
      });

      return {
        stdout: stdout.slice(0, this.config.maxOutputLength),
        stderr: stderr.slice(0, this.config.maxOutputLength),
        exitCode: 0,
        duration: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      return {
        stdout: (err.stdout as string) || '',
        stderr: (err.stderr as string) || (err.message as string) || '',
        exitCode: (err.code as number) || 1,
        duration: Date.now() - startTime,
      };
    }
  }
}
