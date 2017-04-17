describe('ngController控制器指令', function() {

    beforeEach(function() {
        delete window.angular;
        publishExternalAPI();
    });

    it('实例化ngController控制器(编译&链接时)', function() {
        var instantiated;

        function MyController() {
            instantiated = true;
        }

        var injector = createInjector(['ng', function($controllerProvider) {
            $controllerProvider.register('MyController', MyController);
        }]);

        injector.invoke(function($compile, $rootScope) {
            var el = $('<div ng-controller="MyController"></div>');
            $compile(el)($rootScope);
            expect(instantiated).toBe(true);
        });

    });

    it('实例化ngController控制器(编译&链接时),拥有继承的scope', function() {
        var instantiated, gotScope;

        function MyController($scope, $element, $attrs) {
            instantiated = true;
            gotScope = $scope;
        }

        var injector = createInjector(['ng', function($controllerProvider) {
            $controllerProvider.register('MyController', MyController);
        }]);

        injector.invoke(function($compile, $rootScope) {
            var el = $('<div ng-controller="MyController"></div>');
            $compile(el)($rootScope);
            expect(gotScope).not.toBe($rootScope);
            expect(gotScope.$parent).toBe($rootScope);
            expect(Object.getPrototypeOf(gotScope)).toBe($rootScope);
        });

    });

    it('实例化ngController控制器(编译&链接时),使用别名', function() {
        var instantiated, gotScope;

        function MyController($scope, $element, $attrs) {
            instantiated = true;
            gotScope = $scope;
        }

        var injector = createInjector(['ng', function($controllerProvider) {
            $controllerProvider.register('MyController', MyController);
        }]);

        injector.invoke(function($compile, $rootScope) {
            var el = $('<div ng-controller="MyController as myCtrl"></div>');
            $compile(el)($rootScope);
            expect(gotScope.hasOwnProperty("myCtrl")).toBe(true);
            expect(gotScope.myCtrl).toBeDefined();
            expect(gotScope.myCtrl instanceof MyController).toBe(true);
        });

    });


    it('允许中上下文环境中查找控制器构造函数', function() {
        var instantiated, gotScope;

        function MyController($scope, $element, $attrs) {
            instantiated = true;
            gotScope = $scope;
        }

        var injector = createInjector(['ng']);

        injector.invoke(function($compile, $rootScope) {
            var el = $('<div ng-controller="MyCtrlOnScope as myCtrl"></div>');
            $rootScope.MyCtrlOnScope=MyController;
            $compile(el)($rootScope);
            expect(gotScope.hasOwnProperty("myCtrl")).toBe(true);
            expect(gotScope.myCtrl).toBeDefined();
            expect(gotScope.myCtrl instanceof MyController).toBe(true);
        });

    });






});
