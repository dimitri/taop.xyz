(window.webpackJsonppggraph=window.webpackJsonppggraph||[]).push([[0],{158:function(e,a,t){e.exports=t(342)},340:function(e,a,t){},341:function(e,a,t){},342:function(e,a,t){"use strict";t.r(a);var l=t(1),n=t.n(l),r=t(47),u=t.n(r),c=t(19),o=t(18),i=(t(340),function(e){var a=e.label,t=e.type,l=void 0===t?"number":t,r=e.value,u=e.options,c=e.onChange,o=e.error,i=e.suffix,m=n.a.createElement("input",{className:"FormItemInputText",type:l,value:r,onChange:function(e){return c(e.target.value)}});return"radio"===l&&(m=u.map((function(e){return n.a.createElement(n.a.Fragment,null,n.a.createElement("input",{key:e,type:"radio",value:e,onChange:function(){return c(e)},checked:e===r}),e)}))),"select"===l&&(m=n.a.createElement("select",{className:"FormItemSelect",onChange:function(e){return c(e.target.value)},value:r},u.map((function(e){return n.a.createElement("option",{value:e.value,key:e.value},e.label)})))),n.a.createElement("div",{className:"FormItem"},n.a.createElement("div",{className:"FormItemInput"},n.a.createElement("label",null,a),m,i&&n.a.createElement("span",{className:"suffix"},i)),o&&n.a.createElement("div",null,o))}),m=(t(341),function(e){return e===String(+e)}),s=function(e){var a="".concat(Math.round(10*e)/10,"Mb");return e>1073741824?a="".concat(Math.round(e/1024/1024/1024*10)/10,"Pt"):e>1048576?a="".concat(Math.round(e/1024/1024*10)/10,"Tb"):e>1024&&(a="".concat(Math.round(e/1024*10)/10,"Gb")),a};u.a.render(n.a.createElement((function(){var e=Object(l.useState)("10"),a=Object(c.a)(e,2),t=a[0],r=a[1],u=Object(l.useState)("1000"),b=Object(c.a)(u,2),d=b[0],v=b[1],f=Object(l.useState)("1"),p=Object(c.a)(f,2),g=p[0],E=p[1],h=Object(l.useState)((new Date).toISOString().substr(0,10)),y=Object(c.a)(h,2),O=y[0],j=y[1],w=Object(l.useState)({table:null,added:null,size:null,start:null}),S=Object(c.a)(w,2),D=S[0],I=S[1],k=Object(l.useState)([]),M=Object(c.a)(k,2),N=M[0],z=M[1],C=function(){var e={table:null,added:null,size:null},a=!1;if(t&&!m(t)&&(e.table="Invalid format",a=!0),d&&!m(d)&&(e.added="Invalid format",a=!0),g&&!m(g)&&(e.size="Invalid format",a=!0),I(e),!a){var l=new Date(O),n=l.getDate(),r=l.getMonth(),u=l.getFullYear(),c=new Array(60).fill(0).map((function(e,a){var c=(r+a+1)%12,o=u+Math.floor((r+a+1)/12),i=new Date(o,c+1,0).getDate(),m=Math.min(n,i),s=new Date(Date.UTC(o,c,m)),b=s.toLocaleDateString("en-EN",{year:"numeric",month:"long",day:"numeric"}),v=(s.getTime()-l.getTime())/24/3600/1e3;return{name:b,size:1024*+g+ +d*+t*.0012*v}}));z(c)}};return Object(l.useEffect)(C,[g,t,d,O]),Object(l.useEffect)(C,[]),n.a.createElement("div",{className:"App"},n.a.createElement("div",{className:"Form"},n.a.createElement(i,{type:"select",label:"Number of table",options:[{value:10,label:"10"},{value:20,label:"20"},{value:50,label:"50"},{value:100,label:"100"}],value:t,onChange:r,error:D.table}),n.a.createElement(i,{type:"select",label:"Number of rows added each day",options:[{value:1e3,label:"1000"},{value:1e4,label:"10k"},{value:1e5,label:"100k"},{value:1e6,label:"1M"},{value:1e7,label:"10M"}],value:d,onChange:v,error:D.added}),n.a.createElement(i,{type:"select",label:"Database size",options:[{value:1,label:"1Gb"},{value:10,label:"10Gb"},{value:100,label:"100Gb"},{value:1024,label:"1Tb"},{value:1e4,label:"100Tb"}],value:g,onChange:E,error:D.size}),n.a.createElement(i,{type:"date",label:"Start estimation",value:O,onChange:j,error:D.start})),n.a.createElement(o.b,{width:840,height:600,data:N,margin:{top:10,right:30,left:30,bottom:0}},n.a.createElement(o.c,{strokeDasharray:"3 3"}),n.a.createElement(o.e,{dataKey:"name"}),n.a.createElement(o.f,{tickFormatter:s}),n.a.createElement(o.d,{formatter:function(e){return[s(e),"Database size"]}}),n.a.createElement(o.a,{type:"monotone",dataKey:"size",stroke:"#67527A",fill:"#896da1"})))}),null),document.getElementById("dbsize"))}},[[158,1,2]]]);
//# sourceMappingURL=main.17f43a09.chunk.js.map