import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Movies from './pages/Movies';
import MovieCreate from './pages/MoviesCreate';
import MoviesDetails from './pages/MoviesDetails';
export default function App() {

  return (
    
  <Router>
        <div className="container">
          <Routes>
            <Route path="/" element={<Movies />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:id" element={<MoviesDetails />} />
            <Route path="/movies/create" element={<MovieCreate />} />
            <Route path="/movies/update/:id" element={<MovieCreate />} />
        </Routes>
        </div>

    </Router>
  )
}


