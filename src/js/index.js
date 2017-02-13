var $ = jQuery = require('jquery');
var d3 = require("d3"),
    _ = require("lodash"),
    drag = require("d3-drag");

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    chartContainerWidth = d3.select(".chart").style("width") | 1040,
    width =  parseInt(chartContainerWidth) - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom,
    barSpacing = 10;

const color = d3.scaleOrdinal()
    .range(["#d32f2f", "#c2185b", "#7b1fa2", 
            "#5e35b1", "#3949ab", "#1e88e5", 
            "#039be5", "#00acc1", "#00897b", 
            "#43a047", "#7cb342", "#c0ca33", 
            "#fdd835", "#ffb300", "#fb8c00", 
            "#f4511e", "#6d4c41"]);

const chartContainer = $('#chart-container');

var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

var x = d3.scaleLinear();
var y = d3.scaleLinear();

/**
 * Renders menus for attribute selection for data binning
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
    .on('click', _attribute => {
      handleAttributeClick(_attribute, data);
    })
    .text(_d => {
      return _.truncate(_d, {length: 10})
    });
  d3.select(`#${selectedItem}`)
    .classed("disabled", true)
}

function setAttributeSelectionState(_selection) {
  d3.selectAll(".btn.btn-block")
    .classed("disabled", false);

  d3.select(`#${_selection}`)
    .classed("disabled", true)
}

/**
 * Sets up xScale and yScale and returns binned data.
 */
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
function renderPie(binData) {
  let selectedAttribute = $("#attributes").find("a.disabled").text()
  /**
   * Filtering Data
   */
  // 1. Removing all 0 and -ve values
  _.remove(binData, (_bin) => {
    return _bin.length == 0 || _.get(_bin, selectedAttribute) <= 0
  });

  // 2. Formatting data for relevance
  let formattedPieData = _.map(binData, _bin => {
    let minData = _.minBy(_bin, selectedAttribute);
    let maxData = _.maxBy(_bin, selectedAttribute);
    let _dataMap =  {
      value: _bin.length,
      min: _.get(minData, selectedAttribute),
      max: _.get(maxData, selectedAttribute)
    }
    return _dataMap;
  });

  // 3. Taking first 10 elements
  formattedPieData = _.take(formattedPieData, 7);

  let radius = Math.min(width, height) / 2;
  
  // Removing existing SVG
  d3.select("svg").remove().exit();
  
  // Building Pie Chart
  let arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);
  
  let labelArc = d3.arc()
    .outerRadius(radius - 40)
    .innerRadius(radius - 40);
  
  let pie = d3.pie()
    .value(_d => _d.value);

  let g = d3.select(".chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width/2}, ${height/2})`)
    .selectAll(".arc")
    .data(pie(formattedPieData))
    .enter().append("g")
    .attr("class", "arc");

  g.append("path")
    .attr("d", arc)
    .on('click', (e) => {
      // TODO: Figure this out !!
      selectSelectors();
      updateHistogram(selectedAttribute, chartContainer.data("data"))
    })
    .style("fill", _d => color(_d.data.value));


  g.append("text")
    .attr("transform", _d => `translate(${labelArc.centroid(_d)})`)
    .attr("dy", ".35em")
    .style("fill", "white")
    .text(_d => {
      if(_d.data.value > 100) {
        return `${_d.data.min} - ${_d.data.max}`
      } else {
        return `< ${_d.data.max}`
      }
      
    });

}

function dragStart(_e) {
  console.log("Started with , ", _e)
}

function dragEnd (_e) {
  console.log("Ending drag")
}

function onDrag (_e){
  console.log("Dragging....")
}


var drag = d3.drag()
  .on('start', dragStart)
  .on('drag', onDrag)
  .on('end', dragEnd)

/**
 * Draw histogram in svg
 */

function drawHistogram(svgElem, binData) {
  d3.select("svg").call(drag);
  svgElem.selectAll("rect")
    .data(binData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 10)
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
    .on('mouseenter', _.throttle(handleHistogramMouseOver, 500))
    .on("click", (d) => {
      // Rendering pie chart from existing bins !
      renderPie(chartContainer.data('bins'));
      selectSelectors()
    })
    .on("mouseleave", handleMouseRemove);

    // Add X Axis
  svgElem.append("g")
    .attr("class", "axis axis--x")
    .attr("font-family", "Roboto")
    .attr("transform", "translate(10," + height + ")")
    .transition()
    .call(d3.axisBottom(x));
  
  svgElem.append("g")
    .attr("class", "axis axis--y")
    .attr("font-family", "Roboto")
    .transition()
    .call(d3.axisLeft(y));

  svgElem.append("text")
    .attr("transform", "translate(-30, " +  (height+margin.bottom)/2 + ") rotate(-90)")
    .text("Frequency")
    .style("fill", "white")

  let selectedAttribute = $("#attributes").find("a.disabled").text()

  svgElem
    .append("text")
    .attr("transform", "translate(" + (width/2) + "," + (height + margin.bottom - 2) + ")")
    .attr("class", "axis--x-label")
    .text(selectedAttribute)
    .style("fill", "white");
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
  chartContainer.data('chart-type', 'histogram')
  d3.select("svg").call(drag);
  drawHistogram(svg, bins);
  
}

