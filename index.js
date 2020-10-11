
var margin = ({top: 20, right: 120, bottom: 30, left: 120})
var height = 500, width=700;
var font = 'Georgia'

var svg = d3.select('.chart')
	.append('svg')
		.attr('width', width)
		.attr('height', height)


var scaleArtistColor = 
	d3.scaleOrdinal(d3.quantize(d3.interpolateWarm, 26))


var raw = null;
function loadData(){
	d3.json("streaminghistory.json", function(d) {
		return d;
		//toReturn = {};
		//return toReturn;
	})
	.then(function(d) {
		raw = d;
		init();
		analyze(d);

	})
}

function clear() {
	svg.selectAll("g")
		.transition()
		.duration(1000)
		.style("opacity", 0)
		.remove();

}

function analyze(raw){

	var cume_artist_time = {};

	var temp_name, temp_time = null;
	for(var i=0; i < raw.length; i++){
		temp_name = raw[i]["artistName"];
		temp_time = parseInt(raw[i]["msPlayed"])/1000.0/60.0/60.0;
		if(temp_name in cume_artist_time){
			cume_artist_time[temp_name] = cume_artist_time[temp_name] + temp_time;
		}
		else { 
			cume_artist_time[temp_name] = temp_time;
		}
	}

	var cume_artist_time_arr = [];

	Object.keys(cume_artist_time).forEach((key) => cume_artist_time_arr.push(
		{
			artist: key,
			total_time: cume_artist_time[key]
		}));
	


	var data = cume_artist_time_arr;


	data.sort((a,b) => d3.descending(a.total_time, b.total_time));

	data = data.slice(0,25);
	


	//var g = svg.append("g");

	var scaleArtistY = d3.scaleBand()
		.domain(data.map((d)=>d.artist))
		.range([margin.top, height-margin.bottom])
		.padding(.1)

	var scaleAmountX = d3.scaleLinear()
		.domain([0, d3.max(data, (d,i) => d.total_time)])
		//.domain(d3.extent(data, (d,i) => d.total_time))
		.range([margin.left, width-margin.right])
		.nice();

	var scaleAmountColor = 
		//d3.scaleSequential(d3.nterpolateGreens)
		d3.scaleOrdinal(d3.quantize(d3.interpolateWarm, 26))
		//.domain([0, d3.max(data, (d,i) => d.total_time)])
		//.domain(d3.extent(data, (d,i) => d.total_time))
		

	
	var yAxis = d3.axisLeft(scaleArtistY)


	var xAxis = d3.axisBottom(scaleAmountX)
		.tickFormat(val => val + " hrs")
		.ticks(4);


	svg.append('g')
		.style("font-family", font)
		.style("font-size", "12px")
		.attr('class', 'y axis')
		.attr("transform", `translate(${margin.left},0)`)
		.call(yAxis);

	svg.append("g")
		.style("font-family", font)
		.style("font-size", "12px")
		.attr('class', 'x axis')
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.call(xAxis);


	var barg = svg.append("g")

	var rects = barg
		.selectAll("rect")
		.data(data);

	var newRects = rects.enter();

	var texts = barg
		.selectAll("text")
		.data(data)

	var newTexts = texts.enter();

	newRects
		.append("rect")
			.attr("class", "rect")
			.attr("id", (d,i) => i)
			.attr("x", margin.left + 2)
			.attr("y", (d,i) => scaleArtistY(d.artist))
			.attr("width", 0)
			.attr("height", (d,i) => scaleArtistY.bandwidth())
			.attr("fill", (d,i) => scaleAmountColor(d.total_time))
			.attr("opacity", 1)

	barg.selectAll("rect")
		.transition()
		.duration(1000)
		.attr("width", (d,i) => scaleAmountX(d.total_time) - margin.left)


	newTexts
		.append("text")
			.attr("text-anchor", "end")
			.attr("y", (d,i) => scaleArtistY(d.artist) + scaleArtistY.bandwidth()/2.0 +5)
			.attr("x", (d,i) => scaleAmountX(d.total_time))
			.text((d,i) => d3.format(".1f")(d.total_time))
			.attr("fill", "white")
			.style("font-family", font)

}


function highlightTier(arr){

	var rect = svg
		.selectAll("rect")
	
	if(rect.empty()){
		clear()
		analyze(raw)
	}

	rect
		.transition()
		.duration(200)
		.attr("opacity", (d,i) => arr.includes(i) ? 1 : 0.1)

}

function map2arr(data){
	return Array.from(data, ([key, value]) => ({key, value}))
}

function ms2hr(ms) {
	return ms / 1000.0 / 60.0 / 60.0;
}

