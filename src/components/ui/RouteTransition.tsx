import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, type Location } from 'react-router-dom';

/** House easing — matches the .reveal curve in index.css. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Full sweep-through time for the wave overlay (s). The page swap hides
 * beneath it around the midpoint. */
const SWEEP_SECONDS = 1.1;

/** How long the outgoing page's exit plays before the swap. */
const EXIT_MS = 300;
const REDUCED_EXIT_MS = 150;

/**
 * Cinematic route transition: the outgoing page scales down and fades, a
 * deep-ink liquid wave sweeps bottom-to-top across the screen (masking the
 * route swap), and the incoming page rises with a spring as the wave clears.
 *
 * The swap is deliberately timer-driven, NOT AnimatePresence mode="wait".
 * React Router v7 wraps navigations in React.startTransition, and with
 * React 18 that combination intermittently loses motion's exit-complete
 * signal — the new page then never mounts and the URL is stranded on the
 * old page (the "CHECKOUT click does nothing" bug). A setTimeout always
 * fires, so this swap cannot wedge; rapid re-navigation mid-exit clears
 * the timer and the final destination wins.
 *
 * Contract (App.tsx): children is a render prop receiving the *displayed*
 * location, which trails the live one by EXIT_MS during a transition:
 *
 *   <RouteTransition>
 *     {(displayed) => <Routes location={displayed}>…</Routes>}
 *   </RouteTransition>
 *
 * Under prefers-reduced-motion everything degrades to a fast crossfade with
 * no wave.
 */
export function RouteTransition({ children }: { children: (displayed: Location) => ReactNode }) {
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  const [displayed, setDisplayed] = useState(location);
  const [exiting, setExiting] = useState(false);
  // Skip the enter animation on the very first paint (page load).
  const firstMount = useRef(true);
  useEffect(() => {
    firstMount.current = false;
  }, []);

  const exitMs = reducedMotion ? REDUCED_EXIT_MS : EXIT_MS;

  useEffect(() => {
    if (location.key === displayed.key) return;
    if (location.pathname === displayed.pathname) {
      // Same page (re-click, or back mid-exit): sync without animating, and
      // un-exit in case we were caught mid-fade.
      setDisplayed(location);
      setExiting(false);
      return;
    }
    setExiting(true);
    const timer = setTimeout(() => {
      setDisplayed(location);
      setExiting(false);
    }, exitMs);
    return () => clearTimeout(timer);
  }, [location, displayed, exitMs]);

  if (reducedMotion) {
    return (
      <motion.div
        key={displayed.pathname}
        initial={firstMount.current ? false : { opacity: 0 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      >
        {children(displayed)}
      </motion.div>
    );
  }

  return (
    <>
      <WaveOverlay trigger={location.pathname} />
      {/* Keyed by the displayed page: the swap remounts this div, which plays
          the enter animation from `initial`; the exit is just an animate
          target on the outgoing instance before the timer swaps it. */}
      <motion.div
        key={displayed.pathname}
        initial={firstMount.current ? false : { opacity: 0, y: 24 }}
        animate={
          exiting
            ? {
                opacity: 0,
                scale: 0.98,
                transition: { duration: EXIT_MS / 1000, ease: EASE },
              }
            : {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  delay: 0.4,
                  type: 'spring',
                  stiffness: 280,
                  damping: 30,
                  opacity: { delay: 0.4, duration: 0.35, ease: 'easeOut' },
                },
              }
        }
      >
        {children(displayed)}
      </motion.div>
    </>
  );
}

/** Shared sweep keyframes: rise from below the viewport, cover, exit off the
 * top in one continuous motion. */
const SWEEP = {
  y: ['115%', '0%', '-125%'],
} as const;

/**
 * The liquid wave: two translucent glass panels (~130vh) with organic
 * wave-clipped edges that sweep from below the viewport up through and off
 * the top. The front layer is frosted (backdrop-blur) so the page shows
 * through like liquid; the back layer trails slightly for a fluid parallax
 * feel. Skips the very first mount so initial page load never animates.
 */
function WaveOverlay({ trigger }: { trigger: string }) {
  const firstRender = useRef(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setShow(true);
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        // Keyed by route so a rapid second click restarts the sweep cleanly.
        <div key={trigger} aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
          {/* responsive wave-shaped clip paths (objectBoundingBox = 0..1) */}
          <svg className="absolute h-0 w-0">
            <defs>
              <clipPath id="route-wave-a" clipPathUnits="objectBoundingBox">
                <path d="M0,0.045 C0.18,0.008 0.32,0.075 0.52,0.048 C0.72,0.022 0.86,0.07 1,0.038 L1,0.955 C0.82,0.99 0.68,0.925 0.48,0.952 C0.28,0.978 0.14,0.93 0,0.962 Z" />
              </clipPath>
              <clipPath id="route-wave-b" clipPathUnits="objectBoundingBox">
                <path d="M0,0.06 C0.2,0.02 0.35,0.08 0.55,0.05 C0.75,0.02 0.88,0.075 1,0.05 L1,0.94 C0.8,0.98 0.65,0.92 0.45,0.95 C0.25,0.98 0.12,0.925 0,0.945 Z" />
              </clipPath>
            </defs>
          </svg>

          {/* depth layer — a faint shadow wave trailing behind the glass,
              separating the two crests in depth */}
          <motion.div
            className="absolute inset-x-0 top-0 h-[130vh]"
            style={{
              clipPath: 'url(#route-wave-b)',
              background:
                'linear-gradient(to bottom, rgba(28,27,24,0.13), rgba(28,27,24,0.03) 30%, rgba(28,27,24,0.02))',
            }}
            initial={{ y: '115%' }}
            animate={{ y: [...SWEEP.y] }}
            transition={{
              duration: SWEEP_SECONDS,
              times: [0, 0.45, 1],
              ease: [EASE, EASE],
            }}
          />

          {/* front glass — nearly clear liquid with a bright meniscus band at
              the crest, so the volume reads 3D */}
          <motion.div
            className="absolute inset-x-0 top-0 h-[130vh]"
            initial={{ y: '115%' }}
            animate={{ y: [...SWEEP.y] }}
            transition={{
              delay: 0.05,
              duration: SWEEP_SECONDS,
              times: [0, 0.45, 1],
              ease: [EASE, EASE],
            }}
            onAnimationComplete={() => setShow(false)}
          >
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'url(#route-wave-a)',
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 5%, rgba(255,255,255,0.06) 12%, rgba(242,239,230,0.08) 100%)',
                backdropFilter: 'blur(6px) saturate(1.25)',
                WebkitBackdropFilter: 'blur(6px) saturate(1.25)',
              }}
            />
            {/* specular highlight + shadow lines along both wave crests —
                the strongest 3D cue */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0.045 C0.18,0.008 0.32,0.075 0.52,0.048 C0.72,0.022 0.86,0.07 1,0.038"
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M0,0.045 C0.18,0.008 0.32,0.075 0.52,0.048 C0.72,0.022 0.86,0.07 1,0.038"
                transform="translate(0,0.004)"
                fill="none"
                stroke="rgba(28,27,24,0.2)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M1,0.955 C0.82,0.99 0.68,0.925 0.48,0.952 C0.28,0.978 0.14,0.93 0,0.962"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
