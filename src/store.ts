import { create } from 'zustand';
import type { ProjectorConfig, SyncState } from './types';

export const DEFAULT_PROJECTOR: ProjectorConfig = {
  position: [0, 1.35, 0],
  rotation: [0, 0, 0],
  fov: 25.36,
};

interface AppStore extends SyncState {
  setProjector: (patch: Partial<ProjectorConfig>) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleCalibration: () => void;
  toggleBlackout: () => void;
  resetProjector: () => void;
  setVideoUrl: (url: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  projector: DEFAULT_PROJECTOR,
  playing: false,
  blackout: false,
  calibration: false,
  videoUrl: './sample.mp4',
  setProjector: (patch) =>
    set((state) => ({ projector: { ...state.projector, ...patch } })),
  play: () => set({ playing: true, blackout: false }),
  pause: () => set({ playing: false }),
  stop: () => set({ playing: false, blackout: false }),
  toggleCalibration: () => set((state) => ({ calibration: !state.calibration })),
  toggleBlackout: () => set((state) => ({ blackout: !state.blackout })),
  resetProjector: () => set({ projector: DEFAULT_PROJECTOR }),
  setVideoUrl: (videoUrl) => set({ videoUrl }),
}));

export function getSyncState(): SyncState {
  const state = useAppStore.getState();
  return {
    projector: state.projector,
    playing: state.playing,
    blackout: state.blackout,
    calibration: state.calibration,
    videoUrl: state.videoUrl,
  };
}
