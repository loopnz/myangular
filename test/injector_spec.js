describe('injector注入器', function() {

    beforeEach(function() {
        delete window.angular;
        setupModuleLoader(window);
    });

    it('创建 injector', function() {
        var injector = createInjector([]);
        expect(injector).toBeDefined();
    });

    it('constant 是否已经被注册模块', function() {
        var module = angular.module('myModule', []);
        module.constant('aConstant', 42);
        var injector = createInjector(['myModule']);
        expect(injector.has('aConstant')).toBe(true);
    });

    it('constant 未注册模块', function() {
        var module = angular.module('myModule', []);
        var injector = createInjector(['myModule']);
        expect(injector.has('aConstant')).toBe(false);
    });

    it('不允许创建名为hasOwnProperty的常量', function() {
        var module = angular.module('myModule', []);
        module.constant('hasOwnProperty', _.constant(false));
        expect(function() {
            createInjector(['myModule']);
        }).toThrow();

    });

    it('获取注册的常量', function() {
        var module = angular.module('myModule', []);
        module.constant('aConstant', 42);
        var injector = createInjector(['myModule']);
        expect(injector.get('aConstant')).toBe(42);
    });

    it('加载多个模块', function() {
        var module1 = angular.module('myModule', []);
        var module2 = angular.module('myOtherModule', []);
        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);
        var injector = createInjector(['myModule', 'myOtherModule']);
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
    });

    it('加载模块依赖的多个模块', function() {
        var module1 = angular.module('myModule', []);
        var module2 = angular.module('myOtherModule', ['myModule']);

        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);
        var injector = createInjector(['myOtherModule']);

        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
    });

    it('模块依赖的模块同样已加载', function() {
        var module1 = angular.module('myModule', []);
        var module2 = angular.module('myOtherModule', ['myModule']);
        var module3 = angular.module('myThirdModule', ['myOtherModule']);
        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);
        module3.constant('aThirdConstant', 44);
        var injector = createInjector(['myThirdModule']);
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
        expect(injector.has('aThirdConstant')).toBe(true);
    });

    it('只加载模块一次', function() {
        angular.module('myModule', ['myOtherModule']);
        angular.module('myOtherModule', ['myModule']);
        createInjector(['myModule']);
    });

    it('将依赖注入函数,并执行函数', function() {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['myModule']);
        var fn = function(a, b) {
            return a + b;
        };
        fn.$inject = ['a', 'b'];
        expect(injector.invoke(fn)).toBe(3);

    });

    it('不接受非字符串的注入符', function() {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        var injector = createInjector(['myModule']);
        var fn = function(one, two) {
            return one + two;
        };
        fn.$inject = ['a', 2];
        expect(function() {
            injector.invoke(fn);
        }).toThrow();
    });

    it('使用本地参数重载依赖注入的参数', function() {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['myModule']);
        var fn = function(one, two) {
            return one + two;
        };
        fn.$inject = ['a', 'b'];
        expect(injector.invoke(fn, undefined, { b: 3 })).toBe(4);
    });

});

