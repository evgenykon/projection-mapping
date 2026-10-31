import { useMemo, useRef, useState } from 'react';
import {
  useStore,
} from '../store';
import {
  getActiveScenario,
  scenarioDuration,
} from '../lib/scenario';

export function Timeline({ onSeek }: { onSeek: (time: number) => void }) {
  const objects = useStore((state) => state.objects);
  const selectedId = useStore((state) => state.selectedId);
  const scenarios = useStore((state) => state.scenarios);
  const activeScenarioId = useStore((state) => state.activeScenarioId);
  const currentTime = useStore((state) => state.currentTime);
  const playing = useStore((state) => state.playing);
  const loop = useStore((state) => state.loop);
  const play = useStore((state) => state.play);
  const pause = useStore((state) => state.pause);
  const stop = useStore((state) => state.stop);
  const setLoop = useStore((state) => state.setLoop);
  const setActiveScenario = useStore((state) => state.setActiveScenario);
  const addScenario = useStore((state) => state.addScenario);
  const deleteScenario = useStore((state) => state.deleteScenario);
  const updateScenario = useStore((state) => state.updateScenario);
  const addKeyframe = useStore((state) => state.addKeyframe);
  const deleteKeyframe = useStore((state) => state.deleteKeyframe);
  const setSelected = useStore((state) => state.setSelected);
  const tracksRef = useRef<HTMLDivElement>(null);
  const [selectedKeyframe, setSelectedKeyframe] = useState<{
    objectId: string;
    keyframeId: string;
  } | null>(null);

  const activeScenario = useMemo(
    () => getActiveScenario(scenarios, activeScenarioId),
    [scenarios, activeScenarioId],
  );
  const duration = scenarioDuration(activeScenario);
  const ticks = useMemo(() => {
    const step = duration <= 10 ? 1 : duration <= 30 ? 2 : 5;
    const list: number[] = [];
    for (let time = 0; time <= duration + 0.001; time += step) {
      list.push(Number(time.toFixed(3)));
    }
    return list;
  }, [duration]);

  const scrubTo = (clientX: number) => {
    const element = tracksRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('.keyframe')) {
      return;
    }
    scrubTo(event.clientX);
    const move = (next: PointerEvent) => scrubTo(next.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const playheadPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  return (
    <section className="timeline">
      <div className="timeline-header">
        <div className="timeline-title">Timeline</div>
        <select
          className="select-input timeline-scenario"
          value={activeScenarioId}
          onChange={(event) => setActiveScenario(event.target.value)}
        >
          {scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
        <button className="ghost small" onClick={() => addScenario()}>
          + Сценарий
        </button>
        <button
          className="ghost small"
          disabled={scenarios.length <= 1}
          onClick={() => deleteScenario(activeScenarioId)}
        >
          Удалить
        </button>
        <label className="timeline-duration">
          Длительность
          <input
            className="number-input"
            type="number"
            min={1}
            step={1}
            value={activeScenario?.duration ?? 12}
            onChange={(event) =>
              updateScenario(activeScenarioId, {
                duration: Math.max(1, Number(event.target.value) || 1),
              })
            }
          />
          с
        </label>
        <label className="checkbox-row timeline-loop">
          <input
            type="checkbox"
            checked={loop}
            onChange={(event) => setLoop(event.target.checked)}
          />
          Loop
        </label>
        <span className="timeline-time">
          {currentTime.toFixed(2)} / {duration.toFixed(1)} s
        </span>
        <div className="timeline-controls">
          <button className="primary" onClick={playing ? pause : play}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button onClick={stop}>Stop</button>
          <button
            disabled={!selectedId}
            onClick={() => {
              if (selectedId) {
                addKeyframe(selectedId, currentTime);
              }
            }}
          >
            + Keyframe
          </button>
          <button
            disabled={!selectedKeyframe}
            onClick={() => {
              if (selectedKeyframe) {
                deleteKeyframe(
                  selectedKeyframe.objectId,
                  selectedKeyframe.keyframeId,
                );
                setSelectedKeyframe(null);
              }
            }}
          >
            Удалить keyframe
          </button>
        </div>
      </div>

      <div className="timeline-body">
        <div className="timeline-labels">
          <div className="timeline-ruler-spacer" />
          {objects.map((object) => (
            <button
              key={object.id}
              className={
                object.id === selectedId
                  ? 'timeline-label selected'
                  : 'timeline-label'
              }
              onClick={() => setSelected(object.id)}
            >
              {object.name}
            </button>
          ))}
        </div>
        <div
          className="timeline-tracks"
          ref={tracksRef}
          onPointerDown={handlePointerDown}
        >
          <div className="timeline-ruler">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="timeline-tick"
                style={{ left: `${(tick / duration) * 100}%` }}
              >
                <span>{tick}s</span>
              </div>
            ))}
          </div>
          {ticks.map((tick) => (
            <div
              key={`line-${tick}`}
              className="timeline-gridline"
              style={{ left: `${(tick / duration) * 100}%` }}
            />
          ))}
          {objects.map((object) => {
            const keyframes = activeScenario?.tracks[object.id] ?? [];
            return (
              <div
                key={object.id}
                className={
                  object.id === selectedId
                    ? 'timeline-track selected'
                    : 'timeline-track'
                }
              >
                {keyframes.map((keyframe) => (
                  <button
                    key={keyframe.id}
                    className="keyframe"
                    style={{ left: `${(keyframe.time / duration) * 100}%` }}
                    title={`${keyframe.time.toFixed(2)}s`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelected(object.id);
                      setSelectedKeyframe({
                        objectId: object.id,
                        keyframeId: keyframe.id,
                      });
                      onSeek(keyframe.time);
                    }}
                  />
                ))}
              </div>
            );
          })}
          <div
            className="timeline-playhead"
            style={{ left: `${playheadPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
