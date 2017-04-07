describe('angular API', function() {

    it('安装angular以及模块加载器', function() {
        publishExternalAPI();
        expect(window.angular).toBeDefined();
        expect(window.angular.module).toBeDefined();
    });

    it('安装ng模块', function() {
    	publishExternalAPI();
    	expect(createInjector(['ng'])).toBeDefined();
    });

    it('安装filter服务$filter', function() {
    	publishExternalAPI();
    	var injector=createInjector(['ng']);
    	expect(injector.has('$filter')).toBe(true);
    });

    it('安装parse服务', function() {
    	publishExternalAPI();
    	var injector=createInjector(['ng']);
    	expect(injector.has('$parse')).toBe(true);
    });

    it('安装$rootScope服务', function() {
        publishExternalAPI();
        var injector=createInjector(['ng']);
        expect(injector.has('$rootScope')).toBe(true);
    });

    it('安装$compile服务', function() {
        publishExternalAPI();
        var injector=createInjector(['ng']);
        expect(injector.has('$compile')).toBe(true);
    });
});
