sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	],
	function (Controller,BusyIndicator) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vDashboardFrescura", {


	onInit: function() {
		
		/*if(this.onInitFlag == undefined){
			console.log("Entrando");
		}else{
			return;
		}*/
		console.log("[vDashboardFrescura] Entrando");
		
		//Code to execute every time view is displayed
		this.getView().addDelegate({
				
			onBeforeShow: function(evt) {
			console.log("[vDashboardFrescura] Siempre se ejecuta");
			this.byId("idIconTabBar").setSelectedKey("worklist");
			if(this.roleExists("STOCK_LOTES")){
				this.byId("itfStockLotes").setVisible(true);
			}else{
				this.byId("itfStockLotes").setVisible(false);
			}
			if(this.roleExists("INVE_MX")){
				this.byId("itfPT").setVisible(true);
				/* this.byId("itfHL").setVisible(true); */
				sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vInventarioPTFrescura').getController().semiInit();
				this.byId("idIconTabBar").setSelectedKey("worklist");
			}else if(this.roleExists("INVE_CO")){
				this.byId("itfPT").setVisible(false);
				/* this.byId("itfHL").setVisible(false); */
				sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vSavedConciliationsFrescura').getController().semiInit();
				this.byId("idIconTabBar").setSelectedKey("docsFrescura");
			}
			
			
				if(this.onInitFlag == undefined){
					this.onInitFlag = true;
					
				}else{
					console.log("apagando busy");
					BusyIndicator.hide();
				}
				

	        }.bind(this)
	    });

		
	},

	onNav: function(oEvent){
		
		let selectedKey = oEvent.getSource().getProperty("selectedKey");
		
		switch(selectedKey){
			case "highLight": sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vInventarioPTFrescura').getController().getPT_forGraph();
			sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vHighLightFrescura--idPanel').setHeaderText(
					"REPORTE DE FRESCURA DE PRODUCTO TERMINADO "+sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vInventarioPTFrescura--werks').getSelectedItem().getText().toUpperCase());
			break;
			case "docsFrescura":sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vSavedConciliationsFrescura').getController().semiInit();
			break;
			case "stockLotes": sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vStockLotes').getController().semiInit();
			default: console.log("Tab no reconocido");
		}
		},
		
});
}
);