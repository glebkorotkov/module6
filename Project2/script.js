let canvas = document.getElementById('myCanvas');
let button = document.querySelector(".btn"); 
let ctx;
let height = 400;
let width = 400;
let input = document.querySelector("#clusterNum");
let data = [
	
];

let means = [];
let assignments = [];
let dataExtremes;
let dataRange;
let drawDelay = 2000;

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    data.push([x,y]);
    console.log(x, y);
}

canvas.addEventListener('mousedown', function(e) {
    getCursorPosition(canvas, e);
    drawCircles();
})

function getDataRanges(extremes) {
	var ranges = [];

	for (var dimension in extremes)
	{
		ranges[dimension] = extremes[dimension].max - extremes[dimension].min;
	}

	return ranges;

}

function getDataExtremes(points) {
	
	var extremes = [];

	for (var i in data)
	{
		var point = data[i];

		for (var dimension in point)
		{
			if ( ! extremes[dimension] )
			{
				extremes[dimension] = {min: 1000, max: 0};
			}

			if (point[dimension] < extremes[dimension].min)
			{
				extremes[dimension].min = point[dimension];
			}

			if (point[dimension] > extremes[dimension].max)
			{
				extremes[dimension].max = point[dimension];
			}
		}
	}

	return extremes;
}

function initMeans(k) {

	if ( ! k )
	{
		k = 3;
	}

	while (k--)
	{
		var mean = [];

		for (var dimension in dataExtremes)
		{
			mean[dimension] = dataExtremes[dimension].min + ( Math.random() * dataRange[dimension] );
		}

		means.push(mean);
	}

	return means;

};

function makeAssignments() {

	for (var i in data)
	{
		var point = data[i];
		var distances = [];

		for (var j in means)
		{
			var mean = means[j];
			var sum = 0;

			for (var dimension in point)
			{
				var difference = point[dimension] - mean[dimension];
				difference *= difference;
				sum += difference;
			}

			distances[j] = Math.sqrt(sum);
		}

		assignments[i] = distances.indexOf( Math.min.apply(null, distances) );
	}

}

function moveMeans() {

	makeAssignments();

	var sums = Array( means.length );
	var counts = Array( means.length );
	var moved = false;

	for (var j in means)
	{
		counts[j] = 0;
		sums[j] = Array( means[j].length );
		for (var dimension in means[j])
		{
			sums[j][dimension] = 0;
		}
	}

	for (var point_index in assignments)
	{
		var mean_index = assignments[point_index];
		var point = data[point_index];
		var mean = means[mean_index];

		counts[mean_index]++;

		for (var dimension in mean)
		{
			sums[mean_index][dimension] += point[dimension];
		}
	}

	for (var mean_index in sums)
	{
		console.log(counts[mean_index]);
		if ( 0 === counts[mean_index] ) 
		{
			sums[mean_index] = means[mean_index];
			console.log("Mean with no points");
			console.log(sums[mean_index]);

			for (var dimension in dataExtremes)
			{
				sums[mean_index][dimension] = dataExtremes[dimension].min + ( Math.random() * dataRange[dimension] );
			}
			continue;
		}

		for (var dimension in sums[mean_index])
		{
			sums[mean_index][dimension] /= counts[mean_index];
		}
	}

	if (means.toString() !== sums.toString())
	{
		moved = true;
	}

	means = sums;

	return moved;

}

function setup() {
	canvas = document.getElementById('myCanvas');
	ctx = canvas.getContext('2d');

	dataExtremes = getDataExtremes(data);
	dataRange = getDataRanges(dataExtremes);
	means = initMeans(input.value);

	makeAssignments();
	draw();

	setTimeout(run, drawDelay);
}

function run() {
	var moved = moveMeans();
	draw();

	if (moved)
	{
		setTimeout(run, drawDelay);
	}

}

function drawCircles() {
    ctx = canvas.getContext('2d');
    ctx.globalAlpha = 1;

    for (var i in data)
    {
        ctx.save();

        var point = data[i];

        var x =  point[0];
        var y = point[1];

        ctx.strokeStyle = '#333333';
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI*2, true);
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }
}

function draw() {

    ctx.clearRect(0,0,width, height);

    ctx.globalAlpha = 0.3;
    for (var point_index in assignments)
    {
        var mean_index = assignments[point_index];
        var point = data[point_index];
        var mean = means[mean_index];

        ctx.save();

        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(
            (point[0]),
            (point[1])
        );
        ctx.lineTo(
            (mean[0]),
            (mean[1])
        );
        ctx.stroke();
        ctx.closePath();
    
        ctx.restore();
    }
    ctx.globalAlpha = 1;

    for (var i in data)
    {
        ctx.save();

        var point = data[i];

        var x =  point[0];
        var y = point[1];

        ctx.strokeStyle = '#333333';
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI*2, true);
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }

    for (var i in means)
    {
        ctx.save();

        var point = means[i];

        var x = point[0];
        var y = point[1];

        ctx.fillStyle = 'green';
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI*2, true);
        ctx.fill();
        ctx.closePath();

        ctx.restore();

    }

}

button.addEventListener('click', setup);