/*jshint globalstrict:true*/
/*global publishExternalAPI:false,createInjector:false*/
'use strict';
describe("Scope", function() {


    describe("digest", function() {

        var scope;

        beforeEach(function() {
            publishExternalAPI();
            var injector = createInjector(['ng']);
            scope = injector.get('$rootScope');
        });

        it("calls the listener function of a watch on first $digest", function() {
            var watchFn = function() {
                return 'wat';
            };
            var listenerFn = jasmine.createSpy();
            scope.$watch(watchFn, listenerFn);
            scope.$digest();
            expect(listenerFn).toHaveBeenCalled();
        });


        it('calls the watch function with the scope as the argument', function() {
            var watchFn = jasmine.createSpy();
            var listenerFn = function() {};
            scope.$watch(watchFn, listenerFn);
            scope.$digest();
            expect(watchFn).toHaveBeenCalledWith(scope);
        });

        it('calls the listener function when watched value changes', function() {
            scope.someValue = 'a';
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.someValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            expect(scope.counter).toBe(0);
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.someValue = 'b';
            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it('calls listener when watch value is first undefined ', function() {
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.someValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('calls listener with new value as old value the first time', function() {

            scope.someValue = 123;
            var oldValueGiven;
            scope.$watch(function(scope) {
                return scope.someValue;
            }, function(newValue, oldValue, scope) {
                oldValueGiven = oldValue;
            });
            scope.$digest();
            expect(oldValueGiven).toBe(123);
        });

        it('triggers chained watchers in the same digest', function() {
            scope.name = 'Jane';
            scope.counter = 0;
            scope.$watch(function(scope) {
                scope.counter++;
                return scope.nameUpper;
            }, function(newValue, oldValue, scope) {

                if (newValue) {
                    scope.initial = newValue.substring(0, 1) + ".";
                }
            });
            scope.$watch(function(scope) {
                return scope.name;
            }, function(newValue, oldValue, scope) {
                if (newValue) {
                    scope.nameUpper = newValue.toUpperCase();
                }
            });

            scope.$digest();
            expect(scope.initial).toBe('J.');
            scope.name = 'Bob';
            scope.$digest();
            expect(scope.initial).toBe('B.');
            expect(scope.counter).toBe(6);
        });

        it('give up on the watches after 10 iterations`', function() {
            scope.counterA = 0;
            scope.counterB = 0;
            scope.$watch(function(scope) {
                return scope.counterA;
            }, function(newValue, oldValue, scope) {
                scope.counterB++;
            });
            scope.$watch(function(scope) {
                return scope.counterB;
            }, function(newValue, oldValue, scope) {
                scope.counterA++;
            });

            expect(function() {
                scope.$digest();
            }).toThrow();
        });

        it('ends the digest when the last watch is clean', function() {
            scope.array = _.range(100);
            var watchExecutions = 0;

            _.times(100, function(i) {
                scope.$watch(function(scope) {
                    watchExecutions++;
                    return scope.array[i];
                }, function(newValue, oldValue, scope) {

                });
            });
            scope.$digest();
            expect(watchExecutions).toBe(200);
            scope.array[0] = 420;
            scope.$digest();
            expect(watchExecutions).toBe(301);
        });
        it('does not end digest so that new watches are not run', function() {
            scope.aValue = 'abc';
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.$watch(function(scope) {
                    return scope.aValue;
                }, function(newValue, oldValue, scope) {
                    scope.counter++;
                });
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('compares based on value if enabled', function() {
            scope.aValue = [1, 2, 3];
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            }, true);
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.aValue.push(4);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('correctly handles NaNs', function() {

            scope.number = 0 / 0;
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.number;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();

            expect(scope.counter).toBe(1);

            scope.$digest();

            expect(scope.counter).toBe(1);

        });

        it('executes $eval function and return result', function() {
            scope.aValue = 42;

            var result = scope.$eval(function(scope) {
                return scope.aValue;
            });
            expect(result).toBe(42);
        });

        it('passes the second $eval argument straight through', function() {
            scope.aValue = 42;
            var result = scope.$eval(function(scope, arg) {
                return scope.aValue + arg;
            }, 2);
            expect(result).toBe(44);
        });

        it('executes $apply function and starts the digest', function() {
            scope.aValue = 'someValue';
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$apply(function(scope) {
                scope.aValue = 'someOtherValue';
            });

            expect(scope.counter).toBe(2);
        });

        it('executes $evalAsync function later in the same circle', function() {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;
            scope.asyncEvaluatedImmediately = false;

            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.$evalAsync(function(scope) {
                    scope.asyncEvaluated = true;
                });
                scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
            });

            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
            expect(scope.asyncEvaluatedImmediately).toBe(false);
        });
        it('executes $evalAsync functions added by watch function', function() {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;
            scope.$watch(function(scope) {
                if (!scope.asyncEvaluated) {
                    scope.$evalAsync(function(scope) {
                        scope.asyncEvaluated = true;
                    });
                }
                return scope.aValue;
            }, function(newValue, oldValue, scope) {});

            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
        });

        it('execute $evalAsync function even when not dirty', function() {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluatedTimes = 0;
            scope.$watch(function(scope) {
                if (scope.asyncEvaluatedTimes < 2) {
                    scope.$evalAsync(function(scope) {
                        scope.asyncEvaluatedTimes++;
                    });
                }
                return scope.aValue;
            }, function(newValue, oldVlaue, scope) {});

            scope.$digest();
            expect(scope.asyncEvaluatedTimes).toBe(2);
        });

        it('eventually halts $evalAsync added by watches', function() {
            scope.aValue = [1, 2, 3];
            scope.$watch(function(scope) {
                scope.$evalAsync(function(scope) {

                });
                return scope.aValue;
            }, function() {});
            expect(function() { scope.$digest(); }).toThrow();
        });

        it('has a $$phase field whose value is the current digest phase', function() {

            scope.aValue = [1, 2, 3];
            scope.phaseInWatchFunction = undefined;
            scope.phaseInListenerFunction = undefined;
            scope.phaseInApplyFunction = undefined;

            scope.$watch(function(scope) {
                scope.phaseInWatchFunction = scope.$$phase;
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.phaseInListenerFunction = scope.$$phase;
            });

            scope.$apply(function(scope) {
                scope.phaseInApplyFunction = scope.$$phase;
            });

            expect(scope.phaseInWatchFunction).toBe("$digest");
            expect(scope.phaseInListenerFunction).toBe("$digest");
            expect(scope.phaseInApplyFunction).toBe("$apply");
        });
        it('schedules a digest in $evalAsync', function(done) {
            scope.aValue = "abc";
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$evalAsync(function(scope) {

            });

            expect(scope.counter).toBe(0);
            setTimeout(function() {
                expect(scope.counter).toBe(1);
                done();
            }, 50);
        });

        it('allows async $apply with $applyAsync', function(done) {
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$applyAsync(function(scope) {
                scope.aValue = 'abc';
            });
            expect(scope.counter).toBe(1);

            setTimeout(function() {
                expect(scope.counter).toBe(2);
                done();
            }, 50);
        });

        it('never execute $applyAsync function in the same cycle', function(done) {
            scope.aValue = [1, 2, 3];
            scope.asyncApplied = false;
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.$applyAsync(function(scope) {
                    scope.asyncApplied = true;
                });
            });

            scope.$digest();
            expect(scope.asyncApplied).toBe(false);
            setTimeout(function() {
                expect(scope.asyncApplied).toBe(true);
                done();
            }, 50);
        });

        it('coalesces many calls to $applyAsync', function(done) {
            scope.counter = 0;
            scope.$watch(function(scope) {
                scope.counter++;
                return scope.aValue;
            }, function() {

            });
            scope.$applyAsync(function(scope) {
                scope.aValue = "abc";
            });
            scope.$applyAsync(function(scope) {
                scope.aValue = "def";
            });
            setTimeout(function() {
                expect(scope.counter).toBe(2);
                done();
            }, 50);
        });

        it('cancels and flushes $applyAsync if digested first', function(done) {
            scope.counter = 0;
            scope.$watch(function(scope) {
                scope.counter++;
                return scope.aValue;
            }, function(newValue, oldValue, scope) {

            });
            scope.$applyAsync(function(scope) {
                scope.aValue = "abc";
            });
            scope.$applyAsync(function(scope) {
                scope.aValue = "def";
            });
            scope.$digest();
            expect(scope.counter).toBe(2);
            expect(scope.aValue).toEqual("def");
            setTimeout(function() {
                expect(scope.counter).toBe(2);
                done();
            }, 50);
        });

        it('runs a $$postDigest function after each digest', function() {
            scope.counter = 0;
            scope.$$postDigest(function() {
                scope.counter++;
            });
            expect(scope.counter).toBe(0);
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('does not include $$postDigest in the digest', function() {
            scope.aValue = 'origin value';
            scope.$$postDigest(function() {
                scope.aValue = 'changed value';
            });
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.watchedValue = newValue;
            });
            scope.$digest();
            expect(scope.watchedValue).toBe('origin value');
            scope.$digest();
            expect(scope.watchedValue).toBe('changed value');
        });

        it('catches exception in watch functions and continues', function() {
            scope.aValue = 'abc';
            scope.counter = 0;
            scope.$watch(function(scope) {
                throw "error";
            }, function() {});
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('catches exception in listen functions and continues', function() {
            scope.aValue = 'abc';
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function() {
                throw 'Error';
            });

            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('catches exception in $evalAsync', function(done) {
            scope.aValue = 'abc';
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$evalAsync(function(scope) {
                throw 'error';
            });

            setTimeout(function() {
                expect(scope.counter).toBe(1);
                done();
            }, 50);
        });

        it('catches exception in $applyAsync', function(done) {
            scope.$applyAsync(function(scope) {
                throw 'Error';
            });
            scope.$applyAsync(function(scope) {
                throw 'error';
            });

            scope.$applyAsync(function(scope) {
                scope.applied = true;
            });
            setTimeout(function() {
                expect(scope.applied).toBe(true);
                done();
            }, 50);

        });

        it('catches exception in $$postDigest function', function() {
            var didRun = false;
            scope.$$postDigest(function() {
                throw 'error';
            });
            scope.$$postDigest(function() {
                didRun = true;
            });
            scope.$digest();

            expect(didRun).toBe(true);
        });

        it('allow destorying a $watch with a removeal function', function() {
            scope.aValue = 'abc';
            scope.counter = 0;
            var destoryWatch = scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.aValue = 'def';
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.aValue = 'ghi';
            destoryWatch();
            scope.$digest();
            expect(scope.counter).toBe(2);

        });

        it('allows destorying a $watch during digest', function() {
            scope.aValue = 'abc';
            var watchCalls = [];
            scope.$watch(function(scope) {
                watchCalls.push('first');
                return scope.aValue;
            }, function() {});

            var destoryWatch = scope.$watch(function(scope) {
                watchCalls.push('second');
                destoryWatch();
            }, function() {

            });

            scope.$watch(function(scope) {
                watchCalls.push('third');
                return scope.aValue;
            });

            scope.$digest();

            expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third']);


        });

        it('allows a $watch to destory another during digest', function() {
            scope.aValue = 'abc';
            scope.counter = 0;
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                destoryWatch();
            });

            var destoryWatch = scope.$watch(function(scope) {});
            scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('allows destorying several $watches during digest', function() {

            scope.aValue = 'abc';
            scope.counter = 0;
            var destoryWatch1 = scope.$watch(function(scope) {
                destoryWatch1();
                destoryWatch2();
            });
            var destoryWatch2 = scope.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(0);
        });

        it('接收表达式形式的参数', function() {
            var theValue;
            scope.aValue = 42;
            scope.$watch('aValue', function(newValue, oldValue) {
                theValue = newValue;
            });
            scope.$digest();
            expect(theValue).toBe(42);
        });

        it('$watchCollection接收表达式形式的参数', function() {
            var theValue;
            scope.arr = [1, 2, 3];
            scope.$watchCollection('arr', function(newValue, oldValue, scope) {
                theValue = newValue;
            });

            scope.$digest();
            expect(theValue).toEqual([1, 2, 3]);
        });

        it('$eval方法接收表达式', function() {
            scope.name = 42;
            expect(scope.$eval('name')).toBe(42);
        });

        it('$apply方法接收表达式', function() {
            scope.aFunction = _.constant(42);
            expect(scope.$apply('aFunction()')).toBe(42);
        });
        it('$evalAsync方法接收表达式', function(done) {
            var called;
            scope.a = function() {
                called = true;
            };
            scope.$evalAsync('a()');
            scope.$$postDigest(function() {
                expect(called).toBe(true);
                done();
            });

        });
    });

    describe('$watchGroup', function() {
        var scope;
        beforeEach(function() {
            publishExternalAPI();
            var injector = createInjector(['ng']);
            scope = injector.get('$rootScope');
        });


        it('takes watches as an array and calls listener with arrays', function() {
            var gotNewValues, gotOldValues;
            scope.aValue = 1;
            scope.anOtherValue = 2;
            scope.$watchGroup([function(scope) {
                return scope.aValue;
            }, function(scope) {
                return scope.anOtherValue;
            }], function(newValues, oldValues, scope) {
                gotNewValues = newValues;
                gotOldValues = oldValues;
            });

            scope.$digest();
            expect(gotNewValues).toEqual([1, 2]);
            expect(gotOldValues).toEqual([1, 2]);
        });

        it('only calls listener once per digest', function() {

            var counter = 0;
            scope.aValue = 1;
            scope.anOtherValue = 2;
            scope.$watchGroup([function(scope) {
                return scope.aValue;
            }, function(scope) {
                return scope.anOtherValue;
            }], function(newValues, oldValues, scope) {
                counter++;
            });

            scope.$digest();
            expect(counter).toBe(1);
        });

        it('uses the same array of old and new values on first run', function() {
            var gotNewValues, getOldValues;

            scope.aValue = 1;
            scope.anOtherValue = 2;
            scope.$watchGroup([function(scope) {
                return scope.aValue;
            }, function() {
                return scope.anOtherValue;
            }], function(newValues, oldValues, scope) {
                gotNewValues = newValues;
                getOldValues = oldValues;
            });

            scope.$digest();

            expect(gotNewValues).toEqual(getOldValues);
        });

        it('calls the listener once when the watch array is empty', function() {
            var gotNewValues, gotOldValues;

            scope.$watchGroup([], function(newValues, oldValues) {
                gotNewValues = newValues;
                gotOldValues = oldValues;
            });
            scope.$digest();
            expect(gotNewValues).toEqual([]);
            expect(gotOldValues).toEqual([]);
        });

        it('can be deregistered', function() {
            var counter = 0;
            scope.aValue = 1;
            scope.anotherValue = 2;
            var destoryGroup = scope.$watchGroup([function(scope) {
                return scope.aValue;
            }, function(scope) {
                return scope.anotherValue;
            }], function(newValues, oldValues, scope) {
                counter++;
            });

            scope.$digest();
            scope.anotherValue = 3;
            destoryGroup();
            scope.$digest();
            expect(counter).toEqual(1);

        });

        it('does not call the zero-watch listener when deregistered first', function() {
            var counter = 0;

            var destoryGroup = scope.$watchGroup([], function() {
                counter++;
            });

            destoryGroup();
            scope.$digest();
            expect(counter).toEqual(0);
        });
    });

    describe('inheritance', function() {
        var parent;

        beforeEach(function() {
            publishExternalAPI();
            var injector = createInjector(['ng']);
            parent = injector.get('$rootScope');
        });


        it('inherits the parent properties', function() {
            parent.aValue = [1, 2, 3];
            var child = parent.$new();
            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it('does not cause a parent to inherit its properties', function() {
            var child = parent.$new();
            child.aValue = [1, 2, 3];
            expect(parent.aValue).toBeUndefined();
        });

        it('inherits the parent properties whenevet they are defined ', function() {
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            expect(child.aValue).toEqual([1, 2, 3]);

        });

        it('can manipulate a parent socpe property ', function() {
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            child.aValue.push(4);
            expect(child.aValue).toEqual([1, 2, 3, 4]);
            expect(parent.aValue).toEqual([1, 2, 3, 4]);
        });

        it('can watch a property in the parent', function() {
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            child.counter = 0;
            child.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            }, true);
            child.$digest();
            expect(child.counter).toBe(1);
            parent.aValue.push(4);
            child.$digest();
            expect(child.counter).toBe(2);

        });

        it('can be nested at any depth', function() {
            var a = parent;
            var aa = a.$new();
            var aaa = aa.$new();
            var aab = aa.$new();
            var ab = a.$new();
            var abb = ab.$new();
            a.value = 1;
            expect(aa.value).toBe(1);
            expect(aaa.value).toBe(1);
            expect(aab.value).toBe(1);
            expect(ab.value).toBe(1);
            expect(abb.value).toBe(1);
            ab.anotherValue = 2;
            expect(abb.anotherValue).toBe(2);
            expect(aa.anotherValue).toBeUndefined();
            expect(aaa.anotherValue).toBeUndefined();
        });

        it('shadows a parent property with the same name', function() {
            var child = parent.$new();
            parent.name = 'joe';
            child.name = 'jill';
            expect(parent.name).toBe('joe');
            expect(child.name).toBe('jill');
        });
        it('does not shadow members of parent scope attributes', function() {
            var child = parent.$new();
            parent.user = { name: 'joe' };
            child.user.name = 'jill';
            expect(parent.user.name).toBe('jill');
            expect(child.user.name).toBe('jill');
        });

        it('does not digest its parents', function() {
            var child = parent.$new();
            parent.aValue = 'abc';
            parent.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.aValueWas = newValue;
            });

            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it('keeps a record of its children', function() {
            var child1 = parent.$new();
            var child2 = parent.$new();
            var child2_1 = child2.$new();

            expect(parent.$$children.length).toBe(2);
            expect(parent.$$children[0]).toBe(child1);
            expect(parent.$$children[1]).toBe(child2);
            expect(child1.$$children.length).toBe(0);
            expect(child2.$$children.length).toBe(1);
            expect(child2.$$children[0]).toBe(child2_1);
        });

        it('digests its children', function() {
            var child = parent.$new();
            parent.aValue = 'abc';
            child.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.aValueWas = newValue;
            });

            parent.$digest();
            expect(child.aValueWas).toBe('abc');

        });

        it('deigests from root on $apply', function() {
            var child = parent.$new();
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            child2.$apply(function(scope) {

            });

            expect(parent.counter).toBe(1);

        });


        it('schedules a digest from root on $evalAsync', function(done) {
            var child = parent.$new();
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;

            parent.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            child2.$evalAsync(function() {});

            setTimeout(function() {
                expect(parent.counter).toBe(1);
                done();
            }, 50);

        });

        it('does not have access to parent attributes when isolated', function() {
            var child = parent.$new(true);

            parent.aValue = 'abc';

            expect(child.aValue).toBeUndefined();

        });

        it('cannot watch parent attributes when ioslated', function() {
            var child = parent.$new(true);
            parent.aValue = 'abc';
            child.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.aValueWas = newValue;
            });

            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it('digests its isolated children', function() {
            var child = parent.$new(true);
            child.aValue = 'abc';
            child.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.aValueWas = newValue;
            });

            parent.$digest();
            expect(child.aValueWas).toBe('abc');
        });

        it('digests from root on $apply when isolated', function() {
            var child = parent.$new(true);
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            child2.$apply(function() {});

            expect(parent.counter).toBe(1);

        });

        it('schedules a digest from root on $evalAsync when isolated', function(done) {
            var child = parent.$new(true);
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            child2.$evalAsync(function() {});

            setTimeout(function() {
                expect(parent.counter).toBe(1);
                done();
            }, 50);
        });

        it('执行 $evalAsync 在 isolated scope内', function(done) {
            var child = parent.$new(true);
            child.$evalAsync(function(scope) {
                scope.didEvalAsync = true;
            });

            setTimeout(function() {
                expect(child.didEvalAsync).toBe(true);
                done();
            }, 50);

        });

        it('执行$$postDigest 在isolated scope内', function() {
            var child = parent.$new(true);
            child.$$postDigest(function(scope) {
                child.didPostDigest = true;
            });

            parent.$digest();
            expect(child.didPostDigest).toBe(true);


        });

        it('创建子scope时使用指定的父级scope', function() {
            var prototypeParent = parent.$new();
            var hierarchyParent = parent.$new();
            var child = prototypeParent.$new(false, hierarchyParent);

            prototypeParent.a = 42;
            expect(child.a).toBe(42);

            child.counter = 0;
            child.$watch(function(scope) {
                scope.counter++;
            });
            prototypeParent.$digest();
            expect(child.counter).toBe(0);

            hierarchyParent.$digest();
            expect(child.counter).toBe(1);
        });

        it('使用$destroy方法销毁scope', function() {
            var child = parent.$new();
            child.aValue = [1, 2, 3];
            child.counter = 0;
            child.$watch(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            }, true);
            parent.$digest();
            expect(child.counter).toBe(1);
            child.aValue.push(4);
            parent.$digest();
            expect(child.counter).toBe(2);

            child.$destroy();

            child.aValue.push(5);
            parent.$digest();
            expect(child.counter).toBe(2);

        });
    });


    describe('$watchCollection', function() {
        var scope;

        beforeEach(function() {
            publishExternalAPI();
            var injector = createInjector(['ng']);
            scope = injector.get('$rootScope');
        });

        it('$watchCollection监测非对象和非数组', function() {
            var value;
            scope.aValue = 42;
            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                value = newValue;
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
            expect(value).toBe(scope.aValue);
            scope.aValue = 43;
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.$digest();
            expect(scope.counter).toBe(2);

        });

        it('值比较的时候处理NaN', function() {
            scope.aValue = 0 / 0;
            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('当值变为数组时(新加个数组)', function() {
            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.aValue = [1, 2, 3];
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('数组添加元素', function() {
            scope.arr = [1, 2, 3];
            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.arr;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arr.push(4);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('数组移除元素', function() {
            scope.arr = [1, 2, 3];
            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.arr;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arr.shift();
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('数组替换元素', function() {
            scope.arr = [1, 2, 3];
            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.arr;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arr[1] = 42;
            scope.$digest();
            expect(scope.counter).toBe(2);
        });


        it('数组重新排列顺序', function() {
            scope.arr = [2, 1, 3];
            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.arr;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arr.sort();
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('处理数组中的NaN', function() {
            scope.arr = [2, NaN, 3];
            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.arr;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('array like对象的处理,比如arguments中的元素替换', function() {
            (function() {
                scope.arrayLike = arguments;
            })(1, 2, 3);
            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.arrayLike;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.arrayLike[1] = 42;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);

        });

        it('arrayLike对象的处理,比如nodeList的元素替换', function() {

            document.documentElement.appendChild(document.createElement('div'));
            scope.arrayLike = document.getElementsByTagName('div');

            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.arrayLike;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
            document.documentElement.appendChild(document.createElement('div'));
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('当值变为对象时(新加对象)', function() {
            scope.counter = 0;
            scope.$watchCollection(function(scope) {
                return scope.obj;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.obj = { a: 1 };
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);

        });

        it('当对象添加属性时', function() {

            scope.counter = 0;
            scope.obj = { a: 1 };
            scope.$watchCollection(function(scope) {
                return scope.obj;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            scope.obj.b = 2;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('当对象属性的值变化时', function() {

            scope.counter = 0;
            scope.obj = { a: 1 };
            scope.$watchCollection(function(scope) {
                return scope.obj;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });

            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.obj.a = 2;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('处理对象的属性的值为NaN', function() {
            scope.counter = 0;
            scope.obj = { a: NaN };
            scope.$watchCollection(function(scope) {
                return scope.obj;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('当删除对象属性时', function() {
            scope.counter = 0;
            scope.obj = { a: 1 };
            scope.$watchCollection(function(scope) {
                return scope.obj;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
            delete scope.obj.a;
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('处理含有length属性的对象', function() {
            scope.counter = 0;
            scope.obj = { length: 1, name: 'tom' };
            scope.$watchCollection(function(scope) {
                return scope.obj;
            }, function(newValue, oldValue, scope) {
                scope.counter++;
            });
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.obj.newKey = 'def';
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('将变化前的非对象的值传给listener函数', function() {
            scope.aValue = 42;
            var oldValueGiven;
            scope.$watchCollection(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                oldValueGiven = oldValue;
            });
            scope.$digest();
            scope.aValue = 43;
            scope.$digest();
            expect(oldValueGiven).toBe(42);
        });

        it('将变化前的array传给listener函数', function() {
            scope.aValue = [1, 2, 3];
            var oldValueGiven;
            scope.$watchCollection(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                oldValueGiven = oldValue;
            });
            scope.$digest();
            expect(oldValueGiven).toEqual([1, 2, 3]);
            scope.aValue.push(4);
            scope.$digest();
            expect(oldValueGiven).toEqual([1, 2, 3]);
        });

        it('将变化前的object传给listener函数', function() {
            scope.aValue = { a: 1, b: 2 };
            var oldValueGiven;
            scope.$watchCollection(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                oldValueGiven = oldValue;
            });
            scope.$digest();
            expect(oldValueGiven).toEqual({ a: 1, b: 2 });
            scope.aValue.c = 3;
            scope.$digest();
            expect(oldValueGiven).toEqual({ a: 1, b: 2 });
        });

        it('第一次digest的时候使用newValue', function() {
            scope.aValue = { a: 1, b: 2 };
            var oldValueGiven;
            scope.$watchCollection(function(scope) {
                return scope.aValue;
            }, function(newValue, oldValue, scope) {
                oldValueGiven = oldValue;
            });
            scope.$digest();
            expect(oldValueGiven).toEqual({ a: 1, b: 2 });
        });


    });

    describe('Events', function() {
        var parent;
        var scope;
        var child;
        var isolatedChild;
        beforeEach(function() {
            publishExternalAPI();
            var injector = createInjector(['ng']);
            parent = injector.get('$rootScope');
            scope = parent.$new();
            child = scope.$new();
            isolatedChild = scope.$new(true);
        });

        it('注册事件', function() {
            var listener1 = function() {};
            var listener2 = function() {};
            var listener3 = function() {};
            scope.$on("one", listener1);
            scope.$on("one", listener2);
            scope.$on("two", listener3);
            expect(scope.$$listeners).toEqual({
                "one": [listener1, listener2],
                "two": [listener3]
            });
        });

        it('给不同的scope不同的$$listeners', function() {
            var listener1 = function() {};
            var listener2 = function() {};
            var listener3 = function() {};
            scope.$on("one", listener1);
            child.$on("one", listener2);
            isolatedChild.$on("one", listener3);
            expect(scope.$$listeners).toEqual({ one: [listener1] });
            expect(child.$$listeners).toEqual({ one: [listener2] });
            expect(isolatedChild.$$listeners).toEqual({ one: [listener3] });
        });

        _.forEach(['$emit', '$broadcast'], function(method) {
            it('使用' + method + '触发事件', function() {
                var listener1 = jasmine.createSpy();
                var listener2 = jasmine.createSpy();
                scope.$on('one', listener1);
                scope.$on('two', listener2);
                scope[method]('one');
                expect(listener1).toHaveBeenCalled();
                expect(listener2).not.toHaveBeenCalled();
            });
            it('使用' + method + '触发事件是时传入event对象', function() {

                var listener = jasmine.createSpy();
                scope.$on("one", listener);
                scope[method]("one");
                expect(listener).toHaveBeenCalled();
                expect(listener.calls.mostRecent().args[0].name).toEqual("one");
            });

            it('使用' + method + '触发时需要使传递给监听函数的event对象是相同的', function() {
                var listener1 = jasmine.createSpy();
                var listener2 = jasmine.createSpy();
                scope.$on("one", listener1);
                scope.$on("one", listener2);
                scope[method]('one');
                var event1 = listener1.calls.mostRecent().args[0];
                var event2 = listener2.calls.mostRecent().args[0];
                expect(event1).toBe(event2);
            });


            it('使用' + method + '触发时需要给监听函数传递参数', function() {
                var listener1 = jasmine.createSpy();
                scope.$on("one", listener1);
                scope[method]('one', 'and', ['add', 'arguments'], '...');
                expect(listener1.calls.mostRecent().args[1]).toEqual('and');
                expect(listener1.calls.mostRecent().args[2]).toEqual(['add', 'arguments']);
                expect(listener1.calls.mostRecent().args[3]).toEqual("...");
            });

            it(method + '方法返回event对象', function() {
                var returnedEvent = scope[method]('one');
                expect(returnedEvent).toBeDefined();
                expect(returnedEvent.name).toEqual('one');
            });

            it('解除绑定事件' + method, function() {
                var listener = jasmine.createSpy();
                var de = scope.$on('one', listener);
                de();
                scope[method]('one');
                expect(listener).not.toHaveBeenCalled();
            });

            it('当移除监听函数时不会跳过下一个监听函数' + method, function() {
                var de;
                var listener = function() {
                    de();
                };
                var listener2 = jasmine.createSpy();
                de = scope.$on('one', listener);
                scope.$on('one', listener2);
                scope[method]('one');
                expect(listener2).toHaveBeenCalled();
            });
        });

        it('使用$emit方法触发事件时向上传播事件', function() {
            var parentL = jasmine.createSpy();
            var scopeL = jasmine.createSpy();
            parent.$on('one', parentL);
            scope.$on('one', scopeL);
            scope.$emit('one');
            expect(parentL).toHaveBeenCalled();
            expect(scopeL).toHaveBeenCalled();
        });


        it('使用$emit方法触发事件时向上传播事件时传递相同的event', function() {
            var parentL = jasmine.createSpy();
            var scopeL = jasmine.createSpy();
            parent.$on('one', parentL);
            scope.$on('one', scopeL);
            scope.$emit('one');
            var event1 = parentL.calls.mostRecent().args[0];
            var event2 = scopeL.calls.mostRecent().args[0];
            expect(event1).toBe(event2);
        });


        it('使用$broad方法触发事件时向下传播事件', function() {
            var parentL = jasmine.createSpy();
            var scopeL = jasmine.createSpy();
            var isolatedL = jasmine.createSpy();
            parent.$on('one', parentL);
            scope.$on('one', scopeL);
            isolatedChild.$on('one', isolatedL);
            parent.$broadcast('one');
            var event1 = parentL.calls.mostRecent().args[0];
            var event2 = scopeL.calls.mostRecent().args[0];
            expect(event1).toBe(event2);
            expect(parentL).toHaveBeenCalled();
            expect(scopeL).toHaveBeenCalled();
            expect(isolatedL).toHaveBeenCalled();
        });

        it('$emit方法触发事件时给event添加targetScope', function() {
            var sl = jasmine.createSpy();
            var pl = jasmine.createSpy();
            scope.$on('one', sl);
            parent.$on('one', pl);
            scope.$emit('one');
            expect(sl.calls.mostRecent().args[0].targetScope).toBe(scope);
            expect(pl.calls.mostRecent().args[0].targetScope).toBe(scope);
        });


        it('$broad方法触发事件时给event添加targetScope', function() {
            var sl = jasmine.createSpy();
            var pl = jasmine.createSpy();
            scope.$on('one', sl);
            parent.$on('one', pl);
            parent.$broadcast('one');
            expect(sl.calls.mostRecent().args[0].targetScope).toBe(parent);
            expect(pl.calls.mostRecent().args[0].targetScope).toBe(parent);
        });

        it('$emit方法触发事件时给event添加currentScope', function() {
            var sc, pc;
            var sl = function(e) {
                sc = e.currentScope;
            };
            var pl = function(e) {
                pc = e.currentScope;
            };
            scope.$on('one', sl);
            parent.$on('one', pl);
            scope.$emit('one');
            expect(sc).toBe(scope);
            expect(pc).toBe(parent);
        });


        it('$broad方法触发事件时给event添加currentScope', function() {
            var sc, pc;
            var sl = function(e) {
                sc = e.currentScope;
            };
            var pl = function(e) {
                pc = e.currentScope;
            };
            scope.$on('one', sl);
            parent.$on('one', pl);
            parent.$broadcast('one');
            expect(sc).toBe(scope);
            expect(pc).toBe(parent);
        });

        it('停止事件冒泡到父级scope', function() {
            var sl = function(event) {
                event.stopPropagation();
            };
            var pl = jasmine.createSpy();
            scope.$on('one', sl);
            parent.$on("one", pl);
            scope.$emit("one");
            expect(pl).not.toHaveBeenCalled();
        });

        it('停止事件冒泡不会阻止当前scope的事件触发', function() {
            var sl = function(event) {
                event.stopPropagation();
            };
            var pl = jasmine.createSpy();
            scope.$on('one', sl);
            scope.$on("one", pl);
            scope.$emit("one");
            expect(pl).toHaveBeenCalled();
        });

        it('设置defaultPrevented 值当调用preventDefault方法时', function() {
            var l = function(e) {
                e.preventDefault();
            };
            scope.$on("one", l);
            var event = scope.$emit("one");
            var event2 = scope.$broadcast("one");
            expect(event.defaultPrevented).toBe(true);
            expect(event2.defaultPrevented).toBe(true);
        });

        it('当scope销毁时触发$destroy事件', function() {
            var l = jasmine.createSpy();
            scope.$on("$destroy", l);
            scope.$destroy();
            expect(l).toHaveBeenCalled();
        });
        it('当scope时销毁时在child scope上触发$destroy事件', function() {
            var l = jasmine.createSpy();
            child.$on("$destroy", l);
            scope.$destroy();
            expect(l).toHaveBeenCalled();
        });

        it('scope销毁后不再调用监听函数', function() {
            var l = jasmine.createSpy();
            scope.$on("one", l);
            scope.$destroy();
            scope.$emit('one');
            expect(l).not.toHaveBeenCalled();
        });
        it('当调用$emit,$broadcast触发监听函数时,1个监听函数抛出异常不影响其他监听函数', function() {
            var l1 = function(event) {
                throw "l1 throwing an exception";
            };
            var l2 = jasmine.createSpy();
            var l3 = jasmine.createSpy();
            scope.$on('one', l1);
            scope.$on('one', l2);
            scope.$on('two', l1);
            scope.$on('two', l3);
            scope.$emit('one');
            scope.$broadcast('two');
            expect(l2).toHaveBeenCalled();
            expect(l3).toHaveBeenCalled();
        });
    });

    describe('优化脏检查', function() {
        var scope;
        beforeEach(function() {
            publishExternalAPI();
            var injector = createInjector(['ng']);
            scope = injector.get('$rootScope');
        });

        it('第一次脏检查后移除常量watcher', function() {
            scope.$watch('[1,2,3]', function() {});
            scope.$digest();
            expect(scope.$$watchers.length).toBe(0);
        });

        it('识别单次绑定', function() {
            var theValue;
            scope.aValue = 42;
            scope.$watch('::aValue', function(newValue) {
                theValue = newValue;
            });
            scope.$digest();
            expect(theValue).toBe(42);
        });
        it('第一次脏检查后移除单次绑定', function() {
            scope.aValue = 42;
            scope.$watch('::aValue', function() {});
            scope.$digest();
            expect(scope.$$watchers.length).toBe(0);
        });

        it('如果表达式的值仍旧是undefined,单次绑定不会删除watcher', function() {
            scope.aValue = 42;
            scope.$watch('::aValue', function() {});
            var un = scope.$watch('aValue', function() {
                delete scope.aValue;
            });
            scope.$digest();
            expect(scope.$$watchers.length).toBe(2);
            scope.aValue = 42;
            un();
            scope.$digest();
            expect(scope.$$watchers.length).toBe(0);
        });

        it('如果表达式是数组或者对象,如果数组或对象内部的属性还有undefined的值,单次绑定不会删除watcher', function() {
            scope.$watch('::[1,2,a]', function() {}, true);
            scope.$digest();
            expect(scope.$$watchers.length).toBe(1);
            scope.a = 3;
            scope.$digest();
            expect(scope.$$watchers.length).toBe(0);
        });

        it('如果数组或对象内部属性未改变,不改变数组', function() {
            var values = [];
            scope.a = 1;
            scope.b = 2;
            scope.c = 3;
            scope.$watch('[a,b,c]', function(v) {
                values.push(v);
            });
            scope.$digest();
            expect(values[0]).toEqual([1, 2, 3]);
            expect(values.length).toBe(1);
            scope.$digest();
            expect(values.length).toBe(1);
            scope.c = 4;
            scope.$digest();
            expect(values.length).toBe(2);
            expect(values[1]).toEqual([1, 2, 4]);
        });

        it('允许有状态的filter', function(done) {

            var injector=createInjector(['ng', function($filterProvider) {
                $filterProvider.register('withTime', function() {
                    return _.extend(function(v) {
                        return new Date().toISOString() + ":" + v;
                    }, {
                        $stateful: true
                    });
                });
            }]);
            var scope=injector.get('$rootScope');
            var listenerSpy = jasmine.createSpy();
            scope.$watch('42|withTime', listenerSpy);
            scope.$digest();
            var first = listenerSpy.calls.mostRecent().args[0];
            setTimeout(function() {
                scope.$digest();
                var second = listenerSpy.calls.mostRecent().args[0];
                expect(second).not.toEqual(first);
                done();
            }, 100);

        });
    });

    describe('设置脏检查短路次数', function() {
        
        beforeEach(function() {
            publishExternalAPI();
        });

        it('设置短路次数', function() {
            var injector=createInjector(['ng',function($rootScopeProvider){
                $rootScopeProvider.digestTtl(5);
            }]);
            var scope=injector.get("$rootScope");
            scope.countA=0;
            scope.countB=0;
            scope.$watch(function(scope){
                return scope.countA;
            },function(newValue,oldValue,scope){
                if(scope.countB<5){
                    scope.countB++;
                }
            });

            scope.$watch(function(scope){
                return scope.countB;
            },function(newValue,oldValue,scope){
                scope.countA++;
            });

            expect(function(){
                scope.$digest();
            }).toThrow();
        });

    });

});
