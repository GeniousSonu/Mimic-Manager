import net from 'node:net';

export interface IpValidationResult {
  allowed: boolean;
  normalizedIp?: string;
  reason?: string;
}

/**
 * Normalizes string representation of IPv4 (including octal, hex, dword representations)
 * to standard dotted-decimal string 'a.b.c.d', or returns null if invalid.
 */
export function normalizeIpv4(input: string): string | null {
  const trimmed = input.trim();

  // Check if it's a single integer representation (e.g., 2130706433)
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    if (!Number.isSafeInteger(num) || num < 0 || num > 0xffffffff) {
      return null;
    }
    const a = (num >>> 24) & 255;
    const b = (num >>> 16) & 255;
    const c = (num >>> 8) & 255;
    const d = num & 255;
    return `${a}.${b}.${c}.${d}`;
  }

  // Check if it's single hex integer (e.g., 0x7f000001)
  if (/^0x[0-9a-fA-F]+$/i.test(trimmed)) {
    const num = parseInt(trimmed, 16);
    if (isNaN(num) || num < 0 || num > 0xffffffff) {
      return null;
    }
    const a = (num >>> 24) & 255;
    const b = (num >>> 16) & 255;
    const c = (num >>> 8) & 255;
    const d = num & 255;
    return `${a}.${b}.${c}.${d}`;
  }

  const parts = trimmed.split('.');
  if (parts.length > 4 || parts.length === 0) {
    return null;
  }

  const octets: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    let val: number;

    if (/^0x[0-9a-fA-F]+$/i.test(part)) {
      val = parseInt(part, 16);
    } else if (/^0[0-7]+$/.test(part)) {
      val = parseInt(part, 8);
    } else if (/^\d+$/.test(part)) {
      val = parseInt(part, 10);
    } else {
      return null;
    }

    if (isNaN(val) || val < 0) return null;

    if (i < parts.length - 1) {
      if (val > 255) return null;
      octets.push(val);
    } else {
      // Last part can fill remaining bytes in classful notation (e.g. 127.1 -> 127.0.0.1)
      const remainingBytes = 4 - octets.length;
      if (remainingBytes === 1) {
        if (val > 255) return null;
        octets.push(val);
      } else if (remainingBytes === 2) {
        if (val > 0xffff) return null;
        octets.push((val >>> 8) & 255);
        octets.push(val & 255);
      } else if (remainingBytes === 3) {
        if (val > 0xffffff) return null;
        octets.push((val >>> 16) & 255);
        octets.push((val >>> 8) & 255);
        octets.push(val & 255);
      } else if (remainingBytes === 4) {
        if (val > 0xffffffff) return null;
        octets.push((val >>> 24) & 255);
        octets.push((val >>> 16) & 255);
        octets.push((val >>> 8) & 255);
        octets.push(val & 255);
      }
    }
  }

  if (octets.length !== 4) return null;
  return octets.join('.');
}

export function isPrivateOrRestrictedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed is restricted
  }

  const [a, b, c, d] = parts as [number, number, number, number];

  // 0.0.0.0/8 (Current network / default)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private RFC1918)
  if (a === 10) return true;

  // 100.64.0.0/10 (Carrier-grade NAT RFC6598)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 (Loopback RFC1122)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-local & Cloud Metadata RFC3927)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private RFC1918)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments RFC6890)
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1 RFC5737)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.168.0.0/16 (Private RFC1918)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Benchmarking RFC2544)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2 RFC5737)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3 RFC5737)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast RFC5771)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved RFC1112)
  if (a >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

export function isPrivateOrRestrictedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  // Check IPv4-mapped IPv6 (::ffff:127.0.0.1, ::ffff:7f00:1, etc.)
  if (lower.startsWith('::ffff:') || lower.includes(':ffff:')) {
    const lastPart = lower.split(':').pop() || '';
    if (net.isIPv4(lastPart)) {
      return isPrivateOrRestrictedIpv4(lastPart);
    }
  }

  // :: (unspecified)
  if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;

  // ::1 (loopback)
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;

  // fc00::/7 (Unique local address RFC4193)
  if (/^f[cd][0-9a-f]{2}:/i.test(lower)) return true;

  // fe80::/10 (Link-local unicast RFC4291)
  if (/^fe[89ab][0-9a-f]:/i.test(lower)) return true;

  // ff00::/8 (Multicast RFC4291)
  if (/^ff[0-9a-f]{2}:/i.test(lower)) return true;

  // 2001:db8::/32 (Documentation RFC3849)
  if (lower.startsWith('2001:db8:')) return true;

  // 64:ff9b::/96 (IPv4/IPv6 translation RFC6052)
  if (lower.startsWith('64:ff9b:')) return true;

  // 100::/64 (Discard-only RFC6666)
  if (lower.startsWith('100:')) return true;

  return false;
}

export function validateIpAddress(rawIp: string, allowPrivate = false): IpValidationResult {
  if (allowPrivate) {
    return { allowed: true, normalizedIp: rawIp };
  }

  // Try IPv4 normalization first (handles hex, octal, dword)
  const normalizedV4 = normalizeIpv4(rawIp);
  if (normalizedV4 && net.isIPv4(normalizedV4)) {
    if (isPrivateOrRestrictedIpv4(normalizedV4)) {
      return {
        allowed: false,
        normalizedIp: normalizedV4,
        reason: `IPv4 address ${normalizedV4} is in a reserved/private/loopback range`,
      };
    }
    return { allowed: true, normalizedIp: normalizedV4 };
  }

  // Try IPv6
  if (net.isIPv6(rawIp)) {
    if (isPrivateOrRestrictedIpv6(rawIp)) {
      return {
        allowed: false,
        normalizedIp: rawIp,
        reason: `IPv6 address ${rawIp} is in a reserved/private/loopback range`,
      };
    }
    return { allowed: true, normalizedIp: rawIp };
  }

  return {
    allowed: false,
    reason: `Invalid IP address format: ${rawIp}`,
  };
}
