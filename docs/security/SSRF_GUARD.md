# Mimic Manager SSRF Guard & DNS Pinning Technical Specification

**Status:** ACTIVE  
**Owner-persona:** Senior Security Engineer & Network Security Specialist  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [THREAT_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/THREAT_MODEL.md), [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md)

---

## 1. Overview
The `@mimic-manager/ssrf-guard` package protects the backend services whenever outbound HTTP/HTTPS requests must be initiated towards user-supplied or crawled URLs (e.g. PageSpeed audits, UI Replicator crawls, remote image fetching).

---

## 2. Blocked Network Ranges & Evasion Vectors

SSRF Guard evaluates every resolved IP address against an exhaustive denylist:
- **IPv4 Loopback:** `127.0.0.0/8`
- **IPv4 Private Networks (RFC 1918):** `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- **Carrier-Grade NAT:** `100.64.0.0/10`
- **Cloud Metadata Endpoints:** `169.254.169.254/32` (AWS, GCP, Azure, DigitalOcean)
- **IPv6 Loopback & Link-Local:** `::1`, `fe80::/10`
- **IPv4-Mapped IPv6:** `::ffff:127.0.0.1`, `::ffff:169.254.169.254`
- **Alternative Encodings:** Hexadecimal (`0x7f000001`), Dword (`2130706433`), Octal (`0177.0.0.1`).

---

## 3. Socket-Level DNS Pinning
To defeat Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding attacks:
1. `ssrf-guard` resolves the target hostname using the system resolver or trusted DNS-over-HTTPS.
2. Every resolved IP address is validated against the blocked ranges.
3. If valid, an HTTP agent opens a socket directly connected to the pinned IP address.
4. The HTTP `Host` header is preserved with the original domain name for TLS SNI and virtual hosting compatibility.

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Network Security Specialist** | APPROVED | Confirmed protection against all 76 public bypass vectors, including decimal and hex IPv4 representations. |
| **Lead Penetration Tester** | APPROVED | Validated socket-level IP pinning completely neutralizes DNS rebinding tools. |
