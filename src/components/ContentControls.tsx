import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import {
  formatBytes,
  getAssetMeta,
  saveVideoFile,
} from '../lib/assets';

export function ContentControls() {
  const videoUrl = useAppStore((state) => state.videoUrl);
  const setVideoUrl = useAppStore((state) => state.setVideoUrl);
  const isAsset = videoUrl.startsWith('asset:');
  const [draft, setDraft] = useState(isAsset ? '' : videoUrl);
  const [assetName, setAssetName] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(videoUrl.startsWith('asset:') ? '' : videoUrl);
    if (videoUrl.startsWith('asset:')) {
      const meta = getAssetMeta(videoUrl.slice('asset:'.length));
      setAssetName(meta?.name ?? 'Загруженное видео');
    } else {
      setAssetName(null);
    }
  }, [videoUrl]);

  const applyUrl = () => {
    const next = draft.trim();
    if (!next) {
      return;
    }
    setVideoUrl(next);
    setStatus(`Видео по ссылке: ${next}`);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setBusy(true);
    setStatus('Сохраняю видео в браузере…');
    try {
      const { url, meta } = await saveVideoFile(file);
      setVideoUrl(url);
      setAssetName(meta.name);
      setStatus(`${meta.name} · ${formatBytes(meta.size)}`);
    } catch {
      setStatus('Не удалось сохранить видео. Попробуй файл меньшего размера.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel-section">
      <div className="panel-label">Video</div>
      <p className="hint">
        Вставь прямую ссылку на видеофайл или загрузи локальный файл. Ссылка
        должна быть доступна из обоих окон и разрешать CORS.
      </p>

      <div className="url-row">
        <input
          className="text-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applyUrl();
            }
          }}
          placeholder={
            isAsset ? 'Активно загруженное видео' : 'https://…/video.mp4'
          }
          spellCheck={false}
        />
        <button
          className="primary small"
          onClick={applyUrl}
          disabled={!draft.trim()}
        >
          Применить
        </button>
      </div>

      <div className="or-separator">
        <span>или</span>
      </div>

      <label className={busy ? 'file-button busy' : 'file-button'}>
        <input
          type="file"
          accept="video/*"
          onChange={handleFile}
          disabled={busy}
        />
        <span>{busy ? 'Загрузка…' : 'Загрузить видеофайл'}</span>
      </label>

      {assetName ? (
        <div className="asset-row">
          <span className="asset-name" title={assetName}>
            {assetName}
          </span>
          <button
            className="ghost small"
            onClick={() => {
              setVideoUrl('./sample.mp4');
              setStatus(null);
            }}
          >
            Убрать
          </button>
        </div>
      ) : null}

      {status ? <p className="hint">{status}</p> : null}
      <p className="hint">
        Нужна прямая ссылка на `.mp4`/`.webm`; страницы YouTube и Vimeo не
        подойдут. Загруженный файл хранится в браузере и не входит в JSON сцены.
      </p>
    </section>
  );
}
