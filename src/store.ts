import { create } from 'zustand';
import { createDefaultProjector } from './lib/projection';
import type {
  GizmoMode,
  Keyframe,
  KeyframeValues,
  ObjectEffects,
  SceneObject,
  Scenario,
  SyncMessage,
  Quad,
  SyncState,
  TextStyle,
  Vec2,
  Vec3,
} from './types';

export const DEFAULT_EFFECTS: ObjectEffects = {
  opacity: 1,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hue: 0,
  scanline: 0,
};

export const DEFAULT_QUAD: Quad = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

export const DEFAULT_TEXT: TextStyle = {
  text: 'ПРОЕКЦИЯ',
  color: '#ffffff',
  size: 18,
  background: '#000000',
  transparent: true,
  align: 'center',
};

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function normalizeState(raw: Partial<SyncState>): SyncState {
  const objects = Array.isArray(raw.objects)
    ? raw.objects.map((object) => ({
        ...object,
        effects: { ...DEFAULT_EFFECTS, ...(object.effects ?? {}) },
        text: { ...DEFAULT_TEXT, ...(object.text ?? {}) },
        mask: Array.isArray(object.mask) ? object.mask : null,
        imageUrl: object.imageUrl ?? '',
        locked: Boolean(object.locked),
        visible: object.visible !== false,
      }))
    : createDefaultObjects();
  const scenarios = Array.isArray(raw.scenarios)
    ? raw.scenarios.map((scenario) => ({
        ...scenario,
        tracks: scenario.tracks ?? {},
      }))
    : createDefaultScenarios();
  return {
    projector: { ...createDefaultProjector(), ...(raw.projector ?? {}) },
    objects,
    scenarios,
    activeScenarioId: raw.activeScenarioId ?? scenarios[0]?.id ?? '',
    currentTime: raw.currentTime ?? 0,
    loop: raw.loop ?? true,
    quad: raw.quad ?? DEFAULT_QUAD,
    selectedId: raw.selectedId ?? null,
    showWireframe: raw.showWireframe ?? true,
    playing: raw.playing ?? false,
    blackout: raw.blackout ?? false,
    calibration: raw.calibration ?? false,
    videoUrl: raw.videoUrl ?? './sample.mp4',
  };
}

export type ObjectPatch = Partial<Omit<SceneObject, 'size'>> & {
  size?: Partial<SceneObject['size']>;
};

