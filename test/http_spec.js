describe('$http服务', function() {

    var $http, $rootScope, $q;
    var xhr, requests;

    beforeEach(function() {
        publishExternalAPI();
        var injector = createInjector(['ng']);
        $http = injector.get('$http');
        $rootScope = injector.get('$rootScope');
        $q = injector.get('$q');
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

    beforeEach(function() {
        jasmine.clock().install();
    });
    afterEach(function() {
        jasmine.clock().uninstall();
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
        $rootScope.$apply();
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
        $rootScope.$apply();
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
        $rootScope.$apply();
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
        $rootScope.$apply();
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
        $rootScope.$apply();
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
        $rootScope.$apply();
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders.Accept).toBe('text/plain');
        expect(requests[0].requestHeaders['Cache-Control']).toBe('no-cache');
    });

    it('设置默认请求头', function() {
        $http({
            url: 'http://terop.info'
        });
        $rootScope.$apply();
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders.Accept).toBe('application/json,text/plain,*/*');
    });

    it('设置post请求的默认headers(分开设置)', function() {
        $http({
            method: 'POST',
            url: 'http://terop.info',
            data: '42'
        });
        $rootScope.$apply();
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
        $rootScope.$apply();
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['Content-Type']).toBe('text/plain;charset=utf-8');

    });


    it('暴露默认配置的接口,通过provider', function() {
        var injector = createInjector(['ng', function($httpProvider) {
            $httpProvider.defaults.headers.post['Content-Type'] = 'text/plain;charset=utf-8';
        }]);
        $http = injector.get('$http');
        $rootScope = injector.get('$rootScope');
        $http({
            method: 'POST',
            url: 'http://terop.info',
            data: '42'
        });
        $rootScope.$apply();
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
        $rootScope.$apply();
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
        $rootScope.$apply();
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
        $rootScope.$apply();
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
        $rootScope.$apply();
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
        $rootScope.$apply();
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
        $rootScope.$apply();
        expect(requests[0].withCredentials).toBe(true);
    });


    it('转换请求(transform request)', function() {
        $http({
            method: 'POST',
            url: "http://ter",
            data: 42,
            transformRequest: function(data) {
                return '*' + data + '*';
            }
        });
        $rootScope.$apply();
        expect(requests[0].requestBody).toBe('*42*');

    });

    it('允许多个请求转换函数', function() {
        $http({
            method: 'POST',
            url: "http://ter",
            data: 42,
            transformRequest: [function(data) {
                return '*' + data + '*';
            }, function(data) {
                return '-' + data + '-';
            }]
        });
        $rootScope.$apply();
        expect(requests[0].requestBody).toBe('-*42*-');
    });

    it('设置默认请求转换函数', function() {
        $http.defaults.transformRequest = [function(data) {
            return "*" + data + "*";
        }];
        $http({
            method: 'POST',
            url: "http://ter",
            data: 42,
        });
        $rootScope.$apply();
        expect(requests[0].requestBody).toBe('*42*');

    });

    it('将headers传入请求转换函数', function() {
        $http.defaults.transformRequest = [function(data, headers) {
            if (headers('Content-Type') === 'text/emphasized') {
                return '*' + data + '*';
            } else {
                return data;
            }
        }];
        $http({
            method: 'POST',
            url: "http://ter",
            data: 42,
            headers: {
                'Content-Type': 'text/emphasized'
            }
        });
        $rootScope.$apply();
        expect(requests[0].requestBody).toBe('*42*');

    });

    it('设置响应转换函数', function() {
        var response;
        $http({
            method: 'POST',
            url: "http://ter",
            data: 42,
            transformResponse: function(data) {
                return '*' + data + '*';
            }
        }).then(function(r) {
            response = r;
        });
        $rootScope.$apply();
        requests[0].respond(200, { 'Content-Type': 'text/plain' }, 'Hello');
        expect(response.data).toEqual('*Hello*');
    });

    it('将响应头传递给响应转换函数', function() {
        var response;
        $http({
            method: 'POST',
            url: "http://ter",
            data: 42,
            transformResponse: function(data, headers) {
                if (headers('content-type') === 'text/decorated') {
                    return '*' + data + '*';
                } else {
                    return data;
                }
            }
        }).then(function(r) {
            response = r;
        });
        $rootScope.$apply();
        requests[0].respond(200, { 'Content-Type': 'text/decorated' }, 'Hello');
        expect(response.data).toEqual('*Hello*');
    });


    it('设置默认响应转换函数', function() {
        $http.defaults.transformResponse = [function(data) {
            return "*" + data + "*";
        }];
        var response;
        $http({
            method: 'POST',
            url: "http://ter",
            data: 42,
        }).then(function(r) {
            response = r;
        });
        $rootScope.$apply();
        requests[0].respond(200, { 'Content-Type': 'text/plain' }, 'Hello');
        expect(response.data).toBe('*Hello*');

    });

    it('错误的响应也转换', function() {
        var response;
        $http({
            method: 'POST',
            url: "http://ter",
            data: 42,
            transformResponse: function(data, headers) {
                return '*' + data + '*';
            }
        }).catch(function(r) {
            response = r;
        });
        $rootScope.$apply();
        requests[0].respond(401, { 'Content-Type': 'text/plain' }, 'Fail');
        expect(response.data).toBe('*Fail*');
    });

    it('将http响应码也传递给响应转换函数', function() {
        var response;
        $http({
            url: "http://ter",
            transformResponse: function(data, headers, status) {
                if (status === 401) {
                    return 'unauthorized';
                } else {
                    return data;
                }
            }
        }).catch(function(r) {
            response = r;
        });
        $rootScope.$apply();
        requests[0].respond(401, { 'Content-Type': 'text/plain' }, 'Fail');
        expect(response.data).toBe('unauthorized');
    });

    it('序列化请求的data(data为js 对象)', function() {
        $http({
            url: "http://ter",
            method: 'POST',
            data: { aKey: 42 }
        });
        $rootScope.$apply();
        expect(requests[0].requestBody).toEqual('{"aKey":42}');
    });
    it('序列化请求的data(data为js 数组)', function() {
        $http({
            url: "http://ter",
            method: 'POST',
            data: [1, 'two', 3]
        });
        $rootScope.$apply();
        expect(requests[0].requestBody).toEqual('[1,"two",3]');
    });

    it('序列化请求的data(如果data是blob对象,不处理)', function() {
        var blob = new Blob(['abc']);
        $http({
            url: "http://ter",
            method: 'POST',
            data: blob
        });
        $rootScope.$apply();
        expect(requests[0].requestBody).toBe(blob);
    });

    it('序列化请求的data(如果data是form对象,不处理)', function() {
        var form = new FormData();
        form.append('a', 'value');
        $http({
            url: "http://ter",
            method: 'POST',
            data: form
        });
        $rootScope.$apply();
        expect(requests[0].requestBody).toBe(form);
    });


    it('解析响应的json格式的数据', function() {

        var response;
        $http({
            method: 'GET',
            url: "http://ter"
        }).then(function(r) {
            response = r;
        });
        $rootScope.$apply();
        requests[0].respond(200, { 'Content-Type': 'application/json' }, '{"message":"hello"}');
        expect(response.data.message).toBe('hello');
    });

    it('返回格式是json格式对象,但是没有设置content-type', function() {
        var response;
        $http({
            method: 'GET',
            url: "http://ter"
        }).then(function(r) {
            response = r;
        });
        $rootScope.$apply();
        requests[0].respond(200, {}, '{"message":"hello"}');
        expect(response.data.message).toBe('hello');
    });


    it('返回格式是json格式数组,但是没有设置content-type', function() {
        var response;
        $http({
            method: 'GET',
            url: "http://ter"
        }).then(function(r) {
            response = r;
        }).catch(function(r) {
            console.log(r);
        });
        $rootScope.$apply();
        requests[0].respond(200, {}, '[1,2,4]');
        expect(response.data).toEqual([1, 2, 4]);
    });

    it('不解析插值-json形式的响应数据', function() {
        var response;
        $http({
            method: 'GET',
            url: "http://ter"
        }).then(function(r) {
            response = r;
        });
        $rootScope.$apply();
        requests[0].respond(200, {}, '{{expr}}');
        expect(response.data).toEqual('{{expr}}');

    });

    it('增加参数到url', function() {
        $http({
            url: "http://ac",
            params: {
                a: 42
            }
        });
        $rootScope.$apply();
        expect(requests[0].url).toBe('http://ac?a=42');
    });
    it('增加额外的参数到url', function() {
        $http({
            url: "http://ac?a=42",
            params: {
                b: 42
            }
        });
        $rootScope.$apply();
        expect(requests[0].url).toBe('http://ac?a=42&b=42');
    });

    it('escapse url', function() {
        $http({
            url: "http://ac",
            params: {
                '==': '&&'
            }
        });
        $rootScope.$apply();
        expect(requests[0].url).toBe('http://ac?%3D%3D=%26%26');
    });

    it('不添加null或undefined的参数', function() {
        $http({
            url: "http://ac",
            params: {
                a: null,
                b: undefined
            }
        });
        $rootScope.$apply();
        expect(requests[0].url).toBe('http://ac');
    });


    it('添加数组形式的参数', function() {
        $http({
            url: "http://ac",
            params: {
                a: [1, 2, 3],
            }
        });
        $rootScope.$apply();
        expect(requests[0].url).toBe('http://ac?a=1&a=2&a=3');
    });

    it('参数如果是js对象,序列化为json格式字符串', function() {
        $http({
            url: "http://ac",
            params: {
                a: { b: 42 },
            }
        });
        $rootScope.$apply();
        expect(requests[0].url).toBe('http://ac?a=%7B%22b%22%3A42%7D');
    });

    it('添加子参数解析器', function() {
        $http({
            url: "http://ac",
            params: {
                a: 42,
                b: 43
            },
            paramSerializer: function(params) {
                return _.map(params, function(v, k) {
                    return k + '=' + v + 'lol';
                }).join('&');
            }
        });
        $rootScope.$apply();
        expect(requests[0].url).toBe('http://ac?a=42lol&b=43lol');
    });

    it('允许通过依赖注入注入param serializer', function() {
        var injector = createInjector(['ng', function($provide) {
            $provide.factory('mySpecialSerializer', function() {

                return function(params) {
                    return _.map(params, function(v, k) {
                        return k + '=' + v + 'lol';
                    }).join("&");
                };
            });
        }]);

        injector.invoke(function($http, $rootScope) {
            $http({
                url: "http://ac",
                params: {
                    a: 42,
                    b: 43
                },
                paramSerializer: 'mySpecialSerializer'
            });
            $rootScope.$apply();
        });

        expect(requests[0].url).toBe('http://ac?a=42lol&b=43lol');

    });

    it('依赖注入默认的param serializer', function() {
        var injector = createInjector(['ng']);
        injector.invoke(function($httpParamSerializer) {
            var result = $httpParamSerializer({ a: 42, b: 43 });
            expect(result).toEqual('a=42&b=43');
        });
    });

    it('使用jquery形式的param serializer', function() {
        $http({
            url: "http://ac",
            params: {
                a: 42,
                b: 43
            },
            paramSerializer: '$httpParamSerializerJQLike'
        });
        $rootScope.$apply();
        expect(requests[0].url).toEqual('http://ac?a=42&b=43');
    });

    it('支持$http.get', function() {
        $http.get('http://a', {
            params: { q: 42 }
        });
        $rootScope.$apply();
        expect(requests[0].url).toBe('http://a?q=42');
        expect(requests[0].method).toBe('GET');
    });

    it('添加拦截器(interceptor)', function() {
        var interceptorFactorySpy = jasmine.createSpy();
        var injector = createInjector(['ng', function($httpProvider) {
            $httpProvider.interceptors.push(interceptorFactorySpy);
        }]);
        var http = injector.get('$http');
        expect(interceptorFactorySpy).toHaveBeenCalled();
    });

    it('给拦截器注入依赖', function() {
        var interceptorFactorySpy = jasmine.createSpy();
        var injector = createInjector(['ng', function($httpProvider) {
            $httpProvider.interceptors.push(['$rootScope', interceptorFactorySpy]);
        }]);
        var http = injector.get('$http');
        var $rootScope = injector.get('$rootScope');
        expect(interceptorFactorySpy).toHaveBeenCalledWith($rootScope);
    });

    it('使用普通的factory服务注册拦截器', function() {
        var spy = jasmine.createSpy().and.returnValue({});
        var injector = createInjector(['ng', function($httpProvider, $provide) {
            $provide.factory('myInterceptor', spy);
            $httpProvider.interceptors.push('myInterceptor');
        }]);
        var http = injector.get('$http');
        var $rootScope = injector.get('$rootScope');
        expect(spy).toHaveBeenCalled();
    });

    it('允许拦截请求', function() {
        var injector = createInjector(['ng', function($httpProvider, $provide) {
            $httpProvider.interceptors.push(function() {
                return {
                    request: function(config) {
                        config.params.intercepted = true;
                        return config;
                    }
                };
            });
        }]);

        var http = injector.get('$http');
        var $rootScope = injector.get('$rootScope');
        http.get('http://a', {
            params: {}
        });
        $rootScope.$apply();
        expect(requests[0].url).toBe('http://a?intercepted=true');
    });

    it('允许request拦截器返回promise', function() {
        var injector = createInjector(['ng', function($httpProvider, $provide) {
            $httpProvider.interceptors.push(function($q) {
                return {
                    request: function(config) {
                        config.params.intercepted = true;
                        return $q.when(config);
                    }
                };
            });
        }]);

        var http = injector.get('$http');
        var $rootScope = injector.get('$rootScope');
        http.get('http://a', {
            params: {}
        });
        $rootScope.$apply();
        expect(requests[0].url).toBe('http://a?intercepted=true');
    });

    it('允许添加响应拦截器', function() {
        var response;
        var injector = createInjector(['ng', function($httpProvider, $provide) {
            $httpProvider.interceptors.push(function() {
                return {
                    response: function(response) {
                        response.intercepted = true;
                        return response;
                    }
                };
            });
        }]);

        var http = injector.get('$http');
        var $rootScope = injector.get('$rootScope');
        http.get('http://a', {
            params: {}
        }).then(function(r) {
            response = r;
        });
        $rootScope.$apply();
        requests[0].respond(200, {}, 'Hello');
        expect(response.intercepted).toBe(true);
    });

    it('添加success处理函数', function() {
        var data, status, headers, config;
        $http.get('http://').success(function(d, s, h, c) {
            data = d;
            statis = s;
            headers = h;
            config = c;
        });
        $rootScope.$apply();
        requests[0].respond(200, { 'Cache-Control': 'no-cache' }, 'Hello');
        $rootScope.$apply();
        expect(data).toBe('Hello');
        expect(config.method).toBe('GET');
    });
    it('添加error处理函数', function() {
        var data, status, headers, config;
        $http.get('http://').error(function(d, s, h, c) {
            data = d;
            statis = s;
            headers = h;
            config = c;
        });
        $rootScope.$apply();
        requests[0].respond(401, { 'Cache-Control': 'no-cache' }, 'Fail');
        $rootScope.$apply();
        expect(data).toBe('Fail');
    });

    it('允许终止request', function() {
        var timeout = $q.defer();
        $http.get('http://', {
            timeout: timeout.promise
        });
        $rootScope.$apply();
        timeout.resolve();
        $rootScope.$apply();
        expect(requests[0].aborted).toBe(true);
    });

    it('允许超时后终止request', function() {
        var timeout = $q.defer();
        $http.get('http://', {
            timeout: 5000
        });
        $rootScope.$apply();
        jasmine.clock().tick(5001);
        expect(requests[0].aborted).toBe(true);
    });

    describe('查看当前有多少请求', function() {

        it('添加request', function() {
            $http.get('http://a');
            $rootScope.$apply();
            expect($http.pendingRequests).toBeDefined();
            expect($http.pendingRequests.length).toBe(1);
            expect($http.pendingRequests[0].url).toBe('http://a');
            requests[0].respond(200, {}, 'OK');
            $rootScope.$apply();
            expect($http.pendingRequests.length).toBe(0);
        });

        it('清理失败的链接', function() {
            $http.get('http://a');
            $rootScope.$apply();
            requests[0].respond(404, {}, 'Not found');
            $rootScope.$apply();
            expect($http.pendingRequests.length).toBe(0);
        });
    });

    describe('组合$applyAsync', function() {
        beforeEach(function() {
            var injector = createInjector(['ng', function($httpProvider) {
                $httpProvider.useApplyAsync(true);
            }]);
            $http = injector.get('$http');
            $rootScope = injector.get('$rootScope');
        });

        it('当开启功能是不立刻解决promise', function() {
            var resolveSpy = jasmine.createSpy();
            $http.get('http://a').then(resolveSpy);
            $rootScope.$apply();
            requests[0].respond(200, {}, 'OK');
            expect(resolveSpy).not.toHaveBeenCalled();
        });

        it('延后一段时间resolve promise ', function() {
            var resolveSpy = jasmine.createSpy();
            $http.get('http://a').then(resolveSpy);
            $rootScope.$apply();
            requests[0].respond(200, {}, 'OK');
            jasmine.clock().tick(100);
            expect(resolveSpy).toHaveBeenCalled();
        });

    });
});
