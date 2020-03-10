// data utilities
const parseNA = string => (string === 'NA' ? undefined : string);
const parseDate = string => d3.timeParse('%Y-%m-%d')(string);

// convert raw csv data to cleaned up object
function typeConversion(d) {
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

    const dataArray = 
        Array
            .from(revenueByGenre, d => ({ genre: d[0], revenue: d[1] }))
            .sort((a, b) => { return b.revenue - a.revenue; }); // descending

    return dataArray;
}

// drawing utilities
function formatRevenueTickLabel(d) {
    return d3.format('~s')(d)
        .replace('M', ' mil')
        .replace('G', ' bil')
        .replace('T', ' tril');
}

// main function
function ready(movies) {
    const moviesClean = filterData(movies);
    const barChartData = prepareBarChartData(moviesClean);
        
    const margin = { top: 80, right: 40, bottom: 40, left: 80 };
    const width = 400 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // calculate scales
    const maxRevenue = d3.max(barChartData, d => d.revenue);

    // use a linear scale in this case since our values are numeric
    const xScale = d3
        .scaleLinear()
        .domain([0, maxRevenue])
        .range([0, width]);

    // since we are mapping to genres on the y axis, use a band scale
    const yScale = d3
        .scaleBand()
        .domain(barChartData.map(d => d.genre))
        .rangeRound([0, height])
        .paddingInner(0.25);

    // draw base
    const svg = d3.select('.bar-chart-container')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g') // svg grouping element
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // draw header
    const header = 
        svg
            .append('g')
            .attr('class', 'bar-header')
            .attr('transform', `translate(0, ${-margin.top / 2})`)
            .append('text');

    header
        .append('tspan')
        .text('Total revenue by genre in $US');
    
    header
        .append('tspan')
        .text('Films w/ budget & revenue figures, 2000 - 2009')
        .attr('x', 0)
        .attr('dy', '1.5em')
        .attr('font-size', '0.8em')
        .attr('fill', '#555');

    // draw bars
    const bars = 
        svg
            .selectAll('.bar')
            .data(barChartData)
            .enter()
            .append('rect')
                .attr('class', 'bar')
                .attr('y', d => yScale(d.genre))
                .attr('width', d => xScale(d.revenue))
                .attr('height', yScale.bandwidth())
                .style('fill', 'dodgerblue');

    //draw axis
    const xAxis = 
        d3
            .axisTop(xScale)
            .tickFormat(formatRevenueTickLabel)
            .tickSizeInner(-height) // have ticks scale down the height of the svg
            .tickSizeOuter(0); // hide the "outer" ticks
            
    const xAxisDraw = 
        svg
            .append('g')
            .attr('class', 'x axis')
            .call(xAxis);

    const yAxis = d3.axisLeft(yScale).tickSize(0);

    const yAxisDraw = 
        svg
            .append('g')
            .attr('class', 'y axis')
            .call(yAxis);

    // after drawing y text labels, nudge them to the left to give some padding
    yAxisDraw.selectAll('text').attr('dx', '-0.6em');

}

d3.csv('data/movies.csv', typeConversion)
  .then(res => ready(res));