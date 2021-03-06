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

    describe('基础编译过程', function() {
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
                    multiElement: true,
                    compile: function(element) {
                        compileEl = element;
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
    });


    describe('指令的属性', function() {

        function registerAndCompile(dirName, domStr, callback) {
            var givenAttrs;
            var injector = makeInjectorWithDirectives(dirName, function() {
                return {
                    restrict: 'EACM',
                    compile: function(element, attrs) {
                        givenAttrs = attrs;
                    }
                };
            });
            injector.invoke(function($compile, $rootScope) {
                var el = $(domStr);
                $compile(el);
                callback(el, givenAttrs, $rootScope);
            });
        }


        it('将dom元素的属性作为参数传递给compile函数', function() {
            var my = window.angular.module('myModule', []);
            my.directive('myDir', function() {
                return {
                    restrict: 'E',
                    compile: function(element, attrs) {
                        element.data('givenAttrs', attrs);
                    }
                };
            });
            var injector = createInjector(['ng', 'myModule']);
            injector.invoke(function($compile) {
                var el = $('<my-dir my-attr="1" my-other-attr="2"></my-dir>');
                $compile(el);
                expect(el.data('givenAttrs').myAttr).toEqual('1');
                expect(el.data('givenAttrs').myOtherAttr).toEqual('2');
            });
        });

        it('设置布尔类型的属性值为true', function() {
            registerAndCompile('myDirective', '<input my-directive disabled>', function(element, attrs) {
                expect(attrs.disabled).toBe(true);
            });
        });

        it('使用带有ng-attr前缀的属性值替代原来的值', function() {
            registerAndCompile('myDirective', '<input my-directive ng-attr-what="42" what="41">', function(element, attrs) {
                expect(attrs.what).toBe("42");
            });
        });

        it('允许设置属性', function() {
            registerAndCompile('myDirective', '<input my-directive attr="true">', function(element, attrs) {
                attrs.$set('attr', 'false');
                expect(attrs.attr).toBe("false");
            });
        });
        it('允许设置属性,并绑定dom', function() {
            registerAndCompile('myDirective', '<input my-directive attr="true">', function(element, attrs) {
                attrs.$set('attr', 'false');
                expect(element.attr('attr')).toBe("false");
            });
        });

        it('当参数flag为FALSE时不设置dom属性', function() {
            registerAndCompile('myDirective', '<input my-directive attr="true">', function(element, attrs) {
                attrs.$set('attr', 'false', false);
                expect(element.attr('attr')).toBe("true");
            });
        });
        it('指令间共享属性', function() {
            var attrs1, attrs2;
            var injector = makeInjectorWithDirectives({
                firstDirective: function() {
                    return {
                        priority: 1,
                        compile: function(element, attrs) {
                            attrs1 = attrs;
                        }
                    };
                },
                secondDirective: function() {
                    return {
                        priority: 1,
                        compile: function(element, attrs) {
                            attrs2 = attrs;
                        }
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div second-directive first-directive ></div>');
                $compile(el);
                expect(attrs1).toBe(attrs2);
            });
        });

        it('观察属性变化', function() {
            registerAndCompile('myDirective', '<input my-directive attr="42">', function(element, attrs) {
                var gotValue;
                attrs.$observe('attr', function(value) {
                    gotValue = value;
                });
                attrs.$set('attr', '43');
                expect(gotValue).toEqual('43');
            });
        });

        it('在注册属性变化函数后再下一次digest中调用函数', function() {
            registerAndCompile('myDirective', '<input my-directive attr="42">', function(element, attrs, $rootScope) {
                var gotValue;
                attrs.$observe('attr', function(value) {
                    gotValue = value;
                });
                $rootScope.$digest();
                expect(gotValue).toEqual('42');
            });
        });

        it('注销属性监控函数', function() {
            registerAndCompile('myDirective', '<input my-directive attr="43">', function(element, attrs, $rootScope) {
                var gotValue;
                var remove = attrs.$observe('attr', function(value) {
                    gotValue = value;
                });
                attrs.$set('attr', 43);
                expect(gotValue).toEqual(43);
                remove();
                attrs.$set('attr', 44);
                expect(gotValue).toBe(43);
            });
        });

        it('将class的值(如果是指令)也添加进属性值', function() {
            registerAndCompile('myDirective', '<input class="my-directive">', function(element, attrs, $rootScope) {
                expect(attrs.hasOwnProperty('myDirective')).toBe(true);
            });
        });

        it('将class的值(如果不是指令)不添加进属性值', function() {
            registerAndCompile('myDirective', '<input my-directive class="some">', function(element, attrs, $rootScope) {
                expect(attrs.hasOwnProperty('some')).toBe(false);
            });
        });

        it('给class类型的指令传递参数', function() {
            registerAndCompile('myDirective', '<input  class="my-directive:my attribute">', function(element, attrs, $rootScope) {
                expect(attrs.myDirective).toEqual("my attribute");
            });
        });

        it('给class类型的指令传递参数,参数在分号处终止', function() {
            registerAndCompile('myDirective', '<input  class="my-directive:my attribute;some-other-class">', function(element, attrs, $rootScope) {
                expect(attrs.myDirective).toEqual("my attribute");
            });
        });

        it('将注释的值(如果是指令)也添加进属性值', function() {
            registerAndCompile('myDirective', '<!-- directive:my-directive and the attribute value  -->', function(element, attrs, $rootScope) {
                expect(attrs.hasOwnProperty('myDirective')).toBe(true);
                expect(attrs.myDirective).toEqual('and the attribute value');
            });
        });

        it('允许添加classes', function() {
            registerAndCompile('myDirective', '<my-directive></my-directive>', function(element, attrs, $rootScope) {
                attrs.$addClass('some-class');
                expect(element.hasClass('some-class')).toBe(true);
            });
        });

        it('允许移除classes', function() {
            registerAndCompile('myDirective', '<my-directive class="some-class"></my-directive>', function(element, attrs, $rootScope) {
                attrs.$removeClass('some-class');
                expect(element.hasClass('some-class')).toBe(false);
            });
        });


        it('允许更新classes', function() {
            registerAndCompile('myDirective', '<my-directive class="one three four"></my-directive>', function(element, attrs, $rootScope) {
                attrs.$updateClass('one two three', 'one three four');
                expect(element.hasClass('one')).toBe(true);
                expect(element.hasClass('two')).toBe(true);
                expect(element.hasClass('three')).toBe(true);
                expect(element.hasClass('four')).toBe(false);
            });
        });
    });



    describe('指令链接linking', function() {
        it('在compile函数中返回公共link函数', function() {
            var injector = makeInjectorWithDirectives('myDirective', function() {
                return {
                    compile: _.noop
                };
            });
            injector.invoke(function($compile) {
                var el = $('<div my-directive></div>');
                var linkFn = $compile(el);
                expect(linkFn).toBeDefined();
                expect(_.isFunction(linkFn)).toBe(true);
            });
        });

        it('传递任意一个scope对象作为link函数参数', function() {
            var injector = makeInjectorWithDirectives('myDirective', function() {
                return {
                    compile: _.noop
                };
            });
            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-directive></div>');
                $compile(el)($rootScope);
                expect(el.data('$scope')).toBe($rootScope);
            });
        });

        it('调用指令的link函数(传入scope对象)', function() {
            var givenScope, givenElement, givenAttrs;
            var injector = makeInjectorWithDirectives('myDirective', function() {
                return {
                    compile: function(element, attrs) {

                        return function(scope, element, attrs) {
                            givenScope = scope;
                            givenElement = element;
                            givenAttrs = attrs;
                        };
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-directive></div>');
                $compile(el)($rootScope);
                expect(givenScope).toBe($rootScope);
                expect(givenElement[0]).toBe(el[0]);
                expect(givenAttrs).toBeDefined();
                expect(givenAttrs.myDirective).toBeDefined();
            });

        });

        it('使用定义在指令对象内的link函数', function() {

            var givenScope, givenElement, givenAttrs;
            var injector = makeInjectorWithDirectives('myDirective', function() {
                return {
                    link: function(scope, element, attrs) {
                        givenScope = scope;
                        givenElement = element;
                        givenAttrs = attrs;
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-directive></div>');
                $compile(el)($rootScope);
                expect(givenScope).toBe($rootScope);
                expect(givenElement[0]).toBe(el[0]);
                expect(givenAttrs).toBeDefined();
                expect(givenAttrs.myDirective).toBeDefined();
            });
        });

        it('先执行子元素的link函数', function() {
            var givenElements = [];
            var injector = makeInjectorWithDirectives('myDirective', function() {
                return {
                    link: function(scope, element, attrs) {
                        givenElements.push(element);
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-directive><div my-directive></div></div>');
                $compile(el)($rootScope);
                expect(givenElements.length).toBe(2);
                expect(givenElements[0][0]).toBe(el[0].firstChild);
                expect(givenElements[1][0]).toBe(el[0]);
            });
        });

        it('执行子元素的link函数(父元素没有指令的情况下)', function() {
            var givenElements = [];
            var injector = makeInjectorWithDirectives('myDirective', function() {
                return {
                    link: function(scope, element, attrs) {
                        givenElements.push(element);
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div><div my-directive></div></div>');
                $compile(el)($rootScope);
                expect(givenElements.length).toBe(1);
                expect(givenElements[0][0]).toBe(el[0].firstChild);
            });
        });


        it('支持link是对象的情况', function() {
            var linked;
            var injector = makeInjectorWithDirectives('myDirective', function() {
                return {
                    link: {
                        post: function(scope, element, attrs) {
                            linked = true;
                        }
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div><div my-directive></div></div>');
                $compile(el)($rootScope);
                expect(linked).toBe(true);
            });
        });

        it('支持link是对象的情况(prelinking and postlinking)', function() {
            var linkings = [];
            var injector = makeInjectorWithDirectives('myDirective', function() {
                return {
                    link: {
                        pre: function(scope, element, attrs) {
                            linkings.push(['pre', element[0]]);
                        },
                        post: function(scope, element, attrs) {
                            linkings.push(['post', element[0]]);
                        }
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-directive><div my-directive></div></div>');
                $compile(el)($rootScope);
                expect(linkings.length).toBe(4);
                expect(linkings[0]).toEqual(['pre', el[0]]);
                expect(linkings[1]).toEqual(['pre', el[0].firstChild]);
                expect(linkings[2]).toEqual(['post', el[0].firstChild]);
                expect(linkings[3]).toEqual(['post', el[0]]);
            });
        });

        it('支持link是对象的情况(反转postlinking的优先级顺序)', function() {
            var linkings = [];
            var injector = makeInjectorWithDirectives({
                firstDirective: function() {
                    return {
                        priority: 2,
                        link: {
                            pre: function(scope, element, attrs) {
                                linkings.push('first-pre');
                            },
                            post: function(scope, element, attrs) {
                                linkings.push('first-post');
                            }
                        }
                    };
                },
                secondDirective: function() {
                    return {
                        priority: 1,
                        link: {
                            pre: function(scope, element, attrs) {
                                linkings.push('second-pre');
                            },
                            post: function(scope, element, attrs) {
                                linkings.push('second-post');
                            }
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div first-directive second-directive></div>');
                $compile(el)($rootScope);
                expect(linkings).toEqual([
                    'first-pre',
                    'second-pre',
                    'second-post',
                    'first-post'
                ]);
            });
        });

        it('保存dom节点顺序,保证编译与链接的dom节点相同', function() {

            var givenElements = [];
            var injector = makeInjectorWithDirectives('myDirective', function() {
                return {
                    link: function(scope, element, attrs) {
                        givenElements.push(element[0]);
                        element.after('<div></div>');
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div><div my-directive></div><div my-directive></div></div>');
                var el1 = el[0].childNodes[0];
                var el2 = el[0].childNodes[1];
                $compile(el)($rootScope);
                expect(givenElements.length).toBe(2);
                expect(givenElements[0]).toBe(el1);
                expect(givenElements[1]).toBe(el2);
            });
        });

        it('多个同辈元素的指令链接', function() {

            var givenElements = [];
            var injector = makeInjectorWithDirectives('myDir', function() {
                return {
                    multiElement: true,
                    link: function(scope, element, attrs) {
                        givenElements = element;
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir-start></div><div></div><div my-dir-end></div>');
                $compile(el)($rootScope);
                expect(givenElements.length).toBe(3);
            });
        });

        it('在指令中创建新的scope', function() {
            var givenScope = [];
            var injector = makeInjectorWithDirectives('myDir', function() {
                return {
                    scope: true,
                    link: function(scope, element, attrs) {
                        givenScope = scope;
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                $compile(el)($rootScope);
                expect(givenScope.$parent).toBe($rootScope);
            });
        });

        it('单个元素上有多个指令,其中1个指令创建的scope在其余指令间共享', function() {
            var givenScope = [];
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        scope: true
                    };
                },
                myOir: function() {
                    return {
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir my-oir></div>');
                $compile(el)($rootScope);
                expect(givenScope.$parent).toBe($rootScope);
            });
        });

        it('创建scope时给元素添加ng-scope类,存储scope', function() {
            var givenScope = [];
            var injector = makeInjectorWithDirectives('myDir', function() {
                return {
                    scope: true,
                    link: function(scope, element, attrs) {
                        givenScope = scope;
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                $compile(el)($rootScope);
                expect(el.hasClass('ng-scope')).toBe(true);
                expect(el.data('$scope')).toBe(givenScope);
            });
        });

        it('在指令中创建ioslate scope', function() {
            var givenScope;
            var injector = makeInjectorWithDirectives('myDir', function() {
                return {
                    scope: {},
                    link: function(scope, element, attrs) {
                        givenScope = scope;
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                $compile(el)($rootScope);
                expect(givenScope.$parent).toBe($rootScope);
                expect(Object.getPrototypeOf(givenScope)).not.toBe($rootScope);
            });

        });

        it('多个指令在同一个元素时,指令的isolate scope不在指令间共享', function() {
            var givenScope;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {}
                    };
                },
                'myOir': function() {
                    return {
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir my-oir></div>');
                $compile(el)($rootScope);
                expect(givenScope).toBe($rootScope);
            });
        });

        it('指令的isolate scope不会应用到子元素上', function() {
            var givenScope;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {}
                    };
                },
                'myOir': function() {
                    return {
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir><div my-oir></div></div>');
                $compile(el)($rootScope);
                expect(givenScope).toBe($rootScope);
            });
        });


        it('不允许2个都需要isolate scope的指令同时作用在1个元素上', function() {
            var givenScope;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {}
                    };
                },
                'myOir': function() {
                    return {
                        scope: {},
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir  my-oir><div></div></div>');

                expect(function() {
                    $compile(el);
                }).toThrow();
            });
        });

        it('不允许需要isolate scope的指令和需要新建scope的指令同时作用在1个元素上', function() {
            var givenScope;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: true
                    };
                },
                'myOir': function() {
                    return {
                        scope: {},
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir  my-oir><div></div></div>');

                expect(function() {
                    $compile(el);
                }).toThrow();
            });
        });

        it('isolate scope 使用@单向继承属性', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '@'
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                            givenAttrs = attrs;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                $compile(el)($rootScope);
                givenAttrs.$set('anAttr', '42');
                expect(givenScope.anAttr).toBe('42');
            });

        });
        it('isolate scope 使用@单向继承属性2', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '@'
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir an-attr="42"></div>');
                $compile(el)($rootScope);
                expect(givenScope.anAttr).toBe('42');
            });
        });

        it('isolate scope 使用@单向继承属性3(使用别名)', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '@anAttr2'
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir an-attr2="42"></div>');
                $compile(el)($rootScope);
                expect(givenScope.anAttr).toBe('42');
            });
        });

        it('isolate scope 使用=双向绑定属性', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '='
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                            givenAttrs = attrs;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir an-attr="42"></div>');
                $compile(el)($rootScope);
                expect(givenScope.anAttr).toBe(42);
            });
        });


        it('isolate scope 使用=双向绑定属性(使用别名)', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '=anAttr2'
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                            givenAttrs = attrs;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir an-attr2="42"></div>');
                $compile(el)($rootScope);
                expect(givenScope.anAttr).toBe(42);
            });
        });

        it('isolate scope 使用=双向绑定属性(允许属性使用表达式计算)', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '='
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                            givenAttrs = attrs;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                $rootScope.parentArr = 41;
                var el = $('<div my-dir an-attr="parentArr+1"></div>');
                $compile(el)($rootScope);
                expect(givenScope.anAttr).toBe(42);
            });
        });

        it('isolate scope 使用=双向绑定属性(监控属性变化)', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '='
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                            givenAttrs = attrs;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir an-attr="parentAttr+1"></div>');
                $compile(el)($rootScope);
                $rootScope.parentAttr = 41;
                $rootScope.$digest();
                expect(givenScope.anAttr).toBe(42);
            });
        });

        it('使用=*双向绑定数组', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '=*'
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                            givenAttrs = attrs;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                $rootScope.parentAttr = function() {
                    return [1, 2, 3];
                };
                var el = $('<div my-dir an-attr="parentAttr()"></div>');
                $compile(el)($rootScope);
                $rootScope.$digest();
                expect(givenScope.anAttr).toEqual([1, 2, 3]);
            });
        });

        it('使用=?绑定(如果元素上不存在此属性,不会添加watcher)', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '=?'
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                            givenAttrs = attrs;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                $compile(el)($rootScope);
                expect($rootScope.$$watchers.length).toBe(0);
            });
        });

        it('isolate scope 使用&绑定(允许属性使用表达式计算)', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '&'
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                            givenAttrs = attrs;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                $rootScope.parentArr = function() {
                    return 42;
                };
                var el = $('<div my-dir an-attr="parentArr()+1"></div>');
                $compile(el)($rootScope);
                expect(givenScope.anAttr()).toBe(43);
            });
        });

        it('isolate scope 使用&绑定(允许属性表达式传递参数)', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '&'
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                            givenAttrs = attrs;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var gotArg;
                $rootScope.parentArr = function(arg) {
                    gotArg = arg;
                };
                var el = $('<div my-dir an-attr="parentArr(argFromChild)"></div>');
                $compile(el)($rootScope);
                givenScope.anAttr({ argFromChild: 42 });
                expect(gotArg).toBe(42);
            });
        });


        it('isolate scope 使用&?绑定(元素上没有属性,isolateScope的值为undefined)', function() {
            var givenScope, givenAttrs;
            var injector = makeInjectorWithDirectives({
                'myDir': function() {
                    return {
                        scope: {
                            anAttr: '&?'
                        },
                        link: function(scope, element, attrs) {
                            givenScope = scope;
                            givenAttrs = attrs;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var gotArg;
                $rootScope.parentArr = function(arg) {
                    gotArg = arg;
                };
                var el = $('<div my-dir></div>');
                $compile(el)($rootScope);
                expect(givenScope.anAttr).toBeUndefined();
            });
        });



    });

    describe('指令控制器controller', function() {

        it('控制器添加到指令(使用构造函数)', function() {
            var controllerInvoked;

            var injector = makeInjectorWithDirectives('myDir', function() {
                return {
                    controller: function() {
                        controllerInvoked = true;
                    }
                };
            });

            injector.invoke(function($compile, $rootScope) {

                var el = $('<div my-dir></div>');
                $compile(el)($rootScope);
                expect(controllerInvoked).toBe(true);
            });
        });


        it('控制器添加到指令(使用字符串)', function() {
            var controllerInvoked;

            function MyController() {
                controllerInvoked = true;
            }

            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);
                $compileProvider.directive('myDir', function() {
                    return {
                        controller: 'MyController'
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {

                var el = $('<div my-dir></div>');
                $compile(el)($rootScope);
                expect(controllerInvoked).toBe(true);
            });
        });

        it('不同指令应用到相同元素,指令的控制器是独立的对象', function() {
            var controllerInvoked;
            var other;

            function MyController() {
                controllerInvoked = true;
            }

            function OtherController() {
                other = true;
            }

            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);
                $controllerProvider.register('OtherController', OtherController);

                $compileProvider.directive('myDir', function() {
                    return {
                        controller: 'MyController'
                    };
                });

                $compileProvider.directive('myOir', function() {
                    return {
                        controller: 'OtherController'
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {

                var el = $('<div my-dir my-oir></div>');
                $compile(el)($rootScope);
                expect(controllerInvoked).toBe(true);
                expect(other).toBe(true);
            });

        });

        it('不同指令可以使用相同的控制器构造器', function() {
            var controllerInvoked = 0;

            function MyController() {
                controllerInvoked++;
            }


            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);

                $compileProvider.directive('myDir', function() {
                    return {
                        controller: 'MyController'
                    };
                });

                $compileProvider.directive('myOir', function() {
                    return {
                        controller: 'MyController'
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {

                var el = $('<div my-dir my-oir></div>');
                $compile(el)($rootScope);
                expect(controllerInvoked).toBe(2);
            });

        });

        it('使用@给指令控制器赋值(值为指令属性的值)', function() {
            var controllerInvoked;

            function MyController() {
                controllerInvoked = true;
            }
            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);

                $compileProvider.directive('myDir', function() {
                    return {
                        controller: '@'
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {

                var el = $('<div my-dir="MyController"></div>');
                $compile(el)($rootScope);
                expect(controllerInvoked).toBe(true);
            });

        });

        it('给指令控制器注入scope,element,attrs', function() {
            var gotScope, gotElement, goAttrs;

            function MyController($element, $scope, $attrs) {
                gotScope = $scope;
                gotElement = $element;
                gotAttrs = $attrs;
            }
            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);

                $compileProvider.directive('myDir', function() {
                    return {
                        controller: '@'
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {

                var el = $('<div my-dir="MyController" an-attr="abc"></div>');
                $compile(el)($rootScope);
                expect(gotElement[0]).toBe(el[0]);
                expect(gotScope).toBe($rootScope);
                expect(gotAttrs.anAttr).toEqual('abc');
            });

        });

        it('将控制器附加到scope上', function() {

            function MyController() {}

            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);

                $compileProvider.directive('myDir', function() {
                    return {
                        controller: '@',
                        controllerAs: 'myCtrl'
                    };
                });
            }]);
            injector.invoke(function($compile, $rootScope) {

                var el = $('<div my-dir="MyController" an-attr="abc"></div>');
                $compile(el)($rootScope);
                expect($rootScope.myCtrl).toBeDefined();
                expect($rootScope.myCtrl instanceof MyController).toBe(true);
            });

        });


        it('给指令控制器注入isolateScope', function() {
            var gotScope, gotElement, goAttrs;

            function MyController($element, $scope, $attrs) {
                gotScope = $scope;
                gotElement = $element;
                gotAttrs = $attrs;
            }
            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);

                $compileProvider.directive('myDir', function() {
                    return {
                        scope: {},
                        controller: '@'
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {

                var el = $('<div my-dir="MyController" an-attr="abc"></div>');
                $compile(el)($rootScope);
                expect(gotScope).not.toBe($rootScope);
            });

        });

        it('当指令控制器实例化时,isolate的绑定已经完成', function() {
            var goAttrs;

            function MyController($scope) {
                gotAttrs = $scope.myAttr;
            }
            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);

                $compileProvider.directive('myDir', function() {
                    return {
                        scope: {
                            myAttr: '@myDir'
                        },
                        controller: 'MyController'
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {

                var el = $('<div my-dir="abc" an-attr="abc"></div>');
                $compile(el)($rootScope);
                expect(gotAttrs).toBe("abc");
            });

        });

        it('将isolateScope的属性绑定到指令控制器实例', function() {
            var goAttrs;

            function MyController($scope) {
                gotAttrs = this.myAttr;
            }
            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);

                $compileProvider.directive('myDir', function() {
                    return {
                        scope: {
                            myAttr: '@myDir'
                        },
                        controller: 'MyController',
                        bindToController: true
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {

                var el = $('<div my-dir="abc"></div>');
                $compile(el)($rootScope);
                expect(gotAttrs).toBe("abc");
            });

        });


        it('返回控制器的不完整构造函数', function() {
            var injector = createInjector(['ng']);
            var $controller = injector.get('$controller');

            function MyController() {
                this.constructed = true;
                this.myAttrWhenConstructed = this.myAttr;
            }
            var controller = $controller(MyController, null, true);
            expect(controller.constructed).toBeUndefined();
            expect(controller.instance).toBeDefined();
            controller.instance.myAttr = 42;
            var actualController = controller();

            expect(actualController.constructed).toBeDefined();
            expect(actualController.myAttrWhenConstructed).toBe(42);
        });

        it('返回控制器的不完整构造函数(使用数组形式的依赖注入)', function() {
            var injector = createInjector(['ng', function($provide) {
                $provide.constant('aDep', 42);
            }]);
            var $controller = injector.get('$controller');

            function MyController(aDep) {
                this.aDep = aDep;
                this.constructed = true;
            }
            var controller = $controller(['aDep', MyController], null, true);
            expect(controller.constructed).toBeUndefined();
            var actualController = controller();
            expect(actualController.constructed).toBeDefined();
            expect(actualController.aDep).toBe(42);
        });

        it('将不完整的控制器实例绑定到scope', function() {
            var scope = {};

            function MyController($scope) {

            }
            var injector = createInjector(['ng']);
            var $controller = injector.get('$controller');
            var controller = $controller(MyController, { $scope: scope }, true, 'myCtrl');
            expect(scope.myCtrl).toBe(controller.instance);

        });

        it('通过bindToController 给isolateScope绑定属性', function() {
            var gotMyAttr;


            function MyController() {
                gotMyAttr = this.myAttr;
            }
            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);
                $compileProvider.directive('myDirective', function() {
                    return {
                        scope: {},
                        controller: 'MyController',
                        bindToController: {
                            myAttr: '@myDirective'
                        }
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-directive="abc"></div>');
                $compile(el)($rootScope);
                expect(gotMyAttr).toEqual('abc');
            });

        });

        it('通过bindToController 给新建的继承的scope绑定属性', function() {
            var gotMyAttr;


            function MyController() {
                gotMyAttr = this.myAttr;
            }
            var injector = createInjector(['ng', function($controllerProvider, $compileProvider) {
                $controllerProvider.register('MyController', MyController);
                $compileProvider.directive('myDirective', function() {
                    return {
                        scope: true,
                        controller: 'MyController',
                        bindToController: {
                            myAttr: '@myDirective'
                        }
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-directive="abc"></div>');
                $compile(el)($rootScope);
                expect(gotMyAttr).toEqual('abc');
            });

        });

        it('require 其他指令(兄弟指令,即作用于同一元素上的指令)的控制器', function() {

            function MyController() {}
            var gotController;
            var injector = createInjector(['ng', function($compileProvider) {
                $compileProvider.directive('myDir', function() {

                    return {
                        scope: {},
                        controller: MyController
                    };
                });

                $compileProvider.directive('myOir', function() {

                    return {
                        require: "myDir",
                        link: function(scope, element, attrs, myController) {
                            gotController = myController;
                        }
                    };
                });

            }]);

            injector.invoke(function($compile, $rootScope) {
                var el = $("<div my-dir my-oir></div>");
                $compile(el)($rootScope);
                expect(gotController).toBeDefined();
                expect(gotController instanceof MyController).toBe(true);
            });

        });


        it('如果指令没有require其他,使用自己的控制器', function() {

            function MyController() {}
            var gotController;
            var injector = createInjector(['ng', function($compileProvider) {
                $compileProvider.directive('myOir', function() {

                    return {
                        scope: {},
                        controller: MyController,
                        link: function(scope, element, attrs, myController) {
                            gotController = myController;
                        }
                    };
                });

            }]);

            injector.invoke(function($compile, $rootScope) {
                var el = $("<div my-oir></div>");
                $compile(el)($rootScope);
                expect(gotController).toBeDefined();
                expect(gotController instanceof MyController).toBe(true);
            });

        });



        it('多元素指令的require', function() {

            function MyController() {}
            var gotController;
            var injector = createInjector(['ng', function($compileProvider) {
                $compileProvider.directive('myDir', function() {

                    return {
                        multiElement: true,
                        scope: {},
                        controller: MyController,
                        link: function(scope, element, attrs, myController) {
                            gotController = myController;
                        }
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {
                var el = $("<div my-dir-start></div><div my-dir-end></div>");
                $compile(el)($rootScope);
                expect(gotController).toBeDefined();
                expect(gotController instanceof MyController).toBe(true);
            });

        });

        it('require 父级元素的指令控制器', function() {

            function MyController() {}
            var gotController;
            var injector = createInjector(['ng', function($compileProvider) {
                $compileProvider.directive('myDir', function() {

                    return {
                        scope: {},
                        controller: MyController
                    };
                });

                $compileProvider.directive('myOir', function() {

                    return {
                        require: '^myDir',
                        link: function(scope, element, attrs, myController) {
                            gotController = myController;
                        }
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {
                var el = $("<div my-dir  ><div my-oir></div></div>");
                $compile(el)($rootScope);
                expect(gotController).toBeDefined();
                expect(gotController instanceof MyController).toBe(true);
            });
        });

        it('当require有^前缀时,从兄弟指令开始寻找require的指令控制器', function() {

            function MyController() {}
            var gotController;
            var injector = createInjector(['ng', function($compileProvider) {
                $compileProvider.directive('myDir', function() {

                    return {
                        scope: {},
                        controller: MyController
                    };
                });

                $compileProvider.directive('myOir', function() {

                    return {
                        require: '^myDir',
                        link: function(scope, element, attrs, myController) {
                            gotController = myController;
                        }
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {
                var el = $("<div my-dir my-oir ><div></div></div>");
                $compile(el)($rootScope);
                expect(gotController).toBeDefined();
                expect(gotController instanceof MyController).toBe(true);
            });
        });

        it('当require有^^前缀时,只从父级指令开始寻找require的指令控制器', function() {

            function MyController() {}
            var gotController;
            var injector = createInjector(['ng', function($compileProvider) {
                $compileProvider.directive('myDir', function() {

                    return {
                        scope: {},
                        controller: MyController
                    };
                });

                $compileProvider.directive('myOir', function() {

                    return {
                        require: '^^myDir',
                        link: function(scope, element, attrs, myController) {
                            gotController = myController;
                        }
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {
                var el = $("<div my-dir><div my-oir > </div></div>");
                $compile(el)($rootScope);
                expect(gotController).toBeDefined();
                expect(gotController instanceof MyController).toBe(true);
            });
        });

        it('当require为可选模式时(加?),未找到require的控制器传入null', function() {

            function MyController() {}
            var gotController;
            var injector = createInjector(['ng', function($compileProvider) {
                $compileProvider.directive('myDir', function() {

                    return {
                        scope: {},
                        require: "?noSuchDirective",
                        link: function(scope, element, attrs, ctrl) {
                            gotController = ctrl;
                        }
                    };
                });
            }]);

            injector.invoke(function($compile, $rootScope) {
                var el = $("<div my-dir></div>");
                $compile(el)($rootScope);
                expect(gotController).toBe(null);
            });
        });



    });

    describe('指令模板', function() {

        it('在指令所属的元素内插入模板元素', function() {
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        template: "<div class='from'></div>"
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div my-dir></div>');
                $compile(el);
                expect(el.find('>.from').length).toBe(1);
            });

        });

        it('在指令所属的元素内插入模板元素,模板元素会替代现有的子元素', function() {
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        template: "<div class='from'></div>"
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div my-dir><div class="exist"></div></div>');
                $compile(el);
                expect(el.find('>.exist').length).toBe(0);
            });

        });

        it('在指令所属的元素内插入模板元素(先编译模板)', function() {
            var spy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        template: "<div my-oir></div>"
                    };
                },
                myOir: function() {
                    return {
                        compile: spy
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div my-dir></div>');
                $compile(el);
                expect(spy).toHaveBeenCalled();
            });

        });

        it('不允许同一元素上的2个指令都有template', function() {
            var spy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        template: "<div></div>"
                    };
                },
                myOir: function() {
                    return {
                        template: "<div></div>"
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div my-dir my-oir></div>');
                expect(function() {
                    $compile(el);
                }).toThrow();
            });

        });

        it('支持模板函数', function() {
            var templateSpy = jasmine.createSpy().and.returnValue('<div class="from"></div>');
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        template: templateSpy
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div my-dir></div>');
                $compile(el);
                expect(el.find('>.from').length).toBe(1);
                expect(templateSpy.calls.first().args[0][0]).toBe(el[0]);
                expect(templateSpy.calls.first().args[1].myDir).toBeDefined();
            });
        });

        it('指令的模板使用的是指令的isolateScope', function() {
            var linkSpy = jasmine.createSpy();

            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        scope: {
                            isoValue: '=myDir'
                        },
                        template: '<div my-oir></div>'
                    };
                },
                myOir: function() {
                    return {
                        link: linkSpy
                    };
                }
            });
            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir="42"></div>');
                $compile(el)($rootScope);
                expect(linkSpy.calls.first().args[0]).not.toBe($rootScope);
                expect(linkSpy.calls.first().args[0].isoValue).toBe(42);
            });

        });
    });

    describe('异步指令模板', function() {

        it('延迟编译', function() {
            var spy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        templateUrl: '/my_directive.html'
                    };
                },
                myOir: function() {
                    return {
                        compile: spy
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div my-dir my-oir></div>');
                $compile(el);
                expect(spy).not.toHaveBeenCalled();
            });
        });

        it('延迟当前指令编译', function() {
            var spy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        templateUrl: '/my_directive.html',
                        compile: spy
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div my-dir></div>');
                $compile(el);
                expect(spy).not.toHaveBeenCalled();
            });
        });

        it('立即清空元素', function() {
            var spy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        templateUrl: '/my_directive.html'
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div my-dir>hello</div>');
                $compile(el);
                expect(el.is(':empty')).toBe(true);
            });
        });
    });
    describe('异步加载指令模板', function() {
        var xhr, requests;

        beforeEach(function() {
            xhr = sinon.useFakeXMLHttpRequest();
            requests = [];
            xhr.onCreate = function(req) {
                requests.push(req);
            };
        });

        afterEach(function() {
            xhr.restore();
        });

        it('加载模板', function() {
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        templateUrl: '/my_directive.html'
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                $compile(el);
                $rootScope.$apply();
                expect(requests.length).toBe(1);
                expect(requests[0].method).toBe('GET');
            });

        });

        it('将模板放入指令根元素', function() {
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        templateUrl: '/my_directive.html'
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                $compile(el);
                $rootScope.$apply();
                requests[0].respond(200, {}, '<div class="from"><div>');
                expect(el.find('>.from').length).toBe(1);
            });

        });

        it('模板加载后编译此模板', function() {
            var compileSpy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        templateUrl: '/my_directive.html',
                        compile: compileSpy
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                $compile(el);
                $rootScope.$apply();
                requests[0].respond(200, {}, '<div class="from"><div>');
                expect(compileSpy).toHaveBeenCalled();
            });
        });

        it('模板加载后重启编译过程', function() {
            var compileSpy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        templateUrl: '/my_directive.html'
                    };
                },
                myOir: function() {
                    return {
                        compile: compileSpy
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir my-oir></div>');
                $compile(el);
                $rootScope.$apply();
                requests[0].respond(200, {}, '<div class="from"><div>');
                expect(compileSpy).toHaveBeenCalled();
            });
        });

        it('模板加载后重启子元素的编译过程', function() {
            var compileSpy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        templateUrl: '/my_directive.html'
                    };
                },
                myOir: function() {
                    return {
                        compile: compileSpy
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                $compile(el);
                $rootScope.$apply();
                requests[0].respond(200, {}, '<div my-oir class="from"><div>');
                expect(compileSpy).toHaveBeenCalled();
            });
        });

        it('支持templateUrl是函数', function() {
            var templateSpy = jasmine.createSpy().and.returnValue('my_dir.html');
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        templateUrl: templateSpy
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                $compile(el);
                $rootScope.$apply();
                expect(requests[0].url).toBe('my_dir.html');
                expect(templateSpy.calls.first().args[0][0]).toBe(el[0]);
                expect(templateSpy.calls.first().args[1].myDir).toBeDefined();
            });

        });
        it('对于单个个元素,不允许拥有templateUrl的指令出现在有template的指令之后', function() {
            var templateSpy = jasmine.createSpy().and.returnValue('my_dir.html');
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        template: '<div></div>'
                    };
                },
                myOir: function() {
                    return { templateUrl: "<div></div>" };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir my-oir ></div>');
                expect(function() {
                    $compile(el);
                }).toThrow();
            });

        });

        it('对于单个个元素,不允许拥有template的指令出现在有templateUrl的指令之后', function() {
            var templateSpy = jasmine.createSpy().and.returnValue('my_dir.html');
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {

                        templateUrl: "/my_dir.html"
                    };
                },
                myOir: function() {
                    return { template: '<div></div>' };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir my-oir ></div>');
                $compile(el);
                $rootScope.$apply();
                requests[0].respond(200, {}, '<div class="rep"></div>');
                expect(el.find('>.rep').length).toBe(1);
            });

        });
        it('当pulic link 函数执行后link 指令', function() {
            var linkSpy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        templateUrl: "/my_dir.html",
                        link: linkSpy
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                var linkFn = $compile(el);
                $rootScope.$apply();
                requests[0].respond(200, {}, '<div class="rep"></div>');
                linkFn($rootScope);
                expect(linkSpy).toHaveBeenCalled();
                expect(linkSpy.calls.first().args[0]).toBe($rootScope);
                expect(linkSpy.calls.first().args[1][0]).toBe(el[0]);
                expect(linkSpy.calls.first().args[2].myDir).toBeDefined();
            });

        });

        it('当pulic link 函数执行后link 子元素 指令', function() {
            var linkSpy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {

                        templateUrl: "/my_dir.html"
                    };
                },
                myOir: function() {
                    return { link: linkSpy };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir></div>');
                var linkFn = $compile(el);
                $rootScope.$apply();
                requests[0].respond(200, {}, '<div my-oir></div>');
                linkFn($rootScope);
                expect(linkSpy).toHaveBeenCalled();
                expect(linkSpy.calls.first().args[0]).toBe($rootScope);
                expect(linkSpy.calls.first().args[1][0]).toBe(el[0].firstChild);
                expect(linkSpy.calls.first().args[2].myOir).toBeDefined();
            });

        });

        it('有link函数的指令先编译', function() {
            var linkSpy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        link: linkSpy
                    };
                },
                myOir: function() {
                    return { templateUrl: '/my_dir.html' };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir my-oir></div>');
                var linkFn = $compile(el);
                $rootScope.$apply();
                linkFn($rootScope);
                requests[0].respond(200, {}, '<div ></div>');

                expect(linkSpy).toHaveBeenCalled();
                expect(linkSpy.calls.argsFor(0)[0]).toBe($rootScope);
                expect(linkSpy.calls.argsFor(0)[1][0]).toBe(el[0]);
                expect(linkSpy.calls.argsFor(0)[2].myOir).toBeDefined();
            });

        });

        it('保持有isolatescope的指令有正确的scope', function() {
            var linkSpy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        scope: {
                            val: '=myDir'
                        },
                        link: linkSpy
                    };
                },
                myOir: function() {
                    return { templateUrl: '/my_dir.html' };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir="42" my-oir></div>');
                var linkFn = $compile(el);
                $rootScope.$apply();
                linkFn($rootScope);
                requests[0].respond(200, {}, '<div ></div>');

                expect(linkSpy).toHaveBeenCalled();
                expect(linkSpy.calls.first().args[0]).toBeDefined();
                expect(linkSpy.calls.first().args[0]).not.toBe($rootScope);
                expect(linkSpy.calls.first().args[0].val).toBe(42);
            });
        });

        it('对所有有controller的指令安装控制器', function() {
            var myDired, myOired;
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        controller: function() {
                            myDired = true;
                        }
                    };
                },
                myOir: function() {
                    return {
                        templateUrl: '/my_dir.html',
                        controller: function() {
                            myOired = true;
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir my-oir></div>');
                var linkFn = $compile(el);
                $rootScope.$apply();
                linkFn($rootScope);
                requests[0].respond(200, {}, '<div ></div>');

                expect(myDired).toBe(true);
                expect(myOired).toBe(true);
            });
        });

    });


    describe('嵌入式模板', function() {

        it('移除指令元素的子元素', function() {
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        transclude: true
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div my-dir><div>must go</div></div>');
                $compile(el);
                expect(el.is(':empty')).toBe(true);
            });
        });

        it('编译子元素', function() {
            var insideSpy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        transclude: true
                    };
                },
                myOir: function() {
                    return {
                        compile: insideSpy
                    };
                }
            });
            injector.invoke(function($compile) {
                var el = $('<div my-dir><div my-oir>must go</div></div>');
                $compile(el);
                expect(insideSpy).toHaveBeenCalled();
            });
        });

        it('将transclude内容传入link函数', function() {
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        transclude: true,
                        template: '<div in-template></div>',
                        link: function(scope, element, attrs, ctrl, transclude) {
                            element.find('[in-template]').append(transclude());
                        }
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir><div in-transcluder></div></div>');
                $compile(el)($rootScope);
                expect(el.find('>[in-template]>[in-transcluder]').length).toBe(1);
            });
        });

        it('1个元素只允许1个transclude', function() {

            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        transclude: true
                    };
                },
                myOir: function() {
                    return {
                        transclude: true
                    };
                }
            });

            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir my-oir><div></div></div>');
                expect(function() {
                    $compile(el);
                }).toThrow();
            });

        });


        it('嵌入模板的指令的链接函数接收合适的scope', function() {
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        transclude: true,
                        link: function(scope, element, attrs, ctrl, transclude) {
                            element.append(transclude());
                        }
                    };
                },
                myOir: function() {
                    return {
                        link: function(scope, element) {
                            element.html(scope.anAttr);
                        }
                    };
                }
            });


            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir ><div my-oir></div></div>');
                $rootScope.anAttr = 'hello from root';
                $compile(el)($rootScope);
                expect(el.find('>[my-oir]').html()).toBe('hello from root');
            });
        });

        it('嵌入模板与父元素继承的scope隔绝', function() {
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        transclude: true,
                        scope: true,
                        link: function(scope, element, attrs, ctrl, transclude) {
                            scope.anAttr = 'attr';
                            element.append(transclude());
                        }
                    };
                },
                myOir: function() {
                    return {
                        link: function(scope, element) {
                            element.html(scope.anAttr);
                        }
                    };
                }
            });


            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir ><div my-oir></div></div>');
                $rootScope.anAttr = 'hello from root';
                $compile(el)($rootScope);
                expect(el.find('>[my-oir]').html()).toBe('hello from root');
            });


        });

        it('当父元素的scope销毁时,嵌入模板的scope需要解除watcher', function() {
            var watchSpy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        transclude: true,
                        scope: true,
                        link: function(scope, element, attrs, ctrl, transclude) {
                            element.append(transclude());
                            scope.$on('destroyNow', function() {
                                scope.$destroy();
                            });

                        }
                    };
                },
                myOir: function() {
                    return {
                        link: function(scope, element) {
                            scope.$watch(watchSpy);
                        }
                    };
                }
            });


            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir ><div my-oir></div></div>');
                $compile(el)($rootScope);
                $rootScope.$apply();
                $rootScope.$apply();
                expect(watchSpy.calls.count()).toBe(2);
                $rootScope.$apply();
                expect(watchSpy.calls.count()).toBe(3);
                $rootScope.$broadcast('destroyNow');
                $rootScope.$apply();
                expect(watchSpy.calls.count()).toBe(3);
            });


        });


        it('允许给嵌入模板传入其他scope', function() {
            var watchSpy = jasmine.createSpy();
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        transclude: true,
                        scope: true,
                        template: "<div></div>",
                        link: function(scope, element, attrs, ctrl, transclude) {
                            var myScope = scope.$new(true);
                            myScope.specialAttr = 42;
                            transclude(myScope);
                        }
                    };
                },
                myOir: function() {
                    return {
                        link: watchSpy
                    };
                }
            });


            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir ><div my-oir></div></div>');
                $compile(el)($rootScope);
                var transcludedScope = watchSpy.calls.first().args[0];
                expect(transcludedScope.specialAttr).toBe(42);
            });
        });



        it('将嵌入模板放入子元素', function() {
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        transclude: true,
                        template: "<div in-template></div>"
                    };
                },
                inTemplate: function() {
                    return {
                        link: function(scope, element, attrs, ctrl, transclude) {
                            element.append(transclude());
                        }
                    };
                }
            });


            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir ><div in-transclude></div></div>');
                $compile(el)($rootScope);
                expect(el.find('>[in-template]>[in-transclude]').length).toBe(1);
            });
        });

        it('将嵌入模板放入子元素的子元素', function() {
            var injector = makeInjectorWithDirectives({
                myDir: function() {
                    return {
                        transclude: true,
                        template: "<div><div in-template></div></div>"
                    };
                },
                inTemplate: function() {
                    return {
                        link: function(scope, element, attrs, ctrl, transclude) {
                            element.append(transclude());
                        }
                    };
                }
            });


            injector.invoke(function($compile, $rootScope) {
                var el = $('<div my-dir ><div in-transclude></div></div>');
                $compile(el)($rootScope);
                expect(el.find('>div>[in-template]>[in-transclude]').length).toBe(1);
            });
        });




    });
});
