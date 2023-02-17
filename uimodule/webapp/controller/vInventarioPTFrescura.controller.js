sap.ui.define(
	[
		"com/bmore/inveweb/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/FilterType",
		"sap/ui/core/format/DateFormat",
		"sap/ui/model/Filter",
		"sap/ui/model/Sorter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"sap/ui/core/BusyIndicator",
	],
	function (BaseController, JSONModel, FilterType,DateFormat, Filter,Sorter, FilterOperator, MessageToast, MessageBox, BusyIndicator) {
		"use strict";

		return BaseController.extend("com.bmore.inveweb.controller.vInventarioPTFrescura", {
			onInit: function () {
				
			},
			semiInit:async function(){
				if(!this.fromDetalles){//si viene de la panmtalla detalles frescura entonces NO debe eejcutarse "semiInit" para mantener los datos actuales de la pantalla
					this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
					this.SYNC_PRICE = this.roleExists("SYNC_PRICE_FRESCURA");
					if(this.SYNC_PRICE){
						this.byId("precios").setVisible(true);
					}else{
						this.byId("precios").setVisible(false);
					}
					this.showLog=false;
					this.FrescuraModel = new JSONModel({
						Materiales: []
					});
					this.getView().setModel(this.FrescuraModel, "FrescuraModel");
					/* sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--itfHL').setEnabled(false); */
					console.log("init de InventariosPT");
					await this.setBukrsAndWerks();
					if(!this.ADMIN_ROLE){
						this.asyncLoadFrescura();
					}
					
					
				}
				this.fromDetalles=false;
				
			},
			setBukrsAndWerks: async function(){
				await this.loadSocieties(this.byId("bukrs"));
				if(!this.ADMIN_ROLE){
		
					let bukrs = this.getBukrs();
					this.byId("bukrs").setSelectedKey(bukrs);
					this.byId("bukrs").setEnabled(false);
					await this.loadWerks();
					let werks = this.getWerks();
					this.byId("werks").setSelectedKey(werks);
					this.byId("werks").setEnabled(false);
				}else{
		
					this.byId("bukrs").setSelectedKey(null);
					this.byId("bukrs").setEnabled(true);
					this.byId("werks").removeAllItems();
					this.byId("werks").destroyItems();
					this.byId("werks").setSelectedKey(null);
					this.byId("werks").setEnabled(true);
				}
				
			},

		
			loadWerks: async function(){
				this.FrescuraModel.setProperty("/Materiales", []);
				this.byId("btnRefresh").setEnabled(false);
				//this.eraseNotification();
		
				let bukrsBean = {
					bukrs : this.byId('bukrs').getSelectedKey()
				}
		
				const request = {
					tokenObject: null,
					lsObject:bukrsBean
				};
		
				const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);
		
				if(json){
					let selectWerks = this.byId("werks");
					selectWerks.removeAllItems();
					selectWerks.destroyItems();
					selectWerks.setSelectedKey(null);
					
					let data = json.lsObject;	
					
		
					if(data.length!=0){
		
						this.fillWerks(data,selectWerks);
		
					}else{
		
						MessageBox.show('La "Sociedad" seleccionada no cuenta con centros asociados',
								MessageBox.Icon.ERROR, "Sin centros");
					}	
					this.byId("sync").setEnabled(false);
					this.byId("precios").setEnabled(false);
				}
			},
			refresh:function(){
				if(!this.ADMIN_ROLE){// NO es admin por lo que recargamos la tabla con datos de sociedad y centro de los combos ya definimos por el rol del usuario
					this.asyncLoadFrescura();
				}else{//es admin por lo que recargamos la tabla mandando el centro elegido por el usuario admin
					this.getFrescuraByWerk();
				}
				
			},
			getFrescuraByWerk: async function(){
				let bukrs = this.byId('bukrs').getSelectedKey();
				let werks = this.byId('werks').getSelectedKey();
				if(bukrs == undefined || bukrs == "" || werks == undefined || werks == ""){
					MessageBox.show('Favor de seleccionar "Sociedad" y "Centro"',
					MessageBox.Icon.ERROR, "Información incompleta");
					this.byId("sync").setEnabled(false);
					this.byId("precios").setEnabled(false);
					this.byId("btnRefresh").setEnabled(false);
					return;
				}
				this.byId("btnRefresh").setEnabled(true);
				const request = {
					tokenObject: null,
					lsObject: werks
				  };
				BusyIndicator.show(0);
				try {
					let data = await this.loadFrescura(request);
					console.log("[loadFrescura] modelFrescura", data);
					data.forEach(element => {
						if(element.status == "Error"){
							console.log("Ir a back")
						}
					});
					this.FrescuraModel.setProperty("/Materiales", data);
					this.byId("sync").setEnabled(true);
					this.byId("precios").setEnabled(true);
				} catch (e) {
					console.error("[loadFrescura] e", e);
					MessageBox.show(e, MessageBox.Icon.ERROR, "Error [loadFrescura]");
				}
				BusyIndicator.hide();
			},

			asyncLoadFrescura: async function () {
				BusyIndicator.show(0);
				try {
					const request = {
						tokenObject: null,
						lsObject: this.byId('werks').getSelectedKey()
					  };
					let data = await this.loadFrescura(request);
					this.byId("btnRefresh").setEnabled(true);
					console.log("[loadFrescura] modelFrescura", data);
					data.forEach(element => {
						if(element.status == "Error"){
							console.log("Ir a back")
						}
					});
					this.FrescuraModel.setProperty("/Materiales", data);
					this.byId("sync").setEnabled(true);
					this.byId("precios").setEnabled(true);
				} catch (e) {
					console.error("[loadFrescura] e", e);
					MessageBox.show(e, MessageBox.Icon.ERROR, "Error [loadFrescura]");
				}
				BusyIndicator.hide();

			},

			loadFrescura: async function (request) {
				console.log("request",request);
				const json = await this.execService(InveServices.GET_FRESCURA,request,"loadFrescura",this.showLog);
				if(json){
					/* sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vHighLightFrescura').getController().
					getCanalesInventario(json.lsObject.listCanalFrescura,
					json.lsObject.totalEnTiempo,json.lsObject.totalEnRiesgo,json.lsObject.totalFueraEsp,
							json.lsObject.totalEnTiempoHL,json.lsObject.totalEnRiesgoHL,json.lsObject.totalFueraEspHL); */
							
				let modelData = json.lsObject.listFrescura;
				let expoLibrePlus14 = 0;
				let librePlus20 = 0;
				let totalLockedHL = 0;
				let HL_FueraFrescuera = 0;
				let sumTotalHL = 0;
				let sumCSPEM = 0;
				let sumCINSM = 0;
				let liberadosDestruccionMenor30 = 0;
				let liberadosDestruccionMayor30 = 0;
				let vigentes = 0;
				let destruccion = 0;
				let apegoDestruccion = 0;
				let HLDestruccion = 0;
				
				for(let i in modelData){
					/* 
					totalLockedHL += parseFloat(modelData[i].lockedHL);
					sumTotalHL += parseFloat(modelData[i].totalHL);
					let cspem = parseFloat(modelData[i].cspem);
					if(cspem > 0){
						sumCSPEM += cspem;
					}
				
					let cinsm = parseFloat(modelData[i].cinsm);
					if(cinsm > 0){
						sumCINSM += cinsm;
					} */
					
					if(modelData[i].detailsFrescura){
						if(modelData[i].detailsFrescura.releaseDays < 30 && modelData[i].detailsFrescura.useDecision == "Destrucción"){
							liberadosDestruccionMenor30++;
						}
						if(modelData[i].detailsFrescura.releaseDays > 30 && modelData[i].detailsFrescura.useDecision == "Destrucción"){
							liberadosDestruccionMayor30++;
						}
						
						if(modelData[i].detailsFrescura.useDecision == "Pendiente"){
							vigentes++;
						}
						if(modelData[i].detailsFrescura.useDecision == "Destrucción"){
							destruccion++;
							HLDestruccion += modelData[i].totalHL;
						}
					}
					
					/* if(parseInt(modelData[i].frescura) >= 14 && modelData[i].canal == "Exportacion"){
						expoLibrePlus14 += (parseFloat(modelData[i].totalHL) - parseFloat(modelData[i].lockedHL));
					}
					if(parseInt(modelData[i].frescura) >= 21){
						librePlus20 += (parseFloat(modelData[i].totalHL) - parseFloat(modelData[i].lockedHL));
					}
					if(modelData[i].canal == "Tradicional" && parseInt(modelData[i].frescura) >= 164){
						HL_FueraFrescuera += (parseFloat(modelData[i].totalHL))
					}
					if(modelData[i].canal == "Exportacion" && parseInt(modelData[i].frescura) >= 28){
						HL_FueraFrescuera += (parseFloat(modelData[i].totalHL))
					}
					if(modelData[i].canal == "Importacion" && parseInt(modelData[i].frescura) >= 162){
						HL_FueraFrescuera += (parseFloat(modelData[i].totalHL))
					}
					if(modelData[i].canal == "Barril Acero" && parseInt(modelData[i].frescura) >= 27){
						HL_FueraFrescuera += (parseFloat(modelData[i].totalHL))
					} */
					
					modelData[i].stprs = "$"+this.setFormat("2",parseFloat(modelData[i].stprs));
					if(modelData[i].statusPolitica == "EN TIEMPO"){
						modelData[i].status = "Success"
					}
					if(modelData[i].statusPolitica == "EN RIESGO"){
						modelData[i].status = "Warning"
					}
					if(modelData[i].statusPolitica == "FUERA DE ESP."){
						modelData[i].status = "Error"
					}
					if(modelData[i].statusPolitica == "PÉRDIDA"){
						modelData[i].status = "Information"
					}

				}
				let v = liberadosDestruccionMayor30/destruccion;
				if(isNaN(v)){
					apegoDestruccion =  0;
				}else{
					apegoDestruccion =  v;
				}
				
				/* sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vHighLightFrescura').getController().
					calculateKPI(expoLibrePlus14,librePlus20,totalLockedHL,HL_FueraFrescuera,sumTotalHL,sumCSPEM,sumCINSM,
						liberadosDestruccionMenor30,liberadosDestruccionMayor30,vigentes,apegoDestruccion,HLDestruccion); */
						/* sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--itfHL').setEnabled(true);	 */
				if(modelData && modelData.length > 0){
					this.byId("btnExcel").setEnabled(true);
				}else{
					this.byId("btnExcel").setEnabled(false);
				}

				return modelData;
				}
				
			
			},
			onQuickFilter: function (oEvent) {
				if(oEvent.getParameter("selectedKey") == "e"){
					this.byId("iconTabBar").setExpanded(true);
					this.byId("frescura_table").getBinding("items").filter(null);
					return;
				}
				if(oEvent.getParameter("selectedKey") == "SINCRONIZAR"){
					this.byId("iconTabBar").setExpanded(true);
					this._syncMCHB();
					return;
				}
				if(oEvent.getParameter("selectedKey") == "PRECIOS"){
					this.byId("iconTabBar").setExpanded(true);
					this._syncPrecios();
					return;
				}
				if(oEvent.getParameter("selectedKey") == "Fuera De Esp"){
					this.byId("ColumDecision").setVisible(true);
				}else{
					this.byId("ColumDecision").setVisible(false);
				}
				let oBinding = this.byId("frescura_table").getBinding("items");
				let oFilterSearch = new Filter(
					"statusPolitica",
					FilterOperator.Contains,
					oEvent.getParameter("selectedKey")
				);
				oBinding.filter(oFilterSearch);
			},
			_onSearch: function (oEvent) {
				let sQuery = oEvent.getSource().getValue();
				let oFilter = new Filter({
					filters: [
						new Filter("matnr", FilterOperator.Contains, sQuery),
						new Filter("mktx", FilterOperator.Contains, sQuery),
						new Filter("charg", FilterOperator.Contains, sQuery),
						new Filter("fechaLote", FilterOperator.Contains, sQuery)
					],
					and: false
				});
				var oBinding = this.byId("frescura_table").getBinding("items");
				oBinding.filter(oFilter, FilterType.Application);
			},
			handleSortDescending: function (bDescending) {
				const oBinding = this.getView().byId("frescura_table").getBinding("items");
				const dateformat = DateFormat.getDateTimeInstance({
					pattern : "dd/MM/YYYY"
					});
				let oSorter = new Sorter('fechaLote', bDescending);
				oSorter.fnCompare = function (value1, value2) {
					let date2 = dateformat.parse(value2);
					let date1 = dateformat.parse(value1);
					value1 = date1.getTime();
					value2 = date2.getTime();
					if (value1 < value2) return -1;
					if (value1 == value2) return 0;
					if (value1 > value2) return 1;
				};
				// update sort order of binding 
				oBinding.sort(oSorter);
			},
			handleSortAscendeing: function (bDescending) {
				const oBinding = this.getView().byId("frescura_table").getBinding("items");
				const dateformat = DateFormat.getDateTimeInstance({
					pattern : "dd/MM/YYYY"
					});
				let oSorter = new Sorter('fechaLote', bDescending);
				oSorter.fnCompare = function (value1, value2) {
					let date2 = dateformat.parse(value2);
					let date1 = dateformat.parse(value1);
					value1 = date1.getTime();
					value2 = date2.getTime();
					if (value1 < value2) return 1;
					if (value1 == value2) return 0;
					if (value1 > value2) return -1;
				};
				// update sort order of binding 
				oBinding.sort(oSorter);
			},
			clearAllSortings : function() {
				const oBinding = this.getView().byId("frescura_table").getBinding("items");
				oBinding.sort(null);
			},

			_selectRowTable: function (oEvent) {
				
				BusyIndicator.show(0);

				let sPath = oEvent.getParameters().listItem.oBindingContexts.FrescuraModel.sPath;
				let index = sPath.split("/");
				let indice = parseInt(index[2]);
				let row = oEvent.getParameters().listItem.oBindingContexts.FrescuraModel.oModel.oData.Materiales[indice];
			
				//console.log("row original", row);
		
				this.loadvDetallesFrescura(row,indice);
			},

			loadvDetallesFrescura: function (row,indice) {
				
				this.byId("frescura_table").removeSelections(true);

				this.getView().getController().row = row;
				this.getView().getController().indice = indice;
				this.navTo("vDetallesFrescura");
			},
			
			setDetailFromDetailView: function(index,details){
				
				let data = this.getView().getModel("FrescuraModel").getData().Materiales;

			data[index].detailsFrescura = details;
			this.FrescuraModel.setProperty("/Materiales", data);
			console.log("data[index]",data[index]);
			},
			
			_syncMCHB: function(){
				MessageBox.warning("Al sincronizar se borrará la información actual de Inventarios PT para el centro "+this.byId('werks').getSelectedKey()+"\n ¿Desea continuar?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction == "OK") {
						try{
							BusyIndicator.show(0);
							 MessageToast.show("Ejecutando sincronización frescura para centro "+this.byId('werks').getSelectedKey()+"...");
							 const request = {
								tokenObject: null,
								lsObject: this.byId('werks').getSelectedKey()
							  };
							this.wrapExtractMCHB(request);
							
						}catch(e){
							MessageBox.show(e.toString(), MessageBox.Icon.ERROR, "Sincronización");
						}
						
                       
                    } else {
                        MessageToast.show("Operación cancelada");
                    }
                }.bind(this)
           	 });
			},
			_syncPrecios: function(){
				MessageBox.warning("Al sincronizar se borrará la información actual de precios de materiales PT para el centro "+this.byId('werks').getSelectedKey()+"\n ¿Desea continuar?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction == "OK") {
						try{
							BusyIndicator.show(0);
							 MessageToast.show("Ejecutando sincronización de precios frescura para centro "+this.byId('werks').getSelectedKey()+"...");
							 const request = {
								tokenObject: null,
								lsObject: this.byId('werks').getSelectedKey()
							  };
							this.wrapExtractPrecios(request);
							
						}catch(e){
							MessageBox.show(e.toString(), MessageBox.Icon.ERROR, "Sincronización de Precios");
						}
						
                       
                    } else {
                        MessageToast.show("Operación cancelada");
                    }
                }.bind(this)
           	 });
			},
			
			wrapExtractMCHB: async function(request){
				await this.extractManualFromSAP_MCHB(request);
				this.asyncLoadFrescura();
			},
			wrapExtractPrecios: async function(request){
				await this.extractMBEW_Frescura_FromSAP(request);
				this.asyncLoadFrescura();
			},
			
			extractManualFromSAP_MCHB: async function (request) {
				const json = await this.execService(InveServices.EXTRACT_MCHB,request,"extractManualFromSAP_MCHB",this.showLog);
				if(json){
					console.log("Result extractManualFromSAP_MCHB",json.abstractResult.resultMsgAbs);
				}
				
			},
			extractMBEW_Frescura_FromSAP: async function (request) {
				const json = await this.execService(InveServices.EXTRACT_MBEW_FRESCURA,request,"extractMBEW_Frescura_FromSAP",this.showLog);
				if(json){
					console.log("Result extractMBEW_Frescura_FromSAP",json.abstractResult.resultMsgAbs);
				}
				
			},
			getPT_forGraph:function(){
				let modelData = this.getView().getModel("FrescuraModel").getData().Materiales;
				//let listSuccess=[];
				let listWarning=[];
				//let listError=[];
				for(let i in modelData){
					// if(modelData[i].status == "Success"){
					// 	listSuccess.push(modelData[i]);
					// 	continue;
					// }
					if(modelData[i].status == "Warning"){
						listWarning.push(modelData[i]);
						continue;
					}
					// if(modelData[i].status == "Error"){
					// 	listError.push(modelData[i]);
					// 	continue;
					// }
				}
				listWarning.sort((a, b) => parseFloat(b.totalInventario) > parseFloat(a.totalInventario) && 1 || -1);//ordenamiento descendiente
				sap.ui.getCore().byId('container-inveweb---vDashboardFrescura--vHighLightFrescura').getController().loadGraphic(listWarning);
			},
			exportExcel:function(){
				let model = this.byId("frescura_table").getModel("FrescuraModel").getData().Materiales;
				let reformattedModel;
				reformattedModel = model.map(function(obj){
					obj["SKU"] = obj["matnr"];
					obj["Descripción"] = obj["maktx"];
					obj["U.M.B."] = obj["umb"];
					obj["Lote"] = obj["charg"];
					obj["Total Inventario"] = obj["totalInventario"];
					obj["Valor"] = obj["stprs"];
					obj["Fecha Lote"] = obj["fechaLote"];
					obj["Frescura"] = obj["frescura"];
					obj["Estatus Politica"] = obj["statusPolitica"];
					obj["Decision Empleo"] = obj["useDecision"];
					obj["Canal"] = obj["canal"];
					
					//borrando atributos para que no se muestren en excel
					delete obj["matnr"];
					delete obj["maktx"];
					delete obj["umb"];
					delete obj["charg"];
					delete obj["totalInventario"];
					delete obj["stprs"];
					delete obj["fechaLote"];
					delete obj["frescura"];
					delete obj["statusPolitica"];
					delete obj["status"];
					delete obj["useDecision"];
					//campos que no se mapean en excel
					delete obj["canal"];
					delete obj["cinsm"];
					delete obj["clabs"];
					delete obj["cspem"];
					delete obj["hl"];
					delete obj["lgort"];
					delete obj["lockedHL"];
					delete obj["peinh"];
					delete obj["priceLockedHL"];
					delete obj["totalHL"];
					delete obj["typeMatnr"];
					delete obj["werks"];
					

					return obj;
				});

				let ws = XLSX.utils.json_to_sheet(reformattedModel);
				let wb = XLSX.utils.book_new();
				let bukrs = this.byId("bukrs").getSelectedKey();
				let werks = this.byId("werks").getSelectedKey();
				XLSX.utils.book_append_sheet(wb, ws, bukrs+"-"+werks);
				XLSX.writeFile(wb, "Frescura Inventario de PT - Soc. "+bukrs+" Centro "+werks+" - "+this.formatDate(new Date())+".xlsx");
				
			}
		});
	});
