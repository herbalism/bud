(function (){
    function specs(spec, b, f, on, dom, consjs, consfn, when, _) {
        function yield(value) {
            return delay(1, value);
        };

        function withContext(callback) {
            return function() {
                return callback(dom);
            };
        }
        
        var assert = spec.assert;

        var scope = spec("scope",
                         {
                             "returned element gets displayed" : withContext(function(ctx){
                                 var result = f.div(b.scope(
                                     function() {
                                         var message = "hello " + "world";
                                         return f.p("#somep", message);
                                     }
                                 ))(ctx);
                                 return assert.equals(ctx.text(ctx.find(result, "div #somep")).trim(), "hello world");
                             })
                         });

        var bind = spec("bind").
            preconditions(
                function getDom(){return dom;}
            )(
                {
                    "no value no initial" : function(ctx){
                        var stream = consfn.forArray([]);
                        var result = f.div(b.bind(stream, f.p, "initial"))(ctx);
                        return assert.equals(ctx.text(ctx.find(result, "div p")).trim(), "initial");
                    },
                    "creates element from pushed value" : function(ctx){
                        var stream = consfn.forArray(['first value']);
                        var result = f.div(b.bind(stream, f.p, "initial"))(ctx);

                        return when(stream.next()).then(function(value){
                            return assert.equals(
                                ctx.text(ctx.find(result, "div p")).trim(),
                                consjs.value(value));
                        });
                    },
                    "keeps only last pushed value" : function(ctx){
                        var stream = consjs.stream();
                        var result = f.div(b.bind(stream.read, f.p))(ctx);
                        var next = stream.read.next();
                        stream.push('first');
                        return when(next).then(function(value){
                            var paraText = ctx.text(ctx.find(result, "div p")).trim();
                            return assert.equals(paraText, consjs.value(value)).
                                then(function(){ stream.push("second");}).
                                then(function(){return consjs.next(value)});
                        }).then(
                            function(value) {
                                var paraText = ctx.text(ctx.find(result, "div p")).trim();
                                return assert.equals(paraText, consjs.value(value))
                            }
                        );
                    }
                });
        return [scope, bind];
    }
    if (typeof define !== 'undefined') {
        define(['tattler/spec', 
                'bud', 
                'foliage',
                'foliage/foliage-event',
                'foliage/foliage-dom',
                'consjs',
                'consjs/fn',
                'q',
                'lodash'], specs);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = specs(
            require('tattler/js/tattler-spec'), 
            require('../bud'),
            require('foliage/foliage'), 
            require('foliage/foliage-event'), 
            require('foliage/foliage-dom'), 
            require('consjs'),
            require('consjs/fn'),
            require('q'),
            require('lodash'));
    }
})()
