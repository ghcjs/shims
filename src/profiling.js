// Used definitions: GHCJS_TRACE_PROF, GHCJS_ASSERT_PROF and GHCJS_PROF_GUI

#ifdef GHCJS_ASSERT_PROF
function assert(condition, message) {
    if (!condition) {
        console.trace(message || "Assertion failed");
    }
}
#define ASSERT(args...) assert(args)
#else
#define ASSERT(args...)
#endif

#ifdef GHCJS_TRACE_PROF
#define TRACE(args...) h$log(args)
#else
#define TRACE(args...)
#endif


var h$ccList  = [];
var h$ccsList = [];

var h$CCUnique = 0;
/** @constructor */
function h$CC(label, module, srcloc, isCaf) {
  //TRACE("h$CC(", label, ", ", module, ", ", srcloc, ", ", isCaf, ")");
  this.label     = label;
  this.module    = module;
  this.srcloc    = srcloc;
  this.isCaf     = isCaf;
  this._key      = ++h$CCUnique;
  this.memAlloc  = 0;
  this.timeTicks = 0;
  h$ccList.push(this);
}


var h$CCSUnique = 0;
/** @constructor */
function h$CCS(parent, cc) {
  //TRACE("h$mkCCS(", parent, cc, ")");
  if (parent !== null && parent.consed.has(cc)) {
    return (parent.consed.get(cc));
  }
  this.consed = new h$Map();
  this.cc     = cc;
  this._key   = ++h$CCSUnique;
  if (parent) {
    this.root      = parent.root;
    this.depth     = parent.depth + 1;
    this.prevStack = parent;
    parent.consed.put(cc,this);
  } else {
    this.root      = this;
    this.depth     = 0;
    this.prevStack = null;
  }
  this.prevStack      = parent;
  this.sccCount       = 0;
  this.timeTicks      = 0;
  this.memAlloc       = 0;
  this.retained       = 0; // retained object count, counted in last GC cycle
  this.inheritedRetain= 0; // inherited retained counts
  this.inheritedTicks = 0;
  this.inheritedAlloc = 0;

#ifdef GHCJS_PROF_GUI
  // for plotting retained obj counts with flot
  this.plotData       = [0];
  // has non-zero allocation counts in last few cycles.
  // (e.g. it's worth showing)
  this.active         = true;
  // checkbox status
  this.hidden         = false;
  // if hidden is true, then it's never shown
  // if hidden is false, then it's shown only when it's active
#endif

  h$ccsList.push(this);  /* we need all ccs for statistics, not just the root ones */
}


//
// Built-in cost-centres and stacks
//

var h$CC_MAIN       = new h$CC("MAIN", "MAIN", "<built-in>", false);
var h$CC_SYSTEM     = new h$CC("SYSTEM", "SYSTEM", "<built-in>", false);
var h$CC_GC         = new h$CC("GC", "GC", "<built-in>", false);
var h$CC_OVERHEAD   = new h$CC("OVERHEAD_of", "PROFILING", "<built-in>", false);
var h$CC_DONT_CARE  = new h$CC("DONT_CARE", "MAIN", "<built-in>", false);
var h$CC_PINNED     = new h$CC("PINNED", "SYSTEM", "<built-in>", false);
var h$CC_IDLE       = new h$CC("IDLE", "IDLE", "<built-in>", false);
var h$CAF_cc        = new h$CC("CAF", "CAF", "<built-in>", false);

var h$CCS_MAIN      = new h$CCS(null, h$CC_MAIN);

var h$CCS_SYSTEM    = new h$CCS(h$CCS_MAIN, h$CC_SYSTEM);
var h$CCS_GC        = new h$CCS(h$CCS_MAIN, h$CC_GC);
var h$CCS_OVERHEAD  = new h$CCS(h$CCS_MAIN, h$CC_OVERHEAD);
var h$CCS_DONT_CARE = new h$CCS(h$CCS_MAIN, h$CC_DONT_CARE);
var h$CCS_PINNED    = new h$CCS(h$CCS_MAIN, h$CC_PINNED);
var h$CCS_IDLE      = new h$CCS(h$CCS_MAIN, h$CC_IDLE);
var h$CAF           = new h$CCS(h$CCS_MAIN, h$CAF_cc);


