(window.webpackJsonppggraph=window.webpackJsonppggraph||[]).push([[0],{158:function(e,a,t){e.exports=t(342)},340:function(e,a,t){},341:function(e,a,t){},342:function(e,a,t){"use strict";t.r(a);var l=t(1),n=t.n(l),r=t(47),u=t.n(r),c=t(19),o=t(18),i=(t(340),function(e){var a=e.label,t=e.type,l=void 0===t?"number":t,r=e.value,u=e.options,c=e.onChange,o=e.error,i=e.suffix,s=n.a.createElement("input",{className:"FormItemInputText",type:l,value:r,onChange:function(e){return c(e.target.value)}});return"radio"===l&&(s=u.map((function(e){return n.a.createElement(n.a.Fragment,null,n.a.createElement("input",{key:e,type:"radio",value:e,onChange:function(){return c(e)},checked:e===r}),e)}))),"select"===l&&(s=n.a.createElement("select",{className:"FormItemSelect",onChange:function(e){return c(e.target.value)},value:r},u.map((function(e){return n.a.createElement("option",{value:e.value,key:e.value},e.label)})))),n.a.createElement("div",{className:"FormItem"},n.a.createElement("div",{className:"FormItemInput"},n.a.createElement("label",null,a),s,i&&n.a.createElement("span",{className:"suffix"},i)),o&&n.a.createElement("div",null,o))}),s=(t(341),function(e){return e===String(+e)}),m=function(e){var a="".concat(Math.round(10*e)/10,"Mb");return e>1073741824?a="".concat(Math.round(e/1024/1024/1024*10)/10,"Pt"):e>1048576?a="".concat(Math.round(e/1024/1024*10)/10,"Tb"):e>1024&&(a="".concat(Math.round(e/1024*10)/10,"Gb")),a};u.a.render(n.a.createElement((function(){var e=Object(l.useState)("10"),a=Object(c.a)(e,2),t=a[0],r=a[1],u=Object(l.useState)("1000"),b=Object(c.a)(u,2),d=b[0],v=b[1],f=Object(l.useState)("1"),p=Object(c.a)(f,2),E=p[0],g=p[1],h=Object(l.useState)((new Date).toISOString().substr(0,10)),y=Object(c.a)(h,2),O=y[0],j=y[1],w=Object(l.useState)({table:null,added:null,size:null,start:null}),S=Object(c.a)(w,2),I=S[0],k=S[1],N=Object(l.useState)([]),z=Object(c.a)(N,2),C=z[0],D=z[1],M=function(){var e={table:null,added:null,size:null},a=!1;if(t&&!s(t)&&(e.table="Invalid format",a=!0),d&&!s(d)&&(e.added="Invalid format",a=!0),E&&!s(E)&&(e.size="Invalid format",a=!0),k(e),!a){var l=new Date(O).getMonth(),n=new Date(O).getFullYear(),r=new Array(60).fill(0).map((function(e,a){var r="00".concat((l+a)%12+1).substr(-2),u=n+Math.floor((l+a)/12),c=30.4*(a+1);return{name:new Date(Date.UTC(u,r)).toLocaleDateString("en-EN",{year:"numeric",month:"long"}),size:1024*+E+ +d*+t*.0012*c}}));D(r)}};return Object(l.useEffect)(M,[E,t,d,O]),Object(l.useEffect)(M,[]),n.a.createElement("div",{className:"App"},n.a.createElement("div",{className:"Form"},n.a.createElement(i,{type:"select",label:"Number of table",options:[{value:10,label:"10"},{value:20,label:"20"},{value:50,label:"50"},{value:100,label:"100"}],value:t,onChange:r,error:I.table}),n.a.createElement(i,{type:"select",label:"Number of rows added each day",options:[{value:1e3,label:"1000"},{value:1e4,label:"10k"},{value:1e5,label:"100k"},{value:1e6,label:"1M"},{value:1e7,label:"10M"}],value:d,onChange:v,error:I.added}),n.a.createElement(i,{type:"select",label:"Database size",options:[{value:1,label:"1Gb"},{value:10,label:"10Gb"},{value:100,label:"100Gb"},{value:1024,label:"1Tb"},{value:1e4,label:"100Tb"}],value:E,onChange:g,error:I.size}),n.a.createElement(i,{type:"date",label:"Start estimation",value:O,onChange:j,error:I.start})),n.a.createElement(o.b,{width:840,height:600,data:C,margin:{top:10,right:30,left:30,bottom:0}},n.a.createElement(o.c,{strokeDasharray:"3 3"}),n.a.createElement(o.e,{dataKey:"name"}),n.a.createElement(o.f,{tickFormatter:m}),n.a.createElement(o.d,{formatter:function(e){return[m(e),"Database size"]}}),n.a.createElement(o.a,{type:"monotone",dataKey:"size",stroke:"#67527A",fill:"#896da1"})))}),null),document.getElementById("dbsize"))}},[[158,1,2]]]);
//# sourceMappingURL=main.eba07f42.chunk.js.map