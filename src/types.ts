export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Quad = [Vec2, Vec2, Vec2, Vec2];

export interface ProjectorConfig {
  position: Vec3;
  rotation: Vec3;
  fov: number;
}

export type ObjectKind = 'plane' | 'box' | 'cylinder' | 'sphere' | 'glb';
export type ObjectContent = 'none' | 'video' | 'image' | 'text';
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

export interface ObjectEffects {
  opacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  scanline: number;
}

export interface TextStyle {
  text: string;
  color: string;
  size: number;
  background: string;
  transparent: boolean;
  align: 'left' | 'center' | 'right';
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
  effects: ObjectEffects;
  text: TextStyle;
  visible: boolean;
  locked: boolean;
  mask: Vec2[] | null;
  imageUrl: string;
  videoUrl: string;
  glbUrl?: string;
}

export interface KeyframeValues {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  visible: boolean;
  effects: ObjectEffects;
}

export interface Keyframe {
  id: string;
  time: number;
  values: KeyframeValues;
}

export interface Scenario {
  id: string;
  name: string;
  duration: number;
  tracks: Record<string, Keyframe[]>;
}

export interface SyncState {
  projector: ProjectorConfig;
  objects: SceneObject[];
  scenarios: Scenario[];
  activeScenarioId: string;
  currentTime: number;
  loop: boolean;
  quad: Quad;
  selectedId: string | null;
  showWireframe: boolean;
  playing: boolean;
  blackout: boolean;
  calibration: boolean;
  videoUrl: string;
}

export type ControlAction = 'play' | 'pause' | 'stop' | 'blackout';

export type SyncMessage =
  | { type: 'state'; state: SyncState }
  | { type: 'hello' }
  | { type: 'ready' }
  | { type: 'control'; action: ControlAction };
