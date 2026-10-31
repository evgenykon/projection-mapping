import { useAppStore } from '../store';

export function PlaybackControls() {
  const playing = useAppStore((state) => state.playing);
  const blackout = useAppStore((state) => state.blackout);
  const play = useAppStore((state) => state.play);
  const pause = useAppStore((state) => state.pause);
  const stop = useAppStore((state) => state.stop);
  const toggleBlackout = useAppStore((state) => state.toggleBlackout);

  return (
    <section className="panel-section">
      <div className="panel-label">Playback</div>
      <div className="button-grid">
        <button className="primary" onClick={playing ? pause : play}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={stop}>Stop</button>
        <button
          className={blackout ? 'danger active' : 'danger'}
          onClick={toggleBlackout}
        >
          {blackout ? 'Blackout on' : 'Blackout'}
        </button>
      </div>
      <p className="hint">
        Space — play/pause · S — stop · B — blackout · C — calibration
      </p>
    </section>
  );
}
