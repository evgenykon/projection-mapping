export type Vec3 = [number, number, number];

export interface ProjectorConfig {
  position: Vec3;
  rotation: Vec3;
  fov: number;
}

export interface SyncState {
  projector: ProjectorConfig;
  playing: boolean;
  blackout: boolean;
  calibration: boolean;
  videoUrl: string;
}

export type SyncMessage =
  | { type: 'state'; state: SyncState }
  | { type: 'hello' }
  | { type: 'ready' };
