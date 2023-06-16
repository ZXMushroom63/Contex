var mouseTracker = {
  x: 0,
  y: 0,
  cX: 0,
  cY: 0,
  element: undefined,
};
var inspector = {
  element: document.documentElement,
  window: undefined,
  launch: function launchInspector() {
    function setTitle(title, window) {
      var t = document.createElement("title");
      t.innerText = title;
      window.document.head.append(t);
    }
    function loadStyles(win) {
      var s = document.createElement("style");
      s.innerHTML = `<style>
          * {box-sizing: border-box}
          body, html {
            height: 100%;
            margin: 0;
            font-family: Arial;
          }
          .tablink {
            background-color: #555;
            color: white;
            float: left;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 7px 8px;
            font-size: 17px;
            min-width: 32px;
            border-right: 1px solid white;
          }
          .tablink:hover {
            background-color: #777;
          }
          .tabcontent {
            color: black;
            background-color: white;
            display: none;
            padding: 100px 20px;
            height: 100%;
          }`;
      win.document.head.append(s);
    }
    function insertMarker(win) {
      var m = document.createElement("div");
      m.id = "marker";
      m.style = "display:none;";
      win.document.body.append(m);
    }
    function insertPager(win) {
      var s = document.createElement("script");
      s.innerHTML = `function openPage(pageName,elmnt) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
              tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablink");
            for (i = 0; i < tablinks.length; i++) {
              tablinks[i].style.backgroundColor = "";
            }
            document.getElementById(pageName).style.display = "block";
            elmnt.style.backgroundColor = "darkgrey";
          }`;
      win.document.body.append(s);
    }
    function makeCategory(name, data, win) {
      var btn = document.createElement("button");
      btn.classList.add("tablink");
      btn.innerText = name;
      btn.setAttribute(
        "onclick",
        `openPage('${btoa(name).replaceAll("=", "")}', this)`
      );
      btn.addEventListener("click", data.click || (() => {}));
      win.document.querySelector("#marker").before(btn);
      var content = document.createElement("div");
      content.classList.add("tabcontent");
      content.id = btoa(name).replaceAll("=", "");
      content.append(...(data?.contents || []));
      win.document.body.append(content);
    }
    this.window = window.open();
    this.window["contex_page"] = window;
    setTitle("Inspector", this.window);
    loadStyles(this.window);
    insertMarker(this.window);
    insertPager(this.window);
    makeCategory(
      "Main",
      {
        contents: [],
      },
      this.window
    );
    return this.window;
  },
};
var contexOpenListeners = [];
function contexGetSelection() {
  var text = "";
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type != "Control") {
    text = document.selection.createRange().text;
  }
  return text;
}
async function contexShareImage(url, filename) {
  const response = await fetch(url);
  const blob = await response.blob();
  const filesArray = [
    new File([blob], filename, {
      type: "image/jpeg",
      lastModified: new Date().getTime(),
    }),
  ];
  const shareData = {
    files: filesArray,
  };
  navigator.share(shareData);
}
function contexDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}
function contexTextDownload(text, filename) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);
  element.click();
}
function updateMouseTracker(event) {
  mouseTracker.x = event.x;
  mouseTracker.y = event.y;
}
function addHideshowStyle() {
  if (document.querySelector("#contexHideStyle")) {
    document.querySelector("#contexHideStyle").remove();
  }
  var style = document.createElement("style");
  style.innerHTML = `
              .contexHide {
                  display:none !important;
              }
              .contexBorder {
                border: 3px solid black;
              }
              #contex {
                  all:initial;
                  display: grid;
                  color: black !important;
                  grid-template-columns: 1fr;
                  min-width: 8rem;
                  background: whitesmoke;
                  position:fixed;
                  border-top: 1px solid grey;
                  border-left: 1px solid grey;
                  border-right: 1px solid grey;
                  z-index: 999999;
                  box-shadow: 3px 3px 6px rgba(0,0,0,0.4);
              }
              #contex a {
                color: black !important;
                  all:initial;
                  padding: 0.2rem;
                  border-bottom: 1px solid grey;
                  cursor: pointer;
              }
              #contex a:hover {
                  background-color: lightgrey;
              }
              .contexComplex {
                  all:initial;
                  padding: 0.2rem;
                  border-bottom: 1px solid grey;
                  display: block;
                  color: black !important;
                  cursor: pointer;
              }
              .contexComplex:hover {
                background-color: lightgrey !important;
              }
              .contexComplex a {
                  color: black !important;
                  display: none !important;
                  border-left: 1px dashed grey !important;
                  border-right: 1px dashed grey !important;
                  background-color: whitesmoke !important;
                  margin: 0.2rem !important;
                  border-radius: 0.4rem !important;
              }
              .contexComplex:hover a {
                  display: inline !important;
              }
              .contexComplex a:hover {
                  background-color: lightgrey !important;
              }
              `;
  style.id = "contexHideStyle";
  document.head.append(style);
}
function addContextAction(action) {
  var act = document.createElement("a");
  if (!action.nohide) {
    act.addEventListener("click", hideContextMenu);
  }
  if (action.click) {
    act.addEventListener("click", action.click);
  }
  act.innerText =
    action.label ||
    `Option ${document.querySelector("#contex").children.length}`;
  document.querySelector("#contex").append(act);
  return act;
}
function addComplexAction(action, subactions) {
  var category = document.createElement("div");
  category.classList.add("contexComplex");
  category.innerText =
    action.label ||
    `Option ${document.querySelector("#contex").children.length}`;
  if (!action.nohide) {
    category.addEventListener("click", hideContextMenu);
  }
  if (action.click) {
    category.addEventListener("click", action.click);
  }
  for (let i = 0; i < subactions.length; i++) {
    const action = subactions[i];
    var act = document.createElement("a");
    if (!action.nohide) {
      act.addEventListener("click", hideContextMenu);
    }
    if (action.click) {
      act.addEventListener("click", (event) => {
        event.stopPropagation();
        action.click(event);
      });
    }
    act.innerText =
      action.label ||
      `Option ${document.querySelector("#contex").children.length}`;
    category.append(act);
  }
  document.querySelector("#contex").append(category);
}
function addConditionalAction(action) {
  if (!action.validator || typeof action.validator !== "function") {
    return addContextAction(action);
  }
  var act = document.createElement("a");
  if (!action.nohide) {
    act.addEventListener("click", hideContextMenu);
  }
  if (action.click) {
    act.addEventListener("click", function (event) {
      action.click(event.target.element, event);
    });
  }
  act.classList.add("contexHide");
  contexOpenListeners.push(() => {
    if (action.validator()) {
      act.classList.remove("contexHide");
    } else {
      act.classList.add("contexHide");
    }
  });
  act.innerText =
    action.label ||
    `Option ${document.querySelector("#contex").children.length}`;
  document.querySelector("#contex").append(act);
  return act;
}
function addESAction(action) {
  if (!action.tag) {
    return addContextAction(action);
  }
  var act = document.createElement("a");
  if (!action.nohide) {
    act.addEventListener("click", hideContextMenu);
  }
  if (action.click) {
    act.addEventListener("click", function (event) {
      action.click(event.target.element, event);
    });
  }
  act.classList.add("contexHide");
  contexOpenListeners.push(() => {
    var elem = document.elementFromPoint(mouseTracker.cX, mouseTracker.cY);
    if (action.tag === "*" || elem.tagName.toLowerCase() === action.tag) {
      act.classList.remove("contexHide");
      act.element = elem;
    } else {
      act.classList.add("contexHide");
    }
  });
  act.innerText =
    action.label ||
    `Option ${document.querySelector("#contex").children.length}`;
  document.querySelector("#contex").append(act);
  return act;
}
function addContextSeperator() {
  var act = document.createElement("a");
  act.style = "background-color:grey";
  document.querySelector("#contex").append(act);
  return act;
}
function toggleContextMenu(event) {
  mouseTracker.cX = mouseTracker.x;
  mouseTracker.cY = mouseTracker.y;
  mouseTracker.element = document.elementFromPoint(
    mouseTracker.cX,
    mouseTracker.cY
  );
  contexOpenListeners.forEach((fn) => fn());
  event ? event.preventDefault() : null;
  document.querySelector("#contex").classList.toggle("contexHide");
  document
    .querySelector("#contex")
    .setAttribute(
      "style",
      `top:${mouseTracker.cY + 1}px;left:${mouseTracker.cX + 1}px;`
    );
  correctOffscreen();
}
function correctOffscreen() {
  var rect = document.querySelector("#contex").getBoundingClientRect();
  document
    .querySelector("#contex")
    .setAttribute(
      "style",
      `left:${
        rect.x + rect.width > window.innerWidth
          ? window.innerWidth - rect.width
          : mouseTracker.cX + 1
      }px;top:${
        rect.y + rect.height > window.innerHeight
          ? window.innerHeight - rect.height
          : mouseTracker.cY + 1
      }px;`
    );
}
function showContextMenu(event) {
  mouseTracker.cX = mouseTracker.x;
  mouseTracker.cY = mouseTracker.y;
  mouseTracker.element = document.elementFromPoint(
    mouseTracker.cX,
    mouseTracker.cY
  );
  contexOpenListeners.forEach((fn) => fn());
  event ? event.preventDefault() : null;
  document
    .querySelector("#contex")
    .setAttribute(
      "style",
      `top:${mouseTracker.cY + 1}px;left:${mouseTracker.cX + 1}px;`
    );
  document.querySelector("#contex").classList.remove("contexHide");
}
function hideContextMenu() {
  mouseTracker.cX = mouseTracker.x;
  mouseTracker.cY = mouseTracker.y;
  document.querySelector("#contex").classList.add("contexHide");
}
function makeContextMenu(baseActions) {
  addHideshowStyle();
  if (document.querySelector("#contex")) {
    document.querySelector("#contex").remove();
  }
  var menu = document.createElement("div");
  menu.style = ``;
  menu.id = "contex";
  menu.classList.add("contexHide");
  document.documentElement.append(menu);
  if (!baseActions) {
    return;
  }
  baseActions.forEach((action, i) => {
    var act = document.createElement("a");
    if (action.click) {
      act.addEventListener("click", action.click);
    }
    act.addEventListener("click", hideContextMenu);
    act.innerText = action.label || `Option ${i + 1}`;
    menu.append(act);
  });
}
makeContextMenu();
addConditionalAction({
  label: "Open in New Tab",
  click: function () {
    window.open(mouseTracker.element.getAttribute("href"));
  },
  validator: function () {
    return mouseTracker.element.hasAttribute("href");
  },
});
var copyTextButton = addConditionalAction({
  label: "Copy Text",
  click: function () {
    navigator.clipboard.writeText(copyTextButton["copyableText"]);
  },
  validator: function () {
    copyTextButton["copyableText"] = contexGetSelection();
    return contexGetSelection() !== "";
  },
});
addContextAction({
  label: "Back",
  click: function () {
    history.back();
  },
});
addContextAction({
  label: "Forward",
  click: function () {
    history.forward();
  },
});
addContextAction({
  label: "Reload",
  click: function () {
    location.reload();
  },
});
addContextSeperator();
addContextAction({
  label: "Print...",
  click: function () {
    window.print();
  },
});
addESAction({
  label: "Save Screenshot",
  tag: "canvas",
  click: function (elem) {
    var link = document.createElement("a");
    link.download = "screenshot.png";
    link.href = elem.toDataURL();
    link.click();
  },
});
addESAction({
  label: "Open Image in New Tab",
  click: function (elem) {
    if (elem.src) {
      window.open(elem.src);
    }
  },
  tag: "img",
});
addESAction({
  label: "Open Video in New Tab",
  click: function (elem) {
    if (elem.src) {
      window.open(elem.src);
    }
  },
  tag: "video",
});
addESAction({
  label: "Picture-in-picture",
  click: function (elem) {
    if (elem.requestPictureInPicture) {
      elem.requestPictureInPicture();
    }
  },
  tag: "video",
});
((es) => {
  var vol = document.createElement("input");
  vol.setAttribute("type", "range");
  vol.setAttribute("min", "0");
  vol.setAttribute("value", "1");
  vol.setAttribute("max", "1");
  vol.setAttribute("step", "0.01");
  vol.addEventListener("input", () => {
    if (mouseTracker.element && mouseTracker.element.volume) {
      mouseTracker.element.volume = vol.value;
    }
  });
  es.append(vol);
})(
  addESAction({
    tag: "video",
    label: "Vol: ",
    nohide: true,
  })
);
((es) => {
  var vol = document.createElement("input");
  vol.setAttribute("type", "range");
  vol.setAttribute("min", "0.1");
  vol.setAttribute("max", "6");
  vol.setAttribute("value", "1");
  vol.setAttribute("step", "0.01");
  vol.addEventListener("input", () => {
    if (mouseTracker.element && mouseTracker.element.playbackRate) {
      mouseTracker.element.playbackRate = vol.value;
    }
  });
  es.append(vol);
})(
  addESAction({
    tag: "video",
    label: "PB: ",
    nohide: true,
  })
);
addESAction({
  label: "Copy Image Address",
  click: function (elem) {
    if (elem.src) {
      navigator.clipboard.writeText(elem.src);
    }
  },
  tag: "img",
});
addESAction({
  label: "Export SVG",
  click: function (elem) {
    if (elem.outerHTML) {
      contexTextDownload(elem.outerHTML, "exported.svg");
    }
  },
  tag: "svg",
});
addESAction({
  label: "Export SVG",
  click: function (elem) {
    if (elem.closest("svg")) {
      contexTextDownload(elem.closest("svg").outerHTML, "exported.svg");
    }
  },
  tag: "path",
});
addESAction({
  label: "Progress > Title",
  click: function (elem) {
    if (!elem["progress>title"]) {
      elem["progress>title"] = true;
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === "attributes") {
            document.querySelector("title").innerHTML =
              "Progress: " +
              Math.floor(
                (parseFloat(elem.getAttribute("value") || 0) /
                  (parseFloat(elem.getAttribute("max") || 1) -
                    parseFloat(elem.getAttribute("min") || 0))) *
                  100
              ) +
              "%";
          }
        });
      });
      observer.observe(elem, {
        attributes: true,
      });
    }
  },
  tag: "progress",
});
addConditionalAction({
  label: "Remove Attributes",
  click: () => {
    [
      "maxlength",
      "max",
      "min",
      "minlength",
      "type",
      "required",
      "disabled",
      "pattern",
    ].forEach((attr) => {
      mouseTracker.element.removeAttribute(attr);
    });
  },
  validator: () => {
    var valid = false;
    [
      "maxlength",
      "max",
      "min",
      "minlength",
      "type",
      "required",
      "disabled",
      "pattern",
    ].forEach((attr) => {
      valid ||= mouseTracker.element.hasAttribute(attr);
    });
    return valid;
  },
});
addContextSeperator();
addComplexAction(
  {
    label: "Fullscreen",
    click: function (elem) {
      document.documentElement.requestFullscreen();
    },
  },
  [
    {
      label: "(Element)",
      click: function () {
        mouseTracker.element.requestFullscreen();
      },
    },
  ]
);
addComplexAction(
  {
    label: "Share...",
    click: () => {
      navigator.share({
        text: location.href,
      });
    },
  },
  [
    {
      label: "(Element)",
      click: () => {
        var elem = mouseTracker.element;
        if (elem.href) {
          navigator.share({
            text: elem.href,
          });
          return;
        }
        if (elem.src) {
          navigator.share({
            text: elem.src,
          });
          return;
        }
      },
    },
  ]
);
addContextSeperator();
addComplexAction(
  {
    label: "Element",
    click: function () {
      var tag = mouseTracker.element.tagName.toLowerCase();
      for (let i = 0; i < mouseTracker.element.classList.length; i++) {
        tag += "." + mouseTracker.element.classList.item(i);
      }
      if (mouseTracker.element.id) {
        tag += "#" + mouseTracker.element.id;
      }
      alert(tag);
    },
  },
  [
    {
      label: "(Remove)",
      click: function () {
        if (mouseTracker.element && mouseTracker.element.remove) {
          mouseTracker.element.remove();
        }
      },
    },
    {
      label: "(Border)",
      click: function () {
        if (
          mouseTracker.element &&
          mouseTracker.element.classList &&
          mouseTracker.element.classList.toggle
        ) {
          mouseTracker.element.classList.toggle("contexBorder");
        }
      },
    },
    {
      label: "(Edit)",
      click: function () {
        if (
          mouseTracker.element &&
          mouseTracker.element.contentEditable.toString() === "true"
        ) {
          mouseTracker.element.contentEditable = "inherit";
        } else {
          mouseTracker.element.contentEditable = "true";
        }
      },
    },
  ]
);
addESAction({
  label: "Toggle Autoclicker",
  click: function (elem) {
    if (elem.contexAutoclicker) {
      clearInterval(elem.contexAutoclicker);
      delete elem.contexAutoclicker;
    } else {
      elem.contexAutoclicker = setInterval(function () {
        elem.click();
      }, 200);
    }
  },
  tag: "*",
});
addContextSeperator();
addESAction({
  label: "Inspect",
  click: function (elem) {
    if (!inspector.element) {
      inspector.element = elem;
    }
    inspector.launch();
  },
  tag: "*",
});
addEventListener("contextmenu", toggleContextMenu);
addEventListener("mousemove", updateMouseTracker);
