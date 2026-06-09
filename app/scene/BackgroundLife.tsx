"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────
// Tiny background life for the cosmic scene — the odd slow shooting star with a
// round-dot tail, falling from high and far. Deliberately sparse and small:
// atmosphere, never a focal point (#8).
// ─────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const STAR_SIZE = 0.16;

// Round glow — shared by the shooting-star head + tail dots (nothing square).
let _glowTex: THREE.CanvasTexture | null = null;
function getGlowTexture(): THREE.CanvasTexture {
  if (_glowTex) return _glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}

// One shooting star: a small round dot that falls slowly from high & far,
// trailing a short tail of progressively smaller/dimmer round dots (sampled
// from its recent positions). Rests a random gap between falls.
const TAIL = 7;
const TAIL_GAP = 2; // frames between sampled tail positions

function ShootingStar({ seed }: { seed: number }) {
  const headRef = useRef<THREE.Sprite>(null);
  const tailRefs = useRef<(THREE.Sprite | null)[]>([]);
  const hist = useRef<THREE.Vector3[]>(
    Array.from({ length: TAIL * TAIL_GAP + 1 }, () => new THREE.Vector3()),
  );
  const s = useRef({
    active: false,
    timer: 2 + seed * 3 + Math.random() * 5,
    age: 0,
    life: 3,
    vx: 0,
    vy: 0,
  });

  const setVisible = (v: boolean) => {
    if (headRef.current) headRef.current.visible = v;
    for (const t of tailRefs.current) if (t) t.visible = v;
  };

  const spawn = () => {
    const st = s.current;
    st.active = true;
    st.age = 0;
    st.life = rand(2.4, 3.6);
    st.vx = rand(-1.4, 1.4);
    st.vy = -rand(2.4, 3.6); // slow downward fall
    const start = new THREE.Vector3(rand(-10, 10), rand(6, 9), rand(-16, -22));
    for (const v of hist.current) v.copy(start); // collapse the tail at spawn
  };

  useFrame((_, dt) => {
    const head = headRef.current;
    if (!head) return;
    const st = s.current;

    if (!st.active) {
      st.timer -= dt;
      setVisible(false);
      if (st.timer <= 0) spawn();
      return;
    }
    st.age += dt;
    if (st.age >= st.life) {
      st.active = false;
      st.timer = rand(5, 11);
      setVisible(false);
      return;
    }
    setVisible(true);

    // Advance the head, then push its position to the front of the history ring
    // (older positions shift back → the tail dots sample them).
    const h = hist.current;
    for (let i = h.length - 1; i > 0; i--) h[i].copy(h[i - 1]);
    h[0].set(
      head.position.x + st.vx * dt,
      head.position.y + st.vy * dt,
      head.position.z,
    );
    head.position.copy(h[0]);

    const tn = st.age / st.life;
    const env = Math.min(1, tn / 0.3) * Math.min(1, (1 - tn) / 0.6);
    (head.material as THREE.SpriteMaterial).opacity = env;

    for (let i = 0; i < TAIL; i++) {
      const sp = tailRefs.current[i];
      if (!sp) continue;
      sp.position.copy(h[(i + 1) * TAIL_GAP]);
      const k = 1 - (i + 1) / (TAIL + 1); // fades & shrinks down the tail
      const sz = STAR_SIZE * k * 0.85;
      sp.scale.set(sz, sz, 1);
      (sp.material as THREE.SpriteMaterial).opacity = env * k * 0.7;
    }
  });

  return (
    <group>
      <sprite ref={headRef} scale={[STAR_SIZE, STAR_SIZE, 1]} visible={false}>
        <spriteMaterial
          map={getGlowTexture()}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {Array.from({ length: TAIL }).map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            tailRefs.current[i] = el;
          }}
          visible={false}
        >
          <spriteMaterial
            map={getGlowTexture()}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}

export function BackgroundLife() {
  return (
    <>
      <ShootingStar seed={0} />
      <ShootingStar seed={1} />
    </>
  );
}
