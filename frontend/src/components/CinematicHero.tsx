import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HERO_VIDEO_SRC = "/kosmix-hero.mp4";
const HERO_POSTER_SRC = "/kosmix-hero-poster.jpg";
const CINEMATIC_SCROLL_DISTANCE = 2800;
const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type HeroMode = "desktop" | "mobile" | "reduced";

type LenisLike = {
  stop: () => void;
  start: () => void;
  resize: () => void;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
};

function getLenisScroller(): Element | Window {
  const wrapper = document.querySelector(
    '[style*="position: fixed"][style*="overflow: hidden"]'
  );
  return wrapper ?? window;
}

function getLenis(): LenisLike | undefined {
  return (window as unknown as { lenis?: LenisLike }).lenis;
}

function bufferedProgress(video: HTMLVideoElement) {
  if (!video.duration || video.buffered.length === 0) return 0;
  return Math.min(1, video.buffered.end(video.buffered.length - 1) / video.duration);
}

function isVideoReady(video: HTMLVideoElement) {
  if (video.readyState >= 4) return true;
  if (video.readyState >= 3 && bufferedProgress(video) >= 0.18) return true;
  if (video.readyState >= 2 && video.buffered.length > 0) {
    return video.buffered.end(video.buffered.length - 1) >= 1.25;
  }
  return false;
}

function detectHeroMode(): HeroMode {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return "reduced";
  if (window.matchMedia(MOBILE_QUERY).matches) return "mobile";
  return "desktop";
}

