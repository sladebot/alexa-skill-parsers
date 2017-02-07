var $ = jQuery = require('jquery');
var d3 = require("d3"),
    _ = require("lodash");

var Util = require("./util");

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var tooltip = d3.select("body").append("div").attr("class", "tooltip");

// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

function renderChart(data) {
  // set the ranges
  var x = d3.scaleLinear()
            .range([0, width])
            .domain([0, d3.max(data, (_d) => {return _d.avg})]);


  var bins = d3.histogram()
              .value(_d => {
                return _d.avg;
              })
              .domain(x.domain())
              .thresholds(x.ticks(20))(data)

  var y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(bins, (_d) => {return _d.length;})]);



  
  svg.selectAll("rect")
    .data(bins)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", 1)
    .attr("transform", function(d) {
      return "translate(" + x(d.x0) + "," + y(d.length) + ")"
    })
    .attr("width", function(d) {
      return x(d.x1) - x(d.x0) - 1;
    })
    .attr("height", function(d) {
      return height - y(d.length);
    })
    .on('mousemove', (d) => {
      debugger;
      tooltip
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 70 + "px")
        .style("display", "inline-block")
        .html((d.length) + "<br>");
    })
    .on("mouseout", function(d){ tooltip.style("display", "none");});


  // Add X Axis
  svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
  
  svg.append("g")
    .call(d3.axisLeft(y));
}

// get the data
d3.csv("data/baseball_data.csv", function(error, data) {
  if (error) throw error;
  data.forEach(_d => {
    _d.HR = +_d.HR;
    _d.weight = +_d.weight;
    _d.avg = +_d.avg;
  });
  renderChart(data);
});