//
// Cost-centre entries, SCC
//

#ifdef GHCJS_TRACE_PROF
function h$ccsString(ccs) {
  var labels = [];
  do {
    labels.push(ccs.cc.module+'.'+ccs.cc.label+' '+ccs.cc.srcloc);
    ccs = ccs.prevStack;
  } while (ccs !== null);
  return '[' + labels.reverse().join(', ') + ']';
}
#endif

function h$pushRestoreCCS() {
    TRACE("push restoreccs:" + h$ccsString(h$currentThread.ccs));
    if(h$stack[h$sp] !== h$setCcs_e) {
        h$sp += 2;
        h$stack[h$sp-1] = h$currentThread.ccs;
        h$stack[h$sp]   = h$setCcs_e;
    }
}

function h$restoreCCS(ccs) {
    TRACE("restoreccs from:", h$ccsString(h$currentThread.ccs));
    TRACE("             to:", h$ccsString(ccs));
    h$currentThread.ccs = ccs;
}

function h$enterThunkCCS(ccsthunk) {
  ASSERT(ccsthunk !== null && ccsthunk !== undefined, "ccsthunk is null or undefined");
  TRACE("entering ccsthunk:", h$ccsString(ccsthunk));
  h$currentThread.ccs = ccsthunk;
}

function h$enterFunCCS(ccsapp, // stack at call site
                       ccsfn   // stack of function
                       ) {
  ASSERT(ccsapp !== null && ccsapp !== undefined, "ccsapp is null or undefined");
  ASSERT(ccsfn  !== null && ccsfn  !== undefined, "ccsfn is null or undefined");
  TRACE("ccsapp:", h$ccsString(ccsapp));
  TRACE("ccsfn:", h$ccsString(ccsfn));

  // common case 1: both stacks are the same
  if (ccsapp === ccsfn) {
    return;
  }

  // common case 2: the function stack is empty, or just CAF
  if (ccsfn.prevStack === h$CCS_MAIN) {
    return;
  }

  // FIXME: do we need this?
  h$currentThread.ccs = h$CCS_OVERHEAD;

  // common case 3: the stacks are completely different (e.g. one is a
  // descendent of MAIN and the other of a CAF): we append the whole
  // of the function stack to the current CCS.
  if (ccsfn.root !== ccsapp.root) {
    h$currentThread.ccs = h$appendCCS(ccsapp, ccsfn);
    return;
  }

  // uncommon case 4: ccsapp is deeper than ccsfn
  if (ccsapp.depth > ccsfn.depth) {
    var tmp = ccsapp;
    var dif = ccsapp.depth - ccsfn.depth;
    for (var i = 0; i < dif; i++) {
      tmp = tmp.prevStack;
    }
    h$currentThread.ccs = h$enterFunEqualStacks(ccsapp, tmp, ccsfn);
    return;
  }

  // uncommon case 5: ccsfn is deeper than CCCS
  if (ccsfn.depth > ccsapp.depth) {
    h$currentThread.ccs = h$enterFunCurShorter(ccsapp, ccsfn, ccsfn.depth - ccsapp.depth);
    return;
  }

  // uncommon case 6: stacks are equal depth, but different
  h$currentThread.ccs = h$enterFunEqualStacks(ccsapp, ccsapp, ccsfn);
}

function h$appendCCS(ccs1, ccs2) {
  if (ccs1 === ccs2) {
    return ccs1;
  }

  if (ccs2 === h$CCS_MAIN || ccs2.cc.isCaf) {
    // stop at a CAF element
    return ccs1;
  }

  return h$pushCostCentre(h$appendCCS(ccs1, ccs2.prevStack), ccs2.cc);
}

function h$enterFunCurShorter(ccsapp, ccsfn, n) {
  if (n === 0) {
    ASSERT(ccsapp.length === ccsfn.length, "ccsapp.length !== ccsfn.length");
    return h$enterFunEqualStacks(ccsapp, ccsapp, ccsfn);
  } else {
    ASSERT(ccsfn.depth > ccsapp.depth, "ccsfn.depth <= ccsapp.depth");
    return h$pushCostCentre(h$enterFunCurShorter(ccsapp, ccsfn.prevStack, n-1), ccsfn.cc);
  }
}

