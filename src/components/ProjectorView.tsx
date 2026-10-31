import { Canvas } from '@react-three/fiber';
import type * as THREE from 'three';
import type { ProjectorConfig, Quad, SceneObject, Vec2 } from '../types';
import { ProjectorCamera } from './ProjectorCamera';
import { SceneObjects } from './SceneObjects';
import { WarpedStage } from './WarpedStage';

export function ProjectorView({
  projector,
  objects,
  texture,
  playing,
  selectedId,
  showWireframe,
  calibration,
  quad,
  editable = false,
  onQuadChange,
}: {
  projector: ProjectorConfig;
  objects: SceneObject[];
  texture: THREE.Texture | null;
  playing: boolean;
  selectedId: string | null;
  showWireframe: boolean;
  calibration: boolean;
  quad: Quad;
  editable?: boolean;
  onQuadChange?: (index: number, point: Vec2) => void;
}) {
  return (
    <WarpedStage quad={quad} editable={editable} onQuadChange={onQuadChange}>
      <Canvas
        camera={{ position: projector.position, fov: projector.fov }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <ProjectorCamera config={projector} />
        <SceneObjects
          objects={objects}
          texture={texture}
          playing={playing}
          selectedId={selectedId}
          showWireframe={showWireframe}
          calibration={calibration}
        />
      </Canvas>
    </WarpedStage>
  );
}
