import type { ProjectorConfig } from '../types';

export const DEFAULT_PROJECTOR: ProjectorConfig = {
  position: [0, 1.2, 6],
  rotation: [0, 0, 0],
  fov: 30,
};

export function createDefaultProjector(): ProjectorConfig {
  return {
    position: [...DEFAULT_PROJECTOR.position],
    rotation: [...DEFAULT_PROJECTOR.rotation],
    fov: DEFAULT_PROJECTOR.fov,
  };
}
