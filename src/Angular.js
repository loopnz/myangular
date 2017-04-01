_.mixin({
    isArrayLike: function(obj) {
        if (_.isNull(obj) || _.isUndefined(obj)) {
            return false;
        }
        var length = obj.length;
        return length === 0 || (_.isNumber(length) && length > 0 && (length - 1) in obj);
    },
    repeat: function(str, times) {
        if (!times) {
            times = 1;
        }
        var arr = new Array(times + 1);
        return arr.join(str);
    },
    startsWith: function(str, start) {
        return str.charAt(0) === start;
    },
    toPlainObject:function(obj){
        var o={};

        for(var key in obj){
            o[key]=obj[key];
        }
        return o;
    }
});
