function Scope() {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
    this.$$asyncQueue = [];
    this.$$applyAsyncQneue = [];
    this.$$applyAsyncId = null;
    this.$$postDigestQneue = [];
    this.$$phase = null;
}

function initWatchVal() {}

Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn,
        last: initWatchVal,
        valueEq: !!valueEq
    };
    this.$$watchers.push(watcher);
    this.$$lastDirtyWatch = null;
};

Scope.prototype.$$digestOnce = function() {
    var self = this;
    var dirty = false;
    _.forEach(this.$$watchers, function(watcher) {
        var newValue = watcher.watchFn(self);
        var oldValue = watcher.last;
        if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
            self.$$lastDirtyWatch = watcher;
            dirty = true;
            watcher.last = watcher.valueEq ? _.cloneDeep(newValue) : newValue;
            watcher.listenerFn(newValue, oldValue === initWatchVal ? newValue : oldValue, self);
        } else if (watcher === self.$$lastDirtyWatch) {
            return false;
        }

    });

    return dirty;
};

Scope.prototype.$digest = function() {
    var dirty;
    var ttl = 10;
    this.$$lastDirtyWatch = null;
    this.$beginPhase('$digest');
    if (this.$$applyAsyncId) {
        clearTimeout(this.$$applyAsyncId);
        this.$$flushApplyAsync();
    }
    do {
        while (this.$$asyncQueue.length) {
            var asyncTask = this.$$asyncQueue.shift();
            asyncTask.scope.$eval(asyncTask.expression);
        }
        dirty = this.$$digestOnce();
        if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
            this.$clearPhase();
            throw "10 digest iteartions reached";
        }
    } while (dirty || this.$$asyncQueue.length);

    this.$clearPhase();
    while (this.$$postDigestQneue.length) {
        this.$$postDigestQneue.shift()();
    }
};

Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq) {
    if (valueEq) {
        return _.isEqual(newValue, oldValue);
    } else {
        return newValue === oldValue || (typeof newValue === "number" && typeof oldValue === "number" && isNaN(newValue) && isNaN(oldValue));
    }
};

Scope.prototype.$eval = function(expr, locals) {

    return expr(this, locals);
};

Scope.prototype.$apply = function(expr, locals) {
    try {
        this.$beginPhase("$apply");
        this.$eval(expr, locals);
    } finally {
        this.$clearPhase();
        this.$digest();
    }

};

Scope.prototype.$evalAsync = function(expr) {
    var self = this;
    if (!self.$$phase && !self.$$asyncQueue.length) {
        setTimeout(function() {
            if (self.$$asyncQueue.length) {
                self.$digest();
            }
        }, 0);
    }
    this.$$asyncQueue.push({
        scope: this,
        expression: expr
    });
};

Scope.prototype.$beginPhase = function(phase) {

    if (this.$$phase) {
        throw this.$$phase + 'already in process';
    }

    this.$$phase = phase;
};

Scope.prototype.$clearPhase = function() {
    this.$$phase = null;
};

Scope.prototype.$applyAsync = function(expr) {
    var self = this;
    this.$$applyAsyncQneue.push(function() {
        self.$eval(expr);
    });
    if (this.$$applyAsyncId === null) {
        this.$$applyAsyncId = setTimeout(function() {
            self.$apply(_.bind(self.$$flushApplyAsync, self));
        }, 0);
    }

};

Scope.prototype.$$flushApplyAsync = function() {
    while (this.$$applyAsyncQneue.length) {
        this.$$applyAsyncQneue.shift()();
    }
    this.$$applyAsyncId = null;
};

Scope.prototype.$$postDigest = function(fn) {

    this.$$postDigestQneue.push(fn);
};
