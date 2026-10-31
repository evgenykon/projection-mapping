import type { MouseEvent } from 'react';
import type { ProjectorConfig, SceneObject, Vec2 } from '../types';
import { planeToScreen, screenToPlaneUv } from '../lib/planeProjection';

const ASPECT = 16 / 9;

export function MaskEditor({
  object,
  projector,
  onAddPoint,
}: {
  object: SceneObject;
  projector: ProjectorConfig;
  onAddPoint: (uv: Vec2) => void;
}) {
  const points = (object.mask ?? [])
    .map(([u, v]) => planeToScreen(u, v, object, projector, ASPECT))
    .filter((point): point is { x: number; y: number } => point !== null);

  const polygonPoints = points
    .map((point) => `${point.x * 100},${point.y * 100}`)
    .join(' ');

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const uv = screenToPlaneUv(x, y, object, projector, ASPECT);
    if (uv) {
      onAddPoint(uv);
    }
  };

  return (
    <div className="mask-editor" onClick={handleClick}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {points.length > 1 ? (
          <polygon className="mask-poly" points={polygonPoints} />
        ) : null}
      </svg>
      {points.map((point, index) => (
        <span
          key={`${index}-${point.x}-${point.y}`}
          className="mask-point"
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
        />
      ))}
      <div className="mask-editor-hint">Click the object outline to add points</div>
    </div>
  );
}
