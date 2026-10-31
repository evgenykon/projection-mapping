import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { postMessage, subscribe } from '../lib/channel';
import { useVideoTexture } from '../lib/useVideoTexture';
import { applyScenario, getActiveScenario } from '../lib/scenario';
import { ProjectorCamera } from './ProjectorCamera';
import { SceneObjects } from './SceneObjects';
import { WarpedStage } from './WarpedStage';

type WakeLockLike = { release: () => Promise<void> };

export function Output() {
  const rootRef = useRef<HTMLDivElement>(null);
  const projector = useStore((state) => state.projector);
  const objects = useStore((state) => state.objects);
  const scenarios = useStore((state) => state.scenarios);
  const activeScenarioId = useStore((state) => state.activeScenarioId);
  const currentTime = useStore((state) => state.currentTime);
  const playing = useStore((state) => state.playing);
  const blackout = useStore((state) => state.blackout);
  const calibration = useStore((state) => state.calibration);
  const selectedId = useStore((state) => state.selectedId);
  const showWireframe = useStore((state) => state.showWireframe);
  const videoUrl = useStore((state) => state.videoUrl);
  const quad = useStore((state) => state.quad);
  const [linked, setLinked] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);
  const texture = useVideoTexture(videoUrl, playing);
  const activeScenario = useMemo(
    () => getActiveScenario(scenarios, activeScenarioId),
    [scenarios, activeScenarioId],
  );
  const animatedObjects = useMemo(
    () => applyScenario(objects, activeScenario, currentTime),
    [objects, activeScenario, currentTime],
  );

  useEffect(() => {
    const sendHello = () => postMessage({ type: 'hello' });
    sendHello();
    const interval = window.setInterval(sendHello, 2000);
    const unsubscribe = subscribe((message) => {
      if (message.type === 'state') {
        useStore.getState().replaceState(message.state);
        setLinked(true);
      }
    });
    return () => {
      window.clearInterval(interval);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    let wakeLock: WakeLockLike | null = null;
    let cancelled = false;

    const requestWakeLock = async () => {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<WakeLockLike> };
      };
      if (!nav.wakeLock || cancelled) {
        return;
      }
      try {
        wakeLock = await nav.wakeLock.request('screen');
      } catch {
        // Wake Lock is a nice-to-have; some browsers reject it.
      }
    };

    void requestWakeLock();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void wakeLock?.release();
    };
  }, []);

  useEffect(() => {
    let timer: number | null = null;
    const onMove = () => {
      setIdle(false);
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => setIdle(true), 2500);
    };
    onMove();
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (rootRef.current) {
      await rootRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div
      ref={rootRef}
      className={idle ? 'output idle' : 'output'}
      onDoubleClick={() => void toggleFullscreen()}
    >
      <div className="output-stage-frame">
        <WarpedStage quad={quad}>
          <Canvas
            className="output-canvas"
            camera={{ position: projector.position, fov: projector.fov }}
            dpr={[1, 2]}
            gl={{ antialias: true }}
          >
            <ProjectorCamera config={projector} />
            <SceneObjects
              objects={animatedObjects}
              texture={texture}
              selectedId={selectedId}
              showWireframe={showWireframe}
              calibration={calibration}
            />
          </Canvas>
        </WarpedStage>
      </div>

      {blackout ? <div className="blackout" /> : null}

      <div className="output-bar">
        <span className={linked ? 'connection ok' : 'connection'}>
          <span className="dot" />
          {linked ? 'Editor linked' : 'Waiting for editor'}
        </span>
        <button onClick={() => void toggleFullscreen()}>
          {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {!linked ? (
        <div className="waiting">
          <div className="waiting-card">
            <div className="brand-mark">PM</div>
            <h2>Waiting for editor</h2>
            <p>
              Open the editor, press “Open output”, move this window to the
              projector and press Fullscreen.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
