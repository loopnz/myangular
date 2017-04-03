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
        var fn = parse('some["nested"].property.path=42');
        var scope = {};
        fn(scope);
        expect(scope.some.nested.property.path).toBe(42);
    });

    it('解析一元运算符', function() {
        expect(parse("+42")()).toBe(42);
        expect(parse('+a')({ a: 42 })).toBe(42);
    });

    it('将初始值为undefined的变量默认初始值改为0', function() {
        expect(parse("+a")({})).toBe(0);
    });

    it('解析!运算符', function() {
        expect(parse('!true')()).toBe(false);
        expect(parse('!42')()).toBe(false);
        expect(parse('!a')({ a: false })).toBe(true);
        expect(parse('!!a')({ a: false })).toBe(false);
    });

    it('解析-运算符', function() {
        expect(parse('-42')()).toBe(-42);
        expect(parse('-a')({ a: -42 })).toBe(42);
        expect(parse('--a')({ a: -42 })).toBe(-42);
        expect(parse('-a')({})).toBe(0);
    });

    it('不解析字符串中的!(感叹号)', function() {
        expect(parse('"!"')()).toBe("!");
    });
    it('解析乘法', function() {
        expect(parse("21 * 2")()).toBe(42);
    });

    it('解析除法', function() {
        expect(parse('84 / 2')()).toBe(42);
    });

    it('解析求余运算', function() {
        expect(parse('85 % 43')()).toBe(42);
    });

    it('解析多个乘法运算', function() {
        expect(parse('36*2%5')()).toBe(2);
    });

    it('解析加法', function() {
        expect(parse('20+22')()).toBe(42);
    });

    it('解析减法', function() {
        expect(parse("42-22")()).toBe(20);
    });

    it('先解析优先级高的运算', function() {
        expect(parse('2+3*5')()).toBe(17);
        expect(parse('2+3*2+3')()).toBe(11);
    });

    it('解析关系表达式', function() {
        expect(parse('1<2')()).toBe(true);
        expect(parse('1>2')()).toBe(false);
        expect(parse('1<=2')()).toBe(true);
        expect(parse('2<=2')()).toBe(true);
        expect(parse('1>=2')()).toBe(false);
        expect(parse('2>=2')()).toBe(true);
    });
    it('解析相等表达式', function() {
        expect(parse('42 == 42')()).toBe(true);
        expect(parse('42=="42"')()).toBe(true);
        expect(parse('42!=42')()).toBe(false);
        expect(parse('42===42')()).toBe(true);
        expect(parse('42==="42"')()).toBe(false);
        expect(parse('42!==42')()).toBe(false);
    });

    it('关系表达式的优先级高于相等的优先级', function() {
        expect(parse('2=="2">2==="2"')()).toBe(false);
    });

    it('算术运算的优先级高于关系表达式', function() {
        expect(parse('2+3<6-2')()).toBe(false);
    });

    it('解析逻辑运算符&&', function() {
        expect(parse('true&&true')()).toBe(true);
        expect(parse('true&&false')()).toBe(false);
    });

    it('解析逻辑运算符||', function() {
        expect(parse('true||true')()).toBe(true);
        expect(parse('true||false')()).toBe(true);
        expect(parse('false||false')()).toBe(false);
    });

    it('解析多重逻辑运算符&&', function() {
        expect(parse('true&&true&&true')()).toBe(true);
        expect(parse('true&&true&&false')()).toBe(false);
    });

    it('解析多重逻辑运算符||', function() {
        expect(parse('true||true||true')()).toBe(true);
        expect(parse('true||true||false')()).toBe(true);
        expect(parse('false||false||true')()).toBe(true);
        expect(parse('false||false||false')()).toBe(false);
    });

    it('处理逻辑&&的短路', function() {
        var invoked;
        var scope = {
            fn: function() {
                invoked = true;
            }
        };
        parse('false&&fn()')(scope);
        expect(invoked).toBeUndefined();
    });

    it('处理逻辑||的短路', function() {
        var invoked;
        var scope = {
            fn: function() {
                invoked = true;
            }
        };
        parse('true||fn()')(scope);
        expect(invoked).toBeUndefined();
    });

    it('逻辑&&的优先级要高于逻辑||', function() {
        expect(parse('false&&true||true')()).toBe(true);
    });

    it('逻辑表达式的优先级要低于相等的优先级', function() {
        expect(parse('1===2||2===2')()).toBe(true);
    });

    it('解析三目运算符', function() {
        expect(parse('a===42?true:false')({ a: 42 })).toBe(true);
        expect(parse('a===42?true:false')({ a: 43 })).toBe(false);
    });

    it('逻辑或的优先级高于三目运算符', function() {
        expect(parse('0||1?0||2:0||3')()).toBe(2);
    });

    it('parses nested ternaries', function() {
        expect(
            parse('a===42?b===42?"a and b":"a":c===42?"c":"none"')({
                a: 44,
                b: 43,
                c: 42
            })
        ).toEqual('c');
    });

    it('使用括号改变运算优先级', function() {
        expect(parse('21*(3-1)')()).toBe(42);
        expect(parse('false&&(true||true)')()).toBe(false);
        expect(parse('-((a%2)===0?1:2)')({ a: 42 })).toBe(-1);
    });

    it('parses several statements', function() {
        var fn = parse('a=1;b=2;c=3');
        var scope = {};
        fn(scope);
        expect(scope).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('返回最后一个语句的值', function() {
        expect(parse('a=1;b=2;a+b')({})).toBe(3);
    });

    it('解析包含过滤器的表达式', function() {
        register('upcase', function() {
            return function(str) {
                return str.toUpperCase();
            };
        });
        var fn = parse('a|upcase');
        expect(fn({ a: 'hello' })).toBe('HELLO');
    });

    it('解析串联的过滤器', function() {
        register('upcase', function() {
            return function(str) {
                return str.toUpperCase();
            };
        });
        register('exclamate', function() {
            return function(str) {
                return str + "!";
            };
        });
        var fn = parse('a|upcase|exclamate');
        expect(fn({ a: 'hello' })).toBe('HELLO!');
    });

    it('给过滤器传递参数', function() {
        register('repeat', function() {
            return function(s, times) {
                return _.repeat(s, times);
            };
        });
        var fn = parse('a|repeat:3');
        expect(fn({ a: 'hello' })).toEqual('hellohellohello');
    });

    it('可以给过滤器传递多个参数', function() {
        register('surround', function() {
            return function(str, left, right) {
                return left + str + right;
            };
        });
        var fn = parse('"hello"|surround:"*":"!"');
        expect(fn()).toEqual('*hello!');
    });

    it('如果传入的参数是函数,直接返回此函数', function() {
        var fnn = function() {};
        expect(parse(fnn)).toBe(fnn);
    });
    it('不传入参数时返回默认函数', function() {
        expect(parse()).toEqual(jasmine.any(Function));
    });

    it('标记integer 字面量', function() {
        var fn = parse('42');
        expect(fn.literal).toBe(true);
    });
    it('标记字符串字面量', function() {
        var fn = parse('"abc"');
        expect(fn.literal).toBe(true);
    });
    it('标记布尔类型字面量', function() {
        var fn = parse('true');
        expect(fn.literal).toBe(true);
    });
    it('标记数组字面量', function() {
        var fn = parse('[1,2,a]');
        expect(fn.literal).toBe(true);
    });

    it('标记对象字面量', function() {
        var fn = parse('{a:1,b:av}');
        expect(fn.literal).toBe(true);
    });

    it('运算符标记literal为false', function() {
        var fn = parse('!false');
        expect(fn.literal).toBe(false);
    });

    it('标记算术运算符literal 为false', function() {
        var fn = parse('1+2');
        expect(fn.literal).toBe(false);
    });

    it('标记常量', function() {
        var fn = parse('42');
        expect(fn.constant).toBe(true);
    });
    it('标记字符串常量', function() {
        var fn = parse('"abc"');
        expect(fn.constant).toBe(true);
    });
    it('标记布尔常量', function() {
        var fn = parse('true');
        expect(fn.constant).toBe(true);
    });

    it('标记标识符的常量标记为false', function() {
        var fn = parse('a');
        expect(fn.constant).toBe(false);
    });
    it('当数组元素都是常量时标记constant', function() {
        expect(parse('[1,2,3]').constant).toBe(true);
        expect(parse('[1,[2,[3]]]').constant).toBe(true);
        expect(parse('[1,2,a]').constant).toBe(false);
        expect(parse('[1,[2,[a]]]').constant).toBe(false);
    });

    it('查找对象属性标记constant', function() {
        expect(parse('{a:1}["a"]').constant).toBe(true);
        expect(parse('obj["a"]').constant).toBe(false);
        expect(parse('{a:1}[something]').constant).toBe(false);
        expect(parse('obj[something]').constant).toBe(false);
    });
});

