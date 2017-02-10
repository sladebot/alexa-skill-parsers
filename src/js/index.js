var $ = jQuery = require('jquery');
var d3 = require("d3"),
    _ = require("lodash");

var margin = {top: 20, right: 20, bottom: 30, left: 20},
    chartContainerWidth = d3.select(".chart").style("width") | 1040,
    width =  parseInt(chartContainerWidth) - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom,
    barSpacing = 10;

const chartContainer = $('#chart-container');

const svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

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
  let newBins = fitDomains(data, _d => { return parseInt(_.get(_d, _attribute))}, _d => {return _d.length}, 10)
  
  d3.selectAll(".btn.btn-block")
    .classed("disabled", false);

  d3.select(`#${_attribute}`)
    .classed("disabled", true)

  let bars = svg.selectAll(".bar")
    .remove()
    .exit()
    .data(newBins)

  bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", _d => {
      return x(_d.x1) - 30;
    })
    .attr("y", _d => y(_d.length))
    .attr("rx", "2px")
    .attr("height", _d => {
      return height - y(_d.length);
    })
    .attr("width", function(d) {
      return x(d.x1) - x(d.x0) - barSpacing;
    })
    .attr("height", function(d) {
      return height - y(d.length);
    })
    .on('mouseover', _.throttle(handleHistogramMouseOver, 500))    
    .on("click", (_) => {
      // Rendering pie chart from existing bins !
      renderPie(d3.select(".chart"), chartContainer.data('bins'))
    })
    .on("mouseout", handleMouseRemove);

  svg.select(".axis--x")
    .attr("font-family", "Roboto")
    .attr("transform", `translate(0, ${height})`)
    .transition()
    .call(d3.axisBottom(x));
  
  svg.select(".axis--y")
    .attr("class", "axis axis--y")
    .attr("font-family", "Roboto")
    .transition()
    .call(d3.axisLeft(y));

}

/**
 * Renders a dropdown menu for selection of attributes which gets charted in the histogram
 * 
 */
function listAttributes(data, selectedItem) {
  let _items =  _.keys(data[0])
  let dropDown = d3.select("#attributes");
  let options = dropDown.selectAll("a")
    .data(_items)
    .enter()
    .append("a")
    .attr("class", "waves-effect waves-light btn btn-block")
    .attr("id", _attr => _attr)
    .attr("href", "#")
    .on('click', _attribute => toggle(_attribute, data))
    .text(_d => _.truncate(_d, {length: 10}));
  d3.select(`#${selectedItem}`)
    .classed("disabled", true)
}


function fitDomains(data, xDomainFn, yDomainFn, tickCount) {
  tickCount = tickCount | 20
  x.domain([0, d3.max(data, xDomainFn)])
    .range([0, width])
    .nice();
  let bins = d3.histogram()
    .value(xDomainFn)
    .domain(x.domain())
    .thresholds(x.ticks(tickCount))(data);
  
  y.domain([0, d3.max(bins, yDomainFn)])
    .range([height, 0])
    .nice();
  chartContainer.data('bins', bins);
  return bins;
}


/**
 * Renders a d3 pie chart.
 * 
 * container - Should be a d3 selected container
 * 
 */
function renderPie(container, data) {
  data = _.map(data, (_d => _d.length));
  data = _.without(data, 0)
  let radius = Math.min(width, height) / 2;
  let color = d3.scaleOrdinal()
    .range(["#d32f2f", "#c2185b", "#7b1fa2", 
            "#5e35b1", "#3949ab", "#1e88e5", 
            "#039be5", "#00acc1", "#00897b", 
            "#43a047", "#7cb342", "#c0ca33", 
            "#fdd835", "#ffb300", "#fb8c00", 
            "#f4511e", "#6d4c41"]);

  let arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);
  
  let labelArc = d3.arc()
    .outerRadius(radius - 40)
    .innerRadius(radius - 40);
  
  let pie = d3.pie()
    .sort(null)
    .value(_d => {
      return _d;
    }); // The data will be a histogram data i.e. an array of arrays.

  d3.select("svg").remove().exit();

  let g = d3.select(".chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width/2}, ${height/2})`)
    .selectAll(".arc")
    .data(pie(data))
    .enter().append("g")
    .attr("class", "arc");

  g.append("path")
    .attr("d", arc)
    .style("fill", (_d) => {
      return color(_d.data);
    });


  g.append("text")
    .attr("transform", _d => `translate(${labelArc.centroid(_d)})`)
    .attr("dy", ".35em")
    .text(_d => _d.data);     
}

