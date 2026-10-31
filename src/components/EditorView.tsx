import { Canvas } from '@react-three/fiber';
import { Grid, Line, OrbitControls } from '@react-three/drei';
import type * as THREE from 'three';
import { SceneContent } from './SceneContent';

function WallGuide() {
  return (
    <>
      <mesh position={[0, 1.35, -2.998]}>
        <planeGeometry args={[2.4, 1.35]} />
        <meshBasicMaterial color="#0b111a" />
      </mesh>
      <Line
        points={[
          [-1.2, 0.675, -2.997],
          [1.2, 0.675, -2.997],
          [1.2, 2.025, -2.997],
          [-1.2, 2.025, -2.997],
          [-1.2, 0.675, -2.997],
        ]}
        color="#38bdf8"
        lineWidth={1}
        transparent
        opacity={0.35}
      />
    </>
  );
}

function ProjectorGizmo() {
  return (
    <>
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[0.12, 0.08, 0.12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <Line
        points={[
          [0, 1.35, 0],
          [0, 1.35, -3],
        ]}
        color="#38bdf8"
        lineWidth={1}
        dashed
        dashSize={0.08}
        gapSize={0.05}
        transparent
        opacity={0.6}
      />
    </>
  );
}

export function EditorView({ texture }: { texture: THREE.Texture | null }) {
  return (
    <Canvas
      camera={{ position: [1.9, 1.75, 0.9], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#080b10']} />
      <SceneContent texture={texture} calibration={false} />
      <WallGuide />
      <Grid
        args={[10, 10]}
        position={[0, 0, -1.5]}
        cellSize={0.25}
        cellThickness={0.5}
        cellColor="#1b2433"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#2b3a50"
        fadeDistance={16}
        fadeStrength={1}
      />
      <axesHelper args={[1]} />
      <ProjectorGizmo />
      <OrbitControls
        target={[0, 1.1, -2.4]}
        minDistance={0.6}
        maxDistance={10}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
