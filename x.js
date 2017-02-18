var _ = require("lodash");
var x = [12, 2, 3];

var y = _.find(x, o => {return o == 2});

console.log(y);
