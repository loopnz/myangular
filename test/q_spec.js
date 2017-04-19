describe('$q服务(promise)', function() {

    var $q, $$q, $rootScope;

    beforeEach(function() {
        publishExternalAPI();
        var injector = createInjector(['ng']);
        $q = injector.get('$q');
        $$q = injector.get('$$q');
        $rootScope = injector.get('$rootScope');
    });

    it('创建Deferred对象', function() {
        var d = $q.defer();
        expect(d).toBeDefined();
    });
    it('Deferred对象有promise成员变量', function() {
        var d = $q.defer();
        expect(d.promise).toBeDefined();
    });

    it('resolve Promise', function(done) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        var spy = jasmine.createSpy();
        promise.then(spy);
        deferred.resolve('a-ok');

        setTimeout(function() {
            expect(spy).toHaveBeenCalledWith('a-ok');
            done();
        }, 1);
    });

    it('当resolve在then方法之前调用也可以解决', function(done) {
        var d = $q.defer();
        d.resolve(42);
        var spy = jasmine.createSpy();
        d.promise.then(spy);

        setTimeout(function() {
            expect(spy).toHaveBeenCalledWith(42);
            done();
        }, 0);

    });

    it('resolve不立刻解决promise', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(spy);
        d.resolve(42);
        expect(spy).not.toHaveBeenCalled();
    });

    it('在下一次$digest时resolve promise', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(spy);
        d.resolve(42);
        $rootScope.$digest();
        expect(spy).toHaveBeenCalledWith(42);
    });

    it('promise只能解决一次', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(spy);
        d.resolve(42);
        d.resolve(43);
        $rootScope.$apply();
        expect(spy.calls.count()).toEqual(1);
        expect(spy).toHaveBeenCalledWith(42);
    });
    it('promise只能解决一次2', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(spy);
        d.resolve(42);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(42);
        d.resolve(43);
        $rootScope.$apply();
        expect(spy.calls.count()).toEqual(1);
    });

    it('在$digest之后添加的then函数也能解决', function() {
        var d = $q.defer();
        d.resolve(42);
        $rootScope.$apply();
        var spy = jasmine.createSpy();
        d.promise.then(spy);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(42);
    });

    it('注册多个then', function() {
        var d = $q.defer();
        var spy1 = jasmine.createSpy();
        var spy2 = jasmine.createSpy();
        d.promise.then(spy1);
        d.promise.then(spy2);
        d.resolve(42);
        $rootScope.$apply();
        expect(spy1).toHaveBeenCalledWith(42);
        expect(spy2).toHaveBeenCalledWith(42);
    });

    it('reject promise', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        var spy2 = jasmine.createSpy();
        d.promise.then(spy, spy2);
        d.reject('fail');
        $rootScope.$apply();
        expect(spy).not.toHaveBeenCalled();
        expect(spy2).toHaveBeenCalledWith('fail');
    });

    it('reject 一次', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        var spy2 = jasmine.createSpy();
        d.promise.then(spy, spy2);
        d.reject('fail');
        $rootScope.$apply();
        expect(spy2.calls.count()).toBe(1);
        d.reject('fail');
        $rootScope.$apply();
        expect(spy2.calls.count()).toBe(1);
    });

    it('reject后不能resolve promise', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        var spy2 = jasmine.createSpy();
        d.promise.then(spy, spy2);
        d.reject('fail');
        $rootScope.$apply();
        d.resolve('success');
        $rootScope.$apply();
        expect(spy).not.toHaveBeenCalled();
    });

    it('reject回调不一定存在', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        var spy2 = jasmine.createSpy();
        d.promise.then(spy);
        d.promise.then(null, spy2);
        d.reject('fail');
        $rootScope.$apply();
        expect(spy2).toHaveBeenCalledWith('fail');
    });

    it('resolve回调不一定存在', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        var spy2 = jasmine.createSpy();
        d.promise.then(spy);
        d.promise.then(null, spy2);
        d.resolve('ok');
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith('ok');
    });

    it('使用catch注册reject函数', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.catch(spy);
        d.reject('fail');
        $rootScope.$apply();
        expect(spy).toHaveBeenCalled();
    });

    it('调用finally函数', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.finally(spy);
        d.reject('fail');
        $rootScope.$apply();
        expect(spy).toHaveBeenCalled();
    });

    it('promise的链式写法(chain)', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(function(res) {
            return res + 1;
        }).then(function(res) {
            return res * 2;
        }).then(spy);

        d.resolve(20);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(42);
    });

    it('promise的链式写法(chain)不会修改最初解决的值', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(function(res) {
            return res + 1;
        }).then(function(res) {
            return res * 2;
        });
        d.promise.then(spy);

        d.resolve(20);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(20);
    });

    it('链式调用catch', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(_.noop).catch(spy);
        d.reject(20);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(20);
    });
    it('链式调用fulfill', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.catch(_.noop).then(spy);
        d.resolve(20);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(20);
    });

    it('将catch的值作为resolve的值', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.catch(function(res) {
            return 32;
        }).then(spy);
        d.reject('fail');
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(32);
    });

    it('异常处理(then回调里抛出异常)', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(function() {
            throw 'fail';
        }).catch(spy);
        d.resolve(42);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith('fail');
    });

    it('在then回调中抛出异常不会reject 当前promise', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(function() {
            throw 'fail';
        });
        d.promise.catch(spy);
        d.resolve(42);
        $rootScope.$apply();
        expect(spy).not.toHaveBeenCalledWith('fail');
    });

    it('处理then回调中返回promise的情况', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(function(v) {
            var d2 = $q.defer();
            d2.resolve(v + 1);
            return d2.promise;
        }).then(function(v) {
            return v * 2;
        }).then(spy);

        d.resolve(20);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(42);
    });

    it('如果resolve的参数是promise,等待该promise有结果后再resolve', function() {
        var spy = jasmine.createSpy();
        var d = $q.defer();
        var d2 = $q.defer();
        d.promise.then(spy);
        d2.resolve(42);
        d.resolve(d2.promise);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(42);
    });

    it('catch回调catch then回调中返回的promise 的reject', function() {

        var spy = jasmine.createSpy();
        var d = $q.defer();

        d.promise.then(function() {
            var d2 = $q.defer();
            d2.reject('fail');
            return d2.promise;
        }).catch(spy);
        d.resolve(42);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith('fail');
    });

    it('链式调用的finally的回调的值会被忽略(finally后是then)', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(function(result) {
            return result + 1;
        }).finally(function(result) {
            return result + 2;
        }).then(spy);
        d.resolve(20);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(21);

    });
    it('链式调用的finally的回调的值会被忽略(finally后是catch)', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        d.promise.then(function(result) {
            throw 'fail';
        }).finally(function(result) {

        }).catch(spy);
        d.resolve(20);
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith("fail");

    });

    it('在finally回调中返回promise,此promise未解决后面所有的then不执行,解决后后面的then用原始值解决', function() {
        var d = $q.defer();
        var spy = jasmine.createSpy();
        var resolveNested;
        d.promise.then(function(result) {
            return result + 1;
        }).finally(function(result) {
            var d2 = $q.defer();
            resolveNested = function() {
                d2.resolve('abc');
            };
            return d2.promise;
        }).then(spy);
        d.resolve(20);
        $rootScope.$apply();
        expect(spy).not.toHaveBeenCalled();
        resolveNested();
        $rootScope.$apply();
        expect(spy).toHaveBeenCalledWith(21);
    });

    it('报告进程', function() {
        var d = $q.defer();
        var progressSpy = jasmine.createSpy();
        d.promise.then(null, null, progressSpy);
        d.notify('working');
        $rootScope.$apply();
        expect(progressSpy).toHaveBeenCalledWith('working');
    });

    it('可以报告多次进程', function() {
        var d = $q.defer();
        var progressSpy = jasmine.createSpy();
        d.promise.then(null, null, progressSpy);
        d.notify('40%');
        $rootScope.$apply();
        d.notify('60%');
        d.notify('80%');
        $rootScope.$apply();
        expect(progressSpy.calls.count()).toBe(3);
    });

    it('promise解决后不报告进程', function() {
        var d = $q.defer();
        var progressSpy = jasmine.createSpy();
        d.promise.then(null, null, progressSpy);
        d.resolve('ok');
        d.notify('working');
        $rootScope.$apply();
        expect(progressSpy).not.toHaveBeenCalled();
    });


    it('promise拒绝后不报告进程', function() {
        var d = $q.defer();
        var progressSpy = jasmine.createSpy();
        d.promise.then(null, null, progressSpy);
        d.reject('ok');
        d.notify('working');
        $rootScope.$apply();
        expect(progressSpy).not.toHaveBeenCalled();
    });

    it('链式调用notify', function() {
        var d = $q.defer();
        var progressSpy = jasmine.createSpy();
        d.promise.then(_.noop)
            .catch(_.noop)
            .then(null, null, progressSpy);
        d.notify('working');
        $rootScope.$apply();
        expect(progressSpy).toHaveBeenCalledWith('working');
    });

    it('链式调用notify多次', function() {
        var d = $q.defer();
        var progressSpy = jasmine.createSpy();
        d.promise.then(_.noop)
            .then(null, null, function(progress) {
                return '***' + progress + '***';
            })
            .catch(_.noop)
            .then(null, null, progressSpy);

        d.notify('working');
        $rootScope.$apply();
        expect(progressSpy).toHaveBeenCalledWith('***working***');
    });


    it('链式调用notify多次,前一个progress抛出异常不影响下一个', function() {
        var d = $q.defer();
        var progressSpy = jasmine.createSpy();
        var fulfillSpy = jasmine.createSpy();
        d.promise.then(null, null, function(progress) {
            throw 'fail';
        });
        d.promise.then(fulfillSpy, null, progressSpy);

        d.notify('working');
        d.resolve(42);
        $rootScope.$apply();
        expect(progressSpy).toHaveBeenCalledWith('working');
        expect(fulfillSpy).toHaveBeenCalledWith(42);
    });

    it('resolve的参数是promise,此promise notify时当前promise的progress也会调用', function() {
        var d = $q.defer();
        var progressSpy = jasmine.createSpy();
        d.promise.then(null, null, progressSpy);
        var d2 = $q.defer();
        d.resolve(d2.promise);
        d2.notify('working');
        $rootScope.$apply();
        expect(progressSpy).toHaveBeenCalledWith('working');
    });


    it('在finally回调添加progress', function() {
        var d = $q.defer();
        var progressSpy = jasmine.createSpy();
        d.promise.finally(null, progressSpy);
        d.notify('working');
        $rootScope.$apply();
        expect(progressSpy).toHaveBeenCalledWith('working');
    });

    it('立刻拒绝的promise', function() {
        var fulfillSpy = jasmine.createSpy();
        var rejectedSpy = jasmine.createSpy();
        var promise = $q.reject('fail');
        promise.then(fulfillSpy, rejectedSpy);
        $rootScope.$apply();
        expect(fulfillSpy).not.toHaveBeenCalled();
        expect(rejectedSpy).toHaveBeenCalledWith('fail');
    });


    it('立刻解决的promise', function() {
        var fulfillSpy = jasmine.createSpy();
        var rejectedSpy = jasmine.createSpy();
        var promise = $q.when('ok');
        promise.then(fulfillSpy, rejectedSpy);
        $rootScope.$apply();
        expect(fulfillSpy).toHaveBeenCalledWith('ok');
        expect(rejectedSpy).not.toHaveBeenCalled();
    });

    it('立刻解决的promise包装其他种类的promise', function() {
        var fulfillSpy = jasmine.createSpy();
        var rejectedSpy = jasmine.createSpy();
        var promise = $q.when({
            then: function(handler) {
                $rootScope.$evalAsync(function() {
                    handler('ok');
                });
            }
        });
        promise.then(fulfillSpy, rejectedSpy);
        $rootScope.$apply();
        expect(fulfillSpy).toHaveBeenCalledWith('ok');
        expect(rejectedSpy).not.toHaveBeenCalled();
    });

    it('直接给when函数传递回调', function() {
        var fulfillSpy = jasmine.createSpy();
        var rejectedSpy = jasmine.createSpy();
        var progressSpy = jasmine.createSpy();
        var wrapped = $q.defer();
        var promise = $q.when(
            wrapped.promise,
            fulfillSpy,
            rejectedSpy,
            progressSpy
        );
        wrapped.notify('working');
        wrapped.resolve('ok');
        $rootScope.$apply();
        expect(fulfillSpy).toHaveBeenCalledWith('ok');
        expect(rejectedSpy).not.toHaveBeenCalled();
        expect(progressSpy).toHaveBeenCalledWith('working');
    });


    it('立刻解决的promise,使用resolve接口', function() {
        var fulfillSpy = jasmine.createSpy();
        var rejectedSpy = jasmine.createSpy();
        var promise = $q.resolve('ok');
        promise.then(fulfillSpy, rejectedSpy);
        $rootScope.$apply();
        expect(fulfillSpy).toHaveBeenCalledWith('ok');
        expect(rejectedSpy).not.toHaveBeenCalled();
    });

    describe('Deferred的all方法', function() {

        it('解决数组中全部的promise', function() {
            var promise = $q.all([$q.when(1), $q.when(2), $q.when(3)]);
            var fulfilledSpy = jasmine.createSpy();
            promise.then(fulfilledSpy);
            $rootScope.$apply();
            expect(fulfilledSpy).toHaveBeenCalledWith([1, 2, 3]);
        });

        it('解决对象中全部的promise', function() {
            var promise = $q.all({ a: $q.when(1), b: $q.when(2) });
            var fulfilledSpy = jasmine.createSpy();
            promise.then(fulfilledSpy);
            $rootScope.$apply();
            expect(fulfilledSpy).toHaveBeenCalledWith({ a: 1, b: 2 });
        });

        it('解决数组|对象中全部的promise，数组|对象为空立即解决', function() {
            var promise = $q.all({});
            var fulfilledSpy = jasmine.createSpy();
            promise.then(fulfilledSpy);
            $rootScope.$apply();
            expect(fulfilledSpy).toHaveBeenCalledWith({});

        });

        it('解决数组|对象中全部的promise，数组|对象任意1个promise reject结果为reject', function() {
            var promise = $q.all([$q.when(1), $q.when(2), $q.reject('fail')]);
            var fulfilledSpy = jasmine.createSpy();
            var rejectedSpy = jasmine.createSpy();
            promise.then(fulfilledSpy, rejectedSpy);
            $rootScope.$apply();
            expect(rejectedSpy).toHaveBeenCalledWith('fail');
        });

        it('数组中可能不全部是promise对象的情况处理', function() {
            var promise = $q.all([$q.when(1), 2, 3]);
            var fulfilledSpy = jasmine.createSpy();
            var rejectedSpy = jasmine.createSpy();
            promise.then(fulfilledSpy, rejectedSpy);
            $rootScope.$apply();
            expect(fulfilledSpy).toHaveBeenCalledWith([1, 2, 3]);
        });
    });


    describe('ES6形式的promise', function() {

        it('$q是函数', function() {
            expect($q instanceof Function).toBe(true);
        });

        it('$q返回promise', function() {
            expect($q(_.noop)).toBeDefined();
            expect($q(_.noop).then).toBeDefined();
        });

    });

    describe('不使用$digest的promise服务$$q', function() {

        beforeEach(function() {
            jasmine.clock().install();
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });


        it('deferred对象的resolve内部不使用digest', function() {
            var d = $$q.defer();
            var fulfilledSpy = jasmine.createSpy();
            d.promise.then(fulfilledSpy);
            d.resolve('ok');
            $rootScope.$apply();
            expect(fulfilledSpy).not.toHaveBeenCalled();
        });

        it('使用resolve解决', function() {
            var d = $$q.defer();
            var fulfilledSpy = jasmine.createSpy();
            d.promise.then(fulfilledSpy);
            d.resolve('ok');
            jasmine.clock().tick(1);
            expect(fulfilledSpy).toHaveBeenCalledWith('ok');
        });

        it('不执行digest', function() {
            var d = $$q.defer();
            d.promise.then(_.noop);
            d.resolve('ok');
            var watchSpy = jasmine.createSpy();
            $rootScope.$watch(watchSpy);
            jasmine.clock().tick(1);
            expect(watchSpy).not.toHaveBeenCalled();
        });



    });

});
