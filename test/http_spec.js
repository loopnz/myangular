describe('$http服务', function() {

    var $http;
    var xhr, requests;

    beforeEach(function() {
        publishExternalAPI();
        var injector = createInjector(['ng']);
        $http = injector.get('$http');
    });
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

    it('$http服务是个函数', function() {
        expect(_.isFunction($http)).toBe(true);
    });

    it('$http函数返回值是promise', function() {
        var result = $http({});
        expect(result).toBeDefined();
        expect(result.then).toBeDefined();
    });

    it('给定URL创建xmlhttprequest 请求', function() {
        $http({
            method: 'POST',
            url: 'http://www.baidu.com',
            data: 'hello'
        });
        expect(requests.length).toBe(1);
        expect(requests[0].method).toBe('POST');
        expect(requests[0].url).toBe('http://www.baidu.com');
        expect(requests[0].async).toBe(true);
        expect(requests[0].requestBody).toBe('hello');
    });

    it('当xhr收到响应结果时,解决promise', function() {
        var requestConfig = {
            method: 'GET',
            url: 'http://teropa.info'
        };
        var response;
        $http(requestConfig).then(function(r) {
            response = r;
        });

        requests[0].respond(200, {}, 'Hello');
        expect(response).toBeDefined();
        expect(response.status).toBe(200);
        expect(response.statusText).toBe('OK');
        expect(response.data).toBe('Hello');
        expect(response.config.url).toEqual('http://teropa.info');
    });

    it('当xhr收到错误的状态码reject promise', function() {

        var requestConfig = {
            method: 'GET',
            url: 'http://teropa.info'
        };
        var response;
        $http(requestConfig).then(function(r) {

        }).catch(function(r) {
            response = r;
        });

        requests[0].respond(401, {}, 'Fail');
        expect(response).toBeDefined();
        expect(response.status).toBe(401);
        expect(response.statusText).toBe('Unauthorized');
        expect(response.data).toBe('Fail');
        expect(response.config.url).toEqual('http://teropa.info');
    });

    it('当xhr错误或者被中断时 reject promise', function() {
        var requestConfig = {
            method: 'GET',
            url: 'http://teropa.info'
        };
        var response;
        $http(requestConfig).then(function(r) {

        }).catch(function(r) {
            response = r;
        });

        requests[0].onerror();
        expect(response).toBeDefined();
        expect(response.status).toBe(0);
        expect(response.data).toBe(null);
        expect(response.config.url).toEqual('http://teropa.info');

    });

    it('默认设置请求为GET请求', function() {

        var requestConfig = {
            url: 'http://teropa.info'
        };
        $http(requestConfig);
        expect(requests.length).toBe(1);
        expect(requests[0].method).toBe('GET');
    });

    it('设置请求头', function() {
        $http({
            url: 'http://terop.info',
            headers: {
                'Accept': 'text/plain',
                'Cache-Control': 'no-cache'
            }
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders.Accept).toBe('text/plain');
        expect(requests[0].requestHeaders['Cache-Control']).toBe('no-cache');
    });

    it('设置默认请求头', function() {
        $http({
            url: 'http://terop.info'
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders.Accept).toBe('application/json,text/plain,*/*');
    });

    it('设置post请求的默认headers(分开设置)', function() {
        $http({
            method: 'POST',
            url: 'http://terop.info',
            data: '42'
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['Content-Type']).toBe('application/json;charset=utf-8');
    });

    it('暴露默认配置的接口', function() {
        $http.defaults.headers.post['Content-Type'] = 'text/plain;charset=utf-8';
        $http({
            method: 'POST',
            url: 'http://terop.info',
            data: '42'
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['Content-Type']).toBe('text/plain;charset=utf-8');

    });


    it('暴露默认配置的接口,通过provider', function() {
        var injector = createInjector(['ng', function($httpProvider) {
            $httpProvider.defaults.headers.post['Content-Type'] = 'text/plain;charset=utf-8';
        }]);
        $http = injector.get('$http');
        $http({
            method: 'POST',
            url: 'http://terop.info',
            data: '42'
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['Content-Type']).toBe('text/plain;charset=utf-8');

    });

    it('请求头不区分大小写', function() {
        $http({
            method: 'POST',
            url: 'http://terop.info',
            data: '42',
            headers: {
                'content-type': 'text/plain;charset=utf-8'
            }
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['Content-Type']).toBeUndefined();

    });

    it('请求体不传递数据时,不设置content-type,设置了也忽略', function() {
        $http({
            method: 'POST',
            url: 'http://terop.info',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['Content-Type']).not.toBe('application/json;charset=utf-8');
    });

    it('支持设置默认headers为函数', function() {
        var contentSpy = jasmine.createSpy().and.returnValue('text/plain;charset=utf-8');
        $http.defaults.headers.post['Content-Type'] = contentSpy;
        var request = {
            method: 'POST',
            url: 'http://terop.info',
            data: '42'
        };
        $http(request);
        expect(contentSpy).toHaveBeenCalledWith(request);
        expect(requests[0].requestHeaders['Content-Type']).toBe('text/plain;charset=utf-8');
    });

    it('设置响应头', function() {
        var response;
        var request = {
            method: 'POST',
            url: 'http://terop.info',
            data: '42'
        };
        $http(request).then(function(r) {
            response = r;
        });
        requests[0].respond(200, { 'Content-Type': 'text/plain' }, 'Hello');
        expect(response.headers).toBeDefined();
        expect(response.headers instanceof Function).toBe(true);
        expect(response.headers('Content-Type')).toBe('text/plain');
        expect(response.headers('content-type')).toBe('text/plain');
    });

    it('设置withCredentials', function() {
        $http({
            method: 'POST',
            url: "http://ter",
            data: 42,
            withCredentials: true
        });
        expect(requests[0].withCredentials).toBe(true);
    });

    it('设置默认withCredentials', function() {
        $http.defaults.withCredentials = true;
        $http({
            method: 'POST',
            url: "http://ter",
            data: 42,
            withCredentials: true
        });
        expect(requests[0].withCredentials).toBe(true);
    });

});
