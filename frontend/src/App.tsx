import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Matches from './pages/Matches';
import MatchDetails from './pages/MatchDetails';
import { PublicRoute, PrivateRoute } from './components/Routes';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<PublicRoute><Login/></PublicRoute>}/>
        <Route path="/register" element={<PublicRoute><Register/></PublicRoute>}/>
        <Route path="/matches" element={<PrivateRoute><Matches/></PrivateRoute>}/>
        <Route path="/matches/:link" element={<MatchDetails/>}/>
      </Routes>
    </Router>
  );
}

export default App;