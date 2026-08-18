# Marshmallow Agile Workshop Web App --- Product Requirements Document

Version: 0.1\
Status: Vibe Coding Build Specification\
Primary language: Traditional Chinese (zh-TW)

------------------------------------------------------------------------

# 0. Instructions to AI Coding Agent

This PRD is an authoritative implementation specification for an
instructor-led Agile learning workshop web application.

Implementation rules:

1.  Preserve the workshop learning sequence. Do not merge, remove,
    reorder, or automatically skip screens unless this PRD explicitly
    permits it.
2.  Projection screens and Team screens are different experiences. Do
    not mirror the projection screen onto Team devices except where
    explicitly specified.
3.  The facilitator controls teaching pace. A timer reaching zero may
    freeze an activity, but must not automatically advance the
    facilitator into the next teaching screen.
4.  During teaching/debrief screens, Team devices enter Attention Mode
    and direct participants to the projection screen.
5.  Round 1 must not reveal Agile terminology, MVP, iteration,
    increment, Working Product, or future Round 2 mechanics.
6.  Round 2 challenges are sequential and hidden. A team may see only
    its current challenge.
7.  A Version is Done only after the team has:
    -   produced a working physical product satisfying the challenge
        acceptance criteria;
    -   self-validated the acceptance criteria;
    -   completed the required Version Record.
8.  Documentation is part of Done. The intended learning is Document
    Late, not "documentation after Done."
9.  Use the supplied image assets. Do not generate substitute images.
10. The app must remain usable if connectivity temporarily fails. Team
    progress must be saved locally first and synchronized when
    connectivity returns.
11. Prefer simple, robust workshop operation over feature richness.
12. Exact workshop copy defined in this PRD should be implemented as
    content/configuration rather than scattered hard-coded strings where
    practical.

------------------------------------------------------------------------

# 1. Product Vision

Build an instructor-led workshop web application that turns the
Marshmallow Challenge into an experiential Agile learning simulation.

The system must support:

-   instructor projection as the main workshop presentation;
-   one Team Recorder device per team;
-   a 6-minute Round 1 that exposes participants' default work habits;
-   a 10-minute Round 2 based on sequential market challenges;
-   incremental product delivery;
-   Definition of Done;
-   necessary documentation as part of Done;
-   real-time collection of team delivery data;
-   evidence-based debrief;
-   connection of the experience to the four Agile Manifesto values.

The experience model is:

**Experience → Evidence → Reflection → Concept**

The system must not teach the Agile answer before participants
experience the problem.

------------------------------------------------------------------------

# 2. Core Learning Objectives

Participants should be able to experience and explain:

1.  Busy activity is not the same as product progress.
2.  A working product is the primary evidence of progress.
3.  Delivering a simple usable version early reduces late integration
    risk.
4.  Product development can proceed incrementally through multiple
    usable versions.
5.  Necessary documentation can be created near the point where facts
    are known and still remain part of Definition of Done.
6.  Requirements can emerge after customers see a working product.
7.  Competitive capability includes the speed of responding to new
    market feedback.
8.  Team interaction and integration matter more than merely keeping
    every individual busy.
9.  Lean thinking includes creating value with fewer unnecessary
    resources.
10. Agile success metrics differ from a narrow interpretation of project
    success.

------------------------------------------------------------------------

# 3. Experience Design Principles

## 3.1 Experience Before Explanation

Do not reveal the intended Agile behavior during Round 1.

## 3.2 Working Product as Evidence

The workshop repeatedly asks what usable Version exists now, rather than
asking for percentage-complete plans or partially completed components.

## 3.3 One Market Challenge at a Time

Future challenges remain hidden until the current Version is Done.

## 3.4 Facilitator Controls Teaching Pace

All learning/debrief transitions are manually advanced by the
facilitator.

## 3.5 Team Device Minimization

Only one Recorder per team needs to operate a device. Other team members
should interact with each other and the physical materials.

## 3.6 Documentation Is Part of Done

Round 2 follows:

**Challenge → Build → Validate → Document → Done → Next Market
Feedback**

## 3.7 Simple Frontstage, Rich Backstage

Team interaction must remain minimal. The system may collect and
calculate richer data automatically.

------------------------------------------------------------------------

# 4. User Roles

## 4.1 Facilitator

Uses: - facilitator console; - projection display.

Can: - create a workshop; - open/close lobby; - start/pause/resume/end
timers; - manually advance/return through teaching screens; - freeze
activities; - see team status and synchronization state; - show/hide
result dashboards; - reset a workshop with explicit confirmation.

## 4.2 Team Recorder

One participant per team.

Can: - join workshop; - create/select team identity; - see current team
challenge; - self-check acceptance criteria; - write Version Record; -
submit Complete Version; - continue working offline temporarily.

