/**
 * Event listeners and template constructor for home page of
 * ostaa shopping app pa10
 * @author Christian P. Byrne
 */

import { TemplateEngine } from "./index.js";

/**
 * @classdesc Dashboard page constructor for Ostaa app.
 */
class DashboardPage {
  constructor(mainTitle, controlsTitle, templateOptions) {
    document.title = mainTitle;
    this.page = new TemplateEngine(controlsTitle, templateOptions);
    this.page.css.update("./css/dashboard.css");
    this.page.layout.useNavbar();

    // Inheriting why?
    this.addLeft = this.page.layout.addLeft
    this.addRight = this.page.layout.addRight
    this.component = this.page.component
    this.layout = this.page.layout
    this.tag = this.page.tag
    this.css = this.page.css
    this.clear = this.page.clear 
  }

  get style() {
    return this.page.styleSheet
  }
}

export default DashboardPage;
