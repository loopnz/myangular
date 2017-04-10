function $CompileProvider($provide) {

    var hasDirectives = {};
    var PREFIX_REGEXP = /(x[\:\-_]|data[\:\-_])/i;
    this.directive = function(name, factory) {
        if (_.isString(name)) {
            if (!hasDirectives.hasOwnProperty(name)) {
                hasDirectives[name] = [];
                $provide.factory(name + 'Directive', ['$injector', function($injector) {
                    var factories = hasDirectives[name];
                    return _.map(factories, function(factory, i) {
                        var directive = $injector.invoke(factory);
                        directive.restrict = directive.restrict || 'EA';
                        directive.name = directive.name || name;
                        directive.index = i;
                        directive.priority = directive.priority || 0;
                        return directive;
                    });
                }]);
            }
            hasDirectives[name].push(factory);
        } else {
            _.forEach(name, function(factory, name) {
                this.directive(name, factory);
            }, this);
        }
    };

    this.$get = ['$injector', function($injector) {

        function compile($compileNodes) {
            return compileNodes($compileNodes);
        }

        function compileNodes($compileNodes) {
            _.forEach($compileNodes, function(node) {
                var directives = collectDirectives(node);
                var terminal=applyDirectivesToNode(directives, node);
                if (!terminal&&node.childNodes && node.childNodes.length) {
                    compileNodes(node.childNodes);
                }
            });
        }

        function applyDirectivesToNode(directives, node) {
            var $compileNode = $(node);
            var terminalPriority = -Number.MAX_VALUE;
            var terminal =false;
            _.forEach(directives, function(directive) {
            	if(directive.$$start){
            		$compileNode=groupScan(node,directive.$$start,directive.$$end);
            	}
                if (directive.priority < terminalPriority) {
                    return false;
                }
                if (directive.compile) {
                    directive.compile($compileNode);
                }
                if (directive.terminal) {
                	terminal=true;
                    terminalPriority = directive.priority;
                }
            });
            return terminal;
        }

        function groupScan(node,startAttr,endAttr){
        	var nodes=[];
        	if(startAttr&&node&&node.hasAttribute(startAttr)){
        		var depth=0;
        		do{
        			if(node.nodeType===1){
        				if(node.hasAttribute(startAttr)){
        					depth++;
        				}else if(node.hasAttribute(endAttr)){
        					depth--;
        				}
        			}
        			nodes.push(node);
        			node=node.nextSibling;
        		}while(depth>0);
        	}else{
        		nodes.push(node);
        	}
        	return $(nodes);
        }

        function collectDirectives(node) {
            var directives = [];
            if (node.nodeType == 1) {
                var normalName = directiveNormalize(nodeName(node).toLowerCase());
                addDirective(directives, normalName, 'E');
                _.forEach(node.attributes, function(attr) {
                	var attrStartName,attrEndName;
                	var name=attr.name;
                    var normalName = directiveNormalize(name.toLowerCase());
                    if (/^ngAttr[A-Z]/.test(normalName)) {
                    	name=_.kebabCase(normalName[6].toLowerCase() + normalName.substring(7));
                    }
                    var directiveName=normalName.replace(/(Start|End)$/,"");
                    if(directiveIsMultiElement(directiveName)){
                    	if(/Start$/.test(normalName)){
                    		attrStartName=name;
                    		attrEndName=name.substring(0,name.length-5)+"end";
                    		name=name.substring(0,name.length-6);
                    	}
                    }
                    normalName=directiveNormalize(name.toLowerCase());
                    addDirective(directives, normalName, 'A',attrStartName,attrEndName);
                });
                _.forEach(node.classList, function(cls) {
                    var normalName = directiveNormalize(cls);
                    addDirective(directives, normalName, 'C');
                });
            } else if (node.nodeType == 8) {
                var match = /^\s*directive\:\s*([\d\w\-_]+)/.exec(node.nodeValue);
                if (match) {
                    addDirective(directives, directiveNormalize(match[1]), 'M');
                }
            }
            directives.sort(byPriority);

            return directives;
        }

        function directiveIsMultiElement(name){
        	if(hasDirectives.hasOwnProperty(name)){
        		var directives=$injector.get(name+'Directive');
        		return _.any(directives,{multiElement:true});
        	}
        	return false;

        }

        function byPriority(a, b) {
            var diff = b.priority - a.priority;
            if (diff !== 0) {
                return diff;
            } else {
                if (a.name !== b.name) {
                    return (a.name < b.name ? -1 : 1);
                } else {
                    return a.index - b.index;
                }
            }
        }

        function directiveNormalize(name) {
            return _.camelCase(name.replace(PREFIX_REGEXP, ""));
        }

        function nodeName(element) {
            return element.nodeName ? element.nodeName : element[0].nodeName;
        }

        function addDirective(directives, name, mode,attrStartName,attrEndName) {
            if (hasDirectives.hasOwnProperty(name)) {
                var foundDirectives = $injector.get(name + 'Directive');
                var applicableDirectives = _.filter(foundDirectives, function(dir) {
                    return dir.restrict.indexOf(mode) !== -1;
                });
                _.forEach(applicableDirectives,function(directive){
                	if(attrStartName){
                		directive=_.create(directive,{
                			$$start:attrStartName,
                			$$end:attrEndName
                		});
                	}
                	directives.push(directive);
                });
               
            }

        }

        return compile;
    }];
}

$CompileProvider.$inject = ['$provide'];
