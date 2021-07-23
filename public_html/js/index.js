/**
 *
 * Makeshift templating engine for Ostaa app. Slow.
 *
 * @exports TemplateEngine
 * @exports renderPage
 * @export ENV
 * @exports BASE_URL
 *
 * @author Christian P. Byrne
 */

import { apiRender, apiHandlers } from "./examples/api.js";
import { loginRender, loginHandlers } from "./examples/login.js";
import renderOstaa from "./examples/dashboard-example.js";

const ENV = "production"; // "api-demo" | "dev" | "production"
const URLS = ["http://127.0.0.1:5000", "http://143.198.57.139:80"];
const BASE_URL = ENV === "dev" ? URLS[0] : URLS[1];

/**
 * Create the dynamic stylesheet link node that is altered
 * when a new page is rendered. Loads first page (login),
 * then loads home page once session storage indicates logged
 * in status.
 * @listens window#load
 */
window.onload = () => {
  let dynamicStyle = document.createElement("link");
  dynamicStyle.rel = "stylesheet";
  dynamicStyle.data = "dynamic";
  dynamicStyle.title = "dynamic";
  document.querySelector("head").appendChild(dynamicStyle);
  if (ENV === "api-demo") {
    renderPage("api");
  } else {
    renderPage("home");
  }
};

/**
 * Page loading functions for each page in app.
 * @param {string} page
 */
function renderPage(page) {
  if (!sessionStorage.getItem("login") || page === "login") {
    // renderOstaa();
    loginRender();
    loginHandlers();
  } else if (page === "api") {
    apiRender();
    apiHandlers();
  } else if (page === "home") {
    renderOstaa();
  }
}

/**
 *
 * @classdesc Clear current DOM and construct a new page
 * using the styles and template nodes/containers for the app.
 *
 * Clears DOM and all listeners not binded to document or window.
 *
 * @param {string} title        The title displayed on the toolbar.
 * @param {Object} [options={}]
 * @param {number} [options.mainElevation=3]
 * ...Object....
 *
 */
class TemplateEngine {
  constructor(title, options = {}) {
    let defaultOptions = {
      mainElevation: 3,
      collapsibleNodes: ["form", "button", "label", "input"],
      expandedClass: "active",
      navItems: ["Home", "Browse", "Profile", "Purchases", "About"],
      taskbarItems: false,
      gridTemplateAreas: `"main-left main-right" "footer footer"`,
      gridTemplateRows: `1fr min-content`,
      gridTemplateColumns: `min-content 1fr`,
    };
    Object.assign(defaultOptions, options);

    this.pages = defaultOptions.navItems;
    this.dom.clear();
    this.stylesheets = window.document.styleSheets;
    this.rules;
    this.nav;
    this.left = this.tag.div("left");
    this.right = this.tag.div("right");
    this.footer = this.component.taskbar(
      defaultOptions.taskbarItems
        ? defaultOptions.taskbarItems
        : defaultOptions.navItems
    );
    this.header = this.tag.div("header");
    this.left.appendChild(this.component.toolbar(title));
    document.body.appendChild(this.left);
    document.body.appendChild(this.right);

    // Set grid properties to body and main containers.
    this.gridTemplate = {};
    this.gridTemplate["gridTemplateAreas"] =
      defaultOptions["gridTemplateAreas"];
    this.gridTemplate["gridTemplateRows"] = defaultOptions["gridTemplateRows"];
    this.gridTemplate["gridTemplateColumns"] =
      defaultOptions["gridTemplateColumns"];
    this.gridAreas = `#left {
        grid-area: main-left;
        --elevation: ${defaultOptions.mainElevation};
      }
      #right {
        grid-area: main-right;
      --elevation: ${defaultOptions.mainElevation};
    }
    div > b {
      --elevation: ${defaultOptions.mainElevation + 1};
      --primary-font: var(--shell-font);
      --selected-color: var(--secondary);
      filter: brightness(1.6);
      }`;
    document.body.style.display = "grid";
    for (const [property, value] of Object.entries(this.gridTemplate)) {
      document.body.style[property] = value;
    }
    this.utils._appendStyleTag(this.gridAreas);

    /**
     * Needs to be in constructor.
     *
     * @todo It needs a timeout / promise return to give time for
     *       new stylesheet to be rendered.
     * @return {CSSRuleList}
     */
    this.getCssRules = () => {
      for (const sheet of Object.values(this.stylesheets)) {
        if (sheet.title == "dynamic") {
          this.rules = sheet.rules ? sheet.rules : sheet.cssRules;
          return sheet.rules ? sheet.rules : sheet.cssRules;
        }
      }
    };
    /**
     * Needs to be in constructor.
     *
     * @todo It needs a timeout / promise return to give time for
     *       new stylesheet to be rendered.
     * @param {string} node Selector text for the node.
     * @param {CSSRuleList} [rules=this.rules]
     */
    this.getNodeStyle = (node, rules = this.rules) => {
      for (const cssStyleRule of rules) {
        if (cssStyleRule.selectorText === node) {
          return cssStyleRule;
        }
      }
    };
  }

