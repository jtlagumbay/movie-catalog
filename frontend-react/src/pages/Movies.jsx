import { useState, useEffect } from 'react'
import { getMovies } from '../utils/api'

export default function Movies() {
    const [movies, setMovies] = useState([
        {
            id: 1,
            title: "3 Idiots",
            description: "Movie about three idiots",
            date_added: "date today",
            video_file: "/movie.mp4"
        },
        {
            id: 2,
            title: "3 Idiots",
            description: "Movie about three idiots",
            date_added: "date today",
            video_file: "/movie.mp4"
        }
    ])

    useEffect(() => {
        getMovies().then(res => setMovies(res.data));
        }, []);

    return (
        <div>
            <h1>
                Movies Catalog
            </h1>
            { movies.map((data, index)=>{
                return <div key={index}>
                    <h2>{ data.title }</h2>
                    <p>{ data.date_added }</p>
                    <p>{ data.description }</p>
                    <video width="640" height="360" controls autoPlay muted loop poster="thumbnail.jpg">
                        <source src={data.video_file} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>

                </div>
            })
            }
        </div>

    )
}


