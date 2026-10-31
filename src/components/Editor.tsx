import { useEffect, useMemo, useRef, useState } from 'react';
import { CameraControls } from './CameraControls';
import { EditorView } from './EditorView';
import { MaskEditor } from './MaskEditor';
import { PlaybackControls } from './PlaybackControls';
import { ProjectorView } from './ProjectorView';
import { SceneLibrary } from './SceneLibrary';
import { ScenePanel } from './ScenePanel';
import { Timeline } from './Timeline';
import {
  getSyncState,
  useAppStore,
  useStore,
} from '../store';
import { postMessage, subscribe } from '../lib/channel';
import { useVideoTexture } from '../lib/useVideoTexture';
import {
  applyScenario,
  getActiveScenario,
  scenarioDuration,
} from '../lib/scenario';
import type { GizmoMode } from '../types';

const DISCONNECT_AFTER_MS = 5000;

const GIZMO_LABELS: Record<GizmoMode, string> = {
  translate: 'Move',
  rotate: 'Rotate',
  scale: 'Scale',
};

export function Editor() {
  const projector = useStore((state) => state.projector);
  const objects = useStore((state) => state.objects);
  const scenarios = useStore((state) => state.scenarios);
  const activeScenarioId = useStore((state) => state.activeScenarioId);
  const currentTime = useStore((state) => state.currentTime);
  const quad = useStore((state) => state.quad);
  const setQuadPoint = useStore((state) => state.setQuadPoint);
  const resetQuad = useStore((state) => state.resetQuad);
  const playing = useStore((state) => state.playing);
  const selectedId = useStore((state) => state.selectedId);
  const showWireframe = useStore((state) => state.showWireframe);
  const gizmoMode = useStore((state) => state.gizmoMode);
  const maskEditingId = useStore((state) => state.maskEditingId);
  const blackout = useStore((state) => state.blackout);
  const calibration = useStore((state) => state.calibration);
  const videoUrl = useStore((state) => state.videoUrl);
  const selectObject = useStore((state) => state.selectObject);
  const updateObject = useStore((state) => state.updateObject);
  const setGizmoMode = useStore((state) => state.setGizmoMode);
  const toggleWireframe = useStore((state) => state.toggleWireframe);
  const toggleCalibration = useStore((state) => state.toggleCalibration);
  const texture = useVideoTexture(videoUrl, playing);
  const [connected, setConnected] = useState(false);
  const disconnectTimer = useRef<number | null>(null);
  const clockStart = useRef(0);
  const rafRef = useRef<number | null>(null);

  const activeScenario = useMemo(
    () => getActiveScenario(scenarios, activeScenarioId),
    [scenarios, activeScenarioId],
  );
  const animatedObjects = useMemo(
    () => applyScenario(objects, activeScenario, currentTime),
    [objects, activeScenario, currentTime],
  );
  const selectedObject =
    objects.find((object) => object.id === selectedId) ?? null;

  const duration = scenarioDuration(activeScenario);

  const seek = (time: number) => {
    const clamped = Math.max(0, Math.min(time, duration));
    useStore.getState().setCurrentTime(clamped);
    clockStart.current = Date.now() - clamped * 1000;
  };

  useEffect(() => {
    if (!playing) {
      return;
    }
    clockStart.current = Date.now() - useStore.getState().currentTime * 1000;
    const tick = () => {
      const store = useStore.getState();
      const scenario = getActiveScenario(store.scenarios, store.activeScenarioId);
      const max = scenarioDuration(scenario);
      let time = (Date.now() - clockStart.current) / 1000;
      if (time >= max) {
        if (store.loop) {
          clockStart.current = Date.now();
          time = 0;
        } else {
          store.setCurrentTime(max);
          store.pause();
          return;
        }
      }
      store.setCurrentTime(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [playing]);

  useEffect(() => {
    useStore.setState({ send: (message) => postMessage(message) });
    postMessage({ type: 'state', state: getSyncState() });
    const markConnected = () => {
      setConnected(true);
      if (disconnectTimer.current) {
        window.clearTimeout(disconnectTimer.current);
      }
      disconnectTimer.current = window.setTimeout(
        () => setConnected(false),
        DISCONNECT_AFTER_MS,
      );
    };

    const unsubscribeChannel = subscribe((message) => {
      if (message.type === 'hello') {
        postMessage({ type: 'state', state: getSyncState() });
        markConnected();
      }
      if (message.type === 'control') {
        const store = useStore.getState();
        if (message.action === 'play') store.play();
        if (message.action === 'pause') store.pause();
        if (message.action === 'stop') store.stop();
        if (message.action === 'blackout') store.toggleBlackout();
      }
    });

    return () => {
      unsubscribeChannel();
      useStore.setState({ send: null });
      if (disconnectTimer.current) {
        window.clearTimeout(disconnectTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const store = useStore.getState();
      if (event.code === 'Space') {
        event.preventDefault();
        if (store.playing) {
          store.pause();
        } else {
          store.play();
        }
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (store.selectedId) {
          event.preventDefault();
          store.deleteObject(store.selectedId);
        }
        return;
      }

      if (event.key === 'Escape') {
        store.setSelected(null);
        return;
      }

      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          store.stop();
          break;
        case 'b':
          event.preventDefault();
          store.toggleBlackout();
          break;
        case 'c':
          event.preventDefault();
          store.toggleCalibration();
          break;
        case 'w':
          event.preventDefault();
          store.toggleWireframe();
          break;
        case 'k':
          if (store.selectedId) {
            event.preventDefault();
            store.addKeyframe(store.selectedId, store.currentTime);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openOutput = () => {
    const url = new URL(window.location.href);
    url.hash = '#/output';
    const opened = window.open(
      url.toString(),
      'projection-output',
      'popup=yes,width=1280,height=720',
    );
    if (!opened) {
      window.alert('Popup was blocked. Allow popups for this page and try again.');
    }
  };

  return (
    <div className="editor">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">PM</div>
          <div>
            <h1>Projection Mapping</h1>
            <span>Phase 3 · text, effects, timeline</span>
          </div>
        </div>

        <div className="topbar-actions">
          <span className={connected ? 'connection ok' : 'connection'}>
            <span className="dot" />
            {connected ? 'Output connected' : 'Output not connected'}
          </span>
          <button
            className={showWireframe ? 'active' : ''}
            onClick={toggleWireframe}
            title="Show selected object as wireframe"
          >
            {showWireframe ? 'Wireframe on' : 'Wireframe'}
          </button>
          <button
            className={calibration ? 'active' : ''}
            onClick={toggleCalibration}
          >
            {calibration ? 'Calibration on' : 'Calibration'}
          </button>
          <button className="primary" onClick={openOutput}>
            Open output
          </button>
        </div>
      </header>

      <main className="editor-main">
        <aside className="left-panel">
          <SceneLibrary />
          <ScenePanel />
        </aside>

        <section className="viewport-panel">
          {calibration ? (
            <div className="calibration-stage">
              <div className="calibration-frame">
                <ProjectorView
                  projector={projector}
                  objects={animatedObjects}
                  texture={texture}
                  playing={playing}
                  selectedId={selectedId}
                  showWireframe={showWireframe}
                  calibration
                  quad={quad}
                  editable
                  onQuadChange={setQuadPoint}
                />
              </div>
              <div className="viewport-help">
                Drag the 4 corners to the wall corners · then open Output
              </div>
            </div>
          ) : (
            <>
              <div className="viewport-label">3D view</div>
              <div className="gizmo-toolbar">
                {(Object.keys(GIZMO_LABELS) as GizmoMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={gizmoMode === mode ? 'active' : ''}
                    onClick={() => setGizmoMode(mode)}
                  >
                    {GIZMO_LABELS[mode]}
                  </button>
                ))}
              </div>
              <EditorView
                objects={objects}
                projector={projector}
                texture={texture}
                playing={playing}
                selectedId={selectedId}
                showWireframe={showWireframe}
                gizmoMode={gizmoMode}
                selectedLocked={selectedObject?.locked ?? false}
                onSelect={selectObject}
                onTransform={updateObject}
              />
              <div className="viewport-help">
                Orbit: drag · Zoom: wheel · Click object to select · W:
                wireframe · K: keyframe
              </div>
            </>
          )}
        </section>

        <aside className="side-panel">
          <section className="panel-section">
            <div className="section-heading">
              <div>
                <div className="panel-label">Projector view</div>
                <p className="hint">
                  This is what the projector receives. It shows the animated
                  timeline at the playhead.
                </p>
              </div>
            </div>
            <div className="projector-preview">
              <ProjectorView
                projector={projector}
                objects={animatedObjects}
                texture={texture}
                playing={playing}
                selectedId={selectedId}
                showWireframe={showWireframe}
                calibration={calibration}
                quad={quad}
              />
              {selectedObject &&
              selectedObject.kind === 'plane' &&
              maskEditingId === selectedObject.id &&
              !blackout ? (
                <MaskEditor
                  object={selectedObject}
                  projector={projector}
                  onAddPoint={(uv) => {
                    updateObject(selectedObject.id, {
                      mask: [...(selectedObject.mask ?? []), uv],
                    });
                  }}
                />
              ) : null}
              {blackout ? <div className="preview-blackout">BLACKOUT</div> : null}
            </div>
          </section>

          {calibration ? (
            <section className="panel-section">
              <div className="panel-label">Wall calibration</div>
              <p className="hint">
                The four corners are the projection's corners on the wall. Drag
                them in the large view until the grid matches the real surface.
              </p>
              <button className="ghost small" onClick={resetQuad}>
                Reset quad
              </button>
            </section>
          ) : null}

          <CameraControls />
          <PlaybackControls />
          <div className="panel-footer">
            Timeline keyframes animate position, rotation, scale, visibility and
            effects. The 3D view edits the base pose; the projector preview shows
            the result at the playhead.
          </div>
        </aside>
      </main>

      <Timeline onSeek={seek} />

      <footer className="bottombar">
        <span>
          Phase 3: text layers, per-object effects and a keyframe timeline. Next:
          camera / desktop capture and OPFS assets.
        </span>
      </footer>
    </div>
  );
}
