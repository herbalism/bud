curl({
    paths: {
	jquery: 'ext/jquery-1.8.2',
	'curl/plugin': 'modules/curl/src/curl/plugin'
    },
    packages : {
        q: {
            path: 'modules/when',
            main: 'when'
        },
        cons: {
            path: 'node_modules/consjs',
            main: 'cons'
        },
	when: {
	    path: 'modules/when',
	    main: 'when'
	},
	lodash: {
	    path: 'modules/lodash',
	    main: 'lodash'
	},
	foliage: {
	    path: 'modules/foliage',
	    main: 'foliage'
	},
	phloem: {
	    path: 'modules/phloem',
	    main: 'phloem'
	}
    }
});

window.require = curl;
