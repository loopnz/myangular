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

});