function h$enterFunEqualStacks(ccs0, ccsapp, ccsfn) {
  ASSERT(ccsapp.depth === ccsfn.depth, "ccsapp.depth !== ccsfn.depth");
  if (ccsapp === ccsfn) return ccs0;
  return h$pushCostCentre(h$enterFunEqualStacks(ccs0, ccsapp.prevStack, ccsfn.prevStack), ccsfn.cc);
}

function h$pushCostCentre(ccs, cc) {
  TRACE("pushing cost centre", cc.label, "to", h$ccsString(ccs));
  if (ccs === null) {
    // when is ccs null?
    return new h$CCS(ccs, cc);
  }

  if (ccs.cc === cc) {
    return ccs;
  } else {
    var temp_ccs = h$checkLoop(ccs, cc);
    if (temp_ccs !== null) {
      return temp_ccs;
    }
    return new h$CCS(ccs, cc);
  }
}

function h$checkLoop(ccs, cc) {
  while (ccs !== null) {
    if (ccs.cc === cc)
      return ccs;
    ccs = ccs.prevStack;
  }
  return null;
}

//
// Emulating pointers for cost-centres and cost-centre stacks
//

var h$ccsCC_offset       = 4;  // ccs->cc
var h$ccsPrevStackOffset = 8;  // ccs->prevStack

var h$ccLabel_offset     = 4;  // cc->label
var h$ccModule_offset    = 8;  // cc->module
var h$ccsrcloc_offset    = 12; // cc->srcloc

function h$buildCCPtr(o) {
  // last used offset is 12, so we need to allocate 20 bytes
  ASSERT(o !== null);
  var cc = h$newByteArray(20);
#ifdef GHCJS_TRACE_PROF
  cc.myTag = "cc pointer";
#endif
  cc.arr = [];
  cc.arr[h$ccLabel_offset]  = [h$encodeUtf8(o.label),   0];
  cc.arr[h$ccModule_offset] = [h$encodeUtf8(o.module),  0];
  cc.arr[h$ccsrcloc_offset] = [h$encodeUtf8(o.srcloc),  0];
  return cc;
}

function h$buildCCSPtr(o) {
  ASSERT(o !== null);
  // last used offset is 8, allocate 16 bytes
  var ccs = h$newByteArray(16);
#ifdef GHCJS_TRACE_PROF
  ccs.myTag = "ccs pointer";
#endif
  ccs.arr = [];
  if (o.prevStack !== null) {
    ccs.arr[h$ccsPrevStackOffset] = [h$buildCCSPtr(o.prevStack), 0];
  }
  // FIXME: we may need this part:
  // else {
  //   ccs.arr[h$ccsPrevStackOffset] = [null, 0];
  // }
  ccs.arr[h$ccsCC_offset] = [h$buildCCPtr(o.cc), 0];
  return ccs;
}

//
// Updating and printing retained obj count of stacks, to be used in GC scan
//

// reset retained object counts
function h$resetRetained() {
  for (var i = 0; i < h$ccsList.length; i++) {
    var ccs = h$ccsList[i];
    ccs.retained = 0;
    ccs.inheritedRetain = 0;
  }
}

function h$updRetained(obj) {
  // h$gc visits all kinds of objects, not just heap objects
  // so we're checking if the object has cc field
  // assuming we added cc field to every heap object, this should work correctly
  if (obj.cc !== undefined) {
    ASSERT(obj.cc.retained !== null && obj.cc.retained !== undefined);
    obj.cc.retained++;
  }
}

function h$inheritRetained(ccs) {
  var consedCCS = ccs.consed.values();
  for (var i = 0; i < consedCCS.length; i++) {
    h$inheritRetained(consedCCS[i]);
    ccs.inheritedRetain += consedCCS[i].inheritedRetain;
  }
  ccs.inheritedRetain += ccs.retained;
}

function h$printRetainedInfo() {
  h$inheritRetained(h$CCS_MAIN);

  for (var i = 0; i < h$ccsList.length; i++) {
    var ccs = h$ccsList[i];
    if (ccs.inheritedRetain !== 0) {
      console.log(h$ccsString(ccs));
    }
  }
  console.log("END");
}

#ifdef GHCJS_PROF_GUI
// Profiling GUI

