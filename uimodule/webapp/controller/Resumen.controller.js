sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("com.bmore.inveweb.controller.Resumen", {

		onInit: function () {
			this.getView().addDelegate({
				onBeforeShow: function () {
					sap.ui.getCore().byId("container-inveweb---idAppControl").getController().dashboardFrescuraNavbar();
				}.bind(this)
			});
			var oGrid = this.getView().byId("Grid");
			oGrid.attachLayoutChange(function (oEvent) {
				let sLayout = oEvent.getParameter("layout");

				if (sLayout === "layoutXS" || sLayout === "layoutS") {
					oGrid.removeStyleClass("sapUiSmallMargin");
					oGrid.addStyleClass("sapUiTinyMargin");
				} else {
					oGrid.removeStyleClass("sapUiTinyMargin");
					oGrid.addStyleClass("sapUiSmallMargin");
				}
			});

		}

	});

});