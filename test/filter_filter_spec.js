/*jshint globalstrict:true*/
/*global filter:false,parse:false*/
'use strict';

describe('过滤器的过滤器(filter filter)', function() {

    it('注册filter filter', function() {
        expect(filter('filter')).toBeDefined();
    });

    it('使用断言函数过滤数组', function() {
        var fn = parse('[1,2,3,4]|filter:isOdd');
        var scope = {
            isOdd: function(n) {
                return n % 2 !== 0;
            }
        };
        expect(fn(scope)).toEqual([1, 3]);
    });

    it('可以过滤字符串数组中的字符串', function() {
        var fn = parse('arr|filter:"a"');
        expect(fn({ arr: ['a', 'b', 'a'] })).toEqual(['a', 'a']);
    });

    it('可以根据数组中的字符串的子串来过滤', function() {
        var fn = parse('arr|filter:"o"');
        expect(fn({ arr: ["quick", "brown", "fox"] })).toEqual(['brown', 'fox']);
    });

    it('如果数组中的成员是对象,可以根据对象的属性过滤', function() {
        var fn = parse('arr|filter:"o"');
        expect(fn({
            arr: [
                { f: "john", l: "brown" },
                { f: "jane", l: "fox" },
                { f: "mary", l: "quick" }
            ]
        })).toEqual([
            { f: "john", l: "brown" },
            { f: "jane", l: "fox" }
        ]);
    });

});