  /**
   * Clear all of a node's contents and children.
   *
   * @public Use this with .then() for consistentency and performance.
   * @description This method of clearing a node and all it's content and
   * children is apprently best performance, works on all browsers, and
   * avoids problems with setting innerHTML of certaint types of elements
   * (<select> on IE).
   */
  reset = async (node) => {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  };

  /**
   * Construct a node with options.
   * @param {*} options
   * @returns
   */
  constructNode = (options = {}) => {
    let defaults = {
      tag: "div",
      classes: false,
      propertiesMap: false,
      styleMap: false,
      inner: false,
      background: false,
      textLightness: false,
    };
    Object.assign(defaults, options);
    let node = document.createElement(defaults.tag);
    // Add css classes.
    if (Array.isArray(defaults.classes)) {
      node.classList.add(...defaults.classes);
    } else if (defaults.classes) {
      node.classList.add(defaults.classes);
    }
    if (defaults.textLightness) {
      node.style.setProperty(
        "--text-contrast",
        `0deg, 0%, ${Math.floor(defaults.textLightness)}%`
      );
    }
    // Add style properties.
    if (defaults.styleMap) {
      this.utils._setStyle(node, defaults.styleMap);
    }
    if (defaults.background) {
      node.style.backgroundImage = "unset";
      node.style.background = defaults.background;
    }
    // Add custom properties.
    this.utils._mapMaybe(node, defaults.propertiesMap, "setAttribute");
    // Add inner text/html.
    if (defaults.inner) {
      node.innerHTML = defaults.inner;
    }
    return node;
  };

