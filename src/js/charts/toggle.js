/**
 * Toggle
 * 
 * This is used to update attributes in a histogram with existing data
 * 
 * TODO: Make this independent so that it can take data.
 * 
 */
exports.toggle = function (_attribute, data) {
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