/**
 * Renders a d3 histogram chart based on the data provided and a domain function for x axis.
 * 
 * data      - data for the histogram chart
 * xDomainFn - A domain function for plotting the x Axis, takes attributes which it needs to plot on this axis 
 *             in this case
 */
function renderHistogram(data, xDomainFn) {
  let bins = fitDomains(data, xDomainFn, (_d) => {return _d.length; });
  svg.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 1)
    .attr("transform", function(d) {
      return "translate(" + x(d.x0) + "," + y(d.length) + ")"
    })
    .attr("rx", "2px")
    .attr("width", function(d) {
      return x(d.x1) - x(d.x0) - barSpacing;
    })
    .attr("height", function(d) {
      return height - y(d.length);
    })
    .on('mouseover', _.throttle(handleHistogramMouseOver, 500))
    .on("click", (d) => {
      // Rendering pie chart from existing bins !
      renderPie(d3.select(".chart"), chartContainer.data('bins'))
    })
    .on("mouseout", handleMouseRemove);

  // Add X Axis
  svg.append("g")
    .attr("class", "axis axis--x")
    .attr("font-family", "Roboto")
    .attr("transform", "translate(0," + height + ")")
    .transition()
    .call(d3.axisBottom(x));
  
  svg.append("g")
    .attr("class", "axis axis--y")
    .attr("font-family", "Roboto")
    .transition()
    .call(d3.axisLeft(y));
}


/**
 * Event Handlers
 * 
 */

function handleHistogramMouseOver(d, i) {
  d3.select(this.parentNode)
    .append("text")
    .attr("class", `t${d.x0}_${d.x1}_${d.length}`)
    .attr("x", x(d.x1) - 30)
    .attr("y", y(d.length))
    .attr("font-size", "11px")
    .style("fill", "white")
    .transition()
    .delay(100)
    .text((_) => {
      return d.length;
    })
  
  d3.select(this)
    .transition()
    .attr("width", (_) => {
      return x(d.x1) - x(d.x0) - (0.25 * barSpacing);
    })
}

function handleMouseRemove(d, i) {
  d3.selectAll(`.t${d.x0}_${d.x1}_${d.length}`)
    .remove();
  d3.select(this)
    .transition()
    .attr("width", (_) => {
      return x(d.x1) - x(d.x0) - barSpacing;
    })
}


function pieChartHandler(__element) {
  __element.on("click", (e) => {
    renderPie(d3.select(".chart"), chartContainer.data('bins'));
  })
}

function __initHandlers() {
  let pieChartElem = $("#chart-type--pie");
  pieChartHandler(pieChartElem)  
}

d3.csv("data/baseball_data_1.csv", function(error, data) {
  if (error) throw error;
  // TODO: Automate this cleaning.
  data.forEach(_d => {
    _d.HR = +_d.HR;
    _d.weight = +_d.weight;
    _d.height = +_d.height;
  });
  let _items =  _.keys(data[0]);
  let _selectedAttribute = _items[Math.floor(Math.random()*_items.length)]
  listAttributes(data, _selectedAttribute);
  renderHistogram(data, (_d) => {return parseInt(_.get(_d, _selectedAttribute))});
  __initHandlers();
});