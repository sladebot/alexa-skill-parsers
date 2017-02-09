var $ = jQuery = require('jquery');
var d3 = require("d3"),
    _ = require("lodash");


var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var tooltip = d3.select(".chart").append("div").attr("class", "tooltip");

var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear();
var y = d3.scaleLinear();


/**
 * Toggle
 * 
 * This is used to update attributes in a histogram with existing data
 * 
 * TODO: Make this independent so that it can take data.
 * 
 */
function toggle(_attribute, data) {
  var bins = fitDomains(data, _d => {return _.get(_d, _attribute)}, _d => {return _d.length}, 10)
  var rects = svg.selectAll("rect")
                .data(bins, (_b) => {
                  return _b.length;
                });

  rects.exit()
    .remove()
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 1)
    .attr("y", (_d, _i) => {      
      return y(_d.length);
    })
    .attr("height", (_d) => {
      return height - y(_d.length)
    })
    // .attr("y", 0)
    // .attr("height", function(d) {
    //   return height - y(d.length);
    // })
    // .attr("transform", function(d) {
    //   return "translate(" + x(d.x0) + "," + y(d.length) + ")"
    // })
    // .attr("width", (_) => {return x(d.x1);})
    // .merge(rects)
  
}

/**
 * Renders a dropdown menu for selection of attributes which gets charted in the histogram
 * 
 */
function renderDropDown(_items) {
  var dropDown = d3.select("#dropdown");
  var options = dropDown.selectAll("li")
                  .data(_items)
                  .enter()
                  .append("tr")
                  .append("a")
                  .attr('href', '#')
                  .on('click', (_attribute) => {
                    console.log("Toggled...")
                    toggle(_attribute, window.data)
                  })
                  .attr('class', 'white-text text-darken-2')
                  .text(_d => _d)
                  .attr('data-key', (_d) => _d);   
}

function fitDomains(data, xDomainFn, yDomainFn, tickCount) {
  tickCount = tickCount | 20
  x.domain([0, d3.max(data, xDomainFn)])
    .range([0, width]);
  let bins = d3.histogram()
              .value(xDomainFn)
              .domain(x.domain())
              .thresholds(x.ticks(tickCount))(data);

  y.domain([0, d3.max(bins, yDomainFn)])
    .range([height, 0]);
  return bins;
}


/**
 * Renders a d3 histogram chart based on the data provided and a domain function for x axis.
 * 
 * data      - data for the histogram chart
 * xDomainFn - A domain function for plotting the x Axis, takes attributes which it needs to plot on this axis 
 *             in this case
 */
function renderHistogram(data, xDomainFn) {
  let bins = fitDomains(data, xDomainFn, (_d) => {return _d.length; })
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
      debugger;
      return height - y(d.length);
    })
    .on('mousemove', (d) => {
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
    .attr("font-family", "Roboto")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
  
  svg.append("g")
    .attr("class", "axis axis--y")
    .attr("font-family", "Roboto")
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

  window.data = data;

  // Render Dropdown menu
  renderDropDown(_.keys(data[0]));

  // Render histogram
  renderHistogram(data, (_d) => {return _d.HR});
});