// There's this problem with adding new data to Chart.js:
// Let's say in the beginning I have this top-level CCSs:
//   - CCS1
//   - CCS2
// Later a CC is pushed to CCS1 and we had:
//   - CCS1
//   - - CCS1.CC
//   - CCS2
//  Now I have to add `CCS1.CC` dataset to the chart and then to update
//  I need to know what index to put `CCS1.CC`s data in update array.
//  h$lineIdxs keeps track of this.
//  Note that we don't need to save top-level CCSs indexes.
h$lineIdxs = new h$Map();

function h$includePolymer() {
  var platformScript = document.createElement("script");
  platformScript.setAttribute("src", "polymer-components/platform/platform.js");

  var progressLink = document.createElement("link");
  progressLink.setAttribute("rel", "import");
  progressLink.setAttribute("href", "polymer-components/paper-progress/paper-progress.html");

  var overlayLink = document.createElement("link");
  overlayLink.setAttribute("rel", "import");
  overlayLink.setAttribute("href", "polymer-components/core-overlay/core-overlay.html");

  var head = document.getElementsByTagName("head")[0];
  head.appendChild(platformScript);
  head.appendChild(progressLink);
  head.appendChild(overlayLink);
}

function h$includeChartjs(callback) {
  var chartjs = document.createElement("script");
  chartjs.setAttribute("src", "Chart.js");
  document.getElementsByTagName("head")[0].appendChild(chartjs);
  chartjs.addEventListener("load", callback, false);
}

function h$addCSS() {
  var style = document.createElement("style");

  var css =
    "\
      #ghcjs-prof-container {\
        height: 80%;\
        overflow: scroll;\
        height: 300px;\
      }\
\
      .ghcjs-prof-column-left { width: 20%; }\
      .ghcjs-prof-column-center { width: 5%; }\
      .ghcjs-prof-column-right { width: 70%; }\
\
      .ghcjs-prof-progress {\
        padding: 10px;\
        display: block;\
        width: 100%;\
      }\
\
      .ghcjs-prof-progress.pink::shadow #activeProgress {\
        background-color: #e91e63;\
      }\
\
      .ghcjs-prof-progress.pink::shadow #secondaryProgress {\
        background-color: #f8bbd0;\
      }\
\
      #ghcjs-prof-overlay {\
        box-sizing: border-box;\
        -moz-box-sizing: border-box;\
        font-family: Arial, Helvetica, sans-serif;\
        font-size: 13px;\
        -webkit-user-select: none;\
        -moz-user-select: none;\
        overflow: hidden;\
        background: white;\
        padding: 30px 42px;\
        outline: 1px solid rgba(0,0,0,0.2);\
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);\
        width: 80%;\
      }\
    ";

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  document.getElementsByTagName("head")[0].appendChild(style);
}

function h$addOverlayDOM() {
  var overlay = document.createElement("core-overlay");
  overlay.setAttribute("id", "ghcjs-prof-overlay");

  var h2 = document.createElement("h2");
  h2.appendChild(document.createTextNode("Retained object counts per CSS"));
  overlay.appendChild(h2);

  var div = document.createElement("div");
  div.setAttribute("flex", "");
  div.setAttribute("id", "ghcjs-prof-container");

  var ul = document.createElement("ul");
  ul.setAttribute("flex", "");
  ul.setAttribute("id", "ghcjs-prof-container-ul");

  div.appendChild(ul);
  overlay.appendChild(div);

  var button = document.createElement("button");
  button.setAttribute("core-overlay-toggle", "");
  button.appendChild(document.createTextNode("Close"));
  overlay.appendChild(button);

  document.getElementsByTagName("body")[0].appendChild(overlay);
}

// Return id of the div that shows info of given CCS
function h$mkDivId(ccs) {
  return (ccs.cc.module + '-' + ccs.cc.label).split('.').join('-');
}

// String representation of a CCS
function h$mkCCSLabel(ccs) {
  return ccs.cc.module + '.' + ccs.cc.label + ' ('  + ccs.cc.srcloc + ')';
}

