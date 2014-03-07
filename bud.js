define(['phloem', 'foliage', 'jquery', 'when'], function(phloem, f, $, when) {
    function doNext(iter, ui, parent, undo) {
	return when(iter).then(function(model) {
	    var last = ui(phloem.value(model))(parent);
	    undo.undo = last.undo;
	    when(phloem.next(model)).then(last.undo);
	    return doNext(phloem.next(model), ui, parent, undo);
	});
    }

    var iterate = function(iterator) {
	return {
	    onEach:function(ui) {
		return function(parent) {
		    var undo = {undo: function(){}};
		    var current = doNext(iterator, ui, parent, undo);
		    return undo;
		}
	    }
	}
    }

    var aggregate = function(events, ui) {
	var identity = function(val) {return val};
	return function(parent) {
	    var added = {};
            var addToUI = function(valueToAdd) {
                added[identity(valueToAdd)] = ui(valueToAdd)(parent);
            };

	    phloem.each(events, function(value) {
		if(value) {
		    if(value.snap) {
                        _(added).values().invoke('undo');
                        added = {};
                        _.each(value.snap, addToUI);
                    }
                    _.each(value.added, addToUI);
		    _.each(value.dropped, function(droppedValue) {
			var dropped = added[identity(droppedValue)];
			if(dropped)  {
			    added[identity(droppedValue)] = undefined;
			    dropped.undo();
			}
		    })
		        }
	    })
	        return {undo: function() {
		    _.each(added, function(leaf){leaf.undo()});
	        }}
	}
    }

    var NOOP = function(data){
	return function(parent){
	    return {
		undo: function(){}
	    }
	}
    };

    function bind (stream, elementFactory) {
        return function(parent) {
            var last = {undo: function(){}};
            phloem.each(stream, function(value) {
                last.undo();
                last = elementFactory(value)(parent);
            });
            return {
                undo: function() {
                    return last.undo();
                }
            };
        }
    }

    var res = {
	create: function(item) {
	    var itemToShow = f.create(item);
	    return function(data) {
		return itemToShow;
	    }
	},
	display: function(item) {
	    var item = item;
	    return function(data) {
		return item;
	    }
	},
	whenever: function(either) {
	    var leftElement, rightElement;
	    var parentElement;
	    leftElement = rightElement = NOOP;
	    var elementToPresent = function(parent){return parent};
	    var done = [];
	    var undo = function() {
		var i;
		for(i in done) {
		    done[i].undo && done[i].undo();
		}
	    }
	    var attach = function(current, currentElement, next, nextElement) {
		when(current()).then(
		    function(model) {
			undo();
			done = [];
			attach(next, nextElement, current, currentElement);
			elementToPresent = currentElement(model);
			done.push(elementToPresent(parentElement))
		    }
		)
	    }

	    return {
		then: function(primary) {
		    leftElement = primary;
		    var result = function(parent) {
			parentElement = parent;
			elementToPresent(parent);
			attach(either.left, leftElement, either.right, rightElement);
			return {undo: undo}
		    }
		    
		    result.otherwise = function(alternative) {
			rightElement = alternative;
			attach(either.right, rightElement, either.left, leftElement);
			return result;
		    }
		    return result;
		}
	    }
	},
	iterate: iterate,
	aggregate: aggregate,
        scope: function(s) {
            return s();
        },
        bind: bind,
        bus: function(fn) {
            var bus = {};
            bus.expose = function(element) {
                var jqelem = $(element);
                var id = jqelem.attr('id');
                bus [id] = function(v) {
		    return (typeof v === "undefined") ? jqelem.val() : jqelem.val(v);
		};
                bus [id].element = jqelem;
            };
            return f.all(fn(bus));
        },
        match: function (stream) {
            var cases = Array.prototype.slice.call (arguments, 1);
            return bind (stream, function (value) {
                var c;
                for (c in cases) {
                    var result = cases [c] (value);
                    if (result) {
                        return result;
                    }
                }
                return f.span ();
            })
        },
        when: function (matcher) {
            return {
                then: function (outcome) {
                    return function (value) {
                        var matched = matcher (value);
                        if (matched) {
                        }
                    }
                }
            }
        }
    }
    return res;
});