describe('注解(annotate)', function() {
    it("返回函数的注解(return the $injtector annotation of a function)", function() {
        var injector = createInjector([]);
        var fn = function() {};
        fn.$inject = ['a', 'b'];
        expect(injector.annotate(fn)).toEqual(['a', 'b']);
    });

    it('返回数组形式的函数的注解(annotate)', function() {
        var injector = createInjector([]);
        var fn = ['a', 'b', function() {}];
        expect(injector.annotate(fn)).toEqual(['a', 'b']);
    });

    it('返回空数组如果没有注解以及函数参数为空', function() {
        var injector = createInjector([]);
        var fn = function() {};
        expect(injector.annotate(fn)).toEqual([]);
    });

    it('当函数没有注解时返回从函数参数解析的注解', function() {
        var injector = createInjector([]);
        var fn = function(a, b) {};
        expect(injector.annotate(fn)).toEqual(['a', 'b']);
    });

    it('当解析函数参数时跳过注释掉的函数参数', function() {
        var injector = createInjector([]);
        var fn = function(a, /*b,*/ c) {};
        expect(injector.annotate(fn)).toEqual(['a', 'c']);
    });
    it('接上面的功能,跳过多个注释', function() {
        var injector = createInjector([]);
        var fn = function(a, /*b,*/ c /*,d*/ ) {};
        expect(injector.annotate(fn)).toEqual(['a', 'c']);
    });
    it('接上面的功能,跳过单行注释', function() {
        var injector = createInjector([]);
        var fn = function(a, //b,
            c
        ) {};
        expect(injector.annotate(fn)).toEqual(['a', 'c']);
    });
    it('解析被下划线包围的参数', function() {
        var injector = createInjector([]);
        var fn = function(a, _b_, c_, _d, an_argument) {};
        expect(injector.annotate(fn)).toEqual(['a', 'b', 'c_', '_d', 'an_argument']);
    });

    it('在严格模式下如果函数没有显式声明依赖,则抛出异常', function() {
        var injector = createInjector([], true);
        var fn = function(a, b, c) {};
        expect(function() {
            injecotr.annoate(fn);
        }).toThrow();
    });

    it('实例化注解过的构造函数', function() {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['myModule']);

        function Type(one, two) {
            this.result = one + two;
        }
        Type.$inject = ['a', 'b'];

        var instance = injector.instantiate(Type);
        expect(instance.result).toBe(3);
    });

    it('实例化数组形式注解过的构造函数', function() {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['myModule']);

        function Type(one, two) {
            this.result = one + two;
        }
        var instance = injector.instantiate(['a', 'b', Type]);
        expect(instance.result).toBe(3);
    });

    it('实例化无注解的构造函数', function() {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['myModule']);

        function Type(a, b) {
            this.result = a + b;
        }

        var instance = injector.instantiate(Type);
        expect(instance.result).toBe(3);
    });

    it('实例化时使用构造函数的原型', function() {
        function BaseType() {}
        BaseType.prototype.getValue = _.constant(42);

        function Type() {
            this.v = this.getValue();
        }
        Type.prototype = BaseType.prototype;
        var module = angular.module('myModule', []);
        var injector = createInjector(['myModule']);
        var instance = injector.instantiate(Type);
        expect(instance.v).toBe(42);
    });

    it('实例化时支持本地参数替代注解的参数', function() {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['myModule']);

        function Type(a, b) {
            this.result = a + b;
        }
        var instance = injector.instantiate(Type, { b: 3 });
        expect(instance.result).toBe(4);
    });

});