## 4.3 Participant

No account or device interaction is required. Participants follow the
projection and collaborate physically with their team.

------------------------------------------------------------------------

# 5. Workshop State Machine

``` text
SETUP
  ↓
LOBBY
  ↓
ROUND_1_BRIEFING
  ↓
ROUND_1_ACTIVE
  ↓
ROUND_1_FROZEN
  ↓
DEBRIEF_1
  ↓
ITERATION_LEARNING
  ↓
ROUND_2_BRIEFING
  ↓
ROUND_2_ACTIVE
  ↓
ROUND_2_FROZEN
  ↓
RESULTS
  ↓
SUCCESS_DEBRIEF
  ↓
AGILE_MANIFESTO_LEARNING
  ↓
CLOSING
  ↓
COMPLETED
```

Rules:

-   Timer expiry changes an ACTIVE state to FROZEN.
-   Timer expiry does not advance the Projection screen beyond the STOP
    screen.
-   Facilitator manually advances all teaching states.
-   Team devices show Attention Mode during teaching states.
-   Teams progress independently through Challenge 1--10 during
    ROUND_2_ACTIVE.

------------------------------------------------------------------------

# 6. Asset Specification

Expected assets:

``` text
/public/assets/workshop/
  materials.png
  outcome.png
  manifesto1.png
  manifesto2.png
  manifesto3.png
  manifesto4.png
```

If the actual supplied filenames use `menifesto1.png`--`menifesto4.png`,
use the actual filenames without silently renaming them.

## 6.1 materials.png

Purpose: show the physical materials used in the challenge.

Primary use: P03.

## 6.2 outcome.png

Purpose: illustrate what qualifies as a standing outcome.

Important: if this image exposes a specific construction pattern that
could anchor teams, do not show it before Round 1. In that case, use it
first on P07 when defining Working Product.

## 6.3 manifesto1.png--manifesto4.png

-   Portrait orientation, approximately A4 aspect ratio.
-   Projection-only learning assets.
-   `object-fit: contain`.
-   Never crop.
-   Never stretch.
-   Use identical bounding boxes.
-   Maximum visual height approximately 75--82vh.
-   Vertical center alignment.

Manifesto learning pages use a 16:9 two-column layout:

-   left 35--40%: portrait manifesto asset;
-   right 60--65%: workshop-specific learning content.

------------------------------------------------------------------------

# 7. Global Projection Requirements

Target primary viewport: 16:9 projector / large display.

Requirements:

-   No critical projection page should require scrolling at 1920×1080.
-   Primary headline must be readable from the back of a training room.
-   Timers must be visually dominant.
-   Avoid dense paragraphs.
-   Teaching reveals should support facilitator-paced progressive
    disclosure.
-   A facilitator-only control layer must not appear on the public
    projection output.
-   Full-screen projection mode should be supported.

Global facilitator navigation:

-   Previous
-   Next
-   Pause/Resume where relevant
-   End Round where relevant
-   Open Facilitator Console
-   Full Screen

------------------------------------------------------------------------

# 8. Global Team Requirements

Target devices:

-   mobile portrait;
-   tablet;
-   laptop.

Requirements:

-   no account/password requirement for participants;
-   one Team Recorder per team;
-   touch targets suitable for mobile;
-   challenge screens should be readable without horizontal scrolling;
-   save drafts locally;
-   display synchronization status unobtrusively;
-   never block physical workshop progress solely because cloud
    synchronization is unavailable.

Sync indicators:

-   Synced
-   Saving locally
-   Waiting for connection
-   Sync error --- retrying

------------------------------------------------------------------------

# 9. Projection Screen Specifications

## P01 --- Welcome / Join

Audience: Whole class\
State: LOBBY\
Purpose: Let teams join the workshop.

Content:

**MARSHMALLOW CHALLENGE**

-   QR code
-   Workshop Code
-   `{joinedTeamCount} Teams Joined`

Behavior:

-   Team count updates in near real time.
-   QR code points to the current workshop join URL.
-   Facilitator manually advances after teams are ready.

Team state: T01/T02.

------------------------------------------------------------------------

## P02 --- The Challenge

State: ROUND_1_BRIEFING\
Purpose: Introduce the physical objective without revealing Agile
concepts.

Progressive reveals:

1.  **THE MARSHMALLOW CHALLENGE**
2.  使用提供的材料，建造一個「最高」的獨立結構。
3.  完整的棉花糖必須放在結構最高處。
4.  結構最後必須能夠自行站立。

Constraints:

-   Do not display Agile terminology.
-   Do not mention iteration, MVP, Version, Working Product, or Round 2.

Asset: - `outcome.png` only if it does not reveal a construction
solution. Otherwise defer to P07.

------------------------------------------------------------------------

