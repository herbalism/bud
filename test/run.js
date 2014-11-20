(function(){
    var basics = require('./bud-spec');
    function run(nodeRunner){
        nodeRunner.run(basics);
    }

    module.exports = run( require('tattler/js/node-runner'));
})();
