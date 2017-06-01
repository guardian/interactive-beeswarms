import mainTemplate from './src/templates/main.html!text'
import * as d3 from 'd3'
import D3Node from 'd3-node'
import * as d3bs from 'd3-beeswarm'
import fs from 'fs'
import sync from 'csv-parse/lib/sync'

const dummyData = sync(fs.readFileSync('src/with_deprivation.csv'), { columns : true })

const dict = {
	'Con' : 'con',
	'Lab' : 'lab',
	'Lab Co-op' : 'labco-op',
	'Speaker' : 'speaker',
	'Spk' : 'speaker',
	'PC' : 'pc',
	'UUP' : 'uup',
	'SDLP' : 'sdlp',
	'Ind' : 'ind',
	'LD' : 'libdem',
	'Lib Dem' : 'libdem',
	'UKIP' : 'ukip',
	'SNP' : 'snp',
	'Green' : 'green',
	'SF' : 'sf',
	'DUP' : 'dup',
	'Alliance' : 'alliance'
}

const drawBeeswarm = (data, x, {

	width = 305,
	height = 445,
	margin = 8,
	radius = 3.5

} = {}) => {

	const d3n = D3Node()

	const getX = typeof x === 'function' ? x : row => Number(row[x])

	const svg = d3n.createSVG(width, height)
		.attr('class', 'bs-svg')

	const [min, max] = d3.extent(data.map(getX))

	const nBuckets = Math.ceil((height-2*margin)/(2*radius))

	console.log(nBuckets)

	const buckets = Array(nBuckets).fill().map( (_, i) => i*radius*2)

	console.log(buckets)

	const xScaleRaw = d3.scaleLinear()
		.domain(d3.extent(data.map(getX)))
		.range([height - margin, margin])

	const xScale = x => {
		const exact = xScaleRaw(x)
		const bucket = buckets.find(b => b >= exact)
		return bucket || buckets[buckets.length-1]
	}

	const yStops = [0.3, 0.5, 0.7]

	let sorted = [];
        for (var i=0; i<(data.length-1)/2; i++) {
          sorted.push(data[i]);
          sorted.push(data[data.length-1-i]);
        }
        if (data.length%2 === 1) {
          sorted.push(data[(data.length-1)/2]);
    }

	const grid = svg
		.selectAll('.bs-stop')
		.data(yStops)
		.enter()
		.append('line')
		.attr('x1', margin)
		.attr('x2', width-margin)
		.attr('y1', d => xScale(d))
		.attr('y2', d => xScale(d))
		.attr('class', 'bs-stop')

	const bees = d3bs.beeswarm()
		.data(sorted.sort( (a, b) => a.ge15_winner < b.ge15_winner ? -1 : 1))//a.ge15_winner < b.ge15_winner ? 1 : -1))
		.distributeOn(bee => xScale(getX(bee)))
		.radius(radius)
		.orientation('vertical')
		.side('positive') // sigh
		.arrange()

	const circles = svg
		.selectAll('.bee')
		.data(bees.reverse())
		.enter()
		.append('circle')
		.attr('cx', bee => bee.x + 10)
		.attr('cy', bee => bee.y)
		.attr('r', radius)
		.attr('class', bee => {
			return 'bee bee--' + dict[bee.datum.ge15_winner]
		})
		.attr('id', bee => bee.datum.name)

	return d3n.svgString()

}

export async function render() {

	const filtered = dummyData.filter(row => row['Index of Multiple Deprivation'] !== '!')
	//console.log(JSON.stringify(filtered, null ,2))

    return mainTemplate + drawBeeswarm(dummyData, 'estimated_leave_vote', {});
}