function h$mkCCSDOM(ccs) {
  var ccsLabel = h$mkCCSLabel(ccs);
  var rowDivId = h$mkDivId(ccs);

  var leftDiv  = document.createElement("div");
  leftDiv.setAttribute("class", "ghcjs-prof-column-left");
  leftDiv.appendChild(document.createTextNode(ccsLabel));

  var midDiv   = document.createElement("div");
  midDiv.setAttribute("class", "ghcjs-prof-column-center");
  midDiv.appendChild(document.createTextNode("0"));

  var rightDiv = document.createElement("div");
  rightDiv.setAttribute("class", "ghcjs-prof-column-right");
  var bar = document.createElement("paper-progress");
  bar.setAttribute("value", "0");
  bar.setAttribute("min", "0");
  bar.setAttribute("max", "1000");
  bar.setAttribute("class", "ghcjs-prof-progress");
  rightDiv.appendChild(bar);

  ccs.domElems = {
    leftDiv: leftDiv,
    midDiv: midDiv,
    rightDiv: rightDiv,
    bar: bar
  };

  var rowDiv = document.createElement("div");
  rowDiv.setAttribute("layout", "");
  rowDiv.setAttribute("horizontal", "");

  rowDiv.appendChild(leftDiv);
  rowDiv.appendChild(midDiv);
  rowDiv.appendChild(rightDiv);

  var ul = document.createElement("ul");

  var div = document.createElement("div");
  div.setAttribute("layout", "");
  div.setAttribute("vertical", "");
  div.setAttribute("id", rowDivId);

  div.appendChild(rowDiv);
  div.appendChild(ul);

  return div;
}

function h$mkCCSSettingDOM(ccs) {
  var settingLi = document.createElement("li");
  var settingCheckbox = document.createElement("input");
  var settingCheckboxLabel = document.createElement("label");
  settingCheckbox.setAttribute("type", "checkbox");
  settingCheckbox.setAttribute("id", h$mkDivId(ccs) + "-enabled");
  settingCheckbox.setAttribute("checked", "");
  settingCheckboxLabel.appendChild(settingCheckbox);
  settingCheckboxLabel.appendChild(document.createTextNode(h$mkCCSLabel(ccs)));
  settingCheckbox.onchange = function () {
    ccs.hidden = !this.checked;
    h$showOrHideCCS(ccs);
    h$chart.update();
  }
  settingLi.appendChild(settingCheckboxLabel);
  return settingLi;
}

function h$addCCSDOM() {
  var ul = document.getElementById("ghcjs-prof-container-ul");
  for (var i = 0; i < h$ccsList.length; i++)
    ul.appendChild(h$mkCCSDOM(h$ccsList[i]));
}

function h$updateDOMs() {
  for (var i = 0; i < h$ccsList.length; i++) {
    var ccs = h$ccsList[i];
    if (ccs.prevStack === null || ccs.prevStack === undefined) {
      h$inheritRetained(ccs);
      ccs.domElems.midDiv.innerHTML = ccs.inheritedRetain;
      ccs.domElems.bar.setAttribute("value", ccs.inheritedRetain);
    }
  }

  var stack = [];
  for (var ccsIdx = 0; ccsIdx < h$ccsList.length; ccsIdx++) {
    var ccs = h$ccsList[ccsIdx];
    if (ccs.prevStack === null || ccs.prevStack === undefined) {

      // push initial values to the stack
      for (var j = 0; j < ccs.consed.values().length; j++)
        stack.push(ccs.consed.values()[j]);

      var val = stack.pop();

      while (val !== undefined) {
        // push children stack frames to the stack
        for (var j = 0; j < val.consed.values().length; j++)
          stack.push(val.consed.values()[j]);

        var divId = h$mkDivId(val);
        var div   = document.getElementById(divId);

        if (div === null) {
          var div = h$mkCCSDOM(val);
          var parentDivId = h$mkDivId(val.prevStack);
          var parentDiv = document.getElementById(parentDivId);
          var ul = parentDiv.children[parentDiv.children.length - 1];
          ul.appendChild(h$mkCCSDOM(val));
        } else {
          val.domElems.midDiv.innerHTML = val.inheritedRetain;
          val.domElems.bar.setAttribute("value", val.inheritedRetain);
        }

        // reload current value
        val = stack.pop();
      }
    }
  }

  var maxRetained = h$sortDOMs(document.getElementById("ghcjs-prof-container-ul"));
  // scale the bars
  for (var ccsIdx = 0; ccsIdx < h$ccsList.length; ccsIdx++) {
    var ccs = h$ccsList[ccsIdx];
    ccs.domElems.rightDiv.children[0].setAttribute("max", maxRetained);
  }
}

