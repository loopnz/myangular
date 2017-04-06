var filters = {};

function register(name, factory) {
    if (_.isObject(name)) {
        _.map(name, function(factory, name) {
            return register(name, factory);
        });
    } else {
        var filter = factory();
        filters[name] = filter;
        return filter;
    }
}

function filter(name) {
    return filters[name];
}


function $FilterProvider($provide) {

    var filters = {};

    this.register = function(name, factory) {
        if (_.isObject(name)) {
            _.map(name, function(factory, name) {
                return this.register(name, factory);
            },this);
        } else {
            return $provide.factory(name+'Filter',factory);
        }
    };

    this.$get = ['$injector',function($injector){
        return function (name){
            return $injector.get(name+'Filter');
        };
    }];

    this.register('filter',filterFilter);

}

$FilterProvider.$inject=['$provide'];
