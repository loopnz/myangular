describe('控制器$controller', function() {

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

    it('实例化控制器', function() {
        var injector = createInjector(['ng']);
        var $controller = injector.get('$controller');

        function MyController() {
            this.invoked = true;
        }

        var controller = $controller(MyController);

        expect(controller).toBeDefined();
        expect(controller instanceof MyController).toBe(true);
        expect(controller.invoked).toBe(true);
    });

    it('实例化控制器,并注入依赖', function() {
        var injector = createInjector(['ng', function($provide) {
            $provide.constant('aDep', 42);
        }]);
        var $controller = injector.get('$controller');

        function MyController(aDep) {
            this.theDep = aDep;
        }

        var controller = $controller(MyController);
        expect(controller.theDep).toBe(42);
    });

    it('实例化控制器,允许使用局部对象注入', function() {
        var injector = createInjector(['ng', function($provide) {

        }]);
        var $controller = injector.get('$controller');

        function MyController(aDep) {
            this.theDep = aDep;
        }

        var controller = $controller(MyController, { aDep: 42 });
        expect(controller.theDep).toBe(42);
    });

    it('在config配置块中注册控制器', function() {
        function MyController() {

        }
        var injector = createInjector(['ng', function($controllerProvider) {
            $controllerProvider.register('MyController', MyController);
        }]);
        var $controller = injector.get('$controller');



        var controller = $controller('MyController');
        expect(controller).toBeDefined();
        expect(controller instanceof MyController).toBe(true);
    });

    it('通过模块注册控制器', function() {
        var module = angular.module('myModule', []);
        module.controller('MyController', function() {

        });
        var injector = createInjector(['ng','myModule']);
        var $controller = injector.get('$controller');
        var controller = $controller('MyController');
        expect(controller).toBeDefined();
    });





});
