sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/UIComponent",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "thirdparty/axios/dist/axios.min",
  ],
  function (BaseController, JSONModel, UIComponent, Filter, FilterOperator, MessageToast, MessageBox
  ) {
    "use strict";

    return BaseController.extend("com.bmore.inveweb.controller.InventarioPT", {
      onInit: function () {
        this.getView().addDelegate({
          onBeforeShow: function () {
            sap.ui.getCore().byId("container-inveweb---idAppControl").getController().dashboardFrescuraNavbar();
            
          }.bind(this)
        });
      },

    });

  });

