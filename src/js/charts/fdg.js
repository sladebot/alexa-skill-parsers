var $ = jQuery = require('jquery');
var d3 = require("d3"),
    _ = require("lodash"),
    Promise = require("bluebird"),
    drag = require("d3-drag");


var margin = {top: 10, right: 20, bottom: 30, left: 40},
    chartContainerWidth = d3.select(".chart").style("width") || 1040,
    width =  parseInt(chartContainerWidth) - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    barSpacing = 10,
    startX = 0;

const x = d3.scaleLinear()

function generateBins(data, xScale, yScale, xDomainFn, yDomainFn, ticks, options) {
  let height = options.height,
    width = options.width;

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
  return _.meanBy(node, o => {
    return _.get(o, attribute);
  })
}

function findIndex(nodes, node) {
  let index = _.findIndex(nodes, (o) => {
    return o.id == node
  })

  if(index == -1) {
  }
  return index
}

function getData(source, bins, _attribute, nodes, edges, xScale, yScale, xScaleFn, yScaleFn, ticks, options) {
  nodes = nodes || []
  edges = edges || []
  counter = options.counter || 0;
  let selectedAttribute = options.selectedAttribute;
  console.log("Recursing............")

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

      if(counter < 500) {
        options.counter = counter + 1;
        let _gBin = generateBins(_bin, xScale, yScale, xScaleFn, yScaleFn, ticks, options);
        getData(_mean, _gBin, _attribute, nodes, edges, xScale, yScale, xScaleFn, yScaleFn, ticks, options); 
      }
      
    }
  });
  return {
    "nodes": nodes,
    "links": edges
  }

}

function generateData(data, xScale, yScale, xScaleFn, yScaleFn, ticks, options) {
  const nodes = []
  const edges = []
  let _attribute = options.selectedAttribute;
  let cacheContainer = options.cacheContainer;

  return new Promise(function(resolve, reject) {
    let cachedData = cacheContainer.data("fdg_data");
    try {
      let binData = generateBins(data, xScale, yScale, xScaleFn, yScaleFn, ticks, options)
      let sourceMean = getMean(data, _attribute)
      nodes.push({id: `${sourceMean}`})
      return resolve(getData(sourceMean, binData, _attribute, nodes, edges, xScale, yScale, xScaleFn, yScaleFn, ticks, options))
    } catch(e) {
      return reject(e);
    }
  })  
}


exports.draw = function(data, xScale, yScale, xScaleFn, yScaleFn, ticks, options) {
  d3.select("svg").remove().exit();
  let height = options.height;
  let width = options.width;
  let cacheContainer = options.cacheContainer;
  let _attribute = options.selectedAttribute;
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
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("gravity", d3.forceManyBody().strength(function(_d) {
      return 10;
    }))
    .force("charge", d3.forceManyBody().strength(function(_d) {
      return -_d.index - 5;
    }))
    .force("center", d3.forceCenter(width / 2, height / 2));


  generateData(data, xScale, yScale, xScaleFn, yScaleFn, ticks, options)
    .then(_data => {
      var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(_data.links)
        .enter().append("line")
        .attr("stroke-width", (_d) => {
          return _d.index;
        })
      
      var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(_data.nodes)
        .enter().append("circle")
        .attr("r", (_d) => {
          return _d.id / 20000;
        })
        .attr("fill", (_d) => {
          return color(_d.id);
        })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
      
      node.append("title")
        .text(_d => {
          return _d.id
        });
      
      
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
      console.log("Error happened in promise chain, ", _e)
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