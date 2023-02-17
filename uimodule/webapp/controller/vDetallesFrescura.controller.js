sap.ui.define(
	[
		"./BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/UIComponent",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"sap/ui/core/BusyIndicator",
	],
	function (BaseController, JSONModel, UIComponent, Filter, FilterOperator, MessageToast, MessageBox, BusyIndicator) {
		"use strict";
		return BaseController.extend("com.bmore.inveweb.controller.vDetallesFrescura", {
			onInit: function () {
				console.log("vDetallesFrescura");

				this.getView().addDelegate({
				
					onBeforeShow: function(evt) { 
						BusyIndicator.hide();				
						this.setData(sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vInventarioPTFrescura').getController().row,
						sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vInventarioPTFrescura').getController().indice);			
					}.bind(this)
				});
			},
			setData: function (row,indice) {
				this.indice = indice;
				this.FrescuraDetail = new JSONModel(row);
				this.getView().setModel(this.FrescuraDetail);
				console.log(row);
				/*Se requiere el calculo de la barra para todos los casos */
				console.log((1 - (row.frescura / 164)) * 100)
				if (1 - (row.frescura / 164) > 1) {
					this.byId("ProgressIndicator").setPercentValue("0")
				} else {
					this.byId("ProgressIndicator").setPercentValue((1 - (row.frescura / 164)) * 100)
				}
				this.row = row;
				this.asyncGetDatail(row);
			},
			returnAction: function () {
				sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vInventarioPTFrescura').getController().fromDetalles = true;
				this.onNavBack();
			},
			asyncGetDatail: function (row) {
				try {
					if(row.detailsFrescura){
						this.byId("btnDelete").setVisible(true);
						let data = row.detailsFrescura;
						
					this.byId("cause").setValue(data.cause);
					this.byId("generalReason").setValue(data.generalReason);
					this.byId("lockDate").setValue(data.lockDate);
					this.byId("releaseDate").setValue(data.releaseDate);
					this.byId("desision").setSelectedKey(data.useDecision);
					this.byId("lockDays").setText(data.lockDays);
					this.byId("releaseDays").setText(data.releaseDays);
					this.byId("comments").setValue(data.comments);
					this.byId("slaClasification").setValue(data.slaClasification);
					console.log("[getDatail] detailFrescura", data);
					
					}else{
						this.byId("btnDelete").setVisible(false);
						this.byId("cause").setValue();
						this.byId("generalReason").setValue();
						this.byId("lockDate").setValue();
						this.byId("releaseDate").setValue();
						this.byId("desision").setSelectedKey();
						this.byId("lockDays").setText();
						this.byId("releaseDays").setText();
						this.byId("comments").setValue();
						this.byId("slaClasification").setValue();
					}
					BusyIndicator.hide();

				} catch (e) {
					console.error("[asyncGetDatail] error", e);
					MessageBox.show(e.toString(), MessageBox.Icon.ERROR, "Error");
					BusyIndicator.hide();
				}
				

			},
			asyncSetDatail: async function () {
				const details = {
					"matnr" : this.row.matnr,
					"werks" : this.row.werks,
					"charg" : this.row.charg,
					"cause" : this.byId("cause").getValue(),
					"generalReason" : this.byId("generalReason").getValue(),
					"lockDate" : this.byId("lockDate").getValue(),
					"releaseDate" : this.byId("releaseDate").getValue(),
					"useDecision" : this.byId("desision").getValue(),
					"lockDays" : this.byId("lockDays").getText(),
					"releaseDays" : this.byId("releaseDays").getText(),
					"comments" : this.byId("comments").getValue(),
					"slaClasification" : this.byId("slaClasification").getValue(),
					"country" : "",
				}
				console.log(details);
				BusyIndicator.show(0);
				try {
					await this.setDetail(details);
					this.byId("btnDelete").setVisible(true);
					this.setObjectDetail(details);
				} catch (e) {
					console.error("[getDatail] e", e);
					MessageBox.show(e, MessageBox.Icon.ERROR, "Error [getDetail]");
				}
				BusyIndicator.hide();

			},
			
			confirmDelete: function(){
				 MessageBox.warning("¿Borrar detalle del material "+this.row.matnr+" lote "+ this.row.charg+"?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction == "OK") {
                        this.asyncDeleteDetail();
                    } else {
                        MessageToast.show("Operación cancelada");
                    }
                }.bind(this)
            });
			},
			
			asyncDeleteDetail: async function(){
				
				let details = {
					"matnr" : this.row.matnr,
					"werks" : this.row.werks,
					"charg" : this.row.charg,
				}
				console.log(details);
				BusyIndicator.show(0);
				try {
					await this.deleteDetail(details);
					this.byId("btnDelete").setVisible(false);
					this.byId("cause").setValue();
					this.byId("generalReason").setValue();
					this.byId("lockDate").setValue();
					this.byId("releaseDate").setValue();
					this.byId("desision").setSelectedKey();
					this.byId("lockDays").setText();
					this.byId("releaseDays").setText();
					this.byId("comments").setValue();
					this.byId("slaClasification").setValue();
				} catch (e) {
					console.error("[deleteDetail] e", e);
					MessageBox.show(e, MessageBox.Icon.ERROR, "Error [deleteDetail]");
				}
				BusyIndicator.hide();
			},
			
			deleteDetail: async function (details) {
				const request ={
					tokenObject : null,
					lsObject:details
				} 
				const json = await this.execService(InveServices.DELETE_DETAILS_FRESCURA,request,"deleteDetail",this.showLog);
				if(json){
					return json.lsObject;
				}
			},
			setDetail: async function (details) {
				const request ={
					tokenObject : null,
					lsObject:[details]
				} 
				const json = await this.execService(InveServices.SET_DETAILS_FRESCURA,request,"setDetail",this.showLog);
				if(json){
					return json.lsObject;
				}
			},
			releaseDays: function(oEvent){
				//considerar el formato YYYYMMdd
				let cadena = String(oEvent.getSource().getValue());
				let date = cadena.substring(0, 4);
				date+="-"+ cadena.substring(4, 6);
				date+="-"+ cadena.substring(6, 8);
				
				let fechaRelease = new Date(date);
				let fechaActual = new Date()
						
				let restaRelease = fechaRelease.getTime() - fechaActual.getTime();
				this.byId("releaseDays").setText(String(Math.round(restaRelease/ (1000*60*60*24)) +1));
			},
			
			lockDays: function(oEvent){
				let cadena = oEvent.getSource().getValue();
				
				let date = cadena.substring(0, 4);
				date+="-"+ cadena.substring(4, 6);
				date+="-"+ cadena.substring(6, 8);
				
				let fechaLock = new Date(date);
				let fechaActual = new Date();

				let restalock = fechaActual.getTime() - fechaLock.getTime();
				this.byId("lockDays").setText(String(Math.round(restalock/ (1000*60*60*24)) -1));
						
			},
			
			setObjectDetail: function(data){
					console.log("[setObjectDetail] detailFrescura", data);
					sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vInventarioPTFrescura').getController().setDetailFromDetailView(this.indice,data);
			}

		});
	});
