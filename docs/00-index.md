# OptiForge Documentation Index & Reading Order

**Status:** ACTIVE  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v0.1.0-alpha  
**Related-docs:** [AGENTS.md](file:///home/dayshift/Pictures/Mimic%20Manager/AGENTS.md), [README.md](file:///home/dayshift/Pictures/Mimic%20Manager/README.md)

---

## 1. Documentation Structure & Map

```
/docs
├── 00-index.md                   <-- You are here
├── product/                      Product strategy, requirements & personas
│   ├── PRD.md                    Product Requirements Document
│   ├── PERSONAS_AND_JTBD.md      5 Personas & Jobs-To-Be-Done
│   ├── COMPETITIVE_ANALYSIS.md   Comprehensive teardown & differentiation
│   ├── USER_STORIES.md           Acceptance criteria (Given/When/Then)
│   ├── ROADMAP.md                Phase horizons & milestones
│   ├── GLOSSARY.md               Domain terms & definitions
│   ├── SUCCESS_METRICS.md        Local activation & performance targets
│   └── PRICING_AND_SUSTAINABILITY.md FOSS donation & stewardship model
├── architecture/                 System architecture & technical blueprints
│   ├── ARCHITECTURE.md           C4 diagrams, container & component designs
│   ├── DATA_MODEL.md             Schemas, collections, invariants & DDL
│   ├── API.md                    OpenAPI 3.1 & endpoint specifications
│   ├── EVENTS_AND_WEBHOOKS.md    Signed webhook protocol & event taxonomy
│   ├── QUEUES_AND_WORKERS.md     BullMQ queues, retry backoff & DLQ
│   ├── STORAGE.md                Object storage drivers & TTL lifecycle
│   ├── WORDPRESS_PLUGIN.md       Plugin architecture, hooks & circuit breaker
│   ├── FIX_REGISTRY.md           Tiered speed fix registry definitions
│   ├── FIX_AUTHORING_GUIDE.md    Recipe for creating new speed fixes
│   ├── CONNECTOR_AUTHORING_GUIDE.md Building new CMS connectors
│   ├── REPLICATOR_IR.md          Multi-viewport IR schema & Gutenberg adapter
│   ├── FILE_MANAGER_DESIGN.md    Jailed filesystem design & Monaco integration
│   ├── AI_PROVIDERS.md           Ollama, OpenAI-compatible & Heuristic drivers
│   ├── SEO_ADAPTERS.md           Yoast, Rank Math, SEOPress, AIOSEO adapters
│   ├── OBSERVABILITY.md          Logging, metrics & distributed tracing
│   ├── PERFORMANCE_BUDGETS.md    API & frontend latency/memory limits
│   ├── SCALING_AND_CAPACITY.md   Worker pool sizing & resource formulas
│   ├── COMPATIBILITY_MATRIX.md   PHP, WP, Node, browser compatibility
│   └── adr/                      Architecture Decision Records
├── security/                     Threat modeling, compliance & defense
│   ├── THREAT_MODEL.md           STRIDE threat model & abuse cases
│   ├── SECURITY_ARCHITECTURE.md  Defense-in-depth security principles
│   ├── SSRF_GUARD.md             DNS pinning & IP validation architecture
│   ├── FILE_MANAGER_SECURITY.md  Path jail & AST syntax check controls
│   ├── PRIVACY.md                GDPR compliance & minimal retention
│   ├── DATA_RETENTION.md         TTL policies & purge jobs
│   ├── SECURITY_REVIEW.md        Penetration testing persona report
│   ├── INCIDENT_RESPONSE.md      Vulnerability disclosure & response
│   └── SUPPLY_CHAIN.md           Dependency auditing & SBOM generation
├── design/                       UI/UX Design System & Experience Specs
│   ├── DESIGN.md                 Design System Master Document
│   ├── DESIGN_PRINCIPLES.md      Calm confidence & pro-tool principles
│   ├── BRAND.md                  Visual identity, logo, typography & voice
│   ├── INFORMATION_ARCHITECTURE.md Sitemap & navigation models
│   ├── UX_SPEC.md                Screen layouts, workflows & states
│   ├── SCREEN_INVENTORY.md       Comprehensive screen inventory
│   ├── COMPONENTS.md             Radix/Tailwind component specifications
│   ├── TOKENS.md                 Design token definitions (color, spacing)
│   ├── MOTION.md                 Choreography, spring presets & reduced motion
│   ├── ICONOGRAPHY.md            Lucide integration & filetype icon rules
│   ├── CONTENT_STYLE_GUIDE.md    UX writing, microcopy & error formulas
│   ├── ACCESSIBILITY.md          WCAG 2.2 AA compliance standards
│   ├── I18N_AND_RTL.md           Localization & bidirectional layout rules
│   ├── RESPONSIVE_AND_PWA_UX.md  Mobile breakpoints, sheets & PWA shell
│   ├── WP_ADMIN_INTEGRATION_UX.md Shadow DOM integration with wp-admin
│   ├── DESIGN_QA_CHECKLIST.md    Pre-release design verification criteria
│   ├── DESIGN_CRITIQUE_LOG.md    Hostile design director critique scores
│   ├── USABILITY_TEST_PLAN.md    Simulated & human usability test scripts
│   └── prototypes/               Wireframes & HTML interaction prototypes
├── engineering/                  Engineering standards, CI & release
│   ├── DEVELOPMENT.md            Local setup, toolchain & workflows
│   ├── CODING_STANDARDS.md       Strict TypeScript, PHP & CSS guidelines
│   ├── TESTING.md                Test pyramid & execution instructions
│   ├── CI_CD.md                  GitHub Actions pipeline configuration
│   ├── RELEASE.md                Semantic release, changelog & packaging
│   ├── DEFINITION_OF_DONE.md     Criteria for completed work items
│   └── TRACEABILITY.md           Requirements to test traceability matrix
├── operations/                   Runbooks, deployment & hosting
│   ├── SELF_HOSTING.md           Production Docker Compose setup
│   ├── CONFIGURATION_REFERENCE.md Environment variable dictionary
│   ├── RUNBOOKS.md               Operational recovery runbooks
│   ├── BACKUP_AND_RESTORE.md     Disaster recovery procedures
│   ├── UPGRADE_AND_MIGRATION.md  Database migrations & zero-downtime upgrades
│   ├── TROUBLESHOOTING.md        Common errors & diagnostic procedures
│   ├── TWA_AND_PWA_GUIDE.md      Android TWA packaging & iOS PWA setup
│   └── WPORG_SUBMISSION_CHECKLIST.md WordPress.org guidelines compliance
└── project/                      Living project logs
    ├── PLAN.md                   Master roadmap & execution tasks
    ├── DECISIONS.md              ADR log & phase gate approvals
    ├── RISKS.md                  Comprehensive threat & risk register
    ├── KNOWN_GAPS.md             Intentional boundaries & deferred items
    ├── TEST_REPORT.md            Live test execution logs & evidence
    └── ENVIRONMENT.md            System inventory & installed tools
```

---

## 2. Reading Order per Role

### For Product Managers & Stakeholders
1. [`docs/product/PRD.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PRD.md)
2. [`docs/product/PERSONAS_AND_JTBD.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PERSONAS_AND_JTBD.md)
3. [`docs/product/COMPETITIVE_ANALYSIS.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/COMPETITIVE_ANALYSIS.md)
4. [`docs/product/ROADMAP.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/ROADMAP.md)

### For System Architects & Engineers
1. [`docs/architecture/ARCHITECTURE.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md)
2. [`docs/architecture/DATA_MODEL.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/DATA_MODEL.md)
3. [`docs/architecture/API.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/API.md)
4. [`docs/architecture/FIX_REGISTRY.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/FIX_REGISTRY.md)
5. [`docs/engineering/TESTING.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/TESTING.md)

### For Designers & Frontend Engineers
1. [`docs/design/DESIGN.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/DESIGN.md)
2. [`docs/design/TOKENS.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/TOKENS.md)
3. [`docs/design/COMPONENTS.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/COMPONENTS.md)
4. [`docs/design/UX_SPEC.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/UX_SPEC.md)

### For Security Officers & Auditors
1. [`docs/security/THREAT_MODEL.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/THREAT_MODEL.md)
2. [`docs/security/SECURITY_ARCHITECTURE.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/SECURITY_ARCHITECTURE.md)
3. [`docs/security/SSRF_GUARD.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/SSRF_GUARD.md)
4. [`docs/security/FILE_MANAGER_SECURITY.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/FILE_MANAGER_SECURITY.md)

### For DevOps & Site Reliability Engineers
1. [`docs/operations/SELF_HOSTING.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/SELF_HOSTING.md)
2. [`docs/operations/CONFIGURATION_REFERENCE.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/CONFIGURATION_REFERENCE.md)
3. [`docs/operations/RUNBOOKS.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/RUNBOOKS.md)
4. [`docs/operations/BACKUP_AND_RESTORE.md`](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/BACKUP_AND_RESTORE.md)
