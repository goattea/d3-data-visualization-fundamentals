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

function prepareLineChartData(data) {
    // group by year and extract measures
    const groupBy = d => d.release_year;
    const reduceRevenue = values => d3.sum(values, leaf => leaf.revenue);
    const revenueMap = d3.rollup(data, reduceRevenue, groupBy);
    const reduceBudget = values => d3.sum(values, leaf => leaf.budget);
    const budgetMap = d3.rollup(data, reduceBudget, groupBy);

    // convert to array
    const revenue = Array.from(revenueMap).sort((a, b) => a[0] - b[0]);
    const budget = Array.from(budgetMap).sort((a, b) => a[0] - b[0]);

    // parse years
    const parseYear = d3.timeParse('%Y');
    const dates = revenue.map(d => parseYear(d[0]));

    // maximum money 
    const yValues = [ 
        ...Array.from(revenueMap.values()),
        ...Array.from(budgetMap.values())
    ];
    const yMax = d3.max(yValues);

    // produce final data
    const lineData = {
        series: [
            {
                name: 'Revenue',
                color: 'dodgerblue',
                values: revenue.map(d => ({ date: parseYear(d[0]), value: d[1] }))
            },
            {
                name: 'Budget',
                color: 'darkorange',
                values: budget.map(d => ({ date: parseYear(d[0]), value: d[1] }))
            }
        ],
        dates: dates,
        yMax: yMax
    };

    return lineData;
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
    const lineChartData = prepareLineChartData(moviesClean);
        
    const margin = { top: 80, right: 80, bottom: 40, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

     // scales

    const xScale = d3
        .scaleTime()
        .domain(d3.extent(lineChartData.dates))
        .range([0, width]);

    const yScale = d3
        .scaleLinear()
        .domain([0, lineChartData.yMax])
        .range([height, 0]); // coordinate flip


    // line generator
    const lineGen = d3
        .line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value));


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
        .text('Budget and Revenue over time in $US');
    
    header
        .append('tspan')
        .text('Films with budget & revenue figures, 2000 - 2009')
        .attr('x', 0)
        .attr('dy', '1.5em')
        .attr('font-size', '0.8em')
        .attr('fill', '#555');

    // draw lines

    const chartGroup = svg.append('g').attr('class', 'line-chart');

    chartGroup
        .selectAll('.line-series')
        .data(lineChartData.series)
        .enter()
            .append('path')
            .attr('class', d => `line-series ${d.name.toLowerCase()}`)
            .attr('d', d => lineGen(d.values))
            .style('fill', 'none')
            .style('stroke', d => d.color);


    // add series labels
    chartGroup
        .append('g')
        .attr('class', 'series-labels')
        .selectAll('.series-label')
        .data(lineChartData.series)
        .enter()
            .append('text')
            .attr('x', d => xScale(d.values[d.values.length - 1].date) + 5)
            .attr('y', d => yScale(d.values[d.values.length - 1].value))
            .text(d => d.name)
            .style('dominant-baseline', 'central')
            .style('font-size', '0.7em')
            .style('font-weight', 'bold')
            .style('fill', d=> d.color);

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
            .tickSizeOuter(0); // hide the "outer" ticks
            
    const xAxisDraw = 
        svg
            .append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0, ${height})`)
            .call(xAxis);

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
                .call(yAxis);

}

d3.csv('data/movies.csv', typeConversion)
  .then(res => ready(res));