  // ────────────────────────────────────────────────────────────────────────────────
  utils = {
    /**
     * Insert string literal as innerhtml of a style element in
     * document head.
     * @param {string} styleText
     */
    _appendStyleTag: (styleText) => {
      let styleTag = document.createElement("style");
      styleTag.innerHTML = styleText;
      document.querySelector("head").appendChild(styleTag);
    },

    /** @private */
    _push: (node, prepend, axis) => {
      if (node.length && node.length > 1) {
        for (let nodeElem of node) {
          if (!prepend) {
            this[axis].appendChild(nodeElem);
          } else {
            this[axis].prepend(nodeElem);
          }
        }
      } else {
        if (!prepend) {
          this[axis].appendChild(node);
        } else {
          this[axis].prepend(node);
        }
      }
    },

    /** @private */
    _appendAll: (container, nodeArray) => {
      for (const node of nodeArray) {
        container.appendChild(node);
      }
    },

    /** @private */
    _createN: (count, tag = "div") => {
      let ret = [];
      for (let x = count; x > 0; x--) {
        ret.push(document.createElement(tag));
      }
      return ret;
    },

    /**
     * Construct collection of input nodes and append to container.
     * Pass a contianer div and an array of options objects.
     * @param {HTMLElement}   container
     * @param {object}        options
     * @private
     * */
    _batchAppendInputs: (container, options) => {
      for (const optionObj of options) {
        let input = this.tag.input(optionObj);
        if (input.length && input.length > 1) {
          container.appendChild(input[1]);
          container.appendChild(input[0]);
        } else {
          container.appendChild(input);
        }
      }
    },

    /**
     * Turns array of interactionBox() constructor optoins
     * into array of div nodes.
     *
     * @param   {Array<string[]>}   argArray
     * @returns {HTMLDivElement[]}
     * @private
     */
    _boxesFromArray: (argArray) => {
      const ret = [];
      for (const boxOptions of argArray) {
        if (typeof boxOptions == "string") {
          ret.push(this.container.withTitle(boxOptions));
        } else {
          ret.push(this.container.withTitle(...boxOptions));
        }
      }
      return ret;
    },

    /**
     * Apply styles to a single element. Only use for small number of nodes
     * otherwise performance loss.
     * @param {HTMLElement} node
     * @param {{[cssProperty: string]: string}} styleMap - Formatted with
     * CSS casing (hyphens instead of camel case)
     */
    _setStyle: (node, styleMap) => {
      for (const [property, value] of Object.entries(styleMap)) {
        // setProperty property setter for custom CSS variables. (err?)
        // And to use string literals of actual CSS property names
        // rather than camelCase versions.
        node.style.setProperty(property, value);
      }
    },

    /**
     *
     * @private
     * @param {*} set
     * @param {*} arg1
     * @param {*} arg2
     * @param {*} append
     */
    _callSetter: (node, set, arg1, arg2 = false, append = false) => {
      // A. The setter is a setter method.
      if (typeof node[set] === "function") {
        if (arg2) {
          console.log(node[set]);
          console.log(arg1, arg2);
          node[set](arg1, arg2);
        } else {
          if (Array.isArray(arg1)) {
            for (const arg of arg1) {
              node[set](arg);
            }
          } else {
            try {
              node[set](arg1);
            } catch (TypeError) {
              node.set += arg1;
            }
          }
        }
      }
      // B. The node[set]ter is just a property name.
      else {
        if (Array.isArray(arg1)) {
          for (let arg of arg1) {
            node[set] += arg1; // Append.
          }
        } else {
          if (append) {
            node[set] += arg1;
          } else {
            node[set] = arg1;
          }
        }
      }
    },

    /**
     * 
     * @param {*} target 
     * @param {*} options 
     * @param {*} setter 
     * @returns

     * @private
     */
    _mapMaybe: (target, options, setter) => {
      // 1. Default param passed is falsy.
      if (!options) {
        return;
      }
      // 2. Options is a single arg to pass to setter.
      else if (typeof options === "string") {
        this.utils._callSetter(target, setter, options);
      }
      // 3. options is just an array of values to pass to a setter method that takes single position args.
      else if (Array.isArray(options)) {
        for (const property of options) {
          this.utils._callSetter(target, setter, property);
        }
      }
      // 4. Options is an object mapping values to properties.
      else {
        for (const [property, value] of Object.entries(options)) {
          // 5. Value is a string -- set a single value.
          if (typeof value === "string") {
            this.utils._callSetter(target, setter, property, value);
          } else {
            // 6. Value is an array -- repeatedly call the setter.
            for (const propertyElem of value) {
              this.utils._callSetter(target, setter, propertyElem, value);
            }
          }
        }
      }
    },
  };

  //
  // ─── COMPONENT PROTOTYPES ───────────────────────────────────────────────────────
  //

  container = {
    /**
     * Create and return a div container.
     * @param {string} mainId Sets id property of returned node.
     * @returns {HTMLDivElement}
     */
    box: (tag, id = false) => {
      let node = document.createElement(tag);
      if (id) {
        node.setAttribute("id", id);
      }
      return node;
    },
    /** @returns {HTMLElement} Text inside a node. */
    boxedText: (tag, text, id = false) => {
      let node = this.container.box(tag, id);
      node.innerHTML = text;
      return node;
    },
    /**
     * Get a node that doesn't have app theme css framework
     * applied to it.
     * @param   {string} [tag="div"]  -The type of HTML element created.
     * @returns {HTMLElement} Node
     */
    unstyled: (tag = "div") => {
      let unstyledDiv = document.createElement(tag);
      unstyledDiv.classList.add("custom");
      return unstyledDiv;
    },
    /**
     * @implements {HTMLDivElement}
     * @param {string} title        Title at top of div.
     * @param {string} titleCaption Text in caption next to title.
     * @returns {HTMLDivElement}
     */
    withTitle: (title, titleCaption = false) => {
      let div = document.createElement("div");
      if (titleCaption) {
        let caption = document.createElement("b");
        caption.innerHTML = titleCaption;
        div.appendChild(caption);
      }
      div.innerHTML += title;
      return div;
    },
  };

