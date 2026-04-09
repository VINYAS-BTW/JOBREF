import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Zap,
  BarChart2,
  Lock,
  ChevronRight,
  Users,
} from "lucide-react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────
// PRISM BACKGROUND
// ─────────────────────────────────────────────
const PrismBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const H = 3.5,
      BW = 5.5,
      BASE_HALF = BW * 0.5;
    const GLOW = 1.0,
      NOISE = 0.5,
      SCALE = 3.6,
      BLOOM = 1.0,
      TS = 0.35;
    const CFREQ = 1.0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    Object.assign(renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const vertexShader = /* glsl */ `
      void main() {
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const fragmentShader = /* glsl */ `
      precision highp float;
      uniform vec2  iResolution;
      uniform float iTime;
      uniform float uGlow;
      uniform float uNoise;
      uniform float uBloom;
      uniform float uColorFreq;
      uniform float uTimeScale;
      uniform float uInvBaseHalf;
      uniform float uInvHeight;
      uniform float uMinAxis;
      uniform float uPxScale;
      uniform float uCenterShift;

      vec4 tanh4(vec4 x){
        vec4 e2x = exp(2.0*x);
        return (e2x - 1.0) / (e2x + 1.0);
      }
      float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
      }
      float sdOctaAnisoInv(vec3 p){
        vec3 q = vec3(abs(p.x)*uInvBaseHalf, abs(p.y)*uInvHeight, abs(p.z)*uInvBaseHalf);
        float m = q.x + q.y + q.z - 1.0;
        return m * uMinAxis * 0.5773502691896258;
      }
      float sdPrism(vec3 p){
        float oct = sdOctaAnisoInv(p);
        return max(oct, -p.y);
      }

      void main(){
        vec2 f = (gl_FragCoord.xy - 0.5*iResolution.xy) * uPxScale;
        float z = 5.0;
        float d = 0.0;
        vec3 p;
        vec4 o = vec4(0.0);

        float t = iTime * uTimeScale;
        float c0 = cos(t);
        float c1 = cos(t + 33.0);
        float c2 = cos(t + 11.0);
        mat2 wob = mat2(c0, c1, c2, c0);

        for(int i = 0; i < 90; i++){
          p = vec3(f, z);
          p.xz = p.xz * wob;
          vec3 q = p;
          q.y += uCenterShift;
          d = 0.1 + 0.2 * abs(sdPrism(q));
          z -= d;
          o += (sin((p.y + z) * uColorFreq + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
        }

        o = tanh4(o * o * (uGlow * uBloom) / 1e5);

        vec3 col = o.rgb;
        float n = rand(gl_FragCoord.xy + vec2(iTime));
        col += (n - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);

        float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = clamp(mix(vec3(L), col, 1.5), 0.0, 1.0);

        gl_FragColor = vec4(col, o.a);
      }
    `;

    const geo = new THREE.PlaneGeometry(2, 2);
    const iResBuf = new THREE.Vector2();

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        iResolution: { value: iResBuf },
        iTime: { value: 0 },
        uGlow: { value: GLOW },
        uNoise: { value: NOISE },
        uBloom: { value: BLOOM },
        uColorFreq: { value: CFREQ },
        uTimeScale: { value: TS },
        uInvBaseHalf: { value: 1 / BASE_HALF },
        uInvHeight: { value: 1 / H },
        uMinAxis: { value: Math.min(BASE_HALF, H) },
        uPxScale: { value: 0.01 / SCALE },
        uCenterShift: { value: H * 0.25 },
      },
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      iResBuf.set(w * dpr, h * dpr);
      mat.uniforms.uPxScale.value = 1 / ((h * dpr || 1) * 0.1 * SCALE);
    };
    window.addEventListener("resize", resize);
    resize();

    const t0 = performance.now();
    let rafId;
    const animate = (ts) => {
      mat.uniforms.iTime.value = (ts - t0) * 0.001;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Dark vignette so text stays readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 10%, rgba(10,10,11,0.15) 0%, rgba(10,10,11,0.82) 60%, rgba(10,10,11,0.97) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const STATS = [
  { value: "3.2×", label: "higher interview rate via referral" },
  { value: "68%", label: "of roles filled through networks" },
  { value: "41d", label: "faster time-to-hire" },
];

const PILLARS = [
  {
    icon: BarChart2,
    title: "Proof-of-Work Profile",
    body: "No PDFs. GitHub commits, LeetCode ratings, and live project signals auto-generate your competency heatmap.",
  },
  {
    icon: Zap,
    title: "Probability Engine",
    body: "AI calculates your referral match score before you send a single message. Know your odds. Move with intent.",
  },
  {
    icon: Lock,
    title: "Zero-Knowledge Trust Layer",
    body: 'Employees browse as "Senior React Dev @ FinTech Unicorn." Identities reveal only on mutual opt-in.',
  },
  {
    icon: Shield,
    title: "Token Economy",
    body: "3 referral tokens per month per candidate. Mathematically eliminates spam. Every request carries weight.",
  },
];

const TICKER_WORDS = [
  "Proof-of-work profiles",
  "Referral match scores",
  "Zero-knowledge identity",
  "Token economy",
  "Network-first hiring",
  "No cold DMs",
  "Verified credentials",
  "Mutual opt-in",
  "Probability engine",
  "Privacy-first",
];

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────
const Ticker = () => {
  // Duplicate for seamless loop
  const items = [...TICKER_WORDS, ...TICKER_WORDS];
  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.018)",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
        padding: "14px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          animation: "refhire-ticker 28s linear infinite",
          whiteSpace: "nowrap",
        }}
      >
        {items.map((word, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 28,
              padding: "0 28px",
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#6B6966",
              borderRight: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                background: "#C8FF00",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            {word}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────
export default function LandingPage({ navigate }) {
  const heroLabelRef = useRef(null);
  const heroHeadRef = useRef(null);
  const heroSubRef = useRef(null);
  const heroActionsRef = useRef(null);
  const statRefs = useRef([]);
  const pillarRefs = useRef([]);
  const sectionTagRef = useRef(null);
  const sectionTitleRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const ease = "power3.out";

    // Hero entrance
    gsap.fromTo(
      heroLabelRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.9, delay: 0.2, ease }
    );
    gsap.fromTo(
      heroHeadRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 1.0, delay: 0.38, ease }
    );
    gsap.fromTo(
      heroSubRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.9, delay: 0.54, ease }
    );
    gsap.fromTo(
      heroActionsRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.9, delay: 0.68, ease }
    );

    // Hero parallax on scroll
    gsap.to(heroHeadRef.current, {
      scrollTrigger: {
        trigger: heroHeadRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1.5,
      },
      y: -60,
      ease: "none",
    });

    // Stat cards
    statRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { opacity: 0, y: 24 },
        {
          scrollTrigger: { trigger: el, start: "top 85%" },
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay: i * 0.12,
          ease,
        }
      );
    });

    // Section tag + title
    if (sectionTagRef.current) {
      gsap.fromTo(
        sectionTagRef.current,
        { opacity: 0, y: 16 },
        {
          scrollTrigger: { trigger: sectionTagRef.current, start: "top 85%" },
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease,
        }
      );
    }
    if (sectionTitleRef.current) {
      gsap.fromTo(
        sectionTitleRef.current,
        { opacity: 0, y: 16 },
        {
          scrollTrigger: { trigger: sectionTitleRef.current, start: "top 85%" },
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay: 0.1,
          ease,
        }
      );
    }

    // Pillar cards
    pillarRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { opacity: 0, y: 20 },
        {
          scrollTrigger: { trigger: el, start: "top 88%" },
          opacity: 1,
          y: 0,
          duration: 0.65,
          delay: (i % 2) * 0.1,
          ease,
        }
      );
    });

    // CTA
    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 24 },
        {
          scrollTrigger: { trigger: ctaRef.current, start: "top 85%" },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease,
        }
      );
    }

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <>
      {/* Inject ticker keyframe */}
      <style>{`
        @keyframes refhire-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      {/* Fixed WebGL prism background */}
      <PrismBackground />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        style={{ background: "transparent", minHeight: "100vh", position: "relative", zIndex: 1 }}
      >
        {/* ── NAV ── */}
        <nav
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(17,17,17,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "0 2rem",
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#C8FF00",
              }}
            >
              RefHire
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => navigate("auth", "hiring")}
                style={{
                  fontSize: 13,
                  color: "#6B6966",
                  background: "none",
                  border: "none",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                Hiring
              </button>
              <button
                onClick={() => navigate("auth", "candidate")}
                style={{
                  fontSize: 13,
                  color: "#A09E9A",
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "6px 14px",
                  cursor: "pointer",
                }}
              >
                Sign in
              </button>
              <button
                onClick={() => navigate("auth", "candidate")}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0A0A0B",
                  background: "#C8FF00",
                  border: "none",
                  padding: "7px 18px",
                  cursor: "pointer",
                }}
              >
                Get started
              </button>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "140px 2rem 80px",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {/* Label */}
          <div
            ref={heroLabelRef}
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C8FF00",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: 0,
            }}
          >
            
          </div>

          {/* Headline */}
          <h1
            ref={heroHeadRef}
            style={{
              fontSize: "clamp(42px, 7vw, 88px)",
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              color: "#E8E6E1",
              maxWidth: 820,
              marginBottom: "1.5rem",
              opacity: 0,
            }}
          >
            The referral network that{" "}
            <em style={{ fontStyle: "", color: "#C8FF00" }}>eliminates</em>{" "}
            the cold ask.
          </h1>

          {/* Sub */}
          <p
            ref={heroSubRef}
            style={{
              fontSize: 17,
              color: "#6B6966",
              maxWidth: 480,
              lineHeight: 1.7,
              marginBottom: "2.5rem",
              opacity: 0,
            }}
          >
            Proof-of-work profiles. Predictive match scores. Zero-knowledge identity.
            Referrals that work — without the awkward LinkedIn DMs.
          </p>

          {/* CTAs */}
          <div
            ref={heroActionsRef}
            style={{ display: "flex", flexWrap: "wrap", gap: 12, opacity: 0 }}
          >
            <button
              onClick={() => navigate("auth", "candidate")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                color: "#0A0A0B",
                background: "#C8FF00",
                border: "none",
                padding: "14px 28px",
                cursor: "pointer",
                transition: "background .2s, transform .15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#D4FF26")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#C8FF00")}
            >
              Find a referrer
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate("auth", "employee")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "#A09E9A",
                background: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "14px 28px",
                cursor: "pointer",
                transition: "all .2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#E8E6E1";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#A09E9A";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              }}
            >
              <Users size={14} />
              I want to refer talent
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* ── TICKER ── */}
        <Ticker />

        {/* ── STATS ── */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "80px 2rem 0",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.07)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              ref={(el) => (statRefs.current[i] = el)}
              style={{
                background: "#0A0A0B",
                padding: "40px 32px",
                position: "relative",
                overflow: "hidden",
                opacity: 0,
              }}
              onMouseEnter={(e) => {
                const line = e.currentTarget.querySelector(".stat-line");
                if (line) line.style.transform = "scaleX(1)";
              }}
              onMouseLeave={(e) => {
                const line = e.currentTarget.querySelector(".stat-line");
                if (line) line.style.transform = "scaleX(0)";
              }}
            >
              <div
                className="stat-line"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "#C8FF00",
                  transform: "scaleX(0)",
                  transformOrigin: "left",
                  transition: "transform .5s ease",
                }}
              />
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  color: "#C8FF00",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "#6B6966", lineHeight: 1.5 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── PILLARS ── */}
        <section
          style={{
            maxWidth: 1100,
            margin: "100px auto 0",
            padding: "0 2rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            ref={sectionTagRef}
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C8FF00",
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: "1rem",
              opacity: 0,
            }}
          >
            <span style={{ display: "block", width: 24, height: 1, background: "#C8FF00" }} />
            How it works
          </div>

          <h2
            ref={sectionTitleRef}
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#E8E6E1",
              maxWidth: 480,
              marginBottom: 60,
              lineHeight: 1.1,
              opacity: 0,
            }}
          >
            Four systems.
            <br />
            One unfair advantage.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  ref={(el) => (pillarRefs.current[i] = el)}
                  style={{
                    background: "#111111",
                    padding: "40px 36px",
                    transition: "background .3s",
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#181818";
                    const iconBox = e.currentTarget.querySelector(".pillar-icon");
                    if (iconBox) iconBox.style.borderColor = "rgba(200,255,0,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#111111";
                    const iconBox = e.currentTarget.querySelector(".pillar-icon");
                    if (iconBox) iconBox.style.borderColor = "rgba(200,255,0,0.25)";
                  }}
                >
                  <div
                    className="pillar-icon"
                    style={{
                      width: 40,
                      height: 40,
                      border: "1px solid rgba(200,255,0,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 24,
                      transition: "border-color .3s",
                    }}
                  >
                    <Icon size={16} color="#C8FF00" />
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#E8E6E1",
                      marginBottom: 10,
                    }}
                  >
                    {p.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#6B6966", lineHeight: 1.65 }}>
                    {p.body}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── GLOW DIVIDER ── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, #C8FF00 50%, transparent 100%)",
            opacity: 0.35,
            margin: "100px 0 0",
          }}
        />

        {/* ── CTA ── */}
        <section
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 2rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            ref={ctaRef}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "64px",
              display: "flex",
              flexWrap: "wrap",
              gap: 40,
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              opacity: 0,
            }}
          >
            {/* Subtle lime glow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 80% 50%, rgba(200,255,0,0.04) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: "clamp(22px, 3vw, 36px)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#E8E6E1",
                  maxWidth: 440,
                  lineHeight: 1.15,
                  marginBottom: 6,
                }}
              >
                Your next hire is already inside someone's network.
              </div>
              <div style={{ fontSize: 13, color: "#6B6966" }}>
                Stop guessing. Start matching.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => navigate("auth", "candidate")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0A0A0B",
                  background: "#C8FF00",
                  border: "none",
                  padding: "14px 28px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background .2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#D4FF26")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#C8FF00")}
              >
                Join as candidate <ChevronRight size={14} />
              </button>
              <button
                onClick={() => navigate("auth", "employee")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  color: "#A09E9A",
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "14px 28px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all .2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#E8E6E1";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#A09E9A";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                Join as referrer <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: "28px 2rem",
            marginTop: 80,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#C8FF00",
              }}
            >
              RefHire
            </span>
            <span style={{ fontSize: 11, color: "#3D3B38" }}>
              Privacy-first referral infrastructure
            </span>
          </div>
        </footer>
      </motion.div>
    </>
  );
}