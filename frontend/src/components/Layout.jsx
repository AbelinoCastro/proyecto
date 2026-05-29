import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex h-screen bg-[#080808] overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto no-scrollbar">
                <main className="flex-1 py-4">
                    <div className="max-w-[1200px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
