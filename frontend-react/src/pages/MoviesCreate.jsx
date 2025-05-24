import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { updateMovie, createMovie, getMovies } from '../utils/api';


export default function MovieCreate() {
    const { id } = useParams();

    const [movieDetails, setMovieDetails] = useState({
        title: '',
        description: '',
        video_file: null, 
    });

    const [videoPreview, setVideoPreview] = useState(null); // For previewing uploaded file

    useEffect(() => {
        if (id) {
        getMovies(id).then(res => {
            setMovieDetails(res.data)
            setVideoPreview(res.data.video_file)
        });
        }
    }, [id]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setMovieDetails(prev => ({
        ...prev,
        [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setMovieDetails(prev => ({ ...prev, video_file: file }));
        setVideoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (id) {
        updateMovie(id, movieDetails);
        } else {
        createMovie(movieDetails);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
        <div>
            <label>Title</label>
            <input
            type="text"
            name="title"
            value={movieDetails.title}
            onChange={handleChange}
            required
            />
        </div>

        <div>
            <label>Description</label>
            <textarea
            name="description"
            value={movieDetails.description}
            onChange={handleChange}
            />
        </div>

        <div>
            <label >Upload Video</label>
            <input
            type="file"
            name="video_file"
            accept="video/*"
            onChange={handleFileChange}
            />
            {videoPreview && (
            <video width="320" height="240" controls>
                <source src={videoPreview} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            )}
        </div>

        <button
            type="submit"
        >
            {id ? 'Update Movie' : 'Create Movie'}
        </button>
        </form>
    );
}
