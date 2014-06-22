define(['buster', 
        'bud', 
        'foliage',
        'foliage/foliage-event',
        'phloem',
        'jquery',
        'when',
        'when/delay'], 
       function(buster, b, f, on, phloem, $, when, delay) {
           function yield(value) {
               return delay(1, value);
           };

           function withContext(callback) {
               return function() {
                   return callback($('<div />'));
               };
           }
           
           var assert = buster.assert;
           var refute = buster.refute;

           buster.testCase("scope", {
               "returned element gets displayed" : withContext(function(ctx){
                   f.div(b.scope(
                       function() {
                           var message = "hello " + "world";
                           return f.p("#somep", message);
                       }
                   ))(ctx);
                   
                   assert.equals($(ctx, "#somep").text().trim(), "hello world");
               }),
               "returned element can be undone" : withContext(function(ctx){
                   var elem = f.div(b.scope(
                       function() {
                           var message = "now you see it";
                           return f.p("#somep", message);
                       }
                   ))(ctx);
                   assert.equals($(ctx, "#somep").text().trim(), "now you see it");
                   elem.undo();
                   assert.equals($(ctx, "#somep").text().trim(), "");
                   
               })

           });

           buster.testCase("bind", {
               "no value no element" : withContext(function(ctx){
                   var stream = phloem.stream();
                   var next = stream.read.next();
                   f.div(b.bind(next, f.p))(ctx);
                   assert.equals($(ctx, "p").text().trim(), "");
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

           buster.testCase("bus", {
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

           var wheneverBaseSetup = function(left, right) {
	       var optional = phloem.optional();
	       var component = b.whenever(optional.read);
	       if(left) {
		   component = component.then(left);
	       }
	       if(right) {
		   component = component.otherwise(right);
	       }
	       var context = $('<div />');
	       component(context);
	       return {
	           context: context,
	           optional: optional
	       }
           }
           var wheneverSetup = function() {
	       return wheneverBaseSetup(function(value){return f.p("present: ", value)},
				        function(value){return f.p("absent: ", value)})
           }

           buster.testCase('whenever', {
	       'renders nothing until either present or absent (Schrodingers cat :))' : function() {
		   var setup = wheneverSetup();
		   assert.equals(setup.context.children().length, 0);
	       },
	       'renders present when present' : function() {
		   var setup = wheneverSetup();
		   setup.optional.set("the value");
		   assert.equals( setup.context.children().text().trim(), "present: \nthe value")
	       },
	       'renders absent when absent' : function() {
		   var setup = wheneverSetup();
		   setup.optional.clear("some info");
		   assert.equals(setup.context.children().text().trim(), "absent: \nsome info")
	       },
	       'switches rendered when present becomes absent' : function() {
		   var setup = wheneverSetup();
		   return when("it's present").
		       then(setup.optional.set).
		       then(function(){return "now it's absent"}).
		       then(setup.optional.clear).
		       then(function() {
			   assert.equals(setup.context.children().text().trim(), "absent: \nnow it's absent")
		       })
	       },
	       'switches rendered when absent becomes present' : function() {
		   var setup = wheneverSetup();
		   return when("it's absent").
		       then(setup.optional.clear).
		       then(function(){return "now it's present"}).
		       then(setup.optional.set).
		       then(function() {
			   assert.equals(setup.context.children().text().trim(), "present: \nnow it's present")
		       })
	       },
	       'resolved absent adds UI to parent even if parent is added after resolve' : function() {
		   var optional = phloem.optional();
		   optional.clear("an absent value");
		   var component = b.whenever(optional.read).
		       then(function(model){return f.p("present: ", model)}).
		       otherwise(function(model){return f.p("absent: ", model)})

		   var context = $('<div />');
		   component(context);
		   assert.equals(context.children().text().trim(), "absent: \nan absent value")

	       },
	       'can resolve back and forth when only present is handled' : function() {
		   var setup = wheneverBaseSetup(function(value){return f.p("present: ", value)})

		   return when("it's present").
		       then(setup.optional.set).
		       then(function(val) {
			   assert.equals(setup.context.children().text().trim(), "present: \nit's present")
		       }).
		       then(function(){return "it's now absent"}).
		       then(setup.optional.clear).
		       then(function(val) {
			   assert.equals(setup.context.children().text().trim(), "")
		       }).
		       then(function(){return "it's now present again"}).
		       then(setup.optional.set).
		       then(function(val) {
			   assert.equals(setup.context.children().text().trim(), "present: \nit's now present again")
		       })
	       }
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


           buster.testCase("iterate", {
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

           buster.testCase("aggregate", {
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
           })

       });
