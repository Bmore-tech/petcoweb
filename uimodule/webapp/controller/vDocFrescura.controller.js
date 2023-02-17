sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	],
	function (Controller,BusyIndicator) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vDocFrescura", {

/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf cyclicalinventoriesweb.vDocFrescura
*/
	onInit: function() {
		//Code to execute every time view is displayed
		this.getView().addDelegate({
				
			onBeforeShow: function(evt) {
			console.log("[vDashboardFrescura] Siempre se ejecuta");
			sap.ui.getCore().byId('container-inveweb---vDocFrescura--vConciliacionFrescura').getController().cleanView();
			sap.ui.getCore().byId('container-inveweb---vDocFrescura--vConciliacionDocumentoFrescura').getController().semiInit();
				if(this.onInitFlag == undefined){
					this.onInitFlag = true;
					
				}else{
					console.log("apagando busy");
					BusyIndicator.hide();
				}
				

	        }.bind(this)
	    });
		
	},

	
});
}
);