function h$sortDOMs(parent) {
  // maximum number of retained objs, to be used in scaling the bars
  var maxRetained = 0;

  var items = [];
  var children = parent.children;
  while (parent.firstChild)
      items.push(parent.removeChild(parent.firstChild));

  // sort child nodes first
  for (var i = 0; i < items.length; i++)
    h$sortDOMs(items[i].children[1]);

  items.sort(function (a, b) {
    var midDivA = a.children[0].children[1];
    var midDivB = b.children[0].children[1];
    return (parseInt(midDivB.innerHTML) - parseInt(midDivA.innerHTML));
  });

  for (var i = 0; i < items.length; i++) {
    var retained = parseInt(items[i].children[0].children[1].innerHTML);
    if (retained > maxRetained)
      maxRetained = retained;
    parent.appendChild(items[i]);
  }

  return maxRetained;
}

function h$toggleProfGUI() {
  document.getElementById("ghcjs-prof-overlay").toggle();
}

function h$getRandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

var h$chart;
function h$createChart() {
  var chartDiv = document.createElement("div");
  chartDiv.setAttribute("horizontal", "");
  chartDiv.setAttribute("layout", "");

  // wrap the canvas with a layer of "div"
  var chartDiv1 = document.createElement("div");
  var chartCanvas = document.createElement("canvas");
  chartCanvas.setAttribute("width", 800);
  chartCanvas.setAttribute("height", 500);
  chartCanvas.setAttribute("id", "ghcjs-prof-chart");
  chartDiv1.appendChild(chartCanvas);
  chartDiv.appendChild(chartDiv1);

  var settingsDiv = document.createElement("div");
  var settingsUl = document.createElement("ul");
  settingsUl.setAttribute("id", "ghcjs-prof-settings-ul");
  // add initial CCS settings
  for (var ccsIdx = 0; ccsIdx < h$ccsList.length; ccsIdx++) {
    var ccs = h$ccsList[ccsIdx];
    if (ccs.prevStack === null || ccs.prevStack === undefined)
      settingsUl.appendChild(h$mkCCSSettingDOM(ccs));
  }
  settingsDiv.appendChild(settingsUl);
  chartDiv.appendChild(settingsDiv);

  document.getElementById("ghcjs-prof-container").appendChild(chartDiv);

  var ctx = chartCanvas.getContext("2d");
  var initialData = {
    labels: [],
    datasets: []
  };

  var options = {
    // Boolean - Whether to animate the chart
    animation: false,
    // Boolean - Whether grid lines are shown across the chart
    scaleShowGridLines : true,
    // String - Colour of the grid lines
    scaleGridLineColor : "rgba(0,0,0,.05)",
    // Number - Width of the grid lines
    scaleGridLineWidth : 1,
    // Boolean - Whether the line is curved between points
    bezierCurve : false,
    // Boolean - Whether to show a dot for each point
    pointDot : false,
    // Number - amount extra to add to the radius to cater for hit detection outside the drawn point
    pointHitDetectionRadius : 20,
    // Boolean - Whether to show a stroke for datasets
    datasetStroke : false,
    // Number - Pixel width of dataset stroke
    datasetStrokeWidth : 2,
    // Boolean - Whether to fill the dataset with a colour
    datasetFill : false,
    // String - A legend template
    legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].lineColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
    // String - Tooltip template
    multiTooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>",
    tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>"
  };

  h$chart = new Chart(ctx).Line(initialData, options);

  // load initial data
  for (var ccsIdx = 0; ccsIdx < h$ccsList.length; ccsIdx++) {
    var ccs = h$ccsList[ccsIdx];
    if (ccs.prevStack === null || ccs.prevStack === undefined) {
      ccs.plotDrawn = true;
      var datasetColor = h$getRandomColor();
      var dataset = {
        label: h$mkCCSLabel(ccs),
        data: [0],
        fillColor: datasetColor,
        strokeColor: datasetColor,
        pointColor: datasetColor,
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: datasetColor
      };
      h$chart.addDataset(dataset);
    }
  }
}

