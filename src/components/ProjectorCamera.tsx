import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import type { ProjectorConfig } from '../types';

const DEG = Math.PI / 180;

export function ProjectorCamera({ config }: { config: ProjectorConfig }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;

  useLayoutEffect(() => {
    camera.position.set(...config.position);
    camera.rotation.set(
      config.rotation[0] * DEG,
      config.rotation[1] * DEG,
      config.rotation[2] * DEG,
    );
    camera.fov = config.fov;
    camera.near = 0.05;
    camera.far = 100;
    camera.updateProjectionMatrix();
  }, [camera, config]);

  return null;
}
