import { create } from 'zustand';
import type {
  GizmoMode,
  ObjectKind,
  ObjectSize,
  ProjectorConfig,
  SceneObject,
  SyncState,
  Vec3,
} from './types';

export const DEFAULT_PROJECTOR: ProjectorConfig = {
  position: [0, 1.35, 0],
  rotation: [0, 0, 0],
  fov: 25.36,
};

const DEFAULT_SIZE: ObjectSize = {
  width: 0.5,
  height: 0.5,
  depth: 0.5,
  radius: 0.3,
  radiusTop: 0.25,
  radiusBottom: 0.25,
  segments: 32,
};

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `obj-${Math.random().toString(36).slice(2, 10)}`;
}

export const DEFAULT_OBJECTS: SceneObject[] = [
  {
    id: 'wall',
    name: 'Wall',
    kind: 'plane',
    position: [0, 1.35, -3],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    size: { ...DEFAULT_SIZE, width: 2.4, height: 1.35 },
    color: '#050505',
    content: 'none',
    visible: true,
    locked: false,
    mask: null,
  },
  {
    id: 'video-box',
    name: 'Video box',
    kind: 'box',
    position: [0, 1.05, -2.45],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    size: { ...DEFAULT_SIZE, width: 0.8, height: 0.45, depth: 0.35 },
    color: '#161616',
    content: 'video',
    visible: true,
    locked: false,
    mask: null,
  },
];

export function createObject(kind: ObjectKind): SceneObject {
  const id = createId();
  const x = 0.55;
  const z = -2.2;
  const base = {
    id,
    rotation: [0, 0, 0] as Vec3,
    scale: [1, 1, 1] as Vec3,
    size: { ...DEFAULT_SIZE },
    content: 'none' as const,
    visible: true,
    locked: false,
    mask: null,
  };

  switch (kind) {
    case 'plane':
      return {
        ...base,
        name: 'Plane',
        kind,
        position: [x, 1.35, z],
        size: { ...base.size, width: 0.8, height: 0.45 },
        color: '#1d4ed8',
      };
    case 'box':
      return {
        ...base,
        name: 'Box',
        kind,
        position: [x, 1.05, z],
        color: '#b91c1c',
      };
    case 'cylinder':
      return {
        ...base,
        name: 'Cylinder',
        kind,
        position: [x, 1.05, z],
        size: {
          ...base.size,
          radiusTop: 0.22,
          radiusBottom: 0.22,
          height: 0.5,
        },
        color: '#047857',
      };
    case 'sphere':
      return {
        ...base,
        name: 'Sphere',
        kind,
        position: [x, 1.1, z],
        size: { ...base.size, radius: 0.28 },
        color: '#7c3aed',
      };
    case 'glb':
      return {
        ...base,
        name: 'GLB model',
        kind,
        position: [x, 1.05, z],
        color: '#e5e7eb',
        glbUrl: '',
      };
  }
}

type ObjectPatch = Partial<Omit<SceneObject, 'id' | 'size'>> & {
  size?: Partial<ObjectSize>;
};

interface AppStore extends SyncState {
  gizmoMode: GizmoMode;
  maskEditingId: string | null;
  setProjector: (patch: Partial<ProjectorConfig>) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleCalibration: () => void;
  toggleBlackout: () => void;
  toggleWireframe: () => void;
  resetProjector: () => void;
  setVideoUrl: (url: string) => void;
  setGizmoMode: (mode: GizmoMode) => void;
  setMaskEditing: (id: string | null) => void;
  selectObject: (id: string | null) => void;
  addObject: (kind: ObjectKind) => void;
  removeObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  updateObject: (id: string, patch: ObjectPatch) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  projector: DEFAULT_PROJECTOR,
  objects: DEFAULT_OBJECTS,
  selectedId: 'video-box',
  showWireframe: false,
  playing: false,
  blackout: false,
  calibration: false,
  videoUrl: './sample.mp4',
  gizmoMode: 'translate',
  maskEditingId: null,
  setProjector: (patch) =>
    set((state) => ({ projector: { ...state.projector, ...patch } })),
  play: () => set({ playing: true, blackout: false }),
  pause: () => set({ playing: false }),
  stop: () => set({ playing: false, blackout: false }),
  toggleCalibration: () => set((state) => ({ calibration: !state.calibration })),
  toggleBlackout: () => set((state) => ({ blackout: !state.blackout })),
  toggleWireframe: () =>
    set((state) => ({ showWireframe: !state.showWireframe })),
  resetProjector: () => set({ projector: DEFAULT_PROJECTOR }),
  setVideoUrl: (videoUrl) => set({ videoUrl }),
  setGizmoMode: (gizmoMode) => set({ gizmoMode }),
  setMaskEditing: (maskEditingId) => set({ maskEditingId }),
  selectObject: (selectedId) => set({ selectedId }),
  addObject: (kind) =>
    set((state) => {
      const object = createObject(kind);
      return {
        objects: [...state.objects, object],
        selectedId: object.id,
      };
    }),
  removeObject: (id) =>
    set((state) => {
      const objects = state.objects.filter((object) => object.id !== id);
      return {
        objects,
        selectedId:
          state.selectedId === id
            ? (objects[0]?.id ?? null)
            : state.selectedId,
      };
    }),
  duplicateObject: (id) =>
    set((state) => {
      const source = state.objects.find((object) => object.id === id);
      if (!source) {
        return state;
      }
      const copy: SceneObject = {
        ...source,
        id: createId(),
        name: `${source.name} copy`,
        size: { ...source.size },
        position: [
          source.position[0] + 0.12,
          source.position[1],
          source.position[2],
        ],
        rotation: [...source.rotation] as Vec3,
        scale: [...source.scale] as Vec3,
      };
      return {
        objects: [...state.objects, copy],
        selectedId: copy.id,
      };
    }),
  updateObject: (id, patch) =>
    set((state) => ({
      objects: state.objects.map((object) => {
        if (object.id !== id) {
          return object;
        }
        return {
          ...object,
          ...patch,
          size: patch.size
            ? { ...object.size, ...patch.size }
            : object.size,
        };
      }),
    })),
}));

export function getSyncState(): SyncState {
  const state = useAppStore.getState();
  return {
    projector: state.projector,
    objects: state.objects,
    selectedId: state.selectedId,
    showWireframe: state.showWireframe,
    playing: state.playing,
    blackout: state.blackout,
    calibration: state.calibration,
    videoUrl: state.videoUrl,
  };
}
