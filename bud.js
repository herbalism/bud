define(['phloem', 'foliage', 'jquery'], function(phloem, f, $) {
    return {
        scope: function(s) {
            return s();
        },
        bind: function(stream, element) {
            return function(parent) {
                var last = {undo: function(){}};
                phloem.each(stream, function(value) {
                    last.undo();
                    last = element(value)(parent);
                });
            }
        },
        bus: function(fn) {
            var bus = {};
            bus.expose = function(element) {
                var jqelem = $(element);
                bus[jqelem.attr('id')] = function(v){return  v ? jqelem.val(v) : jqelem.val()};
            };
            return f.all(fn(bus));
        }
    }
});
