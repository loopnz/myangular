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
        var fn=parse("[1,2,3,]");
        expect(fn()).toEqual([1,2,3]);
    });
    it('解析空对象', function() {
        var fn=parse('{}');
        expect(fn()).toEqual({});
    });
    it('解析非空对象', function() {
        var fn=parse('{"a Key":1,\'another-key\':2}');
        expect(fn()).toEqual({'a Key':1,'another-key':2});
    });

    it('解析非空对象(对象的key是标识符,没有引号)', function() {
        var fn=parse('{a:1,b:[2,3],c:{d:4}}');
        expect(fn()).toEqual({a:1,b:[2,3],c:{d:4}});
    });

    it('解析属性名,从scope中查找属性', function() {
        var fn=parse('aKey');
        expect(fn({aKey:43})).toBe(43);
        expect(fn({})).toBeUndefined();
    });

    it('未传入scope时返回undefined', function() {
        var fn=parse('aKey');
        expect(fn()).toBeUndefined();
    });

    it('解析表达式中的this', function() {
        var fn=parse('this');
        var scope={};
        expect(fn(scope)).toBe(scope);
        expect(fn()).toBeUndefined();
    });
});