## P03 --- Materials

Purpose: Explain available materials.

Asset: - `materials.png`

Content should list the actual workshop materials configured by
facilitator. Default:

-   20 根義大利麵
-   膠帶
-   棉線
-   1 顆棉花糖

Do not invent additional materials.

------------------------------------------------------------------------

## P04 --- Ready?

Purpose: Prepare Round 1.

Content:

**Your Goal**

**Build the Tallest Structure**

**6 Minutes**

Primary facilitator action:

**Start Round 1**

Start action: - sets Round 1 started_at; - starts authoritative Round 1
timer; - changes state to ROUND_1_ACTIVE; - opens P05 and T03.

------------------------------------------------------------------------

## P05 --- Round 1 Timer

State: ROUND_1_ACTIVE

Content:

**MARSHMALLOW CHALLENGE**

Large authoritative countdown:

**05:59**

Supporting text:

**Build the Tallest Structure**

Rules: - no Agile hints; - no milestones; - no Version count; - no team
ranking.

Timer: - default 6 minutes; - configurable before workshop; -
facilitator may pause/resume; - at zero, state becomes ROUND_1_FROZEN
and P06 is displayed.

------------------------------------------------------------------------

## P06 --- STOP

State: ROUND_1_FROZEN

Content:

**STOP**

**Hands Off.**

Behavior: - Round 1 timer stops permanently. - T03 changes to T04. - Do
not automatically advance to P07. - Facilitator presses Next.

------------------------------------------------------------------------

## P07 --- Do We Have a Working Product?

Purpose: Create first learning tension.

Initial content:

**現在有多少組，已經有一個真正可以使用的產品？**

Reveal:

**可以自行站立 + 棉花糖位於頂端**

If appropriate, display `outcome.png` here.

Facilitator input: - number of teams currently satisfying the condition.

Display: `{workingTeamCount} / {totalTeams} Teams`

This count is workshop evidence, not a team ranking.

------------------------------------------------------------------------

## P08 --- What Were You Doing?

Content:

**如果還沒有 Working Product：**

**剛才六分鐘，你們在做什麼？**

No answer list is shown initially.

Facilitator discusses participant responses verbally.

Optional reveal after discussion:

-   討論
-   規劃
-   設計
-   分工
-   製作零件
-   嘗試不同方法

------------------------------------------------------------------------

## P09 --- Activity vs Progress

Progressive reveal:

1.  **Everyone was busy.**
2.  **But did we have a product?**
3.  **Activity ≠ Progress**
4.  **Working Product = Evidence of Progress**

Purpose: Distinguish utilization/activity from actual usable product
progress.

------------------------------------------------------------------------

## P10 --- Big-Bang Development

Display a simple process visualization:

``` text
PLAN → DESIGN → BUILD → INTEGRATE → TEST
                                  ↓
                               Product
```

Question:

**如果最後才發現站不起來呢？**

Purpose: Expose late integration/validation risk.

------------------------------------------------------------------------

## P11 --- Iterative Development

Display:

``` text
V1 → V2 → V3 → V4 → V5
↑     ↑     ↑     ↑
Test  Test  Test  Test
```

Core copy:

**先做出最簡單能用的版本，再一步一步讓它變得更好。**

Purpose: Introduce iterative/incremental behavior before Round 2.

------------------------------------------------------------------------

## P12 --- Less Time

Progressive reveal:

1.  第一輪你們有 6 分鐘。
2.  第二輪......
3.  **只有 10 分鐘。**
4.  **But the rules have changed.**

Purpose: Create tension: less total remaining time but a different work
system.

------------------------------------------------------------------------

## P13 --- New Way of Working

Progressive reveal:

1.  **這一次，你們的目標不是一次做到最後。**
2.  **市場會持續提出新的要求。**
3.  **每完成一個版本，才會收到下一個需求。**

Do not reveal the list of ten challenges.

------------------------------------------------------------------------

## P14 --- Definition of Done

Question:

**一個 Version 什麼時候才算 Done？**

Reveal:

**1. Product works**\
符合本關 Acceptance Criteria

-   

**2. Necessary documentation completed**\
完成 Version Record

=

**DONE**

Final copy:

**Done 才能取得下一個 Challenge。**

Purpose: Teach the operational rule before Round 2.

Important: Do not imply that documentation occurs after Done.

------------------------------------------------------------------------

## P15 --- Ready for Round 2

Content:

**RESPOND TO THE MARKET**

**10:00**

**How many versions can you deliver?**

Primary action:

**Start Round 2**

Behavior: - set Round 2 started_at; - initialize each team at Challenge
1 unless explicitly resumed; - start authoritative 10-minute timer; -
transition to ROUND_2_ACTIVE; - Projection → P16; - Team → T05.

