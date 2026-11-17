import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Copy,
  DoorOpen,
  FileText,
  HelpCircle,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  Map,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from "lucide-react";
import ArchiveArt from "./components/ArchiveArt";
import {
  advance,
  answer,
  eliminated,
  roomCorrect,
  score,
  useHint,
} from "./lib/game";
import { fetchQuestions, fetchStory } from "./lib/api";
import { loadRun, saveRun } from "./lib/storage";
import { originalStory, rooms } from "./lib/story";
import type { Run } from "./lib/types";

const letters = ["A", "B", "C", "D"];
function Relic({ room, size = 20 }: { room: number; size?: number }) {
  return room === 0 ? (
    <KeyRound size={size} />
  ) : room === 1 ? (
    <Compass size={size} />
  ) : (
    <FileText size={size} />
  );
}
function Dialog({
  open,
  title,
  children,
  close,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-inner">
        <button
          className="icon-button dialog-close"
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">THE ARCHIVIST’S NOTES</span>
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

export default function App() {
  const [run, setRun] = useState<Run | null>(() => loadRun());
  const [screen, setScreen] = useState<"home" | "loading" | "play">("home");
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Run["difficulty"]>("medium");
  const [wantAI, setWantAI] = useState(true);
  const [review, setReview] = useState<number | null>(null);
  const [modal, setModal] = useState<"help" | "credits" | "restart" | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [sound, setSound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState(false);
  const request = useRef<AbortController | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const reducedMotion = useReducedMotion();
  const finished = !!run?.finished;
  const debrief =
    !!run && run.answers.length === (run.room + 1) * 5 && review === null;
  const questionIndex = review ?? run?.answers.length ?? 0;
  const question = run?.questions[questionIndex];
  const isReview = review !== null;

  useEffect(() => {
    if (run) setSaveError(!saveRun(run));
  }, [run]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (screen === "play") titleRef.current?.focus();
  }, [screen, questionIndex, debrief, finished]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 5500);
      return () => clearTimeout(id);
    }
  }, [toast]);

  function playTone(correct = true) {
    if (!sound) return;
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
      const oscillator = audio.current.createOscillator();
      const gain = audio.current.createGain();
      oscillator.connect(gain);
      gain.connect(audio.current.destination);
      oscillator.frequency.setValueAtTime(
        correct ? 520 : 190,
        audio.current.currentTime,
      );
      gain.gain.setValueAtTime(0.045, audio.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.current.currentTime + 0.2,
      );
      oscillator.start();
      oscillator.stop(audio.current.currentTime + 0.2);
    } catch {
      /* Sound never blocks gameplay. */
    }
  }
  function choose(choice: number) {
    if (
      !run ||
      isReview ||
      debrief ||
      run.finished ||
      eliminated(run, questionIndex).includes(choice)
    )
      return;
    playTone(choice === question?.correct);
    setReview(questionIndex);
    setRun(answer(run, choice));
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        screen !== "play" ||
        modal ||
        finished ||
        debrief ||
        isReview ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        /INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target as HTMLElement)?.tagName)
      )
        return;
      const index = letters.indexOf(e.key.toUpperCase());
      if (/^[1-4]$/.test(e.key)) {
        e.preventDefault();
        choose(Number(e.key) - 1);
      } else if (index >= 0) {
        e.preventDefault();
        choose(index);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function begin() {
    setModal(null);
    setScreen("loading");
    setReview(null);
    setSummary(false);
    setCopied(false);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    try {
      const playerName = name.trim().slice(0, 24) || "The Wanderer";
      const [trivia, narration] = await Promise.all([
        fetchQuestions(difficulty, controller.signal),
        wantAI
          ? fetchStory(playerName, difficulty, controller.signal)
          : Promise.resolve({ story: originalStory, ai: false }),
      ]);
      if (controller.signal.aborted) return;
      setRun({
        version: 1,
        id: crypto.randomUUID(),
        startedAt: Date.now(),
        name: playerName,
        difficulty,
        ...trivia,
        ...narration,
        room: 0,
        answers: [],
        hints: [],
        retries: 0,
        finished: false,
      });
      setScreen("play");
    } catch {
      if (!controller.signal.aborted) {
        setScreen("home");
        setToast("The archive could not open. Please try again.");
      }
    }
  }
  function nextRoom() {
    if (run) {
      setRun(advance(run));
      setReview(null);
      setSummary(false);
    }
  }
  async function copyResult() {
    if (!run) return;
    const result = `I escaped The Midnight Archive on Plot Twist! ${score(run)} points · ${run.answers.filter((a, i) => a === run.questions[i].correct).length}/15 correct · ${run.source === "live" ? run.difficulty : "archive edition"} · ${run.retries} room retries. Play: ${location.origin}`;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
    } catch {
      setToast(
        "Copy is unavailable in this browser. Your result is displayed on screen.",
      );
    }
  }

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => {
            if (screen === "loading") request.current?.abort();
            setScreen("home");
            setReview(null);
          }}
          aria-label="Plot Twist home"
        >
          <span className="brand-mark">
            <DoorOpen size={21} />
          </span>
          <span>
            PLOT TWIST<span className="brand-period">.</span>
          </span>
        </button>
        <nav aria-label="Main navigation">
          <span className="header-edition">
            AN INTERACTIVE ESCAPE ADVENTURE
          </span>
          <button className="text-button" onClick={() => setModal("help")}>
            <HelpCircle size={15} />
            <span>How to play</span>
          </button>
          <button
            className="icon-button sound-toggle"
            aria-label={sound ? "Turn sound off" : "Turn sound on"}
            aria-pressed={sound}
            onClick={() => setSound((s) => !s)}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </nav>
      </header>
      <main id="main">
        <AnimatePresence mode="wait" initial={false}>
          {screen === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.25 }}
            >
              <section className="hero">
                <div className="hero-copy">
                  <div className="chapter-label">
                    <span className="status-dot" /> THE FIRST CHAPTER{" "}
                    <span className="label-line" /> № 001
                  </div>
                  <h1>
                    The Midnight
                    <br />
                    <em>Archive.</em>
                  </h1>
                  <p className="hero-tagline">
                    Some doors open with a key.
                    <br />
                    This one opens with your mind.
                  </p>
                  <p className="hero-description">
                    A forgotten archive. A story with your name in it.
                    <br className="desktop-br" /> Three rooms stand between you
                    and the way out.
                  </p>
                  <div className="hero-metadata">
                    <span>
                      <Map size={15} /> 3 rooms
                    </span>
                    <span>
                      <BookOpen size={15} /> 15 questions
                    </span>
                    <span>
                      <Clock3 size={15} /> ~10 minutes
                    </span>
                  </div>
                  <div className="entry-form">
                    <div className="entry-top">
                      <label className="field-label" htmlFor="explorer">
                        YOUR NAME <span>optional</span>
                      </label>
                      <input
                        id="explorer"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={24}
                        placeholder="The Wanderer"
                        autoComplete="nickname"
                      />
                    </div>
                    <fieldset className="difficulty">
                      <legend className="field-label">
                        CHOOSE YOUR CHALLENGE
                      </legend>
                      <div className="difficulty-buttons">
                        {(["easy", "medium", "hard"] as const).map((level) => (
                          <button
                            key={level}
                            aria-pressed={difficulty === level}
                            onClick={() => setDifficulty(level)}
                          >
                            {level === "easy"
                              ? "Curious"
                              : level === "medium"
                                ? "Daring"
                                : "Fearless"}
                            <span>{level}</span>
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <label className="ai-toggle">
                      <input
                        type="checkbox"
                        checked={wantAI}
                        onChange={(e) => setWantAI(e.target.checked)}
                      />
                      <span>Personalise the story with AI</span>
                      <Sparkles size={14} />
                    </label>
                    <p className="ai-note">
                      Original narration is always available if AI is offline.
                    </p>
                    <button
                      className="button primary start-button"
                      onClick={() =>
                        run && !finished ? setModal("restart") : void begin()
                      }
                    >
                      Begin your escape <ArrowRight size={18} />
                    </button>
                    {run && (
                      <button
                        className="continue-button"
                        onClick={() => {
                          setScreen("play");
                          setReview(null);
                        }}
                      >
                        {finished
                          ? "View your last escape"
                          : `Continue ${run.name}’s adventure`}{" "}
                        <ArrowUpRight size={15} />
                      </button>
                    )}
                  </div>
                  <p className="entry-footnote">
                    <ShieldCheck size={13} /> No account. No timer. Just your
                    curiosity.
                  </p>
                </div>
                <div className="hero-visual">
                  <span className="art-caption art-caption-top">
                    THE DOOR IS ALREADY OPEN.
                  </span>
                  <ArchiveArt />
                  <div className="artifact-tag">
                    <span className="artifact-line" />
                    <span>
                      EXHIBIT 001
                      <br />
                      <strong>The way in. And out.</strong>
                    </span>
                  </div>
                  <span className="visual-coordinate">33°55′ S / 18°25′ E</span>
                </div>
              </section>
              <section className="journey" aria-labelledby="journey-title">
                <div className="section-heading">
                  <span className="eyebrow">WHAT LIES AHEAD</span>
                  <h2 id="journey-title">
                    Three rooms. <em>One way out.</em>
                  </h2>
                  <p>Collect the clues. Connect the dots. Change the ending.</p>
                </div>
                <div className="journey-grid">
                  {rooms.map((room, i) => (
                    <article className="journey-card" key={room.title}>
                      <div className="journey-card-top">
                        <span>CHAPTER 0{i + 1}</span>
                        <Relic room={i} />
                      </div>
                      <h3>{room.title}</h3>
                      <p>{room.description}</p>
                      <div className="journey-card-bottom">
                        <span>5 QUESTIONS</span>
                        <LockKeyhole size={13} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              <section className="quote-strip">
                <span>“</span>
                <p>
                  Every answer opens a door.
                  <br />
                  <em>Every mistake becomes part of the story.</em>
                </p>
                <span className="quote-credit">— THE ARCHIVIST</span>
              </section>
            </motion.div>
          )}
          {screen === "loading" && (
            <motion.section
              className="loading-screen"
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="loading-symbol">
                <KeyRound size={38} />
              </div>
              <span className="eyebrow">THE ARCHIVE IS WAKING UP</span>
              <h1>
                Turning the <em>first page.</em>
              </h1>
              <p role="status">
                Gathering your questions and preparing your story…
              </p>
              <p className="muted">
                This can take a few seconds. Your way in is almost ready.
              </p>
              <button
                className="text-button"
                onClick={() => {
                  request.current?.abort();
                  setScreen("home");
                }}
              >
                <ChevronLeft size={16} /> Back to the entrance
              </button>
            </motion.section>
          )}
          {screen === "play" && run && (
            <motion.div
              key="play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.25 }}
              className="play-shell"
            >
              <div className="play-topline">
                <button
                  className="text-button"
                  onClick={() => {
                    setScreen("home");
                    setReview(null);
                  }}
                >
                  <ChevronLeft size={15} /> Save & leave
                </button>
                <span>{run.name}’s adventure</span>
                <span className="data-badge">
                  <span className="status-dot" />
                  {run.source === "live" ? "LIVE TRIVIA" : "ARCHIVE EDITION"}
                </span>
              </div>
              {run.source === "offline" && (
                <p className="notice">
                  <BookOpen size={15} /> Live trivia is unavailable or cooling
                  down. You’re playing our original mixed-difficulty archive
                  questions. All rooms and scoring work normally.
                </p>
              )}
              {saveError && (
                <p className="notice warning">
                  Your browser couldn’t save progress. Keep this tab open to
                  finish your adventure.
                </p>
              )}
              {finished ? (
                <section className="ending">
                  <span className="eyebrow">
                    <CheckCircle2 size={15} /> CASE CLOSED · ALL ROOMS UNLOCKED
                  </span>
                  <div className="ending-medallion">
                    <DoorOpen size={48} />
                  </div>
                  <h1>
                    You changed
                    <br />
                    <em>the ending.</em>
                  </h1>
                  <p className="ending-story">{run.story.ending}</p>
                  <div className="result-stats">
                    <div>
                      <strong>{score(run).toLocaleString()}</strong>
                      <span>FINAL SCORE</span>
                    </div>
                    <div>
                      <strong>
                        {
                          run.answers.filter(
                            (a, i) => a === run.questions[i].correct,
                          ).length
                        }
                        <small>/15</small>
                      </strong>
                      <span>CORRECT ANSWERS</span>
                    </div>
                    <div>
                      <strong>{run.retries}</strong>
                      <span>ROOM RETRIES</span>
                    </div>
                  </div>
                  <div className="collected-relics">
                    {rooms.map((r, i) => (
                      <span key={r.title}>
                        <Relic room={i} />
                        {r.relic}
                      </span>
                    ))}
                  </div>
                  <p className="mode-caption">
                    {run.source === "live"
                      ? `${run.difficulty} difficulty`
                      : "Archive edition · mixed difficulty"}{" "}
                    · {run.ai ? "AI-personalised story" : "Original story"} ·{" "}
                    {run.hints.length} clue{run.hints.length === 1 ? "" : "s"}{" "}
                    used
                  </p>
                  <div className="ending-actions">
                    <button className="button primary" onClick={copyResult}>
                      {copied ? <Check size={17} /> : <Copy size={17} />}{" "}
                      {copied ? "Result copied" : "Copy your result"}
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setScreen("home");
                        setSummary(false);
                      }}
                    >
                      <RotateCcw size={17} /> Play another chapter
                    </button>
                  </div>
                  <button
                    className="text-button review-toggle"
                    onClick={() => setSummary((s) => !s)}
                    aria-expanded={summary}
                  >
                    {summary
                      ? "Close answer journal"
                      : "Open your answer journal"}{" "}
                    <BookOpen size={16} />
                  </button>
                  {summary && <AnswerJournal run={run} />}
                </section>
              ) : (
                <div className="game-layout">
                  <aside className="game-sidebar">
                    <span className="eyebrow">THE MIDNIGHT ARCHIVE</span>
                    <div className="room-track">
                      {rooms.map((r, i) => (
                        <div
                          className={`track-item ${i === run.room ? "active" : ""} ${i < run.room ? "complete" : ""}`}
                          key={r.title}
                        >
                          <span className="track-node">
                            {i < run.room ? (
                              <Check size={16} />
                            ) : i > run.room ? (
                              <LockKeyhole size={13} />
                            ) : (
                              `0${i + 1}`
                            )}
                          </span>
                          <div>
                            <span className="track-label">
                              CHAPTER 0{i + 1}
                            </span>
                            <p>{r.title}</p>
                            <small>
                              {i < run.room
                                ? "Unlocked"
                                : i === run.room
                                  ? "You are here"
                                  : "Locked"}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="score-box">
                      <span className="eyebrow">YOUR SCORE</span>
                      <strong aria-live="polite">
                        {score(run).toLocaleString()}
                        <span> pts</span>
                      </strong>
                      <p>Knowledge is your way out.</p>
                    </div>
                    <div className="inventory">
                      <span className="eyebrow">COLLECTED CLUES</span>
                      {run.room === 0 ? (
                        <p className="muted">Your collection starts here.</p>
                      ) : (
                        rooms.slice(0, run.room).map((r, i) => (
                          <p key={r.relic}>
                            <Relic room={i} size={17} />
                            {r.relic}
                          </p>
                        ))
                      )}
                    </div>
                    <p className="narrator-badge">
                      <Sparkles size={13} />
                      {run.ai
                        ? "AI-personalised narration"
                        : "Original narration"}
                    </p>
                  </aside>
                  <section className="room-content">
                    <div className="room-title-row">
                      <div>
                        <span className="eyebrow">
                          CHAPTER 0{run.room + 1} / 03
                        </span>
                        <h1>{rooms[run.room].title}</h1>
                      </div>
                      <div className="room-emblem">
                        <Relic room={run.room} size={26} />
                      </div>
                    </div>
                    <div className="narrative">
                      <span className="narrative-mark">“</span>
                      <p>
                        {run.answers.length === 0
                          ? `${run.story.intro} ${run.story.rooms[0]}`
                          : run.story.rooms[run.room]}
                      </p>
                    </div>
                    <div className="question-progress">
                      <span>
                        {debrief
                          ? "CHAPTER COMPLETE"
                          : `QUESTION ${Math.min((questionIndex % 5) + 1, 5)} OF 5`}
                      </span>
                      <div
                        className="progress-pips"
                        aria-label={`${run.answers.length - run.room * 5} of 5 questions answered`}
                      >
                        {[0, 1, 2, 3, 4].map((i) => {
                          const a = run.answers[run.room * 5 + i];
                          return (
                            <span
                              key={i}
                              className={
                                a !== undefined
                                  ? a ===
                                    run.questions[run.room * 5 + i].correct
                                    ? "pip-correct"
                                    : "pip-wrong"
                                  : i === questionIndex % 5 && !debrief
                                    ? "pip-current"
                                    : ""
                              }
                            />
                          );
                        })}
                      </div>
                      <span>{roomCorrect(run)} / 3 TO UNLOCK</span>
                    </div>
                    {debrief ? (
                      <div className="debrief">
                        <span
                          className={`debrief-icon ${roomCorrect(run) >= 3 ? "" : "retry"}`}
                        >
                          {roomCorrect(run) >= 3 ? (
                            <Relic room={run.room} size={34} />
                          ) : (
                            <RotateCcw size={34} />
                          )}
                        </span>
                        <span className="eyebrow">
                          {roomCorrect(run) >= 3
                            ? "A NEW CLUE FOUND"
                            : "THE DOOR IS STILL LISTENING"}
                        </span>
                        <h2 ref={titleRef} tabIndex={-1}>
                          {roomCorrect(run) >= 3
                            ? `${rooms[run.room].relic}, revealed.`
                            : "Another turn of the page."}
                        </h2>
                        <p>
                          {roomCorrect(run) >= 3
                            ? `You answered ${roomCorrect(run)} of 5 correctly. ${run.room === 2 ? "The last door is open. Your ending is waiting." : "The archive gives up a secret. The next room is waiting."}`
                            : `You answered ${roomCorrect(run)} of 5 correctly. Three unlock the room. Review the answers below, then try this room again. This attempt’s points and clue cost will reset.`}
                        </p>
                        <button className="button primary" onClick={nextRoom}>
                          {roomCorrect(run) < 3
                            ? "Try this room again"
                            : run.room === 2
                              ? "Discover your ending"
                              : "Enter the next room"}
                          <ArrowRight size={18} />
                        </button>
                        <details className="room-journal">
                          <summary>Review this chapter’s answers</summary>
                          <AnswerJournal run={run} roomOnly />
                        </details>
                      </div>
                    ) : (
                      question && (
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={questionIndex}
                            className="question-card"
                            initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: reducedMotion ? 0 : 0.2 }}
                          >
                            <span className="category">
                              {question.category}
                            </span>
                            <h2 ref={titleRef} tabIndex={-1}>
                              {question.text}
                            </h2>
                            <fieldset className="answers">
                              <legend className="sr-only">
                                Choose one answer
                              </legend>
                              {question.choices.map((choice, i) => {
                                const hidden = eliminated(
                                  run,
                                  questionIndex,
                                ).includes(i);
                                const selected =
                                  run.answers[questionIndex] === i;
                                return (
                                  <button
                                    className={`answer ${isReview && i === question.correct ? "correct" : ""} ${isReview && selected && i !== question.correct ? "wrong" : ""} ${hidden ? "eliminated" : ""}`}
                                    key={i}
                                    onClick={() => choose(i)}
                                    disabled={isReview || hidden}
                                    aria-label={`${letters[i]}. ${choice}${hidden ? ", eliminated by clue" : ""}${isReview && i === question.correct ? ", correct answer" : ""}${isReview && selected ? ", your answer" : ""}`}
                                  >
                                    <span className="answer-letter">
                                      {letters[i]}
                                    </span>
                                    <span>{choice}</span>
                                    {isReview && i === question.correct ? (
                                      <CheckCircle2 size={19} />
                                    ) : isReview && selected ? (
                                      <XCircle size={19} />
                                    ) : (
                                      <span className="answer-indicator" />
                                    )}
                                  </button>
                                );
                              })}
                            </fieldset>
                            {isReview ? (
                              <div className="answer-feedback" role="status">
                                <div>
                                  {run.answers[questionIndex] ===
                                  question.correct ? (
                                    <CheckCircle2 size={19} />
                                  ) : (
                                    <XCircle size={19} />
                                  )}
                                  <p>
                                    {run.answers[questionIndex] ===
                                    question.correct
                                      ? "A little closer to the truth."
                                      : "Every discovery counts."}
                                    <span>
                                      {run.answers[questionIndex] ===
                                      question.correct
                                        ? "Correct answer. Your score has been updated."
                                        : `The correct answer is ${question.choices[question.correct]}.`}
                                    </span>
                                  </p>
                                </div>
                                <button
                                  className="button primary"
                                  onClick={() => setReview(null)}
                                >
                                  {questionIndex % 5 === 4
                                    ? "Reveal the chapter"
                                    : "Next question"}
                                  <ChevronRight size={17} />
                                </button>
                              </div>
                            ) : (
                              <div className="question-tools">
                                <button
                                  className="hint-button"
                                  disabled={run.hints.some(
                                    (i) => Math.floor(i / 5) === run.room,
                                  )}
                                  onClick={() => {
                                    setRun(useHint(run));
                                    setToast(
                                      "Two wrong answers removed. Clue cost: 25 points.",
                                    );
                                  }}
                                >
                                  <Lightbulb size={16} />
                                  {run.hints.includes(questionIndex)
                                    ? "Clue revealed"
                                    : run.hints.some(
                                          (i) => Math.floor(i / 5) === run.room,
                                        )
                                      ? "Room clue used"
                                      : "Reveal a clue"}
                                  <span>−25 pts</span>
                                </button>
                                <span className="keyboard-note">
                                  A–D or 1–4 to choose
                                </span>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      )
                    )}
                  </section>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="site-footer">
        <span>
          CRAFTED WITH CURIOSITY BY{" "}
          <a
            href="https://github.com/raeesasamaai"
            target="_blank"
            rel="noreferrer"
          >
            RAEESA SAMAAI <ArrowUpRight size={12} />
          </a>
        </span>
        <div>
          <button onClick={() => setModal("credits")}>Credits & privacy</button>
          <span>© {new Date().getFullYear()} PLOT TWIST</span>
        </div>
      </footer>
      <div className="toast" role="status" aria-live="polite">
        {toast && <span>{toast}</span>}
      </div>
      <Dialog
        open={modal !== null}
        title={
          modal === "help"
            ? "Your curiosity is the key."
            : modal === "restart"
              ? "Start a new story?"
              : "Behind the pages."
        }
        close={() => setModal(null)}
      >
        {modal === "help" ? (
          <>
            <p>
              Explore three rooms, each with five multiple-choice questions.
              Answer at least <strong>three correctly</strong> to unlock the
              next room and collect a relic.
            </p>
            <ul className="rules">
              <li>
                <strong>100 points</strong> for a correct answer.
              </li>
              <li>
                <strong>Streak bonus:</strong> +20, +40, then +60 for
                consecutive correct answers within a room.
              </li>
              <li>
                <strong>One clue per room</strong> removes two wrong answers and
                costs 25 points.
              </li>
              <li>
                If you retry a locked room, that attempt’s answers, points, and
                clue cost reset. Your retry count remains.
              </li>
            </ul>
            <p>
              There is no timer. Progress saves on this browser after every
              choice. Use the buttons, or A–D / 1–4 when the question is
              focused. Sound is optional; reduced-motion preferences are
              respected.
            </p>
            <button className="button primary" onClick={() => setModal(null)}>
              I’m ready <ArrowRight size={17} />
            </button>
          </>
        ) : modal === "restart" ? (
          <>
            <p>
              Your current adventure will be replaced once the new one is ready.
              You can continue your saved story instead.
            </p>
            <div className="dialog-actions">
              <button
                className="button secondary"
                onClick={() => setModal(null)}
              >
                Keep my adventure
              </button>
              <button className="button primary" onClick={() => void begin()}>
                Start fresh
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              Designed and developed for Raeesa Samaai’s portfolio. The Midnight
              Archive story, artwork, and backup questions are original to this
              project.
            </p>
            <p>
              Live questions:{" "}
              <a href="https://opentdb.com/" target="_blank" rel="noreferrer">
                Open Trivia DB
              </a>
              , licensed under{" "}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY-SA 4.0
              </a>
              . Answer order and presentation are adapted. Icons: Lucide, ISC
              licence. Fonts: locally hosted Manrope and Cormorant Garamond, SIL
              Open Font Licence.
            </p>
            <p>
              Progress is stored only in your browser. Live trivia requests go
              to Open Trivia DB. When you enable personalisation and a narrator
              is configured, your entered name and difficulty are sent to the AI
              provider. Use a nickname. Questions and answers are never sent to
              the model.
            </p>
            <p>
              No account or analytics. Your hosting provider and API providers
              may retain standard request logs. Clear site data to remove your
              saved adventure.
            </p>
            <a
              className="button secondary"
              href="https://github.com/raeesasamaai/plot-twist"
              target="_blank"
              rel="noreferrer"
            >
              Explore the source <ArrowUpRight size={16} />
            </a>
          </>
        )}
      </Dialog>
    </div>
  );
}

function AnswerJournal({
  run,
  roomOnly = false,
}: {
  run: Run;
  roomOnly?: boolean;
}) {
  const start = roomOnly ? run.room * 5 : 0;
  return (
    <ol className="answer-journal" start={start + 1}>
      {run.answers.slice(start, roomOnly ? start + 5 : 15).map((a, i) => {
        const q = run.questions[start + i];
        return (
          <li key={q.id}>
            <span>
              {a === q.correct ? (
                <CheckCircle2 size={17} />
              ) : (
                <XCircle size={17} />
              )}
            </span>
            <div>
              <p>{q.text}</p>
              <small>
                Correct: {q.choices[q.correct]}
                {a !== q.correct ? ` · You chose: ${q.choices[a]}` : ""}
              </small>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
