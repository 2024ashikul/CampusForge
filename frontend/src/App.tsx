import { BrowserRouter, Routes, Route } from 'react-router-dom';


import StyleLayout from './components/StyleLayout';
import './App.css'
import Layout from './components/Layout';
import Home from './pages/Home';
import Club from './pages/Club';
import Event from './pages/Event';
import Profile from './pages/Profile';
import Student from './pages/Student';
import UniversalPostFeedShowcase from './components/Posts/PostShowcase';

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StyleLayout />}>
          <Route element={<Layout />}>
            <Route path='/' element={<Home />} />
            <Route path='/student/:studentid' element={<Student />} />
            <Route path='/club/:clubid' element={<Club />} />
            <Route path='/event/:eventid' element={<Event />} />
            <Route path='/profile/:profileid' element={<Profile />} />
            
            <Route path='/test1' element={< UniversalPostFeedShowcase/>} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>

  )
}

export default App
