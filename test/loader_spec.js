describe('模块加载器', function() {

    beforeEach(function() {
        delete window.angular;
    });
    it('建立全局angular对象', function() {
        setupModuleLoader(window);
        expect(window.angular).toBeDefined();
    });

    it('只创建angular 1次,使用同一个angular对象', function() {
        setupModuleLoader(window);
        var ng = window.angular;
        setupModuleLoader(window);
        expect(window.angular).toBe(ng);
    });

    it('是否定义angular module函数', function() {
        setupModuleLoader(window);
        expect(window.angular.module).toBeDefined();
    });

    it('仅定义module方法1次', function() {
        setupModuleLoader(window);
        var module = window.angular.module;
        setupModuleLoader(window);
        expect(window.angular.module).toBe(module);
    });

    describe('模块(module)', function() {

        beforeEach(function() {
            setupModuleLoader(window);
        });

        it('允许注册模块', function() {
            var myModule = window.angular.module('myModule', []);
            expect(myModule).toBeDefined();
            expect(myModule.name).toEqual('myModule');
        });

        it('用相同名字注册模块时替换原来的', function() {
            var myModule = window.angular.module('myModule', []);
            var myNewModule = window.angular.module('myNewModule', []);
            expect(myNewModule).not.toBe(myModule);
        });
        it('存放模块的依赖数组', function() {
        	var myModule=window.angular.module('myModule',['myOtherModule']);
        	expect(myModule.requires).toEqual(['myOtherModule']);
        });

        it('获取注册的模块', function() {
        	var myModule=window.angular.module('myModule',[]);
        	var gotModule=window.angular.module('myModule');
        	expect(gotModule).toBeDefined();
        	expect(gotModule).toBe(myModule);
        });

        it('获取未注册的模块抛出异常', function() {
        	expect(function(){
        		window.angular.module('myModule');
        	}).toThrow();
        });

        it('不允许注册名为hasOwnProperty的模块', function() {
        	expect(function(){
        		window.angular.module('hasOwnProperty',[]);
        	}).toThrow();
        });

    });

});
