/**
 * Event listeners and template constructor for login page of ostaa
 * shopping app pa10.
 * @author Christian P. Byrne
 */

import { TemplateEngine, BASE_URL, ENV, renderPage } from "../index.js";

function loginHandlers() {
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
            let errorNode = document.createElement("p");
            errorNode.style.setProperty("background-image", "none")
            errorNode.style.setProperty("background", "#f06c86")
            errorNode.classList.toggle("vibrate")
            errorNode.innerHTML = errorMsg;
            setTimeout(() => { errorNode.remove()}, 1000)
            document.querySelector("#right").appendChild(errorNode);
          } else {
            sessionStorage.setItem("login", mutation);
            if (entryType == "register") {
              alert("Account Created");
            }
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
      // This should be more selective -- add "off" class as selector.
      target.tagName == "DIV" &&
      target.id !== "left"
    ) {
      target.classList.toggle("active");
    }
  });
}

function loginRender() {
  document.title = "Login | Ostaa";
  const pageOptions = {
    gridTemplateAreas: `"main-left main-right" "footer footer"`,
    gridTemplateRows: "1fr min-content",
  };
  const page = new TemplateEngine("Login or Register", pageOptions);
  page.css.update("./css/login.css");

  page.layout.addLeft([
    page.component.loginForm("Sign In", "LOGIN", "login"),
    page.component.loginForm("Sign Up", "REGISTER", "register"),
  ]);

  page.layout.addRight(
    page.component.maskedtext("Ostaa", "img/1.webp", "h6", {
      "font-size": "9rem",
      padding: "0.5ch 0 0 0",
      margin: "0",
    })
  );
  page.layout.useFooter();
}

export { loginHandlers, loginRender };
