sap.ui.define(
	[
		"./BaseController",
		"sap/ui/core/Fragment"
	],
	function (BaseController, Fragment) {
		"use strict";

		return BaseController.extend("com.bmore.inveweb.controller.vHighLightFrescura", {
			onInit: function () {
				console.log("vHighLight Iniciando", this.getView().getId());
				this.WarnPT=[];//Inicializando lista vacia para grafica drawChartPTLibre
        var oGrid = this.getView().byId("grid");
				oGrid.attachLayoutChange(function (oEvent) {
          var sLayout = oEvent.getParameter("layout");
          if (sLayout === "layoutXS" || sLayout === "layoutS") {
            oGrid.removeStyleClass("sapUiSmallMargin");
            oGrid.addStyleClass("sapUiTinyMargin");
          } else {
            oGrid.removeStyleClass("sapUiTinyMargin");
            oGrid.addStyleClass("sapUiSmallMargin");
          }
        });
        this.getView().byId("grid").setSnapToRow(true);
        this.getView().byId("grid3").setSnapToRow(true);
        this.getView().byId("grid3").setInlineBlockLayout(true);
        //this.getView().byId("grid").setAllowDenseFill(false);
			},



			getCanalesInventario: function (listaCanalesInv, totalT, totalR, totalF, totalT_HL, totalR_HL, totalF_HL) {
				try {
					console.log("Lista Canal", listaCanalesInv);
					for (let i in listaCanalesInv) {

						switch (listaCanalesInv[i].canal) {
							case "Tradicional":
								this.byId("cTT").setText(this.setFormat("2", listaCanalesInv[i].enTiempo));
								this.byId("cTR").setText(this.setFormat("2", listaCanalesInv[i].riesgo));
								this.byId("cTF").setText(this.setFormat("2", listaCanalesInv[i].fuera));
								break;

							case "Moderno":
								this.byId("cMT").setText(this.setFormat("2", listaCanalesInv[i].enTiempo));
								this.byId("cMR").setText(this.setFormat("2", listaCanalesInv[i].riesgo));
								this.byId("cMF").setText(this.setFormat("2", listaCanalesInv[i].fuera));
								break;

							case "Importacion":
								this.byId("cIT").setText(this.setFormat("2", listaCanalesInv[i].enTiempo));
								this.byId("cIR").setText(this.setFormat("2", listaCanalesInv[i].riesgo));
								this.byId("cIF").setText(this.setFormat("2", listaCanalesInv[i].fuera));
								break;

							case "Exportacion":
								this.byId("cET").setText(this.setFormat("2", listaCanalesInv[i].enTiempo));
								this.byId("cER").setText(this.setFormat("2", listaCanalesInv[i].riesgo));
								this.byId("cEF").setText(this.setFormat("2", listaCanalesInv[i].fuera));
								break;

							case "Barril Acero":
								this.byId("cBT").setText(this.setFormat("2", listaCanalesInv[i].enTiempo));
								this.byId("cBR").setText(this.setFormat("2", listaCanalesInv[i].riesgo));
								this.byId("cBF").setText(this.setFormat("2", listaCanalesInv[i].fuera));
								break;

							case "TradicionalHL":
								this.byId("cTT_HL").setText(this.setFormat("2", listaCanalesInv[i].enTiempo));
								this.byId("cTR_HL").setText(this.setFormat("2", listaCanalesInv[i].riesgo));
								this.byId("cTF_HL").setText(this.setFormat("2", listaCanalesInv[i].fuera));
								break;

							case "ModernoHL":
								this.byId("cMT_HL").setText(this.setFormat("2", listaCanalesInv[i].enTiempo));
								this.byId("cMR_HL").setText(this.setFormat("2", listaCanalesInv[i].riesgo));
								this.byId("cMF_HL").setText(this.setFormat("2", listaCanalesInv[i].fuera));
								break;

							case "ImportacionHL":
								this.byId("cIT_HL").setText(this.setFormat("2", listaCanalesInv[i].enTiempo));
								this.byId("cIR_HL").setText(this.setFormat("2", listaCanalesInv[i].riesgo));
								this.byId("cIF_HL").setText(this.setFormat("2", listaCanalesInv[i].fuera));
								break;

							case "ExportacionHL":
								this.byId("cET_HL").setText(this.setFormat("2", listaCanalesInv[i].enTiempo));
								this.byId("cER_HL").setText(this.setFormat("2", listaCanalesInv[i].riesgo));
								this.byId("cEF_HL").setText(this.setFormat("2", listaCanalesInv[i].fuera));
								break;

							case "Barril AceroHL":
								this.byId("cBT_HL").setText(this.setFormat("2", listaCanalesInv[i].enTiempo));
								this.byId("cBR_HL").setText(this.setFormat("2", listaCanalesInv[i].riesgo));
								this.byId("cBF_HL").setText(this.setFormat("2", listaCanalesInv[i].fuera));
								break;

							case "TRADICIONAL-21":
								this.byId("CTCJ21").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CTHL21").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CTCT21").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "TRADICIONAL22-60":
								this.byId("CTCJ22-60").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CTHL22-60").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CTCT22-60").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "TRADICIONAL61-120":
								this.byId("CTCJ61-120").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CTHL61-120").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CTCT61-120").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "TRADICIONAL121-164":
								this.byId("CTCJ121-164").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CTHL121-164").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CTCT121-164").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "TRADICIONAL+164":
								this.byId("CTCJplus164").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CTHLplus164").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CTCTplus164").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "EXPORTACION14":
								this.byId("CEXP_CJ14").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CEXP_HL14").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CEXP_CT14").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "EXPORTACION15-28":
								this.byId("CEXP_CJ15-28").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CEXP_HL15-28").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CEXP_CT15-28").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "EXPORTACION+28":
								this.byId("CEXP_CJ15plus28").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CEXP_HL15plus28").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CEXP_CT15plus28").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "IMPORTACION161":
								this.byId("CIMP_CJ161").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CIMP_HL161").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CIMP_CT161").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "IMPORTACION162-216":
								this.byId("CIMP_CJ162-216").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CIMP_HL162-216").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CIMP_CT162-216").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "IMPORTACION+216":
								this.byId("CIMP_CJplus216").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CIMP_HLplus216").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CIMP_CTplus216").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "MODERNO163":
								this.byId("CMOD_CJ163").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CMOD_HL163").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CMOD_CT163").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "MODERNO164-219":
								this.byId("CMOD_CJ164-219").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CMOD_HL164-219").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CMOD_CT164-219").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "MODERNO+219":
								this.byId("CMOD_CJplus219").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CMOD_HLplus219").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CMOD_CTplus219").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "BARRILACERO7":
								this.byId("CBA_CJ7").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CBA_HL7").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CBA_CT7").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "BARRILACERO8-22":
								this.byId("CBA_CJ8-22").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CBA_HL8-22").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CBA_CT8-22").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							case "BARRILACERO+22":
								this.byId("CBA_CJplus22").setText(this.setFormat("2", listaCanalesInv[i].cajas));
								this.byId("CBA_HLplus22").setText(this.setFormat("2", listaCanalesInv[i].hl));
								this.byId("CBA_CTplus22").setText("$" + this.setFormat("2", listaCanalesInv[i].costoTotal));
								break;

							default: console.log("[getCanalesInventario] Canal no válido");
						}
					}

					this.byId("cTotalT").setText(this.setFormat("2", totalT));
					this.byId("cTotalR").setText(this.setFormat("2", totalR));
					this.byId("cTotalF").setText(this.setFormat("2", totalF));

					this.byId("cTotalT_HL").setText(this.setFormat("2", totalT_HL));
					this.byId("cTotalR_HL").setText(this.setFormat("2", totalR_HL));
					this.byId("cTotalF_HL").setText(this.setFormat("2", totalF_HL));

					this.byId("CTCJ_Total").setText(this.setFormat("2", parseFloat(this.byId("CTCJ21").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CTCJ22-60").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CTCJ61-120").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CTCJ121-164").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CTCJplus164").getText().replace(/,/g, ""))));

					this.byId("CTHL_Total").setText(this.setFormat("2", parseFloat(this.byId("CTHL21").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CTHL22-60").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CTHL61-120").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CTHL121-164").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CTHLplus164").getText().replace(/,/g, ""))));

					this.byId("CTCT_Total").setText("$" + this.setFormat("2", parseFloat(this.byId("CTCT21").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CTCT22-60").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CTCT61-120").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CTCT121-164").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CTCTplus164").getText().replace(/,/g, "").replace("$", ""))));

					this.byId("CEXP_CJ_Total").setText(this.setFormat("2", parseFloat(this.byId("CEXP_CJ14").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CEXP_CJ15-28").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CEXP_CJ15plus28").getText().replace(/,/g, ""))));

					this.byId("CEXP_HL_Total").setText(this.setFormat("2", parseFloat(this.byId("CEXP_HL14").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CEXP_HL15-28").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CEXP_HL15plus28").getText().replace(/,/g, ""))));

					this.byId("CEXP_CT_Total").setText("$" + this.setFormat("2", parseFloat(this.byId("CEXP_CT14").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CEXP_CT15-28").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CEXP_CT15plus28").getText().replace(/,/g, "").replace("$", ""))));

					this.byId("CIMP_CJ_Total").setText(this.setFormat("2", parseFloat(this.byId("CIMP_CJ161").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CIMP_CJ162-216").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CIMP_CJplus216").getText().replace(/,/g, ""))));

					this.byId("CIMP_HL_Total").setText(this.setFormat("2", parseFloat(this.byId("CIMP_HL161").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CIMP_HL162-216").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CIMP_HLplus216").getText().replace(/,/g, ""))));

					this.byId("CIMP_CT_Total").setText("$" + this.setFormat("2", parseFloat(this.byId("CIMP_CT161").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CIMP_CT162-216").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CIMP_CTplus216").getText().replace(/,/g, "").replace("$", ""))));

					this.byId("CMOD_CJ_Total").setText(this.setFormat("2", parseFloat(this.byId("CMOD_CJ163").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CMOD_CJ164-219").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CMOD_CJplus219").getText().replace(/,/g, ""))));

					this.byId("CMOD_HL_Total").setText(this.setFormat("2", parseFloat(this.byId("CMOD_HL163").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CMOD_HL164-219").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CMOD_HLplus219").getText().replace(/,/g, ""))));

					this.byId("CMOD_CT_Total").setText("$" + this.setFormat("2", parseFloat(this.byId("CMOD_CT163").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CMOD_CT164-219").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CMOD_CTplus219").getText().replace(/,/g, "").replace("$", ""))));

					this.byId("CBA_CJ_Total").setText(this.setFormat("2", parseFloat(this.byId("CBA_CJ7").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CBA_CJ8-22").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CBA_CJplus22").getText().replace(/,/g, ""))));

					this.byId("CBA_HL_Total").setText(this.setFormat("2", parseFloat(this.byId("CBA_HL7").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CBA_HL8-22").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CBA_HLplus22").getText().replace(/,/g, ""))));

					this.byId("CBA_CT_Total").setText("$" + this.setFormat("2", parseFloat(this.byId("CBA_CT7").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CBA_CT8-22").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CBA_CTplus22").getText().replace(/,/g, "").replace("$", ""))));

					//total pt
					this.byId("totalPT_CJ").setText(this.setFormat("2", parseFloat(this.byId("CTCJ_Total").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CEXP_CJ_Total").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CIMP_CJ_Total").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CMOD_CJ_Total").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CBA_CJ_Total").getText().replace(/,/g, ""))));

					this.byId("totalPT_HL").setText(this.setFormat("2", parseFloat(this.byId("CTHL_Total").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CEXP_HL_Total").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CIMP_HL_Total").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CMOD_HL_Total").getText().replace(/,/g, "")) +
						parseFloat(this.byId("CBA_HL_Total").getText().replace(/,/g, ""))));

					this.byId("totalPT_CT").setText("$ " + this.setFormat("2", parseFloat(this.byId("CTCT_Total").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CEXP_CT_Total").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CIMP_CT_Total").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CMOD_CT_Total").getText().replace(/,/g, "").replace("$", "")) +
						parseFloat(this.byId("CBA_CT_Total").getText().replace(/,/g, "").replace("$", ""))));
				} catch (e) {
					console.error(e);
				}

			},

			calculateKPI: function (expoLibrePlus14,librePlus20, totalLockedHL, HL_FueraFrescuera, sumTotalHL, sumCSPEM, sumCINSM,
				liberadosDestruccionMenor30, liberadosDestruccionMayor30, vigentes, apegoDestruccion, HLDestruccion) {

				this.byId("kpi_ExpoLibre14").setText(this.setFormat("2", expoLibrePlus14));
				this.byId("kpi_NalLibre20").setText(this.setFormat("2", librePlus20));
				this.byId("kpi_HL_Riesgo20").setText(this.setFormat("2", librePlus20 + expoLibrePlus14));
				this.byId("kpi_ProdBloqueado").setText(this.setFormat("2", totalLockedHL));
				this.byId("kpi_HLFueraFrescura").setText(this.setFormat("2", HL_FueraFrescuera));
				this.byId("kpi_HLTotales").setText(this.setFormat("2", sumTotalHL));
				this.byId("kpi_StockAgeIndexQA").setText(this.setFormat("2", (100 * (sumTotalHL - HL_FueraFrescuera) / sumTotalHL)) + "%");

				//Calculos del card: PT Retenido con Decisión de Empleo
				//Sumar HL_Totales si el campo 'Decision de empleo' es 'Filtro'
				this.byId("ptRetenido_HL_Filtro").setText();
				//Sumar HL_Totales si el campo 'Decision de empleo' es 'Destruccion'
				this.byId("ptRetenido_HL_Destruccion").setText(this.setFormat("2", HLDestruccion));

				//KPIs
				this.byId("kpis_InvPTTotal").setText(this.byId("totalPT_HL").getText());
				this.byId("kpis_StockAgeIndexQA").setText(this.byId("kpi_StockAgeIndexQA").getText());
				this.byId("kpis_ProdBloqueado").setText(this.byId("kpi_ProdBloqueado").getText());
				this.byId("kpis_FueraFrescura").setText(this.byId("kpi_HLFueraFrescura").getText());
				this.byId("kpis_LibrePlus20dias").setText(this.byId("kpi_NalLibre20").getText());
				this.byId("kpis_LibrePlus14dias").setText(this.byId("kpi_ExpoLibre14").getText());
				//this.byId("kpis_MetaStockAge").setText(this.byId("").getText());//NO SE SABE COMO SE OBTIENE EL VALOR


				this.byId("kpis_ProductoEnTiempo").setText(this.setFormat("2", parseFloat(this.byId("CTCT21").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CTCT22-60").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CEXP_CT14").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CIMP_CT161").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CMOD_CT163").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CBA_CT7").getText().replace(/,/g, "").replace("$", ""))));

				this.byId("kpis_ProductoEnRiesgo").setText(this.setFormat("2", parseFloat(this.byId("CTCT61-120").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CTCT121-164").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CEXP_CT15-28").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CIMP_CT162-216").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CMOD_CT164-219").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CBA_CT8-22").getText().replace(/,/g, "").replace("$", ""))));

				this.byId("kpis_ProductoFueraEsp").setText(this.setFormat("2", parseFloat(this.byId("CTCTplus164").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CEXP_CT15plus28").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CIMP_CTplus216").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CMOD_CTplus219").getText().replace(/,/g, "").replace("$", "")) +
					parseFloat(this.byId("CBA_CTplus22").getText().replace(/,/g, "").replace("$", ""))));

				this.byId("kpis_ValorInv").setText(this.setFormat("2", parseFloat(this.byId("kpis_ProductoEnTiempo").getText().replace(/,/g, "")) +
					parseFloat(this.byId("kpis_ProductoEnRiesgo").getText().replace(/,/g, "")) +
					parseFloat(this.byId("kpis_ProductoFueraEsp").getText().replace(/,/g, ""))));

				this.byId("kpis_RetenidoStatusS").setText(this.setFormat("2", sumCSPEM));
				this.byId("kpis_RetenidoStatusQ").setText(this.setFormat("2", sumCINSM));
				this.byId("kpis_LiberadosDEdestrMenor30").setText(this.setFormat("2", liberadosDestruccionMenor30));
				this.byId("kpis_LiberadosDEdestrMayor30").setText(this.setFormat("2", liberadosDestruccionMayor30));
				//this.byId("kpis_LiberadosMayor168DFresc").setText(this.byId("").getText()); PENDIENTE
				//this.byId("kpis_LiberadosMenor168DFresc").setText(this.byId("").getText()); PENDIENTE
				this.byId("kpis_RetVigentes").setText(this.setFormat("2", vigentes));
				this.byId("kpis_ApegoDestruccion").setText(this.setFormat("2", apegoDestruccion));
				this.byId("kpis_HLDestruccion").setText(this.setFormat("2", parseFloat(this.byId("ptRetenido_HL_Destruccion").getText().replace(/,/g, ""))));
				this.byId("kpis_BloqueadoAlmacen").setText(this.setFormat("2", 100 * parseFloat(this.byId("kpi_ProdBloqueado").getText().replace(/,/g, "")) / parseFloat(this.byId("kpi_HLTotales").getText().replace(/,/g, ""))) + "%");
				this.byId("kpis_AlmDestr").setText(this.setFormat("2", 100 * parseFloat(this.byId("kpis_HLDestruccion").getText().replace(/,/g, "")) / parseFloat(this.byId("kpi_HLTotales").getText().replace(/,/g, ""))));

				this.byId("kpis_HLRiesgo").setText(this.setFormat("2", parseFloat(this.byId("CTHL61-120").getText().replace(/,/g, "")) +
					parseFloat(this.byId("CTHL121-164").getText().replace(/,/g, "")) +
					parseFloat(this.byId("CEXP_HL15-28").getText().replace(/,/g, "")) +
					parseFloat(this.byId("CIMP_HL162-216").getText().replace(/,/g, "")) +
					parseFloat(this.byId("CMOD_HL164-219").getText().replace(/,/g, "")) +
					parseFloat(this.byId("CBA_HL8-22").getText().replace(/,/g, ""))));

				this.byId("kpis_HLFuera").setText(this.setFormat("2", parseFloat(this.byId("CTHLplus164").getText().replace(/,/g, "")) +
					parseFloat(this.byId("CEXP_HL15plus28").getText().replace(/,/g, "")) +
					parseFloat(this.byId("CIMP_HLplus216").getText().replace(/,/g, "")) +
					parseFloat(this.byId("CMOD_HLplus219").getText().replace(/,/g, "")) +
					parseFloat(this.byId("CBA_HLplus22").getText().replace(/,/g, ""))));

			},

			loadGraphic: function (warnPT) {
				//this.SuccessPT=successPT;
				this.WarnPT=warnPT;
				//this.ErrorPT=errorPT;
				const loading = google.charts.load('current', { 'packages': ['corechart'] });
				loading.then(function () {
					//this.drawChartIndiceVida("myHBoxLineChart", "400", "300");
					//this.drawChartStockAgeIndex("myHBoxStockAgeIndex", "400", "300");
					//this.drawChartProductoBloqueado("myHBoxBloqueadoEnAlmacen", "400", "300");
					this.drawChartPTLibre("myHBoxPTLibreEnRiesgo", "400", "300",this.WarnPT);
					/* this.drawChartPTTiempo("myHBoxPTEnTiempo", "400", "300",this.SuccessPT);
					this.drawChartPTFueraEsp("myHBoxPTFueraEsp", "400", "300",this.ErrorPT); */
					//this.drawChartProductoBloqueadoQ("myHBoxBloqueadoQPendienteLiberacion", "400", "300");
				}.bind(this));
			},

			drawChartIndiceVida: function (container, widthh, heightt) {
				let data = google.visualization.arrayToDataTable([
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
					'width': widthh,
					'height': heightt
				};
				// Instantiate and draw our chart, passing in some options.
				let chart;
				try {
					chart = new google.visualization.LineChart(this.getView().byId(container).getDomRef());
					chart.draw(data, options);
				} catch (e) {
					console.error(e);
				}


			},

			drawChartStockAgeIndex: function (container, widthh, heightt) {
				let data = google.visualization.arrayToDataTable([
					['Day', 'Percent', { role: 'style' }],
					['04 Enero', 100, "#102333"],
					['05 Enero', 100, "#21333A"],
					['06 Enero', 100, "#32433B"],
					['07 Enero', 100, "#43533C"],
					['08 Enero', 100, "#54633C"],
					['09 Enero', 100, "#65733C"],
					['10 Enero', 100, "#76833C"],
					['11 Enero', 100, "#87933C"],
					['12 Enero', 100, "#98A33C"],
					['13 Enero', 100, "#A9B33C"],
					['14 Enero', 100, "#BAC33C"],
					['15 Enero', 100, "#CBD33C"],
					['18 Enero', 99.57, "#DCE33C"],
					['19 Enero', 99.57, "#EDF33C"],
					['20 Enero', 99.52, "#FE033C"],
					['21 Enero', 99.49, "#0F133C"],
					['22 Enero', 99.46, "#10233C"]
				]);
				let view = new google.visualization.DataView(data);
				view.setColumns([0, 1, {
					calc: "stringify",
					sourceColumn: 1,
					type: "string",
					role: "annotation"
				}, 2]);
				let options = {
					title: "Enero 2021",
					width: widthh,
					height: heightt,
					bar: { groupWidth: "50%" },
					legend: { position: "none" },
				};
				// Instantiate and draw our chart, passing in some options.
				let chart;
				try {
					chart = new google.visualization.ColumnChart(this.getView().byId(container).getDomRef());
					chart.draw(view, options);
				} catch (e) {
					console.error(e);
				}


			},

			drawChartProductoBloqueado: function (container, widthh, heightt) {
				let data = google.visualization.arrayToDataTable([
					['Month', 'Visitations', { role: 'style' }],
					['BU 2021', 98, "#A87333"],
					['FY 2019', 98.99, "#B9733A"],
					['FY 2020', 99.26, "#CA733B"],
					['YTD 2021', 99.84, "#DB733C"]
				]);
				let options = {
					title: "Producto Bloqueado en Almacén 2020",
					width: widthh,
					height: heightt,
					bar: { groupWidth: "95%" },
					legend: { position: "none" },
				};
				// Instantiate and draw our chart, passing in some options.
				let chart;
				try {
					chart = new google.visualization.ColumnChart(this.getView().byId(container).getDomRef());
					chart.draw(data, options);
				} catch (e) {
					console.error(e);
				}


			},

			drawChartPTLibre: function (container, widthh, heightt,warnData) {
				let arrToTable = [['SKU', 'Cantidad', { role: 'style' }]];
				if(warnData.length > 0){
					for(let i in warnData){
						arrToTable.push([warnData[i].maktx,parseFloat(warnData[i].totalInventario), "#102333"])
					}
				}else{
					arrToTable.push(['', 0, "#102333"]);
				}
				
				let data = google.visualization.arrayToDataTable(arrToTable);
				// let data = google.visualization.arrayToDataTable([
				// 	['SKU', 'Cantidad', { role: 'style' }],
				// 	['VICTORIA BOTE 12PK 24/355 ML CM FRIDGE', 5117, "#102333"],
				// 	['VICTORIA 24/355 ML CT R', 1146, "#21333A"],
				// 	['STELLA ARTOIS BARRIL 12 L', 560, "#32433B"],
				// 	['BARRILITO FAJILLA 24/444 ML CT (CA)', 405, "#43533C"],
				// 	['CORONA DIV 12/940 ML CM GRABADA', 317, "#54633C"],
				// 	['PACIFICO LIGHT 24/355 ML CT', 252, "#65733C"],
				// 	['CUCAPA VALIENTE LOOSE/24/355ML', 84, "#76833C"],
				// 	['CORONA EXTRA CLARA 24/355 ML PROMO TRAD', 43, "#87933C"]
				// ]);
				//data.sort({column: 0, desc: true});
				let view = new google.visualization.DataView(data);
				view.setColumns([0, 1, {
					calc: "stringify",
					sourceColumn: 1,
					type: "string",
					role: "annotation"
				}, 2]);
				let options = {
					title: "PT en riesgo",
					width: widthh,
					height: heightt,
					bar: { groupWidth: "50%" },
					legend: { position: "none" },
				};
				// Instantiate and draw our chart, passing in some options.
				let chart;
				try {
					chart = new google.visualization.ColumnChart(this.getView().byId(container).getDomRef());
					chart.draw(view, options);
				} catch (e) {
					console.error(e);
				}


			},

			drawChartPTTiempo: function (container, widthh, heightt,enTiempoData) {
				let arrToTable = [['SKU', 'Cantidad', { role: 'style' }]];
				if(enTiempoData.length >0){
					for(let i in enTiempoData){
						arrToTable.push([enTiempoData[i].maktx,parseFloat(enTiempoData[i].totalInventario), "#87933C"])
					}
				}else{
					arrToTable.push(['', 0, "#87933C"]);
				}
				
				let data = google.visualization.arrayToDataTable(arrToTable);
				// let data = google.visualization.arrayToDataTable([
				// 	['SKU', 'Cantidad', { role: 'style' }],
				// 	['VICTORIA BOTE 12PK 24/355 ML CM FRIDGE', 5117, "#102333"],
				// 	['VICTORIA 24/355 ML CT R', 1146, "#21333A"],
				// 	['STELLA ARTOIS BARRIL 12 L', 560, "#32433B"],
				// 	['BARRILITO FAJILLA 24/444 ML CT (CA)', 405, "#43533C"],
				// 	['CORONA DIV 12/940 ML CM GRABADA', 317, "#54633C"],
				// 	['PACIFICO LIGHT 24/355 ML CT', 252, "#65733C"],
				// 	['CUCAPA VALIENTE LOOSE/24/355ML', 84, "#76833C"],
				// 	['CORONA EXTRA CLARA 24/355 ML PROMO TRAD', 43, "#87933C"]
				// ]);
				//data.sort({column: 0, desc: true});
				let view = new google.visualization.DataView(data);
				view.setColumns([0, 1, {
					calc: "stringify",
					sourceColumn: 1,
					type: "string",
					role: "annotation"
				}, 2]);
				let options = {
					title: "PT en Tiempo",
					width: widthh,
					height: heightt,
					bar: { groupWidth: "50%" },
					legend: { position: "none" },
				};
				// Instantiate and draw our chart, passing in some options.
				let chart;
				try {
					chart = new google.visualization.ColumnChart(this.getView().byId(container).getDomRef());
					chart.draw(view, options);
				} catch (e) {
					console.error(e);
				}


			},

			drawChartPTFueraEsp: function (container, widthh, heightt,fueraEspData) {
				let arrToTable = [['SKU', 'Cantidad', { role: 'style' }]];
				if(fueraEspData.length >0){
					for(let i in fueraEspData){
						arrToTable.push([fueraEspData[i].maktx,parseFloat(fueraEspData[i].totalInventario), "#43533C"])
					}
				}else{
					arrToTable.push(['', 0, "#43533C"]);
				}
				
				let data = google.visualization.arrayToDataTable(arrToTable);
				// let data = google.visualization.arrayToDataTable([
				// 	['SKU', 'Cantidad', { role: 'style' }],
				// 	['VICTORIA BOTE 12PK 24/355 ML CM FRIDGE', 5117, "#102333"],
				// 	['VICTORIA 24/355 ML CT R', 1146, "#21333A"],
				// 	['STELLA ARTOIS BARRIL 12 L', 560, "#32433B"],
				// 	['BARRILITO FAJILLA 24/444 ML CT (CA)', 405, "#43533C"],
				// 	['CORONA DIV 12/940 ML CM GRABADA', 317, "#54633C"],
				// 	['PACIFICO LIGHT 24/355 ML CT', 252, "#65733C"],
				// 	['CUCAPA VALIENTE LOOSE/24/355ML', 84, "#76833C"],
				// 	['CORONA EXTRA CLARA 24/355 ML PROMO TRAD', 43, "#87933C"]
				// ]);
				//data.sort({column: 0, desc: true});
				let view = new google.visualization.DataView(data);
				view.setColumns([0, 1, {
					calc: "stringify",
					sourceColumn: 1,
					type: "string",
					role: "annotation"
				}, 2]);
				let options = {
					title: "PT Fuera de especificación",
					width: widthh,
					height: heightt,
					bar: { groupWidth: "50%" },
					legend: { position: "none" },
				};
				// Instantiate and draw our chart, passing in some options.
				let chart;
				try {
					chart = new google.visualization.ColumnChart(this.getView().byId(container).getDomRef());
					chart.draw(view, options);
				} catch (e) {
					console.error(e);
				}


			},

			drawChartProductoBloqueadoQ: function (container, widthh, heightt) {
				let data = google.visualization.arrayToDataTable([
					['Producto', 'Percent', { role: 'style' }],
					['CORONA DIV 12/940 ML CT R GRABADA', 19250, "#102333"],
					['CORONA EXTRA AMBAR 24/355 ML CT R', 3684, "#21333A"],
					['CORONA EXTRA CLARA 24/355 ML PROMO TRAD', 17388, "#32433B"],
					['LEON MEGA 12/1.2 L CTR R', 1056, "#43533C"],
					['VICTORIA 24/355 ML CT R', 12852, "#76833C"],
					['VICTORIA MEGA 12/1.2 LCT R USA', 7458, "#54633C"],
					['MODELO AMBAR 12/355 ML CM MAQ', 612, "#65733C"],
					['V FAM 12/940 ML R GRABADA', 462, "#87933C"]
				]);
				let view = new google.visualization.DataView(data);
				view.setColumns([0, 1, {
					calc: "stringify",
					sourceColumn: 1,
					type: "string",
					role: "annotation"
				}, 2]);
				let options = {
					title: "Top Producto bloqueado en Q pendiente de liberacion",
					width: widthh,
					height: heightt,
					bar: { groupWidth: "50%" },
					legend: { position: "none" },
				};
				// Instantiate and draw our chart, passing in some options.
				let chart;
				try {
					chart = new google.visualization.ColumnChart(this.getView().byId(container).getDomRef());
					chart.draw(data, options);
				} catch (e) {
					console.error(e);
				}


			},

			openChart1: function () {
				let oView = this.getView();
				if (!this.byId("oDialogFreeLane")) {
					Fragment.load({
						id: oView.getId(),
						name: "com.bmore.inveweb.view.fragments.Chart",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						oDialog.setTitle(this.byId("card1").getTitle());
						oDialog.open();
						oDialog.addStyleClass("sapUiSizeCompact");
						this.drawChartIndiceVida("chart", "600", "500");
					}.bind(this));
				} else {
					this.byId("oDialogFreeLane").setTitle(this.byId("card1").getTitle());
					this.byId("oDialogFreeLane").open();
					this.drawChartIndiceVida("chart", "600", "500")
					this.byId("oDialogFreeLane").addStyleClass("sapUiSizeCompact");
				}
			},

			openChart2: function () {
				let oView = this.getView();
				if (!this.byId("oDialogFreeLane")) {
					Fragment.load({
						id: oView.getId(),
						name: "com.bmore.inveweb.view.fragments.Chart",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						oDialog.setTitle(this.byId("card2").getTitle());
						oDialog.open();
						oDialog.addStyleClass("sapUiSizeCompact");
						this.drawChartStockAgeIndex("chart", "600", "500");
					}.bind(this));
				} else {
					this.byId("oDialogFreeLane").setTitle(this.byId("card2").getTitle());
					this.byId("oDialogFreeLane").open();
					this.drawChartStockAgeIndex("chart", "600", "500")
					this.byId("oDialogFreeLane").addStyleClass("sapUiSizeCompact");
				}
			},

			openChart3: function () {
				let oView = this.getView();
				if (!this.byId("oDialogFreeLane")) {
					Fragment.load({
						id: oView.getId(),
						name: "com.bmore.inveweb.view.fragments.Chart",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						oDialog.setTitle(this.byId("card3").getTitle());
						oDialog.open();
						oDialog.addStyleClass("sapUiSizeCompact");
						this.drawChartProductoBloqueado("chart", "600", "500");
					}.bind(this));
				} else {
					this.byId("oDialogFreeLane").setTitle(this.byId("card3").getTitle());
					this.byId("oDialogFreeLane").open();
					this.drawChartProductoBloqueado("chart", "600", "500")
					this.byId("oDialogFreeLane").addStyleClass("sapUiSizeCompact");
				}
			},

			openChart4: function () {
				let oView = this.getView();
				if (!this.byId("oDialogFreeLane")) {
					Fragment.load({
						id: oView.getId(),
						name: "com.bmore.inveweb.view.fragments.Chart",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						oDialog.setTitle(this.byId("card4").getTitle());
						oDialog.open();
						oDialog.addStyleClass("sapUiSizeCompact");
						this.drawChartPTLibre("chart", "600", "500",this.WarnPT);
					}.bind(this));
				} else {
					this.byId("oDialogFreeLane").setTitle(this.byId("card4").getTitle());
					this.byId("oDialogFreeLane").open();
					this.drawChartPTLibre("chart", "600", "500",this.WarnPT)
					this.byId("oDialogFreeLane").addStyleClass("sapUiSizeCompact");
				}
			},

			openChart6: function () {
				let oView = this.getView();
				if (!this.byId("oDialogFreeLane")) {
					Fragment.load({
						id: oView.getId(),
						name: "com.bmore.inveweb.view.fragments.Chart",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						oDialog.setTitle(this.byId("card4").getTitle());
						oDialog.open();
						oDialog.addStyleClass("sapUiSizeCompact");
						this.drawChartPTFueraEsp("chart", "600", "500",this.ErrorPT);
					}.bind(this));
				} else {
					this.byId("oDialogFreeLane").setTitle(this.byId("card4").getTitle());
					this.byId("oDialogFreeLane").open();
					this.drawChartPTFueraEsp("chart", "600", "500",this.ErrorPT)
					this.byId("oDialogFreeLane").addStyleClass("sapUiSizeCompact");
				}
			},

			openChart7: function () {
				let oView = this.getView();
				if (!this.byId("oDialogFreeLane")) {
					Fragment.load({
						id: oView.getId(),
						name: "com.bmore.inveweb.view.fragments.Chart",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						oDialog.setTitle(this.byId("card6").getTitle());
						oDialog.open();
						oDialog.addStyleClass("sapUiSizeCompact");
						this.drawChartPTTiempo("chart", "600", "500",this.SuccessPT);
					}.bind(this));
				} else {
					this.byId("oDialogFreeLane").setTitle(this.byId("card6").getTitle());
					this.byId("oDialogFreeLane").open();
					this.drawChartPTTiempo("chart", "600", "500",this.SuccessPT)
					this.byId("oDialogFreeLane").addStyleClass("sapUiSizeCompact");
				}
			},

			openChart5: function () {
				let oView = this.getView();
				if (!this.byId("oDialogFreeLane")) {
					Fragment.load({
						id: oView.getId(),
						name: "com.bmore.inveweb.view.fragments.Chart",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						oDialog.setTitle(this.byId("card5").getTitle());
						oDialog.open();
						oDialog.addStyleClass("sapUiSizeCompact");
						this.drawChartProductoBloqueadoQ("chart", "600", "500");
					}.bind(this));
				} else {
					this.byId("oDialogFreeLane").setTitle(this.byId("card5").getTitle());
					this.byId("oDialogFreeLane").open();
					this.drawChartProductoBloqueadoQ("chart", "600", "500")
					this.byId("oDialogFreeLane").addStyleClass("sapUiSizeCompact");
				}
			},
			_closeChart: function () {
				this.byId("oDialogFreeLane").close();
			},
			
		});
	}
);
