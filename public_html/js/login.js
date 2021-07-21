/**
 * Event listeners and template constructor for login page of ostaa
 * shopping app pa10.
 * @author Christian P. Byrne
 */

import { TemplateEngine, BASE_URL, ENV, renderPage } from "./index.js";

function loginHandlers() {
  const outputField = document.querySelector("body > div:nth-of-type(3)");
  document.body.addEventListener("click", async (event) => {
    const target = event.target;
    if (target.tagName == "INPUT" && target.getAttribute("type") == "button") {
      let mutation = target.parentElement.querySelectorAll("input")[0].value;
      let entryType = target.parentElement.id;
      $.ajax({
        url: `${BASE_URL}/${entryType}/`,
        type: "POST",
        data: $(`#${entryType}`).serializeArray(),
        success: function (response) {
          if (!response) {
            let errorMsg;
            if (entryType == "register") {
              if (response === false) {
                errorMsg = "Username-Password combination already exists D: ";
              } else if (response === null) {
                errorMsg = "Server Error while creating user document.";
              }
            } else if (entryType == "login") {
              errorMsg = "Incorrect username-password.";
            }
            outputField.innerHTML = errorMsg;
          } else {
            sessionStorage.setItem("login", mutation);
            if (ENV === "api-demo") {
              renderPage("api");
            } else if (ENV === "production") {
              renderPage("home");
            }
          }
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

function loginRender() {
  document.title = "Login | Ostaa";
  const page = new TemplateEngine("Login or Register");
  page.updateStylesheet("./css/login.css");

  // Left column.
  page.addLeft([
    page.loginForm("Sign In", "LOGIN", "login"),
    page.loginForm("Sign Up", "REGISTER", "register"),
  ]);

  // Right column.
  page.right.innerHTML = `<h6>Ostaa</h6>`;

  // Footer.
  page.useFooter();
}

export { loginHandlers, loginRender };
