function $ControllerProvider() {

    var controllers = {};
    var globals = false;
    this.allowGlobals = function() {
        globals = true;
    };
    this.register = function(name, controller) {
        if (_.isObject(name)) {
            _.extend(controllers, name);
        } else {
            controllers[name] = controller;
        }
    };


    this.$get = ['$injector', function($injector) {

        return function(ctrl, locals, later, identifier) {
            if (_.isString(ctrl)) {
                if (controllers.hasOwnProperty(ctrl)) {
                    ctrl = controllers[ctrl];
                } else if (globals) {
                    ctrl = window[ctrl];
                }

            }
            var instance;
            if (later) {
            	var ctrlConstructor = _.isArray(ctrl)?_.last(ctrl):ctrl;
                instance = Object.create(ctrlConstructor.prototype);
                if(identifier){
                	addToScope(locals,identifier,instance);
                }
                return _.extend(function() {
                    $injector.invoke(ctrl, instance, locals);
                    return instance;
                }, {
                    instance: instance
                });
            } else {
                instance = $injector.instantiate(ctrl, locals);
                if (identifier) {
                    addToScope(locals, identifier, instance);
                }
                return instance;
            }
        };
    }];

}


function addToScope(locals, identifier, instance) {
    if (locals && _.isObject(locals.$scope)) {
        locals.$scope[identifier] = instance;
    } else {
        throw '没有传$scope对象,控制器使用变量名实例化失败';
    }

}