describe('provider', function() {

    it('使用对象的$get方法注册provider', function() {
        var module = angular.module('myModule', []);
        module.provider('a', {
            $get: function() {
                return 42;
            }
        });
        var injector = createInjector(['myModule']);
        expect(injector.has('a')).toBe(true);
        expect(injector.get('a')).toBe(42);

    });

    it('给$get方法注入依赖参数', function() {
        var module = angular.module('myModule', []);
        module.constant('a', 1);
        module.provider('b', {
            $get: function(a) {
                return a + 2;
            }
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('b')).toBe(3);
    });

    it('给$get方法延迟注入参数', function() {
        var module = angular.module('myModule', []);
        module.provider('b', {
            $get: function(a) {
                return a + 2;
            }
        });

        module.provider('a', {
            $get: _.constant(1)
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('b')).toBe(3);

    });

    it('仅仅实例化依赖1次(单例)', function() {
        var module = angular.module('myModule', []);
        module.provider('a', {
            $get: function() {
                return {};
            }
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(injector.get('a'));
    });

    it('当产生循环依赖时抛出异常信息', function() {
        var module = angular.module('myModule', []);
        module.provider('a', { $get: function(b) {} });
        module.provider('b', { $get: function(c) {} });
        module.provider('c', { $get: function(a) {} });
        var injector = createInjector(['myModule']);
        expect(function() {
            injector.get('a');
        }).toThrowError(/Circular dependency found/);
    });

    it('当实例化失败时需要清空循环依赖的标志', function() {
        var module = angular.module('myModule', []);
        module.provider('a', {
            $get: function() {
                throw 'Failing instantiation';
            }
        });

        var injector = createInjector(['myModule']);
        expect(function() {
            injector.get('a');
        }).toThrow('Failing instantiation');
        expect(function() {
            injector.get('a');
        }).toThrow('Failing instantiation');
    });

    it('提示循环依赖的具体信息', function() {
        var module = angular.module('myModule', []);
        module.provider('a', { $get: function(b) {} });
        module.provider('b', { $get: function(c) {} });
        module.provider('c', { $get: function(a) {} });
        var injector = createInjector(['myModule']);
        expect(function() {
            injector.get('a');
        }).toThrowError('Circular dependency found:a<-c<-b<-a');
    });

    it('当参数是构造函数时实例化provider', function() {
        var module = angular.module('myModule', []);
        module.provider('a', function AProvider() {
            this.$get = function() {
                return 42;
            };
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(42);
    });

    it('将常量依赖注入到给定的provider构造函数中', function() {
        var module = angular.module('myModule', []);
        module.constant('b', 2);
        module.provider('a', function(b) {
            this.$get = function() {
                return 1 + b;
            };
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(3);
    });

    it('将其他的provider构造函数注入到provider构造函数中', function() {
        var module = angular.module('myModule', []);
        module.provider('a', function() {
            var value = 1;
            this.setValue = function(v) {
                value = v;
            };
            this.$get = function() {
                return value;
            };
        });
        module.provider('b', function(aProvider) {
            aProvider.setValue(2);
            this.$get = function() {};
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(2);
    });
    it('不注入实例到provider的构造函数中', function() {
        var module = angular.module('myModule', []);
        module.provider('a', function() {
            this.$get = function() {
                return 1;
            };
        });

        module.provider('b', function(a) {
            this.$get = function() {
                return a;
            };
        });
        expect(function() {
            createInjector(['myModule']);
        }).toThrow();
    });

    it('不注入provider到$get函数', function() {
        var module = angular.module('myModule', []);
        module.provider('a', function() {
            this.$get = function() {
                return 1;
            };
        });

        module.provider('b', function() {
            this.$get = function(aProvider) {
                return aProvider.$get();
            };
        });

        var injector = createInjector(['myModule']);
        expect(function() {
            injector.get('b');
        }).toThrow();
    });

    it('不注入provider到invoke函数', function() {
        var module = angular.module('myModule', []);
        module.provider('a', function() {
            this.$get = function() {
                return 1;
            };
        });
        var injector = createInjector(['myModule']);

        expect(function() {
            injector.invoke(function(aProvider) {});
        }).toThrow();

    });

    it('不能用get方法取providers', function() {
        var module = angular.module('myModule', []);
        module.provider('a', function() {
            this.$get = function() {
                return 1;
            };
        });
        var injector = createInjector(['myModule']);
        expect(function() {
            injector.get('aProvider');
        }).toThrow();
    });

    it('首先注册常量', function() {
        var module = angular.module('myModule', []);
        module.provider('a', function(b) {
            this.$get = function() {
                return b;
            };
        });

        module.constant('b', 42);
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(42);
    });

    it('允许注入injector实例到$get方法', function() {
        var module = angular.module('myModule', []);
        module.constant('a', 42);
        module.provider('b', function() {
            this.$get = function($injector) {
                return $injector.get('a');
            };
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('b')).toBe(42);
    });

    it('允许注入provider构造函数的injector到provider函数', function() {
        var module = angular.module('myModule', []);
        module.provider('a', function() {
            this.value = 42;
            this.$get = function() {
                return this.value;
            };
        });
        module.provider('b', function($injector) {
            var aProvider = $injector.get('aProvider');
            this.$get = function() {
                return aProvider.value;
            };
        });

        var injector = createInjector(['myModule']);
        expect(injector.get('b')).toBe(42);
    });

    it('允许注入$provider服务到providers', function() {
        var module = angular.module('myModule', []);
        module.provider('a', function($provide) {
            $provide.constant('b', 2);
            this.$get = function(b) {
                return 1 + b;
            };
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(3);
    });

    it('不允许注入$provide 服务到$get方法', function() {
        //调用$get时不会增加新的模块了
        var module = angular.module('myModule', []);
        module.provider('a', function() {
            this.$get = function($provide) {

            };
        });
        var injector = createInjector(['myModule']);
        expect(function() {
            injector.get('a');
        }).toThrow();
    });

    it('run config 当注入器创建时', function() {
        var module = angular.module('myModule', []);
        var hasRun = false;
        module.config(function() {
            hasRun = true;
        });
        createInjector(['myModule']);
        expect(hasRun).toBe(true);
    });

    it('给config块注入$provide', function() {
        var module = angular.module('myModule', []);
        module.config(function($provide) {
            $provide.constant('a', 42);
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(42);
    });

    it('允许在providers之前注册config', function() {
        var module = angular.module('myModule', []);
        module.config(function(aProvider) {

        });
        module.provider('a', function() {
            this.$get = _.constant(42);
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(42);
    });

    it('允许config函数在创建模块期间', function() {
        var module = angular.module('myModule', [], function($provide) {

            $provide.constant('a', 42);
            var injector = createInjector(['myModule']);

            expect(injector.get('a')).toBe(42);
        });
    });

    it('注入器创建之后运行run块', function() {
        var module = angular.module('myModule', []);
        var hasRun = false;
        module.run(function() {
            hasRun = true;
        });

        var injector = createInjector(['myModule']);
        expect(hasRun).toBe(true);
    });

    it('给run块注入实例', function() {
        var module = angular.module('myModule', []);
        module.provider('a', {
            $get: function() {
                return 42;
            }
        });
        var gotA;
        module.run(function(a) {
            gotA = a;
        });
        createInjector(['myModule']);
        expect(gotA).toBe(42);
    });

    it('在run方法运行之前配置所有的模块', function() {
        var module1 = angular.module('myModule', []);
        module1.provider('a', {
            $get: _.constant(1)
        });
        module1.run(function(a, b) {
            result = a + b;
        });
        var module2 = angular.module('myOtherModule', []);
        module2.provider('b', { $get: _.constant(42) });
        createInjector(['myModule', 'myOtherModule']);
        expect(result).toBe(43);
    });
    it('运行依赖中的函数(函数作为配置块)', function() {
        var functionModule = function($provide) {
            $provide.constant('a', 42);
        };
        angular.module('myModule', [functionModule]);

        var injector = createInjector(['myModule']);

        expect(injector.get('a')).toBe(42);

    });

    it('运行依赖中的函数(使用行内方式)', function() {
        var functionModule = ['$provide', function($provide) {
            $provide.constant('a', 42);
        }];
        angular.module('myModule', [functionModule]);
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(42);
    });

    it('支持依赖函数返回值', function() {
        var result;
        var functionModule = function($provide) {
            $provide.constant('a', 42);
            return function(a) {
                result = a;
            };
        };
        angular.module('myModule', [functionModule]);
        createInjector(['myModule']);
        expect(result).toBe(42);
    });
    it('只加载函数模块一次', function() {
        var loadTimes = 0;
        var functionModule = function() {
            loadTimes++;
        };

        angular.module('myModule', [functionModule, functionModule]);
        createInjector(['myModule']);
        expect(loadTimes).toBe(1);
    });

    it('注册factory', function() {
        var module = angular.module('myModule', []);
        module.factory('a', function() {
            return 42;
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(42);
    });

    it('注册factory时注入实例', function() {
        var module = angular.module(['myModule']);
        module.factory('a', function() {
            return 1;
        });
        module.factory('b', ['a', function(a) {
            return a + 2;
        }]);

        var injector = createInjector(['myModule']);
        expect(injector.get('b')).toBe(3);
    });

    it('注册时将factory变为单例模式', function() {
        var module = angular.module(['myModule']);
        module.factory('a', function() {
            return {};
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(injector.get('a'));
    });
    it('强制factory返回值', function() {

        var module = angular.module('myModule', []);
        module.factory('a', function() {

        });
        module.factory('b', function() {
            return null;
        });

        var injector = createInjector(['myModule']);
        expect(function() {
            injector.get('a');
        }).toThrow();

        expect(injector.get('b')).toBeNull();
    });

    it('注册value', function() {
        var module = angular.module('myModule', []);
        module.value('a', 42);
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(42);
    });
    it('不允许将value注入config函数块', function() {
        var module = angular.module('myModule', []);
        module.value('a', 42);
        module.config(function(a) {

        });
        expect(function() {
            createInjector(['myModule']);
        }).toThrow();
    });

    it('允许注册值为undefined的value', function() {
        var module = angular.module('myModule', []);
        module.value('a', undefined);
        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBeUndefined();
    });

    it('允许注册service', function() {
        var module = angular.module('myModule', []);
        module.service('aService', function() {
            this.getValue = function() {
                return 42;
            };
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('aService').getValue()).toBe(42);
    });

    it('将实例注入service', function() {

        var module = angular.module('myModule', []);
        module.value('theValue', 42);
        module.service('aService', function(theValue) {
            this.getValue = function() {
                return theValue;
            };
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('aService').getValue()).toBe(42);
    });

    it('service单例', function() {
        var module = angular.module('myModule', []);
        module.service('aService', function() {

        });
        var injector = createInjector(['myModule']);
        expect(injector.get('aService')).toBe(injector.get('aService'));
    });

    it('允许使用decorator改变实例', function() {
        var module = angular.module('myModule', []);
        module.factory('aValue', function() {
            return { aKey: 42 };
        });
        module.decorator('aValue', function($delegate) {
            $delegate.decoratedKey = 43;
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('aValue').aKey).toBe(42);
        expect(injector.get('aValue').decoratedKey).toBe(43);
    });

    it('每个service或者factory都能使用多个decorator', function() {
        var module = angular.module('myModule', []);
        module.factory('aValue', function() {
            return {};
        });
        module.decorator('aValue', function($delegate) {
            $delegate.decoratedKey = 42;
        });
        module.decorator('aValue', function($delegate) {
            $delegate.otherDecoratedKey = 43;
        });
        var injector = createInjector(['myModule']);
        expect(injector.get('aValue').decoratedKey).toBe(42);
        expect(injector.get('aValue').otherDecoratedKey).toBe(43);
    });

    it('将实例注入decorator', function() {
    	var module=angular.module('myModule',[]);
    	module.factory('aValue',function(){
    		return {};
    	});
    	module.constant('a',42);
    	module.decorator('aValue',function(a,$delegate){
    		$delegate.decoratorKey=a;
    	});
    	var injector=createInjector(['myModule']);
    	expect(injector.get('aValue').decoratorKey).toBe(42);
    });
});
