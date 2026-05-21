
import NavBar from './NavBar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <>
      <NavBar />
      <div className=""> 
        <Outlet />
      </div>
    </>
  );
};

export default Layout;