/**
 * updateHistogram
 * 
 * This is used to update attributes in a histogram with existing data
 * 
 * TODO: Make this independent so that it can take data.
 * 
 */
function updateHistogram(_attribute, data) {
  let newBins = fitDomains(data, _d => { return parseInt(_.get(_d, _attribute))}, _d => {return _d.length}, 10)
  setAttributeSelectionState(_attribute);
  d3.selectAll("svg").remove();
  var svgNew = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  drawHistogram(svgNew, newBins)
}


/**
 * Event Handlers
 * 
 */

/**
 * Chart Type Selector event handlers -- START
 */

function handleAttributeClick(_attribute, _data) {
  let _chartType = chartContainer.data("chart-type")
  if(_chartType == "histogram") {
    updateHistogram(_attribute, _data)
  } else if (_chartType == "pie") {
    let binData = fitDomains(_data, _d => { return parseInt(_.get(_d, _attribute))}, _d => {return _d.length}, 10)
    renderPie(binData);
    setAttributeSelectionState(_attribute);
  } else {
    console.log("Unrecognized chart")
  }
}

/**
 * Chart Type Selector event handlers -- END
 */


/**
 * Histogram event handlers -- START
 */

function handleHistogramMouseOver(d, i) {
  d3.select(this.parentNode)
    .append("text")
    .attr("class", `t${d.x0}_${d.x1}_${d.length}`)
    .attr("x", x(d.x1) - 30)
    .attr("y", y(d.length) - 10)
    .attr("font-size", "11px")
    .style("fill", "white")
    .transition()
    .text((_) => {
      return d.length;
    });
    
  
  d3.select(this)
    .attr("height", (__) => {
      return height - y(d.length) + 10;
    })
    .attr("transform", __ => {
      return `translate(${x(d.x0)}, ${y(d.length) - 10})`
    })
    .attr("width", (__) => {
      return x(d.x1) - x(d.x0) - (0.25 * barSpacing);
    })
}

function handleMouseRemove(d, i) {
  d3.selectAll(`.t${d.x0}_${d.x1}_${d.length}`)
    .remove();
  d3.select(this)
    .attr("height", (_) => {
      return height - y(d.length);
    })
    .transition()
    .delay(20)
    
    .attr("transform", __ => {
      return `translate(${x(d.x0)}, ${y(d.length)})`
    })    
    .attr("width", (_) => {
      return x(d.x1) - x(d.x0) - barSpacing;
    })
}

function histogramHandler(__element) {
  __element.on("click", (e) => {
    // Set chartType as "histogram"
    selectSelectors();
    chartContainer.data('chart-type', 'histogram');
    let _selectedAttribute = $("#attributes").find("a.disabled").text();
    updateHistogram(_selectedAttribute, chartContainer.data("data"))
  })
}


/**
 * Histogram event handlers -- END
 */


/**
 * Pie Chart event handlers -- START
 */

function pieChartHandler(__element) {
  __element.on("click", (e) => {
    selectSelectors();
    chartContainer.data('chart-type', 'pie')
    renderPie(chartContainer.data('bins'));
  })
}

/**
 * Pie Chart event handlers -- END
 */

/**
 * Toggles enable/disable for chart type selectors
 */
function selectSelectors() {
  $(".chart-types").find(".chart-type--selectors").find("a").toggleClass("disabled");
}

/**
 * __init event handlers
 */

function __initHandlers() {
  let pieChartElem = $("#chart-type--pie");
  let histogramElem = $("#chart-type--histogram");
  pieChartHandler(pieChartElem);
  histogramHandler(histogramElem);
}

/**
 * Read data from remote for plotting charts
 */

d3.csv("data/data.csv", function(error, data) {
  if (error) throw error;
  // TODO: Automate this cleaning.
  data.forEach(_d => {
    _d.LIMIT_BAL = +_d.LIMIT_BAL;
    _d.BILL_AMT1 = +_d.BILL_AMT1;
    _d.BILL_AMT2 = +_d.BILL_AMT2;
    _d.BILL_AMT3 = +_d.BILL_AMT3;
    _d.PAY_AMT1 = +_d.PAY_AMT1;
    _d.PAY_AMT2 = +_d.PAY_AMT2;
    _d.PAY_AMT3 = +_d.PAY_AMT3;
  });
  chartContainer.data("data", data);
  let _items =  _.keys(data[0]);
  //TODO: Something is going wrong when default selection is height
  // let _selectedAttribute = _items[Math.floor(Math.random()*_items.length)] 
  let _selectedAttribute = "LIMIT_BAL";
  listAttributes(data, _selectedAttribute);
  renderHistogram(data, (_d) => {return parseInt(_.get(_d, _selectedAttribute))});
  __initHandlers();
});