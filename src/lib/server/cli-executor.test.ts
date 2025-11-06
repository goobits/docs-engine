import { describe, it, expect, beforeEach } from 'vitest';
import { CliExecutor, type CliExecutorConfig } from './cli-executor';

describe('CliExecutor - Security Tests', () => {
	let executor: CliExecutor;
	let config: CliExecutorConfig;

	beforeEach(() => {
		config = {
			allowedCommands: ['echo', 'pwd', 'whoami'],
			timeout: 5000,
			maxOutputLength: 1000
		};
		executor = new CliExecutor(config);
	});

	describe('Command Injection Prevention', () => {
		it('should reject command with semicolon separator', async () => {
			await expect(
				executor.execute('echo test; rm -rf /')
			).rejects.toThrow('Command contains dangerous characters');
		});

		it('should reject command with && operator', async () => {
			await expect(
				executor.execute('echo test && malicious-command')
			).rejects.toThrow('Command contains dangerous characters');
		});

		it('should reject command with || operator', async () => {
			await expect(
				executor.execute('echo test || malicious-command')
			).rejects.toThrow('Command contains dangerous characters');
		});

		it('should reject command with pipe operator', async () => {
			await expect(
				executor.execute('echo test | malicious-command')
			).rejects.toThrow('Command contains dangerous characters');
		});

		it('should reject command with backtick substitution', async () => {
			await expect(
				executor.execute('echo `malicious-command`')
			).rejects.toThrow('Command contains dangerous characters');
		});

		it('should reject command with $() substitution', async () => {
			await expect(
				executor.execute('echo $(malicious-command)')
			).rejects.toThrow('Command contains dangerous characters');
		});

		it('should reject command with newline injection', async () => {
			await expect(
				executor.execute('echo test\nmalicious-command')
			).rejects.toThrow('Command contains newline characters');
		});

		it('should reject command with redirect operators', async () => {
			await expect(
				executor.execute('echo test > /etc/passwd')
			).rejects.toThrow('Command contains dangerous characters');
		});
	});

	describe('Allowlist Validation', () => {
		it('should allow command in allowlist', async () => {
			const result = await executor.execute('echo "test"');
			expect(result.exitCode).toBe(0);
			expect(result.stdout.trim()).toBe('test');
		});

		it('should reject command not in allowlist', async () => {
			await expect(
				executor.execute('rm -rf /')
			).rejects.toThrow('Command not allowed: rm');
		});

		it('should reject empty command', async () => {
			await expect(
				executor.execute('')
			).rejects.toThrow('Command not allowed');
		});

		it('should reject whitespace-only command', async () => {
			await expect(
				executor.execute('   ')
			).rejects.toThrow('Command not allowed');
		});

		it('should handle commands with multiple spaces', async () => {
			const result = await executor.execute('echo    test');
			expect(result.exitCode).toBe(0);
		});

		it('should allow subcommands with slash (e.g., git/bin/git)', async () => {
			const gitExecutor = new CliExecutor({
				allowedCommands: ['git'],
				timeout: 5000
			});

			// This should work according to line 42: baseCommand.startsWith(allowed + '/')
			const result = await gitExecutor.execute('git --version');
			expect(result).toBeDefined();
		});

		it('should reject similar but different command', async () => {
			await expect(
				executor.execute('echo2 test')
			).rejects.toThrow('Command not allowed: echo2');
		});

		it('should reject command with leading path', async () => {
			await expect(
				executor.execute('/bin/bash -c "malicious"')
			).rejects.toThrow('Command not allowed: /bin/bash');
		});
	});

	describe('Path Traversal Prevention', () => {
		it('should handle arguments with ../ paths safely', async () => {
			// This test verifies the command executes but doesn't escape working directory
			const result = await executor.execute('echo ../../etc/passwd');
			expect(result.exitCode).toBe(0);
			// The path is just echoed as text, not used to access files
			expect(result.stdout).toContain('../../etc/passwd');
		});

		it('should execute in configured working directory', async () => {
			const result = await executor.execute('pwd');
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain(process.cwd());
		});

		it('should not allow cd command to change directory', async () => {
			await expect(
				executor.execute('cd /tmp')
			).rejects.toThrow('Command not allowed: cd');
		});
	});

	describe('Timeout Enforcement', () => {
		it('should enforce timeout for long-running commands', async () => {
			const fastExecutor = new CliExecutor({
				allowedCommands: ['sleep'],
				timeout: 100, // 100ms timeout
				maxOutputLength: 1000
			});

			const result = await fastExecutor.execute('sleep 5');

			// Command should timeout and return error
			expect(result.exitCode).not.toBe(0);
			expect(result.duration).toBeLessThan(1000); // Should timeout quickly
		}, 2000); // Test timeout

		it('should complete fast commands within timeout', async () => {
			const result = await executor.execute('echo "fast"');
			expect(result.exitCode).toBe(0);
			expect(result.duration).toBeLessThan(config.timeout!);
		});
	});

	describe('Output Length Limits', () => {
		it('should truncate large stdout output', async () => {
			const smallExecutor = new CliExecutor({
				allowedCommands: ['echo'],
				timeout: 5000,
				maxOutputLength: 50 // Very small limit
			});

			// Generate large output
			const largeString = 'x'.repeat(100);
			const result = await smallExecutor.execute(`echo "${largeString}"`);

			expect(result.stdout.length).toBeLessThanOrEqual(50);
		});

		it('should handle stderr output within limits', async () => {
			// Use a command that generates stderr naturally (ls on nonexistent file)
			const lsExecutor = new CliExecutor({
				allowedCommands: ['ls'],
				timeout: 5000,
				maxOutputLength: 1000
			});
			const result = await lsExecutor.execute('ls /nonexistent-file-xyz');
			expect(result.stderr.length).toBeLessThanOrEqual(1000);
		});

		it('should not crash with empty output', async () => {
			const result = await executor.execute('echo ""');
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toBeDefined();
		});
	});

	describe('Error Handling', () => {
		it('should handle command that exits with non-zero code', async () => {
			// Use false command which always exits with code 1
			const failExecutor = new CliExecutor({
				allowedCommands: ['false'],
				timeout: 5000
			});

			const result = await failExecutor.execute('false');
			expect(result.exitCode).not.toBe(0);
			expect(result.duration).toBeGreaterThan(0);
		});

		it('should capture stderr from failed commands', async () => {
			const lsExecutor = new CliExecutor({
				allowedCommands: ['ls'],
				timeout: 5000
			});

			const result = await lsExecutor.execute('ls /nonexistent-directory-12345');
			expect(result.exitCode).not.toBe(0);
			expect(result.stderr).toBeTruthy();
		});

		it('should return result object even on error', async () => {
			const failExecutor = new CliExecutor({
				allowedCommands: ['false'],
				timeout: 5000
			});

			const result = await failExecutor.execute('false');
			expect(result).toHaveProperty('stdout');
			expect(result).toHaveProperty('stderr');
			expect(result).toHaveProperty('exitCode');
			expect(result).toHaveProperty('duration');
		});
	});

	describe('Environment Variables', () => {
		it('should set color output environment variables', async () => {
			const envExecutor = new CliExecutor({
				allowedCommands: ['env'],
				timeout: 5000
			});

			const result = await envExecutor.execute('env');
			expect(result.exitCode).toBe(0);
			// These env vars are set in cli-executor.ts lines 65-68
			expect(result.stdout).toContain('FORCE_COLOR=1');
			expect(result.stdout).toContain('CLICOLOR_FORCE=1');
		});

		it('should not allow environment variable injection', async () => {
			// Attempting to inject malicious env var
			await expect(
				executor.execute('MALICIOUS=1 echo test')
			).rejects.toThrow('Command not allowed: MALICIOUS=1');
		});
	});

	describe('Edge Cases', () => {
		it('should handle commands with quotes correctly', async () => {
			const result = await executor.execute('echo "hello world"');
			expect(result.exitCode).toBe(0);
			expect(result.stdout.trim()).toBe('hello world');
		});

		it('should handle commands with safe special characters in strings', async () => {
			// Test that safe characters like @, #, %, ^ work fine
			const result = await executor.execute('echo "test@#%^value"');
			expect(result.exitCode).toBe(0);
			expect(result.stdout.trim()).toBe('test@#%^value');
		});

		it('should handle unicode in output', async () => {
			const result = await executor.execute('echo "Hello 世界 🌍"');
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain('世界');
			expect(result.stdout).toContain('🌍');
		});

		it('should track execution duration accurately', async () => {
			const startTime = Date.now();
			const result = await executor.execute('echo test');
			const endTime = Date.now();

			expect(result.duration).toBeGreaterThan(0);
			expect(result.duration).toBeLessThanOrEqual(endTime - startTime + 10); // +10ms tolerance
		});
	});

	describe('Configuration', () => {
		it('should accept custom timeout', () => {
			const customExecutor = new CliExecutor({
				allowedCommands: ['echo'],
				timeout: 15000
			});

			expect(customExecutor).toBeDefined();
		});

		it('should accept custom maxOutputLength', () => {
			const customExecutor = new CliExecutor({
				allowedCommands: ['echo'],
				maxOutputLength: 100000
			});

			expect(customExecutor).toBeDefined();
		});

		it('should accept custom working directory', () => {
			const customExecutor = new CliExecutor({
				allowedCommands: ['pwd'],
				workingDirectory: '/tmp'
			});

			expect(customExecutor).toBeDefined();
		});

		it('should require allowedCommands array', () => {
			expect(() => {
				new CliExecutor({
					allowedCommands: []
				});
			}).not.toThrow(); // Empty array is allowed but no commands will work
		});
	});
});
