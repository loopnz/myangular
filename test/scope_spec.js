describe("Scope", function() {

    it("创建scope对象,scope就是普通js对象", function() {
        var scope = new Scope();
        scope.aProperty = 1;
        expect(scope.aProperty).toBe(1);
    });

    describe("digest", function() {

        var scope;

        beforeEach(function() {
            scope = new Scope();
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

    });

    describe('$watchGroup', function() {
        var scope;
        beforeEach(function() {
            scope = new Scope();
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

        it('inherits the parent properties', function() {
            var parent = new Scope();
            parent.aValue = [1, 2, 3];
            var child = parent.$new();
            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it('does not cause a parent to inherit its properties', function() {
            var parent = new Scope();
            var child = parent.$new();
            child.aValue = [1, 2, 3];
            expect(parent.aValue).toBeUndefined();
        });

        it('inherits the parent properties whenevet they are defined ', function() {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            expect(child.aValue).toEqual([1, 2, 3]);

        });

        it('can manipulate a parent socpe property ', function() {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            child.aValue.push(4);
            expect(child.aValue).toEqual([1, 2, 3, 4]);
            expect(parent.aValue).toEqual([1, 2, 3, 4]);
        });

        it('can watch a property in the parent', function() {
            var parent = new Scope();
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
            var a = new Scope();
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
            var parent = new Scope();
            var child = parent.$new();
            parent.name = 'joe';
            child.name = 'jill';
            expect(parent.name).toBe('joe');
            expect(child.name).toBe('jill');
        });
        it('does not shadow members of parent scope attributes', function() {
            var parent = new Scope();
            var child = parent.$new();
            parent.user = { name: 'joe' };
            child.user.name = 'jill';
            expect(parent.user.name).toBe('jill');
            expect(child.user.name).toBe('jill');
        });

        it('does not digest its parents', function() {
            var parent = new Scope();
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
            var parent = new Scope();
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
            var parent = new Scope();
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
            var parent = new Scope();
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

            var parent = new Scope();
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
            var parent = new Scope();
            var child = parent.$new(true);

            parent.aValue = 'abc';

            expect(child.aValue).toBeUndefined();

        });

        it('cannot watch parent attributes when ioslated', function() {
            var parent = new Scope();
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
            var parent = new Scope();
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
            var parent = new Scope();
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
            var parent = new Scope();
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
            var parent = new Scope();
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
            var parent = new Scope();
            var child = parent.$new(true);
            child.$$postDigest(function(scope) {
                child.didPostDigest = true;
            });

            parent.$digest();
            expect(child.didPostDigest).toBe(true);


        });

        it('创建子scope时使用指定的父级scope', function() {
            var prototypeParent = new Scope();
            var hierarchyParent = new Scope();
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

        it('使用$destory方法销毁scope', function() {
            var parent = new Scope();
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

            child.$destory();

            child.aValue.push(5);
            parent.$digest();
            expect(child.counter).toBe(2);

        });
    });


    describe('$watchCollection', function() {
        var scope;
        beforeEach(function() {
            scope = new Scope();
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


});
