/**
 * Makeshift template engine for Ostaa app.
 * 
 * @exports
 * @author Christian P. Byrne
 */

import { apiRender, apiHandlers } from "./api.js";
import { loginRender, loginHandlers } from "./login.js";
import { homeRender, homeHandlers } from "./home.js";
const BASE_URL = "http://127.0.0.1:5000";

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
  document.querySelector("head").appendChild(dynamicStyle);
  if (sessionStorage.getItem("login")) {
    renderPage("home")
  }
  else {
    // for PA9: 
    renderPage("api")
    // for PA10:
    // renderPage("login")
  }
};

/**
 * Page loading functions for each page in app.
 * @param {string} page 
 */
function renderPage(page) {
  if (page === "api") {
    apiRender();
    apiHandlers();
  } else if (page === "login") {
    loginRender();
    loginHandlers();
  } else if (page === "home") {
      homeRender();
      homeHandlers();
  }
}

/**
 * 
 * @classdesc Clear current DOM and construct a new page
 * using the styles and template nodes/containers for the app.
 * 
 * Clears DOM and all listeners not binded to document or window.
 * 
 * @param {string} title  -  The title displayed on the toolbar.
 * 
 */
class TemplateEngine {
  constructor(title) {
    this.clearDOM();
    this.left = this.dialogBox("left");
    this.right = this.dialogBox("right");
    this.footer = this.dialogBox("footer");
    this.header = this.dialogBox("header");
    this.left.appendChild(this.toolbar(title));
    document.body.appendChild(this.left);
    document.body.appendChild(this.right);

    /** Append a header section to page. */
    this.useHeader = () => {
      document.body.prepend(this.header);
    };
    /** Append a footer section to page. */
    this.useFooter = () => {
      document.body.appendChild(this.footer);
    };
    /** 
     * @private 
     */
    this._push = (node, prepend, axis) => {
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
    };
    /**
     * Add a node to the left section of page.
     * @param {HTMLElement} node 
     * @param {Boolean}     [prepend=false] Append node if false.
     */
    this.addLeft = (node, prepend = false) => {
      this._push(node, prepend, "left");
    };
    /**
     * Add a node to the right section of page.
     * @param {HTMLElement} node 
     * @param {Boolean}     [prepend=false] Append node if false.
     */
    this.addRight = (node, prepend = false) => {
      this._push(node, prepend, "right");
    };
  }
  /**
   * Update the dynamic stylesheet.
   * @param {string} href Relative path to stylesheet. 
   */
  updateStylesheet = (href) => {
    let links = document.querySelectorAll("link");
    for (let link of links) {
      if (link.data === "dynamic") {
        link.href = href;
      }
    }
  };
  /**
   * Create and return a div container.
   * @param {string} mainId Sets id property of returned node. 
   * @returns {HTMLDivElement}
   */
  dialogBox = (mainId = "main") => {
    let main = document.createElement("div");
    main.setAttribute("id", mainId);
    return main;
  };
  /**
   * Create header node in style of app's theme.
   * Includes toolbar.
   * 
   * @param {string} titleText Text in title of header.
   * @returns {HTMLHeaderElement}
   */
  toolbar = (titleText = "Welcome") => {
    let header = document.createElement("header");
    let h6 = document.createElement("h6");
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
  };
  /**
   * @implements {HTMLDivElement}
   * @param {string} title        Title at top of div. 
   * @param {string} titleCaption Text in caption next to title. 
   * @returns {HTMLDivElement}
   */
  interactionBox = (title, titleCaption = false) => {
    let div = document.createElement("div");
    if (titleCaption) {
      let caption = document.createElement("b");
      caption.innerHTML = titleCaption;
      div.appendChild(caption);
    }
    div.innerHTML += title;
    return div;
  };
  /**
   * Creates an input node.
   * @param {{type?: string, value?: string,
   * name?: string, id?: string, placeholder?: string, 
   * label?: string | false}} options All options are optional.
   * @returns {HTMLInputElement}
   */
  inputBox = (options) => {
    let defaults = {
      type: "submit",
      value: "",
      name: "",
      id: "",
      placeholder: "Enter value. . .",
      label: false,
    };
    Object.assign(defaults, options);
    let input = document.createElement("input");
    for (const [property, value] of Object.entries(defaults)) {
      input.setAttribute(property, value);
    }
    if (defaults.label) {
      let labelNode = document.createElement("label");
      labelNode.innerHTML = defaults.label;
      labelNode.for = defaults.id;
      return [input, labelNode];
    }
    return input;
  };
  /**
   * Create form node in style of app theme.
   * @param {{id?: string | false, method?: string | false,
   * action? : string | false}} options Form properties.
   * @returns 
   */
  form = (options) => {
    let defaults = {
      id: false,
      method: false,
      action: false,
    };
    Object.assign(defaults, options);
    let formNode = document.createElement("form");
    for (const [property, value] of Object.entries(defaults)) {
      if (value) {
        formNode.setAttribute(property, value);
      }
    }
    return formNode;
  };
  /**
   * Turns array of interactionBox() constructor optoins 
   * into array of div nodes.
   * 
   * @param   {Array<string[]>}   argArray 
   * @returns {HTMLDivElement[]}
   */
  boxesFromArray = (argArray) => {
    const ret = [];
    for (const boxOptions of argArray) {
      ret.push(this.interactionBox(...boxOptions));
    }
    return ret;
  };
  /**
   * Construct collection of input nodes and append to container.
   * Pass a contianer div and an array of options objects.
   * @param {HTMLElement}   container
   * @param {object}        options
   * */
  batchAppendInputs = (container, options) => {
    for (const optionObj of options) {
      let input = this.inputBox(optionObj);
      if (input.length && input.length > 1) {
        container.appendChild(input[1]);
        container.appendChild(input[0]);
      } else {
        container.appendChild(input);
      }
    }
  };
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
  loginForm = (title, caption, formId = "user") => {
    const formContainer = this.interactionBox(title, caption);
    const form = this.form({ id: formId });
    const formFields = [
      { type: "text", name: "username", id: "username", label: "Username" },
      { type: "password", name: "password", id: "password", label: "Password" },
      { type: "button", value: "Submit" },
    ];
    this.batchAppendInputs(form, formFields);
    formContainer.appendChild(form);
    return formContainer;
  };
  /**
   * Construct the formatted listing form.
   * @param {string} title 
   * @param {string} caption 
   * @returns {HTMLDivElement}
   */
  listingForm = (title, caption) => {
    const formContainer = this.interactionBox(title, caption);
    const form = this.form({ id: "item" });
    const formFields = [
      { type: "text", name: "title", id: "title", label: "Title" },
      {
        type: "text",
        name: "description",
        id: "description",
        label: "Description",
      },
      { type: "text", name: "image", id: "image", label: "Image" },
      { type: "number", name: "price", id: "price", label: "Price" },
      { type: "text", name: "stat", id: "stat", label: "Stat" },
      { type: "button", value: "Submit" },
    ];
    this.batchAppendInputs(form, formFields);
    formContainer.appendChild(form);
    return formContainer;
  };
  /**
   * 
   * @param {string} type 
   * @returns {HTMLDivElement}
   */
  searchField = (type) => {
    let boxArgs;
    let inputFields;
    if (type === "users") {
      boxArgs = ["Search Users", "GET"];
      inputFields = [
        { type: "text", placeholder: "enter keyword..." },
        { id: "searchU", value: "Search" },
      ];
    } else if (type === "search-items") {
      boxArgs = ["Search Listings", "SHOP"];
      inputFields = [
        { type: "text", placeholder: "enter keyword..." },
        { id: "searchI", value: "Search" },
      ];
    } else if (type === "items") {
      boxArgs = ["Search Items", "GET"];
      inputFields = [
        { type: "text", placeholder: "enter keyword..." },
        { id: "searchI", value: "Search" },
      ];
    } else if (type === "home purchases") {
      boxArgs = ["View Your Purchases", "PROFILE"];
      inputFields = [
        { id: "my-purchases", value: "Get Purchase History" },
      ];
    } else if (type === "home listings") {
      boxArgs = ["View Your Listings", "PROFILE"];
      inputFields = [
        { id: "my-listings", value: "Get Listings History" },
      ];
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
    const container = this.interactionBox(...boxArgs);
    this.batchAppendInputs(container, inputFields);
    return container;
  };
  /**
   * Clears all nodes from body downwards (inclusive).
   * Also removes listeners in same scope.
   * Called in constructor.
   */
  clearDOM = () => {
    let root = document.querySelectorAll("body > div");
    for (let node of root) {
      node.remove();
    }
    document.body.remove();
    let newBody = document.createElement("body");
    document.documentElement.appendChild(newBody);
  };
}

export { TemplateEngine, BASE_URL, renderPage };
