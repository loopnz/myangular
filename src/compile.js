function $CompileProvider($provide) {

    var hasDirectives = {};
    var PREFIX_REGEXP=/(x[\:\-_]|data[\:\-_])/i;
    this.directive = function(name, factory) {
        if (_.isString(name)) {
            if (!hasDirectives.hasOwnProperty(name)) {
                hasDirectives[name] = [];
                $provide.factory(name + 'Directive', ['$injector', function($injector) {
                    var factories = hasDirectives[name];
                    return _.map(factories, $injector.invoke);
                }]);
            }
            hasDirectives[name].push(factory);
        } else {
            _.forEach(name, function(factory, name) {
                this.directive(name, factory);
            }, this);
        }
    };

    this.$get = ['$injector',function($injector) {

        function compile($compileNodes) {
            return compileNodes($compileNodes);
        }

        function compileNodes($compileNodes) {
            _.forEach($compileNodes, function(node) {
                var directives = collectDirectives(node);
                applyDirectivesToNode(directives,node);
           		if(node.childNodes&&node.childNodes.length){
           			compileNodes(node.childNodes);
           		}
            });
        }

        function applyDirectivesToNode(directives,node){
        	var $compileNode=$(node);
        	_.forEach(directives,function(directive){
        		if(directive.compile){
        			directive.compile($compileNode);
        		}
        	});

        }

        function collectDirectives(node) {
            var directives = [];
            var normalName = directiveNormalize(nodeName(node).toLowerCase());
            addDirective(directives, normalName);
            _.forEach(node.attributes,function(attr){
            	var normalName=directiveNormalize(attr.name.toLowerCase());
            	 addDirective(directives, normalName);
            });
            return directives;
        }

        function directiveNormalize(name){
        	return _.camelCase(name.replace(PREFIX_REGEXP,""));
        }

        function nodeName(element) {
            return element.nodeName ? element.nodeName : element[0].nodeName;
        }

        function addDirective(directives,name) {
        	if(hasDirectives.hasOwnProperty(name)){
        		directives.push.apply(directives,$injector.get(name+'Directive'));
        	}

        }

        return compile;
    }];
}

$CompileProvider.$inject = ['$provide'];