function loadStep2(raw){

	//var artists = cume_time_artist_arr.map((d) => d.artist);

	var artistGroup = d3.group(raw, d => d.artistName);
	artistGroup = map2arr(artistGroup);
	

	var rollup = d3.rollup(raw, v => d3.sum(v, d => ms2hr(d.msPlayed)), d => d.artistName)
	rollup = map2arr(rollup);
	rollup.sort((a,b) => d3.descending(a.value, b.value));
	top25 = rollup.slice(0,25);



	var artist2dat = d3.rollup(raw, v => d3.cumsum(v.map(d => d.msPlayed)), d => d.artistName)
	//artist2dat = map2arr(artist2dat)



	var utcParse = d3.utcParse("%Y-%m-%d %H:%M")
	
	var scaleTimeX = d3.scaleTime()
		//.domain(d3.extent(artistGroup, (d) => d.value.map(j => utcParse(j.endTime))))
		.domain([d3.min(artistGroup, (d) => d3.min(d.value, (j) => utcParse(j.endTime))), d3.max(artistGroup, (d) => d3.max(d.value, (j) => utcParse(j.endTime)))])
		.range([margin.left, width-margin.right])
		.nice()


	var scaleTimePlayedY = d3.scaleLinear()
		.domain(d3.extent(rollup, (d) => d.value))
		.range([height-margin.bottom, margin.top])
		.nice()


	var yAxis = d3.axisLeft(scaleTimePlayedY)
		.tickFormat(val => val + " hrs")

	var xAxis = d3.axisBottom(scaleTimeX)
		.ticks(7)


	svg.append('g')
		.attr('class', 'y axis')
		.attr("transform", `translate(${margin.left},0)`)
		.style("font-family", font)
		.style("font-size", "12px")
		.call(yAxis);

	svg.append("g")
		.attr('class', 'x axis')
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.style("font-family", font)
		.style("font-size", "12px")
		.call(xAxis);

	var line = d3.line()
		//.x((d) => {d.map(j => utcParse(j.endDate))})
		//.y((d) => d.map(j => ms2hr(j.msPlayed)))
		.x((d) => {return scaleTimeX(utcParse(d.endTime))})
		.y((d,i) => {return scaleTimePlayedY(ms2hr(artist2dat.get(d.artistName)[i])); return scaleTimePlayedY(ms2hr(d.msPlayed))})

	var paths = svg.append("g")
		.attr("fill", "none")
		.attr("stroke-width", 4.5)
		.attr("stroke-linejoin", "mitre")
		.attr("stroke-miterlimit", 1)
		.attr("stroke-linecap", "round")
		.selectAll("path")
		.data(artistGroup)
		.join("path")
			.filter((d,i) => {
				return top25.map(d => d.key).includes(d.key);
				if(d.key in rollup.map(d=> d.key)){
					return true;
				}
				else{
					return false;
				}
				//return i < 250000
				})
			.attr("id", d => strip(d.key))
			.attr("class", "artist-line")
			.attr("d", d => {return line(d.value)})
			.attr("stroke", (d) => scaleArtistColor(d.key))
			.on("mouseover", (d) => over(d3.select("#" + strip(d.key))))
			.on("mouseout", out)


		var templabel = svg.select("text");

		function over(path) {
			//path.style("mix-blend-mode", null).attr("stroke", "#ddd");
			paths
				.attr("stroke", "grey")
				.attr("opacity", 0.1)

			templabel.remove();

			templabel = svg
				.append("text")
				.attr("x", width/4)
				.attr("y", height/4)
				.attr("font-size","34px")
				.style("font-family", font)
				.attr("class", "artist-label")

			path
				.attr("stroke", (d) => {
					templabel.text(d.key);
					return scaleArtistColor(d.key)
				})
				.attr("opacity", 1)
		}

		function out() {
			templabel.remove();
			paths
				.attr("stroke", (d) => scaleArtistColor(d.key))
				.attr("opacity", 1)
		}
	
	reveal = path => path.transition()
		.duration(3000)
			.attrTween("stroke-dasharray", () => {
				const length = 1000;
				return d3.interpolate(`0,${length}`, `${length},${length}`);
			})

	reveal(paths)

}

function highlightArtistLine(arr){
	console.log(arr)
	out();

	var path = svg
		.selectAll(".artist-line")
	
	if(path.empty()){
		clear()
		loadStep2()
	}

	path
		.filter((d,i)=>
			arr.includes(strip(d.key))
		)
		.call(over)

}

function over(path) {
	var paths = d3.selectAll(".artist-line")
	paths
		.attr("stroke", "grey")
		.attr("opacity", 0.1)

	d3.selectAll(".artist-label").remove()

	path
		.attr("stroke", (d) => {
			return scaleArtistColor(d.key)
		})
		.attr("opacity", 1)
}

function out() {
	var paths = d3.selectAll(".artist-line")
	d3.selectAll(".artist-label").remove()
	paths
		.attr("stroke", (d) => scaleArtistColor(d.key))
		.attr("opacity", 1)
}

