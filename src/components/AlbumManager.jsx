import { useState, useEffect } from 'react';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // keep in sync with /api/album
const MAX_IMAGES = 60;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AlbumForm({ initialData, onSuccess }) {
  const isEditing = !!initialData?.id;
  const [name, setName] = useState(initialData?.name || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [link, setLink] = useState(initialData?.link || '');
  const [existingImages, setExistingImages] = useState(initialData?.images || []);
  const [newImages, setNewImages] = useState([]); // data URLs
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalImages = existingImages.length + newImages.length;

  const handleFiles = async (e) => {
    setError('');
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    if (totalImages + files.length > MAX_IMAGES) {
      setError(`Too many images — max ${MAX_IMAGES} per album.`);
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(`"${file.name}" is too large — each image must be under 2 MB.`);
        return;
      }
    }

    const dataUrls = await Promise.all(files.map(readFileAsDataUrl));
    setNewImages((prev) => [...prev, ...dataUrls]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !link.trim()) {
      setError('Name and album link are required.');
      return;
    }
    if (totalImages === 0) {
      setError('Add at least one preview image.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const url = isEditing ? `/api/album?id=${initialData.id}` : '/api/album';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing
        ? { name, date, link, keepImageIds: existingImages.map((i) => i.id), newImages }
        : { name, date, link, images: newImages };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSuccess(isEditing ? 'Album updated.' : 'Album created.');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save album.');
      }
    } catch {
      setError('Network error — could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative z-10 space-y-6 font-mono text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="label-neon">Album Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., INN 2026"
            className="input-field"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="label-neon">Date <span className="text-white/40 normal-case tracking-normal">(display text)</span></label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="e.g., May 2026"
            className="input-field"
          />
        </div>
        <div className="space-y-2">
          <label className="label-neon">Album Link</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://photos.app.goo.gl/..."
            className="input-field"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="label-neon">
          Preview Images <span className="text-white/40 normal-case tracking-normal">({totalImages}/{MAX_IMAGES} · max 2&nbsp;MB each)</span>
        </label>

        {(existingImages.length > 0 || newImages.length > 0) && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-[#00F0FF]/15 bg-[#00F0FF]/[0.02] p-3 [scrollbar-gutter:stable_both-edges]">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {existingImages.map((img) => (
                <div key={`e-${img.id}`} className="relative group aspect-square">
                  <img src={img.url} alt="" className="w-full h-full object-cover rounded border border-[#00F0FF]/20" />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => setExistingImages((prev) => prev.filter((i) => i.id !== img.id))}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-[#020617]/80 border border-red-500/60 text-red-400 text-xs rounded opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {newImages.map((src, idx) => (
                <div key={`n-${idx}`} className="relative group aspect-square">
                  <img src={src} alt="" className="w-full h-full object-cover rounded border border-[#00F0FF]/50" />
                  <span className="absolute bottom-1 left-1 text-[8px] bg-[#00F0FF] text-[#020617] px-1 rounded font-bold tracking-wider">NEW</span>
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-[#020617]/80 border border-red-500/60 text-red-400 text-xs rounded opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="block border-2 border-dashed border-[#00F0FF]/30 rounded-lg p-6 text-center hover:border-[#00F0FF]/60 hover:bg-[#00F0FF]/[0.03] transition-colors cursor-pointer">
          <div className="text-[#00F0FF] text-2xl">📸</div>
          <p className="text-[#94a3b8] text-xs mt-2">Click to add preview images <span className="text-white/40">(multiple allowed)</span></p>
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
        </label>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded-md text-xs flex items-center gap-3">
          <span className="text-lg font-bold">!</span>
          <p>{error}</p>
        </div>
      )}

      <button type="submit" disabled={submitting} className="submit-btn disabled:opacity-50 disabled:cursor-not-allowed">
        {submitting ? 'Saving…' : isEditing ? 'Save Album' : 'Create Album'}
      </button>
    </form>
  );
}

export default function AlbumManager() {
  const [albums, setAlbums] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchAlbums(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchAlbums = async () => {
    try {
      const res = await fetch('/api/album');
      setAlbums(await res.json());
    } catch (e) { console.error('Failed to load albums', e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('[ WARNING ] DELETE ALBUM?')) return;
    const res = await fetch(`/api/album?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAlbums((prev) => prev.filter((a) => a.id !== id));
      setToast('Album deleted.');
    }
  };

  const openNew = () => { setEditing(null); setIsModalOpen(true); };
  const openEdit = (album) => { setEditing(album); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditing(null); };

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-6 right-6 z-[1000]">
          <div className="bg-[#00F0FF]/10 border border-[#00F0FF] text-[#00F0FF] px-4 py-3 rounded-md font-mono text-xs flex items-center gap-3">
            <span className="text-lg font-bold">✓</span>
            <p className="tracking-wide uppercase">{toast}</p>
          </div>
        </div>
      )}

      <div className="flex justify-center md:justify-end mb-5 md:mb-8">
        <button
          onClick={openNew}
          className="w-full md:w-auto px-6 py-2 border border-[#00F0FF] text-[#00F0FF] font-mono text-xs hover:bg-[#00F0FF] hover:text-[#020617] transition-all"
        >
          + NEW ALBUM
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="border border-dashed border-[#00F0FF]/20 p-12 text-center text-[#94a3b8] font-mono text-sm">
          [ NO ALBUMS YET ] <span className="text-white/40">— click + NEW ALBUM to add one</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-mono">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group flex flex-col border border-[#00F0FF]/25 bg-[#00F0FF]/[0.03] rounded-lg overflow-hidden transition-all duration-300 hover:border-[#00F0FF]/60 hover:shadow-[0_0_22px_rgba(0,240,255,0.15)]"
            >
              {/* Cover */}
              <div className="relative h-40 bg-slate-900/60 overflow-hidden">
                {album.images.length > 0 ? (
                  <img
                    src={album.images[0].url}
                    alt={album.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">No previews</div>
                )}
                <span className="absolute bottom-2 right-2 text-[10px] bg-[#020617]/85 border border-[#00F0FF]/40 text-[#00F0FF] px-2 py-0.5 rounded-full">
                  {album.images.length} photo{album.images.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Info */}
              <div className="p-4 space-y-1 flex-1">
                <h3 className="text-white font-bold text-base leading-tight">{album.name}</h3>
                {album.date && <p className="text-[11px] text-white/50 tracking-wide">{album.date}</p>}
                <a
                  href={album.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[11px] text-[#00F0FF] hover:underline truncate max-w-full"
                >
                  View gallery →
                </a>
              </div>

              {/* Actions */}
              <div className="flex gap-2 p-3 pt-0">
                <button onClick={() => openEdit(album)} className="flex-1 px-2 py-1.5 border border-[#00F0FF] text-[#00F0FF] text-xs tracking-wider hover:bg-[#00F0FF] hover:text-[#020617] transition-all">EDIT</button>
                <button onClick={() => handleDelete(album.id)} className="flex-1 px-2 py-1.5 border border-red-500/40 text-red-500 text-xs tracking-wider hover:bg-red-500 hover:text-white transition-all">DELETE</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-2xl bg-[#020617] border border-[#00F0FF]/40 p-8 md:p-12 shadow-[0_0_50px_rgba(0,240,255,0.15)] max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#00F0FF] font-mono text-xs">[CLOSE_X]</button>
            <h2 className="text-[#00F0FF] text-xl font-bold mb-8 tracking-widest uppercase">{editing ? 'Edit Album' : 'New Album'}</h2>
            <AlbumForm
              initialData={editing}
              onSuccess={(msg) => { closeModal(); fetchAlbums(); setToast(msg); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
