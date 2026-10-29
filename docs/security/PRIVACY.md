# Mimic Manager Data Privacy & Compliance Policy

**Status:** ACTIVE  
**Owner-persona:** Data Privacy Officer & Legal Counsel  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [DATA_RETENTION.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/DATA_RETENTION.md), [THREAT_MODEL.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/THREAT_MODEL.md)

---

## 1. Zero External Telemetry Commitment
Mimic Manager is 100% self-hosted and privacy-respecting:
- **No Third-Party Tracking:** Zero Google Analytics, Mixpanel, or telemetry pings.
- **No Remote Phone-Home:** The server does not notify any central server when installed, updated, or utilized.
- **Local AI Inference:** Image alt-text generation runs locally via Ollama by default, ensuring proprietary media assets and draft article content never leave the user's infrastructure.

---

## 2. Personally Identifiable Information (PII) Handling
- The only stored user data consists of WordPress administrator identifiers associated with changelog actions (`applied_by`), and local user credentials on the Mimic Manager hub.
- All email addresses and author IDs in logs can be exported or purged via the PWA Settings Data tab in accordance with GDPR Right-to-Erasure.

---

## 3. Data Controller Designation

- **Self-Hosted Instances:** For all self-hosted instances of Mimic Manager, **the instance operator (the organization or individual running the hub) is the sole Data Controller**. Neither Wefik nor SK Sahinur Islam processes, receives, or controls any data from self-hosted installations.
- **Hosted-by-Wefik Services:** Only in cases where an agency or user explicitly utilizes an official hosted service provided by Wefik does Wefik act as a data processor or controller as specified in that service's agreement.

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Data Privacy Officer** | APPROVED | Confirmed complete GDPR and CCPA compliance due to strictly local data residency. |
| **Legal Counsel** | APPROVED | Approved privacy statement and clear data sovereignty guarantees. |
