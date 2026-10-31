import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import type { Quad, Vec2 } from '../types';
import { quadToCssMatrix } from '../lib/homography';

const LABELS = ['TL', 'TR', 'BR', 'BL'];

function QuadHandles({
  quad,
  stageRef,
  onChange,
}: {
  quad: Quad;
  stageRef: RefObject<HTMLDivElement | null>;
  onChange: (index: number, point: Vec2) => void;
}) {
  const handlePointerDown = (
    index: number,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const move = (next: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      const x = Math.max(0, Math.min(1, (next.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (next.clientY - rect.top) / rect.height));
      onChange(index, [x, y]);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="quad-overlay">
      {quad.map((point, index) => (
        <button
          key={LABELS[index]}
          type="button"
          className="quad-handle"
          style={{ left: `${point[0] * 100}%`, top: `${point[1] * 100}%` }}
          onPointerDown={(event) => handlePointerDown(index, event)}
        >
          <span>{LABELS[index]}</span>
        </button>
      ))}
    </div>
  );
}

export function WarpedStage({
  quad,
  editable = false,
  onQuadChange,
  children,
  className = '',
}: {
  quad: Quad;
  editable?: boolean;
  onQuadChange?: (index: number, point: Vec2) => void;
  children: ReactNode;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = stageRef.current;
    if (!element) {
      return;
    }
    const update = () =>
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const matrix = useMemo(
    () => quadToCssMatrix(quad, size.width, size.height),
    [quad, size.width, size.height],
  );

  return (
    <div ref={stageRef} className={`warp-stage ${className}`.trim()}>
      <div className="warp-canvas" style={{ transform: matrix }}>
        {children}
      </div>
      {editable && onQuadChange ? (
        <QuadHandles
          quad={quad}
          stageRef={stageRef}
          onChange={onQuadChange}
        />
      ) : null}
    </div>
  );
}
