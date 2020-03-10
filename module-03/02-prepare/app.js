// data utilities
const parseNA = string => (string === 'NA' ? undefined : string);
const parseDate = string => d3.timeParse('%Y-%m-%d')(string);

// data prep
function filterData(data) {
    return data.filter(d => {
        return (
            d.release_year > 1999 &&
            d.release_year < 2010 &&
            d.revenue > 0 &&
            d.budget > 0 &&
            d.genre &&
            d.title
        );
    })
}

function prepareBarChartData(data) {
    const revenueByGenre = d3.rollup(
        data,
        v => d3.sum(v, leaf => leaf.revenue), //reducer
        d => d.genre   //group by key
    );

    const dataArray = Array.from(revenueByGenre, d => ({ genre: d[0], revenue: d[1] }));
    return dataArray.sort((a, b) => { return d3.descending(a.revenue - b.revenue); });
}

// type conversion
function type(d) {
    const releaseDate = parseDate(d.release_date);

    return {
        budget: +d.budget,
        genre: parseNA(d.genre),
        genres: JSON.parse(d.genres).map(d => d.name),
        homepage: d.homepage,
        id: +d.id,
        imdb_id: parseNA(d.imdb_id),
        original_language: parseNA(d.original_language),
        overview: parseNA(d.overview),
        popularity: +d.popularity,
        poster_path: parseNA(d.poster_path),
        production_countries: JSON.parse(d.production_countries),
        release_date: releaseDate,
        release_year: releaseDate.getFullYear(),
        revenue: +d.revenue,
        runtime: +d.runtime,
        status: d.status,
        tagline: parseNA(d.tagline),
        title: parseNA(d.title),
        video: d.video,
        vote_average: +d.vote_average,
        vote_count: +d.vote_count

    }
}

// main function
function ready(movies) {
    const moviesClean = filterData(movies);
    const barChartData = prepareBarChartData(moviesClean);
    console.log(barChartData);
}

d3.csv('data/movies.csv', type).then(res => ready(res));