  tag = {
    /**
     * Create and return a div container.
     * @param {string} mainId Sets id property of returned node.
     * @returns {HTMLDivElement}
     */
    div: (id = false) => {
      let node = document.createElement("div");
      if (id) {
        node.setAttribute("id", id);
      }
      return node;
    },
    /**
     * Creates an input node.
     * @param {{type?: string, value?: string,
     * name?: string, id?: string, placeholder?: string,
     * label?: string | false}} options All options are optional.
     * @returns {HTMLInputElement}
     */
    input: (options) => {
      let defaults = {
        type: "submit",
        value: "",
        name: false,
        id: false,
        placeholder: "Enter value. . .",
        label: false,
      };
      Object.assign(defaults, options);
      let input = document.createElement("input");
      for (const [property, value] of Object.entries(defaults)) {
        if (value) {
          input.setAttribute(property, value);
        }
      }
      if (defaults.label) {
        let labelNode = document.createElement("label");
        labelNode.innerHTML = defaults.label;
        labelNode.for = defaults.id;
        return [input, labelNode];
      }
      return input;
    },
  };

  component = {
    taskbar: (itemNames) => {
      let footer = this.container.box("footer");
      let nav = this.constructNode({
        tag: "nav",
        classes: [
          "navbar",
          "navbar-main",
          "navbar-expand-lg",
          "navbar-dark",
          "navbar-footer",
        ],
        propertiesMap: {
          id: "navbar-footer",
        },
      });
      let ul = this.constructNode({
        tag: "ul",
        classes: ["navbar-nav", "navbar-nav-hover"],
      });
      for (const item of itemNames) {
        let li = this.constructNode({ tag: "li", classes: "nav-item" });
        li.appendChild(
          this.constructNode({
            tag: "span",
            classes: "nav-link-inner-text",
            inner: item,
          })
        );
        ul.appendChild(li);
      }
      nav.appendChild(ul);
      nav.appendChild(this.constructNode({ classes: ["time", "text-center"] }));
      footer.appendChild(nav);
      return footer;
    },
    /** @returns {HTMLElement} Node with text that is masked by an image/gif. */
    maskedtext: (text, imgPath, tag = "div", options = {}) => {
      let defaults = {
        color: "hsla(0deg, 0%, 98%, .01)",
        "background-repeat": "no-repeat",
        "background-size": "cover",
        "background-repeat": "no-repeat",
        "font-family": "font-SFAlienEncountersSolid",
        "-webkit-text-stroke-width": ".75px",
        "-webkit-text-stroke-color": "hsl(var(--secondary-darker))",
      };
      Object.assign(defaults, options);
      let maskProperties = {
        mask: `url("./${imgPath}")`,
        "background-image": `url("./${imgPath}")`,
        "background-clip": "text",
        "-webkit-background-clip": "text",
        "-webkit-text-fill-color": "transparent",
      };
      Object.assign(maskProperties, defaults);

      let node = this.container.box(tag);
      this.utils._setStyle(node, maskProperties);
      node.innerHTML = text;
      return node;
    },
    /**
     * @returns {HTMLElement} Text that is formatted like
     * movie captions with the intent of being visible on
     * any background type/color/composition.
     */
    alwaysVisibleText: (text, tag = "div", options = {}) => {
      let defaults = {
        color: "hsla(0deg, 0%, 100%, .87)",
        "--primary-font": "CascadiaCode-Light",
        "-webkit-text-stroke-width": ".75px",
        "-webkit-text-stroke-color": "hsl(var(--secondary-darker))",
      };
      Object.assign(defaults, options);
      let maskProperties = {
        "-webkit-text-fill-color": `${defaults.color}`,
      };
      Object.assign(maskProperties, defaults);
      let node = this.container.box(tag);
      this.utils._setStyle(node, maskProperties);
      node.innerHTML = text;
      return node;
    },
    /**
     * Create header node in style of app's theme.
     * Includes toolbar.
     *
     * @param {string} titleText Text in title of header.
     * @returns {HTMLHeaderElement}
     */
    toolbar: (titleText = "Welcome") => {
      let header = document.createElement("header");
      let headerCss = {
        "--elevation": "2",
      };
      this.utils._setStyle(header, headerCss);

      let h6 = document.createElement("h6");
      let h6Css = {
        "letter-spacing": "0px",
      };
      this.utils._setStyle(h6, h6Css);
      h6.innerHTML = titleText;
      header.appendChild(h6);

      let buttonTray = document.createElement("div");
      const btnClasses = ["minimize-icon", "unmaximize-icon", "close-icon"];
      for (let cssClass of btnClasses) {
        let icon = document.createElement("span");
        icon.classList.add(cssClass);
        buttonTray.appendChild(icon);
      }
      header.appendChild(buttonTray);
      return header;
    },
    /**
     *
     * @param {Object} options
     * @returns {HTMLDivElement}
     */
    navbar: (options = {}) => {
      let defaultCss = {
        "grid-area": "navbar",
        "--elevation": "3",
      };
      Object.assign(defaultCss, options);
      let navNode = this.container.box("div", "navbar");
      this.utils._setStyle(navNode, defaultCss);
      navNode.appendChild(this.component.toolbar("Ostaa"));

      let portalsBox = this.container.unstyled();
      let portalsCss = {
        display: "flex",
        "flex-direction": "columns",
        "justify-content": "space-evenly",
        "flex-grow": "1",
      };
      this.utils._setStyle(portalsBox, portalsCss);

      let navLinks = [];
      const fractionStep = Math.floor(100 / this.pages.length);
      let curr = 0;
      let maskOptions = {
        "--elevation": "6",
        width: "max-content",
        flex: "1",
        "text-align": "center",
        cursor: "pointer",
      };
      for (const navItemText of this.pages) {
        maskOptions["background-position"] = `${curr}% ${100 - curr / 2}%`;
        let itemNode = this.component.maskedtext(
          navItemText,
          "img/windows-xp-bg.jpg",
          "b",
          maskOptions
        );
        // Iterate background position each element.
        navLinks.push(itemNode);
        curr += fractionStep;
      }
      this.utils._appendAll(portalsBox, navLinks);
      navNode.appendChild(portalsBox);
      return navNode;
    },
    /**
     * Create formatted login form inside div container.
     * Return node's HTML Shape:
     * div > form > input:text, input:password, input:button
     *
     * @param {string} title
     * @param {string} caption
     * @param {string} formId
     * @returns {HTMLDivElement}
     */
    loginForm: (title, caption, formId = "user") => {
      const formContainer = this.container.withTitle(title, caption);
      const form = this.container.box("form", formId);
      const formFields = [
        { type: "text", name: "username", id: "username", label: "Username" },
        {
          type: "password",
          name: "password",
          id: "password",
          label: "Password",
        },
        { type: "button", value: "Submit" },
      ];
      this.utils._batchAppendInputs(form, formFields);
      formContainer.appendChild(form);
      return formContainer;
    },
    /**
     * Construct the formatted listing form.
     * @param {string} title
     * @param {string} caption
     * @returns {HTMLDivElement}
     */
    listingForm: (title, caption) => {
      const formContainer = this.container.withTitle(title, caption);
      const form = this.container.box("form", "item");
      const formFields = [
        { type: "text", name: "title", id: "title", label: "Title" },
        {
          type: "text",
          name: "description",
          id: "description",
          label: "Description",
        },
        {
          type: "file",
          name: "image",
          id: "image",
          accept: "image/*",
          label: "Image",
        },
        { type: "number", name: "price", id: "price", label: "Price" },
        { type: "text", name: "stat", id: "stat", label: "Stat" },
        { type: "button", value: "Submit", id: "addListingSubmit" },
      ];
      this.utils._batchAppendInputs(form, formFields);
      formContainer.appendChild(form);
      return formContainer;
    },
    /**
     *
     * @param {string} type
     * @returns {HTMLDivElement}
     */
    searchField: (type) => {
      let boxArgs;
      let inputFields;
      if (type === "users") {
        boxArgs = ["Search Users", "GET"];
        inputFields = [
          { type: "text", placeholder: "enter keyword..." },
          { id: "searchUsers", value: "Search" },
        ];
      } else if (type === "search-items") {
        boxArgs = ["Search Listings", "SHOP"];
        inputFields = [
          { type: "text", placeholder: "enter keyword..." },
          { id: "searchItems", value: "Search" },
        ];
      } else if (type === "items") {
        boxArgs = ["Search Items", "GET"];
        inputFields = [
          { type: "text", placeholder: "enter keyword..." },
          { id: "searchItems", value: "Search" },
        ];
      } else if (type === "home purchases") {
        boxArgs = ["View Your Purchases", "PROFILE"];
        inputFields = [{ id: "getMyPurchases", value: "Get Purchase History" }];
      } else if (type === "home listings") {
        boxArgs = ["View Your Listings", "PROFILE"];
        inputFields = [{ id: "getMyListings", value: "Get Listings History" }];
      } else if (type === "user listings") {
        boxArgs = ["User's Listings", "GET"];
        inputFields = [
          { type: "text", placeholder: "enter username..." },
          { id: "listings", value: "Get Listings" },
        ];
      } else if (type === "user purchases") {
        boxArgs = ["User's Purchases", "GET"];
        inputFields = [
          { type: "text", placeholder: "enter username..." },
          { id: "purchases", value: "Get Purchases" },
        ];
      }
      const container = this.container.withTitle(...boxArgs);
      this.utils._batchAppendInputs(container, inputFields);
      return container;
    },
  };

