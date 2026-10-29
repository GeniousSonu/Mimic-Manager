<?php

declare(strict_types=1);

namespace OptiForge\FileManager;

use ParseError;
use Throwable;

/**
 * OptiForge PHP Syntax & AST Linter.
 * 
 * Pre-screens PHP code before saving to disk to prevent syntax errors and WSOD.
 */
class PhpAstLinter
{
    /**
     * Inspects PHP source code for syntax validity.
     * 
     * @return array{valid: bool, error: ?string, line: ?int}
     */
    public function lintSource(string $code): array
    {
        // 1. First pass: Tokenizer parse check
        try {
            $tokens = token_get_all($code, TOKEN_PARSE);
        } catch (ParseError $e) {
            return [
                'valid' => false,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ];
        } catch (Throwable $e) {
            return [
                'valid' => false,
                'error' => $e->getMessage(),
                'line' => null,
            ];
        }

        // 2. Second pass: Try php -l syntax check using a temporary descriptor if available
        if (function_exists('proc_open')) {
            $descriptors = [
                0 => ['pipe', 'r'], // stdin
                1 => ['pipe', 'w'], // stdout
                2 => ['pipe', 'w'], // stderr
            ];

            $phpBinary = PHP_BINARY ?: 'php';
            $process = @proc_open("{$phpBinary} -l", $descriptors, $pipes);

            if (is_resource($process)) {
                fwrite($pipes[0], $code);
                fclose($pipes[0]);

                $stdout = stream_get_contents($pipes[1]);
                $stderr = stream_get_contents($pipes[2]);
                fclose($pipes[1]);
                fclose($pipes[2]);

                $exitCode = proc_close($process);

                if ($exitCode !== 0) {
                    $output = trim((string) $stdout . "\n" . (string) $stderr);
                    $line = null;
                    if (preg_match('/on line (\d+)/i', $output, $m)) {
                        $line = (int) $m[1];
                    }

                    return [
                        'valid' => false,
                        'error' => $output,
                        'line' => $line,
                    ];
                }
            }
        }

        return [
            'valid' => true,
            'error' => null,
            'line' => null,
        ];
    }
}
