// StarWarsFilms.tsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Box,
} from "@mui/material";

interface Film {
  title: string;
  episode_id: number;
  release_date: string;
  director: string;
  
}

interface Rating {
  Source: string;
  Value: string;
}

interface FilmWithRating extends Film {
  averageRating: number;
  omdbDetails?: OMDbFilmDetail;
}

interface OMDbFilmDetail {
  Poster: string;
  Ratings: Rating[];
  averageRating: number;
}


const API_KEY = "b9a5e69d";

const MovieList: React.FC = () => {
  const [films, setFilms] = useState<FilmWithRating[]>([]);
  const [selectedFilm, setSelectedFilm] = useState<FilmWithRating | null>(null);
  const [omdbDetails, setOmdbDetails] = useState<OMDbFilmDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    fetch("https://swapi.dev/api/films/?format=json")
      .then((response) => response.json())
      .then((data) => {

        const enhancedFilms: FilmWithRating[] = data.results.map(
          (film: Film) => ({
            ...film,
            averageRating: 0, 
          })
        );
        setLoading(false);
        setFilms(enhancedFilms);
      })
      .catch((error) => {
        console.error(error);
        setError("Failed to load films");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    
    if (selectedFilm && !selectedFilm.omdbDetails) {
      const fetchOMDbDetails = async () => {
        try {
          const response = await fetch(
            `https://www.omdbapi.com/?t=${encodeURIComponent(
              selectedFilm.title
            )}&apikey=${API_KEY}`
          );
          const data = await response.json();
          if (data.Response === "True") {
            const averageRating = calculateAverageRating(data.Ratings);
            const newOMDbDetails = {
              ...data,  
              averageRating: averageRating,
            };
            
            setOmdbDetails(newOMDbDetails);
            
            const updatedFilms = films.map((film) => {
              if (film.title === selectedFilm.title) {
                return { ...film, averageRating, omdbDetails: newOMDbDetails };
              }
              return film;
            });
            setFilms(updatedFilms);
            setSelectedFilm((prevSelectedFilm) =>
              prevSelectedFilm
                ? {
                    ...prevSelectedFilm,
                    averageRating,
                    omdbDetails: newOMDbDetails,
                  }
                : prevSelectedFilm
            );
          } else {
            
            setOmdbDetails(null);
          }
        } catch (error) {
          console.error("Fetching OMDb details failed:", error);
          setOmdbDetails(null);
        }
      };

      fetchOMDbDetails();
    } else if (selectedFilm && selectedFilm.omdbDetails) {
      
      setOmdbDetails(selectedFilm.omdbDetails);
    }
  }, [selectedFilm, films]);

  function calculateAverageRating(ratings: Rating[]): number {
    if (!ratings || ratings.length === 0) return 0;

    let validRatingsCount = 0;
    let totalRating = 0;

    ratings.forEach((rating) => {
      let value = 0;

      if (rating.Source === "Internet Movie Database") {
        
        value = parseFloat(rating.Value.split("/")[0]);
      } else if (rating.Source === "Rotten Tomatoes") {
        
        value = parseFloat(rating.Value) / 10;
      } else if (rating.Source === "Metacritic") {
        // Metacritic rating "82/100" -> 8.2
        value = parseFloat(rating.Value.split("/")[0]) / 10;
      }

      if (!isNaN(value)) {
        totalRating += value;
        validRatingsCount += 1;
      }
    });

    if (validRatingsCount === 0) return 0;

    const averageRating = totalRating / validRatingsCount;
    return parseFloat(averageRating.toFixed(1)); 
  }

  const selectFilm = (film: FilmWithRating) => {
    
    if (film.omdbDetails) {
      setOmdbDetails(film.omdbDetails);
    }
    setSelectedFilm(film);
  };

  
  const sortFilms = (key: "episode_id" | "release_date" | "averageRating") => {
    const sortedFilms = [...films].sort((a, b) => {
      if (key === "averageRating") {
       
        return b.averageRating - a.averageRating;
      }
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    });
    setFilms(sortedFilms);
  };

  if (loading && films.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        className="fadeIn"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <List component="nav" aria-label="movie list">
              {films.map((film, index) => (
                <ListItemButton
                  key={index}
                  onClick={() => selectFilm(film)}
                  selected={selectedFilm === film}
                >
                  <ListItemText
                    primary={film.title}
                    secondary={`Episode: ${film.episode_id}`}
                  />
                </ListItemButton>
              ))}
            </List>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              sx={{ marginTop: "20px" }}
            >
              <Button
                variant="contained"
                onClick={() => sortFilms("episode_id")}
              >
                Sort by Episode
              </Button>
              <Button
                variant="contained"
                onClick={() => sortFilms("release_date")}
              >
                Sort by Year
              </Button>
              <Button
                variant="contained"
                onClick={() => sortFilms("averageRating")}
              >
                Sort by Rating
              </Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            {selectedFilm ? (
              <>
                {loading ? (
                  <CircularProgress />
                ) : error ? (
                  <Alert severity="error">{error}</Alert>
                ) : (
                  <>
                    {omdbDetails && (
                      <img
                        src={omdbDetails.Poster}
                        alt={`${selectedFilm.title} poster`}
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    )}
                    <Typography variant="h4">{selectedFilm.title}</Typography>
                    <Typography variant="body1">
                      <strong>Release date:</strong> {selectedFilm.release_date}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Director:</strong> {selectedFilm.director}
                    </Typography>
                    {omdbDetails?.Ratings.map((rating, index) => (
                      <Typography key={index} variant="body2">
                        <strong>{rating.Source}:</strong> {rating.Value}
                      </Typography>
                    ))}
                    {omdbDetails && (
                      <Typography variant="body1">
                        <strong>Average Rating:</strong>{" "}
                        {omdbDetails.averageRating} / 10
                      </Typography>
                    )}
                  </>
                )}
              </>
            ) : (
              <Typography variant="subtitle1">
                Select a movie to see the details
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MovieList;
