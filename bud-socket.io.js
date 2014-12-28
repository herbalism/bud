define(
    ['consjs',
     'socket.io'],
    function(consjs, io){
        return {
            open: function open() {
                var socket = io();
                return {
                    channel: function channel(channel) {
                        return {
                            emit: function emit(data){
                                return socket.emit(channel, data);
                            },
                            read: function read(){
                                var stream = consjs.stream();
                                socket.on(channel, function(data){
                                    stream.push(data);
                                });
                                return stream.read;
                            }
                        }
                    }
                }
            }
        }
    });
