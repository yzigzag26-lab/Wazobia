# Read Aloud

Read Aloud speaks lesson content and story text aloud. It is a small feature with a
large honesty requirement: the platform does not have an approved Yorùbá, Hausa or
Igbo voice, and the feature must not behave as if it does.

Source lives in `src/features/learn/readAloud/`:

| File | Responsibility |
|---|---|
| `speakable.ts` | Decides what counts as "the content" — and therefore what is spoken |
| `useSpeech.ts` | Browser speech synthesis, voice matching, refusal |
| `ReadAloudPlayer.tsx` | The control strip, including the unavailable state |
| `HighlightedLines.tsx` | Sentence-level highlight and per-line replay |
| `readAloud.test.tsx` | The behaviour, especially the refusal branches |

## What it reads

`lessonLines()` and `storyLines()` walk the *content* of a lesson or story and
produce an ordered list of sentences. Nothing else is in that list:

- the lesson title, summary and breadcrumb are not spoken
- buttons, badges and navigation labels are not spoken
- English glosses are shown beside a line but **never spoken** — reading an
  English translation in a Yorùbá voice would be nonsense, and mixing languages
  mid-utterance teaches nothing

Because the block list on the page and the spoken list come from the same
function, they cannot drift apart.

## The voice problem

Blueprint §8.4 and §16.2 both record that the speech providers evaluated for
WAZOBIA did not cover the three launch languages. There is no validated voice
today.

The browser exposes whatever voices the operating system has installed, so
`useSpeech` does this:

1. Enumerate installed voices.
2. Look for one whose language tag matches `yo`, `ha` or `ig` (including
   regional tags such as `yo-NG`).
3. **If a match exists**, speak — and use that voice, not the default one.
4. **If no match exists**, speak nothing.

Step 4 is the whole point. An English voice reading *Ẹ káàárọ̀* mispronounces
every tone, and a learner hearing that will learn the wrong thing. The player
therefore renders an explanation — naming the language and saying that
pronunciation would be wrong — instead of a row of disabled buttons. A greyed-out
control communicates nothing; a sentence explains.

There are three honest states, all covered by tests:

| State | Cause | What the learner sees |
|---|---|---|
| `unsupported` | Browser has no `speechSynthesis` | "not available in this browser" |
| `unavailable` | API present, no matching voice | "No approved Yorùbá voice on this device", with the reason |
| `ready` | API present and matching voice found | Play controls |

## What it is not

Read Aloud is **playback only**. It is not:

- speech recognition
- pronunciation scoring or feedback
- a claim that the device voice is correct
- an indication that a WAZOBIA voice exists

The player names the device voice it is using ("Using the device voice
'…'") and states that no WAZOBIA voice has been validated, so the learner can
judge what they are hearing.

## Controls

Play, pause, resume, restart, previous/next sentence, and a speed selector
(0.75×, 1×, 1.25×, 1.5×). There is also a compact control strip that sits on the
lesson and story pages, and a line-by-line panel where selecting any line replays
it.

Highlighting follows the utterance `end` event, which is real timing. When a voice
returns no finer-grained timing metadata there is no finer-grained highlight — the
player does not run a timer to *simulate* sync.

## Adding a real voice later

`useSpeech` is the seam. Wiring a provider means:

1. Add a typed service in `src/services/` that returns audio (or a stream) for
   `{ language, text }`.
2. Replace the `speak()` implementation with playback of that audio.
3. Delete the voice-matching branch and the `unavailable` state — but only once
   the provider can actually serve all three languages for the content in the
   app.
4. Keep the component API unchanged: `language`, `lines`, `activeIndex`,
   `speakOne`, and the rate control all stay the same, because neither the lesson
   page nor the story page knows how speech is produced.

Until then the `unavailable` state is correct, and the tests assert that no
utterance is ever constructed when no matching voice is found.