------------------------------------------------------------------------

## P16 --- Round 2 Live

State: ROUND_2_ACTIVE

Content:

**RESPOND TO THE MARKET**

Large countdown.

Live aggregate data:

-   Teams Working: `{activeTeamCount}`
-   Versions Delivered: `{totalVersionsDone}`

Optional non-ranking distribution:

``` text
V1 ████████
V2 ██████
V3 ████
V4 ██
V5 █
```

Do not: - show challenge descriptions; - reveal future challenges; -
rank teams during the activity.

At zero: - transition ROUND_2_FROZEN; - freeze submissions as described
in Section 14; - Projection → P17; - Team → T08.

------------------------------------------------------------------------

## P17 --- STOP

Content:

**STOP**

**Hands Off.**

Do not automatically advance.

------------------------------------------------------------------------

## P18 --- What Happened?

Content:

**第一輪時間比較寬裕。**

**第二輪時間更少。**

**結果發生了什麼？**

Facilitator leads discussion before revealing dashboard.

------------------------------------------------------------------------

## P19 --- Live Results Dashboard

Purpose: Turn team behavior into shared evidence.

Default columns:

  -----------------------------------------------------------------------
  Team         Time to First  Versions Done Avg Cycle Time Materials Left
                       Value                               
  ----------- -------------- -------------- -------------- --------------

  -----------------------------------------------------------------------

Rules:

-   Time to First Value = Round 2 start → Version 1 Done.
-   Versions Done = count of completed Version records.
-   Avg Cycle Time = average challenge cycle time for completed
    Versions.
-   Materials Left is optional unless collected.
-   If a metric is unavailable, show `—`, not zero.

No automatic winner.

------------------------------------------------------------------------

## P20 --- Who Was Most Successful?

Content only:

**Which team was the most successful?**

Do not reveal an answer.

Purpose: Create discussion around competing definitions of success.

------------------------------------------------------------------------

## P21 --- Project Success

Heading:

**Traditional Project Thinking**

Reveal:

-   On Scope
-   On Time
-   On Budget

Question:

**如果這就是成功，團隊會產生什麼行為？**

Purpose: Discuss incentives such as consuming all time/resources and
delaying validation.

------------------------------------------------------------------------

## P22 --- Product Success

Heading:

**Product Thinking**

Core question:

**我們多快能把真正的市場需求，轉化成可以使用的產品？**

Reframe workshop metrics:

-   Time to First Value
-   Number of Feedback Cycles
-   Cycle Time
-   Resource Efficiency

Do not declare that only one metric defines success.

------------------------------------------------------------------------

## P23 --- Agile Manifesto #1

Two-column Manifesto Learning Layout.

Left: `manifesto1.png`

Right:

Heading: **Individuals and interactions over processes and tools**

Prompt:

**第一輪每個人都很忙，為什麼有些團隊仍然沒有產品？**

Reveal:

**分工不等於協作。**

Learning:

**團隊真正的能力，是快速形成共識、整合工作、解決問題並共同交付成果。**

Avoid framing the principle as requiring compatible personalities.
Different skills and perspectives can still collaborate effectively.

------------------------------------------------------------------------

## P24 --- Agile Manifesto #2

Left: `manifesto2.png`

Right:

Heading: **Working software over comprehensive documentation**

Prompt:

**我們剛才怎麼衡量真正的進展？**

Reveal:

**我們沒有問：「計畫完成幾％？」**

Then:

**我們一直問：「你們現在交到第幾版？」**

Core learning:

**Working Product is the primary evidence of progress.**

------------------------------------------------------------------------

## P25 --- Document Late

Purpose: Connect documentation timing to the Version history
participants actually created.

Display a real Version history from a selected team when available:

``` text
V1  {record}
V2  {record}
V3  {record}
V4  {record}
...
```

Question:

**你們在活動開始前，有可能準確寫出這份文件嗎？**

Reveal:

**Document Late**

Definition:

**在最接近事實形成、資訊較充分的時間點，完成必要文件。**

Process:

**Build → Validate → Document → Done**

Final emphasis:

**Documentation is part of Done.**

Important: Do not state or imply "finish the product, declare Done, then
write documentation."

------------------------------------------------------------------------

## P26 --- Agile Manifesto #3

Left: `manifesto3.png`

Right:

Heading: **Customer collaboration over contract negotiation**

Prompt:

**為什麼我們沒有一開始就把十大挑戰全部給你？**

Reveal:

**產品做出來之後，市場才會產生新的回饋與需求。**

Visualization:

``` text
Product
  ↓
Customer Feedback
  ↓
Conversation
  ↓
Next Version
  ↺
```

Learning:

**需求透過產品與客戶的持續互動逐步被理解。**

------------------------------------------------------------------------

