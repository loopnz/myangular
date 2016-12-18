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
    	var module=angular.module('myModule',[]);
    	module.constant('a',1);
    	module.constant('b',2);
    	var injector=createInjector(['myModule']);
    	var fn=function(one,two){
    		return one +two;
    	};
    	fn.$inject=['a','b'];
    	expect(injector.invoke(fn,undefined,{b:3})).toBe(4);
    });

});

describe('注解(annotate)', function() {
	it("返回函数的注解(return the $injtector annotation of a function)",function(){
		var injector=createInjector([]);
		var fn=function(){};
		fn.$inject=['a','b'];
		expect(injector.annotate(fn)).toEqual(['a','b']);
	});

	it('返回数组形式的函数的注解(annotate)', function() {
		var injector=createInjector([]);
		var fn=['a','b',function(){}];
		expect(injector.annotate(fn)).toEqual(['a','b']);
	});

	it('返回空数组如果没有注解以及函数参数为空', function() {
		var injector=createInjector([]);
		var fn=function(){};
		expect(injector.annotate(fn)).toEqual([]);
	});

	it('当函数没有注解时返回从函数参数解析的注解', function() {
		var injector=createInjector([]);
		var fn=function(a, b){};
		expect(injector.annotate(fn)).toEqual(['a','b']);
	});

	it('当解析函数参数时跳过注释掉的函数参数', function() {
		var injector=createInjector([]);
		var fn=function(a,/*b,*/c){};
		expect(injector.annotate(fn)).toEqual(['a','c']);
	});
	it('接上面的功能,跳过多个注释', function() {
		var injector=createInjector([]);
		var fn=function(a,/*b,*/c/*,d*/){};
		expect(injector.annotate(fn)).toEqual(['a','c']);
	});
	it('接上面的功能,跳过单行注释', function() {
		var injector=createInjector([]);
		var fn=function(a,//b,
				c
			){};
		expect(injector.annotate(fn)).toEqual(['a','c']);
	});
	it('解析被下划线包围的参数', function() {
		var injector=createInjector([]);
		var fn=function(a,_b_,c_,_d,an_argument){};
		expect(injector.annotate(fn)).toEqual(['a','b','c_','_d','an_argument']);
	});

	it('在严格模式下如果函数没有显式声明依赖,则抛出异常', function() {
		var  injector=createInjector([],true);
		var fn=function(a,b,c){};
		expect(function(){
			injecotr.annoate(fn);
		}).toThrow();
	});

	it('实例化注解过的构造函数', function() {
		var module=angular.module('myModule',[]);
		module.constant('a',1);
		module.constant('b',2);
		var injector=createInjector(['myModule']);
		function Type(one,two){
			this.result=one+two;
		}
		Type.$inject=['a','b'];

		var instance=injector.instantiate(Type);
		expect(instance.result).toBe(3);
	});

		it('实例化数组形式注解过的构造函数', function() {
		var module=angular.module('myModule',[]);
		module.constant('a',1);
		module.constant('b',2);
		var injector=createInjector(['myModule']);
		function Type(one,two){
			this.result=one+two;
		}
		var instance=injector.instantiate(['a','b',Type]);
		expect(instance.result).toBe(3);
	});

		it('实例化无注解的构造函数', function() {
		var module=angular.module('myModule',[]);
		module.constant('a',1);
		module.constant('b',2);
		var injector=createInjector(['myModule']);
		function Type(a,b){
			this.result=a+b;
		}

		var instance=injector.instantiate(Type);
		expect(instance.result).toBe(3);
	});

		it('实例化时使用构造函数的原型', function() {
			function BaseType(){}
			BaseType.prototype.getValue=_.constant(42);
			function Type(){
				this.v=this.getValue();
			}
			Type.prototype=BaseType.prototype;
			var module=angular.module('myModule',[]);
			var injector=createInjector(['myModule']);
			var instance=injector.instantiate(Type);
			expect(instance.v).toBe(42);
		});

		it('实例化时支持本地参数替代注解的参数', function() {
			var module=angular.module('myModule',[]);
			module.constant('a',1);
			module.constant('b',2);
			var injector=createInjector(['myModule']);
			function Type(a,b){
				this.result=a+b;
			}
			var instance=injector.instantiate(Type,{b:3});
			expect(instance.result).toBe(4);
		});

});

