/**
 * Event listeners and template constructor for api methods demo 
 * page.
 * @author Christian P. Byrne
 */

import { TemplateEngine, BASE_URL } from "./index.js";

/**
 * Binds handlers for the API Demo Page.
 * 
 * Binds single listener to body node that uses delegation.
 * Assumes other listeners were cleared first.
 * 
 * @listens document#click
 */
function apiHandlers() {
  document.body.addEventListener("click", async (event) => {
    const target = event.target;
    // GET: Keyword query methods.
    if (target.id == "clear") {
      document.querySelector("#json-viewer").innerText = "";
    } else if (
      ["purchases", "listings", "searchU", "searchI"].includes(target.id)
    ) {
      let path;
      if (target.id == "purchases") {
        path = "get/purchases";
      }
      if (target.id == "listings") {
        path = "get/listings";
      }
      if (target.id == "searchU") {
        path = "search/users";
      }
      if (target.id == "searchI") {
        path = "search/items";
      }
      const keyword = target.previousElementSibling.value;
      const url = `${BASE_URL}/${path}/${keyword}`;
      $.get(url).then((response) => {
        $("#json-viewer").jsonViewer(response);
      });
    } else if (
      // GET: Query all methods.
      (target.tagName == "INPUT" && target.getAttribute("type") == "button") ||
      target.getAttribute("type") == "submit"
    ) {
      if (target.value === "Get Users") {
        $.get(`${BASE_URL}/get/users/`).then((response) => {
          $("#json-viewer").jsonViewer(response);
        });
      } else if (target.value === "Get Items") {
        $.get(`${BASE_URL}/get/items/`).then((response) => {
          $("#json-viewer").jsonViewer(response);
        });
      } else {
        // POST form data | Create Item or Create User.
        // On success, query the new record and display in Json Viewer Node.
        // Too lazy to make it work on create items, because the search functio nuses
        // the descriptoin field instead of name.
        let mutation = target.parentElement.querySelectorAll("input")[0].value;
        let entryType = target.parentElement.id;
        $.ajax({
          url: `${BASE_URL}/add/${entryType}/${
            entryType == "item" ? sessionStorage.getItem("login") : ""
          }`,
          type: "POST",
          data: $(`#${entryType}`).serializeArray(),
          success: function (response) {
            $.get(`${BASE_URL}/search/${entryType}s/${mutation}`).then(
              (response) => {
                $("#json-viewer").jsonViewer(response);
              }
            );
          },
        });
      }
    } else if (
      // Collapse and expand sections.
      target.tagName == "DIV" &&
      target.id !== "left" &&
      target.children[0].id !== "json-viewer"
    ) {
      target.classList.toggle("active");
    }
  });
}

/**
 * Render API Methods Demo Page.
 * 
 * Render the API Methods Demo page with the interactive
 * json viewer/editor. Links to static images in json objects
 * are clickable, and sections are collapsible. Void.
 * 
 * @implements {TemplateEngine}
 */
function apiRender() {
  document.title = "API Methods | Ostaa";
  const page = new TemplateEngine("Click on API methods to expand");
  page.css.update("./css/api-methods.css");

  // Left column.
  page.layout.addLeft([
    page.component.loginForm("Add User", "POST"),
    page.component.listingForm("Add Item", "POST"),
    page.component.searchField("users"),
    page.component.searchField("items"),
    page.component.searchField("user listings"),
    page.component.searchField("user purchases"),
  ]);
  const boxArgs = [
    ["All Users", "GET"],
    ["All Items", "GET"],
  ];
  const boxes = page._boxesFromArray(boxArgs);
  const inputFields = [[{ value: "Get Users" }], [{ value: "Get Items" }]];
  for (const [index, box] of Object.entries(boxes)) {
    page._batchAppendInputs(box, inputFields[index]);
    page.layout.addLeft(box);
  }

  // Right column.
  page.right.innerHTML = `<button id="clear">Clear</button><pre id="json-viewer"></pre>`;
}

export { apiRender, apiHandlers };
