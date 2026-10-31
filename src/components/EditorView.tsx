import { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, Line, OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import type { GizmoMode, SceneObject, Vec3 } from '../types';
import { SceneObjects } from './SceneObjects';

const RAD = 180 / Math.PI;

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

export function EditorView({
  objects,
  texture,
  selectedId,
  showWireframe,
  gizmoMode,
  selectedLocked,
  onSelect,
  onTransform,
}: {
  objects: SceneObject[];
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
      camera={{ position: [1.9, 1.75, 0.9], fov: 50 }}
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
        target={[0, 1.1, -2.4]}
        minDistance={0.6}
        maxDistance={10}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