describe('provider', function() {
	
	it('使用对象的$get方法注册provider', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',{
			$get:function(){
				return 42;
			}
		});
		var injector=createInjector(['myModule']);
		expect(injector.has('a')).toBe(true);
		expect(injector.get('a')).toBe(42);

	});

	it('给$get方法注入依赖参数', function() {
		var module=angular.module('myModule',[]);
		module.constant('a',1);
		module.provider('b',{
			$get:function(a){
				return a+2;
			}
		});
		var injector=createInjector(['myModule']);
		expect(injector.get('b')).toBe(3);
	});

	it('给$get方法延迟注入参数', function() {
		var module=angular.module('myModule',[]);
		module.provider('b',{
			$get:function(a){
				return a+2;
			}
		});

		module.provider('a',{
			$get:_.constant(1)
		});
		var injector=createInjector(['myModule']);
		expect(injector.get('b')).toBe(3);

	});

	it('仅仅实例化依赖1次(单例)', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',{
			$get:function(){
				return {};
			}
		});
		var injector=createInjector(['myModule']);
		expect(injector.get('a')).toBe(injector.get('a'));
	});

	it('当产生循环依赖时抛出异常信息', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',{$get:function(b){}});
		module.provider('b',{$get:function(c){}});
		module.provider('c',{$get:function(a){}});
		var injector=createInjector(['myModule']);
		expect(function(){
			injector.get('a');
		}).toThrowError(/Circular dependency found/);
	});

	it('当实例化失败时需要清空循环依赖的标志', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',{$get:function(){
			throw 'Failing instantiation';
		}});

		var injector=createInjector(['myModule']);
		expect(function(){
			injector.get('a');
		}).toThrow('Failing instantiation');
		expect(function(){
			injector.get('a');
		}).toThrow('Failing instantiation');
	});

	it('提示循环依赖的具体信息', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',{$get:function(b){}});
		module.provider('b',{$get:function(c){}});
		module.provider('c',{$get:function(a){}});
		var injector=createInjector(['myModule']);
		expect(function(){
			injector.get('a');
		}).toThrowError('Circular dependency found:a<-c<-b<-a');
	});

	it('当参数是构造函数时实例化provider', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',function AProvider(){
			this.$get=function(){
				return 42;
			};
		});
		var injector=createInjector(['myModule']);
		expect(injector.get('a')).toBe(42);
	});

	it('将常量依赖注入到给定的provider构造函数中', function() {
		var module=angular.module('myModule',[]);
		module.constant('b',2);
		module.provider('a',function(b){
			this.$get=function(){
				return 1+b;
			};
		});
		var injector=createInjector(['myModule']);
		expect(injector.get('a')).toBe(3);
	});

	it('将其他的provider构造函数注入到provider构造函数中', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',function(){
			var value=1;
			this.setValue=function(v){
				value=v;
			};
			this.$get=function(){
				return value;
			};
		});
		module.provider('b',function(aProvider){
			aProvider.setValue(2);
			this.$get=function(){};
		});
		var injector=createInjector(['myModule']);
		expect(injector.get('a')).toBe(2);
	});
	it('不注入实例到provider的构造函数中', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',function(){
			this.$get=function(){
				return 1;
			};
		});

		module.provider('b',function(a){
			this.$get=function(){return a;};
		});
		expect(function(){
			createInjector(['myModule']);
		}).toThrow();
	});

	it('不注入provider到$get函数', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',function(){
			this.$get=function(){
				return 1;
			};
		});

		module.provider('b',function(){
			this.$get=function(aProvider){return aProvider.$get();};
		});

		var injector=createInjector(['myModule']);
		expect(function(){
			injector.get('b');
		}).toThrow();
	});

	it('不注入provider到invoke函数', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',function(){
			this.$get=function(){
				return 1;
			};
		});
		var injector=createInjector(['myModule']);

		expect(function(){
			injector.invoke(function(aProvider){});
		}).toThrow();

	});

	it('不能用get方法取providers', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',function(){
			this.$get=function(){
				return 1;
			};
		});
		var injector=createInjector(['myModule']);
		expect(function(){
			injector.get('aProvider');
		}).toThrow();
	});

	it('首先注册常量', function() {
		var module=angular.module('myModule',[]);
		module.provider('a',function(b){
			this.$get=function(){
				return b;
			};
		});

		module.constant('b',42);
		var injector=createInjector(['myModule']);
		expect(injector.get('a')).toBe(42);
	});
});
