define(['phloem'], function(phloem) {
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
        }
    }
});
