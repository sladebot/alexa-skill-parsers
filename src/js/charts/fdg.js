var $ = jQuery = require('jquery');
var d3 = require("d3"),
    _ = require("lodash"),
    drag = require("d3-drag");


var margin = {top: 20, right: 20, bottom: 30, left: 40},
    chartContainerWidth = d3.select(".chart").style("width") || 1040,
    width =  parseInt(chartContainerWidth) - margin.left - margin.right,
    height = 650 - margin.top - margin.bottom,
    barSpacing = 10,
    startX = 0;

exports.draw = function() {
  d3.select("svg").remove().exit();
  // d3.select(".chart").selectAll("svg").remove();
  var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  const color = d3.scaleOrdinal()
    .range(["#d32f2f", "#c2185b", "#7b1fa2", 
            "#5e35b1", "#3949ab", "#1e88e5", 
            "#039be5", "#00acc1", "#00897b", 
            "#43a047", "#7cb342", "#c0ca33", 
            "#fdd835", "#ffb300", "#fb8c00", 
            "#f4511e", "#6d4c41"]);

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(_d => {
      return _d.id;
    }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));
  
  d3.json("data/fdg.json", (_err, _data) => {
    if (_err) throw _err;

    var link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(_data.links)
      .enter().append("line")
      .attr("stroke-width", (_d) => {
        return Math.sqrt(_d.value);
      })
    
    var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(_data.nodes)
      .enter().append("circle")
      .attr("r", 5)
      .attr("fill", (_d) => {
        return color(_d.group);
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    node.append("title")
      .text(_d => _d.id);
    
    simulation
      .nodes(_data.nodes)
      .on("tick", ticked)
    
    simulation
      .force("link")
      .links(_data.links);

    function ticked() {
      link
        .attr("x1", _d => _d.source.x)
        .attr("y1", _d => _d.source.y)
        .attr("x2", _d => _d.target.x)
        .attr("y2", _d => _d.target.y)
      
      node
        .attr("cx", _d => _d.x)
        .attr("cy", _d => _d.y)
    }
  });

  function dragstarted(d) {
    if(!d3.event.active) {
      simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) {
      simulation.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
  }
  
}