export function CinematicHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoFrameRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const introRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLParagraphElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const scrollHintRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const preloaderRef = useRef<HTMLDivElement | null>(null);
  const percentRef = useRef<HTMLSpanElement | null>(null);
  const progressFillRef = useRef<HTMLSpanElement | null>(null);

  const [preloaderVisible, setPreloaderVisible] = useState(true);
  const [mode, setMode] = useState<HeroMode>(() =>
    typeof window === "undefined" ? "desktop" : detectHeroMode()
  );

  useEffect(() => {
    const updateMode = () => setMode(detectHeroMode());
    updateMode();
    const mobile = window.matchMedia(MOBILE_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
    mobile.addEventListener("change", updateMode);
    reduced.addEventListener("change", updateMode);
    return () => {
      mobile.removeEventListener("change", updateMode);
      reduced.removeEventListener("change", updateMode);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    const setLoadUi = (progress: number) => {
      const pct = Math.max(4, Math.min(100, Math.round(progress * 100)));
      if (percentRef.current) percentRef.current.textContent = `${pct}%`;
      if (progressFillRef.current) progressFillRef.current.style.width = `${pct}%`;
    };

    const buildVisualTimeline = () => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none", force3D: true } });

      gsap.set(introRef.current, { opacity: 1, y: 0, scale: 1, force3D: true });
      gsap.set(brandRef.current, { opacity: 1 });
      gsap.set(titleRef.current, { opacity: 1, y: 0, scale: 1, force3D: true });
      gsap.set(scrollHintRef.current, { opacity: 1, y: 0 });
      gsap.set(ctaRef.current, { opacity: 0, y: 20, force3D: true });
      gsap.set(videoFrameRef.current, { scale: 1.14, y: 0, force3D: true });
      gsap.set(overlayRef.current, { opacity: 1 });

      tl.to(scrollHintRef.current, { opacity: 0, y: 12, duration: 0.12 }, 0.06);
      tl.to(titleRef.current, { opacity: 0, y: -36, scale: 1.04, duration: 0.18 }, 0.15);
      tl.to(brandRef.current, { opacity: 0, duration: 0.14 }, 0.16);
      tl.to(introRef.current, { opacity: 0, duration: 0.08 }, 0.3);
      tl.to(overlayRef.current, { opacity: 0.38, duration: 0.28 }, 0.32);
      tl.to(overlayRef.current, { opacity: 0.5, duration: 0.1 }, 0.88);
      tl.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.1 }, 0.9);

      return tl;
    };

    const dismissPreloader = () => {
      const preloader = preloaderRef.current;
      if (!preloader) {
        setPreloaderVisible(false);
        return Promise.resolve();
      }
      setLoadUi(1);
      return new Promise<void>((resolve) => {
        gsap.to(preloader, {
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          onComplete: () => {
            if (!cancelled) setPreloaderVisible(false);
            resolve();
          },
        });
      });
    };

    const FRAME = 1 / 24;
    let latestProgress = 0;
    let targetTime = 0;
    let isSeeking = false;
    let rafId = 0;

    const applyVideoTime = () => {
      if (!video.duration) return;
      const nextTime = Math.min(Math.max(targetTime, 0), Math.max(video.duration - FRAME, 0));
      if (isSeeking) return;
      if (Math.abs(video.currentTime - nextTime) < FRAME * 0.45) return;
      isSeeking = true;
      video.currentTime = nextTime;
    };

    const onSeeked = () => {
      isSeeking = false;
      applyVideoTime();
    };

    const applyFrame = () => {
      rafId = 0;
      visualTl?.progress(latestProgress);
      if (!video.duration) return;
      targetTime = latestProgress * Math.max(video.duration - FRAME, 0);
      applyVideoTime();
    };

    const queueFrame = (progress: number) => {
      latestProgress = progress;
      if (!rafId) rafId = requestAnimationFrame(applyFrame);
    };

    let ctx: gsap.Context | null = null;
    let visualTl: gsap.core.Timeline | null = null;
    let lenisScrollHandler: (() => void) | null = null;
    let cancelled = false;
    let started = false;
    const playbackListeners: Array<[string, EventListener]> = [];

    const bindVideo = (event: string, handler: EventListener) => {
      video.addEventListener(event, handler);
      playbackListeners.push([event, handler]);
    };

    const startExperience = async () => {
      if (started || cancelled) return;
      started = true;

      getLenis()?.start();
      await dismissPreloader();
      if (cancelled) return;

      visualTl = buildVisualTimeline();

      if (mode === "reduced") {
        video.pause();
        video.currentTime = 0;
        gsap.set(scrollHintRef.current, { opacity: 0 });
        gsap.set(ctaRef.current, { opacity: 1, y: 0 });
        gsap.set(videoFrameRef.current, { scale: 1.12 });
        return;
      }

      ctx = gsap.context(() => {
        if (mode === "mobile") {
          visualTl?.progress(0);
          const playPromise = video.play();
          if (playPromise) playPromise.catch(() => {});

          const syncFromPlayback = () => {
            if (!video.duration || !visualTl) return;
            visualTl.progress(Math.min(1, video.currentTime / video.duration));
          };

          bindVideo("timeupdate", syncFromPlayback);
          bindVideo("ended", () => {
            visualTl?.progress(1);
            video.pause();
          });
        } else {
          video.pause();
          queueFrame(0);
          video.addEventListener("seeked", onSeeked);

          ScrollTrigger.create({
            trigger: section,
            start: "top top",
            end: `+=${CINEMATIC_SCROLL_DISTANCE}`,
            pin: true,
            pinSpacing: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: false,
            scroller: getLenisScroller(),
            onUpdate: (self) => queueFrame(self.progress),
          });
        }
      }, section);

      const lenis = getLenis();
      if (lenis) {
        lenisScrollHandler = () => ScrollTrigger.update();
        lenis.on("scroll", lenisScrollHandler);
        lenis.resize();
      }

      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const onProgress = () => setLoadUi(Math.max(bufferedProgress(video), video.readyState / 4));
    const onLoadedData = () => setLoadUi(Math.max(0.35, bufferedProgress(video)));
    const maybeReady = () => {
      onProgress();
      if (isVideoReady(video)) void startExperience();
    };

    if (mode === "reduced") {
      setLoadUi(1);
      void startExperience();
    } else {
      getLenis()?.stop();
      setLoadUi(0.06);
      video.addEventListener("loadeddata", onLoadedData);
      video.addEventListener("canplay", maybeReady);
      video.addEventListener("progress", onProgress);
      video.addEventListener("canplaythrough", maybeReady);
      if (video.readyState >= 2) maybeReady();
    }

    const fallback = window.setTimeout(() => void startExperience(), 8000);
    const onResize = () => {
      ScrollTrigger.refresh();
      getLenis()?.resize();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      window.removeEventListener("resize", onResize);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("canplay", maybeReady);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("canplaythrough", maybeReady);
      playbackListeners.forEach(([event, handler]) => video.removeEventListener(event, handler));
      video.removeEventListener("seeked", onSeeked);
      if (rafId) cancelAnimationFrame(rafId);
      video.pause();
      getLenis()?.start();
      if (lenisScrollHandler) getLenis()?.off("scroll", lenisScrollHandler);
      visualTl?.kill();
      ctx?.revert();
    };
  }, [mode]);

  return (
    <section
      ref={sectionRef}
      data-cinematic-hero
      className="cinematic-hero relative w-full overflow-hidden bg-[#0b0c0e]"
      aria-label="Cinematic workspace entrance"
    >
      <div className="relative h-[100svh] min-h-[100vh] w-full">
        <div ref={videoFrameRef} className="absolute inset-0 origin-center">
          <video
            ref={videoRef}
            className="h-full w-full object-cover object-center"
            src={HERO_VIDEO_SRC}
            poster={HERO_POSTER_SRC}
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
          />
        </div>

        <div
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,12,0.42)_0%,rgba(8,9,12,0.18)_28%,rgba(8,9,12,0.12)_55%,rgba(8,9,12,0.38)_100%)]"
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div ref={introRef} className="cinematic-copy max-w-3xl">
            <p
              ref={brandRef}
              className="text-[11px] font-medium uppercase tracking-[0.42em] text-white/80 md:text-xs"
            >
              Kosmix Spaces
            </p>
            <h1
              ref={titleRef}
              className="mt-5 font-display text-[1.65rem] font-light leading-[1.15] text-white sm:text-4xl md:text-[3.15rem]"
            >
              Enter your workspace.
            </h1>
          </div>

          <div ref={ctaRef} className="pointer-events-auto absolute bottom-[18%] opacity-0 md:bottom-[16%]">
            <Link
              to="/explore"
              className="group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em] text-white/90 transition-colors hover:text-white md:text-xs"
            >
              Explore Spaces
              <span className="translate-x-0 transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        <div
          ref={scrollHintRef}
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 text-white/75 md:bottom-10"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.38em]">Scroll to enter</span>
          <span className="cinematic-scroll-line" aria-hidden="true" />
        </div>
      </div>

      {preloaderVisible && (
        <div
          ref={preloaderRef}
          className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b0c0e]"
        >
          <div className="flex w-[min(22rem,calc(100%-3rem))] flex-col items-center text-center text-white">
            <p className="text-[11px] font-medium uppercase tracking-[0.48em] text-white/80">
              Kosmix Spaces
            </p>
            <p className="mt-6 text-xs font-light uppercase tracking-[0.34em] text-white/55">
              Entering your space...
            </p>
            <div className="mt-8 h-px w-full bg-white/15">
              <span
                ref={progressFillRef}
                className="block h-full w-[6%] bg-[#AE936A] transition-[width] duration-300 ease-out"
              />
            </div>
            <span
              ref={percentRef}
              className="mt-4 text-[11px] tabular-nums tracking-[0.22em] text-white/45"
            >
              0%
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
