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
import { useTextTexture } from '../lib/useTextTexture';
import { useImageTexture } from '../lib/useImageTexture';
import { ProjectionMaterial } from './ProjectionMaterial';

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

function ContentMaterial({
  object,
  texture,
  side,
}: {
  object: SceneObject;
  texture: THREE.Texture | null;
  side: THREE.Side;
}) {
  const alphaMap = useMaskTexture(object.mask);
  const aspect =
    object.kind === 'sphere'
      ? 2
      : object.kind === 'cylinder'
        ? (2 * Math.PI * Math.max(object.size.radiusTop, object.size.radiusBottom)) /
          object.size.height
        : object.size.width / object.size.height;
  const textTexture = useTextTexture(object.text, aspect);
  const imageTexture = useImageTexture(
    object.content === 'image' ? object.imageUrl : '',
  );
  const map =
    object.content === 'video'
      ? texture
      : object.content === 'image'
        ? imageTexture
        : object.content === 'text'
          ? textTexture
          : null;
  const color = object.content === 'none' ? object.color : '#ffffff';
  return (
    <ProjectionMaterial
      map={map}
      alphaMap={alphaMap}
      color={color}
      effects={object.effects}
      side={side}
    />
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
        <mesh>
          <planeGeometry args={[object.size.width, object.size.height]} />
          <ContentMaterial object={object} texture={texture} side={THREE.DoubleSide} />
        </mesh>
      ) : null}

      {object.kind === 'box' ? (
        <>
          <mesh>
            <boxGeometry
              args={[object.size.width, object.size.height, object.size.depth]}
            />
            {object.content === 'none' ? (
              <ContentMaterial object={object} texture={texture} side={THREE.FrontSide} />
            ) : (
              <meshBasicMaterial color={object.color} />
            )}
          </mesh>
          {object.content !== 'none' ? (
            <mesh position={[0, 0, object.size.depth / 2 + 0.002]}>
              <planeGeometry args={[object.size.width, object.size.height]} />
              <ContentMaterial object={object} texture={texture} side={THREE.FrontSide} />
            </mesh>
          ) : null}
        </>
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
          <ContentMaterial object={object} texture={texture} side={THREE.FrontSide} />
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
          <ContentMaterial object={object} texture={texture} side={THREE.FrontSide} />
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
