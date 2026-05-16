import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const { pathname } = useLocation();
    const isDashboard = pathname === '/';

    return (
        <div className="flex min-h-screen bg-[#0b0e14]">
            {!isDashboard && <Sidebar />}
            <main className="flex-1 overflow-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;