export interface Store extends SyncState {
  gizmoMode: GizmoMode;
  maskEditingId: string | null;
  setGizmoMode: (mode: GizmoMode) => void;
  setMaskEditing: (id: string | null) => void;
  selectObject: (id: string | null) => void;
  removeObject: (id: string) => void;
  toggleCalibration: () => void;
  toggleWireframe: () => void;
  toggleBlackout: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  resetProjector: () => void;
  setProjector: (projector: Partial<SyncState['projector']>) => void;
  updateObject: (id: string, patch: ObjectPatch) => void;
  updateEffects: (id: string, patch: Partial<ObjectEffects>) => void;
  updateText: (id: string, patch: Partial<TextStyle>) => void;
  setSelected: (id: string | null) => void;
  addObject: (kind: SceneObject['kind']) => void;
  deleteObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;
  setMask: (id: string, mask: Vec2[] | null) => void;
  setShowWireframe: (value: boolean) => void;
  setBlackout: (value: boolean) => void;
  setCalibration: (value: boolean) => void;
  setPlaying: (value: boolean) => void;
  setCurrentTime: (value: number) => void;
  setLoop: (value: boolean) => void;
  setQuadPoint: (index: number, point: Vec2) => void;
  resetQuad: () => void;
  setActiveScenario: (id: string) => void;
  addScenario: (name?: string) => void;
  updateScenario: (id: string, patch: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;
  addKeyframe: (objectId: string, time: number, values?: KeyframeValues) => void;
  updateKeyframe: (objectId: string, keyframeId: string, patch: Partial<Keyframe>) => void;
  deleteKeyframe: (objectId: string, keyframeId: string) => void;
  setVideoUrl: (url: string) => void;
  loadScene: (state: SyncState) => void;
  newScene: () => void;
  replaceState: (state: SyncState) => void;
  send: ((message: SyncMessage) => void) | null;
}

function defaultSize(kind: SceneObject['kind']): SceneObject['size'] {
  return {
    width: 2.4,
    height: 1.35,
    depth: 0.8,
    radius: 0.6,
    radiusTop: 0.5,
    radiusBottom: 0.7,
    segments: 32,
  };
}

export function createObject(
  kind: SceneObject['kind'],
  name: string,
  position: Vec3 = [0, 0, 0],
  rotation: Vec3 = [0, 0, 0],
  scale: Vec3 = [1, 1, 1],
  color = '#ffffff',
  content: SceneObject['content'] = 'none',
): SceneObject {
  return {
    id: crypto.randomUUID(),
    name,
    kind,
    position,
    rotation,
    scale,
    size: defaultSize(kind),
    color,
    content,
    effects: { ...DEFAULT_EFFECTS },
    text: { ...DEFAULT_TEXT },
    visible: true,
    locked: false,
    mask: null,
    imageUrl: '',
  };
}

export function createDefaultObjects(): SceneObject[] {
  const screen = createObject(
    'plane',
    'Экран',
    [0, 1.2, 0],
    [0, 0, 0],
    [1, 1, 1],
    '#ffffff',
    'video',
  );
  screen.size = { ...screen.size, width: 5.714, height: 3.214 };
  return [screen];
}

export function createDefaultScenarios(): Scenario[] {
  const empty: Scenario = {
    id: crypto.randomUUID(),
    name: 'Сцена 1',
    duration: 12,
    tracks: {},
  };
  return [empty];
}

export function keyframeValuesFromObject(object: SceneObject): KeyframeValues {
  return {
    position: [...object.position] as Vec3,
    rotation: [...object.rotation] as Vec3,
    scale: [...object.scale] as Vec3,
    visible: object.visible,
    effects: { ...object.effects },
  };
}

const INITIAL_VIDEO_URL = (() => {
  try {
    return localStorage.getItem('pm-video-url') ?? './sample.mp4';
  } catch {
    return './sample.mp4';
  }
})();

export function createDefaultState(videoUrl = INITIAL_VIDEO_URL): SyncState {
  const state = normalizeState({ videoUrl });
  return {
    ...state,
    selectedId: state.objects[0]?.id ?? null,
  };
}

const INITIAL_STATE = createDefaultState();

export function snapshotOf(state: Store): SyncState {
  return {
    projector: state.projector,
    objects: state.objects,
    scenarios: state.scenarios,
    activeScenarioId: state.activeScenarioId,
    currentTime: state.currentTime,
    loop: state.loop,
    quad: state.quad,
    selectedId: state.selectedId,
    showWireframe: state.showWireframe,
    playing: state.playing,
    blackout: state.blackout,
    calibration: state.calibration,
    videoUrl: state.videoUrl,
  };
}

export function getSyncState(): SyncState {
  return snapshotOf(useStore.getState());
}

export const useStore = create<Store>()((set, get) => {
  const emit = () => {
    get().send?.({ type: 'state', state: snapshotOf(get()) });
  };

  const setAndEmit = (updater: (state: Store) => Partial<Store>) => {
    set((state) => updater(state));
    emit();
  };

  const modifyObjects = (updater: (objects: SceneObject[]) => SceneObject[]) =>
    setAndEmit((state) => ({ objects: updater(state.objects) }));

  const modifyActiveScenario = (updater: (scenario: Scenario) => Scenario) =>
    setAndEmit((state) => {
      const scenarios = state.scenarios.map((scenario) =>
        scenario.id === state.activeScenarioId ? updater(scenario) : scenario,
      );
      return { scenarios };
    });

  return {
    projector: INITIAL_STATE.projector,
    objects: INITIAL_STATE.objects,
    scenarios: INITIAL_STATE.scenarios,
    activeScenarioId: INITIAL_STATE.activeScenarioId,
    currentTime: INITIAL_STATE.currentTime,
    loop: INITIAL_STATE.loop,
    quad: INITIAL_STATE.quad,
    selectedId: INITIAL_STATE.selectedId,
    showWireframe: INITIAL_STATE.showWireframe,
    gizmoMode: 'translate',
    maskEditingId: null,
    playing: false,
    blackout: false,
    calibration: false,
    videoUrl: INITIAL_STATE.videoUrl,
    send: null,

    setGizmoMode: (gizmoMode) => set({ gizmoMode }),
    setMaskEditing: (maskEditingId) => set({ maskEditingId }),
    selectObject: (id) => setAndEmit(() => ({ selectedId: id })),
    removeObject: (id) => get().deleteObject(id),
    toggleCalibration: () =>
      setAndEmit((state) => ({ calibration: !state.calibration })),
    toggleWireframe: () =>
      setAndEmit((state) => ({ showWireframe: !state.showWireframe })),
    toggleBlackout: () =>
      setAndEmit((state) => ({ blackout: !state.blackout })),
    play: () => setAndEmit(() => ({ playing: true, blackout: false })),
    pause: () => setAndEmit(() => ({ playing: false })),
    stop: () =>
      setAndEmit(() => ({ playing: false, blackout: false, currentTime: 0 })),
    resetProjector: () =>
      setAndEmit(() => ({ projector: createDefaultProjector() })),

    setProjector: (patch) =>
      setAndEmit((state) => ({ projector: { ...state.projector, ...patch } })),

    updateObject: (id, patch) =>
      modifyObjects((objects) =>
        objects.map((object) =>
          object.id === id
            ? {
                ...object,
                ...patch,
                size: patch.size
                  ? { ...object.size, ...patch.size }
                  : object.size,
              }
            : object,
        ),
      ),

    updateEffects: (id, patch) =>
      modifyObjects((objects) =>
        objects.map((object) =>
          object.id === id
            ? { ...object, effects: { ...object.effects, ...patch } }
            : object,
        ),
      ),

    updateText: (id, patch) =>
      modifyObjects((objects) =>
        objects.map((object) =>
          object.id === id ? { ...object, text: { ...object.text, ...patch } } : object,
        ),
      ),

    setSelected: (id) => setAndEmit(() => ({ selectedId: id })),

    addObject: (kind) =>
      setAndEmit((state) => {
        const count = state.objects.filter((object) => object.kind === kind).length + 1;
        const names: Record<SceneObject['kind'], string> = {
          plane: 'Плоскость',
          box: 'Куб',
          cylinder: 'Цилиндр',
          sphere: 'Сфера',
          glb: 'Модель',
        };
        const position: Vec3 =
          kind === 'plane' ? [0, 0, 0] : [state.objects.length * 1.2 - 2.4, 0.2, 0.3];
        const object = createObject(kind, `${names[kind]} ${count}`, position);
        return { objects: [...state.objects, object], selectedId: object.id };
      }),

    deleteObject: (id) =>
      setAndEmit((state) => {
        const scenarios = state.scenarios.map((scenario) => {
          const tracks = { ...scenario.tracks };
          delete tracks[id];
          return { ...scenario, tracks };
        });
        return {
          objects: state.objects.filter((object) => object.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
          scenarios,
        };
      }),

    duplicateObject: (id) =>
      setAndEmit((state) => {
        const source = state.objects.find((object) => object.id === id);
        if (!source) return {};
        const copy = {
          ...clone(source),
          id: crypto.randomUUID(),
          name: `${source.name} копия`,
          position: [source.position[0] + 0.4, source.position[1], source.position[2]] as Vec3,
        };
        return { objects: [...state.objects, copy], selectedId: copy.id };
      }),

    toggleVisible: (id) =>
      modifyObjects((objects) =>
        objects.map((object) =>
          object.id === id ? { ...object, visible: !object.visible } : object,
        ),
      ),

    toggleLocked: (id) =>
      modifyObjects((objects) =>
        objects.map((object) =>
          object.id === id ? { ...object, locked: !object.locked } : object,
        ),
      ),

    setMask: (id, mask) =>
      modifyObjects((objects) =>
        objects.map((object) => (object.id === id ? { ...object, mask } : object)),
      ),

    setShowWireframe: (value) => setAndEmit(() => ({ showWireframe: value })),
    setBlackout: (value) => setAndEmit(() => ({ blackout: value })),
    setCalibration: (value) => setAndEmit(() => ({ calibration: value })),
    setPlaying: (value) => setAndEmit(() => ({ playing: value })),
    setCurrentTime: (value) => setAndEmit(() => ({ currentTime: value })),
    setLoop: (value) => setAndEmit(() => ({ loop: value })),
    setQuadPoint: (index, point) =>
      setAndEmit((state) => ({
        quad: state.quad.map((item, itemIndex) =>
          itemIndex === index ? point : item,
        ) as Quad,
      })),
    resetQuad: () => setAndEmit(() => ({ quad: DEFAULT_QUAD })),

    setActiveScenario: (id) =>
      setAndEmit(() => ({ activeScenarioId: id, currentTime: 0, playing: false })),

    addScenario: (name) =>
      setAndEmit((state) => {
        const scenario: Scenario = {
          id: crypto.randomUUID(),
          name: name?.trim() || `Сценарий ${state.scenarios.length + 1}`,
          duration: 12,
          tracks: {},
        };
        return { scenarios: [...state.scenarios, scenario], activeScenarioId: scenario.id };
      }),

    updateScenario: (id, patch) =>
      setAndEmit((state) => ({
        scenarios: state.scenarios.map((scenario) =>
          scenario.id === id ? { ...scenario, ...patch } : scenario,
        ),
      })),

    deleteScenario: (id) =>
      setAndEmit((state) => {
        if (state.scenarios.length <= 1) return {};
        const scenarios = state.scenarios.filter((scenario) => scenario.id !== id);
        return {
          scenarios,
          activeScenarioId:
            state.activeScenarioId === id ? scenarios[0].id : state.activeScenarioId,
        };
      }),

    addKeyframe: (objectId, time, values) =>
      setAndEmit((state) => {
        const object = state.objects.find((item) => item.id === objectId);
        if (!object) return {};
        const keyframe: Keyframe = {
          id: crypto.randomUUID(),
          time: Math.max(0, time),
          values: values ?? keyframeValuesFromObject(object),
        };
        const scenarios = state.scenarios.map((scenario) => {
          if (scenario.id !== state.activeScenarioId) return scenario;
          const tracks = { ...scenario.tracks };
          const existing = (tracks[objectId] ?? []).find(
            (item) => Math.abs(item.time - keyframe.time) < 0.05,
          );
          const track = existing
            ? (tracks[objectId] ?? []).map((item) =>
                item.id === existing.id ? { ...keyframe, id: existing.id } : item,
              )
            : [...(tracks[objectId] ?? []), keyframe];
          tracks[objectId] = track.sort((a, b) => a.time - b.time);
          return { ...scenario, tracks };
        });
        return { scenarios };
      }),

    updateKeyframe: (objectId, keyframeId, patch) =>
      setAndEmit((state) => ({
        scenarios: state.scenarios.map((scenario) => {
          if (scenario.id !== state.activeScenarioId) return scenario;
          const tracks = { ...scenario.tracks };
          tracks[objectId] = (tracks[objectId] ?? [])
            .map((keyframe) =>
              keyframe.id === keyframeId
                ? {
                    ...keyframe,
                    ...patch,
                    values: patch.values
                      ? { ...keyframe.values, ...patch.values }
                      : keyframe.values,
                  }
                : keyframe,
            )
            .sort((a, b) => a.time - b.time);
          return { ...scenario, tracks };
        }),
      })),

    deleteKeyframe: (objectId, keyframeId) =>
      setAndEmit((state) => ({
        scenarios: state.scenarios.map((scenario) => {
          if (scenario.id !== state.activeScenarioId) return scenario;
          const tracks = { ...scenario.tracks };
          tracks[objectId] = (tracks[objectId] ?? []).filter(
            (keyframe) => keyframe.id !== keyframeId,
          );
          return { ...scenario, tracks };
        }),
      })),

    setVideoUrl: (url) => {
      try {
        localStorage.setItem('pm-video-url', url);
      } catch {
        // ignore quota/private mode errors
      }
      setAndEmit(() => ({ videoUrl: url }));
    },

    loadScene: (state) => {
      const normalized = normalizeState({
        ...state,
        playing: false,
        blackout: false,
        calibration: false,
        currentTime: 0,
      });
      set({
        ...normalized,
        selectedId: normalized.objects[0]?.id ?? null,
        send: get().send,
      });
      emit();
    },

    newScene: () => {
      const fresh = createDefaultState(get().videoUrl);
      set({ ...fresh, send: get().send });
      emit();
    },

    replaceState: (state) => {
      set({ ...normalizeState(state), send: get().send });
    },
  };
});

export const useAppStore = useStore;
