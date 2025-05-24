import {useState, useEffect} from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { getMovies, deleteMovies } from '../utils/api';

export default function MoviesDetails(){
    const { id } = useParams()
    const navigate = useNavigate();

    const [movieDetails, setMovieDetails] = useState({
        id:'',
        title:'',
        description:'',
        date_added:'',
        date_updated:'',
        video_file:null
    })

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this movie?')) {
            try {
            await deleteMovies(id);
            alert('Movie deleted.');
            navigate('/movies');  // Redirect after delete
            } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete the movie.');
            }
        }
    };

    useEffect(()=>{
        console.log(id)
        console.log(movieDetails)
        getMovies(id).then(res => setMovieDetails(res.data))
        console.log(movieDetails)
    }, [id])

    

    return (
        <div>
        {movieDetails && movieDetails.video_file ? (<div>
            <h1>{movieDetails.title}</h1>
            <p>{movieDetails.date_added} | {movieDetails.date_updated}</p>

            <p>{movieDetails.description}</p>
            <video width="640" height="360" controls autoPlay muted loop poster="thumbnail.jpg">
                <source src={movieDetails.video_file} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <button onClick={handleDelete}>
                Delete
            </button>
        </div>) : <div>Loading</div>}
        </div>
    )
}