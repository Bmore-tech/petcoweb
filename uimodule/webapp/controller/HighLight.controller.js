sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/Fragment"
], function (BaseController, Fragment) {
	"use strict";

	return BaseController.extend("com.bmore.inveweb.controller.HighLight", {

		onInit: function () {
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

			this.getView().addDelegate({
				onBeforeShow: function (evt) {
					sap.ui.getCore().byId("container-inveweb---idAppControl").getController().dashboardFrescuraNavbar();
					const loading = google.charts.load('current', { 'packages': ['corechart'] });
					loading.then(function () {
						this.drawChartStockAge("myHBox", "400", "300");
					}.bind(this));
				}.bind(this)
			});

		},
		drawChartStockAge: function ( container,width, height) {
			var data = google.visualization.arrayToDataTable([
				['Month', 'Y19', 'Y20'],
				['Ene', 99.69, 99.75],
				['Feb', 99.65, 99.99],
				['Mar', 99.74, 99.94],
				['Abr', 99.67, 99.38],
				['May', 96.41, 99.29],
				['Jun', 96.34, 99.20],
				['Jul', 97.52, 97.97],
				['Ago', 99.49, 98.71],
				['Sep', 99.93, 99.87],
				['Oct', 99.94, 99.97],
				['Nov', 99.84, 100],
				['Dic', 99.70, 100]
			  ]);
			let options = {
				'width': width,
				'height': height
			};
			// Instantiate and draw our chart, passing in some options.
			var chart = new google.visualization.LineChart(this.getView().byId(container).getDomRef());
			chart.draw(data, options);
		},
		
		openChart: function () {
			let oView = this.getView();
			if (!this.byId("oDialogFreeLane")) {
				Fragment.load({
					id: oView.getId(),
					name: "com.bmore.inveweb.view.fragments.Chart",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.open();
					oDialog.addStyleClass("sapUiSizeCompact");
					this.drawChartStockAge("chart", "600", "500")
				}.bind(this));
			} else {
				this.byId("oDialogFreeLane").open();
				this.drawChartStockAge("chart", "600", "500")
				this.byId("oDialogFreeLane").addStyleClass("sapUiSizeCompact");
			}
		},
		_closeChart: function () {
			this.byId("oDialogFreeLane").close();
		},
	});
});
