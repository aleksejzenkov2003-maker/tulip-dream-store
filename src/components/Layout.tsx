import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatBot from './ChatBot';

const Layout = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <ChatBot />
  </div>
);

export default Layout;
