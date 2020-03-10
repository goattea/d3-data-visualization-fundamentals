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

function prepareScatterChartData(data) {
    return data
        .sort((a, b) => b.budget - a.budget) // sort descending by budget
        .filter((d, i) => i < 100); // get top 100 films
}

// drawing utilities
function formatTickLabel(d) {
    return d3.format('~s')(d)
        .replace('M', ' mil')
        .replace('G', ' bil')
        .replace('T', ' tril');
}

// main function
function ready(movies) {
    const moviesClean = filterData(movies);
    const scatterChartData = prepareScatterChartData(moviesClean);
        
    const margin = { top: 80, right: 40, bottom: 40, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

     // scales

    // increase the min and max values by 5% so they don't land on the axis
    const budgetExtent = d3
        .extent(scatterChartData, d => d.budget)
        .map((d, i) => i === 0 ? d * 0.95 : d * 1.05 );

    const xScale = d3
        .scaleLinear()
        .domain(budgetExtent)
        .range([0, width]);


    const revenueExtent = d3
        .extent(scatterChartData, d => d.revenue)
        .map((d, i) => i === 0 ? d * 0.1 : d * 1.1 );

    const yScale = d3
        .scaleLinear()
        .domain(revenueExtent)
        .range([height, 0]); // coordinate flip


    // draw base
    const svg = d3.select('.chart-container')
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
        .text('Budget vs. Revenue in $US');
    
    header
        .append('tspan')
        .text('Top 100 films by budget, 2000 - 2009')
        .attr('x', 0)
        .attr('dy', '1.5em')
        .attr('font-size', '0.8em')
        .attr('fill', '#555');

    // draw bars
    const scatter = 
        svg
            .append('g')
            .attr('class', 'scatter-points')
                .selectAll('.scatter')
                .data(scatterChartData)
                .enter()
                .append('circle')
                    .attr('class', 'scatter')
                    .attr('cx', d => xScale(d.budget))
                    .attr('cy', d => yScale(d.revenue))
                    .attr('r', 5) // could scale this radius by size for a bubble scatter
                    .style('fill', 'dodgerblue')
                    .style('fill-opacity', 0.7);

    //draw axis

    function labelAxis(axis, label, x) {
        axis
            .selectAll('.tick:last-of-type text') // get the last text element for the axis
            .clone() // clone it
            .text(label) // set its text to the label
            .attr('x', x) // use the offset x passed in
            .style('text-anchor', 'start')
            .style('font-weight', 'bold')
            .style('fill', '#555');
    }

    const xAxis = 
        d3
            .axisBottom(xScale)
            .ticks(5) // set "suggested" number of ticks
            .tickFormat(formatTickLabel)
            .tickSizeInner(-height) // have ticks scale down the height of the svg
            .tickSizeOuter(0); // hide the "outer" ticks
            
    const xAxisDraw = 
        svg
            .append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0, ${height})`)
            .call(xAxis)
            .call(labelAxis, 'Budget', 25);

    xAxisDraw.selectAll('text').attr('dy', '1em');

    const yAxis = 
            d3
                .axisLeft(yScale)
                .ticks(5) // set "suggested" number of ticks
                .tickFormat(formatTickLabel)
                .tickSizeInner(-width) // have ticks scale out the width of the svg
                .tickSizeOuter(0); // hide the "outer" ticks
                
    const yAxisDraw = 
            svg
                .append('g')
                .attr('class', 'y axis')
                .call(yAxis)
                .call(labelAxis, 'Revenue', 5);;

}

d3.csv('data/movies.csv', typeConversion)
  .then(res => ready(res));