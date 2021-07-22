/**
 * Event listeners and template constructor for home page of
 * ostaa shopping app pa10
 * @author Christian P. Byrne
 */

import { TemplateEngine, BASE_URL } from "./index.js";

/**
 *
 * Display results from xhr to output container.

 * @param {Items[]} json -  Array of Item objects from DB.
 * @returns
 */
function listingHook(json) {

  const outputNode = document.querySelector("#right");
  outputNode.innerHTML = "";
  for (const item of json) {
    let container = document.createElement("div");
    container.classList.add("item-container");

    let itemImg = document.createElement("img");
    if (Object.getOwnPropertyNames(item).includes("image")) {
      itemImg.src = item.image
        ? `img/${item.image}`
        : "https://via.placeholder.com/250";
    } else {
      itemImg.src = "https://via.placeholder.com/250";
    }
    itemImg.classList.add("custom");

    let itemTitle = document.createElement("h6");
    itemTitle.innerHTML = item.title;

    let description = document.createElement("div");
    description.classList.add("description");
    description.classList.add("custom");
    description.innerHTML = item.description;

    let botContainer = document.createElement("div");
    botContainer.classList.add("custom");
    botContainer.classList.add("bot-container");

    let price = document.createElement("div");
    price.classList.add("price");
    price.innerHTML = item.price;

    let status = document.createElement("div");
    status.classList.add("status");
    status.innerHTML = item.stat;

    let buyBtn = document.createElement("input");
    buyBtn.type = "submit";
    buyBtn.data = `${item._id}`;
    buyBtn.style.width = "max-content";
    if (item.stat.toLowerCase() != "sold") {
      buyBtn.value = "Buy Now";
      buyBtn.addEventListener("click", function() {
        $.get(`${BASE_URL}/buy/${item._id}/${sessionStorage.getItem("login")}`)
        let sold = document.createElement("b")
        sold.innerHTML = "SOLD"
        this.appendChild(sold);
        this.remove();
      })
    }
    else {
      buyBtn.value = "SOLD OUT"
    }

    for (let node of [price, status]) {
      botContainer.appendChild(node);
    }

    for (let node of [itemImg, description, botContainer, buyBtn]) {
      container.appendChild(node);
    }
    outputNode.appendChild(container);
  }
}

function xhrHandlers(handlerOptions) {
  // Destructure arg.
  const { path, keyword, method } = handlerOptions;

  // GET XHR options.
  const ajaxOptions = {
    url: `${BASE_URL}/${path}/${keyword ? keyword : "guest"}`,
    type: method,
    success: listingHook,
  };

  // POST with image XHR options.
  const postItemOptions = {
    data: new FormData(document.querySelector("#item")),
    enctype: "multipart/form-data",
    processData: false,
    contentType: false,
    cache: false,
    timeout: 800000,
    success: () => {
      console.log("item posted");
    },
    // If you want to add an extra field for the FormData
    //data.append("CustomField", "This is some extra data, testing");
  };
  if (path == "add/item") {
    Object.assign(ajaxOptions, postItemOptions);
  }
  $.ajax(ajaxOptions);
}

function homeHandlers() {
  document.body.addEventListener("click", async (event) => {
    const target = event.target;
    if (
      [
        "searchItems",
        "getMyPurchases",
        "getMyListings",
        "addListingSubmit",
      ].includes(target.id)
    ) {
      const handlerOptions = {
        searchItems: {
          path: "search/items",
          keyword: target.parentElement.querySelector("input")
            ? target.parentElement.querySelector("input").value
            : "",
          method: "GET",
        },
        getMyPurchases: {
          path: "get/purchases",
          keyword: sessionStorage.getItem("login"),
          method: "GET",
        },
        getMyListings: {
          path: "get/listings",
          keyword: sessionStorage.getItem("login"),
          method: "GET",
        },
        addListingSubmit: {
          path: "add/item",
          keyword: sessionStorage.getItem("login"),
          method: "POST",
        },
      };
      xhrHandlers(handlerOptions[target.id]);
    }
    // Navbar hyperlinks.
    else if (
      target.tagName == "B"
    ) {
      if ( target.innerHTML == "Home" ) {
        window.location = "/"
      }
      else if (target.innerHTML == "Browse") {
        document.querySelector("#left > div:nth-of-type(1)").classList.toggle("active")
      }
      else if (target.innerHTML == "Profile") {
        document.querySelector("#left > div:nth-of-type(2)").classList.toggle("active")
        alert("user:" + sessionStorage.getItem("login"))
      }
      else if (target.innerHTML == "Purchases") {
        document.querySelector("#left > div:nth-of-type(3)").classList.toggle("active")
      }
      else if (target.innerHTML == "About") {
        document.querySelector("#right").innerHTML = "This is information about the site. It is a peer-to-peer ecommerce hub called Ostaa."
      }
    }
    // Collapse and expand sections.
    else if (
      target.tagName == "DIV" &&
      target.id !== "left" &&
      target.parentElement.id == "left"
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
