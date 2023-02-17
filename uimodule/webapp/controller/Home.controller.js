sap.ui.define([
  "com/bmore/inveweb/controller/BaseController",
], function (Controller) {
  "use strict";

  return Controller.extend("com.bmore.inveweb.controller.Home", {
    onInit: function () {
      this.getView().addDelegate({
        onBeforeShow: function () {
          sap.ui.getCore().byId("container-inveweb---idAppControl").getController().getCheckSession();
          sap.ui.getCore().byId("container-inveweb---idAppControl").getController().homeNavbar();
        }.bind(this)
      });
    },
    details: function(){
      this.byId("IconTabBar_detail").setVisible(true);
      this.byId("toolbar_detail").setVisible(true);
    },
    normalSearch: function(){
      this.byId("table_search").setVisible(true);
    },
    advancedSearch: function(){
      this.byId("table_search").setVisible(true);
    },
    advancedSearchButton: function(){
      this.byId("normal_search").setVisible(false);
      this.byId("advanced_search").setVisible(true);
      this.byId("advancedSearch_button").setVisible(false);
      this.byId("advancedSearch_buttons").setVisible(true);
    },
    advancedSearchClose: function(){
      this.byId("normal_search").setVisible(true);
      this.byId("advanced_search").setVisible(false);
      this.byId("advancedSearch_button").setVisible(true);
      this.byId("advancedSearch_buttons").setVisible(false);
    }

  });
});
