const express = require("express");
const crypto = require("node:crypto");
const movies = require("./movies.json");
const cors = require("cors");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");

const app = express();
app.use(express.json());
// app.use(cors()) // Esto pone res.header("Access-Control-Allow-Origin", "*")!! CUIDADO
// Aunque puede aceptar opciones
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        "http://localhost:8080",
        "http://localhost:1234",
        "http://www.movies.com",
        "http://website-vercel.app",
      ];

      if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.disable("x-powered-by");

const PORT = process.env.PORT ?? 1234;

// CORS
/*
  metodos normales: GET/HEAD/POST
  metodos complejos: PUT/PATCH/DELETE

  Para metodos complejos, necesitamos un pre-flight
  CORS PRE-FLIGHT <- como una peticion previa
  OPTIONS <- tiene que estar en la peticion
*/

// app.options("/movies/:id", (req, res) => { // HECHO EN MIDDLEWARE
//   const origin = req.header("origin");
//   if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
//     res.header("Access-Control-Allow-Origin", origin);
//     res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
//   }
//   res.send();
// });

app.get("/movies", (req, res) => {
  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(filteredMovies);
  }
  res.json(movies);
});

app.get("/movies/:id", (req, res) => {
  // path-to-regexp ":id" es variable
  // path-to-regexp
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === id);
  if (movie) return res.json(movie);
  res.status(404).json({ message: "Movie not found" });
});

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);
  //const { title, genre, year, director, duration, rate, poster } = req.body;
  // Ya no tenemos que preocuparnos si todos los datos estan en el body, por que
  // la funcion lo hace por nosotros

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }
  // Esto no seria REST, porque estamos guardando el estado de la aplicacion en memoria
  const newMovie = {
    id: crypto.randomUUID(), // uuid V4
    ...result.data, // podemos escribirlo asi, por que validamos antes los datos que nos mandan
  };
  movies.push(newMovie);

  res.status(201).json(newMovie);
});

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body);

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };

  movies[movieIndex] = updateMovie;

  return res.json(updateMovie);
});

app.delete("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  movies.splice(movieIndex, 1);
  return res.json({ message: "Movie deleted" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
