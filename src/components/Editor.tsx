import { useEffect, useRef, useState } from 'react';
import { CameraControls } from './CameraControls';
import { ContentControls } from './ContentControls';
import { EditorView } from './EditorView';
import { MaskEditor } from './MaskEditor';
import { PlaybackControls } from './PlaybackControls';
import { ProjectorView } from './ProjectorView';
import { ScenePanel } from './ScenePanel';
import { getSyncState, useAppStore } from '../store';
import { sendState, subscribe } from '../lib/channel';
import { useVideoTexture } from '../lib/useVideoTexture';
import type { GizmoMode } from '../types';

const DISCONNECT_AFTER_MS = 5000;

const GIZMO_LABELS: Record<GizmoMode, string> = {
  translate: 'Move',
  rotate: 'Rotate',
  scale: 'Scale',
};

export function Editor() {
  const projector = useAppStore((state) => state.projector);
  const objects = useAppStore((state) => state.objects);
  const selectedId = useAppStore((state) => state.selectedId);
  const showWireframe = useAppStore((state) => state.showWireframe);
  const gizmoMode = useAppStore((state) => state.gizmoMode);
  const maskEditingId = useAppStore((state) => state.maskEditingId);
  const playing = useAppStore((state) => state.playing);
  const blackout = useAppStore((state) => state.blackout);
  const calibration = useAppStore((state) => state.calibration);
  const videoUrl = useAppStore((state) => state.videoUrl);
  const selectObject = useAppStore((state) => state.selectObject);
  const updateObject = useAppStore((state) => state.updateObject);
  const setGizmoMode = useAppStore((state) => state.setGizmoMode);
  const toggleWireframe = useAppStore((state) => state.toggleWireframe);
  const toggleCalibration = useAppStore((state) => state.toggleCalibration);
  const texture = useVideoTexture(videoUrl, playing);
  const [connected, setConnected] = useState(false);
  const disconnectTimer = useRef<number | null>(null);

  const selectedObject =
    objects.find((object) => object.id === selectedId) ?? null;

  useEffect(() => {
    const send = () => sendState(getSyncState());
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

    send();
    const unsubscribeStore = useAppStore.subscribe(send);
    const unsubscribeChannel = subscribe((message) => {
      if (message.type === 'hello') {
        send();
        markConnected();
      }
    });

    return () => {
      unsubscribeStore();
      unsubscribeChannel();
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

      const store = useAppStore.getState();
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
          store.removeObject(store.selectedId);
        }
        return;
      }

      if (event.key === 'Escape') {
        store.selectObject(null);
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
            <span>Phase 2 · 3D object editor</span>
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
          <ScenePanel />
        </aside>

        <section className="viewport-panel">
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
            texture={texture}
            selectedId={selectedId}
            showWireframe={showWireframe}
            gizmoMode={gizmoMode}
            selectedLocked={selectedObject?.locked ?? false}
            onSelect={selectObject}
            onTransform={updateObject}
          />
          <div className="viewport-help">
            Orbit: drag · Zoom: wheel · Click object to select · W: wireframe
          </div>
        </section>

        <aside className="side-panel">
          <section className="panel-section">
            <div className="section-heading">
              <div>
                <div className="panel-label">Projector view</div>
                <p className="hint">
                  This is what the projector receives. Move the output window to
                  the projector and press Fullscreen there.
                </p>
              </div>
            </div>
            <div className="projector-preview">
              <ProjectorView
                projector={projector}
                objects={objects}
                texture={texture}
                selectedId={selectedId}
                showWireframe={showWireframe}
                calibration={calibration}
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

          <CameraControls />
          <ContentControls />
          <PlaybackControls />
          <div className="panel-footer">
            State is broadcast from this window to the projector output. Use the
            wireframe toggle while moving an object to match it to the real
            object.
          </div>
        </aside>
      </main>

      <footer className="bottombar">
        <span>
          Phase 2: primitives, GLB by URL, transform gizmo, wireframe alignment and
          plane masks. Timeline is next.
        </span>
      </footer>
    </div>
  );
}
