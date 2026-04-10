const ModalCatalogo = ({ isOpen, onClose, title, onSave, cargando, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-lg mx-4 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h3 className="text-white font-semibold text-base">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        disabled={cargando}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        disabled={cargando}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {cargando ? (
                            <><span className="animate-spin">⏳</span> Guardando...</>
                        ) : (
                            'Guardar cambios'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalCatalogo;
