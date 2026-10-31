import { Canvas } from '@react-three/fiber';
import type * as THREE from 'three';
import type { ProjectorConfig, SceneObject } from '../types';
import { ProjectorCamera } from './ProjectorCamera';
import { SceneObjects } from './SceneObjects';

export function ProjectorView({
  projector,
  objects,
  texture,
  selectedId,
  showWireframe,
  calibration,
}: {
  projector: ProjectorConfig;
  objects: SceneObject[];
  texture: THREE.Texture | null;
  selectedId: string | null;
  showWireframe: boolean;
  calibration: boolean;
}) {
  return (
    <Canvas
      camera={{ position: projector.position, fov: projector.fov }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <ProjectorCamera config={projector} />
      <SceneObjects
        objects={objects}
        texture={texture}
        selectedId={selectedId}
        showWireframe={showWireframe}
        calibration={calibration}
      />
    </Canvas>
  );
}
