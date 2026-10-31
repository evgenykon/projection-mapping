import { Canvas } from '@react-three/fiber';
import type * as THREE from 'three';
import type { ProjectorConfig } from '../types';
import { ProjectorCamera } from './ProjectorCamera';
import { SceneContent } from './SceneContent';

export function ProjectorView({
  projector,
  texture,
  calibration,
}: {
  projector: ProjectorConfig;
  texture: THREE.Texture | null;
  calibration: boolean;
}) {
  return (
    <Canvas
      camera={{ position: projector.position, fov: projector.fov }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <ProjectorCamera config={projector} />
      <SceneContent texture={texture} calibration={calibration} />
    </Canvas>
  );
}