## P27 --- Agile Manifesto #4

Left: `manifesto4.png`

Right:

Heading: **Responding to change over following a plan**

Prompt:

**市場提出新要求之後，你們多久可以交出下一個可用版本？**

Use actual Cycle Time data where possible.

Learning:

**The ability to respond is a competitive advantage.**

Focus: Success is not merely degree of conformance to an original plan.

------------------------------------------------------------------------

## P28 --- Agile Value Delivery Loop

Display:

``` text
COLLABORATE
    ↓
DELIVER
    ↓
LEARN
    ↓
ADAPT
    ↓
DELIVER
    ↺
```

Mapping:

  Behavior      Manifesto Value
  ------------- ----------------------------
  Collaborate   Individuals & Interactions
  Deliver       Working Software
  Learn         Customer Collaboration
  Adapt         Responding to Change

Closing learning statement:

**敏捷的核心能力，是縮短從需求、交付、學習到調整的循環。**

------------------------------------------------------------------------

## P29 --- Final Reflection

Content:

**明天回到工作現場：**

1.  **我們多久才會產生第一個真正可用的成果？**
2.  **我們如何知道自己真的有進展？**
3.  **市場改變之後，我們多久能交出下一個版本？**

No new concepts after this screen.

Facilitator may mark workshop Completed.

------------------------------------------------------------------------

# 10. Team Screen Specifications

## T01 --- Join Workshop

Fields:

-   Team Name --- required
-   Recorder Name --- required

Workshop identity is resolved from join URL or Workshop Code.

Primary action: **Join**

Validation: - trim whitespace; - reject empty names; - prevent
accidental duplicate submission; - duplicate team names may be warned
but do not need to be globally prohibited in MVP.

------------------------------------------------------------------------

## T02 --- Waiting Room

Content:

**Welcome, {teamName}**

**You're ready.**

**Please look at the main screen.**

System: - maintain local team/session identity; - listen for workshop
state changes.

------------------------------------------------------------------------

## T03 --- Round 1

Content:

**ROUND 1**

Synchronized countdown.

**Build the Tallest Structure**

No input fields.

At Round 1 freeze → T04.

------------------------------------------------------------------------

## T04 --- Attention Mode

Content:

**ROUND 1 PAUSED**

**Please look at the main screen.**

Generic Attention Mode may later reuse:

**Please look at the main screen.**

No teaching content is duplicated here.

------------------------------------------------------------------------

## T05 --- Current Challenge

State: ROUND_2_ACTIVE

Content:

**VERSION {n}**

**MARKET CHALLENGE**

`{challenge.title}`

`{challenge.description}`

Acceptance Criteria: - render the current challenge criteria as readable
checklist items; - future challenge data must not be sent to the client
if avoidable, not merely hidden with CSS.

Supporting instruction:

**Build it. Test it.**

Action: **Record Version**

This action opens T06. It does not mark Done.

------------------------------------------------------------------------

## T06 --- Version Record

Purpose: Complete validation and necessary documentation.

Show current challenge title and Version number.

Acceptance Criteria self-validation: Each criterion must be explicitly
checked.

Required documentation field:

**What changed in this version?**

Helper text:

**請簡短記錄這一版做了什麼改變。**

Required checkbox:

-   我們已實際驗證產品符合本關 Acceptance Criteria。

Primary action:

**Complete Version**

Enabled only when: - all required acceptance criteria are checked; -
documentation field is non-empty; - validation checkbox is checked.

On submit: 1. persist locally immediately; 2. assign a client-generated
idempotency key; 3. record local completion timestamp; 4. mark Version
Done locally; 5. enqueue server sync; 6. show T07 without waiting for
cloud success.

------------------------------------------------------------------------

## T07 --- Version Done

Content:

**VERSION {n}**

**DONE**

-   Completed: `{elapsedWorkshopTime}`
-   Cycle Time: `{cycleTime}`

Status: - Synced / Waiting for connection

Action:

**Next Market Feedback**

Behavior: - if Round 2 still active and another challenge exists, open
next T05; - if Challenge 10 is complete, show a "All available
challenges completed" waiting state; - if Round 2 is frozen, go to T08.

Important: A future challenge is not unlocked before the previous
Version is Done.

------------------------------------------------------------------------

## T08 --- Round Completed

Content:

**ROUND COMPLETED**

**You delivered: {versionsDone} Versions**

**Please look at the main screen.**

Show sync status if pending local records exist.

Do not allow new Version completion after authoritative Round 2 freeze.

------------------------------------------------------------------------

# 11. Challenge Engine

Challenges must be data-driven, not embedded in page logic.

Minimum challenge schema:

``` text
id
challenge_set_id
sequence
title
description
acceptance_criteria[]
learning_intent
is_active
```

Rules:

-   sequence begins at 1;
-   next challenge is sequence + 1;
-   Challenge N+1 is unlocked only after Version N is Done;
-   teams may be on different challenge numbers;
-   facilitator dashboard may see all progress;
-   teams may not see future challenge descriptions.

The initial challenge set should be loaded from the separately
maintained "Marshmallow Agile 10 Challenges" content.

------------------------------------------------------------------------

# 12. Version Record Model

MVP Version Record fields:

``` text
id
idempotency_key
workshop_id
team_id
challenge_id
version_number
challenge_started_at
completed_at
change_record
validation_confirmed
sync_status
created_at
updated_at
```

Derived:

``` text
cycle_time = completed_at - challenge_started_at
time_to_first_value = version_1.completed_at - round_2.started_at
```

Future extension fields may include: - Result - Decision - Learning -
material usage - facilitator validation.

Do not require these extension fields in MVP.

------------------------------------------------------------------------

# 13. Suggested Data Model

## workshops

``` text
id
name
join_code
status
round1_duration_seconds
round2_duration_seconds
round1_started_at
round1_paused_at
round1_finished_at
round2_started_at
round2_paused_at
round2_finished_at
current_projection_screen
challenge_set_id
created_at
updated_at
```

## teams

``` text
id
workshop_id
name
recorder_name
current_challenge_sequence
joined_at
last_seen_at
```

## challenge_sets

``` text
id
name
version
```

## challenges

As defined in Section 11.

## team_versions

As defined in Section 12.

## workshop_evidence

For facilitator-entered evidence such as Round 1 Working Product count:

``` text
id
workshop_id
key
value
created_at
updated_at
```

------------------------------------------------------------------------

# 14. Timer and Freeze Rules

Timers must be authoritative at workshop level.

Requirements:

1.  Do not implement independent drifting countdowns per device.
2.  Clients derive displayed remaining time from authoritative
    start/pause timestamps.
3.  Pause/resume must synchronize to all clients.
4.  At Round 2 expiry, no new Version may be completed.
5.  If a Team submits at the boundary, server authority decides whether
    completion timestamp is before the Round 2 end.
6.  A locally completed record created before expiry but synchronized
    after expiry must remain eligible if its trustworthy local
    timestamp/idempotency flow can be reconciled. MVP may use server
    receipt plus configured clock tolerance; implementation must avoid
    silently losing offline work.
7.  Facilitator can manually End Round early with confirmation.
8.  End Round immediately freezes Team submission.

------------------------------------------------------------------------

# 15. Local-First and Synchronization

Architecture principle:

``` text
Team Browser
   ↓
Local persistence
   ↓
Sync Queue
   ↓
Cloud DB / API
   ↓
Facilitator Dashboard
```

Recommended browser persistence: - IndexedDB for Version records and
sync queue; - localStorage only for small session
identifiers/preferences.

Requirements:

-   Complete Version must feel immediate.
-   Network failure must not erase Version records.
-   Retry synchronization automatically.
-   Use idempotency keys to prevent duplicate Versions.
-   If conflict occurs, preserve both raw records for diagnostics rather
    than silently overwriting evidence.
-   Facilitator dashboard should show stale/offline team status when
    last_seen_at exceeds a reasonable threshold.

------------------------------------------------------------------------

# 16. Facilitator Console

The console is not the public projection screen.

Minimum controls:

## Workshop

-   Open Lobby
-   Start Workshop
-   End Workshop
-   Reset Workshop --- destructive confirmation required

## Projection

-   Previous
-   Next
-   Jump to Screen
-   Full Screen projection
-   current screen indicator

## Round Controls

-   Start
-   Pause
-   Resume
-   End Round

## Team Status

-   team name
-   current challenge/version
-   versions completed
-   last sync
-   online/stale status

## Evidence

-   enter Round 1 Working Product count

## Results

-   preview P19 data before showing it publicly.

Do not expose future Challenge text on the public projection while Round
2 is active.

------------------------------------------------------------------------

# 17. Dashboard Metrics

## 17.1 Time to First Value

For each team:

`Version 1 completed_at - Round 2 started_at`

Lower is faster.

## 17.2 Versions Done

Count of valid Done Versions before Round 2 end.

## 17.3 Cycle Time

For Version N:

`completed_at - challenge_started_at`

Challenge 1 starts at Round 2 start.

Challenge N\>1 starts when Version N-1 becomes Done/unlocks N.

## 17.4 Feedback Cycles

For MVP, equal to Versions Done.

Use teaching language carefully: more cycles are evidence of more
opportunities to respond, not automatically proof of greater customer
value.

## 17.5 Resource Efficiency

Optional in MVP unless the workshop explicitly captures remaining
materials.