function strip(orig){
	return orig.replace(/[\s\.]+/g, '');
}

function loadStep3(raw){
	
	const annotations = [
		{
			note: {
				label: "Juice WRLD passes away",
				//title: "Annotation title"
			},
			x: margin.left + width*2/9,
			y: margin.top + height*7/8,
			dy: -150,
			dx: -50
		},
		{
			note: {
				label: "Lockdown commences",
				//title: "Annotation title"
			},
			x: margin.left + width*2/5,
			y: margin.top + height*1/3,
			dy: -100,
			dx: -100
		}

	]

	const makeAnnotations = d3.annotation()
		.annotations(annotations)

	svg
		.append("g")
		.call(makeAnnotations)
}


loadData();






//scrollama stuff

//// using d3 for convenience, and storing a selected elements
var container = d3.select('#scroll');
var graphic = container.select('.scroll__graphic');
var chart = graphic.select('.chart');
var text = container.select('.scroll__text');
var step = text.selectAll('.step');

// initialize the scrollama
var scroller = scrollama();

// resize function to set dimensions on load and on page resize
function handleResize() { 
// 1. update height of step elements for breathing room between steps
	var stepHeight = Math.floor(window.innerHeight * 0.75);
	step.style('height', stepHeight + 'px');

	// 2. update height of graphic element
	var bodyWidth = d3.select('body').node().offsetWidth;

	graphic
		.style('height', window.innerHeight + 'px');

	// 3. update width of chart by subtracting from text width
	var chartMargin = 32;
	var textWidth = text.node().offsetWidth;
	var chartWidth = graphic.node().offsetWidth - textWidth - chartMargin;
	// make the height 1/2 of viewport
	var chartHeight = Math.floor(window.innerHeight / 2);

	chart
		.style('width', chartWidth + 'px')
		.style('height', chartHeight + 'px');

	// 4. tell scrollama to update new element dimensions
	scroller.resize();
}

// scrollama event handlers

function handleStepEnter(response) {
	// response = { element, direction, index }
	// fade in current step
	step.classed('is-active', function (d, i) {
		return i === response.index;
	})

	// update graphic based on step here
	var stepData = parseFloat(response.element.getAttribute('data-step'));
	console.log(stepData)

	step.classed("is-active", function(d, i) {
          return i === response.index;
    });

    // update graphic based on step
//    chart.select("p").text(response.index + 1);


	console.log(stepData === 2)
	if(stepData === 1 && response.direction == "up"){
		clear()
	}
	if(stepData === 2 && response.direction == "down"){
		clear()
	}

	if(stepData === 1 && response.direction == "up"){
		analyze(raw);
	}

	if(stepData === 2){
		loadStep2(raw);
	}

	if(stepData === 3){
		loadStep3(raw);
		out();
	}


	//substeps
	
	if(stepData === 1.4 && response.direction == "up"){
		clear()
		analyze(raw)
	}
	
	if(stepData === 1.1){
		highlightTier([0,1])
	}
	else if(stepData === 1.2){
		highlightTier([2,3,4])
	}
	else if(stepData === 1.3){
		highlightTier(Array(25).fill().map((x,i) => i+5))
	}

	if(stepData === 2.1){
		highlightArtistLine(["Drake", "J. Cole"].map((x) => strip(x)))
	}
	else if(stepData === 2.2){
		highlightArtistLine(["Post Malone"].map((x) => strip(x)))
	}
	else if(stepData === 2.3){
		highlightArtistLine(["Juice WRLD"].map((x) => strip(x)))
	}
	else if(stepData === 2.4){
		highlightArtistLine(["Maroon 5"].map((x) => strip(x)))
	}



}

//function handleContainerEnter(response) {
//	// response = { direction }
//
//	// sticky the graphic
//	graphic.classed('is-fixed', true);
//	graphic.classed('is-bottom', false);
//}

//function handleContainerExit(response) {
//	// response = { direction }
//
//	// un-sticky the graphic, and pin to top/bottom of container
//	graphic.classed('is-fixed', false);
//	graphic.classed('is-bottom', response.direction === 'down');
//}

// kick-off code to run once on load
function init() {
	// 1. call a resize on load to update width/height/position of elements
	handleResize();

	// 2. setup the scrollama instance
	// 3. bind scrollama event handlers (this can be chained like below)
	scroller
		.setup({
//			container: '#scroll', // our outermost scrollytelling element
//			graphic: '.scroll__graphic', // the graphic
//			text: '.scroll__text', // the step container
			step: '.scroll__text .step', // the step elements
			offset: 0.7, // set the trigger to be 1/2 way down screen
			debug: false, // display the trigger offset for testing
		})
		.onStepEnter(handleStepEnter)
		//.onContainerEnter(handleContainerEnter)
		//.onContainerExit(handleContainerExit);

	// setup resize event
	window.addEventListener('resize', handleResize);
}

