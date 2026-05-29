import { useEffect, useRef, useState } from 'react';

// 🔧 URL fija del workbook publicado en Tableau Cloud
const TABLEAU_URL = 'https://us-east-1.online.tableau.com/t/lmoraless17-7c6afdf73a/views/ReportesNominaempleados/Dashboard1';

const TIMEOUT_AUTENTICACION = 12;

const getSDKUrl = (url) => {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/javascripts/api/tableau.embedding.3.latest.min.js`;
};

const getLoginUrl = (url) => {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/`;
};

const ReporteriaCloudPage = () => {
    const containerRef = useRef(null);
    const timeoutRef   = useRef(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [needAuth, setNeedAuth]   = useState(false);
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    // Cargar SDK
    useEffect(() => {
        const sdkUrl = getSDKUrl(TABLEAU_URL);
        if (document.querySelector(`script[src="${sdkUrl}"]`)) {
            setSdkLoaded(true);
            return;
        }
        const s = document.createElement('script');
        s.type = 'module';
        s.src  = sdkUrl;
        s.onload  = () => setSdkLoaded(true);
        s.onerror = () => setError('No se pudo cargar el SDK de Tableau.');
        document.head.appendChild(s);
    }, []);

    // Crear viz
    useEffect(() => {
        if (!sdkLoaded || !containerRef.current) return;
        setLoading(true);
        setError('');
        setNeedAuth(false);
        containerRef.current.innerHTML = '';

        const t = setTimeout(() => {
            const viz = document.createElement('tableau-viz');
            viz.setAttribute('id', 'tableauViz');
            viz.setAttribute('src', TABLEAU_URL);
            viz.setAttribute('toolbar', 'bottom');
            viz.setAttribute('device', 'desktop');
            viz.style.width  = '100%';
            viz.style.height = '100%';

            viz.addEventListener('firstinteractive', () => {
                clearTimeout(timeoutRef.current);
                setLoading(false);
            });
            viz.addEventListener('vizloaderror', () => {
                clearTimeout(timeoutRef.current);
                setLoading(false);
                setError('Error al cargar el dashboard.');
            });

            containerRef.current.appendChild(viz);

            timeoutRef.current = setTimeout(() => {
                setLoading(false);
                setNeedAuth(true);
            }, TIMEOUT_AUTENTICACION * 1000);
        }, 100);

        return () => {
            clearTimeout(t);
            clearTimeout(timeoutRef.current);
        };
    }, [sdkLoaded, reloadKey]);

    const handleAbrirTableau = () => window.open(getLoginUrl(TABLEAU_URL), '_blank');
    const handleReintentar = () => setReloadKey(k => k + 1);

    return (
        <div className="p-6 min-h-screen">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">☁️ Reportería Cloud</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Dashboards interactivos de Tableau Cloud · conectado vía Tableau Bridge
                    </p>
                </div>

                <button
                    onClick={handleReintentar}
                    title="Recargar dashboard"
                    className="px-4 py-2 rounded-xl bg-[#0b0e14] border border-white/5 hover:bg-white/5 text-sm text-gray-300 transition-colors"
                >
                    🔄 Recargar
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                    ✕ {error}
                </div>
            )}

            {/* Aviso autenticación */}
            {needAuth && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-5 py-4 rounded-2xl mb-4">
                    <p className="font-semibold mb-2">⚠️ Necesitas iniciar sesión en Tableau Cloud</p>
                    <p className="text-sm text-amber-200/80 mb-3">
                        Parece que no tienes una sesión activa en Tableau Cloud en este navegador.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={handleAbrirTableau}
                            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-sm font-medium transition-colors">
                            🔐 Abrir Tableau Cloud
                        </button>
                        <button onClick={handleReintentar}
                            className="px-4 py-2 rounded-xl bg-[#0b0e14] border border-white/10 hover:bg-white/5 text-sm text-gray-300 transition-colors">
                            🔄 Ya inicié sesión, reintentar
                        </button>
                    </div>
                </div>
            )}

            {/* Visor */}
            <div
                className="bg-[#121621] border border-white/5 overflow-auto relative rounded-2xl"
                style={{ height: 'calc(100vh - 180px)' }}
            >
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121621]/80 backdrop-blur-sm z-10">
                        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-gray-400 text-sm">Cargando dashboard de Tableau...</p>
                        <p className="text-gray-600 text-xs mt-2">
                            Si tarda más de {TIMEOUT_AUTENTICACION}s, probablemente necesitas iniciar sesión.
                        </p>
                    </div>
                )}

                <div
                    ref={containerRef}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
};

export default ReporteriaCloudPage;
