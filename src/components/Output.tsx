import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_OBJECTS, DEFAULT_PROJECTOR } from '../store';
import { postMessage, subscribe } from '../lib/channel';
import { useVideoTexture } from '../lib/useVideoTexture';
import type { SyncState } from '../types';
import { ProjectorCamera } from './ProjectorCamera';
import { SceneObjects } from './SceneObjects';

type WakeLockLike = { release: () => Promise<void> };

export function Output() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SyncState | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);
  const texture = useVideoTexture(
    state?.videoUrl ?? './sample.mp4',
    state?.playing ?? false,
  );

  useEffect(() => {
    const sendHello = () => postMessage({ type: 'hello' });
    sendHello();
    const interval = window.setInterval(sendHello, 2000);
    const unsubscribe = subscribe((message) => {
      if (message.type === 'state') {
        setState(message.state);
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

  const projector = state?.projector ?? DEFAULT_PROJECTOR;

  return (
    <div
      ref={rootRef}
      className={idle ? 'output idle' : 'output'}
      onDoubleClick={() => void toggleFullscreen()}
    >
      <Canvas
        className="output-canvas"
        camera={{ position: projector.position, fov: projector.fov }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <ProjectorCamera config={projector} />
        <SceneObjects
          objects={state?.objects ?? DEFAULT_OBJECTS}
          texture={texture}
          selectedId={state?.selectedId ?? null}
          showWireframe={state?.showWireframe ?? false}
          calibration={state?.calibration ?? false}
        />
      </Canvas>

      {state?.blackout ? <div className="blackout" /> : null}

      <div className="output-bar">
        <span className={state ? 'connection ok' : 'connection'}>
          <span className="dot" />
          {state ? 'Editor linked' : 'Waiting for editor'}
        </span>
        <button onClick={() => void toggleFullscreen()}>
          {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {!state ? (
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
