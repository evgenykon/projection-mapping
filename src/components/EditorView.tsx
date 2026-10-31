import { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, Line, OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import type { GizmoMode, ProjectorConfig, SceneObject, Vec3 } from '../types';
import { SceneObjects } from './SceneObjects';

const RAD = 180 / Math.PI;

function ProjectorGizmo({ projector }: { projector: ProjectorConfig }) {
  const target: [number, number, number] = [0, 1.2, 0];
  return (
    <>
      <mesh position={projector.position}>
        <boxGeometry args={[0.22, 0.16, 0.22]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <Line
        points={[projector.position, target]}
        color="#38bdf8"
        lineWidth={1}
        dashed
        dashSize={0.15}
        gapSize={0.1}
        transparent
        opacity={0.6}
      />
    </>
  );
}

export function EditorView({
  objects,
  projector,
  texture,
  selectedId,
  showWireframe,
  gizmoMode,
  selectedLocked,
  onSelect,
  onTransform,
}: {
  objects: SceneObject[];
  projector: ProjectorConfig;
  texture: THREE.Texture | null;
  selectedId: string | null;
  showWireframe: boolean;
  gizmoMode: GizmoMode;
  selectedLocked: boolean;
  onSelect: (id: string | null) => void;
  onTransform: (
    id: string,
    patch: Pick<SceneObject, 'position' | 'rotation' | 'scale'>,
  ) => void;
}) {
  const [selectedGroup, setSelectedGroup] = useState<THREE.Group | null>(null);

  const handleObjectChange = useCallback(() => {
    if (!selectedGroup || !selectedId) {
      return;
    }
    const position: Vec3 = [
      selectedGroup.position.x,
      selectedGroup.position.y,
      selectedGroup.position.z,
    ];
    const rotation: Vec3 = [
      selectedGroup.rotation.x * RAD,
      selectedGroup.rotation.y * RAD,
      selectedGroup.rotation.z * RAD,
    ];
    const scale: Vec3 = [
      selectedGroup.scale.x,
      selectedGroup.scale.y,
      selectedGroup.scale.z,
    ];
    onTransform(selectedId, { position, rotation, scale });
  }, [onTransform, selectedGroup, selectedId]);

  return (
    <Canvas
      camera={{ position: [5, 3.5, 8], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={['#080b10']} />
      <SceneObjects
        objects={objects}
        texture={texture}
        selectedId={selectedId}
        showWireframe={showWireframe}
        calibration={false}
        interactive
        onSelect={(id) => onSelect(id)}
        onSelectedGroup={setSelectedGroup}
      />
      <Grid
        args={[14, 14]}
        position={[0, 0, 0]}
        cellSize={0.25}
        cellThickness={0.5}
        cellColor="#1b2433"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#2b3a50"
        fadeDistance={22}
        fadeStrength={1}
      />
      <axesHelper args={[1]} />
      <ProjectorGizmo projector={projector} />
      {selectedGroup && selectedId && !selectedLocked ? (
        <TransformControls
          object={selectedGroup}
          mode={gizmoMode}
          size={0.8}
          onObjectChange={handleObjectChange}
        />
      ) : null}
      <OrbitControls
        makeDefault
        target={[0, 1.2, 0]}
        minDistance={1}
        maxDistance={20}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
