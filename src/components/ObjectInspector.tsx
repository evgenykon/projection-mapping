import { useEffect, useRef, useState } from 'react';
import type { ObjectSize, SceneObject, Vec3 } from '../types';
import { useAppStore } from '../store';

function NumberInput({
  value,
  onChange,
  step = 0.01,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setDraft(String(value));
    }
  }, [value]);

  const clamp = (next: number) => {
    let result = next;
    if (min !== undefined) {
      result = Math.max(min, result);
    }
    if (max !== undefined) {
      result = Math.min(max, result);
    }
    return result;
  };

  const commit = () => {
    focused.current = false;
    let next = Number(draft);
    if (!Number.isFinite(next)) {
      setDraft(String(value));
      return;
    }
    next = clamp(next);
    onChange(next);
    setDraft(String(next));
  };

  return (
    <input
      className="number-input"
      type="text"
      inputMode="decimal"
      value={draft}
      data-step={step}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        const next = Number(text);
        if (text.trim() !== '' && Number.isFinite(next)) {
          onChange(clamp(next));
        }
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function VectorField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: Vec3;
  step: number;
  onChange: (index: 0 | 1 | 2, value: number) => void;
}) {
  return (
    <div className="vector-field">
      <div className="vector-label">{label}</div>
      <div className="vector-inputs">
        {(['X', 'Y', 'Z'] as const).map((axis, index) => (
          <label key={axis} className="axis-input">
            <span>{axis}</span>
            <NumberInput
              value={value[index]}
              step={step}
              onChange={(next) => onChange(index as 0 | 1 | 2, next)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function setVec(value: Vec3, index: 0 | 1 | 2, next: number): Vec3 {
  const copy = [...value] as Vec3;
  copy[index] = next;
  return copy;
}

function GlbUrlField({ object }: { object: SceneObject }) {
  const updateObject = useAppStore((state) => state.updateObject);
  const [draft, setDraft] = useState(object.glbUrl ?? '');

  useEffect(() => {
    setDraft(object.glbUrl ?? '');
  }, [object.glbUrl]);

  const commit = () => {
    const next = draft.trim();
    if (next !== (object.glbUrl ?? '')) {
      updateObject(object.id, { glbUrl: next });
    }
  };

  return (
    <>
      <label className="field">
        <span>GLB URL</span>
        <input
          className="text-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
          placeholder="https://…/model.glb"
          spellCheck={false}
        />
      </label>
      <p className="hint">
        Must be a CORS-enabled URL reachable from both windows.
      </p>
    </>
  );
}

export function ObjectInspector({ object }: { object: SceneObject }) {
  const updateObject = useAppStore((state) => state.updateObject);
  const duplicateObject = useAppStore((state) => state.duplicateObject);
  const removeObject = useAppStore((state) => state.removeObject);
  const maskEditingId = useAppStore((state) => state.maskEditingId);
  const setMaskEditing = useAppStore((state) => state.setMaskEditing);

  const setSize = (key: keyof ObjectSize, value: number) => {
    updateObject(object.id, {
      size: { [key]: value } as Partial<ObjectSize>,
    });
  };

  return (
    <div className="inspector">
      <label className="field">
        <span>Name</span>
        <input
          className="text-input"
          value={object.name}
          onChange={(event) =>
            updateObject(object.id, { name: event.target.value })
          }
        />
      </label>

      <div className="object-meta">
        {object.kind} · {object.id.slice(0, 8)}
      </div>

      <div className="inspector-group">
        <div className="group-label">Transform</div>
        <VectorField
          label="Position"
          value={object.position}
          step={0.01}
          onChange={(index, value) =>
            updateObject(object.id, {
              position: setVec(object.position, index, value),
            })
          }
        />
        <VectorField
          label="Rotation"
          value={object.rotation}
          step={1}
          onChange={(index, value) =>
            updateObject(object.id, {
              rotation: setVec(object.rotation, index, value),
            })
          }
        />
        <VectorField
          label="Scale"
          value={object.scale}
          step={0.01}
          onChange={(index, value) =>
            updateObject(object.id, {
              scale: setVec(object.scale, index, value),
            })
          }
        />
      </div>

      <div className="inspector-group">
        <div className="group-label">Size</div>
        {object.kind === 'plane' ? (
          <>
            <label className="field-row">
              <span>Width</span>
              <NumberInput
                value={object.size.width}
                min={0.01}
                onChange={(value) => setSize('width', value)}
              />
            </label>
            <label className="field-row">
              <span>Height</span>
              <NumberInput
                value={object.size.height}
                min={0.01}
                onChange={(value) => setSize('height', value)}
              />
            </label>
          </>
        ) : null}
        {object.kind === 'box' ? (
          <>
            <label className="field-row">
              <span>Width</span>
              <NumberInput
                value={object.size.width}
                min={0.01}
                onChange={(value) => setSize('width', value)}
              />
            </label>
            <label className="field-row">
              <span>Height</span>
              <NumberInput
                value={object.size.height}
                min={0.01}
                onChange={(value) => setSize('height', value)}
              />
            </label>
            <label className="field-row">
              <span>Depth</span>
              <NumberInput
                value={object.size.depth}
                min={0.01}
                onChange={(value) => setSize('depth', value)}
              />
            </label>
          </>
        ) : null}
        {object.kind === 'cylinder' ? (
          <>
            <label className="field-row">
              <span>Radius top</span>
              <NumberInput
                value={object.size.radiusTop}
                min={0.01}
                onChange={(value) => setSize('radiusTop', value)}
              />
            </label>
            <label className="field-row">
              <span>Radius bottom</span>
              <NumberInput
                value={object.size.radiusBottom}
                min={0.01}
                onChange={(value) => setSize('radiusBottom', value)}
              />
            </label>
            <label className="field-row">
              <span>Height</span>
              <NumberInput
                value={object.size.height}
                min={0.01}
                onChange={(value) => setSize('height', value)}
              />
            </label>
            <label className="field-row">
              <span>Segments</span>
              <NumberInput
                value={object.size.segments}
                step={1}
                min={3}
                max={128}
                onChange={(value) => setSize('segments', Math.round(value))}
              />
            </label>
          </>
        ) : null}
        {object.kind === 'sphere' ? (
          <>
            <label className="field-row">
              <span>Radius</span>
              <NumberInput
                value={object.size.radius}
                min={0.01}
                onChange={(value) => setSize('radius', value)}
              />
            </label>
            <label className="field-row">
              <span>Segments</span>
              <NumberInput
                value={object.size.segments}
                step={1}
                min={3}
                max={128}
                onChange={(value) => setSize('segments', Math.round(value))}
              />
            </label>
          </>
        ) : null}
        {object.kind === 'glb' ? (
          <p className="hint">Use Scale above to fit the imported model.</p>
        ) : null}
      </div>

      <div className="inspector-group">
        <div className="group-label">Content</div>
        {object.kind !== 'glb' ? (
          <label className="field">
            <span>Source</span>
            <select
              className="select-input"
              value={object.content}
              onChange={(event) =>
                updateObject(object.id, {
                  content: event.target.value as SceneObject['content'],
                })
              }
            >
              <option value="none">Solid color</option>
              <option value="video">Video</option>
            </select>
          </label>
        ) : null}
        {object.kind !== 'glb' ? (
          <label className="field-row">
            <span>Color</span>
            <input
              className="color-input"
              type="color"
              value={object.color}
              onChange={(event) =>
                updateObject(object.id, { color: event.target.value })
              }
            />
          </label>
        ) : null}
        {object.kind === 'glb' ? <GlbUrlField object={object} /> : null}
        {object.kind !== 'glb' && object.content === 'video' ? (
          <p className="hint">
            Uses the global Video URL from the Content section below.
          </p>
        ) : null}
      </div>

      {object.kind === 'plane' ? (
        <div className="inspector-group">
          <div className="group-label">Mask</div>
          <p className="hint">
            Clip the content with a polygon drawn on the projector preview.
          </p>
          <div className="action-row">
            <button
              className={maskEditingId === object.id ? 'active' : ''}
              onClick={() =>
                setMaskEditing(
                  maskEditingId === object.id ? null : object.id,
                )
              }
            >
              {maskEditingId === object.id ? 'Done' : 'Draw mask'}
            </button>
            <button
              disabled={(object.mask?.length ?? 0) === 0}
              onClick={() => updateObject(object.id, { mask: null })}
            >
              Clear
            </button>
          </div>
          <div className="action-row">
            <button
              disabled={(object.mask?.length ?? 0) === 0}
              onClick={() =>
                updateObject(object.id, {
                  mask: (object.mask ?? []).slice(0, -1),
                })
              }
            >
              Undo point
            </button>
            <span className="hint mask-count">
              {object.mask?.length ?? 0} points
            </span>
          </div>
        </div>
      ) : null}

      <div className="inspector-group">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={object.locked}
            onChange={(event) =>
              updateObject(object.id, { locked: event.target.checked })
            }
          />
          Lock transform
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={object.visible}
            onChange={(event) =>
              updateObject(object.id, { visible: event.target.checked })
            }
          />
          Visible
        </label>
      </div>

      <div className="action-row">
        <button onClick={() => duplicateObject(object.id)}>Duplicate</button>
        <button className="danger" onClick={() => removeObject(object.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