  layout = {
    /** Use a navbar. */
    useNavbar: (nav) => {
      this.css.updateGrid({
        gridTemplateAreas: `"navbar navbar"`,
        gridTemplateRows: "min-content",
      });
      document.body.prepend(this.component.navbar());
    },

    /** Append a header section to page. */
    useHeader: () => {
      this.header.style.gridArea = "header";
      document.body.prepend(this.header);
    },

    /** Append a footer section to page. */
    useFooter: (itemNames = false) => {
      this.css.appendStylesheet("./css/navbar.css");
      this.footer.style.gridArea = "footer";
      document.body.appendChild(this.footer);
    },

    /**
     * Add a node to the left section of page.
     * @param {HTMLElement} node
     * @param {Boolean}     [prepend=false] Append node if false.
     */
    addLeft: (node, prepend = false) => {
      this.utils._push(node, prepend, "left");
    },

    /**
     * Add a node to the right section of page.
     * @param {HTMLElement} node
     * @param {Boolean}     [prepend=false] Append node if false.
     */
    addRight: (node, prepend = false) => {
      this.utils._push(node, prepend, "right");
    },
  };

  // ─── CSS UTILS ─────────────────────────────────────────────────────
  css = {
    addAdnimation: (node, animationClass = "vibrate") => {
      node.addEventListener("click", function () {
        let vibrate = () => {
          this.classList.toggle(animationClass);
        };
        vibrate();
        setTimeout(() => {
          vibrate();
        }, 500);
      });
    },
    addBorder: (node, keepOutline = false) => {
      const themeBorder = {
        "border-top": " 2px solid white",
        "border-left": " 2px solid white",
        "border-right": " 2px solid #393939",
        "border-bottom": " 2px solid #393939",
        "border-radius": " 0",
      };
      for (const [property, value] of Object.entries(themeBorder)) {
        node.setStyle(property, value);
      }
      if (!keepOutline) {
        node.style.setProperty("--outline-width", "0px");
      }
    },
    /**
     * Fixes array when css delcarations are split with
     * space seperator but there are values like:
     * "minmiax(min-content, 70%)" that includes a space.
     * @returns {string[]}
     */
    updateGrid: (properties, position = 0) => {
      const trimQuotes = (x) => {
        return x ? x.replace(/^\"+|\"+$/g, "") : x;
      };
      const fixArray = (valsArray) => {
        let ret = [];
        let index = 0;
        while (index < valsArray.length) {
          let parenthesesCt = 0;
          let curr = trimQuotes(valsArray[index]);
          if (!valsArray[index].includes("(")) {
            index += 1;
          } else {
            while (index < valsArray.length && valsArray[index].includes("(")) {
              parenthesesCt += 1;
              index += 1;
              let carry = trimQuotes(valsArray[index]);
              if (carry) {
                curr += carry;
              }
            }
            index += 1;
            while (index < valsArray.length && parenthesesCt > 0) {
              parenthesesCt -= 1;
              index += 1;
              let carry = trimQuotes(valsArray[index]);
              if (carry) {
                curr += carry;
              }
            }
            index += 1;
          }
          if (curr) {
            ret.push(curr);
          }
        }
        return ret;
      };
      // TODO Timeout Promise.
      // Timeout so any loaded stylesheets can render.
      setTimeout(() => {
        // If setting grid property in a stylesheet:
        // let currGrid = this.pageLayout; // For performance.
        // If loading grid property in this constructor:
        let currGrid = this.gridTemplate;
        for (const [property, value] of Object.entries(properties)) {
          if (currGrid[property]) {
            // TODO use correct split sep so can insert at given position
            // TODO how to correctly split values without requiring no spaces in CSS function calls and other stuff?
            let currValue = currGrid[property];
            let sep = " ";
            if (property == "gridTemplateAreas") {
              sep = '" "';
            }
            let splitValues = fixArray(currValue.split(sep));
            let newValueString;
            splitValues.splice(position, 0, value);

            // Add double quotes to both ends of items if gridTemplateAreas.
            if (property == "gridTemplateAreas") {
              newValueString = splitValues
                .reduce((previous, curr) => previous + ` "${curr}" `)
                .trim();
            } else {
              newValueString = splitValues.join(sep);
            }
            document.body.style[property] = newValueString;
            this.gridTemplate.property = newValueString;
          }
        }
      }, 200);
    },
    appendStylesheet: (href) => {
      let link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.querySelector("head").appendChild(link);
    },

    /**
     * Update the dynamic stylesheet.
     * @param {string} href Relative path to stylesheet.
     */
    update: (href) => {
      let links = document.querySelectorAll("link");
      let dynamicLink;
      for (let link of links) {
        if (link.data === "dynamic") {
          dynamicLink = link;
        }
      }
      dynamicLink.href = href;
      // dynamicLink.title = "dynamic";

      // When loading new stylesheet, the styleSheets proeprty
      // of the document object won't update untilt the sheet is
      // rendered. Use the load event on a link element to get a
      // fire when the resource has been fully loaded.

      // TODO: this listener should not be re-bound evertime the sheet is updated, find a better way to only bind it once per instance?
      dynamicLink.addEventListener("load", () => {
        // Add another timeout in the case the parsing takes longer than loading.
        setTimeout(() => {
          this.stylesheets = window.document.styleSheets;
        }, 150);
      });
    },
  };

  // ─── DOM UTILS ──────────────────────────────────────────────────
  dom = {
    /**
     * Clears all nodes from body downwards (inclusive).
     * Also removes listeners in same scope.
     * Called in constructor.
     */
    clear: () => {
      let root = document.querySelectorAll("body > div");
      for (let node of root) {
        node.remove();
      }
      document.body.remove();
      let newBody = document.createElement("body");
      document.documentElement.appendChild(newBody);
    },
  };

  // ─── GETTERS SETTERS ───────────────────────────────────────────
  /**
   * @type {{...CSSProperty: string}}
   * Layout of page.
   */
  get pageLayout() {
    for (const cssStyleRule of this.rules) {
      if (cssStyleRule.selectorText === "body") {
        const styleMap = cssStyleRule.style;
        const gridProperties = Object.getOwnPropertyNames(styleMap).filter(
          (property) => property.includes("grid")
        );
        const ret = {};
        for (const key of gridProperties) {
          ret[key] = styleMap[key];
        }
        return ret;
      }
    }
  }
  /**
   * <'grid-template'> | <'grid-template-rows'>
   * / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>
   *
   * Getting Computed Values:
   * getComputedStyle(HTMLElement) : Style Map of Computed Values
   *
   * Read Style Sheets:
   * document.styleSheets[0].rules || document.styleSheets[0].cssRules
   *
   */
  set pageLayout(gridOptions) {
    // TODO
    let defaults = {
      rows: [{ areaNames: "", height: "" }],
      columnWidths: [],
    };
  }
  /** @type {HTMLDivElement} */
  get rightFrame() {
    return this.right;
  }
  /** @type {HTMLDivElement} */
  get leftFrame() {
    return this.left;
  }
  /** @type {HTMLDivElement} */
  get topFrame() {
    return this.header;
  }
  /** @type {HTMLDivElement} */
  get bottomFrame() {
    return this.footer;
  }
  /** @type {CSSStyleSheet} */
  get styleSheet() {
    return this.stylesheets;
  }
  /** @type {Array} */
  get fonts() {
    return [
      "Windows 95",
      "consolas",
      "consolas-bold",
      "consolas-italic",
      "consolas-bold-italic",
      "CascadiaMonoPL-SemiBold",
      "CascadiaMonoPL-Light",
      "CascadiaCode-Bold",
      "CascadiaCode-Light",
      "CascadiaMonoPL-Bold",
      "CascadiaMono-ExtraLight",
      "CascadiaCodePL-Light",
      "CascadiaMono-SemiBold",
      "CascadiaCode-Regular",
      "CascadiaCode-SemiBold",
      "CascadiaCodePL-Regular",
      "CascadiaMonoPL-Regular",
      "CascadiaMonoPL-ExtraLight",
      "CascadiaCode-SemiLight",
      "CascadiaCode-ExtraLight",
      "CascadiaCodePL-SemiLight",
      "CascadiaMono-Light",
      "CascadiaCodePL-Bold",
      "CascadiaMono-Regular",
      "CascadiaCodePL-SemiBold",
      "CascadiaMono-Bold",
      "CascadiaMono-SemiLight",
      "CascadiaMonoPL-SemiLight",
      "CascadiaCodePL-ExtraLight",
      "Fresko_MS",
      "windows-stock",
      "ms_song",
      "Travis Sans MS",
      "font-Pixel-Cowboy",
      "font-stencil_pixel-7",
      "font-BerlinFraktur-24",
      "font-SFAlienEncountersSolid",
      "font-Retroville-NC",
      "font-vcr",
      "font-wide_pixel-7",
      "font-Retrolab",
      "font-Donatello",
      "font-Fipps-Regular",
      "font-Streamster",
      "font-Logo-Font",
      "font-Donatello",
      "font-SF-RetroSplice",
      "font-sg05",
      "font-SF-RetroSplice-Condensed",
      "font-SFAlienEncounters",
      "font-LearningCurve",
      "font-SF-RetroSplice-SC-Condensed",
      "font-SF-RetroSplice-Shaded",
      "f-Retroville-NC",
      "font-VCR_OSD_MONO_1",
      "font-paskowy",
      "font-Extrude",
      "font-Pixel-LCD-7",
      "font-PixelByzantine",
      "font-Adventurer",
      "font-SF-RetroSplice-SC-Outline",
      "font-Little-Snorlax",
      "font-SF-RetroSplice-SC-Shaded",
      "font-bubble_pixel-7",
      "font-PressStart2P-vaV7",
      "font-SF-RetroSplice-SC",
      "font-Razor",
      "font-Retrolab",
      "font-Minecraftia-Regular",
      "font-zx_spectrum-7",
      "font-zadob",
      "font-Little-bird",
      "font-Angelface",
      "font-H4VintageRetro",
      "font-Frikativ",
      "font-GaelleNumber3",
      "font-Retron2000",
      "font-Vermin-Vibes-1989",
      "font-Sabo-Regular",
      "font-nnumber",
      "font-Retro-Gamer",
      "font-hachicro",
      "font-SFAlienEncounters-Italic",
      "font-SFAlienEncountersSolid-Ital",
      "font-SUPERSCR",
      "font-alphbeta",
      "font-windows",
      "font-MetroRetroNF",
      "f-Adventurer",
      "font-glitch",
      "font-SF-RetroSplice-Outline",
    ];
  }
}

export { TemplateEngine, BASE_URL, ENV, renderPage };
