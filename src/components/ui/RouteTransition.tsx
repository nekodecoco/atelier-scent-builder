import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/** House easing — matches the .reveal curve in index.css. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Full sweep-through time for the wave overlay (s). The page swap hides
 * beneath it around the midpoint. */
const SWEEP_SECONDS = 1.1;

/**
 * Cinematic route transition: the outgoing page scales down and fades, a
 * deep-ink liquid wave sweeps bottom-to-top across the screen (masking the
 * route swap), and the incoming page rises with a spring as the wave clears.
 *
 * Wrap the router outlet with it (App.tsx):
 *
 *   const location = useLocation();
 *   <RouteTransition>
 *     <Routes location={location}>…</Routes>
 *   </RouteTransition>
 *
 * Passing `location` to <Routes> is required — it lets AnimatePresence keep
 * rendering the *old* page inside the exiting subtree.
 *
 * Under prefers-reduced-motion everything degrades to a fast crossfade with
 * no wave.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      <WaveOverlay trigger={location.pathname} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 24 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              delay: 0.4,
              type: 'spring',
              stiffness: 280,
              damping: 30,
              opacity: { delay: 0.4, duration: 0.35, ease: 'easeOut' },
            },
          }}
          exit={{
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.3, ease: EASE },
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
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
