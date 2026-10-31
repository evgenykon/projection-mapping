import type { Vec3 } from '../types';
import { useAppStore } from '../store';

function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-field">
      <span className="range-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output className="range-value">
        {value.toFixed(2)}
        {suffix}
      </output>
    </label>
  );
}

export function CameraControls() {
  const projector = useAppStore((state) => state.projector);
  const setProjector = useAppStore((state) => state.setProjector);
  const resetProjector = useAppStore((state) => state.resetProjector);

  const setVector = (
    field: 'position' | 'rotation',
    index: 0 | 1 | 2,
    value: number,
  ) => {
    const next = [...projector[field]] as Vec3;
    next[index] = value;
    setProjector({ [field]: next });
  };

  return (
    <section className="panel-section">
      <div className="section-heading">
        <div>
          <div className="panel-label">Projector camera</div>
          <p className="hint">Align the virtual projector to the real one.</p>
        </div>
        <button className="ghost small" onClick={resetProjector}>
          Reset
        </button>
      </div>

      <div className="control-group">
        <div className="group-label">Position (m)</div>
        {(['X', 'Y', 'Z'] as const).map((axis, index) => (
          <RangeField
            key={`position-${axis}`}
            label={axis}
            value={projector.position[index]}
            min={-5}
            max={5}
            step={0.01}
            suffix="m"
            onChange={(value) => setVector('position', index as 0 | 1 | 2, value)}
          />
        ))}
      </div>

      <div className="control-group">
        <div className="group-label">Rotation (°)</div>
        {(['X', 'Y', 'Z'] as const).map((axis, index) => (
          <RangeField
            key={`rotation-${axis}`}
            label={axis}
            value={projector.rotation[index]}
            min={-180}
            max={180}
            step={0.5}
            suffix="°"
            onChange={(value) => setVector('rotation', index as 0 | 1 | 2, value)}
          />
        ))}
      </div>

      <div className="control-group">
        <RangeField
          label="FOV"
          value={projector.fov}
          min={10}
          max={90}
          step={0.1}
          suffix="°"
          onChange={(value) => setProjector({ fov: value })}
        />
      </div>
    </section>
  );
}
