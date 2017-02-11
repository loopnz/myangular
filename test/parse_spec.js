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
    	var fn=parse("'abc'");
    	expect(fn()).toEqual('abc');
    });
    it('解析双引号的字符串', function() {
    	var fn=parse('"abc"');
    	expect(fn()).toEqual("abc");
    });

    it('引号不匹配时抛出异常', function() {
    	expect(function(){
    		parse('"abc\'');
    	}).toThrow();
    });

    it('能够解析表达式内部的单引号', function() {
    	var fn=parse("'a\\\'b'");
    	expect(fn()).toEqual('a\'b');
    });

        it('能够解析表达式内部的双引号', function() {
    	var fn=parse('"a\\\"b"');
    	expect(fn()).toEqual('a\"b');
    });
});
