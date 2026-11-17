# Plot Twist: designing a trivia escape adventure

## The brief

Create a free, functional portfolio MVP that connects frontend development,
visual design, and playful storytelling. The intended audience is a curious
visitor who can complete an adventure in roughly ten minutes without signing in.

## The solution

The Midnight Archive makes trivia the mechanism for opening three story rooms.
The primary loop is answer → feedback → clue → next room → ending. Every screen
has a clear next action, and failed rooms can be retried rather than ending the run.

The visual direction uses warm brass, deep green-black, literary typography,
an original illustrated doorway, and restrained movement. The room map and
collected relics make progress visible. An optional, short audio cue reinforces
feedback without being required to understand the result.

## Engineering decisions

- **A pure game engine:** scoring and room transitions can be tested independently
  from animation and presentation.
- **One batched trivia request:** avoids fetching on every question and lets a saved
  run resume with its question set intact.
- **Honest resilience:** the UI labels the original archive question bank and actual
  narration mode. A fallback is never presented as a successful live AI call.
- **AI outside the rules:** the model writes atmosphere, not answers, gates, or scores.
- **Small server surface:** validated, bounded requests; fixed upstream host; private
  provider key; timeouts; no paid model fallback; security headers.
- **No account barrier:** local saving delivers the central value without building
  authentication and account recovery into a one-week MVP.
- **Accessible interaction:** focus moves to each question, dialogs use native focus
  handling, choices expose text feedback, motion honours reduced-motion preferences,
  and there is no time pressure.

## Validation

The repository includes automated tests covering room pass/fail thresholds, capped
streak scoring, per-room streak reset, clue elimination, failed-room score rollback,
completion, corrupt saves, narrator input limits, cross-origin rejection, free-model
enforcement, and invalid provider output. TypeScript and the production build run
in GitHub Actions.

Live Open Trivia DB access was verified with a successful 15-question response
during implementation. The live AI path requires an owner-supplied free-provider
key; mocked provider tests verify the response-validation path. Live AI output was
not tested with an actual key. Browser verification is recorded in VALIDATION.md.

## Trade-offs

Client-side answers are appropriate for casual solo play but cannot support trusted
competitive scores. Local storage cannot synchronise devices. Narrator request caps
are per Worker instance, not globally durable. These are explicit MVP boundaries.

## Next iterations

Start by observing whether players understand the three-answer unlock rule and
whether they use the clue. Then expand the authored stories and original question
bank. Introduce cloud saves only if players need cross-device continuation. Introduce
server-authoritative scoring before public leaderboards or multiplayer challenges.

## Ownership note

This project was built with AI-assisted development. Before presenting it in an
interview, Raeesa should review and be able to explain the game transitions, API
validation, fallback behaviour, accessibility decisions, and server boundaries.
This document records implementation decisions, not invented user research or
measured conversion/performance outcomes.