If implemented: - collect only at Round 2 end; - define measurement
units before workshop; - do not fabricate percentage from subjective
estimates.

------------------------------------------------------------------------

# 18. Attention Mode

During all teaching/debrief phases after physical activity begins, Team
devices should minimize distraction.

Generic content:

**Please look at the main screen.**

Optional: - workshop phase label; - team name; - sync status.

Do not duplicate manifesto slides or facilitator teaching text on Team
devices.

------------------------------------------------------------------------

# 19. Progressive Reveal Behavior

Projection teaching screens may contain multiple reveal steps.

Requirements:

-   Next reveals the next item before navigating to the next Screen ID.
-   Previous reverses reveal steps before navigating backward.
-   Refreshing the projection should restore current Screen ID and
    reveal index.
-   Reveal state is facilitator-controlled.
-   Team workshop state should not change merely because a reveal
    advances unless explicitly specified.

------------------------------------------------------------------------

# 20. Error and Recovery Requirements

## Projection disconnects

Reloading must restore: - workshop; - current Projection Screen; -
reveal index; - timer state.

## Team reloads

Restore: - workshop identity; - team identity; - current challenge; -
draft Version Record; - pending sync queue.

## Duplicate submission

Idempotency prevents duplicate Version records.

## DB temporarily unavailable

-   team continues locally;
-   facilitator sees degraded sync state;
-   system retries.

## Facilitator accidentally navigates backward

Do not roll back team data or workshop timer state merely because the
presentation screen changes.

Presentation navigation and workshop operational state are related but
not identical.

------------------------------------------------------------------------

# 21. Security / Workshop Access

MVP does not require user accounts.

Requirements:

-   workshop join codes should be non-trivial/random enough to avoid
    accidental collision;
-   facilitator controls must use a separate facilitator token/session
    not exposed through the participant join URL;
-   participants cannot modify another team's records through normal API
    calls;
-   clients cannot request future challenge content without
    authorization/state validation;
-   sanitize all participant text before display;
-   do not render participant input as raw HTML.

------------------------------------------------------------------------

# 22. Content Configuration

Where practical, separate workshop content from application logic.

Configurable content:

-   workshop title;
-   durations;
-   material list;
-   challenge set;
-   Projection screen copy;
-   manifesto image filenames;
-   Version Record prompt.

This allows future workshop variants without rebuilding the application.

------------------------------------------------------------------------

# 23. MVP Scope

Must implement:

1.  Create Workshop.
2.  Workshop join QR/code.
3.  Team join and waiting room.
4.  Projection P01--P29.
5.  Facilitator progressive reveal/navigation.
6.  Round 1 synchronized timer.
7.  Round 1 freeze.
8.  Round 1 Working Product evidence count.
9.  Round 2 synchronized timer.
10. Sequential Challenge 1--10 engine.
11. Acceptance Criteria self-validation.
12. Required Version Record.
13. Definition-of-Done gating.
14. Local-first Version completion.
15. Cloud synchronization.
16. Facilitator team-progress view.
17. P19 result dashboard.
18. Attention Mode.
19. Manifesto asset layout.
20. Recovery after browser reload.

------------------------------------------------------------------------

# 24. Explicitly Out of Scope for MVP

Do not implement unless separately requested:

-   participant accounts/passwords;
-   LMS;
-   certificates;
-   video upload;
-   AI analysis;
-   AI-generated coaching;
-   chat;
-   individual participant workbooks;
-   public leaderboards during Round 2;
-   complex CMS;
-   scoring algorithm that declares a winner;
-   social sharing;
-   payment;
-   multi-tenant enterprise administration.

------------------------------------------------------------------------

# 25. Acceptance Scenarios

## AC01 --- Join

Given a workshop is in Lobby\
When a Recorder opens its join URL, enters Team Name and Recorder Name,
and presses Join\
Then the team is persisted locally and remotely\
And P01 team count updates\
And the Recorder sees T02.

## AC02 --- Round 1 does not leak Agile learning

Given Round 1 is active\
When a Team views T03\
Then it sees the timer and physical challenge objective\
And it does not see MVP, iteration, Version, Working Product, or future
challenges.

## AC03 --- Timer freeze

Given Round 1 has 1 second remaining\
When the authoritative timer reaches zero\
Then Round 1 becomes frozen\
And Projection shows P06\
And Team devices show T04\
And the system does not automatically advance to P07.

## AC04 --- Round 2 starts all teams at Challenge 1

Given the facilitator starts Round 2\
Then each eligible team receives Challenge 1\
And Challenge 2--10 are not visible to that Team.

## AC05 --- Cannot complete without validation

Given Team Alpha is on Challenge 2\
When any required Acceptance Criterion is unchecked\
Then Complete Version remains disabled.

## AC06 --- Cannot complete without documentation

