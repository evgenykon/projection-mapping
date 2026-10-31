import { useState } from 'react';
import type { ObjectKind } from '../types';
import { useAppStore } from '../store';
import { ObjectInspector } from './ObjectInspector';

const KIND_LABELS: Record<ObjectKind, string> = {
  plane: 'Plane',
  box: 'Box',
  cylinder: 'Cylinder',
  sphere: 'Sphere',
  glb: 'GLB',
};

export function ScenePanel() {
  const objects = useAppStore((state) => state.objects);
  const selectedId = useAppStore((state) => state.selectedId);
  const selectObject = useAppStore((state) => state.selectObject);
  const addObject = useAppStore((state) => state.addObject);
  const removeObject = useAppStore((state) => state.removeObject);
  const [kind, setKind] = useState<ObjectKind>('box');

  const selected = objects.find((object) => object.id === selectedId) ?? null;

  return (
    <>
      <section className="panel-section">
        <div className="panel-label">Scene objects</div>
        <div className="add-object-row">
          <select
            className="select-input"
            value={kind}
            onChange={(event) => setKind(event.target.value as ObjectKind)}
          >
            <option value="plane">Plane</option>
            <option value="box">Box</option>
            <option value="cylinder">Cylinder</option>
            <option value="sphere">Sphere</option>
            <option value="glb">GLB model</option>
          </select>
          <button className="primary" onClick={() => addObject(kind)}>
            Add
          </button>
        </div>

        <div className="object-list">
          {objects.map((object) => (
            <div
              key={object.id}
              className={
                object.id === selectedId ? 'object-row selected' : 'object-row'
              }
              role="button"
              tabIndex={0}
              onClick={() => selectObject(object.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  selectObject(object.id);
                }
              }}
            >
              <span className="object-kind">
                {KIND_LABELS[object.kind]}
              </span>
              <span className="object-name">{object.name}</span>
              {object.content === 'video' ? (
                <span className="object-badge">video</span>
              ) : null}
              {object.locked ? <span className="object-badge lock">lock</span> : null}
              <button
                className="icon-button"
                title="Delete object"
                onClick={(event) => {
                  event.stopPropagation();
                  removeObject(object.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <p className="hint">
          Click an object in the 3D view or in this list. Gizmo mode is in the
          viewport toolbar.
        </p>
      </section>

      <section className="panel-section">
        <div className="panel-label">Inspector</div>
        {selected ? (
          <ObjectInspector object={selected} />
        ) : (
          <p className="hint">Select an object to edit it.</p>
        )}
      </section>
    </>
  );
}
