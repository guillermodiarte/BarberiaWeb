import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, Video, UploadCloud, Trash2, Copy, Check, ExternalLink, 
  RefreshCw, Folder, Sparkles, Filter, AlertCircle, Eye, X
} from 'lucide-react';
import { api } from '../../api';
import { ConfirmDialog } from '../../components/common/Modal';

const CATEGORIES = [
  { id: 'all', label: 'Todos los Medios', icon: Folder },
  { id: 'banner', label: '🖼️ Banner Principal', icon: ImageIcon },
  { id: 'galeria', label: '📸 Galería Web', icon: ImageIcon },
  { id: 'equipo', label: '👥 Nuestro Equipo', icon: ImageIcon },
  { id: 'sistema', label: '⚙️ Logos & Sistema', icon: ImageIcon },
  { id: 'videos', label: '🎬 Videos', icon: Video },
];

export const GalleryTab = ({ user }) => {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadFolder, setUploadFolder] = useState('galeria');
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const folderParam = selectedCategory === 'all' ? '' : selectedCategory;
      const data = await api.getMedia(folderParam);
      setMediaList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando medios:', err);
      setFeedback({ type: 'error', message: 'No se pudieron cargar los archivos multimedia.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [selectedCategory]);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setFeedback(null);

    let successCount = 0;
    let lastUrl = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', uploadFolder);

      try {
        const res = await api.uploadMedia(formData);
        if (res?.success) {
          successCount++;
          lastUrl = res.url;
        }
      } catch (err) {
        console.error('Error subiendo archivo:', err);
        setFeedback({ 
          type: 'error', 
          message: `Error al subir ${file.name}: ${err.message || 'Error en el servidor'}` 
        });
      }
    }

    setUploading(false);
    e.target.value = '';

    if (successCount > 0) {
      setFeedback({
        type: 'success',
        message: `¡${successCount} archivo(s) optimizado(s) a formato WebP/WebM y guardado(s) con éxito en /${uploadFolder}!`
      });
      loadMedia();
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteMedia(deleteTarget.folder, deleteTarget.filename);
      setMediaList(prev => prev.filter(item => item.url !== deleteTarget.url));
      setDeleteTarget(null);
      setFeedback({ type: 'success', message: 'Archivo eliminado correctamente del servidor.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error al eliminar archivo' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = selectedCategory === 'all'
    ? mediaList
    : mediaList.filter(item => item.folder === selectedCategory);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading flex items-center space-x-2">
            <ImageIcon className="w-6 h-6 text-amber-400" />
            <span>Gestor de Galería & Medios del Servidor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sube fotos y videos para el carrusel del banner, catálogo de cortes, fotos del equipo y logos.
            Todos los archivos se convierten automáticamente a <strong>.webp</strong> o <strong>.webm</strong> ultra ligeros.
          </p>
        </div>

        <button
          onClick={loadMedia}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between space-x-2 border shadow-lg ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' 
            : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
        }`}>
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? <Sparkles className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Zone & Folder Select */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <span>Subir Nuevas Fotos / Videos</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Optimización automática al 82% de compresión sin pérdida visual apreciable.
            </p>
          </div>

          {/* Target Folder Selector */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-1.5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 pl-2">Carpeta de destino:</span>
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="banner">🖼️ Banner Principal</option>
              <option value="galeria">📸 Galería General</option>
              <option value="equipo">👥 Nuestro Equipo</option>
              <option value="sistema">⚙️ Logos & Sistema</option>
              <option value="videos">🎬 Videos</option>
            </select>
          </div>
        </div>

        {/* Drag and Drop / Click Area */}
        <label className={`block cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          uploading
            ? 'border-amber-500/60 bg-amber-500/5 animate-pulse'
            : 'border-slate-700/80 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-950'
        }`}>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            disabled={uploading}
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-bold text-white">
                {uploading ? 'Convirtiendo a formato WebP/WebM y optimizando...' : 'Haz clic o arrastra fotos/videos aquí para subir'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Destino seleccionado: <strong className="text-amber-400 font-mono">uploads/{uploadFolder}/</strong>
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl scrollbar-thin">
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat.id;
          const count = cat.id === 'all' 
            ? mediaList.length 
            : mediaList.filter(m => m.folder === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-3" />
          <span>Cargando galería de medios...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-white">No hay archivos en esta categoría</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Usa el recuadro superior para subir imágenes o videos. Se organizarán automáticamente en la carpeta correspondiente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.url}
              className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              {/* Media Thumbnail */}
              <div 
                onClick={() => setPreviewMedia(item)}
                className="relative aspect-square w-full bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center"
              >
                {item.type === 'video' ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                    <Video className="w-10 h-10 text-amber-400/80" />
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-amber-400">
                      VIDEO
                    </span>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.filename}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <span className="p-2 bg-slate-900/90 rounded-full text-white shadow">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>

                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-950/80 text-slate-300 border border-slate-800">
                  {item.size_kb} KB
                </span>
              </div>

              {/* Info & Quick Actions */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-amber-400 font-bold uppercase truncate max-w-[120px]" title={item.filename}>
                    {item.filename}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.url)}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-300 hover:text-amber-400 transition-colors"
                    title="Copiar URL para el Banner o Logo"
                  >
                    {copiedUrl === item.url ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar URL</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                    title="Eliminar del servidor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewMedia && (
        <div 
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white font-mono">{previewMedia.filename}</h4>
                <p className="text-[11px] text-slate-400">Carpeta: /{previewMedia.folder} · Tamaño: {previewMedia.size_kb} KB</p>
              </div>
              <button onClick={() => setPreviewMedia(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              {previewMedia.type === 'video' ? (
                <video src={previewMedia.url} controls className="max-h-[65vh] rounded-2xl w-full" autoPlay />
              ) : (
                <img src={previewMedia.url} alt={previewMedia.filename} className="max-h-[65vh] object-contain rounded-2xl" />
              )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 truncate max-w-md">{previewMedia.url}</span>
              <button
                onClick={() => handleCopyUrl(previewMedia.url)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar URL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="¿Eliminar archivo permanentemente?"
        message={`¿Estás seguro de que deseas eliminar "${deleteTarget?.filename}"? Se borrará del servidor y las secciones que usen esta URL dejarán de mostrarla.`}
        confirmText={deleting ? 'Eliminando...' : 'Sí, Eliminar Archivo'}
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
