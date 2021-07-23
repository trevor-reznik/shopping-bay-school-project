/**
 * @author Christian P. Byrne
 *
 */

import { BASE_URL } from "../index.js";
import DashboardPage from "../dashboard.js";

/**
 * Render a dashboard page for the Ostaa app.
 */
function renderOstaa() {
  const dashboard = new DashboardPage("Home | Ostaa", "Shop | Sell");
  dashboard.addLeft([
    dashboard.page.component.searchField("search-items"),
    dashboard.page.component.searchField("home listings"),
    dashboard.page.component.searchField("home purchases"),
    dashboard.page.component.listingForm("Post a Listing", "SELL"),
  ]);

  dashboard.page.layout.useFooter();
  /**
   *
   * Display results from xhr queries to output container.
   * @param {Items[]} json -  Array of Item objects from DB.
   * @returns
   */
  dashboard.itemHook = (json) => {
    const outputNode = document.querySelector("#right");

    for (const item of json) {
      let container = dashboard.page.constructNode({
        classes: "item-container",
      });
      let itemImg = dashboard.page.constructNode({
        tag: "img",
        classes: "custom",
      });
      if (Object.getOwnPropertyNames(item).includes("image")) {
        itemImg.src = `img/${item.image}`;
      } else {
        itemImg.src = "https://via.placeholder.com/250";
      }
      let itemTitle = dashboard.page.constructNode({
        tag: "h5",
        inner: item.title,
        background: "var(--teal)",
        textLightness: 87,
        styleMap: {
          textAlign: "center",
        },
      });
      let description = dashboard.page.constructNode({
        classes: ["description", "custom"],
        inner: item.description,
      });
      let botContainer = dashboard.page.constructNode({
        classes: ["custom", "bot-container"],
      });
      let price = dashboard.page.constructNode({
        classes: "price",
        inner: item.price,
      });
      let status = dashboard.page.constructNode({
        classes: "status",
        inner: `${item.stat == "sold" ? "PURCHASED" : "FOR SALE"}`,
      });
      let buyBtn = dashboard.page.constructNode({
        tag: "input",
        propertiesMap: {
          type: "submit",
          value: `${item.stat == "sold" ? "SOLD OUT" : "BUY NOW"}`,
          data: `${item._id}`,
          style: `--selected-color: ${
            item.stat == "sold" ? "var(--dark)" : "var(--secondary)"
          }`,
        },
        styleMap: { width: "max-content" },
      });
      buyBtn.addEventListener("click", function () {
        if (this.value.toLowerCase() !== "sold out") {
          $.get(
            `${BASE_URL}/buy/${item._id}/${sessionStorage.getItem("login")}`
          );
          this.value = "SOLD OUT";
          this.status = "JUST PURCHASED!";
        } else {
          let vibrate = () => {
            this.classList.toggle("vibrate");
          };
          vibrate();
          setTimeout(() => {
            vibrate();
          }, 500);
        }
      });
      for (let node of [price, status]) {
        botContainer.appendChild(node);
      }
      for (let node of [
        itemTitle,
        itemImg,
        description,
        botContainer,
        buyBtn,
      ]) {
        container.appendChild(node);
      }
      outputNode.appendChild(container);
    }
  };
  dashboard.xhrHandlers = (handlerOptions) => {
    const { path, keyword, method } = handlerOptions;
    // GET XHR options.
    const ajaxOptions = {
      url: `${BASE_URL}/${path}/${keyword ? keyword : "guest"}`,
      type: method,
      success: dashboard.itemHook,
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
        alert("Item listed");
        let inputs = document.querySelector("#item").querySelectorAll("input")
        for ( const node of inputs) {
          node.value = ""
        }
      },
      // If you want to add an extra field for the FormData
      //data.append("CustomField", "This is some extra data, testing");
    };
    if (path == "add/item") {
      Object.assign(ajaxOptions, postItemOptions);
    }
    $.ajax(ajaxOptions);
  };

  // LISTENERS/
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
      dashboard.xhrHandlers(handlerOptions[target.id]);
    }
    // Navbar hyperlinks.
    else if (target.tagName == "B") {
      if (target.innerHTML == "Home") {
        window.location = "/";
      } else if (target.innerHTML == "Browse") {
        document
          .querySelector("#left > div:nth-of-type(1)")
          .classList.toggle("active");
      } else if (target.innerHTML == "Profile") {
        document
          .querySelector("#left > div:nth-of-type(2)")
          .classList.toggle("active");
        alert("user:" + sessionStorage.getItem("login"));
      } else if (target.innerHTML == "Purchases") {
        document
          .querySelector("#left > div:nth-of-type(3)")
          .classList.toggle("active");
      } else if (target.innerHTML == "About") {
        document.querySelector("#right").innerHTML =
          "This is information about the site. It is a peer-to-peer ecommerce hub called Ostaa.";
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

export default renderOstaa;
