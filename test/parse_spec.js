describe('parse', function() {

    it('解析integer', function() {
        var fn = parse('42');
        expect(fn).toBeDefined();
        expect(fn()).toBe(42);
    });

    it('解析浮点数', function() {
        var fn = parse('4.2');
        expect(fn()).toBe(4.2);
    });

    it('解析小数浮点数(没有整数位)', function() {
        var fn = parse('.42');
        expect(fn()).toBe(0.42);
    });

    it('解析科学计数', function() {
        var fn = parse('42e3');
        expect(fn()).toBe(42000);
    });

    it('解析浮点科学计数', function() {
        var fn = parse('.42e2');
        expect(fn()).toBe(42);
    });

    it('解析科学计数(负幂)', function() {
        var fn = parse('4200e-2');
        expect(fn()).toBe(42);
    });

    it('解析科学计数(带+号)', function() {
        var fn = parse('.42e+2');
        expect(fn()).toBe(42);
    });
    it('解析科学计数(大写E)', function() {
        var fn = parse('.42E2');
        expect(fn()).toBe(42);
    });

    it('不解析非法格式的科学计数', function() {
        expect(function() {
            parse('42e-');
        }).toThrow();
        expect(function() {
            parse('42e-a');
        }).toThrow();
    });

    it('解析单引号的字符串', function() {
        var fn = parse("'abc'");
        expect(fn()).toEqual('abc');
    });
    it('解析双引号的字符串', function() {
        var fn = parse('"abc"');
        expect(fn()).toEqual("abc");
    });

    it('引号不匹配时抛出异常', function() {
        expect(function() {
            parse('"abc\'');
        }).toThrow();
    });

    it('能够解析表达式内部的单引号', function() {
        var fn = parse("'a\\\'b'");
        expect(fn()).toEqual('a\'b');
    });

    it('能够解析表达式内部的双引号', function() {
        var fn = parse('"a\\\"b"');
        expect(fn()).toEqual('a\"b');
    });

    it('解析字符串中unicode字符', function() {
        var fn = parse("'\\u00A0'");
        expect(fn()).toEqual("\u00A0");
    });
    it('不解析字符串中的非法unicode字符', function() {
        expect(function() {
            parse('"\\u00T0"');
        }).toThrow();
    });

    it('解析null', function() {
        var fn = parse('null');
        expect(fn()).toBe(null);
    });

    it('解析true', function() {
        var fn = parse("true");
        expect(fn()).toBe(true);
    });
    it('解析false', function() {
        var fn = parse('false');
        expect(fn()).toBe(false);
    });

    it('忽视空格(whitespace)', function() {
        var fn = parse(" \n42 ");
        expect(fn()).toEqual(42);
    });

    it('解析空数组', function() {
        var fn = parse('[]');
        expect(fn()).toEqual([]);
    });

    it('解析非空数组', function() {
        var fn = parse('[1,"two",[3],true]');
        expect(fn()).toEqual([1, "two", [3], true]);
    });

    it('解析数组忽略最后一个逗号分隔符', function() {
        var fn = parse("[1,2,3,]");
        expect(fn()).toEqual([1, 2, 3]);
    });
    it('解析空对象', function() {
        var fn = parse('{}');
        expect(fn()).toEqual({});
    });
    it('解析非空对象', function() {
        var fn = parse('{"a Key":1,\'another-key\':2}');
        expect(fn()).toEqual({ 'a Key': 1, 'another-key': 2 });
    });

    it('解析非空对象(对象的key是标识符,没有引号)', function() {
        var fn = parse('{a:1,b:[2,3],c:{d:4}}');
        expect(fn()).toEqual({ a: 1, b: [2, 3], c: { d: 4 } });
    });

    it('解析属性名,从scope中查找属性', function() {
        var fn = parse('aKey');
        expect(fn({ aKey: 43 })).toBe(43);
        expect(fn({})).toBeUndefined();
    });

    it('未传入scope时返回undefined', function() {
        var fn = parse('aKey');
        expect(fn()).toBeUndefined();
    });

    it('解析表达式中的this', function() {
        var fn = parse('this');
        var scope = {};
        expect(fn(scope)).toBe(scope);
        expect(fn()).toBeUndefined();
    });

    it('解析对象的属性值(用点号)', function() {
        var fn = parse('aKey.anotherKey');
        expect(fn({ aKey: { anotherKey: 42 } })).toBe(42);
        expect(fn({ aKey: {} })).toBeUndefined();
        expect(fn({})).toBeUndefined();
    });

    it('直接解析对象的值', function() {
        var fn = parse('{aKey:42}.aKey');
        expect(fn()).toBe(42);
    });

    it('使用多个点调用对象', function() {
        var fn = parse("aKey.secondKey.thirdKey.fourthKey");
        expect(fn({ aKey: { secondKey: { thirdKey: { fourthKey: 42 } } } })).toBe(42);
        expect(fn({ aKey: { secondKey: { thirdKey: {} } } })).toBeUndefined();
        expect(fn({ aKey: {} })).toBeUndefined();
        expect(fn()).toBeUndefined();
    });

    it('如果局部对象参数有key,使用局部对象作为scope', function() {
        var fn = parse('aKey');
        var scope = { aKey: 42 };
        var local = { aKey: 43 };
        expect(fn(scope, local)).toBe(43);
    });

    it('如果局部对象没有匹配的key,不使用局部对象作为scope', function() {
        var fn = parse('aKey');
        var scope = { aKey: 42 };
        var local = { anotherKey: 43 };
        expect(fn(scope, local)).toBe(42);
    });

    it('使用局部对象时只比较第一层级的key', function() {
        var fn = parse('aKey.otherKey');
        var scope = { aKey: { otherKey: 32 } };
        var local = { aKey: {} };
        expect(fn(scope, local)).toBeUndefined();
    });

    it('解析中括号调用的对象属性', function() {
        var fn = parse('aKey["otherKey"]');
        expect(fn({ aKey: { otherKey: 32 } })).toBe(32);
    });

    it('解析中括号调用形式的数组', function() {
        var fn = parse('array[1]');
        expect(fn({ array: [1, 2, 3] })).toBe(2);
    });

    it('解析计算属性中使用其他key的值作为属性', function() {
        var fn = parse('aKey[key]');
        expect(fn({ key: 'theKey', aKey: { theKey: 42 } })).toBe(42);
    });

    it('解析计算属性(中括号形式)中其他key的值(对象)取值调用', function() {
        var fn = parse('lock[keys["aKey"]]');
        expect(fn({
            keys: { aKey: 'theKey' },
            lock: {
                theKey: 42
            }
        })).toBe(42);
    });

    it('解析函数调用', function() {
        var fn = parse('aFunction()');
        expect(fn({
            aFunction: function() {
                return 42;
            }
        })).toBe(42);
    });

    it('解析函数调用,给函数传递number类型参数', function() {
        var fn = parse('aFunction(42)');
        expect(fn({
            aFunction: function(n) {
                return n;
            }
        })).toBe(42);
    });

    it('解析函数调用,给函数传递标识符类型的参数', function() {
        var fn = parse('aFunction(n)');
        expect(fn({
            n: 42,
            aFunction: function(arg) {
                return arg;
            }
        })).toBe(42);
    });

    it('解析函数调用,给函数传递的参数是解析另一个函数调用的结果', function() {
        var fn = parse('aFunction(argFn())');
        expect(fn({
            argFn: _.constant(42),
            aFunction: function(arg) {
                return arg;
            }
        })).toBe(42);
    });

    it('解析函数调用,给函数传递多个参数', function() {
        var fn = parse('aFunction(37,n,argFn())');
        expect(fn({
            n: 3,
            argFn: _.constant(2),
            aFunction: function(a1, a2, a3) {
                return a1 + a2 + a3;
            }
        })).toBe(42);
    });

    it('计算属性形式的方法调用', function() {
        var scope = {
            anObject: {
                a: 42,
                af: function() {
                    return this.a;
                }
            }
        };
        var fn = parse("anObject['af']()");
        expect(fn(scope)).toBe(42);
    });
    it('直接调用形式的方法的调用', function() {
        var scope = {
            anObject: {
                a: 42,
                af: function() {
                    return this.a;
                }
            }
        };
        var fn = parse("anObject.af()");
        expect(fn(scope)).toBe(42);
    });

    it('直接调用的方法的内部的this绑定到scope', function() {
        var scope = {
            a: function() {
                return this;
            }
        };
        var fn = parse('a()');
        expect(fn(scope)).toBe(scope);
    });
    it('直接调用的方法的内部的this绑定到local(局部变量)', function() {
        var scope = {};
        var local = {
            a: function() {
                return this;
            }
        };
        var fn = parse('a()');
        expect(fn(scope, local)).toBe(local);
    });

    it('简单赋值', function() {
        var fn = parse("a=42");
        var scope = {};
        fn(scope);
        expect(scope.a).toBe(42);
    });

    it('所赋与的值是函数的返回值', function() {
        var fn = parse('a=aFunction()');
        var scope = {
            aFunction: function() {
                return 42;
            }
        };
        fn(scope);
        expect(scope.a).toBe(42);
    });

    it('给scope的对象属性使用标识符赋值', function() {
        var fn = parse("a.aKey=42");
        var scope = {
            a: {}
        };
        fn(scope);
        expect(scope.a.aKey).toBe(42);
    });

    it('给scope的对象属性使用计算属性的方式赋值', function() {
        var fn = parse("a['aKey']=42");
        var scope = {
            a: {}
        };
        fn(scope);
        expect(scope.a.aKey).toBe(42);
    });

    it('给scope中内部嵌入对象赋值', function() {
        var fn = parse('a[0].aKey=42');
        var scope = {
            a: [{}]
        };
        fn(scope);
        expect(scope.a[0].aKey).toBe(42);
    });

    it('给scope中还不存在的对象赋值', function() {
        var fn=parse('some["nested"].property.path=42');
        var scope={};
        fn(scope);
        expect(scope.some.nested.property.path).toBe(42);
    });

});
