import { useEffect, useRef, useState } from 'react';
import { CameraControls } from './CameraControls';
import { ContentControls } from './ContentControls';
import { EditorView } from './EditorView';
import { PlaybackControls } from './PlaybackControls';
import { ProjectorView } from './ProjectorView';
import { getSyncState, useAppStore } from '../store';
import { sendState, subscribe } from '../lib/channel';
import { useVideoTexture } from '../lib/useVideoTexture';

const DISCONNECT_AFTER_MS = 5000;

export function Editor() {
  const projector = useAppStore((state) => state.projector);
  const playing = useAppStore((state) => state.playing);
  const blackout = useAppStore((state) => state.blackout);
  const calibration = useAppStore((state) => state.calibration);
  const videoUrl = useAppStore((state) => state.videoUrl);
  const toggleCalibration = useAppStore((state) => state.toggleCalibration);
  const texture = useVideoTexture(videoUrl, playing);
  const [connected, setConnected] = useState(false);
  const disconnectTimer = useRef<number | null>(null);

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
            <span>Phase 1 sandbox · laptop + projector</span>
          </div>
        </div>

        <div className="topbar-actions">
          <span className={connected ? 'connection ok' : 'connection'}>
            <span className="dot" />
            {connected ? 'Output connected' : 'Output not connected'}
          </span>
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
        <section className="viewport-panel">
          <div className="viewport-label">3D view</div>
          <EditorView texture={texture} />
          <div className="viewport-help">
            Orbit: drag · Zoom: wheel · Pan: right drag
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
                texture={texture}
                calibration={calibration}
              />
              {blackout ? <div className="preview-blackout">BLACKOUT</div> : null}
            </div>
          </section>

          <CameraControls />
          <ContentControls />
          <PlaybackControls />
          <div className="panel-footer">
            State is broadcast from this window to the projector output. Open the
            output on the projector, then press Fullscreen (F) there.
          </div>
        </aside>
      </main>

      <footer className="bottombar">
        <span>
          Phase 1: virtual projector, wall, box and sample video. Use calibration
          grid and camera sliders, then tune the virtual projector until the
          pattern matches the real wall.
        </span>
      </footer>
    </div>
  );
}