function h$updateChart() {
  // because of the order callbacks are called, in first iteration
  // h$chart is sometimes undefined. in that case we're just waiting until
  // h$chart is created.
  if (h$chart === undefined)
    return;

  // how many points for a line to show in the chart
  var points        = 10;
  // number of top-level CCSs
  var toplevelCCS   = 0;
  // new data to push to the chart
  var newData       = [];

  // add data for top-level CCSs and count top-level CCSs
  for (var ccsIdx = 0; ccsIdx < h$ccsList.length; ccsIdx++) {
    var ccs = h$ccsList[ccsIdx];
    if (ccs.prevStack === null || ccs.prevStack === undefined) {
      ++toplevelCCS; // TODO: no need to count this in every cycle
      // assume inherited retained counts are calculated
      ccs.plotData.push(ccs.inheritedRetain);
      newData.push(ccs.inheritedRetain);
    }
  }

  // second iteration, process children stacks.

  // use a stack to make sure parent CCS is processed before children
  // TODO: maybe replace this with recursion?
  var stack = [];

  for (var ccsIdx = 0; ccsIdx < h$ccsList.length; ccsIdx++) {
    var ccs = h$ccsList[ccsIdx];
    if (ccs.prevStack === null || ccs.prevStack === undefined) {
      // top-level CCS, push it's children to the stack manually
      var consed = ccs.consed.values();
      for (var j = 0; j < consed.length; j++)
        stack.push(consed[j]);
    }
  }

  var val = stack.pop();
  while (val !== undefined) {

    // push children stack frames to the stack
    var consed = val.consed.values();
    for (var j = 0; j < consed.length; j++)
      stack.push(consed[j]);

    // index of cost-centre in the data array
    var idx;

    if (h$lineIdxs.has(val)) {
      // we already saw this CCS before
      idx = h$lineIdxs.get(val);
    } else {
      // we're seeing this CCS for the first time
      // generate CCS idx and add it to h$lineIdxs
      idx = h$lineIdxs.size();
      h$lineIdxs.put(val, idx);
      // we need to fill new CCS data with zeroes
      var data = [];
      for (var i = 0; i < h$chart.datasets[0].points.length; i++)
        data.push(0);
      // generate dataset
      var datasetColor = h$getRandomColor();
      var newDataset = {
        label: h$mkCCSLabel(val),
        data: data,
        fillColor: datasetColor,
        strokeColor: datasetColor,
        pointColor: datasetColor,
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: datasetColor
      };
      // add dataset to the chart
      h$chart.addDataset(newDataset);

      // add checkbox for the CCS
      document.getElementById("ghcjs-prof-settings-ul").appendChild(h$mkCCSSettingDOM(val));
    }
    newData[toplevelCCS + idx] = val.inheritedRetain;

    // reload current value
    val = stack.pop();
  }

  ASSERT(h$chart.datasets.length === h$ccsList.length);
  ASSERT(newData.length === h$ccsList.length);

  if (h$chart !== undefined) {
    // FIXME: For some reason, in first iteration h$chart is undefined
    h$chart.addData(newData);
    while (h$chart.datasets[0].points.length > points) {
      h$chart.removeData();
    }
    // hide lines with 0 allocations for last `points` cycles
    for (var ccsIdx = 0; ccsIdx < h$ccsList.length; ccsIdx++) {
      var ccs = h$ccsList[ccsIdx];
      if (ccs.prevStack === null || ccs.prevStack === undefined) {
        ccs.active  = false;

        // number of points to draw
        var ps    = Math.min(ccs.plotData.length, points);
        // first point to draw
        var first = ccs.plotData.length - ps;
        // last point to draw
        var last  = first + ps - 1;

        for (var i = first; i <= last; i++) {
          if (ccs.plotData[i] !== 0) {
            ccs.active = true;
            break;
          }
        }
      }
      h$showOrHideCCS(ccs);
    }
    h$chart.update();
  }
}

function h$showOrHideCCS(ccs) {
  if (!ccs.hidden && ccs.active) {
    h$chart.showDataset(h$mkCCSLabel(ccs));
  } else {
    h$chart.hideDataset(h$mkCCSLabel(ccs));
  }
}

document.addEventListener("DOMContentLoaded", function () {
  h$includePolymer();
  h$includeChartjs(h$createChart);
  h$addCSS();
  h$addOverlayDOM();
  h$addCCSDOM();
});

#endif
