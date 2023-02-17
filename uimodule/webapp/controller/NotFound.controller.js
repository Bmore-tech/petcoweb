sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("com.bmore.inveweb.controller.NotFound", {

		/**
		 * Navigates to the inventarioPT when the link is pressed
		 * @public
		 */
		onLinkPressed : function () {
			this.getRouter().navTo("inventarioPT");
		}

	});

});