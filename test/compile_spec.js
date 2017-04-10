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

    it('编译带有ng-attr前缀的属性指令', function() {
        var injector = makeInjectorWithDirectives({
            myDirective: function() {
                return {
                    compile: function(element) {
                        element.data('hasCompiled', true);
                    }
                };
            }
        });

        injector.invoke(function($compile) {
            var el = $('<div ng-attr-my-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('编译带有data:ng-attr前缀的属性指令', function() {
        var injector = makeInjectorWithDirectives({
            myDirective: function() {
                return {
                    compile: function(element) {
                        element.data('hasCompiled', true);
                    }
                };
            }
        });

        injector.invoke(function($compile) {
            var el = $('<div data:ng-attr-my-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('编译class类型的指令', function() {
        var injector = makeInjectorWithDirectives({
            myDirective: function() {
                return {
                    restrict: 'C',
                    compile: function(element) {
                        element.data('hasCompiled', true);
                    }
                };
            }
        });

        injector.invoke(function($compile) {
            var el = $('<div class="my-directive"></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('编译同一个元素上的多个class指令', function() {
        var injector = makeInjectorWithDirectives({
            myDirective: function() {
                return {
                    restrict: 'C',
                    compile: function(element) {
                        element.data('hasCompiled', true);
                    }
                };
            },
            mySecondDirective: function() {
                return {
                    restrict: 'C',
                    compile: function(element) {
                        element.data('hasCompiled2', true);
                    }
                };
            }
        });

        injector.invoke(function($compile) {
            var el = $('<div class="my-directive my-second-directive"></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
            expect(el.data('hasCompiled2')).toBe(true);
        });
    });


    it('编译注释类型的指令', function() {
        var hasCompiled;
        var injector = makeInjectorWithDirectives({
            myDirective: function() {
                return {
                    restrict: 'M',
                    compile: function(element) {
                        hasCompiled = true;
                    }
                };
            }
        });

        injector.invoke(function($compile) {
            var el = $('<!-- directive:my-directive -->');
            $compile(el);
            expect(hasCompiled).toBe(true);
        });
    });
    var restrictType = {
        E: { element: true, attribute: false, class: false, comment: false },
        A: { element: false, attribute: true, class: false, comment: false },
        C: { element: false, attribute: false, class: true, comment: false },
        M: { element: false, attribute: false, class: false, comment: true },
        EA: { element: true, attribute: true, class: false, comment: false },
        AC: { element: false, attribute: true, class: true, comment: false },
        EAM: { element: true, attribute: true, class: false, comment: true },
        EACM: { element: true, attribute: true, class: true, comment: true }
    };
    _.forEach(restrictType, function(expected, restrict) {

        describe('编译时限制指令类型为:' + restrict, function() {

            _.forEach({
                element: "<my-directive></my-directive>",
                attribute: "<div my-directive></div>",
                class: "<div class='my-directive'></div>",
                comment: "<!--directive:my-directive -->"
            }, function(dom, type) {
                it("指令类型" + (expected[type] ? "匹配" : "不匹配" + type), function() {
                    var hasCompiled = false;
                    var injector = makeInjectorWithDirectives({
                        myDirective: function() {
                            return {
                                restrict: restrict,
                                compile: function(element) {
                                    hasCompiled = true;
                                }
                            };
                        }
                    });
                    injector.invoke(function($compile) {
                        var el = $(dom);
                        $compile(el);
                        expect(hasCompiled).toBe(expected[type]);
                    });
                });

            });

        });
    });

    it('应用指令优先级排序', function() {
        var compilations = [];
        var injector = makeInjectorWithDirectives({
            myDirective: function() {
                return {
                    priority: 1,
                    compile: function(element) {
                        compilations.push('lower');
                    }
                };
            },
            mySecondDirective: function() {
                return {
                    priority: 2,
                    compile: function(element) {
                        compilations.push('higher');
                    }
                };
            }
        });
        injector.invoke(function($compile) {
            var el = $('<div my-directive my-second-directive></div>');
            $compile(el);
            expect(compilations).toEqual(['higher', 'lower']);
        });

    });

    it('指令优先级排序时如果优先级相同,按照指令名称排序', function() {
        var compilations = [];
        var injector = makeInjectorWithDirectives({
            firstDirective: function() {
                return {
                    priority: 1,
                    compile: function(element) {
                        compilations.push('first');
                    }
                };
            },
            secondDirective: function() {
                return {
                    priority: 1,
                    compile: function(element) {
                        compilations.push('second');
                    }
                };
            }
        });
        injector.invoke(function($compile) {
            var el = $('<div second-directive first-directive ></div>');
            $compile(el);
            expect(compilations).toEqual(['first', 'second']);
        });
    });


    it('指令优先级排序时如果优先级跟名称都相同,按照注册指令顺序排序', function() {
        var compilations = [];
        var my = window.angular.module('myModule', []);
        my.directive('aDirective', function() {
            return {
                priority: 1,
                compile: function(element) {
                    compilations.push('first');
                }
            };
        });
        my.directive('aDirective', function() {
            return {
                priority: 1,
                compile: function(element) {
                    compilations.push('second');
                }
            };
        });
        var injector = createInjector(['ng', 'myModule']);
        injector.invoke(function($compile) {
            var el = $('<div a-directive ></div>');
            $compile(el);
            expect(compilations).toEqual(['first', 'second']);
        });
    });

    it('编译时碰到终端指令(terminal值为true)的话停止优先级低于当前指令的编译', function() {
        var compilations = [];
        var my = window.angular.module('myModule', []);
        my.directive('firstDirective', function() {
            return {
                priority: 1,
                terminal: true,
                compile: function(element) {
                    compilations.push('first');
                }
            };
        });
        my.directive('secondDirective', function() {
            return {
                priority: 0,
                compile: function(element) {
                    compilations.push('second');
                }
            };
        });
        var injector = createInjector(['ng', 'myModule']);
        injector.invoke(function($compile) {
            var el = $('<div first-directive second-directive></div>');
            $compile(el);
            expect(compilations).toEqual(['first']);
        });

    });

    it('编译时碰到终端指令(terminal值为true)的话继续优先级等于当前指令的编译', function() {
        var compilations = [];
        var my = window.angular.module('myModule', []);
        my.directive('firstDirective', function() {
            return {
                priority: 1,
                terminal: true,
                compile: function(element) {
                    compilations.push('first');
                }
            };
        });
        my.directive('secondDirective', function() {
            return {
                priority: 1,
                compile: function(element) {
                    compilations.push('second');
                }
            };
        });
        var injector = createInjector(['ng', 'myModule']);
        injector.invoke(function($compile) {
            var el = $('<div first-directive second-directive></div>');
            $compile(el);
            expect(compilations).toEqual(['first', 'second']);
        });

    });


    it('编译时碰到终端指令(terminal值为true)的话停止子元素的指令的编译', function() {
        var compilations = [];
        var my = window.angular.module('myModule', []);
        my.directive('firstDirective', function() {
            return {
                priority: 1,
                terminal: true,
                compile: function(element) {
                    compilations.push('first');
                }
            };
        });
        my.directive('secondDirective', function() {
            return {
                priority: 1,
                compile: function(element) {
                    compilations.push('second');
                }
            };
        });
        var injector = createInjector(['ng', 'myModule']);
        injector.invoke(function($compile) {
            var el = $('<div first-directive><div  second-directive></div></div>');
            $compile(el);
            expect(compilations).toEqual(['first']);
        });

    });

    it('允许指令覆盖多个同辈dom元素', function() {
    	 var compileEl = [];
        var my = window.angular.module('myModule', []);
        my.directive('myDir', function() {
            return {
                multiElement:true,
                compile: function(element) {
                    compileEl=element;
                }
            };
        });
        var injector = createInjector(['ng', 'myModule']);
        injector.invoke(function($compile) {
            var el = $('<div my-dir-start></div><span></span><div my-dir-end></div>');
            $compile(el);
            expect(compileEl.length).toBe(3);
        });
    });

    describe('指令的属性', function() {
    	
    });
});


