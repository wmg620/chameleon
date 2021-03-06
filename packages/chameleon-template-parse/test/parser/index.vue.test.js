
// vue语法的单元测试
const babylon = require('babylon');
const t = require('@babel/types');
const traverse = require('@babel/traverse')["default"];
const generate = require('@babel/generator')["default"];
const parseTemplate = require('../../src/parser/index.js');
const expect = require('chai').expect;

function compileTemplate(source, type, options, callback) {
  const ast = babylon.parse(source, {
    plugins: ['jsx']
  })
  traverse(ast, {
    enter(path) {
      callback(path, type, options);
    }
  });
  let result = generate(ast).code;
  if (/;$/.test(result)) { // 这里有个坑，jsx解析语法的时候，默认解析的是js语法，所以会在最后多了一个 ; 字符串；但是在 html中 ; 是无法解析的；
    result = result.slice(0, -1);
  }

  return result;
}
// cml语法的单元测试
describe('parse-template-vue', function() {
  // parseRefStatement:仅在所有的小程序端进行处理
  describe('parseRefStatement-miniapp', function() {
    let source = `<view ref="flag"></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseRefStatement;
    let result = compileTemplate(source, 'wx', options, callback);
    it('test-ref-transform', function() {
      expect(result).to.equal(`<view id="flag" class="_cml_ref_lmc_"></view>`)
    });
  });
  // parseVue2WxStatement:测试v-if语法转化为小程序
  describe('parseVue2WxStatement-miniapp', function() {
    let source = `<view><view v-if="true"></view><view v-else-if="true"></view><view v-else="true"></view></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseVue2WxStatement;
    let result_wx = compileTemplate(source, 'wx', options, callback);
    let result_baidu = compileTemplate(source, 'baidu', options, callback);
    let result_alipay = compileTemplate(source, 'alipay', options, callback);
    it('test-condition-web-transform', function() {
      expect(result_wx).to.equal(`<view><view wx:if="{{true}}"></view><view wx:elif="{{true}}"></view><view wx:else="{{true}}"></view></view>`)
      expect(result_alipay).to.equal(`<view><view a:if="{{true}}"></view><view a:elif="{{true}}"></view><view a:else="{{true}}"></view></view>`)
      expect(result_baidu).to.equal(`<view><view s-if="true"></view><view s-elif="true"></view><view s-else="true"></view></view>`)
    });
  });
  // parseVue2WxStatement：测试v-for语法转化为小程序
  describe('parseVue2WxStatement-miniapp', function() {
    let source = `<view v-for="(m,i) in array"><view v-for="item in array"></view></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseVue2WxStatement;
    let result_wx = compileTemplate(source, 'wx', options, callback);
    let result_alipay = compileTemplate(source, 'alipay', options, callback);
    let result_baidu = compileTemplate(source, 'baidu', options, callback);
    it('test-Iteration-transform', function() {
      expect(result_wx).to.equal(`<view wx:for-item="m" wx:for-index="i" wx:for="{{array}}"><view wx:for-item="item" wx:for-index="index" wx:for="{{array}}"></view></view>`)
      expect(result_alipay).to.equal(`<view a:for-item="m" a:for-index="i" a:for="{{array}}"><view a:for-item="item" a:for-index="index" a:for="{{array}}"></view></view>`)
      expect(result_baidu).to.equal(`<view s-for-item="m" s-for-index="i" s-for="array"><view s-for-item="item" s-for-index="index" s-for="array"></view></view>`)
    });
  });
  // parseVue2WxStatement:测试 v-bind转化为小程序端的响应值
  describe('parseVue2WxStatement-miniapp', function() {
    let source = `<view><view prop1="static" v-bind:prop2="dynamic"></view></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseVue2WxStatement;
    let result_wx = compileTemplate(source, 'wx', options, callback);
    let result_alipay = compileTemplate(source, 'alipay', options, callback);
    let result_baidu = compileTemplate(source, 'baidu', options, callback);
    it('test-attribute-transform', function() {
      expect(result_wx).to.equal(`<view><view prop1="static" prop2="{{dynamic}}"></view></view>`)
      expect(result_alipay).to.equal(`<view><view prop1="static" prop2="{{dynamic}}"></view></view>`)
      expect(result_baidu).to.equal(`<view><view prop1="static" prop2="{{dynamic}}"></view></view>`)
    });
  });
  // vue语法下style只支持一个style；parseStyleStatement
  describe('parseStyleStatement-web', function() {
    let source = `<view v-bind:style="dynamicColor"><view style="color:red"></view></view>`;
    let options = {lang: 'vue', cmss: {
      rem: true,
      scale: 0.5,
      remOptions: {
        // base on 750px standard.
        rootValue: 75,
        // to leave 1px alone.
        minPixelValue: 1.01
      },
      autoprefixOptions: {
        browsers: ['> 0.1%', 'ios >= 8', 'not ie < 12']
      }
    }};
    let callback = parseTemplate.parseStyleStatement;
    let result = compileTemplate(source, 'web', options, callback);
    it('test-style-transform', function() {
      expect(result).to.equal(`<view v-bind:style="_cmlStyleProxy((dynamicColor),{'rem':true,'scale':0.5,'remOptions':{'rootValue':75,'minPixelValue':1.01},'autoprefixOptions':{'browsers':['> 0.1%','ios >= 8','not ie < 12']}})"><view style="color:red"></view></view>`)
    });
  });
  describe('parseStyleStatement-weex', function() {
    let source = `<view v-bind:style="dynamicColor"><view style="color:red;width:20px"></view></view>`;
    let options = {lang: 'vue', cmss: {
      rem: true,
      scale: 0.5,
      remOptions: {
        // base on 750px standard.
        rootValue: 75,
        // to leave 1px alone.
        minPixelValue: 1.01
      },
      autoprefixOptions: {
        browsers: ['> 0.1%', 'ios >= 8', 'not ie < 12']
      }
    }};
    let callback = parseTemplate.parseStyleStatement;
    let result = compileTemplate(source, 'weex', options, callback);
    it('test-style-transform', function() {
      expect(result).to.equal(`<view v-bind:style="_cmlStyleProxy((dynamicColor))"><view style="color: #ff0000;width: 20px"></view></view>`)
    });
  });
  describe('parseStyleStatement-miniapp', function() {
    let source = `<view ><view style="color:red;width:20px"></view></view>`;
    let options = {lang: 'vue', cmss: {
      rem: true,
      scale: 0.5,
      remOptions: {
        // base on 750px standard.
        rootValue: 75,
        // to leave 1px alone.
        minPixelValue: 1.01
      },
      autoprefixOptions: {
        browsers: ['> 0.1%', 'ios >= 8', 'not ie < 12']
      }
    }};
    let callback = parseTemplate.parseStyleStatement;
    let result_wx = compileTemplate(source, 'wx', options, callback);
    let result_alipay = compileTemplate(source, 'alipay', options, callback);
    let result_baidu = compileTemplate(source, 'baidu', options, callback);
    it('test-style-transform', function() {
      expect(result_wx).to.equal(`<view><view style="color:red;width:20px"></view></view>`)
      expect(result_alipay).to.equal(`<view><view style="color:red;width:20px"></view></view>`)
      expect(result_baidu).to.equal(`<view><view style="color:red;width:20px"></view></view>`)
    });
  });
  // parseClassStatement
  describe('parseClassStatement-web', function() {
    let source = `<view><view class="cls1 cls2" v-bind:class="true?'cls3':'cls4'"></view></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseClassStatement;
    let result = compileTemplate(source, 'web', options, callback);
    it('test-class-transform', function() {
      expect(result).to.equal(`<view class=" cml-base cml-view"><view class="cls1 cls2   cml-base cml-view" v-bind:class="true?'cls3':'cls4'"></view></view>`)
    });
  });
  describe('parseClassStatement-weex', function() {
    let source = `<view><view class="cls1 cls2" v-bind:class="true?'cls3':'cls4'"></view></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseClassStatement;
    let result = compileTemplate(source, 'weex', options, callback);

    it('test-class-transform', function() {
      expect(result).to.equal(`<view class=" cml-base cml-view"><view class="cls1 cls2   cml-base cml-view" v-bind:class="_weexClassProxy((true?'cls3':'cls4'))"></view></view>`)
    });
  });
  describe('parseClassStatement-wx-alipay-baidu', function() {
    let source = `<view><view class="cls1 cls2" v-bind:class="true?'cls3':'cls4'"></view></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseClassStatement;
    let result = compileTemplate(source, 'wx', options, callback);
    it('test-class-transform', function() {
      expect(result).to.equal(`<view class=" cml-base cml-view"><view class="{{true?'cls3':'cls4'}} cls1 cls2  cml-base cml-view"></view></view>`)
    });
  });
  // parseDirectiveStatement
  describe('parseDirectiveStatement-web-weex', function() {
    let source = `<view><input v-model="searchText" /><custom-input v-model="search"></custom-input></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseDirectiveStatement;
    let result = compileTemplate(source, 'web', options, callback);
    it('test-class-transform', function() {
      expect(result).to.equal(`<view><input v-on:input="_cmlModelEventProxy($event,'searchText')" v-bind:value="searchText" /><custom-input v-on:input="_cmlModelEventProxy($event,'search')" v-bind:value="search"></custom-input></view>`)
    });
  });
  describe('parseDirectiveStatement-wx-alipay-baidu', function() {
    let source = `<view><input v-model="searchText" /><custom-input v-model="search"></custom-input></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseDirectiveStatement;
    let result_wx = compileTemplate(source, 'wx', options, callback);
    let result_baidu = compileTemplate(source, 'baidu', options, callback);
    let result_alipay = compileTemplate(source, 'alipay', options, callback);
    it('test-class-transform', function() {
      expect(result_wx).to.equal(`<view><input data-modelkey="searchText" bindinput="_cmlModelEventProxy" value="{{searchText}}" /><custom-input data-modelkey="search" bindinput="_cmlModelEventProxy" value="{{search}}"></custom-input></view>`)
      expect(result_baidu).to.equal(`<view><input data-modelkey="searchText" bindinput="_cmlModelEventProxy" value="{{searchText}}" /><custom-input data-modelkey="search" bindinput="_cmlModelEventProxy" value="{{search}}"></custom-input></view>`)
      expect(result_alipay).to.equal(`<view><input data-modelkey="searchText" bindInput="_cmlModelEventProxy" value="{{searchText}}" /><custom-input data-modelkey="search" bindInput="_cmlModelEventProxy" value="{{search}}"></custom-input></view>`)
    });
  });
  // c-show
  describe('parseDirectiveStatement-web-weex', function() {
    let source = `<view v-show="true"></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseDirectiveStatement;
    let result = compileTemplate(source, 'web', options, callback);
    it('test-c-show-transform', function() {
      // style后续会通过parseStyle接着进行解析；
      expect(result).to.equal(`<view :style="display:{{true?'':'none'}};{{true?'':'height:0px;width:0px;overflow:hidden'}}"></view>`)
    });
  });
  describe('parseDirectiveStatement-wx-alipay-baidu', function() {
    let source = `<view v-show="true"></view>`;
    let options = {lang: 'vue'};
    let callback = parseTemplate.parseDirectiveStatement;
    let result_wx = compileTemplate(source, 'wx', options, callback);
    let result_baidu = compileTemplate(source, 'baidu', options, callback);
    let result_alipay = compileTemplate(source, 'alipay', options, callback);

    it('test-class-transform', function() {
      expect(result_wx).to.equal(`<view style="display:{{true?'':'none'}};{{true?'':'height:0px;width:0px;overflow:hidden'}}"></view>`)
      expect(result_baidu).to.equal(`<view style="display:{{true?'':'none'}};{{true?'':'height:0px;width:0px;overflow:hidden'}}"></view>`)
      expect(result_alipay).to.equal(`<view style="display:{{true?'':'none'}};{{true?'':'height:0px;width:0px;overflow:hidden'}}"></view>`)
    });
  });


})
