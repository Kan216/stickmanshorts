/**
 * Three.js example via @remotion/three — a glowing 3D orb and a field of
 * floating particles, used as a backdrop / hero object behind 2D stickmen.
 *
 * Rules for Three.js in Remotion:
 *  - Drive EVERYTHING from useCurrentFrame() — never useFrame()/clocks.
 *  - No Math.random() — use rand(seed) so every render is identical.
 *  - <ThreeCanvas> needs explicit width/height.
 *  - Render with --gl=angle (set in remotion.config.ts) in headless envs.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { rand } from "../lib/anim";
import { Stickman } from "../components/Stickman";
import { Headline } from "../components/Text";
import { Backdrop, Watermark, Vignette } from "../components/Scene";
import { addPose, breathe, poseAt, POSES } from "../lib/pose";
import { LAYOUT } from "../lib/theme";

const Particles3D: React.FC<{ frame: number }> = ({ frame }) => {
  const positions = useMemo(() => {
    const arr = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      arr[i * 3] = (rand(i) - 0.5) * 12;
      arr[i * 3 + 1] = (rand(i + 1000) - 0.5) * 20;
      arr[i * 3 + 2] = (rand(i + 2000) - 0.5) * 8;
    }
    return arr;
  }, []);
  return (
    <points rotation={[0, frame * 0.004, 0]} position={[0, (frame * 0.01) % 2, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#f2c14e" transparent opacity={0.6} />
    </points>
  );
};

export const OrbOfLight3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const grow = interpolate(frame, [30, 90], [0.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 1 + Math.sin(frame / 8) * 0.04;
  const pose = addPose(
    poseAt(frame, [
      { f: 0, pose: POSES.slump },
      { f: 40, pose: POSES.stand },
      { f: 70, pose: POSES.reachUp },
    ]),
    breathe(frame),
  );
  return (
    <AbsoluteFill>
      <Backdrop mood="dusk" stars={60} />
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[0, 2.2, 3]} intensity={30 * grow} color="#ffd27a" />
          <mesh position={[0, 2.2, 0]} scale={grow * pulse} rotation={[frame * 0.01, frame * 0.02, 0]}>
            <icosahedronGeometry args={[0.9, 3]} />
            <meshStandardMaterial color="#f2c14e" emissive={new THREE.Color("#f2a83e")} emissiveIntensity={1.4} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.2, -0.1]} scale={grow * 2.2}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color="#f2c14e" transparent opacity={0.08} />
          </mesh>
          <Particles3D frame={frame} />
        </ThreeCanvas>
      </AbsoluteFill>
      <Stickman x={360} y={LAYOUT.groundY} height={300} pose={pose} color="white" expression={frame > 60 ? "happy" : "sad"} />
      <Headline text="{gold:HOPE} IS A LIGHT YOU REACH FOR." start={20} size={38} />
      <Watermark step={1} />
      <Vignette />
    </AbsoluteFill>
  );
};
