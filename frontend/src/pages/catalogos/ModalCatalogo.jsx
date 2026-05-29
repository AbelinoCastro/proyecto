const ModalCatalogo = ({ isOpen, onClose, title, onSave, cargando, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay dark */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Optimized Modal Panel */}
            <div className="relative z-10 w-full max-w-2xl bg-[#111112] border border-white/5 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.01]">
                    <div>
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest">{title}</h3>
                        <p className="text-[#C5A028] text-[9px] font-black uppercase tracking-widest mt-1 opacity-60">Sincronización de Datos Maestros</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body - Optimized spacing */}
                <div className="px-8 py-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-8 py-6 border-t border-white/5 bg-white/[0.01]">
                    <button
                        onClick={onClose}
                        disabled={cargando}
                        className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white bg-white/5 rounded-lg transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        disabled={cargando}
                        className="px-8 py-2.5 text-[10px] font-black uppercase tracking-widest bg-[#C5A028] hover:bg-[#A8871E] text-black rounded-lg shadow-lg shadow-[#C5A028]/10 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                        {cargando ? (
                            <><div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> Guardando...</>
                        ) : (
                            'Guardar Registro'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalCatalogo;
