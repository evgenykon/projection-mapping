import { useEffect, useState } from 'react';
import { getSyncState, useStore } from '../store';
import {
  deleteSceneFromLibrary,
  downloadSceneFile,
  listSavedScenes,
  readSceneFile,
  saveSceneToLibrary,
  type SavedScene,
} from '../lib/sceneStorage';
import type { SyncState } from '../types';

function sceneSnapshot(): SyncState {
  return {
    ...getSyncState(),
    playing: false,
    blackout: false,
    calibration: false,
    currentTime: 0,
    selectedId: null,
  };
}

export function SceneLibrary() {
  const loadScene = useStore((state) => state.loadScene);
  const newScene = useStore((state) => state.newScene);
  const [scenes, setScenes] = useState<SavedScene[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const refresh = () => setScenes(listSavedScenes());

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = () => {
    const suggested = selectedName || `Сцена ${scenes.length + 1}`;
    const name = window.prompt('Название сцены', suggested);
    if (!name?.trim()) {
      return;
    }
    saveSceneToLibrary(name.trim(), sceneSnapshot());
    refresh();
    setSelectedName(name.trim());
    setStatus(`Сохранено: ${name.trim()}`);
  };

  const handleLoad = () => {
    const scene = scenes.find((item) => item.name === selectedName);
    if (!scene) {
      return;
    }
    loadScene(scene.state);
    setStatus(`Загружено: ${scene.name}`);
  };

  const handleDelete = () => {
    if (!selectedName) {
      return;
    }
    if (!window.confirm(`Удалить сцену «${selectedName}»?`)) {
      return;
    }
    deleteSceneFromLibrary(selectedName);
    refresh();
    setSelectedName('');
    setStatus(`Удалено: ${selectedName}`);
  };

  const handleNew = () => {
    if (!window.confirm('Начать новую сцену с одним экраном? Несохранённые изменения будут потеряны.')) {
      return;
    }
    newScene();
    setSelectedName('');
    setStatus('Новая сцена: один экран');
  };

  const handleExport = () => {
    downloadSceneFile(sceneSnapshot(), selectedName || 'scene');
    setStatus('JSON экспортирован');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      const state = await readSceneFile(file);
      const name = file.name.replace(/\.json$/i, '') || 'Импорт';
      saveSceneToLibrary(name, state);
      loadScene(state);
      refresh();
      setSelectedName(name);
      setStatus(`Импортировано: ${file.name}`);
    } catch {
      setStatus('Не удалось прочитать JSON сцены');
    }
  };

  return (
    <section className="panel-section">
      <div className="panel-label">Scene</div>
      <p className="hint">
        Сцена = объекты, калибровка, сценарий и видео. Сохраняется в браузере;
        можно экспортировать в JSON.
      </p>

      <div className="action-row">
        <button className="primary" onClick={handleSave}>
          Сохранить
        </button>
        <button onClick={handleNew}>Новая</button>
      </div>

      <label className="field">
        <span>Сохранённые сцены</span>
        <select
          className="select-input"
          value={selectedName}
          onChange={(event) => setSelectedName(event.target.value)}
        >
          <option value="">— выбрать —</option>
          {scenes.map((scene) => (
            <option key={scene.name} value={scene.name}>
              {scene.name}
            </option>
          ))}
        </select>
      </label>

      <div className="action-row">
        <button disabled={!selectedName} onClick={handleLoad}>
          Загрузить
        </button>
        <button disabled={!selectedName} onClick={handleDelete}>
          Удалить
        </button>
      </div>

      <div className="action-row">
        <button onClick={handleExport}>Экспорт JSON</button>
        <label className="file-button compact">
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
          />
          <span>Импорт JSON</span>
        </label>
      </div>

      {status ? <p className="hint">{status}</p> : null}
      <p className="hint">
        Видео, загруженное файлом, хранится локально и не входит в JSON. Для
        переноса сцены используй прямую ссылку в блоке Video.
      </p>
    </section>
  );
}
