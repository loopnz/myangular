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

    describe('指令链接linking', function() {

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
                        scope:true,
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



    });
});
