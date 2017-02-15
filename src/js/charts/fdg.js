var $ = jQuery = require('jquery');
var d3 = require("d3"),
    _ = require("lodash"),
    Promise = require("bluebird"),
    drag = require("d3-drag");
    
const materialColors = [
  "#d32f2f", "#c2185b", "#7b1fa2", 
  "#5e35b1", "#3949ab", "#1e88e5", 
  "#039be5", "#00acc1", "#00897b", 
  "#43a047", "#7cb342", "#c0ca33", 
  "#fdd835", "#ffb300", "#fb8c00", 
  "#f4511e", "#6d4c41"];

const binDepth = 500;

var margin = {top: 10, right: 20, bottom: 30, left: 40},
    chartContainerWidth = d3.select(".chart").style("width") || 1040,
    width =  parseInt(chartContainerWidth) - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    barSpacing = 10,
    startX = 0;

function generateBins(data, options) {
  let height = options.height,
    width = options.width,
    xScale = options.xScale,
    yScale = options.yScale,
    xDomainFn = options.xDomainFn,
    yDomainFn = options.yDomainFn,
    ticks = options.ticks;

  xScale.domain([0, d3.max(data, xDomainFn)])
    .range([0, width])
    .nice();
  
  let bins = d3.histogram()
    .value(xDomainFn)
    .domain(xScale.domain())
    .thresholds(xScale.ticks(ticks))(data);
  
  yScale.domain([0, d3.max[bins, yDomainFn]])
    .range([height, 0])
    .nice();
  
  return bins
}


function getMean(node, attribute) {
  return _.meanBy(node, o => _.get(o, attribute))
}

function findIndex(nodes, node) {
  return _.findIndex(nodes, o => o.id == node)
}

function getData(source, bins, _attribute, nodes, edges, options) {
  nodes = nodes || []
  edges = edges || []
  counter = options.counter || 0;
  let selectedAttribute = options.selectedAttribute;

  function addNode(value, counter) {
    nodes.push({
      id: `${value}`,
      value: `${value}`
    });
  }

  function addEdge(source, target) {
    edges.push({
      source: `${source}`,
      target: `${target}`
    })
  }

  _.each(bins, _bin => {
    if(_bin.length > 0) {
      let _mean = getMean(_bin, selectedAttribute)
      if(_.findIndex(nodes, (_n) => {return _n.id == _mean}) == -1) {
        addNode(_mean)
      }
      addEdge(source, _mean);
      _.each(_bin, _element => {
        if(_.findIndex(nodes, (_n) => {return _n.id == _.get(_element, selectedAttribute)}) == -1) {
          addNode(_.get(_element, selectedAttribute))
        }
        addEdge(_mean, _.get(_element, selectedAttribute))
      });

      let depth = options.depth || binDepth

      if(counter < depth) {
        options.counter = counter + 1;
        let _gBin = generateBins(_bin, options);
        getData(_mean, _gBin, _attribute, nodes, edges, options); 
      }
      
    }
  });
  return {
    "nodes": nodes,
    "links": edges
  }

}

function generateData(data, options) {
  const nodes = []
  const edges = []
  let _attribute = options.selectedAttribute;

  return new Promise(function(resolve, reject) {
    try {
      let binData = generateBins(data, options)
      let sourceMean = getMean(data, _attribute)
      nodes.push({id: `${sourceMean}`})
      return resolve(getData(sourceMean, binData, _attribute, nodes, edges, options))
    } catch(e) {
      return reject(e);
    }
  })  
}


exports.draw = function(data, options) {
  d3.select("svg").remove().exit();
  let height = options.height,
    width = options.width;

  let _attribute = options.selectedAttribute;
  var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  const color = d3.scaleOrdinal()
    .range(materialColors);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("gravity", d3.forceManyBody().strength(10))
    .force("charge", d3.forceManyBody().strength(function(_d) {
      return (options.gravity || -_d.index - 15);
    }))
    .force("center", d3.forceCenter(width / 2, height / 2));


  generateData(data, options)
    .then(_data => {
      var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(_data.links)
        .enter().append("line")
        .attr("stroke-width", _d => _d.index);
      
      var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(_data.nodes)
        .enter().append("circle")
        .attr("r", (_d) => {
          return (options.radius || _d.id / 19000);
        })
        .attr("fill", _d => color(_d.id))
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
    })
    .catch(_e => {
      throw _e;
    })
  

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


exports.generateData = generateData;