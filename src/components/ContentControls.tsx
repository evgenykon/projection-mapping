import { useEffect, useState } from 'react';
import { useAppStore } from '../store';

export function ContentControls() {
  const videoUrl = useAppStore((state) => state.videoUrl);
  const setVideoUrl = useAppStore((state) => state.setVideoUrl);
  const [draft, setDraft] = useState(videoUrl);

  useEffect(() => {
    setDraft(videoUrl);
  }, [videoUrl]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== videoUrl) {
      setVideoUrl(next);
    }
  };

  return (
    <section className="panel-section">
      <div className="panel-label">Content</div>
      <label className="field">
        <span>Video URL</span>
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
          placeholder="./sample.mp4 or https://…"
          spellCheck={false}
        />
      </label>
      <p className="hint">
        The URL must be reachable from both windows. Use a same-origin file or a
        CORS-enabled URL. File uploads and OPFS assets are next.
      </p>
    </section>
  );
}
