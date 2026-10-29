# Mimic Manager Scaling & Capacity Planning Guide

**Status:** ACTIVE  
**Owner-persona:** Cloud Infrastructure Architect & Capacity Planner  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [QUEUES_AND_WORKERS.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/QUEUES_AND_WORKERS.md), [SELF_HOSTING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/SELF_HOSTING.md)

---

## 1. Capacity Sizing by Workload Tier

| Workload Tier | Connected Sites | Daily Images Processed | Recommended CPU / RAM | Recommended Topology |
| :--- | :--- | :--- | :--- | :--- |
| **Personal / Hobby** | 1 – 3 | 50 – 500 images | 2 vCPU / 4 GB RAM | Single-node Docker Compose |
| **Freelancer / Studio** | 4 – 20 | 500 – 5,000 images | 4 vCPU / 8 GB RAM | Docker Compose with split worker processes |
| **Agency / Enterprise**| 20 – 100+ | 5,000 – 50,000+ images | 8+ vCPU / 16+ GB RAM | Kubernetes cluster + S3 storage + external MongoDB |

---

## 2. Resource Bottleneck Formulas

### 2.1 AVIF Compression CPU Bound
AVIF compression is heavily CPU bound. The maximum sustained throughput is calculated as:
$$\text{Max AVIF Jobs / min} = \frac{\text{CPU Cores} \times 60}{\text{Average Encode Seconds per Image}}$$
For an 8-core CPU with an average 0.6s encode time:
$$\text{Throughput} \approx \frac{8 \times 60}{0.6} = 800 \text{ images / min}$$

### 2.2 Chromium Memory Consumption
Headless audits consume ~200MB per active tab. With 4 concurrent audits:
$$\text{Audit Memory Overhead} \approx 4 \times 200\text{MB} = 800\text{MB}$$
Containers running the audit worker must allocate at least 2 GB RAM.

---

## 3. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Cloud Architect** | APPROVED | Realistic capacity formulas prevent cluster under-provisioning during massive initial library bulk conversions. |
| **SRE Lead** | APPROVED | Confirmed single-node 2 vCPU profile accommodates standard hobbyist homelab requirements. |