Given all acceptance criteria are checked\
And What changed in this version is empty\
Then Complete Version remains disabled.

## AC07 --- Complete Version is local-first

Given Team Alpha has no network connection\
And its Challenge 2 acceptance criteria and Version Record are complete\
When the Recorder presses Complete Version before the round expires\
Then Version 2 is stored locally\
And T07 appears without waiting for network\
And the record is marked Waiting for connection.

## AC08 --- Sequential unlock

Given Version 2 is Done\
When Team Alpha requests Next Market Feedback\
Then Challenge 3 becomes available\
And Challenge 4 remains unavailable.

## AC09 --- Sync is idempotent

Given a locally completed Version is retried three times\
When connectivity returns\
Then only one canonical Version record exists for the idempotency key.

## AC10 --- Teams progress independently

Given Team Alpha has completed V5\
And Team Beta has completed V2\
Then Alpha sees Challenge 6\
And Beta sees Challenge 3\
And neither team sees the other's challenge screen.

## AC11 --- Round 2 expiry

Given Round 2 reaches zero\
Then new Complete Version actions are blocked\
And all Team devices transition to T08\
And Projection displays P17.

## AC12 --- Dashboard

Given multiple teams have completed Versions\
When facilitator opens P19\
Then Time to First Value, Versions Done, and Avg Cycle Time are
calculated from recorded timestamps\
And unavailable metrics show `—`.

## AC13 --- No automatic winner

Given P19 is displayed\
Then no team is labelled Winner automatically.

## AC14 --- Manifesto portrait asset

Given P23 is displayed at 1920×1080\
Then manifesto1.png is fully visible without crop or distortion\
And the learning content appears in the right-hand column\
And the page requires no scrolling.

## AC15 --- Attention Mode

Given Projection is on P24\
Then Team devices show Attention Mode\
And do not duplicate P24 learning content.

## AC16 --- Document Late history

Given at least one team has multiple Version records\
When P25 is displayed\
Then facilitator can select a team\
And the Projection renders that team's Version history in chronological
order.

## AC17 --- Reload recovery

Given a Team has a partially written Version Record\
When its browser refreshes\
Then its team identity, current challenge, and draft record are
restored.

## AC18 --- Presentation navigation does not corrupt operations

Given Round 2 is active\
When facilitator navigates from P16 backward to P15 for explanation\
Then Round 2 timer and team progress continue unless facilitator
explicitly pauses/ends the round.

------------------------------------------------------------------------

# 26. Recommended Implementation Sequence

## Build Increment 1 --- Workshop Shell

-   routing;
-   workshop creation;
-   facilitator session;
-   join flow;
-   Projection navigation;
-   Attention Mode.

## Build Increment 2 --- Round 1

-   timer;
-   pause/resume;
-   freeze;
-   P02--P11;
-   Round 1 evidence count.

## Build Increment 3 --- Round 2 Core

-   Challenge data model;
-   sequential unlock;
-   T05--T07;
-   Version Record;
-   Done gating.

## Build Increment 4 --- Sync and Recovery

-   IndexedDB;
-   sync queue;
-   idempotency;
-   reconnect/reload behavior.

## Build Increment 5 --- Dashboard

-   metrics;
-   P18--P22;
-   facilitator monitoring.

## Build Increment 6 --- Manifesto Learning

-   portrait assets;
-   P23--P29;
-   live Version history on P25.

## Build Increment 7 --- Workshop Hardening

-   projector QA;
-   mobile QA;
-   offline tests;
-   timer boundary tests;
-   recovery tests.

------------------------------------------------------------------------

# 27. Definition of Done for the Web App MVP

The MVP is Done when:

-   a facilitator can create and run one complete workshop from P01
    through P29;
-   teams can join without accounts;
-   Round 1 runs without Agile concept leakage;
-   Round 2 allows independent sequential progression through the ten
    challenges;
-   a Version cannot be Done without validation and required
    documentation;
-   Team Version completion survives temporary loss of connectivity;
-   all team evidence synchronizes to a shared database;
-   facilitator can see team progress;
-   P19 uses real workshop data;
-   P25 can display real Version history;
-   supplied portrait Manifesto images render correctly on 16:9
    projection;
-   Team devices enter Attention Mode during teaching;
-   browser reload does not destroy active workshop progress;
-   all acceptance scenarios in Section 25 pass.

------------------------------------------------------------------------

# 28. Product Principle for Future Decisions

When implementation choices conflict, prioritize in this order:

1.  Preserve the intended learning experience.
2.  Preserve workshop reliability.
3.  Minimize Team Recorder interaction.
4.  Preserve evidence/data integrity.
5.  Improve facilitator insight.
6.  Add visual polish.

The guiding principle is:

**Simple interaction, rich evidence.**
