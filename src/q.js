function $QProivider() {



    this.$get = ['$rootScope', function($rootScope) {

        function Deferred() {
            this.promise = new Promise();
        }
        Deferred.prototype.reject = function(value) {
            if (this.promise.$$state.status) {
                return;
            }
            this.promise.$$state.status = 2;
            this.promise.$$state.value = value;
            scheduleProcessQueue(this.promise.$$state);
        };
        Deferred.prototype.resolve = function(value) {
            if (this.promise.$$state.status) {
                return;
            }
            if (value && _.isFunction(value.then)) {
                value.then(
                    _.bind(this.resolve, this),
                    _.bind(this.reject, this),
                    _.bind(this.notify, this)
                );
            } else {
                this.promise.$$state.status = 1;
                this.promise.$$state.value = value;
                scheduleProcessQueue(this.promise.$$state);
            }

        };

        Deferred.prototype.notify = function(progress) {
            var pending = this.promise.$$state.pending;
            if (pending && pending.length && !this.promise.$$state.status) {
                $rootScope.$evalAsync(function() {
                    _.forEach(pending, function(handlers) {
                        var progressBack = handlers[3];
                        var deferred = handlers[0];
                        try {
                            deferred.notify(
                                _.isFunction(progressBack) ?
                                progressBack(progress) :
                                progress
                            );
                        } catch (e) {
                            console.log(e);
                        }

                    });
                });
            }
        };


        function scheduleProcessQueue(state) {

            $rootScope.$evalAsync(function() {
                processQueue(state);
            });
        }

        function processQueue(state) {
            var pending = state.pending;
            delete state.pending;
            _.forEach(pending, function(handlers) {
                var deferred = handlers[0];
                var fn = handlers[state.status];
                try {
                    if (_.isFunction(fn)) {
                        deferred.resolve(fn(state.value));
                    } else if (state.status == 1) {
                        deferred.resolve(state.value);
                    } else {
                        deferred.reject(state.value);
                    }
                } catch (e) {
                    deferred.reject(e);
                }

            });
        }

        function defer() {
            return new Deferred();
        }



        function Promise() {
            this.$$state = {};
        }
        Promise.prototype.then = function(onFulfill, onRejected, onProgress) {
            var result = new Deferred();
            this.$$state.pending = this.$$state.pending || [];
            this.$$state.pending.push([result, onFulfill, onRejected, onProgress]);
            if (this.$$state.status > 0) {
                scheduleProcessQueue(this.$$state);
            }
            return result.promise;
        };
        Promise.prototype.catch = function(onRejected) {
            return this.then(null, onRejected);
        };

        function makePromise(value, resolved) {
            var d = new Deferred();
            if (resolved) {
                d.resolve(value);
            } else {
                d.reject(value);
            }
            return d.promise;
        }

        function handleFinallyCallback(callback, value, resolved) {
            var callbackValue = callback();
            if (callbackValue && callbackValue.then) {
                return callbackValue.then(function() {
                    return makePromise(value, resolved);
                });
            } else {
                return makePromise(value, resolved);
            }
        }

        Promise.prototype.finally = function(callback,progressBack) {
            return this.then(function(value) {
                return handleFinallyCallback(callback, value, true);
            }, function(rejection) {
                return handleFinallyCallback(callback, rejection, false);
            },progressBack);
        };

        function reject(rejection){
        	var d=defer();
        	d.reject(rejection);
        	return d.promise;
        }

        function when(value,callback,errback,progressback){
        	var d=defer();
        	d.resolve(value);
        	return d.promise.then(callback,errback,progressback);
        }

        return {
            defer: defer,
            reject:reject,
            when:when,
            resolve:when
        };
    }];
}
