import type * as THREE from 'three';
import { CalibrationPattern } from './CalibrationPattern';

const WALL = { width: 2.4, height: 1.35, y: 1.35, z: -3 };
const BOX = {
  width: 0.8,
  height: 0.45,
  depth: 0.35,
  x: 0,
  y: 1.05,
  z: -2.45,
};

export function SceneContent({
  texture,
  calibration,
}: {
  texture: THREE.Texture | null;
  calibration: boolean;
}) {
  return (
    <>
      <color attach="background" args={['#000000']} />

      <mesh position={[0, WALL.y, WALL.z]}>
        <planeGeometry args={[WALL.width, WALL.height]} />
        <meshBasicMaterial color="#050505" />
      </mesh>

      <mesh position={[BOX.x, BOX.y, BOX.z]}>
        <boxGeometry args={[BOX.width, BOX.height, BOX.depth]} />
        <meshBasicMaterial attach="material-0" color="#161616" />
        <meshBasicMaterial attach="material-1" color="#161616" />
        <meshBasicMaterial attach="material-2" color="#1d1d1d" />
        <meshBasicMaterial attach="material-3" color="#0d0d0d" />
        <meshBasicMaterial
          attach="material-4"
          map={texture ?? undefined}
          color={texture ? '#ffffff' : '#ff3b3b'}
          toneMapped={false}
        />
        <meshBasicMaterial attach="material-5" color="#101010" />
      </mesh>

      {calibration ? (
        <>
          <CalibrationPattern />
          <mesh position={[BOX.x, BOX.y, BOX.z]}>
            <boxGeometry
              args={[BOX.width + 0.01, BOX.height + 0.01, BOX.depth + 0.01]}
            />
            <meshBasicMaterial
              color="#00ffb0"
              wireframe
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
        </>
      ) : null}
    </>
  );
}
