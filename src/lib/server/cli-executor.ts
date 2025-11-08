import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export interface CliExecutorConfig {
  allowedCommands: string[];
  timeout?: number;
  maxOutputLength?: number;
  workingDirectory?: string;
}

/**
 * Secure CLI command executor with allowlist validation
 */
export class CliExecutor {
  private config: Required<CliExecutorConfig>;

  constructor(config: CliExecutorConfig) {
    this.config = {
      timeout: 10000,
      maxOutputLength: 50000,
      workingDirectory: process.cwd(),
      ...config,
    };
  }

  /**
   * Validate command against allowlist
   * Only allows commands that start with an allowed prefix
   */
  private validateCommand(command: string): boolean {
    const baseCommand = command.trim().split(' ')[0];
    return this.config.allowedCommands.some(
      (allowed) => baseCommand === allowed || baseCommand.startsWith(allowed + '/')
    );
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
