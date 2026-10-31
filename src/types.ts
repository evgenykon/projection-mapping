export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export interface ProjectorConfig {
  position: Vec3;
  rotation: Vec3;
  fov: number;
}

export type ObjectKind = 'plane' | 'box' | 'cylinder' | 'sphere' | 'glb';
export type ObjectContent = 'none' | 'video';
export type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface ObjectSize {
  width: number;
  height: number;
  depth: number;
  radius: number;
  radiusTop: number;
  radiusBottom: number;
  segments: number;
}

export interface SceneObject {
  id: string;
  name: string;
  kind: ObjectKind;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  size: ObjectSize;
  color: string;
  content: ObjectContent;
  visible: boolean;
  locked: boolean;
  mask: Vec2[] | null;
  glbUrl?: string;
}

export interface SyncState {
  projector: ProjectorConfig;
  objects: SceneObject[];
  selectedId: string | null;
  showWireframe: boolean;
  playing: boolean;
  blackout: boolean;
  calibration: boolean;
  videoUrl: string;
}

export type SyncMessage =
  | { type: 'state'; state: SyncState }
  | { type: 'hello' }
  | { type: 'ready' };
