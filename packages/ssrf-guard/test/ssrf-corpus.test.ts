import { describe, it, expect } from 'vitest';
import { SsrfGuard, SsrfError } from '../src/ssrf-guard.js';
import { validateIpAddress } from '../src/ip-checker.js';

describe('SSRF Guard Attack Corpus (≥ 60 Malicious Bypass Vectors)', () => {
  const guard = new SsrfGuard({ allowPrivate: false });

  const maliciousUrls = [
    // 1-4: Standard loopback IPv4
    'http://127.0.0.1/',
    'http://127.0.0.2/admin',
    'http://127.255.255.255/',
    'http://127.1/',

    // 5-6: Zero / default network
    'http://0.0.0.0/',
    'http://0/',

    // 7-10: Link-local & Cloud Metadata (AWS/GCP/Azure)
    'http://169.254.169.254/latest/meta-data/',
    'http://169.254.169.254/computeMetadata/v1/',
    'http://169.254.0.1/',
    'http://169.254.255.254/',

    // 11-16: RFC1918 Private Ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
    'http://10.0.0.1/',
    'http://10.255.255.255/',
    'http://10.10.10.10:8080/',
    'http://172.16.0.1/',
    'http://172.31.255.255/',
    'http://192.168.0.1/',
    'http://192.168.1.1/',
    'http://192.168.254.254/',

    // 19-20: Carrier-Grade NAT (100.64.0.0/10)
    'http://100.64.0.1/',
    'http://100.127.255.255/',

    // 21-25: Multicast, Broadcast, Reserved
    'http://224.0.0.1/',
    'http://239.255.255.250/',
    'http://240.0.0.1/',
    'http://255.255.255.255/',
    'http://192.0.2.1/', // TEST-NET-1
    'http://198.51.100.1/', // TEST-NET-2
    'http://203.0.113.1/', // TEST-NET-3

    // 28-32: Octal representation bypasses
    'http://0177.0.0.1/',
    'http://0177.00.00.01/',
    'http://017700000001/',
    'http://012.0.0.1/', // 10.0.0.1
    'http://0300.0250.0.1/', // 192.168.0.1

    // 33-38: Hexadecimal representation bypasses
    'http://0x7f000001/',
    'http://0x7f.0.0.1/',
    'http://0x7f.0x0.0x0.0x1/',
    'http://0x0a000001/', // 10.0.0.1
    'http://0xc0a80001/', // 192.168.0.1
    'http://0xa9fea9fe/', // 169.254.169.254

    // 39-42: Decimal dword bypasses
    'http://2130706433/', // 127.0.0.1
    'http://2852039166/', // 169.254.169.254
    'http://167772161/', // 10.0.0.1
    'http://3232235521/', // 192.168.0.1

    // 43-48: IPv6 Loopback, Unspecified, Unique-Local, Link-Local
    'http://[::1]/',
    'http://[::]/',
    'http://[0:0:0:0:0:0:0:1]/',
    'http://[fc00::1]/',
    'http://[fd00::1]/',
    'http://[fe80::1]/',
    'http://[ff02::1]/',

    // 50-53: IPv4-mapped IPv6 bypasses
    'http://[::ffff:127.0.0.1]/',
    'http://[::ffff:169.254.169.254]/',
    'http://[::ffff:10.0.0.1]/',
    'http://[::ffff:192.168.1.1]/',

    // 54-59: Scheme bypass attempts
    'file:///etc/passwd',
    'gopher://127.0.0.1:6379/_INFO',
    'dict://127.0.0.1:11211/stats',
    'ftp://127.0.0.1/',
    'data:text/html,<script>alert(1)</script>',
    'javascript:alert(1)',

    // 60-66: Disallowed Hostnames & TLDs
    'http://localhost/',
    'http://localhost:8080/metrics',
    'http://localhost.localdomain/',
    'http://vault.internal/',
    'http://printer.local/',
    'http://gateway.lan/',
    'http://nas.home/',
    'http://darknet.onion/',

    // 68-71: Sensitive / Disallowed Ports
    'http://example.com:22/',
    'http://example.com:25/',
    'http://example.com:6379/',
    'http://example.com:27017/',

    // 72-73: Embedded Credentials
    'http://admin:password@example.com/',
    'http://root@127.0.0.1/',
  ];

  it(`contains at least 60 bypass attempts in test corpus (actual: ${maliciousUrls.length})`, () => {
    expect(maliciousUrls.length).toBeGreaterThanOrEqual(60);
  });

  maliciousUrls.forEach((url, index) => {
    it(`Corpus Vector #${index + 1}: blocks ${url}`, async () => {
      await expect(guard.validateAndResolve(url)).rejects.toThrow(SsrfError);
    });
  });

  it('allows safe public hostnames with standard ports', () => {
    const parsed = guard.validateUrlStructure('https://example.com/test');
    expect(parsed.hostname).toBe('example.com');
  });

  it('allows private target when explicitly configured (ALLOW_PRIVATE_TARGETS=true)', () => {
    const permissiveGuard = new SsrfGuard({ allowPrivate: true });
    const parsed = permissiveGuard.validateUrlStructure('http://127.0.0.1:8080/health');
    expect(parsed.hostname).toBe('127.0.0.1');

    const ipCheck = validateIpAddress('127.0.0.1', true);
    expect(ipCheck.allowed).toBe(true);
  });
});
