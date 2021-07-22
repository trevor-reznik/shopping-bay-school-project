/**
 * Event listeners and template constructor for home page of
 * ostaa shopping app pa10
 * @author Christian P. Byrne
 */

import { TemplateEngine, BASE_URL } from "./index.js";

/**
 * 
 * Display results from query to output container.
 * @param {*} json 
 * @returns 
 */
function listingHook(json) {
  console.dir(json);
  let container = document.createElement("div");
  let description = document.createElement("div");
  description.classList.add("description");
  description.innerHTML = json.description;
  let price = document.createElement("div");
  price.classList.add("price");
  price.innerHTML = json.price;
  let status = document.createElement("div");
  status.classList.add("status");
  status.innerHTML = json.status;

  let buyBtn = document.createElement("input");
  buyBtn.type = "submit";
  buyBtn.value = "Buy Now";
  buyBtn.id = `buy-${json._id}`;

  for (let node of [description, price, status, buyBtn]) {
    container.appendChild(node);
  }
  return container;
}

function homeHandlers() {
  document.body.addEventListener("click", async (event) => {
    const target = event.target;
    const outputNode = document.querySelector("body > div:nth-of-type(2)");
    if (target.id == "clear") {
      outputNode.innerHTML = "";
    } else if (["my-purchases", "my-listings", "searchI"].includes(target.id)) {
      let path;
      let keyword = sessionStorage.getItem("login");
      if (target.id == "my-purchases") {
        path = "get/purchases";
      }
      if (target.id == "my-listings") {
        path = "get/listings";
      }
      if (target.id == "searchI") {
        path = "search/items";
        keyword = target.previousElementSibling.value;
      }
      const url = `${BASE_URL}/${path}/${keyword}`;
      $.get(url).then((response) => {
        for (let item of response) {
          outputNode.appendChild(
            // TODO: get each individual item by querying by ID
            listingHook(item)
          );
        }
      });
    } else if (
      // GET: Query all methods.
      target.tagName == "INPUT" &&
      target.getAttribute("type") == "button"
    ) {
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
              // HANDLE RESPONSE
              $("#json-viewer").jsonViewer(response);
            }
          );
        },
      });
    } else if (
      // Collapse and expand sections.
      target.tagName == "DIV" &&
      target.id !== "left"
    ) {
      target.classList.toggle("active");
    }
  });
}

function homeRender() {
  document.title = "Home | Ostaa";
  const page = new TemplateEngine("Shop | Sell");
  page.css.update("./css/home.css");
  page.layout.useNavbar();
  page.layout.addLeft([
    page.component.searchField("search-items"),
    page.component.searchField("home listings"),
    page.component.searchField("home purchases"),
    page.component.listingForm("Post a Listing", "SELL"),
  ]);
}

export { homeRender, homeHandlers };
