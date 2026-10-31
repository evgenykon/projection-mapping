import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneObject } from '../types';
import { CalibrationPattern } from './CalibrationPattern';
import { useMaskTexture } from '../lib/useMaskTexture';

const DEG = Math.PI / 180;

function GlbPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[0.45, 0.45, 0.45]} />
      <meshBasicMaterial color="#475569" wireframe />
    </mesh>
  );
}

function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clone} />;
}

class GlbErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#ef4444" wireframe />
        </mesh>
      );
    }
    return this.props.children;
  }
}

function GlbObject({ url }: { url: string }) {
  if (!url.trim()) {
    return <GlbPlaceholder />;
  }
  return (
    <GlbErrorBoundary>
      <Suspense fallback={<GlbPlaceholder />}>
        <GlbModel url={url} />
      </Suspense>
    </GlbErrorBoundary>
  );
}

function WireframeOverlay({ target }: { target: THREE.Object3D }) {
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0x00ffb0,
        transparent: true,
        opacity: 0.8,
        depthTest: false,
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    target.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry || mesh.userData.__pmWireframe) {
        return;
      }
      const line = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry, 15),
        material,
      );
      line.name = '__pm_wireframe';
      line.renderOrder = 999;
      mesh.userData.__pmWireframe = true;
      mesh.add(line);
    });
  });

  useEffect(
    () => () => {
      target.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || !mesh.userData.__pmWireframe) {
          return;
        }
        const line = mesh.getObjectByName('__pm_wireframe') as
          | THREE.LineSegments
          | undefined;
        if (line) {
          line.removeFromParent();
          line.geometry.dispose();
        }
        mesh.userData.__pmWireframe = false;
      });
    },
    [target],
  );

  return null;
}

function PlaneSurface({
  object,
  video,
  contentColor,
}: {
  object: SceneObject;
  video: THREE.Texture | undefined;
  contentColor: string;
}) {
  const alphaMap = useMaskTexture(object.mask);
  return (
    <mesh>
      <planeGeometry args={[object.size.width, object.size.height]} />
      <meshBasicMaterial
        map={video}
        color={contentColor}
        alphaMap={alphaMap ?? undefined}
        transparent={Boolean(alphaMap)}
        alphaTest={alphaMap ? 0.5 : 0}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function ObjectView({
  object,
  texture,
  groupRef,
  interactive,
  onSelect,
}: {
  object: SceneObject;
  texture: THREE.Texture | null;
  groupRef?: (node: THREE.Group | null) => void;
  interactive: boolean;
  onSelect?: (id: string) => void;
}) {
  const rotation = object.rotation.map((value) => value * DEG) as [
    number,
    number,
    number,
  ];
  const video = object.content === 'video' && texture ? texture : undefined;
  const contentColor = video ? '#ffffff' : object.color;

  const handleClick = interactive
    ? (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect?.(object.id);
      }
    : undefined;

  return (
    <group
      ref={groupRef}
      name={object.name}
      position={object.position}
      rotation={rotation}
      scale={object.scale}
      onClick={handleClick}
    >
      {object.kind === 'plane' ? (
        <PlaneSurface
          object={object}
          video={video}
          contentColor={contentColor}
        />
      ) : null}

      {object.kind === 'box' ? (
        <mesh>
          <boxGeometry
            args={[object.size.width, object.size.height, object.size.depth]}
          />
          <meshBasicMaterial attach="material-0" color={object.color} />
          <meshBasicMaterial attach="material-1" color={object.color} />
          <meshBasicMaterial attach="material-2" color={object.color} />
          <meshBasicMaterial attach="material-3" color={object.color} />
          <meshBasicMaterial
            attach="material-4"
            map={video}
            color={contentColor}
            toneMapped={false}
          />
          <meshBasicMaterial attach="material-5" color={object.color} />
        </mesh>
      ) : null}

      {object.kind === 'cylinder' ? (
        <mesh>
          <cylinderGeometry
            args={[
              object.size.radiusTop,
              object.size.radiusBottom,
              object.size.height,
              object.size.segments,
            ]}
          />
          <meshBasicMaterial
            map={video}
            color={contentColor}
            toneMapped={false}
          />
        </mesh>
      ) : null}

      {object.kind === 'sphere' ? (
        <mesh>
          <sphereGeometry
            args={[
              object.size.radius,
              object.size.segments,
              Math.max(16, Math.floor(object.size.segments / 2)),
            ]}
          />
          <meshBasicMaterial
            map={video}
            color={contentColor}
            toneMapped={false}
          />
        </mesh>
      ) : null}

      {object.kind === 'glb' ? <GlbObject url={object.glbUrl ?? ''} /> : null}
    </group>
  );
}

export function SceneObjects({
  objects,
  texture,
  selectedId,
  showWireframe,
  calibration,
  interactive = false,
  onSelect,
  onSelectedGroup,
}: {
  objects: SceneObject[];
  texture: THREE.Texture | null;
  selectedId: string | null;
  showWireframe: boolean;
  calibration: boolean;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onSelectedGroup?: (group: THREE.Group | null) => void;
}) {
  const [selectedGroup, setSelectedGroup] = useState<THREE.Group | null>(null);

  const selectionRef = useCallback(
    (node: THREE.Group | null) => {
      setSelectedGroup(node);
      onSelectedGroup?.(node);
    },
    [onSelectedGroup],
  );

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 4, 3]} intensity={1.6} />

      {objects.map((object) =>
        object.visible ? (
          <ObjectView
            key={object.id}
            object={object}
            texture={texture}
            groupRef={object.id === selectedId ? selectionRef : undefined}
            interactive={interactive}
            onSelect={onSelect}
          />
        ) : null,
      )}

      {calibration ? <CalibrationPattern /> : null}
      {showWireframe && selectedGroup ? (
        <WireframeOverlay target={selectedGroup} />
      ) : null}
    </>
  );
}
