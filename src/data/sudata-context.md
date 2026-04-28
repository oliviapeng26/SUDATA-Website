# SUDATA Knowledge Base

> **Purpose:** Canonical facts about Sydney University Data Analytics (SUDATA) for assistants and internal tools.  
> **Sources:** This repository (`src/pages`, `src/data/events.json`, `public/sudino.svg`) and the live site **https://sudata.com.au/** plus **https://usu.edu.au/clubs/sydney-uni-data-society/** (verified April 2026). A legacy/alternate public URL is **https://sudata.org/**.

---

## Society identity and naming

SUDATA is the **Sydney University Data Analytics** society—also referred to on official channels as **Sydney Uni Data Society** and **USYD Data Society**. It is the primary student community at the **University of Sydney** focused on data science, analytics, and data literacy across disciplines.

The society was established around **early 2020** and presents itself as a central hub for students who want to explore data, technology, and professional pathways while building friendships.

---

## Mission and data literacy

SUDATA’s public mission combines **technical depth** with **community**:

- **Data literacy and the information age:** Understanding data is framed as more than coursework—it is about staying well-informed in a complex, information-rich world (aligned with messaging on **sudata.com.au** and the **USU** club listing).
- **Inclusive learning:** Students from **any discipline** are welcome if they want to learn more about data; the society is explicitly interdisciplinary.
- **Theory and practice:** Internally, the society describes bridging **classroom theory** with **real-world impact** and building an environment where members feel they belong—a **hybrid** of academic programming, industry connection, and social community (see the About page in this codebase).

**Pillars** echoed across the website:

1. **The Hub** — Share and learn data-related skills (e.g. Python through to neural networks).
2. **The Collective** — Collaboration, friendships, and a welcoming peer network.
3. **The Blast** — High-energy experiences including **hackathons**, workshops, and social events.

---

## Mascot: Sudino

**Sudino** is SUDATA’s mascot: a **data-loving dinosaur** used in the society’s visual identity. On this site Sudino appears as the **favicon** and navigation branding (`/sudino.svg`). The mascot reinforces a friendly, approachable face for a technical society.

---

## Official links and social media

| Resource | URL |
|----------|-----|
| Primary website (2026) | https://sudata.com.au/ |
| Alternate / legacy | https://sudata.org/ |
| USU club page (membership) | https://usu.edu.au/clubs/sydney-uni-data-society/ |
| Instagram | https://www.instagram.com/usyd.sudata/ |

The homepage highlights **USU member** and **Instagram follower** counts as engagement metrics (exact numbers are dynamic and may be configured via environment or integrations in this project).

---

## Membership, USU, and FAQ

### How do I become a member?

**Official USU membership** for Sydney Uni Data Society is obtained through the **University of Sydney Union** club listing:

- Open **https://usu.edu.au/clubs/sydney-uni-data-society/** and follow the **USU** membership / club signup flow for **Sydney Uni Data Society**.

### Do I need to study data science?

**No.** The USU listing and **sudata.com.au** both state that students of **any discipline** may join, provided they are interested in learning about data.

### What does USU membership give me?

USU membership is the standard pathway for **officially affiliated** society membership and access to USU-linked benefits and club activities. For **current** terms, pricing, and entitlements, rely on the **USU** website at the time you join—not static copy.

### 2026 USU organisational transition (accuracy note)

As stated on the **USU** club page (April 2026): from **1 April 2026**, **USyd Student Union Ltd** operates services previously run by the **University of Sydney Union**. Existing membership benefits are to be **recognised until 30 June 2026** under transition arrangements; **USU Rewards** and **USU Ltd** membership have specific conditions described on **usu.edu.au**. When answering questions about membership benefits, defer to the latest USU legal/FAQ text.

### Subcommittee (Subcom) recruitment

The live **sudata.com.au** site (April 2026) advertises **Subcom** recruitment with:

- Application form: **https://forms.gle/1MQWKQtUChUzeNfS6**
- **Applications close 6 March 2026** (after this date, the site directs visitors to **Instagram** for the next round).

This matches the deadline logic in this repository’s `src/pages/index.astro`.

---

## Events, hackathons, and datathons

SUDATA runs **workshops**, **social events**, **industry-facing sessions**, and **competitive data events** including hackathon-style formats.

### Flagship competitive formats

- **USYD Datathon** — Described in this project’s `src/data/events.json` as a **multi-day datathon**: teams tackle **real-world data problems** with **prizes**, alongside **industry collaborators** (past listing includes partners such as **SUBAA**, **CBA**, **Westpac**, **Quantium**, and **Jane Street** for the 2025 calendar entry). Treat **year-on-year dates** as **announced each cycle** on **Instagram** and the events calendar.
- **Data-Hack** — A team-based hackathon focused on **real-world datasets**, **models**, and **pitching** to **industry and faculty judges**. The **2026** record in this repository’s calendar: **18 April 2026**, collaboration **SUDATA × Comm-STEM**, catering noted as food throughout the event; **venue/time** may be updated on official signup materials.

### Other recurring themes

Past and adjacent programming (verify dates on social/calendar each year) has included **bioinformatics**-oriented hackathon-style events promoted via **@usyd.sudata**—always confirm the **current** year’s name, date, and registration link.

### Where to find the latest event details

1. **Events page** on this Astro site (`/events`) backed by `src/data/events.json`.  
2. **https://sudata.com.au/** and **Instagram (@usyd.sudata)** for announcements not yet in the JSON.  
3. Signup links in the calendar (e.g. **Humanitix**, **Google Forms**) are authoritative for registration.

---

## Community and industry

SUDATA emphasises:

- **Social fabric** — Parties, casual meetups, study sessions, and inter-society collaborations.  
- **Industry synergy** — Networking with data and technology employers through dedicated events.  
- **The Forge (hackathons & labs)** — Intensive technical events from Python depth sessions to collaborative builds.

Community composition statistics and executive profiles are presented on the **About** page of this website.

---

## Technical note for RAG consumers

When this file is retrieved by keyword search, prefer **dated** statements (e.g. event dates, USU transition) from the **most recent** matching section and suggest users confirm on **sudata.com.au**, **USU**, or **Instagram** if the question is time-sensitive.
