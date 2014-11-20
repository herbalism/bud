(function (){
    function specs(spec, b, f, on, dom, consjs, consfn, when) {
        function yield(value) {
            return delay(1, value);
        };

        function withContext(callback) {
            return function() {
                return callback(dom);
            };
        }
        
        var assert = spec.assert;

        var scope = spec("scope", {
            "returned element gets displayed" : withContext(function(ctx){
                var result = f.div(b.scope(
                    function() {
                        var message = "hello " + "world";
                        return f.p("#somep", message);
                    }
                ))(ctx);
                
                assert.equals(ctx.text(ctx.find(result, "div #somep")).trim(), "hello world");
            })
        });

        var bind = spec("bind", {
            "no value no initial" : withContext(function(ctx){
                var stream = consfn.forArray([]);
                var result = f.div(b.bind(stream, f.p, "initial"))(ctx);
                assert.equals(ctx.text(ctx.find(result, "div p")).trim(), "initial");
            }),
            "creates element from pushed value" : withContext(function(ctx){
                var stream = phloem.stream();
                var next = stream.read.next();
                f.div(b.bind(next, f.p))(ctx);

                stream.push("pushed value");
                return when(next).then(function(value){
                    assert.equals($(ctx, "p").text().trim(), "pushed value");
                });
            }),
            "keeps only last pushed value" : withContext(function(ctx){
                var stream = phloem.stream();
                var next = stream.read.next();
                f.div(b.bind(next, f.p))(ctx);
                stream.push("first value");
                return when(next).then(function(value){
                    var paraText = $(ctx, "p").text().trim();
                    assert.equals(paraText, "first value");
                    stream.push("second value");
                    return delay(1, phloem.next(value));
                }).then(
                    function(value) {
                        var paraText = $(ctx, "p").text().trim();
                        assert.equals(paraText, "second value")
                    }
                );
            })
        });

        spec("bus", {
            "can expose value": withContext(function(ctx) {
                b.bus(function(bus) {
                    return f.all(
                        f.input("#source", {value: "from source"}, bus.expose),
                        f.input("#target", {value: "unchanged"}, bus.expose,
                                on.click(function() {
                                    bus.target(bus.source());
                                })));
                })(ctx);
                assert.equals($('#target', ctx).val().trim(), "unchanged");
                $("#target", ctx).click();
                assert.equals($('#target', ctx).val().trim(), "from source");
            }),
            "can set falsey value like empty string": withContext(function(ctx) {
                b.bus(function(bus) {
                    return f.all(
                        f.input("#target", {value: "unchanged"}, bus.expose,
                                on.click(function() {
                                    bus.target("");
                                })));
                })(ctx);
                assert.equals($('#target', ctx).val().trim(), "unchanged");
                $("#target", ctx).click();
                assert.equals($('#target', ctx).val().trim(), "");
            })
        });

        var iterateSetup = function() {
	    var queue = phloem.queue();
	    var component = b.iterate(queue.next()).onEach(
	        function(value) {
		    return f.p("value: ", value[0]);
	        }
	    );


	    var context = $('<div />');
	    component(context);
	    return {
	        context: context,
	        queue: queue
	    }
        }


        spec("iterate", {
	    "adds one element per iteration" : function() {
	        var setup = iterateSetup();

	        return when("a value").
		    then(setup.queue.push).
		    then(function() {
		        assert.equals(setup.context.children().text().trim(), "value: \na value");
		    });
	    }
        });

        function setUpAggregate() {
	    var eventStream = phloem.events(phloem.stream());
	    var component = b.aggregate(eventStream.read.next(),
	                                function(value) {
		                            return f.p(value + " value", {id: value})
	                                }
	                               );


	    var context = $('<div />');
	    var aggregate = component(context);
	    return {
	        context : context,
	        eventStream: eventStream,
	        aggregate: aggregate
	    };
        }

        spec("aggregate", {
	    "added element is displayed" : function() {
	        var setUp = setUpAggregate();
	        var promise =  when(setUp.eventStream.read.next()).
		    then(function(value) {
		        assert.equals($('#item1', setUp.context).text().trim(), "item1 value");
		    })
	        setUp.eventStream.push("item1");
	        return promise;
	    },
            "snapshot is displayed": function() {
	        var setUp = setUpAggregate();
	        var promise = when(setUp.eventStream.read.next()).
		    then(yield).
                    then(function(value) {
		        assert.equals($('#item1', setUp.context).text().trim(), "item1 value");
		        assert.equals($('#item2', setUp.context).text().trim(), "item2 value");
                    });

	        setUp.eventStream.snap(["item1", "item2"]);
	        return promise;            
            },
            "snapshot overrides previous state": function() {
	        var setUp = setUpAggregate();
	        var promise = when(setUp.eventStream.read.next()).
                    then(phloem.next).
                    then(yield).
		    then(function(value) {
                        refute.equals($('#item0', setUp.context).text().trim(), "item0 value");
		        assert.equals($('#item1', setUp.context).text().trim(), "item1 value");
		        assert.equals($('#item2', setUp.context).text().trim(), "item2 value");
		    })

                setUp.eventStream.push("item0");
	        setUp.eventStream.snap(["item1", "item2"]);
	        return promise;            
            },                
	    "two added elements in separate events are displayed" : function() {
	        var setUp = setUpAggregate();
	        var promise = when(setUp.eventStream.read.next()).
		    then(phloem.next).
                    then(yield).
		    then(function(value) {
		        assert.equals($('#item1', setUp.context).text().trim(), "item1 value");
		        assert.equals($('#item2', setUp.context).text().trim(), "item2 value");
		    })

	        setUp.eventStream.push("item1");
	        setUp.eventStream.push("item2");
	        return promise;

	    },
	    "added element can be undone" : function() {
	        var setUp = setUpAggregate();
	        var promise =  when(setUp.eventStream.read.next()).
                    then(function(value){
                        console.log("value0", 0);
                        return value;
                    }).
		    then(function(value) {
                        console.log("value1 ", value);
		        assert.equals($('#item1', setUp.context).text().trim(), "item1 value");
		        setUp.aggregate.undo();
                        return value;}).
                    then(yield).
                    then(function(value){
                        console.log("value2 ", value);
		        assert.equals($('#item1', setUp.context).text().trim(), "");
		    });
	        setUp.eventStream.push("item1");
	        return promise;
	    },
	    "two added elements and one removed displays one added" : function() {
	        var setUp = setUpAggregate();
	        var promise = when(setUp.eventStream.read.next()).
		    then(phloem.next).
		    then(phloem.next).
		    then(function(value) {
		        assert.equals($('#item1', setUp.context).text().trim(), "item1 value");
		        assert.equals($('#item2', setUp.context).text().trim(), "");
		    })

	        setUp.eventStream.push("item1");
	        setUp.eventStream.push("item2");
	        setUp.eventStream.drop("item2");
	        return promise;

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
                'q'], specs);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = specs(
            require('tattler/js/tattler-spec'), 
            require('../bud'),
            require('foliage/foliage'), 
            require('foliage/foliage-event'), 
            require('foliage/foliage-dom'), 
            require('consjs'),
            require('consjs/fn'),
            require('q'));
    }
})()
