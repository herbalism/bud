(function(){
    function bud(phloem, fn, f, when) {
        function doNext(iter, ui, parent, undo) {
	    return when(iter).then(function(model) {
	        var last = ui(phloem.value(model))(parent);
	        undo.undo = last.undo;
	        when(phloem.next(model)).then(last.undo);
	        return doNext(phloem.next(model), ui, parent, undo);
	    });
        }

        function bind (stream, elementFactory, initial) {
            return function(dom) {
                var update = dom.dynamic(elementFactory, initial);
                fn.each(stream,
                        function(value){
                            update.__next(value);
                        });
                return update;
            }
        }

        var res = {
            scope: function(s) {
                return s();
            },
            bind: bind
        }
        return res;
    }
    if (typeof define !== 'undefined') {
        define(['consjs', 
                'consjs/fn',
                'foliage',
                'q'], bud);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = bud(
            require('consjs'), 
            require('consjs/fn'),
            require('foliage/foliage'), 
            require('q'));
    }
})();
