function publishExternalAPI() {
    setupModuleLoader(window);
    var ngModule = angular.module('ng', []);
    ngModule.provider('$filter', $FilterProvider);
    ngModule.provider('$parse', $ParseProvider);
    ngModule.provider('$rootScope', $RootScopeProvider);
    ngModule.provider('$compile', $CompileProvider);
    ngModule.provider('$controller', $ControllerProvider);
    ngModule.provider('$q', $QProivider);
    ngModule.provider('$$q', $$QProvider);
    ngModule.provider('$http',$HttpProvider);
    ngModule.provider('$httpBackend',$HttpBackendProvider);
    ngModule.provider('$httpParamSerializer',$HttpParamSerializerProvider);
    ngModule.provider('$httpParamSerializerJQLike',$HttpParamSerializerJQLikeProvider);
    ngModule.directive('ngController', ngControllerDirective);

}
