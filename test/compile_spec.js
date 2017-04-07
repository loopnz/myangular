describe('指令(directive)--$compile', function() {

    beforeEach(function() {
        delete window.angular;
        publishExternalAPI();
    });

    function makeInjectorWithDirectives() {
        var args = arguments;
        return createInjector(['ng', function($compileProvider) {
            $compileProvider.directive.apply($compileProvider, args);
        }]);
    }

    it('注册指令', function() {
        var my = window.angular.module('myModule', []);
        my.directive('testing', function() {});
        var injector = createInjector(['ng', 'myModule']);
        expect(injector.has('testingDirective')).toBe(true);
    });

    it('允许使用相同名称注册指令', function() {
        var my = window.angular.module('myModule', []);
        my.directive('testing', _.constant({ d: 'one' }));
        my.directive('testing', _.constant({ d: 'two' }));
        var injector = createInjector(['ng', 'myModule']);

        var result = injector.get('testingDirective');
        expect(result.length).toBe(2);
        expect(result[0].d).toEqual('one');
    });

    it('编译元素类型的指令(单个元素)', function() {
        var injector = makeInjectorWithDirectives('myDirective', function() {
            return {
                compile: function(element) {
                    element.data('hasCompiled', true);
                }
            };
        });
        injector.invoke(function($compile) {
            var el = $('<my-directive></my-directive');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });


    it('编译元素类型的指令(多个元素)', function() {
        var idx = 1;
        var injector = makeInjectorWithDirectives('myDirective', function() {
            return {
                compile: function(element) {
                    element.data('hasCompiled', idx++);
                }
            };
        });
        injector.invoke(function($compile) {
            var el = $('<my-directive></my-directive><my-directive></my-directive>');
            $compile(el);
            expect(el.eq(0).data('hasCompiled')).toBe(1);
            expect(el.eq(1).data('hasCompiled')).toBe(2);
        });
    });

    it('编译dom节点的子元素指令', function() {
        var idx = 1;
        var injector = makeInjectorWithDirectives('myDirective', function() {
            return {
                compile: function(element) {
                    element.data('hasCompiled', idx++);
                }
            };
        });
        injector.invoke(function($compile) {
            var el = $('<div><my-directive></my-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBeUndefined();
            expect(el.find(">my-directive").data('hasCompiled')).toBe(1);
        });
    });

    it('编译元素类型的指令,并且子元素也是元素类型指令', function() {
        var idx = 1;
        var injector = makeInjectorWithDirectives('myDir', function() {
            return {
                compile: function(element) {
                    element.data('hasCompiled', idx++);
                }
            };
        });
        injector.invoke(function($compile) {
            var el = $('<my-dir><my-dir><my-dir/></my-dir></my-dir>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(1);
            expect(el.find(">my-dir").data('hasCompiled')).toBe(2);
            expect(el.find(">my-dir>my-dir").data('hasCompiled')).toBe(3);
        });
    });

    _.forEach(['x', 'data'], function(prefix) {

        _.forEach([":", "-", "_"], function(delim) {
            it('编译元素类型的指令(设置前缀、设置分隔符)', function() {
                var injector = makeInjectorWithDirectives('myDir', function() {
                    return {
                        compile: function(element) {
                            element.data('hasCompiled', true);
                        }
                    };
                });

                injector.invoke(function($compile) {
                    var el = $('<' + prefix + delim + 'my-dir></' + prefix + delim + 'my-dir>');
                    $compile(el);
                    expect(el.data('hasCompiled')).toBe(true);
                });

            });
        });
    });


    it('编译属性类型的指令', function() {
        var injector = makeInjectorWithDirectives('myDirective', function() {
            return {
                compile: function(element) {
                    element.data('hasCompiled', true);
                }
            };
        });
        injector.invoke(function($compile) {
            var el = $('<div my-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('编译带前缀的属性指令', function() {
        var injector = makeInjectorWithDirectives('myDirective', function() {
            return {
                compile: function(element) {
                    element.data('hasCompiled', true);
                }
            };
        });

        injector.invoke(function($compile) {
            var el = $('<div x:my-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });

    });

    it('编译同一个元素上的多个属性指令', function() {
        var injector = makeInjectorWithDirectives({
            myDirective: function() {
                return {
                    compile: function(element) {
                        element.data('hasCompiled', true);
                    }
                };
            },
            mySecondDirective: function() {
                return {
                    compile: function(element) {
                        element.data('hasCompiled2', true);
                    }
                };
            }
        });

        injector.invoke(function($compile) {
            var el = $('<div my-directive my-second-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
            expect(el.data('hasCompiled2')).toBe(true);
        });
    });

    it('编译元素指令,元素指令上有属性指令', function() {
    	 var injector = makeInjectorWithDirectives({
            myDirective: function() {
                return {
                    compile: function(element) {
                        element.data('hasCompiled', true);
                    }
                };
            },
            mySecondDirective: function() {
                return {
                    compile: function(element) {
                        element.data('hasCompiled2', true);
                    }
                };
            }
        });

        injector.invoke(function($compile) {
            var el = $('<my-directive my-second-directive></my-directive>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
            expect(el.data('hasCompiled2')).toBe(true);
        });

    });



});
