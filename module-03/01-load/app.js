d3.csv('data/harry_potter.csv')
    .then(res => { console.log('local csv', res); })

d3.json('data/harry_potter.json')
    .then(res => { console.log('local json', res)});

d3.json(
    'http://www.mocky.io/v2/5e67d308310000da95230d39'
).then( res => {
    console.log('API json', res)
});

const potter = d3.csv('data/harry_potter.csv');
const lotr = d3.csv('data/lord_of_the_rings.csv');

Promise.all([potter, lotr])
    .then(res => {
        console.log('Multiple requests:', res);
        console.log('Multiple requests concat', [...res[0], ...res[1]] );
    });