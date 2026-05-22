import { BrowserRouter, Routes, Route } from 'react-router-dom';


import StyleLayout from './components/StyleLayout';
import './App.css'
import Layout from './components/Layout';
import Home from './pages/Home';
import Club from './pages/Club';
import Event from './pages/Event';

import Student, { Students } from './pages/Students';
import UniversalPostFeedShowcase from './components/Posts/PostShowcase';
import Events from './pages/Events';
import ClubProfile from './pages/Clubs';
import UserProfileView from './pages/Profile';
import Projects from './pages/Projects';
import ChatWorkspace from './pages/Chat';

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StyleLayout />}>
          <Route element={<Layout />}>
            <Route path='/' element={<Home />} />
            <Route path='/students' element={<Students />} />
            <Route path='/club/:clubid' element={<Club />} />
            <Route path='/event/:eventid' element={<Event />} />
            <Route path='/profile/:profileid' element={<UserProfileView />} />
            <Route path='/events/' element={<Events />} />
            <Route path='/clubs/' element={<ClubProfile />} />
            <Route path='/projects/' element={<Projects />} />
            <Route path='/test1' element={< UniversalPostFeedShowcase/>} />
            <Route path='/chat' element={< ChatWorkspace/>} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>

  )
}

export default App
